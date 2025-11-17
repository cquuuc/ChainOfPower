# 🚀 去中心化电力数据平台 - 部署指南

本指南将帮助您将应用部署到生产环境，包括智能合约部署、IPFS托管和前端部署。

---

## 📋 目录

1. [部署前准备](#部署前准备)
2. [智能合约部署](#智能合约部署)
3. [IPFS配置](#ipfs配置)
4. [The Graph配置](#the-graph配置)
5. [前端构建与部署](#前端构建与部署)
6. [验证和测试](#验证和测试)
7. [常见问题](#常见问题)

---

## 🛠️ 部署前准备

### 1. 安装依赖

```bash
# 安装 Node.js 依赖
npm install

# 安装 Hardhat 和开发工具
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox dotenv
```

### 2. 创建环境配置文件

```bash
# 复制环境变量模板
cp .env.production.example .env.production
```

### 3. 编辑 `.env.production` 文件

**必须配置的变量：**

```bash
# 部署者私钥（⚠️ 请妥善保管，不要提交到 Git）
DEPLOYER_PRIVATE_KEY=your_private_key_here

# Infura 或 Alchemy API Key
VITE_INFURA_KEY=your_infura_project_id

# Pinata IPFS 配置
VITE_PINATA_API_KEY=your_pinata_api_key
VITE_PINATA_SECRET_KEY=your_pinata_secret_key
VITE_PINATA_JWT=your_pinata_jwt
```

**可选配置：**

```bash
# Etherscan API (用于验证合约)
ETHERSCAN_API_KEY=your_etherscan_api_key

# The Graph
VITE_GRAPH_URL=your_subgraph_url

# Google Maps
VITE_GOOGLE_MAPS_KEY=your_google_maps_key
```

### 4. 获取测试网 ETH

#### Sepolia 测试网（推荐）
- 水龙头 1: https://sepoliafaucet.com/
- 水龙头 2: https://www.alchemy.com/faucets/ethereum-sepolia

#### Mumbai 测试网
- 水龙头: https://mumbaifaucet.com/

---

## 🔗 智能合约部署

### 步骤 1: 编译合约

```bash
npx hardhat compile
```

### 步骤 2: 部署到测试网

#### 部署到 Sepolia 测试网

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

#### 部署到 Mumbai 测试网

```bash
npx hardhat run scripts/deploy.js --network mumbai
```

#### 部署到本地测试网

```bash
# 终端 1: 启动本地节点
npx hardhat node

# 终端 2: 部署合约
npx hardhat run scripts/deploy.js --network localhost
```

### 步骤 3: 保存合约地址

部署脚本会自动输出合约地址，类似：

```
✨ 部署完成! 合约地址摘要:
============================================================
DeviceRegistry:       0x1234567890123456789012345678901234567890
EnergyMarketplace:    0x2345678901234567890123456789012345678901
MaintenanceService:   0x3456789012345678901234567890123456789012
============================================================
```

### 步骤 4: 更新配置文件

#### 更新 `/config/production.config.ts`

```typescript
CONTRACTS: {
  DEVICE_REGISTRY: '0x1234567890123456789012345678901234567890',
  ENERGY_MARKETPLACE: '0x2345678901234567890123456789012345678901',
  MAINTENANCE_SERVICE: '0x3456789012345678901234567890123456789012'
}
```

#### 更新 `.env.production`

```bash
VITE_CONTRACT_DEVICE_REGISTRY=0x1234567890123456789012345678901234567890
VITE_CONTRACT_ENERGY_MARKETPLACE=0x2345678901234567890123456789012345678901
VITE_CONTRACT_MAINTENANCE_SERVICE=0x3456789012345678901234567890123456789012
```

### 步骤 5: 验证合约（可选但推荐）

```bash
# Sepolia
npx hardhat verify --network sepolia 0x1234567890123456789012345678901234567890
npx hardhat verify --network sepolia 0x2345678901234567890123456789012345678901
npx hardhat verify --network sepolia 0x3456789012345678901234567890123456789012

# Mumbai
npx hardhat verify --network mumbai 0x1234567890123456789012345678901234567890
```

---

## 📦 IPFS配置

### 选项 1: Pinata（推荐）

#### 1. 注册 Pinata 账户
访问 https://pinata.cloud/ 并注册免费账户

#### 2. 获取 API 密钥
- 登录 Pinata Dashboard
- 进入 "API Keys" 页面
- 点击 "New Key"
- 勾选 "Admin" 权限
- 保存 API Key 和 Secret

#### 3. 更新配置
```bash
VITE_PINATA_API_KEY=your_api_key
VITE_PINATA_SECRET_KEY=your_secret_key
VITE_PINATA_JWT=your_jwt_token
```

### 选项 2: Web3.Storage

#### 1. 注册账户
访问 https://web3.storage/

#### 2. 获取 API Token
```bash
VITE_WEB3_STORAGE_TOKEN=your_token
```

### 选项 3: NFT.Storage

#### 1. 注册账户
访问 https://nft.storage/

#### 2. 获取 API Key
```bash
VITE_NFT_STORAGE_KEY=your_api_key
```

---

## 📊 The Graph配置

### 步骤 1: 创建 Subgraph 项目

```bash
# 安装 Graph CLI
npm install -g @graphprotocol/graph-cli

# 初始化 Subgraph
graph init --product hosted-service your-github-username/power-platform
```

### 步骤 2: 编写 Schema (schema.graphql)

```graphql
type Device @entity {
  id: ID!
  deviceId: String!
  owner: Bytes!
  deviceType: String!
  capacity: BigInt!
  maintainer: Bytes!
  ipfsHash: String!
  dataHash: Bytes!
  registeredAt: BigInt!
  isActive: Boolean!
}

type EnergyListing @entity {
  id: ID!
  listingId: BigInt!
  seller: Bytes!
  deviceId: String!
  amount: BigInt!
  pricePerKwh: BigInt!
  totalPrice: BigInt!
  listedAt: BigInt!
  isActive: Boolean!
  isSold: Boolean!
}

type MaintenanceRecord @entity {
  id: ID!
  recordId: BigInt!
  deviceId: String!
  maintainer: Bytes!
  timestamp: BigInt!
  ipfsHash: String!
  dataHash: Bytes!
  issueType: String!
  status: String!
  healthScore: BigInt!
}
```

### 步骤 3: 部署 Subgraph

```bash
# 构建
graph codegen
graph build

# 部署到 Hosted Service
graph deploy --product hosted-service your-github-username/power-platform

# 或部署到 Graph Network (需要 GRT)
graph deploy --product subgraph-studio/power-platform
```

### 步骤 4: 更新配置

```bash
VITE_GRAPH_URL=https://api.thegraph.com/subgraphs/name/your-github-username/power-platform
```

---

## 🌐 前端构建与部署

### 选项 1: 部署到 IPFS (Fleek)

#### 1. 安装 Fleek CLI
```bash
npm install -g @fleek-platform/cli
```

#### 2. 登录 Fleek
```bash
fleek login
```

#### 3. 构建应用
```bash
npm run build
```

#### 4. 部署到 IPFS
```bash
fleek sites deploy
```

#### 5. 获取 IPFS 地址
Fleek 会提供一个 IPFS 网关地址，类似：
```
https://your-app.on.fleek.co
ipfs://QmXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx
```

### 选项 2: 部署到 Vercel

#### 1. 安装 Vercel CLI
```bash
npm install -g vercel
```

#### 2. 登录 Vercel
```bash
vercel login
```

#### 3. 部署
```bash
vercel --prod
```

### 选项 3: 部署到 Netlify

#### 1. 安装 Netlify CLI
```bash
npm install -g netlify-cli
```

#### 2. 登录 Netlify
```bash
netlify login
```

#### 3. 部署
```bash
netlify deploy --prod
```

### 选项 4: 手动部署到 IPFS (Pinata)

#### 1. 构建应用
```bash
npm run build
```

#### 2. 上传到 Pinata
- 访问 https://app.pinata.cloud/pinmanager
- 点击 "Upload" → "Folder"
- 选择 `dist` 文件夹
- 等待上传完成

#### 3. 获取 IPFS 哈希
```
ipfs://QmXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx
```

#### 4. 访问应用
```
https://gateway.pinata.cloud/ipfs/QmXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx
```

---

## ✅ 验证和测试

### 1. 测试智能合约交互

```bash
# 在浏览器中打开应用
# 连接 MetaMask
# 确保切换到正确的网络（Sepolia/Mumbai）

# 测试功能：
✅ 连接钱包
✅ 注册设备
✅ 上架能源
✅ 购买能源
✅ 记录维护
```

### 2. 检查区块链浏览器

#### Sepolia
https://sepolia.etherscan.io/address/YOUR_CONTRACT_ADDRESS

#### Mumbai
https://mumbai.polygonscan.com/address/YOUR_CONTRACT_ADDRESS

### 3. 验证 IPFS 存储

访问 Pinata Dashboard 查看上传的文件：
https://app.pinata.cloud/pinmanager

### 4. 测试 The Graph 查询

访问 Graph Playground:
https://thegraph.com/hosted-service/subgraph/YOUR_USERNAME/power-platform

---

## 🔧 环境变量总结

### 必须配置（部署智能合约）

```bash
DEPLOYER_PRIVATE_KEY=<部署者钱包私钥>
VITE_INFURA_KEY=<Infura API Key>
ETHERSCAN_API_KEY=<Etherscan API Key>
```

### 必须配置（应用功能）

```bash
VITE_CONTRACT_DEVICE_REGISTRY=<设备注册合约地址>
VITE_CONTRACT_ENERGY_MARKETPLACE=<能源市场合约地址>
VITE_CONTRACT_MAINTENANCE_SERVICE=<维护服务合约地址>
VITE_PINATA_API_KEY=<Pinata API Key>
VITE_PINATA_SECRET_KEY=<Pinata Secret Key>
VITE_PINATA_JWT=<Pinata JWT Token>
```

### 可选配置

```bash
VITE_GRAPH_URL=<The Graph Subgraph URL>
VITE_GOOGLE_MAPS_KEY=<Google Maps API Key>
VITE_AMAP_KEY=<高德地图 API Key>
```

---

## ❓ 常见问题

### Q1: 部署合约时遇到 "insufficient funds" 错误？
**A:** 确保您的钱包有足够的测试网 ETH。访问水龙头获取测试币。

### Q2: MetaMask 无法连接到应用？
**A:** 
1. 检查 MetaMask 是否切换到正确的网络
2. 清除浏览器缓存
3. 在 MetaMask 中重新连接网站

### Q3: IPFS 文件上传失败？
**A:**
1. 检查 Pinata API Key 是否正确
2. 确认 API Key 权限是否足够
3. 检查文件大小是否超过限制

### Q4: 合约验证失败？
**A:**
1. 确保使用的 Solidity 版本一致
2. 检查构造函数参数是否正确
3. 等待区块确认后再验证

### Q5: The Graph 索引失败？
**A:**
1. 检查合约地址是否正确
2. 确认网络配置是否匹配
3. 查看 Subgraph 日志排查错误

---

## 📝 部署检查清单

部署前请确认以下所有项目：

### 智能合约部署
- [ ] 编译合约无错误
- [ ] 部署到测试网成功
- [ ] 保存了所有合约地址
- [ ] 在区块浏览器验证合约
- [ ] 测试合约功能

### IPFS 配置
- [ ] 注册 Pinata/Web3.Storage 账户
- [ ] 获取 API 密钥
- [ ] 测试文件上传
- [ ] 配置环境变量

### The Graph 配置
- [ ] 创建 Subgraph 项目
- [ ] 编写 Schema
- [ ] 部署 Subgraph
- [ ] 测试查询功能

### 前端部署
- [ ] 更新生产配置
- [ ] 构建生产版本
- [ ] 测试构建产物
- [ ] 部署到托管平台
- [ ] 测试生产环境

### 安全检查
- [ ] 私钥不在代码仓库中
- [ ] .env 文件在 .gitignore 中
- [ ] API 密钥已保护
- [ ] 合约权限配置正确

---

## 🎉 部署完成后

恭喜！您的去中心化电力数据平台已成功部署！

### 下一步：

1. **分享您的应用**: 将 IPFS/域名地址分享给用户
2. **监控合约**: 使用区块浏览器监控交易
3. **收集反馈**: 从用户获取反馈并改进
4. **持续更新**: 根据需求更新合约和前端

### 有用的链接：

- **Sepolia 区块浏览器**: https://sepolia.etherscan.io
- **Pinata Dashboard**: https://app.pinata.cloud
- **The Graph Studio**: https://thegraph.com/studio
- **Hardhat 文档**: https://hardhat.org/docs

---

## 💬 需要帮助？

- Hardhat Discord: https://hardhat.org/discord
- The Graph Discord: https://thegraph.com/discord
- Pinata Support: support@pinata.cloud

---

**祝部署顺利！🚀**
