// ─────────────────────────────────────────────
// 链上常量 — 合约地址 / ABI / 网络
// ─────────────────────────────────────────────
// 部署后把地址填到这里（由 apps/contracts/scripts/deploy.js 输出）。
// ─────────────────────────────────────────────

/** ResolveSettlement 合约地址（部署后填入）。 */
export const SETTLEMENT_ADDRESS = process.env.NEXT_PUBLIC_SETTLEMENT_ADDRESS || "";

/** USDD TRC-20 地址（Shasta：部署 MockUSDD 后填入，或真实 USDD）。 */
export const USDD_ADDRESS = process.env.NEXT_PUBLIC_USDD_ADDRESS || "";

/** AgentRegistry 合约地址（部署后填入）。 */
export const AGENT_REGISTRY_ADDRESS =
  process.env.NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS || "";

/** Shasta 测试网区块浏览器。 */
export const TRONSCAN_SHASTA = "https://shasta.tronscan.org";

/** USDD 精度（TRC-20，6 位）。 */
export const USDD_DECIMALS = 6;

/** ResolveSettlement ABI（与 apps/contracts/build/ResolveSettlement.json 同步）。 */
export const SETTLEMENT_ABI = [
  { type: "constructor", stateMutability: "nonpayable", inputs: [{ name: "_usdd", type: "address" }] },
  // ── 交易（客户端 TronLink 签名）─────────────────────
  {
    type: "function", name: "buyShares", stateMutability: "nonpayable",
    inputs: [
      { name: "marketId", type: "bytes32" },
      { name: "isYes", type: "bool" },
      { name: "amountSun", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function", name: "sellShares", stateMutability: "nonpayable",
    inputs: [
      { name: "marketId", type: "bytes32" },
      { name: "isYes", type: "bool" },
      { name: "shares", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function", name: "createMarket", stateMutability: "nonpayable",
    inputs: [
      { name: "marketId", type: "bytes32" },
      { name: "liquidity", type: "uint256" },
    ],
    outputs: [],
  },
  // ── Claim 式结算（客户端 TronLink 签名，无需 owner）───
  {
    type: "function", name: "resolveOutcome", stateMutability: "nonpayable",
    inputs: [
      { name: "marketId", type: "bytes32" },
      { name: "outcome", type: "bytes8" },
    ],
    outputs: [],
  },
  {
    type: "function", name: "claimReward", stateMutability: "nonpayable",
    inputs: [{ name: "marketId", type: "bytes32" }],
    outputs: [],
  },
  // ── 查询 ──────────────────────────────────────────
  {
    type: "function", name: "getPoolState", stateMutability: "view",
    inputs: [{ name: "marketId", type: "bytes32" }],
    outputs: [
      { name: "yesSupply", type: "uint256" },
      { name: "noSupply", type: "uint256" },
      { name: "yesPrice", type: "uint256" },
      { name: "noPrice", type: "uint256" },
      { name: "liquidity", type: "uint256" },
      { name: "feePool", type: "uint256" },
    ],
  },
  {
    type: "function", name: "getMarket", stateMutability: "view",
    inputs: [{ name: "marketId", type: "bytes32" }],
    outputs: [
      { name: "exists", type: "bool" },
      { name: "settled", type: "bool" },
      { name: "outcome", type: "bytes8" },
      { name: "liquidity", type: "uint256" },
      { name: "yesSupply", type: "uint256" },
      { name: "noSupply", type: "uint256" },
      { name: "feePool", type: "uint256" },
    ],
  },
] as const;

/** USDD (TRC-20) 最小 ABI —— approve / balanceOf。 */
export const USDD_ABI = [
  {
    type: "function", name: "approve", stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function", name: "balanceOf", stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;
