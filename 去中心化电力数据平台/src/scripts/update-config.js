/**
 * 配置更新脚本
 * 自动从部署文件更新前端配置
 * 
 * 使用方法:
 * node scripts/update-config.js sepolia
 */

const fs = require('fs');
const path = require('path');

// 获取网络参数
const network = process.argv[2] || 'sepolia';

console.log(`📝 正在更新 ${network} 网络的配置...\n`);

// 读取部署信息
const deploymentFile = path.join(__dirname, '..', 'deployments', `${network}-latest.json`);

if (!fs.existsSync(deploymentFile)) {
  console.error(`❌ 找不到部署文件: ${deploymentFile}`);
  console.log(`\n💡 提示: 请先部署合约到 ${network} 网络`);
  console.log(`   运行: npm run deploy:${network}`);
  process.exit(1);
}

const deployment = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));

console.log('✅ 找到部署信息:');
console.log(`   网络: ${deployment.network}`);
console.log(`   Chain ID: ${deployment.chainId}`);
console.log(`   部署者: ${deployment.deployer}`);
console.log(`   时间: ${deployment.timestamp}\n`);

// 提取合约地址
const deviceRegistry = deployment.contracts.DeviceRegistry.address;
const energyMarketplace = deployment.contracts.EnergyMarketplace.address;
const maintenanceService = deployment.contracts.MaintenanceService.address;

console.log('📋 合约地址:');
console.log(`   DeviceRegistry:      ${deviceRegistry}`);
console.log(`   EnergyMarketplace:   ${energyMarketplace}`);
console.log(`   MaintenanceService:  ${maintenanceService}\n`);

// 更新 production.config.ts
const configFile = path.join(__dirname, '..', 'config', 'production.config.ts');
let configContent = fs.readFileSync(configFile, 'utf8');

// 更新合约地址
configContent = configContent.replace(
  /DEVICE_REGISTRY: '0x[a-fA-F0-9]{40}'/,
  `DEVICE_REGISTRY: '${deviceRegistry}'`
);
configContent = configContent.replace(
  /ENERGY_MARKETPLACE: '0x[a-fA-F0-9]{40}'/,
  `ENERGY_MARKETPLACE: '${energyMarketplace}'`
);
configContent = configContent.replace(
  /MAINTENANCE_SERVICE: '0x[a-fA-F0-9]{40}'/,
  `MAINTENANCE_SERVICE: '${maintenanceService}'`
);

// 更新当前网络
const networkMap = {
  'sepolia': 'SEPOLIA',
  'mainnet': 'MAINNET',
  'polygon': 'POLYGON',
  'mumbai': 'MUMBAI',
  'arbitrum': 'ARBITRUM',
  'optimism': 'OPTIMISM'
};

const networkKey = networkMap[network] || 'SEPOLIA';
configContent = configContent.replace(
  /CURRENT_NETWORK: '[A-Z]+'/,
  `CURRENT_NETWORK: '${networkKey}'`
);

fs.writeFileSync(configFile, configContent);
console.log('✅ 已更新 /config/production.config.ts\n');

// 更新或创建 .env.production
const envFile = path.join(__dirname, '..', '.env.production');
let envContent = '';

if (fs.existsSync(envFile)) {
  envContent = fs.readFileSync(envFile, 'utf8');
  
  // 更新现有配置
  if (envContent.includes('VITE_CONTRACT_DEVICE_REGISTRY=')) {
    envContent = envContent.replace(
      /VITE_CONTRACT_DEVICE_REGISTRY=.*/,
      `VITE_CONTRACT_DEVICE_REGISTRY=${deviceRegistry}`
    );
  } else {
    envContent += `\nVITE_CONTRACT_DEVICE_REGISTRY=${deviceRegistry}`;
  }
  
  if (envContent.includes('VITE_CONTRACT_ENERGY_MARKETPLACE=')) {
    envContent = envContent.replace(
      /VITE_CONTRACT_ENERGY_MARKETPLACE=.*/,
      `VITE_CONTRACT_ENERGY_MARKETPLACE=${energyMarketplace}`
    );
  } else {
    envContent += `\nVITE_CONTRACT_ENERGY_MARKETPLACE=${energyMarketplace}`;
  }
  
  if (envContent.includes('VITE_CONTRACT_MAINTENANCE_SERVICE=')) {
    envContent = envContent.replace(
      /VITE_CONTRACT_MAINTENANCE_SERVICE=.*/,
      `VITE_CONTRACT_MAINTENANCE_SERVICE=${maintenanceService}`
    );
  } else {
    envContent += `\nVITE_CONTRACT_MAINTENANCE_SERVICE=${maintenanceService}`;
  }
  
  if (envContent.includes('VITE_NETWORK=')) {
    envContent = envContent.replace(
      /VITE_NETWORK=.*/,
      `VITE_NETWORK=${networkKey}`
    );
  } else {
    envContent += `\nVITE_NETWORK=${networkKey}`;
  }
} else {
  // 创建新的配置文件
  envContent = `# 自动生成的配置 - ${new Date().toISOString()}
VITE_NETWORK=${networkKey}
VITE_CONTRACT_DEVICE_REGISTRY=${deviceRegistry}
VITE_CONTRACT_ENERGY_MARKETPLACE=${energyMarketplace}
VITE_CONTRACT_MAINTENANCE_SERVICE=${maintenanceService}
`;
}

fs.writeFileSync(envFile, envContent);
console.log('✅ 已更新 .env.production\n');

// 生成验证命令
console.log('📝 验证合约命令:');
console.log(`npx hardhat verify --network ${network} ${deviceRegistry}`);
console.log(`npx hardhat verify --network ${network} ${energyMarketplace}`);
console.log(`npx hardhat verify --network ${network} ${maintenanceService}`);
console.log('');

console.log('✨ 配置更新完成！');
console.log('\n下一步:');
console.log('1. 验证合约（可选）');
console.log('2. 配置 IPFS (Pinata) API 密钥');
console.log('3. 构建生产版本: npm run build:prod');
console.log('4. 部署到 IPFS: npm run deploy:ipfs');
