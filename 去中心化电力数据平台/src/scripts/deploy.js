/**
 * Hardhat 部署脚本
 * 用于部署所有智能合约到区块链网络
 * 
 * 使用方法:
 * 1. 本地测试网: npx hardhat run scripts/deploy.js --network localhost
 * 2. Sepolia测试网: npx hardhat run scripts/deploy.js --network sepolia
 * 3. 主网: npx hardhat run scripts/deploy.js --network mainnet
 */

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 开始部署智能合约...\n");

  // 获取部署者账户
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 部署账户:", deployer.address);
  console.log("💰 账户余额:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH\n");

  // 获取网络信息
  const network = await hre.ethers.provider.getNetwork();
  console.log("🌐 部署网络:", network.name);
  console.log("🔗 Chain ID:", network.chainId, "\n");

  // 部署合约的配置
  const deploymentConfig = {
    network: network.name,
    chainId: network.chainId.toString(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {}
  };

  try {
    // ==================== 1. 部署 DeviceRegistry ====================
    console.log("📦 部署 DeviceRegistry 合约...");
    const DeviceRegistry = await hre.ethers.getContractFactory("DeviceRegistry");
    const deviceRegistry = await DeviceRegistry.deploy();
    await deviceRegistry.waitForDeployment();
    const deviceRegistryAddress = await deviceRegistry.getAddress();
    
    console.log("✅ DeviceRegistry 部署成功!");
    console.log("   地址:", deviceRegistryAddress);
    
    deploymentConfig.contracts.DeviceRegistry = {
      address: deviceRegistryAddress,
      deployer: deployer.address,
      blockNumber: deviceRegistry.deploymentTransaction().blockNumber
    };
    console.log("");

    // ==================== 2. 部署 EnergyMarketplace ====================
    console.log("📦 部署 EnergyMarketplace 合约...");
    const EnergyMarketplace = await hre.ethers.getContractFactory("EnergyMarketplace");
    const energyMarketplace = await EnergyMarketplace.deploy();
    await energyMarketplace.waitForDeployment();
    const energyMarketplaceAddress = await energyMarketplace.getAddress();
    
    console.log("✅ EnergyMarketplace 部署成功!");
    console.log("   地址:", energyMarketplaceAddress);
    
    deploymentConfig.contracts.EnergyMarketplace = {
      address: energyMarketplaceAddress,
      deployer: deployer.address,
      blockNumber: energyMarketplace.deploymentTransaction().blockNumber
    };
    console.log("");

    // ==================== 3. 部署 MaintenanceService ====================
    console.log("📦 部署 MaintenanceService 合约...");
    const MaintenanceService = await hre.ethers.getContractFactory("MaintenanceService");
    const maintenanceService = await MaintenanceService.deploy();
    await maintenanceService.waitForDeployment();
    const maintenanceServiceAddress = await maintenanceService.getAddress();
    
    console.log("✅ MaintenanceService 部署成功!");
    console.log("   地址:", maintenanceServiceAddress);
    
    deploymentConfig.contracts.MaintenanceService = {
      address: maintenanceServiceAddress,
      deployer: deployer.address,
      blockNumber: maintenanceService.deploymentTransaction().blockNumber
    };
    console.log("");

    // ==================== 保存部署信息 ====================
    const deploymentDir = path.join(__dirname, "..", "deployments");
    if (!fs.existsSync(deploymentDir)) {
      fs.mkdirSync(deploymentDir, { recursive: true });
    }

    const deploymentFile = path.join(
      deploymentDir,
      `${network.name}-${Date.now()}.json`
    );
    
    fs.writeFileSync(
      deploymentFile,
      JSON.stringify(deploymentConfig, null, 2)
    );

    // 同时更新最新部署信息
    const latestFile = path.join(deploymentDir, `${network.name}-latest.json`);
    fs.writeFileSync(
      latestFile,
      JSON.stringify(deploymentConfig, null, 2)
    );

    console.log("💾 部署信息已保存到:", deploymentFile);
    console.log("");

    // ==================== 输出部署摘要 ====================
    console.log("=" .repeat(60));
    console.log("✨ 部署完成! 合约地址摘要:");
    console.log("=" .repeat(60));
    console.log("DeviceRegistry:      ", deviceRegistryAddress);
    console.log("EnergyMarketplace:   ", energyMarketplaceAddress);
    console.log("MaintenanceService:  ", maintenanceServiceAddress);
    console.log("=" .repeat(60));
    console.log("");

    // ==================== 验证提示 ====================
    if (network.name !== "hardhat" && network.name !== "localhost") {
      console.log("📝 验证合约（在区块浏览器上）:");
      console.log("");
      console.log(`npx hardhat verify --network ${network.name} ${deviceRegistryAddress}`);
      console.log(`npx hardhat verify --network ${network.name} ${energyMarketplaceAddress}`);
      console.log(`npx hardhat verify --network ${network.name} ${maintenanceServiceAddress}`);
      console.log("");
    }

    // ==================== 配置文件更新提示 ====================
    console.log("⚠️  请更新以下配置文件:");
    console.log("");
    console.log("1. /config/production.config.ts");
    console.log("   CONTRACTS: {");
    console.log(`     DEVICE_REGISTRY: '${deviceRegistryAddress}',`);
    console.log(`     ENERGY_MARKETPLACE: '${energyMarketplaceAddress}',`);
    console.log(`     MAINTENANCE_SERVICE: '${maintenanceServiceAddress}'`);
    console.log("   }");
    console.log("");
    console.log("2. .env.production");
    console.log(`   VITE_CONTRACT_DEVICE_REGISTRY=${deviceRegistryAddress}`);
    console.log(`   VITE_CONTRACT_ENERGY_MARKETPLACE=${energyMarketplaceAddress}`);
    console.log(`   VITE_CONTRACT_MAINTENANCE_SERVICE=${maintenanceServiceAddress}`);
    console.log("");

  } catch (error) {
    console.error("❌ 部署失败:", error);
    process.exit(1);
  }
}

// 执行部署
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
