import { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'zh' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  zh: {
    // Header
    'app.title': 'DePowerGrid',
    'app.subtitle': '去中心化电力数据平台',
    'wallet.connect': '连接钱包',
    'wallet.connecting': '连接中...',
    'wallet.balance': '余额',
    'wallet.connected': '钱包连接成功！',
    'wallet.disconnected': '钱包已断开连接',
    
    // Welcome Page
    'welcome.title': '欢迎来到 DePowerGrid',
    'welcome.description': '连接您的钱包开始使用去中心化电力数据平台',
    
    // Tabs
    'tab.devices': '我的设备 & 数据上报',
    'tab.market': '数据市场 & P2P能源交易',
    'tab.maintenance': '维护服务 & 预警',
    
    // Device Management
    'device.register.title': '注册新设备',
    'device.register.description': '将您的电力设备注册到区块链，开始记录数据',
    'device.id.label': '设备ID',
    'device.id.placeholder': '例如: DG-003',
    'device.register.button': '注册设备',
    'device.registering': '注册中...',
    'device.register.hint': '注册将调用智能合约的',
    'device.register.function': '函数',
    'device.submit.title': '上报电量数据',
    'device.submit.description': '提交设备的实时电量读数到区块链',
    'device.select.label': '选择设备',
    'device.select.placeholder': '-- 请选择设备 --',
    'device.reading.label': '当前电量 (kWh)',
    'device.reading.placeholder': '例如: 125.5',
    'device.submit.button': '上报数据',
    'device.submitting': '提交中...',
    'device.submit.hint': '数据将通过',
    'device.list.title': '我的设备列表',
    'device.list.description': '您注册的所有设备及其状态',
    'device.list.empty': '暂无设备，请先注册设备',
    'device.status.good': '良好',
    'device.status.warning': '需维护',
    'device.status.error': '故障',
    'device.status.unknown': '未知',
    'device.latest.reading': '最新读数',
    'device.register.success': '设备注册成功！',
    'device.register.success.desc': '已上链',
    'device.submit.success': '数据上报成功！',
    'device.submit.success.desc': '的读数已记录到区块链',
    'device.id.required': '请输入设备ID',
    'device.select.required': '请选择设备并输入电量读数',
    
    // Energy Market
    'market.price.title': '实时电价 (来自 Chainlink 预言机)',
    'market.price.source': '数据来源：Chainlink ETH/USD Price Feed',
    'market.create.title': '创建出售订单',
    'market.create.description': '将您的多余电量出售给其他用户',
    'market.amount.label': '出售电量 (kWh)',
    'market.amount.placeholder': '例如: 10',
    'market.estimated.income': '预计收入',
    'market.create.button': '发布出售订单',
    'market.creating': '创建中...',
    'market.create.hint': '订单将通过',
    'market.create.function': '函数创建',
    'market.orders.title': '现有购买订单',
    'market.orders.description': '通过 The Graph 索引的活跃订单（实时更新）',
    'market.orders.empty': '暂无活跃的购买订单',
    'market.order.buying': '求购',
    'market.order.buyer': '买家',
    'market.order.total': '总价',
    'market.order.sell': '出售给此买家',
    'market.query.example': 'The Graph 查询示例：',
    'market.process.title': '交易流程说明',
    'market.process.step1': '您创建出售订单并锁定电量资产到智能合约',
    'market.process.step2': '买家点击购买，触发',
    'market.process.step3': 'Chainlink 预言机提供实时 ETH/USD 汇率进行结算',
    'market.process.step4': '智能合约自动完成电量和资金的交换',
    'market.create.success': '出售订单创建成功！',
    'market.order.processing': '正在处理交易...',
    'market.order.confirm': '请在MetaMask中确认交易',
    'market.order.success': '交易完成！',
    'market.order.success.desc': '获得',
    'market.amount.required': '请输入有效的电量数值',
    
    // Maintenance Service
    'maintenance.alert.title': '系统预警中心',
    'maintenance.alert.description': '基于链上数据智能分析的设备健康预警',
    'maintenance.alert.empty': '太棒了！所有设备运行正常',
    'maintenance.alert.health': '健康度',
    'maintenance.alert.ai': 'AI 智能预测：',
    'maintenance.alert.ai.desc': '系统通过分析设备的历史数据（电压、电流、功率等），使用机器学习算法预测设备健康状态，在故障发生前提前预警，帮助维护人员及时介入。',
    'maintenance.submit.title': '提交维护证明',
    'maintenance.submit.description': '完成设备维护后，上传证明并更新设备状态',
    'maintenance.device.label': '设备ID',
    'maintenance.device.placeholder': '例如: DG-002',
    'maintenance.proof.label': '维护证明文件',
    'maintenance.proof.select': '选择文件',
    'maintenance.proof.selected': '已选择文件',
    'maintenance.submit.button': '提交维护完成证明',
    'maintenance.submitting': '提交中...',
    'maintenance.submit.hint': '证明的哈希值将通过',
    'maintenance.submit.function': '上链',
    'maintenance.history.title': '维护历史记录',
    'maintenance.history.description': '已完成的维护任务',
    'maintenance.history.empty': '暂无维护记录',
    'maintenance.history.resolved': '已解决',
    'maintenance.workflow.title': '预测性维护工作流程',
    'maintenance.workflow.step1': '设备持续上报电量、电压、电流等数据到区块链',
    'maintenance.workflow.step2': 'AI 模型分析数据趋势，计算设备健康度评分（0-100）',
    'maintenance.workflow.step3': '当健康度低于阈值（如50），智能合约触发预警事件',
    'maintenance.workflow.step4': '维护方响应预警，完成维护后提交证明上链',
    'maintenance.workflow.step5': '智能合约验证后释放维护奖励，更新设备状态',
    'maintenance.query.title': 'The Graph 查询健康度低的设备：',
    'maintenance.submit.success': '维护证明提交成功！',
    'maintenance.submit.success.desc': '的状态已更新',
    'maintenance.file.selected': '文件已选择',
    'maintenance.file.selected.desc': '证明文件的哈希将被上传到区块链',
    'maintenance.device.required': '请输入设备ID',
    
    // Footer
    'footer.blockchain': '区块链存储',
    'footer.blockchain.desc': '所有数据上链，不可篡改',
    'footer.chainlink': 'Chainlink预言机',
    'footer.chainlink.desc': '实时获取可信电价数据',
    'footer.thegraph': 'The Graph索引',
    'footer.thegraph.desc': '高效查询链上数据',
  },
  
  en: {
    // Header
    'app.title': 'DePowerGrid',
    'app.subtitle': 'Decentralized Power Data Platform',
    'wallet.connect': 'Connect Wallet',
    'wallet.connecting': 'Connecting...',
    'wallet.balance': 'Balance',
    'wallet.connected': 'Wallet connected successfully!',
    'wallet.disconnected': 'Wallet disconnected',
    
    // Welcome Page
    'welcome.title': 'Welcome to DePowerGrid',
    'welcome.description': 'Connect your wallet to start using the decentralized power data platform',
    
    // Tabs
    'tab.devices': 'My Devices & Data Reporting',
    'tab.market': 'Data Market & P2P Energy Trading',
    'tab.maintenance': 'Maintenance Service & Alerts',
    
    // Device Management
    'device.register.title': 'Register New Device',
    'device.register.description': 'Register your power device on blockchain and start recording data',
    'device.id.label': 'Device ID',
    'device.id.placeholder': 'e.g. DG-003',
    'device.register.button': 'Register Device',
    'device.registering': 'Registering...',
    'device.register.hint': 'This will call the smart contract',
    'device.register.function': 'function',
    'device.submit.title': 'Submit Meter Reading',
    'device.submit.description': 'Submit real-time power meter readings to blockchain',
    'device.select.label': 'Select Device',
    'device.select.placeholder': '-- Please select device --',
    'device.reading.label': 'Current Power (kWh)',
    'device.reading.placeholder': 'e.g. 125.5',
    'device.submit.button': 'Submit Data',
    'device.submitting': 'Submitting...',
    'device.submit.hint': 'Data will be submitted through',
    'device.list.title': 'My Device List',
    'device.list.description': 'All your registered devices and their status',
    'device.list.empty': 'No devices yet, please register a device first',
    'device.status.good': 'Good',
    'device.status.warning': 'Needs Maintenance',
    'device.status.error': 'Error',
    'device.status.unknown': 'Unknown',
    'device.latest.reading': 'Latest Reading',
    'device.register.success': 'Device registered successfully!',
    'device.register.success.desc': 'has been added to blockchain',
    'device.submit.success': 'Data submitted successfully!',
    'device.submit.success.desc': 'reading has been recorded on blockchain',
    'device.id.required': 'Please enter device ID',
    'device.select.required': 'Please select device and enter power reading',
    
    // Energy Market
    'market.price.title': 'Real-time Price (from Chainlink Oracle)',
    'market.price.source': 'Data source: Chainlink ETH/USD Price Feed',
    'market.create.title': 'Create Sell Order',
    'market.create.description': 'Sell your surplus energy to other users',
    'market.amount.label': 'Energy Amount (kWh)',
    'market.amount.placeholder': 'e.g. 10',
    'market.estimated.income': 'Estimated Income',
    'market.create.button': 'Publish Sell Order',
    'market.creating': 'Creating...',
    'market.create.hint': 'Order will be created through',
    'market.create.function': 'function',
    'market.orders.title': 'Available Buy Orders',
    'market.orders.description': 'Active orders indexed by The Graph (real-time)',
    'market.orders.empty': 'No active buy orders',
    'market.order.buying': 'Buying',
    'market.order.buyer': 'Buyer',
    'market.order.total': 'Total',
    'market.order.sell': 'Sell to This Buyer',
    'market.query.example': 'The Graph Query Example:',
    'market.process.title': 'Transaction Process',
    'market.process.step1': 'You create a sell order and lock energy assets in smart contract',
    'market.process.step2': 'Buyer clicks purchase, triggering',
    'market.process.step3': 'Chainlink oracle provides real-time ETH/USD rate for settlement',
    'market.process.step4': 'Smart contract automatically completes energy and fund exchange',
    'market.create.success': 'Sell order created successfully!',
    'market.order.processing': 'Processing transaction...',
    'market.order.confirm': 'Please confirm transaction in MetaMask',
    'market.order.success': 'Transaction completed!',
    'market.order.success.desc': 'received',
    'market.amount.required': 'Please enter valid energy amount',
    
    // Maintenance Service
    'maintenance.alert.title': 'System Alert Center',
    'maintenance.alert.description': 'Smart device health alerts based on on-chain data analysis',
    'maintenance.alert.empty': 'Great! All devices are running normally',
    'maintenance.alert.health': 'Health',
    'maintenance.alert.ai': 'AI Smart Prediction:',
    'maintenance.alert.ai.desc': 'The system analyzes historical device data (voltage, current, power, etc.) using machine learning algorithms to predict device health status, alerting maintenance personnel before failures occur.',
    'maintenance.submit.title': 'Submit Maintenance Proof',
    'maintenance.submit.description': 'Upload proof and update device status after completing maintenance',
    'maintenance.device.label': 'Device ID',
    'maintenance.device.placeholder': 'e.g. DG-002',
    'maintenance.proof.label': 'Maintenance Proof File',
    'maintenance.proof.select': 'Select File',
    'maintenance.proof.selected': 'File Selected',
    'maintenance.submit.button': 'Submit Maintenance Proof',
    'maintenance.submitting': 'Submitting...',
    'maintenance.submit.hint': 'Proof hash will be submitted through',
    'maintenance.submit.function': 'to blockchain',
    'maintenance.history.title': 'Maintenance History',
    'maintenance.history.description': 'Completed maintenance tasks',
    'maintenance.history.empty': 'No maintenance records',
    'maintenance.history.resolved': 'Resolved',
    'maintenance.workflow.title': 'Predictive Maintenance Workflow',
    'maintenance.workflow.step1': 'Devices continuously report power, voltage, current data to blockchain',
    'maintenance.workflow.step2': 'AI model analyzes data trends, calculates device health score (0-100)',
    'maintenance.workflow.step3': 'When health score falls below threshold (e.g. 50), smart contract triggers alert',
    'maintenance.workflow.step4': 'Maintenance team responds to alert, submits proof on-chain after completion',
    'maintenance.workflow.step5': 'Smart contract verifies and releases maintenance reward, updates device status',
    'maintenance.query.title': 'The Graph query for low-health devices:',
    'maintenance.submit.success': 'Maintenance proof submitted successfully!',
    'maintenance.submit.success.desc': 'status has been updated',
    'maintenance.file.selected': 'File selected',
    'maintenance.file.selected.desc': 'Proof file hash will be uploaded to blockchain',
    'maintenance.device.required': 'Please enter device ID',
    
    // Footer
    'footer.blockchain': 'Blockchain Storage',
    'footer.blockchain.desc': 'All data on-chain, immutable',
    'footer.chainlink': 'Chainlink Oracle',
    'footer.chainlink.desc': 'Real-time trusted price data',
    'footer.thegraph': 'The Graph Indexing',
    'footer.thegraph.desc': 'Efficient on-chain data queries',
  }
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('zh');

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
