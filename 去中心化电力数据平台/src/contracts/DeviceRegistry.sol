// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title DeviceRegistry
 * @dev 设备注册合约 - 管理设备所有权和基本信息
 */
contract DeviceRegistry {
    // 设备结构
    struct Device {
        string deviceId;           // 设备ID
        address owner;             // 设备所有者
        string deviceType;         // 设备类型
        uint256 capacity;          // 设备容量（瓦特）
        address maintainer;        // 维修人员地址
        string ipfsHash;           // IPFS存储哈希
        bytes32 dataHash;          // 数据完整性哈希
        uint256 registeredAt;      // 注册时间
        bool isActive;             // 是否激活
    }
    
    // 设备映射
    mapping(string => Device) public devices;
    mapping(address => string[]) public ownerDevices;
    
    // 事件
    event DeviceRegistered(
        string indexed deviceId,
        address indexed owner,
        string deviceType,
        uint256 capacity,
        address maintainer
    );
    
    event DeviceUpdated(
        string indexed deviceId,
        string ipfsHash,
        bytes32 dataHash
    );
    
    event DeviceTransferred(
        string indexed deviceId,
        address indexed from,
        address indexed to
    );
    
    event MaintainerUpdated(
        string indexed deviceId,
        address indexed oldMaintainer,
        address indexed newMaintainer
    );
    
    // 修饰符
    modifier onlyOwner(string memory deviceId) {
        require(devices[deviceId].owner == msg.sender, "Not device owner");
        _;
    }
    
    modifier deviceExists(string memory deviceId) {
        require(devices[deviceId].owner != address(0), "Device does not exist");
        _;
    }
    
    /**
     * @dev 注册新设备
     */
    function registerDevice(
        string memory deviceId,
        string memory deviceType,
        uint256 capacity,
        address maintainer,
        string memory ipfsHash,
        bytes32 dataHash
    ) external {
        require(devices[deviceId].owner == address(0), "Device already exists");
        require(bytes(deviceId).length > 0, "Invalid device ID");
        require(maintainer != address(0), "Invalid maintainer address");
        
        devices[deviceId] = Device({
            deviceId: deviceId,
            owner: msg.sender,
            deviceType: deviceType,
            capacity: capacity,
            maintainer: maintainer,
            ipfsHash: ipfsHash,
            dataHash: dataHash,
            registeredAt: block.timestamp,
            isActive: true
        });
        
        ownerDevices[msg.sender].push(deviceId);
        
        emit DeviceRegistered(deviceId, msg.sender, deviceType, capacity, maintainer);
    }
    
    /**
     * @dev 更新设备数据
     */
    function updateDeviceData(
        string memory deviceId,
        string memory ipfsHash,
        bytes32 dataHash
    ) external onlyOwner(deviceId) deviceExists(deviceId) {
        devices[deviceId].ipfsHash = ipfsHash;
        devices[deviceId].dataHash = dataHash;
        
        emit DeviceUpdated(deviceId, ipfsHash, dataHash);
    }
    
    /**
     * @dev 更新维修人员
     */
    function updateMaintainer(
        string memory deviceId,
        address newMaintainer
    ) external onlyOwner(deviceId) deviceExists(deviceId) {
        require(newMaintainer != address(0), "Invalid maintainer address");
        
        address oldMaintainer = devices[deviceId].maintainer;
        devices[deviceId].maintainer = newMaintainer;
        
        emit MaintainerUpdated(deviceId, oldMaintainer, newMaintainer);
    }
    
    /**
     * @dev 转移设备所有权
     */
    function transferDevice(
        string memory deviceId,
        address newOwner
    ) external onlyOwner(deviceId) deviceExists(deviceId) {
        require(newOwner != address(0), "Invalid new owner");
        require(newOwner != msg.sender, "Already owner");
        
        address oldOwner = devices[deviceId].owner;
        devices[deviceId].owner = newOwner;
        
        // 从旧所有者列表移除
        _removeDeviceFromOwner(oldOwner, deviceId);
        
        // 添加到新所有者列表
        ownerDevices[newOwner].push(deviceId);
        
        emit DeviceTransferred(deviceId, oldOwner, newOwner);
    }
    
    /**
     * @dev 获取设备信息
     */
    function getDevice(string memory deviceId) 
        external 
        view 
        returns (Device memory) 
    {
        return devices[deviceId];
    }
    
    /**
     * @dev 获取所有者的所有设备
     */
    function getOwnerDevices(address owner) 
        external 
        view 
        returns (string[] memory) 
    {
        return ownerDevices[owner];
    }
    
    /**
     * @dev 验证数据完整性
     */
    function verifyDataIntegrity(
        string memory deviceId,
        bytes32 dataHash
    ) external view deviceExists(deviceId) returns (bool) {
        return devices[deviceId].dataHash == dataHash;
    }
    
    /**
     * @dev 私有函数：从所有者列表移除设备
     */
    function _removeDeviceFromOwner(address owner, string memory deviceId) private {
        string[] storage deviceList = ownerDevices[owner];
        for (uint i = 0; i < deviceList.length; i++) {
            if (keccak256(bytes(deviceList[i])) == keccak256(bytes(deviceId))) {
                deviceList[i] = deviceList[deviceList.length - 1];
                deviceList.pop();
                break;
            }
        }
    }
}
