/**
 * 应用配置常量
 * 集中管理所有API地址、密钥、合约地址等配置
 */

// 安全获取环境变量的辅助函数
const getEnvVar = (key: string, defaultValue: string = ''): string => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || defaultValue;
  }
  // 在Vite环境中使用import.meta.env
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return (import.meta.env as any)[key] || defaultValue;
  }
  return defaultValue;
};

// ==================== 区块链配置 ====================
export const BLOCKCHAIN_CONFIG = {
  // Hardhat本地测试网络
  HARDHAT_NETWORK: {
    chainId: 31337,
    rpcUrl: 'http://127.0.0.1:8545',
    name: 'Hardhat Local'
  },
  
  // 合约地址（部署后需要更新）
  CONTRACTS: {
    DEVICE_REGISTRY: getEnvVar('VITE_CONTRACT_DEVICE_REGISTRY', '0x5FbDB2315678afecb367f032d93F642f64180aa3'),
    ENERGY_MARKETPLACE: getEnvVar('VITE_CONTRACT_ENERGY_MARKETPLACE', '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'),
    MAINTENANCE_SERVICE: getEnvVar('VITE_CONTRACT_MAINTENANCE_SERVICE', '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0')
  },
  
  // 测试账户（Hardhat默认账户）
  TEST_ACCOUNTS: {
    OWNER: '0x5E93A7506F3c984Fc18Ae32ff1Efdd6b708bAC10',
    MAINTAINER_1: '0x28c3062CF7B3D1507A733A1ac0D11A77FAC97Fd1',
    MAINTAINER_2: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    BUYER_1: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    BUYER_2: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65'
  }
};

// ==================== IPFS 配置 ====================
export const IPFS_CONFIG = {
  // Pinata API配置
  PINATA: {
    API_URL: 'https://api.pinata.cloud',
    GATEWAY_URL: 'https://gateway.pinata.cloud/ipfs',
    API_KEY: getEnvVar('REACT_APP_PINATA_API_KEY', 'YOUR_PINATA_API_KEY'),
    API_SECRET: getEnvVar('REACT_APP_PINATA_SECRET_KEY', 'YOUR_PINATA_SECRET_KEY'),
    JWT: getEnvVar('REACT_APP_PINATA_JWT', 'YOUR_PINATA_JWT')
  },
  
  // IPFS本地节点（可选）
  LOCAL_NODE: {
    API_URL: 'http://127.0.0.1:5001',
    GATEWAY_URL: 'http://127.0.0.1:8080/ipfs'
  },
  
  // 使用哪个IPFS节点
  USE_LOCAL: false
};

// ==================== Chainlink 预言机配置 ====================
export const CHAINLINK_CONFIG = {
  // Chainlink Price Feeds (以太坊主网)
  PRICE_FEEDS: {
    ETH_USD: '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419',
    BTC_USD: '0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c',
    // 电力价格预言机（需要自定义部署）
    ELECTRICITY_PRICE: getEnvVar('REACT_APP_ELECTRICITY_ORACLE', '0x0000000000000000000000000000000000000000')
  },
  
  // Chainlink VRF (随机数)
  VRF: {
    COORDINATOR: getEnvVar('REACT_APP_VRF_COORDINATOR', '0x0000000000000000000000000000000000000000'),
    KEY_HASH: getEnvVar('REACT_APP_VRF_KEY_HASH', '0x0000000000000000000000000000000000000000'),
    SUBSCRIPTION_ID: getEnvVar('REACT_APP_VRF_SUBSCRIPTION_ID', '0')
  },
  
  // Mock模式（演示用）
  MOCK_ENABLED: true,
  MOCK_ELECTRICITY_PRICE: 0.15 // USD per kWh
};

// ==================== The Graph 配置 ====================
export const GRAPH_CONFIG = {
  // Subgraph 查询端点
  SUBGRAPH_URL: getEnvVar('REACT_APP_GRAPH_URL', 'http://127.0.0.1:8000/subgraphs/name/power-platform'),
  
  // Graph Node 配置
  GRAPH_NODE: {
    HTTP_URL: 'http://127.0.0.1:8000',
    WS_URL: 'ws://127.0.0.1:8001',
    ADMIN_URL: 'http://127.0.0.1:8020'
  },
  
  // IPFS for subgraph
  IPFS_URL: 'http://127.0.0.1:5001',
  
  // Mock模式
  MOCK_ENABLED: true
};

// ==================== GPS 和地图配置 ====================
export const MAP_CONFIG = {
  // Google Maps API
  GOOGLE_MAPS: {
    API_KEY: getEnvVar('REACT_APP_GOOGLE_MAPS_KEY', 'YOUR_GOOGLE_MAPS_KEY'),
    GEOCODING_URL: 'https://maps.googleapis.com/maps/api/geocode/json'
  },
  
  // 高德地图 API（中国区域）
  AMAP: {
    API_KEY: getEnvVar('REACT_APP_AMAP_KEY', 'YOUR_AMAP_KEY'),
    GEOCODING_URL: 'https://restapi.amap.com/v3/geocode/geo'
  },
  
  // 默认位置（北京）
  DEFAULT_LOCATION: {
    lat: 39.9042,
    lng: 116.4074,
    address: '北京市'
  }
};

// ==================== 加密配置 ====================
export const ENCRYPTION_CONFIG = {
  // RSA密钥长度
  RSA_KEY_LENGTH: 2048,
  
  // AES配置
  AES: {
    ALGORITHM: 'AES-GCM',
    KEY_LENGTH: 256,
    IV_LENGTH: 12,
    TAG_LENGTH: 128
  },
  
  // 密钥存储
  STORAGE_KEY: 'power_platform_encryption_keys'
};

// ==================== 外部API配置 ====================
export const EXTERNAL_API_CONFIG = {
  // Unsplash图片API
  UNSPLASH: {
    API_URL: 'https://api.unsplash.com',
    ACCESS_KEY: getEnvVar('REACT_APP_UNSPLASH_KEY', 'YOUR_UNSPLASH_KEY')
  },
  
  // 天气API（可选）
  WEATHER: {
    API_URL: 'https://api.openweathermap.org/data/2.5',
    API_KEY: getEnvVar('REACT_APP_WEATHER_KEY', 'YOUR_WEATHER_KEY')
  },
  
  // 电力数据API（可选）
  POWER_DATA: {
    API_URL: getEnvVar('REACT_APP_POWER_DATA_URL', 'https://api.example.com/power'),
    API_KEY: getEnvVar('REACT_APP_POWER_DATA_KEY', 'YOUR_API_KEY')
  }
};

// ==================== 应用配置 ====================
export const APP_CONFIG = {
  // 应用名称和版本
  APP_NAME: 'Decentralized Power Platform',
  VERSION: '1.0.0',
  
  // 支持的语言
  LANGUAGES: ['zh', 'en'],
  DEFAULT_LANGUAGE: 'zh',
  
  // 角色类型
  ROLES: {
    OWNER: 'owner',
    MAINTAINER: 'maintainer'
  },
  
  // 设备健康度阈值
  HEALTH_THRESHOLDS: {
    CRITICAL: 50,  // 低于此值发出预警
    WARNING: 70,   // 警告级别
    GOOD: 85       // 良好状态
  },
  
  // 交易市场配置
  MARKETPLACE: {
    MIN_LISTING_AMOUNT: 100,    // 最小上架数量（kWh）
    MAX_LISTING_AMOUNT: 100000, // 最大上架数量（kWh）
    MIN_PRICE: 0.01,            // 最小价格（USD/kWh）
    MAX_PRICE: 10.0,            // 最大价格（USD/kWh）
    COMMISSION_RATE: 0.02       // 平台手续费率（2%）
  },
  
  // 模拟数据模式
  DEMO_MODE: true,
  
  // 零配置启动模式
  ZERO_CONFIG_MODE: !getEnvVar('REACT_APP_PINATA_API_KEY')
};

// ==================== 智能合约 ABI 路径 ====================
export const CONTRACT_ABI_PATHS = {
  DEVICE_REGISTRY: '/contracts/DeviceRegistry.json',
  ENERGY_MARKETPLACE: '/contracts/EnergyMarketplace.json',
  MAINTENANCE_SERVICE: '/contracts/MaintenanceService.json'
};

// ==================== 环境检查 ====================
export const ENV_CHECK = {
  // 检查是否配置了所有必需的环境变量
  hasRequiredEnvVars: () => {
    const required = [
      'REACT_APP_PINATA_API_KEY',
      'REACT_APP_PINATA_SECRET_KEY'
    ];
    return required.every(key => getEnvVar(key));
  },
  
  // 获取缺失的环境变量
  getMissingEnvVars: () => {
    const required = [
      'REACT_APP_PINATA_API_KEY',
      'REACT_APP_PINATA_SECRET_KEY',
      'REACT_APP_GOOGLE_MAPS_KEY'
    ];
    return required.filter(key => !getEnvVar(key));
  },
  
  // 是否为开发环境
  get isDevelopment() {
    if (typeof process !== 'undefined' && process.env) {
      return process.env.NODE_ENV === 'development';
    }
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return (import.meta.env as any).MODE === 'development';
    }
    return true; // 默认开发环境
  },
  
  // 是否为生产环境
  get isProduction() {
    if (typeof process !== 'undefined' && process.env) {
      return process.env.NODE_ENV === 'production';
    }
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return (import.meta.env as any).MODE === 'production';
    }
    return false;
  }
};

// ==================== 导出所有配置 ====================
export default {
  BLOCKCHAIN_CONFIG,
  IPFS_CONFIG,
  CHAINLINK_CONFIG,
  GRAPH_CONFIG,
  MAP_CONFIG,
  ENCRYPTION_CONFIG,
  EXTERNAL_API_CONFIG,
  APP_CONFIG,
  CONTRACT_ABI_PATHS,
  ENV_CHECK
};