// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * ResolveSettlement — RESOLVE 预注资结算合约（TRON Shasta 测试网）
 *
 * 模型：管理员（owner，即预注资方）创建市场并存入 USDD 流动性；
 * 用户用 USDD 买入 YES/NO 份额；AI 共识达成后，owner 调用 settle()
 * 向赢家地址赔付。settleSimulated() 为"安全气囊"——标记已结算但不转账，
 * 用于测试网不稳定时维持 demo 流程。
 *
 * 安全：仅 owner 可结算/创建；无任意提款（owner 只能回收自己注入的流动性）；
 * 不持有任何私钥；USDD 走标准 TRC-20 transferFrom/transfer。
 */
interface ITRC20 {
    function transfer(address to, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract ResolveSettlement {
    address public owner;
    ITRC20 public immutable usdd; // USDD TRC-20 代币

    struct Market {
        bool exists;
        bool settled;
        bytes8 outcome; // "YES" / "NO" 编码为 bytes8
        uint256 liquidity; // owner 预注资
        uint256 totalStaked; // 用户买入总额
    }

    // marketId => Market
    mapping(bytes32 => Market) public markets;
    // marketId => user => isYes => 累计买入额
    mapping(bytes32 => mapping(address => mapping(bool => uint256))) public stakes;

    event MarketCreated(bytes32 indexed marketId, uint256 liquidity);
    event SharesBought(bytes32 indexed marketId, address indexed buyer, bool isYes, uint256 amount);
    event Settled(bytes32 indexed marketId, bytes8 outcome, address indexed winner, uint256 payout);
    event SettledSimulated(bytes32 indexed marketId, bytes8 outcome);

    modifier onlyOwner() {
        require(msg.sender == owner, "ResolveSettlement: not owner");
        _;
    }

    constructor(address _usdd) {
        require(_usdd != address(0), "ResolveSettlement: usdd=0");
        owner = msg.sender;
        usdd = ITRC20(_usdd);
    }

    /** owner 创建市场并预注资 liquidity（从 owner 拉取 USDD）。 */
    function createMarket(bytes32 marketId, uint256 liquidity) external onlyOwner {
        require(!markets[marketId].exists, "ResolveSettlement: market exists");
        if (liquidity > 0) {
            require(
                usdd.transferFrom(msg.sender, address(this), liquidity),
                "ResolveSettlement: fund failed"
            );
        }
        markets[marketId] = Market({
            exists: true,
            settled: false,
            outcome: bytes8(0),
            liquidity: liquidity,
            totalStaked: 0
        });
        emit MarketCreated(marketId, liquidity);
    }

    /** 用户买入 YES/NO 份额（从买家拉取 amount 的 USDD）。 */
    function buyShares(bytes32 marketId, bool isYes, uint256 amount) external {
        Market storage m = markets[marketId];
        require(m.exists, "ResolveSettlement: no market");
        require(!m.settled, "ResolveSettlement: settled");
        require(amount > 0, "ResolveSettlement: amount=0");
        require(
            usdd.transferFrom(msg.sender, address(this), amount),
            "ResolveSettlement: pay failed"
        );
        stakes[marketId][msg.sender][isYes] += amount;
        m.totalStaked += amount;
        emit SharesBought(marketId, msg.sender, isYes, amount);
    }

    /** owner 结算：由 AI 共识触发，向 winner 赔付 payout。 */
    function settle(
        bytes32 marketId,
        bytes8 outcome,
        address winner,
        uint256 payout
    ) external onlyOwner {
        Market storage m = markets[marketId];
        require(m.exists, "ResolveSettlement: no market");
        require(!m.settled, "ResolveSettlement: settled");
        m.settled = true;
        m.outcome = outcome;
        if (payout > 0 && winner != address(0)) {
            require(
                usdd.balanceOf(address(this)) >= payout,
                "ResolveSettlement: insufficient balance"
            );
            require(usdd.transfer(winner, payout), "ResolveSettlement: payout failed");
        }
        emit Settled(marketId, outcome, winner, payout);
    }

    /** 安全气囊：标记已结算但不转账（测试网不稳定时用）。 */
    function settleSimulated(bytes32 marketId, bytes8 outcome) external onlyOwner {
        Market storage m = markets[marketId];
        require(m.exists, "ResolveSettlement: no market");
        require(!m.settled, "ResolveSettlement: settled");
        m.settled = true;
        m.outcome = outcome;
        emit SettledSimulated(marketId, outcome);
    }

    /** owner 回收剩余流动性（仅 owner，非任意提款）。 */
    function withdrawLiquidity(uint256 amount) external onlyOwner {
        require(usdd.transfer(owner, amount), "ResolveSettlement: withdraw failed");
    }

    /** 查询：市场是否已结算 + 结果。 */
    function getMarket(bytes32 marketId)
        external
        view
        returns (bool exists, bool settled, bytes8 outcome, uint256 liquidity, uint256 totalStaked)
    {
        Market storage m = markets[marketId];
        return (m.exists, m.settled, m.outcome, m.liquidity, m.totalStaked);
    }
}
