/**
 * 生产环境配置文件
 * 部署时需要替换为真实的合约地址和API密钥
 */

export const PRODUCTION_CONFIG = {
  // ==================== 区块链网络配置 ====================
  // 选择部署的目标网络
  NETWORK: {
    // === 以太坊主网 ===
    MAINNET: {
      chainId: 1,
      rpcUrl: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
      name: 'Ethereum Mainnet',
      blockExplorer: 'https://etherscan.io'
    },
    
    // === Sepolia 测试网（推荐用于测试）===
    SEPOLIA: {
      chainId: 11155111,
      rpcUrl: 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY',
      name: 'Sepolia Testnet',
      blockExplorer: 'https://sepolia.etherscan.io'
    },
    
    // === Polygon 主网 ===
    POLYGON: {
      chainId: 137,
      rpcUrl: 'https://polygon-rpc.com',
      name: 'Polygon Mainnet',
      blockExplorer: 'https://polygonscan.com'
    },
    
    // === Polygon Mumbai 测试网 ===
    MUMBAI: {
      chainId: 80001,
      rpcUrl: 'https://rpc-mumbai.maticvigil.com',
      name: 'Polygon Mumbai Testnet',
      blockExplorer: 'https://mumbai.polygonscan.com'
    },
    
    // === Arbitrum One ===
    ARBITRUM: {
      chainId: 42161,
      rpcUrl: 'https://arb1.arbitrum.io/rpc',
      name: 'Arbitrum One',
      blockExplorer: 'https://arbiscan.io'
    },
    
    // === Optimism ===
    OPTIMISM: {
      chainId: 10,
      rpcUrl: 'https://mainnet.optimism.io',
      name: 'Optimism',
      blockExplorer: 'https://optimistic.etherscan.io'
    }
  },
  
  // 当前使用的网络（部署时修改为实际网络）
  CURRENT_NETWORK: 'SEPOLIA', // 'MAINNET' | 'SEPOLIA' | 'POLYGON' | 'MUMBAI' | 'ARBITRUM' | 'OPTIMISM'
  
  // ==================== 智能合约地址 ====================
  // ⚠️ 部署后必须更新为实际的合约地址！
  CONTRACTS: {
    // 设备注册合约
    DEVICE_REGISTRY: '0x0000000000000000000000000000000000000000',
    
    // 能源市场合约
    ENERGY_MARKETPLACE: '0x0000000000000000000000000000000000000000',
    
    // 维护服务合约
    MAINTENANCE_SERVICE: '0x0000000000000000000000000000000000000000'
  },
  
  // ==================== IPFS 配置 ====================
  IPFS: {
    // Pinata 配置（推荐）
    PINATA: {
      API_URL: 'https://api.pinata.cloud',
      GATEWAY_URL: 'https://gateway.pinata.cloud/ipfs',
      API_KEY: '', // 从环境变量或直接填写
      API_SECRET: '', // 从环境变量或直接填写
      JWT: '' // Pinata JWT token
    },
    
    // Web3.Storage 配置（备选）
    WEB3_STORAGE: {
      API_URL: 'https://api.web3.storage',
      API_TOKEN: ''
    },
    
    // NFT.Storage 配置（备选）
    NFT_STORAGE: {
      API_URL: 'https://api.nft.storage',
      API_KEY: ''
    },
    
    // 使用哪个IPFS服务
    USE_SERVICE: 'PINATA' // 'PINATA' | 'WEB3_STORAGE' | 'NFT_STORAGE'
  },
  
  // ==================== Chainlink 预言机配置 ====================
  CHAINLINK: {
    // Sepolia 测试网 Price Feeds
    SEPOLIA_PRICE_FEEDS: {
      ETH_USD: '0x694AA1769357215DE4FAC081bf1f309aDC325306',
      BTC_USD: '0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43',
      LINK_USD: '0xc59E3633BAAC79493d908e63626716e204A45EdF'
    },
    
    // 以太坊主网 Price Feeds
    MAINNET_PRICE_FEEDS: {
      ETH_USD: '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419',
      BTC_USD: '0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c',
      LINK_USD: '0x2c1d072e956AFFC0D435Cb7AC38EF18d24d9127c'
    },
    
    // Polygon 主网 Price Feeds
    POLYGON_PRICE_FEEDS: {
      MATIC_USD: '0xAB594600376Ec9fD91F8e885dADF0CE036862dE0',
      ETH_USD: '0xF9680D99D6C9589e2a93a78A04A279e509205945',
      BTC_USD: '0xc907E116054Ad103354f2D350FD2514433D57F6f'
    },
    
    // 自定义电力价格预言机（需要部署）
    ELECTRICITY_PRICE_ORACLE: '0x0000000000000000000000000000000000000000'
  },
  
  // ==================== The Graph 配置 ====================
  GRAPH: {
    // Hosted Service URL（即将弃用）
    HOSTED_SERVICE_URL: 'https://api.thegraph.com/subgraphs/name/YOUR_GITHUB_USERNAME/power-platform',
    
    // Graph Network URL（推荐）
    DECENTRALIZED_URL: 'https://gateway.thegraph.com/api/YOUR_API_KEY/subgraphs/id/YOUR_SUBGRAPH_ID',
    
    // 使用哪个服务
    USE_SERVICE: 'HOSTED', // 'HOSTED' | 'DECENTRALIZED'
    
    // API Key（Graph Network需要）
    API_KEY: ''
  },
  
  // ==================== 外部 API 配置 ====================
  EXTERNAL_APIS: {
    // Google Maps（地图功能）
    GOOGLE_MAPS_KEY: '',
    
    // 高德地图（中国区域）
    AMAP_KEY: '',
    
    // Infura（区块链RPC）
    INFURA_KEY: '',
    
    // Alchemy（备选RPC）
    ALCHEMY_KEY: '',
    
    // Unsplash（图片服务）
    UNSPLASH_KEY: ''
  },
  
  // ==================== 真实账户地址 ====================
  // ⚠️ 这些是您提供的真实钱包地址
  ACCOUNTS: {
    OWNER: '0x5E93A7506F3c984Fc18Ae32ff1Efdd6b708bAC10',
    MAINTAINER_1: '0x28c3062CF7B3D1507A733A1ac0D11A77FAC97Fd1'
  }
};

// ==================== 部署检查清单 ====================
export const DEPLOYMENT_CHECKLIST = {
  '1_智能合约': [
    '✅ 编写并测试智能合约',
    '✅ 在测试网部署合约（Sepolia/Mumbai）',
    '✅ 验证合约代码（Etherscan/Polygonscan）',
    '✅ 更新 PRODUCTION_CONFIG.CONTRACTS 地址',
    '✅ 在主网部署（可选）'
  ],
  
  '2_IPFS配置': [
    '✅ 注册 Pinata 账户: https://pinata.cloud',
    '✅ 获取 API Key 和 Secret',
    '✅ 更新 PRODUCTION_CONFIG.IPFS 配置',
    '✅ 测试文件上传功能'
  ],
  
  '3_Chainlink配置': [
    '✅ 确认使用的网络',
    '✅ 使用正确网络的 Price Feed 地址',
    '✅ 部署自定义电力价格预言机（可选）'
  ],
  
  '4_The_Graph配置': [
    '✅ 编写 Subgraph Schema',
    '✅ 部署到 Graph Hosted Service 或 Graph Network',
    '✅ 更新 Subgraph URL',
    '✅ 测试查询功能'
  ],
  
  '5_环境变量': [
    '✅ 创建 .env.production 文件',
    '✅ 设置所有 API Keys',
    '✅ 确保敏感信息不提交到 Git'
  ],
  
  '6_前端部署': [
    '✅ 构建生产版本: npm run build',
    '✅ 测试构建产物',
    '✅ 部署到 IPFS/Fleek/Vercel',
    '✅ 配置自定义域名（可选）'
  ]
};

// ==================== 快速配置切换 ====================
export function getDeploymentConfig() {
  const network = PRODUCTION_CONFIG.NETWORK[PRODUCTION_CONFIG.CURRENT_NETWORK];
  
  return {
    network,
    contracts: PRODUCTION_CONFIG.CONTRACTS,
    ipfs: PRODUCTION_CONFIG.IPFS[PRODUCTION_CONFIG.IPFS.USE_SERVICE],
    chainlink: (() => {
      switch (PRODUCTION_CONFIG.CURRENT_NETWORK) {
        case 'SEPOLIA':
          return PRODUCTION_CONFIG.CHAINLINK.SEPOLIA_PRICE_FEEDS;
        case 'MAINNET':
          return PRODUCTION_CONFIG.CHAINLINK.MAINNET_PRICE_FEEDS;
        case 'POLYGON':
        case 'MUMBAI':
          return PRODUCTION_CONFIG.CHAINLINK.POLYGON_PRICE_FEEDS;
        default:
          return PRODUCTION_CONFIG.CHAINLINK.SEPOLIA_PRICE_FEEDS;
      }
    })(),
    graph: PRODUCTION_CONFIG.GRAPH,
    accounts: PRODUCTION_CONFIG.ACCOUNTS
  };
}

export default PRODUCTION_CONFIG;
