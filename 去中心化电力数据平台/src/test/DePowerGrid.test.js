const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DePowerGrid 智能合约测试", function () {
  let dePowerGrid;
  let mockPriceFeed;
  let owner;
  let deviceOwner;
  let maintainer;
  let buyer;

  beforeEach(async function () {
    // 获取测试账户
    [owner, deviceOwner, maintainer, buyer] = await ethers.getSigners();

    // 部署Mock价格预言机
    const MockV3Aggregator = await ethers.getContractFactory("MockV3Aggregator");
    mockPriceFeed = await MockV3Aggregator.deploy(
      8,           // decimals
      200000000000 // initial price: $2000
    );
    await mockPriceFeed.deployed();

    // 部署主合约
    const DePowerGrid = await ethers.getContractFactory("DePowerGrid");
    dePowerGrid = await DePowerGrid.deploy(mockPriceFeed.address);
    await dePowerGrid.deployed();

    // 授权维修人员
    await dePowerGrid.authorizeMaintainer(maintainer.address, true);
  });

  describe("📝 设备注册", function () {
    it("应该成功注册新设备", async function () {
      const tx = await dePowerGrid.connect(deviceOwner).registerDevice(
        "DG-001",
        "Solar Panel",
        5000,
        maintainer.address
      );

      // 检查事件
      await expect(tx)
        .to.emit(dePowerGrid, "DeviceRegistered")
        .withArgs("DG-001", deviceOwner.address, "Solar Panel", 5000);

      // 检查设备信息
      const [owner, type, capacity, , healthScore, , isActive] = 
        await dePowerGrid.getDeviceInfo("DG-001");
      
      expect(owner).to.equal(deviceOwner.address);
      expect(type).to.equal("Solar Panel");
      expect(capacity).to.equal(5000);
      expect(healthScore).to.equal(100); // 新设备健康度100%
      expect(isActive).to.be.true;
    });

    it("不应该重复注册相同设备", async function () {
      await dePowerGrid.connect(deviceOwner).registerDevice(
        "DG-001",
        "Solar Panel",
        5000,
        maintainer.address
      );

      await expect(
        dePowerGrid.connect(deviceOwner).registerDevice(
          "DG-001",
          "Wind Turbine",
          3000,
          maintainer.address
        )
      ).to.be.revertedWith("Device already registered");
    });

    it("应该增加设备计数", async function () {
      const countBefore = await dePowerGrid.deviceCount();
      
      await dePowerGrid.connect(deviceOwner).registerDevice(
        "DG-001",
        "Solar Panel",
        5000,
        maintainer.address
      );

      const countAfter = await dePowerGrid.deviceCount();
      expect(countAfter).to.equal(countBefore.add(1));
    });
  });

  describe("📊 数据上报", function () {
    beforeEach(async function () {
      // 先注册设备
      await dePowerGrid.connect(deviceOwner).registerDevice(
        "DG-001",
        "Solar Panel",
        5000,
        maintainer.address
      );
    });

    it("应该成功提交设备数据", async function () {
      const dataHash = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("test data")
      );

      const tx = await dePowerGrid.connect(deviceOwner).submitDeviceData(
        "DG-001",
        100,  // kWh
        230,  // voltage
        10,   // current
        "encrypted_aes_key",
        "ipfs_image_hash",
        "ipfs_gps_hash",
        dataHash
      );

      await expect(tx)
        .to.emit(dePowerGrid, "DataSubmitted")
        .withArgs("DG-001", await ethers.provider.getBlockNumber(), 100, dataHash);
    });

    it("只有设备所有者可以提交数据", async function () {
      const dataHash = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("test data")
      );

      await expect(
        dePowerGrid.connect(buyer).submitDeviceData(
          "DG-001",
          100,
          230,
          10,
          "encrypted_aes_key",
          "ipfs_image_hash",
          "ipfs_gps_hash",
          dataHash
        )
      ).to.be.revertedWith("Not device owner");
    });

    it("应该累计发电量", async function () {
      const dataHash = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("test data")
      );

      // 第一次上报
      await dePowerGrid.connect(deviceOwner).submitDeviceData(
        "DG-001", 100, 230, 10,
        "encrypted_aes_key", "ipfs_image_hash", "ipfs_gps_hash", dataHash
      );

      // 第二次上报
      await dePowerGrid.connect(deviceOwner).submitDeviceData(
        "DG-001", 150, 230, 10,
        "encrypted_aes_key", "ipfs_image_hash", "ipfs_gps_hash", dataHash
      );

      const [, , , totalProduction] = await dePowerGrid.getDeviceInfo("DG-001");
      expect(totalProduction).to.equal(250); // 100 + 150
    });
  });

  describe("⚡ P2P能源交易", function () {
    beforeEach(async function () {
      await dePowerGrid.connect(deviceOwner).registerDevice(
        "DG-001",
        "Solar Panel",
        5000,
        maintainer.address
      );
    });

    it("应该成功创建出售订单", async function () {
      const pricePerKWh = ethers.utils.parseEther("0.0001"); // 0.0001 ETH per kWh
      
      const tx = await dePowerGrid.connect(deviceOwner).createSellOrder(
        "DG-001",
        10,  // 10 kWh
        pricePerKWh
      );

      await expect(tx)
        .to.emit(dePowerGrid, "OrderCreated");

      const order = await dePowerGrid.energyOrders(1);
      expect(order.seller).to.equal(deviceOwner.address);
      expect(order.kWhAmount).to.equal(10);
      expect(order.pricePerKWh).to.equal(pricePerKWh);
    });

    it("应该成功完成订单", async function () {
      const pricePerKWh = ethers.utils.parseEther("0.0001");
      
      // 创建订单
      await dePowerGrid.connect(deviceOwner).createSellOrder(
        "DG-001",
        10,
        pricePerKWh
      );

      const order = await dePowerGrid.energyOrders(1);
      const totalPrice = order.totalPrice;

      // 买家购买
      const tx = await dePowerGrid.connect(buyer).fulfillOrder(1, {
        value: totalPrice
      });

      await expect(tx)
        .to.emit(dePowerGrid, "OrderFulfilled")
        .withArgs(1, buyer.address, deviceOwner.address, totalPrice);

      // 检查订单状态
      const updatedOrder = await dePowerGrid.energyOrders(1);
      expect(updatedOrder.buyer).to.equal(buyer.address);
      expect(updatedOrder.status).to.equal(1); // Completed
    });

    it("不应该购买自己的订单", async function () {
      const pricePerKWh = ethers.utils.parseEther("0.0001");
      
      await dePowerGrid.connect(deviceOwner).createSellOrder(
        "DG-001",
        10,
        pricePerKWh
      );

      const order = await dePowerGrid.energyOrders(1);

      await expect(
        dePowerGrid.connect(deviceOwner).fulfillOrder(1, {
          value: order.totalPrice
        })
      ).to.be.revertedWith("Cannot buy own order");
    });
  });

  describe("🔧 预测性维护", function () {
    beforeEach(async function () {
      await dePowerGrid.connect(deviceOwner).registerDevice(
        "DG-001",
        "Solar Panel",
        5000,
        maintainer.address
      );
    });

    it("应该在健康度低于阈值时触发维护", async function () {
      // 提交异常数据，降低健康度
      const dataHash = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("test data")
      );

      // 多次提交异常电压数据
      for (let i = 0; i < 5; i++) {
        await dePowerGrid.connect(deviceOwner).submitDeviceData(
          "DG-001",
          100,
          200,  // 异常电压（正常220-240）
          10,
          "encrypted_aes_key",
          "ipfs_image_hash",
          "ipfs_gps_hash",
          dataHash
        );
      }

      // 检查是否触发了维护
      const maintenanceCount = await dePowerGrid.maintenanceCount();
      expect(maintenanceCount).to.be.gt(0);
    });

    it("维修人员应该能提交维护证明", async function () {
      // 手动创建维护记录（实际会由健康度触发）
      const dataHash = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("test data")
      );

      // 提交异常数据触发维护
      for (let i = 0; i < 5; i++) {
        await dePowerGrid.connect(deviceOwner).submitDeviceData(
          "DG-001",
          100,
          200,
          10,
          "encrypted_aes_key",
          "ipfs_image_hash",
          "ipfs_gps_hash",
          dataHash
        );
      }

      const proofHash = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("maintenance proof")
      );

      const tx = await dePowerGrid.connect(maintainer).submitMaintenanceProof(
        1,
        "ipfs_proof_hash",
        proofHash
      );

      await expect(tx)
        .to.emit(dePowerGrid, "MaintenanceCompleted");

      // 验证证明
      const isValid = await dePowerGrid.verifyMaintenanceProof(1, proofHash);
      expect(isValid).to.be.true;
    });

    it("非授权人员不能提交维护证明", async function () {
      const proofHash = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("maintenance proof")
      );

      await expect(
        dePowerGrid.connect(buyer).submitMaintenanceProof(
          1,
          "ipfs_proof_hash",
          proofHash
        )
      ).to.be.revertedWith("Not authorized maintainer");
    });
  });

  describe("📈 Chainlink预言机", function () {
    it("应该能获取价格", async function () {
      const price = await dePowerGrid.getLatestPrice();
      expect(price).to.equal(200000000000); // $2000
    });

    it("应该正确转换USD到ETH", async function () {
      // $1.00 = 100美分
      const ethAmount = await dePowerGrid.convertUSDToETH(100);
      
      // 在$2000的ETH价格下，$1 = 0.0005 ETH
      const expected = ethers.utils.parseEther("0.0005");
      expect(ethAmount).to.equal(expected);
    });
  });

  describe("👤 权限管理", function () {
    it("只有owner可以授权维修人员", async function () {
      await expect(
        dePowerGrid.connect(deviceOwner).authorizeMaintainer(
          buyer.address,
          true
        )
      ).to.be.revertedWith("Only contract owner");
    });

    it("应该能批量授权维修人员", async function () {
      const maintainers = [
        buyer.address,
        deviceOwner.address
      ];

      await dePowerGrid.batchAuthorizeMaintainers(maintainers);

      expect(await dePowerGrid.authorizedMaintainers(buyer.address)).to.be.true;
      expect(await dePowerGrid.authorizedMaintainers(deviceOwner.address)).to.be.true;
    });
  });

  describe("💰 资金管理", function () {
    it("应该能接收ETH", async function () {
      const amount = ethers.utils.parseEther("1.0");
      
      await owner.sendTransaction({
        to: dePowerGrid.address,
        value: amount
      });

      const balance = await dePowerGrid.getBalance();
      expect(balance).to.equal(amount);
    });

    it("只有owner可以提取资金", async function () {
      const amount = ethers.utils.parseEther("1.0");
      
      await owner.sendTransaction({
        to: dePowerGrid.address,
        value: amount
      });

      await expect(
        dePowerGrid.connect(buyer).withdraw()
      ).to.be.revertedWith("Only contract owner");
    });
  });
});
