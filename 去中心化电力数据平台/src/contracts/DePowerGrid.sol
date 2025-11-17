// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

/**
 * @title DePowerGrid - 去中心化电力数据平台
 * @notice 管理设备注册、数据上报、P2P能源交易和预测性维护
 * @dev 集成Chainlink预言机获取实时电价
 */
contract DePowerGrid {
    
    // ============ 状态变量 ============
    
    address public owner;
    AggregatorV3Interface internal priceFeed; // Chainlink价格预言机
    
    uint256 public constant HEALTH_SCORE_THRESHOLD = 50; // 健康度阈值
    uint256 public deviceCount = 0;
    uint256 public orderCount = 0;
    uint256 public maintenanceCount = 0;
    
    // ============ 数据结构 ============
    
    // 设备信息
    struct Device {
        string deviceId;           // 设备ID
        address owner;             // 设备所有者
        string deviceType;         // 设备类型（Solar Panel, Wind Turbine等）
        uint256 capacity;          // 设备容量(kWh)
        uint256 registeredAt;      // 注册时间
        bool isActive;             // 是否激活
        uint256 totalProduction;   // 累计发电量
        uint256 healthScore;       // 健康度评分(0-100)
        address assignedMaintainer; // 指派的维修人员
    }
    
    // 设备数据记录
    struct DeviceData {
        string deviceId;
        uint256 timestamp;
        uint256 kWhReading;        // 电量读数
        uint256 voltage;           // 电压
        uint256 current;           // 电流
        bytes32 dataHash;          // 数据完整性哈希
        string encryptedAESKey;    // 加密的AES密钥（用于解密敏感数据）
        string ipfsImageHash;      // 设备图片IPFS哈希
        string ipfsGPSHash;        // GPS坐标IPFS哈希
        address submittedBy;
    }
    
    // 能源交易订单
    struct EnergyOrder {
        uint256 orderId;
        address seller;            // 卖家
        address buyer;             // 买家
        string deviceId;           // 关联设备
        uint256 kWhAmount;         // 电量数量
        uint256 pricePerKWh;       // 每kWh价格(wei)
        uint256 totalPrice;        // 总价
        uint256 createdAt;
        OrderStatus status;
    }
    
    enum OrderStatus {
        Active,      // 活跃中
        Completed,   // 已完成
        Cancelled    // 已取消
    }
    
    // 维护记录
    struct MaintenanceRecord {
        uint256 recordId;
        string deviceId;
        address maintainer;        // 维修人员
        uint256 triggeredAt;       // 预警触发时间
        uint256 completedAt;       // 完成时间
        uint256 healthScoreBefore; // 维修前健康度
        uint256 healthScoreAfter;  // 维修后健康度
        string ipfsProofHash;      // 维修证明IPFS哈希
        bytes32 proofHash;         // 证明文件的哈希
        MaintenanceStatus status;
    }
    
    enum MaintenanceStatus {
        Pending,     // 待处理
        InProgress,  // 进行中
        Completed,   // 已完成
        Verified     // 已验证
    }
    
    // ============ 映射 ============
    
    mapping(string => Device) public devices;                        // deviceId => Device
    mapping(string => DeviceData[]) public deviceDataHistory;        // deviceId => 数据历史
    mapping(string => address) public deviceOwners;                  // deviceId => owner
    mapping(address => string[]) public ownerDevices;                // owner => deviceIds
    mapping(address => bool) public authorizedMaintainers;           // 授权的维修人员
    mapping(uint256 => EnergyOrder) public energyOrders;             // orderId => Order
    mapping(uint256 => MaintenanceRecord) public maintenanceRecords; // recordId => Record
    mapping(string => uint256[]) public deviceMaintenanceHistory;    // deviceId => recordIds
    
    // ============ 事件 ============
    
    event DeviceRegistered(
        string indexed deviceId,
        address indexed owner,
        string deviceType,
        uint256 capacity
    );
    
    event DataSubmitted(
        string indexed deviceId,
        uint256 timestamp,
        uint256 kWhReading,
        bytes32 dataHash
    );
    
    event HealthScoreUpdated(
        string indexed deviceId,
        uint256 oldScore,
        uint256 newScore
    );
    
    event MaintenanceTriggered(
        uint256 indexed recordId,
        string indexed deviceId,
        uint256 healthScore,
        address maintainer
    );
    
    event MaintenanceCompleted(
        uint256 indexed recordId,
        string indexed deviceId,
        address maintainer,
        bytes32 proofHash
    );
    
    event OrderCreated(
        uint256 indexed orderId,
        address indexed seller,
        string deviceId,
        uint256 kWhAmount,
        uint256 pricePerKWh
    );
    
    event OrderFulfilled(
        uint256 indexed orderId,
        address indexed buyer,
        address indexed seller,
        uint256 totalPrice
    );
    
    event MaintainerAuthorized(address indexed maintainer, bool status);
    
    // ============ 修饰符 ============
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only contract owner");
        _;
    }
    
    modifier onlyDeviceOwner(string memory _deviceId) {
        require(deviceOwners[_deviceId] == msg.sender, "Not device owner");
        _;
    }
    
    modifier onlyMaintainer() {
        require(authorizedMaintainers[msg.sender], "Not authorized maintainer");
        _;
    }
    
    modifier deviceExists(string memory _deviceId) {
        require(devices[_deviceId].isActive, "Device does not exist");
        _;
    }
    
    // ============ 构造函数 ============
    
    /**
     * @notice 初始化合约
     * @param _priceFeedAddress Chainlink价格预言机地址
     * 
     * Chainlink Price Feed 地址:
     * - Sepolia Testnet: 0x694AA1769357215DE4FAC081bf1f309aDC325306 (ETH/USD)
     * - Mainnet: 0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419 (ETH/USD)
     */
    constructor(address _priceFeedAddress) {
        owner = msg.sender;
        priceFeed = AggregatorV3Interface(_priceFeedAddress);
    }
    
    // ============ 设备管理功能 ============
    
    /**
     * @notice 注册新设备
     * @param _deviceId 设备唯一ID
     * @param _deviceType 设备类型
     * @param _capacity 设备容量
     * @param _maintainer 指派的维修人员地址
     */
    function registerDevice(
        string memory _deviceId,
        string memory _deviceType,
        uint256 _capacity,
        address _maintainer
    ) external {
        require(!devices[_deviceId].isActive, "Device already registered");
        require(_maintainer != address(0), "Invalid maintainer address");
        require(authorizedMaintainers[_maintainer], "Maintainer not authorized");
        
        devices[_deviceId] = Device({
            deviceId: _deviceId,
            owner: msg.sender,
            deviceType: _deviceType,
            capacity: _capacity,
            registeredAt: block.timestamp,
            isActive: true,
            totalProduction: 0,
            healthScore: 100, // 新设备健康度100%
            assignedMaintainer: _maintainer
        });
        
        deviceOwners[_deviceId] = msg.sender;
        ownerDevices[msg.sender].push(_deviceId);
        deviceCount++;
        
        emit DeviceRegistered(_deviceId, msg.sender, _deviceType, _capacity);
    }
    
    /**
     * @notice 提交设备数据
     * @param _deviceId 设备ID
     * @param _kWhReading 电量读数
     * @param _voltage 电压
     * @param _current 电流
     * @param _encryptedAESKey 加密的AES密钥
     * @param _ipfsImageHash 设备图片IPFS哈希
     * @param _ipfsGPSHash GPS坐标IPFS哈希
     * @param _dataHash 数据完整性哈希
     */
    function submitDeviceData(
        string memory _deviceId,
        uint256 _kWhReading,
        uint256 _voltage,
        uint256 _current,
        string memory _encryptedAESKey,
        string memory _ipfsImageHash,
        string memory _ipfsGPSHash,
        bytes32 _dataHash
    ) external onlyDeviceOwner(_deviceId) deviceExists(_deviceId) {
        
        DeviceData memory newData = DeviceData({
            deviceId: _deviceId,
            timestamp: block.timestamp,
            kWhReading: _kWhReading,
            voltage: _voltage,
            current: _current,
            dataHash: _dataHash,
            encryptedAESKey: _encryptedAESKey,
            ipfsImageHash: _ipfsImageHash,
            ipfsGPSHash: _ipfsGPSHash,
            submittedBy: msg.sender
        });
        
        deviceDataHistory[_deviceId].push(newData);
        devices[_deviceId].totalProduction += _kWhReading;
        
        // 计算健康度（简化版，实际应使用AI算法）
        uint256 newHealthScore = calculateHealthScore(_deviceId, _voltage, _current);
        updateHealthScore(_deviceId, newHealthScore);
        
        emit DataSubmitted(_deviceId, block.timestamp, _kWhReading, _dataHash);
    }
    
    /**
     * @notice 计算设备健康度（简化版）
     * @dev 实际生产环境应调用链下AI模型
     */
    function calculateHealthScore(
        string memory _deviceId,
        uint256 _voltage,
        uint256 _current
    ) internal view returns (uint256) {
        // 简化的健康度计算
        // 实际应该：1. 使用Chainlink Functions调用AI模型
        //          2. 或使用历史数据趋势分析
        
        uint256 baseScore = devices[_deviceId].healthScore;
        
        // 电压异常检测（假设正常范围220-240V）
        if (_voltage < 220 || _voltage > 240) {
            baseScore = baseScore > 10 ? baseScore - 10 : 0;
        }
        
        // 电流异常检测
        if (_current > 100) { // 假设100A为上限
            baseScore = baseScore > 15 ? baseScore - 15 : 0;
        }
        
        return baseScore > 100 ? 100 : baseScore;
    }
    
    /**
     * @notice 更新设备健康度
     */
    function updateHealthScore(string memory _deviceId, uint256 _newScore) internal {
        uint256 oldScore = devices[_deviceId].healthScore;
        devices[_deviceId].healthScore = _newScore;
        
        emit HealthScoreUpdated(_deviceId, oldScore, _newScore);
        
        // 如果健康度低于阈值，触发维护预警
        if (_newScore < HEALTH_SCORE_THRESHOLD && oldScore >= HEALTH_SCORE_THRESHOLD) {
            triggerMaintenance(_deviceId);
        }
    }
    
    // ============ P2P能源交易功能 ============
    
    /**
     * @notice 创建出售订单
     * @param _deviceId 设备ID
     * @param _kWhAmount 出售电量
     * @param _pricePerKWh 每kWh价格
     */
    function createSellOrder(
        string memory _deviceId,
        uint256 _kWhAmount,
        uint256 _pricePerKWh
    ) external onlyDeviceOwner(_deviceId) deviceExists(_deviceId) returns (uint256) {
        require(_kWhAmount > 0, "Invalid amount");
        require(_pricePerKWh > 0, "Invalid price");
        
        orderCount++;
        uint256 orderId = orderCount;
        
        uint256 totalPrice = _kWhAmount * _pricePerKWh;
        
        energyOrders[orderId] = EnergyOrder({
            orderId: orderId,
            seller: msg.sender,
            buyer: address(0),
            deviceId: _deviceId,
            kWhAmount: _kWhAmount,
            pricePerKWh: _pricePerKWh,
            totalPrice: totalPrice,
            createdAt: block.timestamp,
            status: OrderStatus.Active
        });
        
        emit OrderCreated(orderId, msg.sender, _deviceId, _kWhAmount, _pricePerKWh);
        
        return orderId;
    }
    
    /**
     * @notice 完成订单（买家购买）
     * @param _orderId 订单ID
     */
    function fulfillOrder(uint256 _orderId) external payable {
        EnergyOrder storage order = energyOrders[_orderId];
        
        require(order.status == OrderStatus.Active, "Order not active");
        require(msg.sender != order.seller, "Cannot buy own order");
        require(msg.value >= order.totalPrice, "Insufficient payment");
        
        // 更新订单状态
        order.buyer = msg.sender;
        order.status = OrderStatus.Completed;
        
        // 转账给卖家
        payable(order.seller).transfer(order.totalPrice);
        
        // 退还多余的金额
        if (msg.value > order.totalPrice) {
            payable(msg.sender).transfer(msg.value - order.totalPrice);
        }
        
        emit OrderFulfilled(_orderId, msg.sender, order.seller, order.totalPrice);
    }
    
    /**
     * @notice 取消订单
     * @param _orderId 订单ID
     */
    function cancelOrder(uint256 _orderId) external {
        EnergyOrder storage order = energyOrders[_orderId];
        
        require(order.seller == msg.sender, "Not order owner");
        require(order.status == OrderStatus.Active, "Order not active");
        
        order.status = OrderStatus.Cancelled;
    }
    
    /**
     * @notice 获取实时电价（从Chainlink预言机）
     * @return 最新ETH/USD价格（8位小数）
     */
    function getLatestPrice() public view returns (int) {
        (
            /* uint80 roundID */,
            int price,
            /* uint startedAt */,
            /* uint timeStamp */,
            /* uint80 answeredInRound */
        ) = priceFeed.latestRoundData();
        
        return price; // 返回的是 ETH/USD 价格，8位小数
    }
    
    /**
     * @notice 根据USD价格计算ETH数量
     * @param _usdAmount USD金额（2位小数，例如100表示$1.00）
     * @return ETH数量（wei）
     */
    function convertUSDToETH(uint256 _usdAmount) public view returns (uint256) {
        int ethPrice = getLatestPrice(); // ETH/USD，8位小数
        require(ethPrice > 0, "Invalid price from oracle");
        
        // _usdAmount (2位小数) / ethPrice (8位小数) * 10^18
        uint256 ethAmount = (_usdAmount * 1e18 * 1e8) / uint256(ethPrice) / 100;
        
        return ethAmount;
    }
    
    // ============ 预测性维护功能 ============
    
    /**
     * @notice 触发维护预警
     * @param _deviceId 设备ID
     */
    function triggerMaintenance(string memory _deviceId) internal {
        Device storage device = devices[_deviceId];
        
        maintenanceCount++;
        uint256 recordId = maintenanceCount;
        
        maintenanceRecords[recordId] = MaintenanceRecord({
            recordId: recordId,
            deviceId: _deviceId,
            maintainer: device.assignedMaintainer,
            triggeredAt: block.timestamp,
            completedAt: 0,
            healthScoreBefore: device.healthScore,
            healthScoreAfter: 0,
            ipfsProofHash: "",
            proofHash: bytes32(0),
            status: MaintenanceStatus.Pending
        });
        
        deviceMaintenanceHistory[_deviceId].push(recordId);
        
        emit MaintenanceTriggered(
            recordId,
            _deviceId,
            device.healthScore,
            device.assignedMaintainer
        );
    }
    
    /**
     * @notice 提交维护完成证明
     * @param _recordId 维护记录ID
     * @param _ipfsProofHash 维护证明IPFS哈希
     * @param _proofHash 证明文件的哈希值
     */
    function submitMaintenanceProof(
        uint256 _recordId,
        string memory _ipfsProofHash,
        bytes32 _proofHash
    ) external onlyMaintainer {
        MaintenanceRecord storage record = maintenanceRecords[_recordId];
        
        require(record.maintainer == msg.sender, "Not assigned maintainer");
        require(
            record.status == MaintenanceStatus.Pending || 
            record.status == MaintenanceStatus.InProgress,
            "Invalid status"
        );
        
        record.completedAt = block.timestamp;
        record.ipfsProofHash = _ipfsProofHash;
        record.proofHash = _proofHash;
        record.status = MaintenanceStatus.Completed;
        
        // 恢复设备健康度（简化处理，实际应该重新评估）
        string memory deviceId = record.deviceId;
        devices[deviceId].healthScore = 100;
        record.healthScoreAfter = 100;
        
        emit MaintenanceCompleted(_recordId, deviceId, msg.sender, _proofHash);
    }
    
    /**
     * @notice 验证维护证明
     * @param _recordId 维护记录ID
     * @param _proofHash 证明文件的哈希值
     * @return 是否验证通过
     */
    function verifyMaintenanceProof(
        uint256 _recordId,
        bytes32 _proofHash
    ) external view returns (bool) {
        MaintenanceRecord storage record = maintenanceRecords[_recordId];
        return record.proofHash == _proofHash;
    }
    
    // ============ 管理员功能 ============
    
    /**
     * @notice 授权维修人员
     * @param _maintainer 维修人员地址
     * @param _status 授权状态
     */
    function authorizeMaintainer(address _maintainer, bool _status) external onlyOwner {
        authorizedMaintainers[_maintainer] = _status;
        emit MaintainerAuthorized(_maintainer, _status);
    }
    
    /**
     * @notice 批量授权维修人员
     * @param _maintainers 维修人员地址数组
     */
    function batchAuthorizeMaintainers(address[] memory _maintainers) external onlyOwner {
        for (uint i = 0; i < _maintainers.length; i++) {
            authorizedMaintainers[_maintainers[i]] = true;
            emit MaintainerAuthorized(_maintainers[i], true);
        }
    }
    
    /**
     * @notice 更新价格预言机地址
     * @param _newPriceFeed 新的预言机地址
     */
    function updatePriceFeed(address _newPriceFeed) external onlyOwner {
        priceFeed = AggregatorV3Interface(_newPriceFeed);
    }
    
    // ============ 查询功能 ============
    
    /**
     * @notice 获取设备数据历史记录数量
     */
    function getDeviceDataCount(string memory _deviceId) external view returns (uint256) {
        return deviceDataHistory[_deviceId].length;
    }
    
    /**
     * @notice 获取设备的维护历史记录数量
     */
    function getMaintenanceHistoryCount(string memory _deviceId) external view returns (uint256) {
        return deviceMaintenanceHistory[_deviceId].length;
    }
    
    /**
     * @notice 获取用户拥有的设备数量
     */
    function getOwnerDeviceCount(address _owner) external view returns (uint256) {
        return ownerDevices[_owner].length;
    }
    
    /**
     * @notice 获取设备详细信息
     */
    function getDeviceInfo(string memory _deviceId) external view returns (
        address deviceOwner,
        string memory deviceType,
        uint256 capacity,
        uint256 totalProduction,
        uint256 healthScore,
        address assignedMaintainer,
        bool isActive
    ) {
        Device storage device = devices[_deviceId];
        return (
            device.owner,
            device.deviceType,
            device.capacity,
            device.totalProduction,
            device.healthScore,
            device.assignedMaintainer,
            device.isActive
        );
    }
    
    /**
     * @notice 获取最新的设备数据
     */
    function getLatestDeviceData(string memory _deviceId) external view returns (
        uint256 timestamp,
        uint256 kWhReading,
        uint256 voltage,
        uint256 current,
        string memory ipfsImageHash
    ) {
        DeviceData[] storage history = deviceDataHistory[_deviceId];
        require(history.length > 0, "No data available");
        
        DeviceData storage latest = history[history.length - 1];
        return (
            latest.timestamp,
            latest.kWhReading,
            latest.voltage,
            latest.current,
            latest.ipfsImageHash
        );
    }
    
    /**
     * @notice 获取活跃的能源订单列表
     * @param _startIndex 起始索引
     * @param _count 返回数量
     */
    function getActiveOrders(uint256 _startIndex, uint256 _count) 
        external 
        view 
        returns (uint256[] memory) 
    {
        uint256[] memory activeOrderIds = new uint256[](_count);
        uint256 foundCount = 0;
        
        for (uint256 i = _startIndex; i <= orderCount && foundCount < _count; i++) {
            if (energyOrders[i].status == OrderStatus.Active) {
                activeOrderIds[foundCount] = i;
                foundCount++;
            }
        }
        
        return activeOrderIds;
    }
    
    // ============ 辅助功能 ============
    
    /**
     * @notice 提取合约余额（仅限owner）
     */
    function withdraw() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }
    
    /**
     * @notice 获取合约余额
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @notice 接收ETH
     */
    receive() external payable {}
}
