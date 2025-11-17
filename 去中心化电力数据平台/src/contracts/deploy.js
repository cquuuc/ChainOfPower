/**
 * DePowerGrid 智能合约部署脚本
 * 使用 Hardhat 或 Truffle 部署
 */

const hre = require("hardhat");

async function main() {
  console.log("🚀 开始部署 DePowerGrid 合约...\n");

  // 获取部署账户
  const [deployer] = await ethers.getSigners();
  console.log("📍 部署账户地址:", deployer.address);
  console.log("💰 账户余额:", (await deployer.getBalance()).toString(), "wei\n");

  // Chainlink Price Feed 地址配置
  // 根据部署的网络选择对应的预言机地址
  const networkName = hre.network.name;
  let priceFeedAddress;

  switch (networkName) {
    case "sepolia":
      priceFeedAddress = "0x694AA1769357215DE4FAC081bf1f309aDC325306"; // ETH/USD on Sepolia
      console.log("🌐 部署网络: Sepolia Testnet");
      break;
    case "mainnet":
      priceFeedAddress = "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419"; // ETH/USD on Mainnet
      console.log("🌐 部署网络: Ethereum Mainnet");
      break;
    case "polygon":
      priceFeedAddress = "0xAB594600376Ec9fD91F8e885dADF0CE036862dE0"; // MATIC/USD on Polygon
      console.log("🌐 部署网络: Polygon Mainnet");
      break;
    case "mumbai":
      priceFeedAddress = "0xd0D5e3DB44DE05E9F294BB0a3bEEaF030DE24Ada"; // MATIC/USD on Mumbai
      console.log("🌐 部署网络: Polygon Mumbai Testnet");
      break;
    case "localhost":
    case "hardhat":
      // 本地开发环境，需要部署Mock预言机
      console.log("🌐 部署网络: 本地开发环境");
      console.log("⚠️  需要先部署 MockPriceFeed 合约\n");
      
      const MockV3Aggregator = await ethers.getContractFactory("MockV3Aggregator");
      const mockPriceFeed = await MockV3Aggregator.deploy(
        8, // decimals
        200000000000 // initial price: $2000 with 8 decimals
      );
      await mockPriceFeed.deployed();
      priceFeedAddress = mockPriceFeed.address;
      console.log("✅ MockPriceFeed 部署成功:", priceFeedAddress);
      break;
    default:
      throw new Error(`❌ 不支持的网络: ${networkName}`);
  }

  console.log("🔗 Chainlink Price Feed 地址:", priceFeedAddress, "\n");

  // 部署主合约
  console.log("📝 正在编译合约...");
  const DePowerGrid = await ethers.getContractFactory("DePowerGrid");
  
  console.log("⏳ 正在部署合约...");
  const dePowerGrid = await DePowerGrid.deploy(priceFeedAddress);
  
  await dePowerGrid.deployed();
  
  console.log("✅ DePowerGrid 合约部署成功!");
  console.log("📍 合约地址:", dePowerGrid.address);
  console.log("🔗 交易哈希:", dePowerGrid.deployTransaction.hash, "\n");

  // 初始化：授权维修人员
  console.log("⚙️  正在初始化合约...");
  
  // 示例：授权3个维修人员地址
  const maintainerAddresses = [
    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // 示例地址1
    "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", // 示例地址2
    "0x90F79bf6EB2c4f870365E785982E1f101E93b906"  // 示例地址3
  ];

  console.log("👷 批量授权维修人员...");
  const tx = await dePowerGrid.batchAuthorizeMaintainers(maintainerAddresses);
  await tx.wait();
  console.log("✅ 维修人员授权完成\n");

  // 验证合约（仅在测试网和主网）
  if (networkName !== "localhost" && networkName !== "hardhat") {
    console.log("⏳ 等待区块确认以进行验证...");
    await dePowerGrid.deployTransaction.wait(6); // 等待6个区块
    
    console.log("📝 正在验证合约...");
    try {
      await hre.run("verify:verify", {
        address: dePowerGrid.address,
        constructorArguments: [priceFeedAddress],
      });
      console.log("✅ 合约验证成功\n");
    } catch (error) {
      console.log("⚠️  合约验证失败:", error.message, "\n");
    }
  }

  // 输出部署信息摘要
  console.log("=" .repeat(60));
  console.log("🎉 部署完成！\n");
  console.log("📋 部署信息摘要:");
  console.log("  - 合约地址:", dePowerGrid.address);
  console.log("  - 部署者:", deployer.address);
  console.log("  - 网络:", networkName);
  console.log("  - Price Feed:", priceFeedAddress);
  console.log("  - 已授权维修人员数:", maintainerAddresses.length);
  console.log("=" .repeat(60));
  
  // 保存部署信息到文件
  const fs = require("fs");
  const deploymentInfo = {
    network: networkName,
    contractAddress: dePowerGrid.address,
    deployer: deployer.address,
    priceFeed: priceFeedAddress,
    authorizedMaintainers: maintainerAddresses,
    deployedAt: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber()
  };
  
  fs.writeFileSync(
    `deployment-${networkName}.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("\n💾 部署信息已保存到: deployment-" + networkName + ".json");
  
  // 输出前端集成代码
  console.log("\n📱 前端集成代码:");
  console.log("```javascript");
  console.log(`const CONTRACT_ADDRESS = "${dePowerGrid.address}";`);
  console.log(`const PRICE_FEED_ADDRESS = "${priceFeedAddress}";`);
  console.log("```\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 部署失败:", error);
    process.exit(1);
  });
