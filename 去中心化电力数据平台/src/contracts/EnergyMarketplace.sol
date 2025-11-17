// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title EnergyMarketplace
 * @dev P2P能源交易市场合约
 */
contract EnergyMarketplace {
    // 上架信息结构
    struct Listing {
        uint256 listingId;         // 上架ID
        address seller;            // 卖家地址
        string deviceId;           // 设备ID
        uint256 amount;            // 能源数量（kWh）
        uint256 pricePerKwh;       // 单价（wei per kWh）
        uint256 totalPrice;        // 总价
        uint256 listedAt;          // 上架时间
        bool isActive;             // 是否激活
        bool isSold;               // 是否已售出
    }
    
    // 交易结构
    struct Transaction {
        uint256 transactionId;     // 交易ID
        uint256 listingId;         // 上架ID
        address seller;            // 卖家
        address buyer;             // 买家
        uint256 amount;            // 交易数量
        uint256 price;             // 交易价格
        uint256 timestamp;         // 交易时间
    }
    
    // 状态变量
    uint256 public listingCounter;
    uint256 public transactionCounter;
    uint256 public commissionRate = 2; // 2% 平台手续费
    address public platformOwner;
    
    // 映射
    mapping(uint256 => Listing) public listings;
    mapping(address => uint256[]) public sellerListings;
    mapping(address => uint256[]) public buyerTransactions;
    mapping(uint256 => Transaction) public transactions;
    
    // 事件
    event EnergyListed(
        uint256 indexed listingId,
        address indexed seller,
        string deviceId,
        uint256 amount,
        uint256 pricePerKwh
    );
    
    event EnergyPurchased(
        uint256 indexed transactionId,
        uint256 indexed listingId,
        address indexed buyer,
        address seller,
        uint256 amount,
        uint256 price
    );
    
    event ListingCancelled(
        uint256 indexed listingId,
        address indexed seller
    );
    
    // 修饰符
    modifier onlyPlatformOwner() {
        require(msg.sender == platformOwner, "Not platform owner");
        _;
    }
    
    modifier listingExists(uint256 listingId) {
        require(listingId < listingCounter, "Listing does not exist");
        _;
    }
    
    constructor() {
        platformOwner = msg.sender;
    }
    
    /**
     * @dev 上架能源
     */
    function listEnergy(
        string memory deviceId,
        uint256 amount,
        uint256 pricePerKwh
    ) external returns (uint256) {
        require(amount > 0, "Amount must be greater than 0");
        require(pricePerKwh > 0, "Price must be greater than 0");
        
        uint256 listingId = listingCounter++;
        uint256 totalPrice = amount * pricePerKwh;
        
        listings[listingId] = Listing({
            listingId: listingId,
            seller: msg.sender,
            deviceId: deviceId,
            amount: amount,
            pricePerKwh: pricePerKwh,
            totalPrice: totalPrice,
            listedAt: block.timestamp,
            isActive: true,
            isSold: false
        });
        
        sellerListings[msg.sender].push(listingId);
        
        emit EnergyListed(listingId, msg.sender, deviceId, amount, pricePerKwh);
        
        return listingId;
    }
    
    /**
     * @dev 购买能源
     */
    function purchaseEnergy(uint256 listingId) 
        external 
        payable 
        listingExists(listingId) 
        returns (uint256) 
    {
        Listing storage listing = listings[listingId];
        
        require(listing.isActive, "Listing is not active");
        require(!listing.isSold, "Already sold");
        require(msg.sender != listing.seller, "Cannot buy own listing");
        require(msg.value >= listing.totalPrice, "Insufficient payment");
        
        // 计算手续费
        uint256 commission = (listing.totalPrice * commissionRate) / 100;
        uint256 sellerAmount = listing.totalPrice - commission;
        
        // 更新状态
        listing.isActive = false;
        listing.isSold = true;
        
        // 创建交易记录
        uint256 txId = transactionCounter++;
        transactions[txId] = Transaction({
            transactionId: txId,
            listingId: listingId,
            seller: listing.seller,
            buyer: msg.sender,
            amount: listing.amount,
            price: listing.totalPrice,
            timestamp: block.timestamp
        });
        
        buyerTransactions[msg.sender].push(txId);
        
        // 转账
        payable(listing.seller).transfer(sellerAmount);
        payable(platformOwner).transfer(commission);
        
        // 退还多余的钱
        if (msg.value > listing.totalPrice) {
            payable(msg.sender).transfer(msg.value - listing.totalPrice);
        }
        
        emit EnergyPurchased(txId, listingId, msg.sender, listing.seller, listing.amount, listing.totalPrice);
        
        return txId;
    }
    
    /**
     * @dev 取消上架
     */
    function cancelListing(uint256 listingId) 
        external 
        listingExists(listingId) 
    {
        Listing storage listing = listings[listingId];
        
        require(listing.seller == msg.sender, "Not listing owner");
        require(listing.isActive, "Listing already inactive");
        require(!listing.isSold, "Cannot cancel sold listing");
        
        listing.isActive = false;
        
        emit ListingCancelled(listingId, msg.sender);
    }
    
    /**
     * @dev 获取所有活跃上架
     */
    function getActiveListings() external view returns (Listing[] memory) {
        // 计算活跃上架数量
        uint256 activeCount = 0;
        for (uint256 i = 0; i < listingCounter; i++) {
            if (listings[i].isActive && !listings[i].isSold) {
                activeCount++;
            }
        }
        
        // 创建数组
        Listing[] memory activeListings = new Listing[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < listingCounter; i++) {
            if (listings[i].isActive && !listings[i].isSold) {
                activeListings[index] = listings[i];
                index++;
            }
        }
        
        return activeListings;
    }
    
    /**
     * @dev 获取卖家的上架列表
     */
    function getSellerListings(address seller) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return sellerListings[seller];
    }
    
    /**
     * @dev 获取买家的交易记录
     */
    function getBuyerTransactions(address buyer) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return buyerTransactions[buyer];
    }
    
    /**
     * @dev 更新平台手续费率
     */
    function updateCommissionRate(uint256 newRate) 
        external 
        onlyPlatformOwner 
    {
        require(newRate <= 10, "Commission rate too high");
        commissionRate = newRate;
    }
    
    /**
     * @dev 提取平台收益
     */
    function withdrawPlatformFunds() external onlyPlatformOwner {
        payable(platformOwner).transfer(address(this).balance);
    }
}
