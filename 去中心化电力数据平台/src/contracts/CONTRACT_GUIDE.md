# 📜 DePowerGrid 智能合约技术文档

## 一、合约概述

**合约名称**: `DePowerGrid.sol`  
**Solidity 版本**: ^0.8.20  
**主网**: 以太坊 (或兼容 EVM 的链)  
**测试网**: Sepolia

---

## 二、智能合约核心功能函数清单

### 📋 功能分类

| 类别 | 函数数量 | 说明 |
|------|---------|------|
| **设备管理** | 4个 | 注册、数据上报、查询 |
| **能源交易** | 4个 | 创建订单、完成交易、取消 |
| **预测维护** | 3个 | 异常上报、维护证明、奖励 |
| **辅助查询** | 3个 | 价格查询、余额查询等 |
| **总计** | **14个主要函数** | |

---

## 三、详细函数列表

### 🔧 1. 设备注册与数据管理 (4个函数)

#### 1.1 `registerDevice()`
```solidity
function registerDevice(
    string memory _deviceId,    // 设备ID，如 "DG-001"
    string memory _metadata     // 设备元数据，如 "太阳能板型号X，北京朝阳区"
) external
```

**功能**: 将电力设备注册到区块链  
**调用者**: 设备所有者  
**Gas 消耗**: ~150,000  
**触发事件**: `DeviceRegistered`  

**实际例子**:
```javascript
// 用户操作：在网页点击"注册设备"
// MetaMask弹窗显示：
registerDevice("DG-001", "SolarPanel-Model-X, Beijing")
// ✅ 交易确认后，设备信息永久上链
```

---

#### 1.2 `submitMeterReading()`
```solidity
function submitMeterReading(
    string memory _deviceId,    // 设备ID
    uint256 _kWhReading         // 电量读数，18位精度 (125.5 kWh = 125.5e18)
) external
```

**功能**: 提交设备实时电量数据  
**调用者**: 设备所有者  
**Gas 消耗**: ~100,000  
**触发事件**: `MeterReadingSubmitted`, 可能触发 `DeviceHealthUpdated`  

**内部逻辑**:
1. 记录电量读数到链上
2. 自动分析设备健康度
3. 如果健康度 < 50，触发 `MaintenanceTriggered` 预警事件

**实际例子**:
```javascript
// 用户在网页输入：125.5 kWh
// 前端转换为: 125.5e18 (Wei精度)
submitMeterReading("DG-001", "125500000000000000000")
// ✅ 链上记录：
// - 时间戳: 2025-11-13 10:30:00
// - 读数: 125.5 kWh
// - 健康度: 85分 (AI自动计算)
```

---

#### 1.3 `getDeviceHealth()`
```solidity
function getDeviceHealth(
    string memory _deviceId     // 设备ID
) external view returns (uint8) // 返回健康度 0-100
```

**功能**: 查询设备当前健康度评分  
**调用者**: 任何人 (公开可查)  
**Gas 消耗**: 0 (view函数，不消耗gas)  

---

#### 1.4 `getRecentReadings()`
```solidity
function getRecentReadings(
    string memory _deviceId,    // 设备ID
    uint256 _count              // 返回最近N条记录
) external view returns (MeterReading[] memory)
```

**功能**: 获取设备最近的电量读数历史  
**调用者**: 任何人  
**Gas 消耗**: 0 (view函数)  

**返回数据示例**:
```json
[
  {
    "deviceId": "DG-001",
    "kWhReading": 125500000000000000000,  // 125.5 kWh
    "timestamp": 1731481800,
    "reporter": "0x8b2...9c3"
  },
  {
    "deviceId": "DG-001",
    "kWhReading": 130200000000000000000,  // 130.2 kWh
    "timestamp": 1731568200,
    "reporter": "0x8b2...9c3"
  }
]
```

---

### ⚡ 2. P2P 能源交易市场 (4个函数)

#### 2.1 `createSellOrder()`
```solidity
function createSellOrder(
    uint256 _kWh,               // 出售电量
    uint256 _pricePerKWhUSD     // 单价 (USD, 18位精度)
) external returns (uint256)    // 返回订单ID
```

**功能**: 创建能源出售订单  
**调用者**: 任何人  
**Gas 消耗**: ~80,000  
**触发事件**: `SellOrderCreated`  

**实际例子**:
```javascript
// 用户操作：出售 10 kWh @ $0.15/kWh
createSellOrder(
    10000000000000000000,      // 10 kWh
    150000000000000000         // $0.15
)
// ✅ 返回订单ID: 1
// ✅ The Graph自动索引这个订单，其他用户可以立即看到
```

---

#### 2.2 `createBuyOrder()`
```solidity
function createBuyOrder(
    uint256 _kWh,               // 购买电量
    uint256 _maxPricePerKWhUSD  // 最高单价 (USD)
) external payable returns (uint256)
```

**功能**: 创建能源购买订单并锁定资金  
**调用者**: 任何人  
**Gas 消耗**: ~120,000  
**触发事件**: `BuyOrderCreated`  

**关键点**: 
- 调用时需要发送足够的ETH（根据Chainlink价格计算）
- ETH会被锁定在合约中，直到交易完成或取消

---

#### 2.3 `fulfillOrder()`
```solidity
function fulfillOrder(
    uint256 _orderId            // 订单ID
) external payable
```

**功能**: 完成订单交易（买家或卖家）  
**调用者**: 订单的另一方  
**Gas 消耗**: ~150,000  
**触发事件**: `OrderFulfilled`  

**核心逻辑 - Chainlink集成**:
```solidity
// 1. 调用Chainlink预言机获取实时ETH/USD价格
(, int256 price, , ,) = priceFeed.latestRoundData();
// 例如: price = 250000000000 (代表 $2500/ETH, 8位精度)

// 2. 计算需要的ETH
// 订单总价 = 10 kWh × $0.15 = $1.50
// ETH数量 = $1.50 / $2500 = 0.0006 ETH
uint256 requiredETH = (totalUSD * 1e18) / (price * 1e10);

// 3. 自动结算
payable(seller).transfer(requiredETH);
```

---

#### 2.4 `cancelOrder()`
```solidity
function cancelOrder(
    uint256 _orderId            // 订单ID
) external
```

**功能**: 取消订单并退款  
**调用者**: 订单创建者  
**Gas 消耗**: ~50,000  

---

### 🔧 3. 预测性维护 (3个函数)

#### 3.1 `reportDeviceAnomaly()`
```solidity
function reportDeviceAnomaly(
    string memory _deviceId     // 设备ID
) external
```

**功能**: 手动上报设备异常，触发健康度重新评估  
**调用者**: 任何人  
**Gas 消耗**: ~80,000  
**触发事件**: 可能触发 `MaintenanceTriggered`  

---

#### 3.2 `submitMaintenanceProof()`
```solidity
function submitMaintenanceProof(
    string memory _deviceId,    // 设备ID
    bytes32 _proofHash          // 维护证明哈希 (如IPFS哈希)
) external
```

**功能**: 提交维护完成证明并自动获得奖励  
**调用者**: 维护人员  
**Gas 消耗**: ~120,000  
**触发事件**: `MaintenanceCompleted`  

**奖励计算**:
```solidity
// 健康度从45提升到85 = 提升40分
// 奖励 = 40 × 0.001 ETH = 0.04 ETH
uint8 improvement = healthScoreAfter - healthScoreBefore;
uint256 reward = improvement * 0.001 ether;
payable(maintainer).transfer(reward);
```

---

#### 3.3 `claimMaintenanceReward()`
```solidity
function claimMaintenanceReward(
    string memory _deviceId     // 设备ID
) external
```

**功能**: 领取维护奖励（预留函数）  
**当前状态**: 暂未实现，奖励在 `submitMaintenanceProof` 中自动发放  

---

### 📊 4. 辅助查询函数 (3个)

#### 4.1 `getLatestETHPrice()`
```solidity
function getLatestETHPrice() 
    external view returns (uint256)
```

**功能**: 获取Chainlink最新ETH/USD价格  
**返回**: 价格（18位精度）  
**示例**: 返回 `2500000000000000000000` = $2500/ETH  

---

#### 4.2 `getContractBalance()`
```solidity
function getContractBalance() 
    external view returns (uint256)
```

**功能**: 查询合约ETH余额（用于支付维护奖励）  

---

#### 4.3 `receive()`
```solidity
receive() external payable {}
```

**功能**: 接收ETH转账，补充合约余额  

---

## 四、Chainlink 预言机使用详解

### 🔗 Chainlink在合约中的作用

#### 问题背景
区块链是一个"封闭的世界"，智能合约无法直接访问外部数据（如电价、汇率）。这被称为"**预言机问题**"。

#### Chainlink 解决方案
Chainlink 是一个去中心化的预言机网络，通过多节点验证将外部数据安全地传输到区块链上。

---

### 📡 在 DePowerGrid 中的使用

#### 1. 合约初始化
```solidity
// 构造函数中连接Chainlink ETH/USD价格预言机
constructor(address _priceFeedAddress) {
    priceFeed = AggregatorV3Interface(_priceFeedAddress);
}

// Sepolia测试网地址
// 0x694AA1769357215DE4FAC081bf1f309aDC325306
```

#### 2. 获取实时价格
```solidity
function _convertUSDtoETH(uint256 _amountUSD) internal view returns (uint256) {
    // 调用Chainlink预言机
    (
        /* uint80 roundID */,
        int256 price,           // 核心数据：价格
        /* uint256 startedAt */,
        /* uint256 timeStamp */,
        /* uint80 answeredInRound */
    ) = priceFeed.latestRoundData();
    
    require(price > 0, "Invalid price from Chainlink");
    
    // 转换计算
    uint256 ethPriceUSD = uint256(price) * 1e10; // 8位精度 → 18位精度
    uint256 ethAmount = (_amountUSD * 1e18) / ethPriceUSD;
    
    return ethAmount;
}
```

#### 3. 数据流程图
```
┌──────────────────┐
│  交易所API       │ (Binance, Coinbase, Kraken...)
│  价格源1: $2500  │
└────────┬─────────┘
         │
         ├──────────┐
         │          │
┌────────▼─────────┐│
│  Chainlink节点1  ││
│  验证: $2500     ││
└────────┬─────────┘│
         │          │
    ┌────▼──────────▼───┐
    │  Chainlink聚合    │ 中位数: $2500
    │  多节点共识       │
    └────────┬──────────┘
             │
    ┌────────▼──────────┐
    │  链上价格合约     │ 写入: $2500
    │  (Price Feed)     │
    └────────┬──────────┘
             │
    ┌────────▼──────────┐
    │  DePowerGrid合约  │ 读取并使用
    │  fulfillOrder()   │
    └───────────────────┘
```

---

### 🔍 Chainlink 使用的链上数据

#### 回答问题3: 预言机用到哪些链上数据？

**答案**: Chainlink **不直接使用链上数据**，而是将**链外真实世界的数据**写入链上。

#### 数据流向

```
链外世界 ──Chainlink预言机──> 区块链
(真实电价)              (可信数据)
```

#### 具体来说：

| 数据类型 | 数据源 | 上链方式 | DePowerGrid使用场景 |
|---------|--------|---------|-------------------|
| **ETH/USD 汇率** | 交易所API | Chainlink Price Feed | `fulfillOrder()` 计算交易金额 |
| **电价 (USD/kWh)** | 政府/电网API | 自定义Chainlink Oracle | `createSellOrder()` 参考定价 |
| **天气数据** | 气象局API | Chainlink Weather Oracle | 预测太阳能发电量 (未来功能) |
| **碳价格** | 碳交易市场 | Chainlink Carbon Oracle | 碳积分计算 (未来功能) |

---

### 📊 Chainlink 数据使用示例

#### 场景：用户A卖电给用户B

```javascript
// 1. 用户A创建订单
createSellOrder(10 kWh, $0.15/kWh)
// 订单总价: 10 × $0.15 = $1.50 (USD)

// 2. 用户B点击"购买"，调用 fulfillOrder()
// 合约内部执行:

// 2.1 调用Chainlink获取实时汇率
priceFeed.latestRoundData()
// 返回: ETH = $2500

// 2.2 计算需要的ETH
requiredETH = $1.50 / $2500 = 0.0006 ETH

// 2.3 验证用户B发送的ETH是否足够
require(msg.value >= 0.0006 ETH)

// 2.4 自动结算
transfer(sellerAddress, 0.0006 ETH)
```

---

## 五、事件 (Events) - 为 The Graph 优化

### 为什么需要事件？

区块链上直接查询历史数据非常慢且昂贵。**The Graph** 通过监听事件来建立索引数据库。

### 所有事件列表

```solidity
// 设备相关
event DeviceRegistered(address indexed owner, string deviceId, uint256 timestamp);
event MeterReadingSubmitted(string indexed deviceId, uint256 kWhReading, uint256 timestamp, address indexed reporter);
event DeviceHealthUpdated(string indexed deviceId, uint8 oldScore, uint8 newScore, uint256 timestamp);

// 交易相关
event SellOrderCreated(uint256 indexed orderId, address indexed seller, uint256 kWh, uint256 pricePerKWhUSD, uint256 timestamp);
event BuyOrderCreated(uint256 indexed orderId, address indexed buyer, uint256 kWh, uint256 maxPricePerKWhUSD, uint256 timestamp);
event OrderFulfilled(uint256 indexed orderId, address indexed seller, address indexed buyer, uint256 kWh, uint256 totalPriceETH, uint256 timestamp);

// 维护相关
event MaintenanceTriggered(string indexed deviceId, uint8 healthScore, uint256 timestamp);
event MaintenanceCompleted(string indexed deviceId, address indexed maintainer, uint8 healthScoreAfter, uint256 rewardAmount, uint256 timestamp);
```

### The Graph 使用示例

#### Subgraph Schema (schema.graphql)
```graphql
type Device @entity {
  id: ID!                      # deviceId
  owner: Bytes!                # 所有者地址
  healthScore: Int!            # 健康度
  totalEnergyReported: BigInt! # 累计电量
  registeredAt: BigInt!        # 注册时间
  readings: [MeterReading!]! @derivedFrom(field: "device")
}

type MeterReading @entity {
  id: ID!                      # transactionHash-logIndex
  device: Device!              # 关联设备
  kWhReading: BigInt!          # 电量
  timestamp: BigInt!           # 时间戳
  reporter: Bytes!             # 上报者
}

type EnergyOrder @entity {
  id: ID!                      # orderId
  seller: Bytes                # 卖家
  buyer: Bytes                 # 买家
  kWh: BigInt!                 # 电量
  pricePerKWhUSD: BigInt!      # 单价
  status: OrderStatus!         # 状态
  createdAt: BigInt!           # 创建时间
  fulfilledAt: BigInt          # 完成时间
}

enum OrderStatus {
  Active
  Fulfilled
  Cancelled
}
```

#### Subgraph Mapping (mapping.ts)
```typescript
import { MeterReadingSubmitted } from "../generated/DePowerGrid/DePowerGrid"
import { Device, MeterReading } from "../generated/schema"

export function handleMeterReadingSubmitted(event: MeterReadingSubmitted): void {
  // 创建新的读数记录
  let reading = new MeterReading(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  reading.device = event.params.deviceId
  reading.kWhReading = event.params.kWhReading
  reading.timestamp = event.params.timestamp
  reading.reporter = event.params.reporter
  reading.save()
  
  // 更新设备总电量
  let device = Device.load(event.params.deviceId)
  if (device) {
    device.totalEnergyReported = device.totalEnergyReported.plus(event.params.kWhReading)
    device.save()
  }
}
```

#### 前端 GraphQL 查询
```graphql
# 查询所有活跃的出售订单
query {
  energyOrders(
    where: { status: Active, seller_not: null }
    orderBy: createdAt
    orderDirection: desc
  ) {
    id
    seller
    kWh
    pricePerKWhUSD
    createdAt
  }
}

# 查询健康度低于50的设备
query {
  devices(where: { healthScore_lt: 50 }) {
    id
    owner
    healthScore
    readings(first: 5, orderBy: timestamp, orderDirection: desc) {
      kWhReading
      timestamp
    }
  }
}
```

---

## 六、Gas 消耗估算

| 函数 | 预估Gas | ETH成本 (30 Gwei) | USD成本 (ETH=$2500) |
|------|---------|-------------------|---------------------|
| `registerDevice()` | 150,000 | 0.0045 ETH | $11.25 |
| `submitMeterReading()` | 100,000 | 0.003 ETH | $7.50 |
| `createSellOrder()` | 80,000 | 0.0024 ETH | $6.00 |
| `fulfillOrder()` | 150,000 | 0.0045 ETH | $11.25 |
| `submitMaintenanceProof()` | 120,000 | 0.0036 ETH | $9.00 |

**优化建议**:
- 部署到 Layer 2 (如 Arbitrum、Optimism) 可降低 90% 的 Gas 费
- 批量上报数据可分摊成本

---

## 七、安全考虑

### 1. 重入攻击防护
```solidity
// ✅ 先改状态，再转账
order.status = OrderStatus.Fulfilled;
payable(seller).transfer(amount); // 即使恶意合约重入，状态已改
```

### 2. 价格操纵防护
```solidity
// ✅ 使用Chainlink多节点共识价格
require(price > 0, "Invalid price");
// Chainlink会自动过滤异常数据
```

### 3. 访问控制
```solidity
// ✅ 只有设备所有者可以上报数据
require(device.owner == msg.sender, "Not device owner");
```

---

## 八、部署指南

### 1. 安装依赖
```bash
npm install --save-dev hardhat @chainlink/contracts
```

### 2. 部署脚本
```javascript
// scripts/deploy.js
async function main() {
  const DePowerGrid = await ethers.getContractFactory("DePowerGrid");
  
  // Sepolia Chainlink ETH/USD Price Feed
  const priceFeedAddress = "0x694AA1769357215DE4FAC081bf1f309aDC325306";
  
  const contract = await DePowerGrid.deploy(priceFeedAddress);
  await contract.deployed();
  
  console.log("DePowerGrid deployed to:", contract.address);
}

main();
```

### 3. 部署到测试网
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

---

## 九、总结

### 核心亮点
✅ **14个核心函数**涵盖完整业务流程  
✅ **Chainlink集成**实现可信价格  
✅ **The Graph优化**实现高效查询  
✅ **AI健康度算法**实现预测性维护  
✅ **完整事件系统**支持链下索引  

### 下一步
- [ ] 添加单元测试 (Hardhat Test)
- [ ] 安全审计 (Certik/OpenZeppelin)
- [ ] 部署到主网
- [ ] 创建 The Graph Subgraph

---

**合约地址** (部署后更新):  
- Sepolia 测试网: `0x...` (待部署)
- 以太坊主网: `0x...` (待部署)
