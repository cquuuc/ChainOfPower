/**
 * 部署状态检查脚本
 * 检查配置是否完整，是否准备好部署
 * 
 * 使用方法: node scripts/check-deployment.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 检查部署状态...\n');

let hasErrors = false;
let hasWarnings = false;

// ==================== 1. 检查环境变量文件 ====================
console.log('📝 检查环境变量文件...');

const envFile = path.join(__dirname, '..', '.env.production');
const envExampleFile = path.join(__dirname, '..', '.env.production.example');

if (!fs.existsSync(envFile)) {
  console.log('   ❌ 缺少 .env.production 文件');
  console.log('      运行: cp .env.production.example .env.production');
  hasErrors = true;
} else {
  console.log('   ✅ .env.production 文件存在');
  
  // 读取环境变量
  const envContent = fs.readFileSync(envFile, 'utf8');
  
  // 检查必须的变量
  const requiredVars = [
    'DEPLOYER_PRIVATE_KEY',
    'VITE_INFURA_KEY',
    'VITE_PINATA_API_KEY',
    'VITE_PINATA_SECRET_KEY'
  ];
  
  requiredVars.forEach(varName => {
    const regex = new RegExp(`${varName}=(.+)`, 'i');
    const match = envContent.match(regex);
    
    if (!match || !match[1] || match[1].includes('your_') || match[1].includes('YOUR_')) {
      console.log(`   ⚠️  ${varName} 未配置或使用默认值`);
      hasWarnings = true;
    } else {
      console.log(`   ✅ ${varName} 已配置`);
    }
  });
}

console.log('');

// ==================== 2. 检查合约文件 ====================
console.log('📄 检查智能合约文件...');

const contracts = [
  'DeviceRegistry.sol',
  'EnergyMarketplace.sol',
  'MaintenanceService.sol'
];

contracts.forEach(contract => {
  const contractPath = path.join(__dirname, '..', 'contracts', contract);
  if (fs.existsSync(contractPath)) {
    console.log(`   ✅ ${contract} 存在`);
  } else {
    console.log(`   ❌ ${contract} 缺失`);
    hasErrors = true;
  }
});

console.log('');

// ==================== 3. 检查 Hardhat 配置 ====================
console.log('⚙️  检查 Hardhat 配置...');

const hardhatConfigPath = path.join(__dirname, '..', 'hardhat.config.js');
if (fs.existsSync(hardhatConfigPath)) {
  console.log('   ✅ hardhat.config.js 存在');
} else {
  console.log('   ❌ hardhat.config.js 缺失');
  hasErrors = true;
}

console.log('');

// ==================== 4. 检查部署脚本 ====================
console.log('🚀 检查部署脚本...');

const deployScriptPath = path.join(__dirname, 'deploy.js');
if (fs.existsSync(deployScriptPath)) {
  console.log('   ✅ deploy.js 存在');
} else {
  console.log('   ❌ deploy.js 缺失');
  hasErrors = true;
}

console.log('');

// ==================== 5. 检查依赖 ====================
console.log('📦 检查依赖...');

const packageJsonPath = path.join(__dirname, '..', 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  const requiredDeps = [
    'hardhat',
    '@nomicfoundation/hardhat-toolbox',
    'dotenv',
    'ethers'
  ];
  
  requiredDeps.forEach(dep => {
    if (packageJson.devDependencies?.[dep] || packageJson.dependencies?.[dep]) {
      console.log(`   ✅ ${dep} 已安装`);
    } else {
      console.log(`   ⚠️  ${dep} 未安装`);
      hasWarnings = true;
    }
  });
  
  // 检查 node_modules
  const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
  if (!fs.existsSync(nodeModulesPath)) {
    console.log('   ⚠️  node_modules 不存在，请运行 npm install');
    hasWarnings = true;
  }
} else {
  console.log('   ❌ package.json 缺失');
  hasErrors = true;
}

console.log('');

// ==================== 6. 检查部署记录 ====================
console.log('📋 检查部署记录...');

const deploymentDir = path.join(__dirname, '..', 'deployments');
if (fs.existsSync(deploymentDir)) {
  const deploymentFiles = fs.readdirSync(deploymentDir).filter(f => f.endsWith('.json'));
  
  if (deploymentFiles.length > 0) {
    console.log(`   ℹ️  找到 ${deploymentFiles.length} 个部署记录:`);
    deploymentFiles.forEach(file => {
      console.log(`      - ${file}`);
    });
  } else {
    console.log('   ℹ️  暂无部署记录（首次部署）');
  }
} else {
  console.log('   ℹ️  部署目录不存在（首次部署）');
}

console.log('');

// ==================== 7. 检查配置文件 ====================
console.log('⚙️  检查应用配置...');

const configPath = path.join(__dirname, '..', 'config', 'constants.ts');
const prodConfigPath = path.join(__dirname, '..', 'config', 'production.config.ts');

if (fs.existsSync(configPath)) {
  console.log('   ✅ constants.ts 存在');
} else {
  console.log('   ❌ constants.ts 缺失');
  hasErrors = true;
}

if (fs.existsSync(prodConfigPath)) {
  console.log('   ✅ production.config.ts 存在');
} else {
  console.log('   ⚠️  production.config.ts 缺失');
  hasWarnings = true;
}

console.log('');

// ==================== 总结 ====================
console.log('═'.repeat(60));

if (hasErrors) {
  console.log('❌ 检查失败！请修复以上错误后再进行部署。\n');
  process.exit(1);
} else if (hasWarnings) {
  console.log('⚠️  检查通过，但有警告。建议配置完整后再部署。\n');
  console.log('下一步:');
  console.log('1. 配置 .env.production 文件');
  console.log('2. 运行 npm install 安装依赖');
  console.log('3. 运行 npm run compile 编译合约');
  console.log('4. 运行 npm run deploy:sepolia 部署合约');
  console.log('');
  process.exit(0);
} else {
  console.log('✅ 检查全部通过！可以开始部署。\n');
  console.log('推荐的部署流程:');
  console.log('');
  console.log('📝 部署智能合约:');
  console.log('   npm run compile');
  console.log('   npm run deploy:sepolia');
  console.log('   node scripts/update-config.js sepolia');
  console.log('');
  console.log('📝 验证合约（可选）:');
  console.log('   npm run verify:sepolia YOUR_CONTRACT_ADDRESS');
  console.log('');
  console.log('📝 构建和部署前端:');
  console.log('   npm run build:prod');
  console.log('   npm run deploy:ipfs');
  console.log('');
  process.exit(0);
}
