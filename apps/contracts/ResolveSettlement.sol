// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.24;

/**
 * ResolveSettlement — RESOLVE AMM 预测市场结算合约（TRON Shasta 测试网）
 *
 * 模型：线性债券曲线 AMM，支持买入/卖出 YES/NO 份额。
 * 任意用户可创建市场并注资流动性，用户在到期前可买入或卖出持仓；
 * AI 共识达成后 owner 调用 settle() / settleBatch() 赔付赢家。任何用户可创建市场。
 *
 * AMM 公式:
 *   YES_price = 0.5 + net / (2 * L)   (clamped to [0.01, 0.99])
 *   NO_price  = 1 - YES_price
 *
 * 费用:
 *   交易费 0.1%（50% → LP / 50% → feePool）
 *   创建费 10 USDD（创建市场时一次支付）
 */

interface ITRC20 {
    function transfer(address to, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract ResolveSettlement {
    address public owner;
    ITRC20 public immutable usdd;

    uint256 private constant PRICE_DECIMALS = 1e18;
    uint256 private constant MIN_PRICE = 1e16;  // 0.01
    uint256 private constant MAX_PRICE = 99e16; // 0.99
    uint256 private constant FEE_BPS = 10;      // 0.1% = 10 basis points
    uint256 private constant CREATION_FEE = 10 * 1e6; // 10 USDD (6 decimals)

    struct Market {
        bool exists;
        bool settled;
        bytes8 outcome;
        uint256 liquidity;   // 初始注入 USDD
        uint256 yesSupply;   // 当前 YES 份额数
        uint256 noSupply;    // 当前 NO 份额数
        uint256 feePool;     // 累积平台费
        int256  net;         // 累计 YES 买入额 - 累计 NO 买入额 (USDD sun)
    }

    // marketId => Market
    mapping(bytes32 => Market) public markets;
    // marketId => user => isYes => 持仓份额数
    mapping(bytes32 => mapping(address => mapping(bool => uint256))) public stakes;

    event MarketCreated(bytes32 indexed marketId, uint256 liquidity, uint256 creationFee);
    event SharesBought(
        bytes32 indexed marketId, address indexed buyer, bool isYes,
        uint256 amountSun, uint256 shares, uint256 price, uint256 fee
    );
    event SharesSold(
        bytes32 indexed marketId, address indexed seller, bool isYes,
        uint256 shares, uint256 proceeds, uint256 price, uint256 fee
    );
    event FeesClaimed(address indexed claimer, uint256 amount);
    event Settled(bytes32 indexed marketId, bytes8 outcome, address indexed winner, uint256 payout);

    modifier onlyOwner() {
        require(msg.sender == owner, "Resolve: not owner");
        _;
    }

    constructor(address _usdd) {
        require(_usdd != address(0), "Resolve: usdd=0");
        owner = msg.sender;
        usdd = ITRC20(_usdd);
    }

    // ── AMM 价格计算 ──────────────────────────────────────────

    /**
     * 计算 YES / NO 价格（1e18 精度）。
     * YES_price = 0.5 + net / (2 * L), clamped [0.01, 0.99]
     */
    function _getPrice(int256 net, uint256 L, bool isYes) internal pure returns (uint256) {
        if (L == 0) return isYes ? (PRICE_DECIMALS / 2) : (PRICE_DECIMALS / 2);

        // yesPrice = 0.5 + net / (2 * L), all in 1e18 scale
        int256 half = int256(PRICE_DECIMALS / 2); // 0.5e18
        int256 delta = (net * int256(PRICE_DECIMALS)) / int256(2 * L);
        int256 yesPrice = half + delta;

        if (yesPrice < int256(MIN_PRICE)) yesPrice = int256(MIN_PRICE);
        if (yesPrice > int256(MAX_PRICE)) yesPrice = int256(MAX_PRICE);

        uint256 price = uint256(yesPrice);
        return isYes ? price : (PRICE_DECIMALS - price);
    }

    // ── 创建市场 ──────────────────────────────────────────────

    /**
     * 用户创建市场：存入 L USDD 流动性 + 支付 10 USDD 创建费。
     * 总共从创建者拉取 (liquidity + 10 USDD)。
     */
    function createMarket(bytes32 marketId, uint256 liquidity) external {
        require(!markets[marketId].exists, "Resolve: market exists");

        uint256 total = liquidity + CREATION_FEE;
        if (total > 0) {
            require(
                usdd.transferFrom(msg.sender, address(this), total),
                "Resolve: fund failed"
            );
        }

        markets[marketId] = Market({
            exists: true,
            settled: false,
            outcome: bytes8(0),
            liquidity: liquidity,
            yesSupply: 0,
            noSupply: 0,
            feePool: CREATION_FEE,
            net: int256(0)
        });

        emit MarketCreated(marketId, liquidity, CREATION_FEE);
    }

    // ── 买入份额 ──────────────────────────────────────────────

    /**
     * 用户买入 YES/NO 份额。
     * 从买家拉取 amountSun 的 USDD；按 AMM 价格计算份额；扣 0.1% 费。
     */
    function buyShares(bytes32 marketId, bool isYes, uint256 amountSun) external {
        Market storage m = markets[marketId];
        require(m.exists, "Resolve: no market");
        require(!m.settled, "Resolve: settled");
        require(amountSun > 0, "Resolve: amount=0");

        uint256 price = _getPrice(m.net, m.liquidity, isYes);
        uint256 shares = (amountSun * PRICE_DECIMALS) / price;

        // 0.1% 交易费
        uint256 fee = (amountSun * FEE_BPS) / 10000;  // amount * 10 / 10000 = amount * 0.001
        uint256 platformFee = fee / 2;                // 50% → feePool
        // 50% LP 部分静默保留在池中

        // 更新 net: 平台费被提取，不计入 price 影响；LP 费留在池中保持影响
        if (isYes) {
            m.net += int256(amountSun - platformFee);
            m.yesSupply += shares;
        } else {
            m.net -= int256(amountSun - platformFee);
            m.noSupply += shares;
        }
        m.feePool += platformFee;

        // 拉取 USDD
        require(
            usdd.transferFrom(msg.sender, address(this), amountSun),
            "Resolve: pay failed"
        );

        // 记录持仓
        stakes[marketId][msg.sender][isYes] += shares;

        emit SharesBought(marketId, msg.sender, isYes, amountSun, shares, price, fee);
    }

    // ── 卖出份额 ──────────────────────────────────────────────

    /**
     * 用户卖出 YES/NO 份额。
     * 检查持仓充足 → 按 AMM 价格返还 USDD → 扣 0.1% 费。
     */
    function sellShares(bytes32 marketId, bool isYes, uint256 shares) external {
        Market storage m = markets[marketId];
        require(m.exists, "Resolve: no market");
        require(!m.settled, "Resolve: settled");
        require(shares > 0, "Resolve: shares=0");
        require(
            stakes[marketId][msg.sender][isYes] >= shares,
            "Resolve: insufficient stake"
        );

        uint256 price = _getPrice(m.net, m.liquidity, isYes);
        uint256 grossProceeds = (shares * price) / PRICE_DECIMALS;

        // 0.1% 交易费
        uint256 fee = (grossProceeds * FEE_BPS) / 10000;
        uint256 platformFee = fee / 2;
        uint256 proceeds = grossProceeds - fee;  // 用户实收（减去全部费用）

        // 更新 net：平台费同样被提取
        if (isYes) {
            m.net -= int256(grossProceeds - platformFee);
            m.yesSupply -= shares;
        } else {
            m.net += int256(grossProceeds - platformFee);
            m.noSupply -= shares;
        }
        m.feePool += platformFee;

        // 减少持仓，返还 USDD
        stakes[marketId][msg.sender][isYes] -= shares;
        require(usdd.transfer(msg.sender, proceeds), "Resolve: sell transfer failed");

        emit SharesSold(marketId, msg.sender, isYes, shares, proceeds, price, fee);
    }

    // ── 提取平台费 ────────────────────────────────────────────

    /** owner 提取指定市场的 feePool。 */
    function claimMarketFees(bytes32 marketId) external onlyOwner {
        Market storage m = markets[marketId];
        require(m.exists, "Resolve: no market");
        uint256 amount = m.feePool;
        require(amount > 0, "Resolve: no fees");
        m.feePool = 0;
        require(usdd.transfer(msg.sender, amount), "Resolve: claim failed");
        emit FeesClaimed(msg.sender, amount);
    }

    // ── 查询池状态 ────────────────────────────────────────────

    /**
     * 查询池状态：当前价格 + 份额供应 + 流动性 + 费用。
     * 返回 yesPrice / noPrice 为 1e18 精度（前端 / 1e18 得到人类可读值）。
     */
    function getPoolState(bytes32 marketId)
        external
        view
        returns (
            uint256 yesSupply,
            uint256 noSupply,
            uint256 yesPrice,
            uint256 noPrice,
            uint256 liquidity,
            uint256 feePool
        )
    {
        Market storage m = markets[marketId];
        require(m.exists, "Resolve: no market");
        yesSupply = m.yesSupply;
        noSupply = m.noSupply;
        yesPrice = _getPrice(m.net, m.liquidity, true);
        noPrice = _getPrice(m.net, m.liquidity, false);
        liquidity = m.liquidity;
        feePool = m.feePool;
    }

    // ── 结算 ──────────────────────────────────────────────────

    /** owner 结算：向 winner 赔付 payout。 */
    function settle(
        bytes32 marketId,
        bytes8 outcome,
        address winner,
        uint256 payout
    ) external onlyOwner {
        Market storage m = markets[marketId];
        require(m.exists, "Resolve: no market");
        require(!m.settled, "Resolve: settled");
        m.settled = true;
        m.outcome = outcome;
        if (payout > 0 && winner != address(0)) {
            require(
                usdd.balanceOf(address(this)) >= payout,
                "Resolve: insufficient balance"
            );
            require(usdd.transfer(winner, payout), "Resolve: payout failed");
        }
        emit Settled(marketId, outcome, winner, payout);
    }

    /// @notice 批量结算：向多个赢家赔付。owner 调用，仅一次。
    /// @param marketId  市场 ID（bytes32）
    /// @param outcome   结算结果（YES → 0x5945530000000000 / NO → 0x4e4f0000000000）
    /// @param winners   赢家地址数组
    /// @param payouts   对应赔付金额数组（最小单位 sun）
    function settleBatch(
        bytes32 marketId,
        bytes8 outcome,
        address[] calldata winners,
        uint256[] calldata payouts
    ) external onlyOwner {
        Market storage m = markets[marketId];
        require(m.exists, "Resolve: no market");
        require(!m.settled, "Resolve: settled");
        require(winners.length == payouts.length, "Resolve: length mismatch");
        require(winners.length > 0, "Resolve: empty winners");

        m.settled = true;
        m.outcome = outcome;

        uint256 totalPayout = 0;
        for (uint i = 0; i < winners.length; i++) {
            if (payouts[i] > 0 && winners[i] != address(0)) {
                require(usdd.transfer(winners[i], payouts[i]), "Resolve: payout failed");
                totalPayout += payouts[i];
            }
        }

        emit Settled(marketId, outcome, winners[0], totalPayout);
    }

    // ── 只读查询 ──────────────────────────────────────────────

    /** 查询市场基本状态 */
    function getMarket(bytes32 marketId)
        external
        view
        returns (
            bool exists,
            bool settled,
            bytes8 outcome,
            uint256 liquidity,
            uint256 yesSupply,
            uint256 noSupply,
            uint256 feePool
        )
    {
        Market storage m = markets[marketId];
        return (m.exists, m.settled, m.outcome, m.liquidity, m.yesSupply, m.noSupply, m.feePool);
    }
}
