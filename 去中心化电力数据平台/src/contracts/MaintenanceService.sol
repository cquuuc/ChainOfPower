// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title MaintenanceService
 * @dev 维护服务合约 - 管理设备维护记录和预测性分析
 */
contract MaintenanceService {
    // 维护记录结构
    struct MaintenanceRecord {
        uint256 recordId;          // 记录ID
        string deviceId;           // 设备ID
        address maintainer;        // 维修人员
        uint256 timestamp;         // 时间戳
        string ipfsHash;           // IPFS数据哈希
        bytes32 dataHash;          // 数据完整性哈希
        string issueType;          // 问题类型
        string status;             // 状态: pending, completed, verified
        uint256 healthScore;       // 健康度评分 (0-100)
    }
    
    // 设备健康状态
    struct DeviceHealth {
        string deviceId;
        uint256 latestHealthScore;
        uint256 lastCheckTime;
        uint256 totalMaintenance;
        bool needsAttention;
    }
    
    // 状态变量
    uint256 public recordCounter;
    mapping(uint256 => MaintenanceRecord) public records;
    mapping(string => DeviceHealth) public deviceHealth;
    mapping(string => uint256[]) public deviceRecords;
    mapping(address => uint256[]) public maintainerRecords;
    
    // 事件
    event MaintenanceRecorded(
        uint256 indexed recordId,
        string indexed deviceId,
        address indexed maintainer,
        uint256 healthScore
    );
    
    event HealthScoreUpdated(
        string indexed deviceId,
        uint256 oldScore,
        uint256 newScore
    );
    
    event MaintenanceCompleted(
        uint256 indexed recordId,
        string indexed deviceId
    );
    
    event AlertIssued(
        string indexed deviceId,
        uint256 healthScore,
        string reason
    );
    
    /**
     * @dev 记录维护
     */
    function recordMaintenance(
        string memory deviceId,
        string memory ipfsHash,
        bytes32 dataHash,
        string memory issueType,
        uint256 healthScore
    ) external returns (uint256) {
        require(bytes(deviceId).length > 0, "Invalid device ID");
        require(healthScore <= 100, "Invalid health score");
        
        uint256 recordId = recordCounter++;
        
        records[recordId] = MaintenanceRecord({
            recordId: recordId,
            deviceId: deviceId,
            maintainer: msg.sender,
            timestamp: block.timestamp,
            ipfsHash: ipfsHash,
            dataHash: dataHash,
            issueType: issueType,
            status: "pending",
            healthScore: healthScore
        });
        
        // 更新设备健康状态
        _updateDeviceHealth(deviceId, healthScore);
        
        // 添加到索引
        deviceRecords[deviceId].push(recordId);
        maintainerRecords[msg.sender].push(recordId);
        
        emit MaintenanceRecorded(recordId, deviceId, msg.sender, healthScore);
        
        // 如果健康度低于阈值，发出警报
        if (healthScore < 50) {
            emit AlertIssued(deviceId, healthScore, "Critical health score");
        }
        
        return recordId;
    }
    
    /**
     * @dev 更新维护状态
     */
    function updateMaintenanceStatus(
        uint256 recordId,
        string memory status
    ) external {
        require(recordId < recordCounter, "Record does not exist");
        MaintenanceRecord storage record = records[recordId];
        require(record.maintainer == msg.sender, "Not authorized");
        
        record.status = status;
        
        if (keccak256(bytes(status)) == keccak256(bytes("completed"))) {
            emit MaintenanceCompleted(recordId, record.deviceId);
        }
    }
    
    /**
     * @dev 更新健康评分
     */
    function updateHealthScore(
        string memory deviceId,
        uint256 newScore
    ) external {
        require(newScore <= 100, "Invalid health score");
        
        DeviceHealth storage health = deviceHealth[deviceId];
        uint256 oldScore = health.latestHealthScore;
        
        _updateDeviceHealth(deviceId, newScore);
        
        emit HealthScoreUpdated(deviceId, oldScore, newScore);
    }
    
    /**
     * @dev 获取设备维护记录
     */
    function getDeviceRecords(string memory deviceId) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return deviceRecords[deviceId];
    }
    
    /**
     * @dev 获取维修人员记录
     */
    function getMaintainerRecords(address maintainer) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return maintainerRecords[maintainer];
    }
    
    /**
     * @dev 获取设备健康状态
     */
    function getDeviceHealth(string memory deviceId) 
        external 
        view 
        returns (DeviceHealth memory) 
    {
        return deviceHealth[deviceId];
    }
    
    /**
     * @dev 批量获取维护记录
     */
    function getRecordsBatch(uint256[] memory recordIds) 
        external 
        view 
        returns (MaintenanceRecord[] memory) 
    {
        MaintenanceRecord[] memory result = new MaintenanceRecord[](recordIds.length);
        
        for (uint256 i = 0; i < recordIds.length; i++) {
            if (recordIds[i] < recordCounter) {
                result[i] = records[recordIds[i]];
            }
        }
        
        return result;
    }
    
    /**
     * @dev 验证维护数据完整性
     */
    function verifyMaintenanceData(
        uint256 recordId,
        bytes32 dataHash
    ) external view returns (bool) {
        require(recordId < recordCounter, "Record does not exist");
        return records[recordId].dataHash == dataHash;
    }
    
    /**
     * @dev 预测性分析 - 检查是否需要维护
     */
    function predictMaintenance(string memory deviceId) 
        external 
        view 
        returns (bool needsMaintenance, string memory reason) 
    {
        DeviceHealth memory health = deviceHealth[deviceId];
        
        // 健康度低于50
        if (health.latestHealthScore < 50) {
            return (true, "Critical health score");
        }
        
        // 超过30天未检查
        if (block.timestamp - health.lastCheckTime > 30 days) {
            return (true, "Overdue maintenance");
        }
        
        // 健康度在50-70之间且有多次维护记录
        if (health.latestHealthScore < 70 && health.totalMaintenance > 3) {
            return (true, "Frequent maintenance needed");
        }
        
        return (false, "No maintenance needed");
    }
    
    /**
     * @dev 私有函数：更新设备健康状态
     */
    function _updateDeviceHealth(
        string memory deviceId,
        uint256 healthScore
    ) private {
        DeviceHealth storage health = deviceHealth[deviceId];
        
        health.deviceId = deviceId;
        health.latestHealthScore = healthScore;
        health.lastCheckTime = block.timestamp;
        health.totalMaintenance++;
        health.needsAttention = healthScore < 70;
    }
}
