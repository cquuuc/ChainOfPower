# 🚀 快速部署指南

5分钟快速部署去中心化电力数据平台！

---

## 📦 步骤 1: 环境准备

```bash
# 安装依赖
npm install

# 复制环境配置模板
cp .env.production.example .env.production
```

---

## 🔑 步骤 2: 配置必要的密钥

编辑 `.env.production` 文件：

```bash
# ⚠️ 必须配置 - 部署者私钥
DEPLOYER_PRIVATE_KEY=your_private_key_here

# ⚠️ 必须配置 - RPC节点
VITE_INFURA_KEY=your_infura_key_here

# ⚠️ 必须配置 - IPFS服务
VITE_PINATA_API_KEY=your_pinata_api_key
VITE_PINATA_SECRET_KEY=your_pinata_secret_key
VITE_PINATA_JWT=your_pinata_jwt
```

### 🔗 获取密钥：

| 服务 | 注册地址 | 用途 |
|-----|---------|------|
| **Infura** | https://infura.io | 区块链RPC节点 |
| **Pinata** | https://pinata.cloud | IPFS存储服务 |

---

## 🏗️ 步骤 3: 部署智能合约

### 选项 A: 部署到 Sepolia 测试网（推荐）

```bash
# 1. 获取测试ETH
# 访问: https://sepoliafaucet.com/
# 输入您的钱包地址获取测试币

# 2. 编译合约
npm run compile

# 3. 部署到 Sepolia
npm run deploy:sepolia

# 4. 自动更新配置
node scripts/update-config.js sepolia
```

### 选项 B: 部署到本地测试网（开发用）

```bash
# 终端 1: 启动本地节点
npm run node

# 终端 2: 部署合约
npm run deploy:local

# 终端 3: 自动更新配置
node scripts/update-config.js localhost
```

---

## 📝 步骤 4: 记录合约地址

部署成功后，您会看到：

```
✨ 部署完成! 合约地址摘要:
============================================================
DeviceRegistry:       0x1234...
EnergyMarketplace:    0x2345...
MaintenanceService:   0x3456...
============================================================
```

✅ **配置文件已自动更新！**

---

## 🌐 步骤 5: 构建和部署前端

### 方式 1: 部署到 IPFS (Fleek)

```bash
# 安装 Fleek CLI
npm install -g @fleek-platform/cli

# 登录
fleek login

# 构建并部署
npm run deploy:ipfs
```

### 方式 2: 部署到 Vercel

```bash
# 安装 Vercel CLI
npm install -g vercel

# 部署
vercel --prod
```

### 方式 3: 部署到 Netlify

```bash
# 安装 Netlify CLI
npm install -g netlify-cli

# 部署
netlify deploy --prod
```

### 方式 4: 手动上传到 Pinata

```bash
# 构建生产版本
npm run build:prod

# 访问 Pinata 上传 dist 文件夹
# https://app.pinata.cloud/pinmanager
```

---

## ✅ 步骤 6: 验证部署

### 1. 检查智能合约

访问区块浏览器：
- **Sepolia**: https://sepolia.etherscan.io/address/YOUR_CONTRACT_ADDRESS
- **本地**: http://localhost:8545

### 2. 测试前端应用

```bash
# 本地预览
npm run preview

# 或访问部署的URL
```

### 3. 连接 MetaMask

1. 打开应用
2. 点击"连接 MetaMask"
3. 切换到部署的网络（Sepolia）
4. 测试功能：
   - ✅ 注册设备
   - ✅ 上架能源
   - ✅ 记录维护

---

## 📊 步骤 7: 配置 The Graph (可选)

```bash
# 安装 Graph CLI
npm install -g @graphprotocol/graph-cli

# 初始化 Subgraph
graph init --product hosted-service your-username/power-platform

# 部署
graph deploy --product hosted-service your-username/power-platform
```

更新 `.env.production`:
```bash
VITE_GRAPH_URL=https://api.thegraph.com/subgraphs/name/your-username/power-platform
```

---

## 🎯 完整部署流程（推荐）

```bash
# 1. 准备环境
npm install
cp .env.production.example .env.production
# 编辑 .env.production 填写密钥

# 2. 部署智能合约
npm run compile
npm run deploy:sepolia
node scripts/update-config.js sepolia

# 3. （可选）验证合约
npm run verify:sepolia YOUR_CONTRACT_ADDRESS

# 4. 部署前端
npm run build:prod
# 选择一种方式部署：Fleek/Vercel/Netlify

# 5. 测试
# 访问部署的 URL
# 连接 MetaMask
# 测试所有功能
```

---

## 🔧 常用命令速查

```bash
# 开发
npm run dev                    # 启动开发服务器
npm run build                  # 构建开发版本
npm run build:prod            # 构建生产版本

# 智能合约
npm run compile               # 编译合约
npm run deploy:sepolia        # 部署到 Sepolia
npm run deploy:mumbai         # 部署到 Mumbai
npm run verify:sepolia ADDR   # 验证合约

# 工具
npm run node                  # 启动本地节点
npm run clean                 # 清理缓存
npm run test                  # 运行测试
```

---

## 📋 环境变量速查

### 必须配置（智能合约）
```bash
DEPLOYER_PRIVATE_KEY=         # 部署者私钥
VITE_INFURA_KEY=              # Infura API Key
```

### 必须配置（应用功能）
```bash
VITE_PINATA_API_KEY=          # Pinata API Key
VITE_PINATA_SECRET_KEY=       # Pinata Secret
VITE_PINATA_JWT=              # Pinata JWT
```

### 可选配置
```bash
VITE_GRAPH_URL=               # The Graph Subgraph URL
VITE_GOOGLE_MAPS_KEY=         # Google Maps API Key
ETHERSCAN_API_KEY=            # Etherscan API Key（验证合约用）
```

---

## ❓ 常见问题

### Q: 部署失败 "insufficient funds"?
**A:** 确保钱包有足够的测试ETH。访问水龙头: https://sepoliafaucet.com/

### Q: MetaMask 连接失败?
**A:** 
1. 检查网络是否正确（Sepolia/Mumbai）
2. 清除浏览器缓存
3. 在 MetaMask 中重新连接

### Q: 找不到合约地址?
**A:** 运行 `node scripts/update-config.js sepolia` 自动更新配置

### Q: IPFS 上传失败?
**A:** 
1. 检查 Pinata API Key 是否正确
2. 确认 API Key 权限
3. 检查文件大小限制

---

## 🎉 部署成功！

现在您的去中心化电力数据平台已经上线！

### 下一步：

1. ✅ 分享应用 URL 给用户
2. ✅ 监控合约交易
3. ✅ 收集用户反馈
4. ✅ 持续改进功能

### 有用的资源：

- 📚 [完整部署指南](./DEPLOYMENT_GUIDE.md)
- 🔧 [Hardhat 文档](https://hardhat.org)
- 🦊 [MetaMask 文档](https://docs.metamask.io)
- 📌 [Pinata 文档](https://docs.pinata.cloud)

---

**祝您部署顺利！🚀**
