// ─────────────────────────────────────────────
// 链上常量 — 合约地址 / ABI / 网络
// ─────────────────────────────────────────────
// 部署后把地址填到这里（由 apps/contracts/scripts/deploy.js 输出）。
// 未部署时 SETTLEMENT_ADDRESS 为空 → settlement.ts 自动走气囊模式。
// ─────────────────────────────────────────────

/** ResolveSettlement 合约地址（部署后填入）。 */
export const SETTLEMENT_ADDRESS = process.env.NEXT_PUBLIC_SETTLEMENT_ADDRESS || "";

/** USDD TRC-20 地址（Shasta：部署 MockUSDD 后填入，或真实 USDD）。 */
export const USDD_ADDRESS = process.env.NEXT_PUBLIC_USDD_ADDRESS || "";

/** Shasta 测试网区块浏览器。 */
export const TRONSCAN_SHASTA = "https://shasta.tronscan.org";

/** USDD 精度（TRC-20，6 位）。 */
export const USDD_DECIMALS = 6;

/** 气囊模式：true → 结算走 settleSimulated（不依赖实时链上）。 */
export const AIRBAG_ENABLED =
  process.env.NEXT_PUBLIC_AIRBAG_ENABLED !== "false";

/** ResolveSettlement ABI（与 apps/contracts/build/ResolveSettlement.json 同步）。 */
export const SETTLEMENT_ABI = [
  { type: "constructor", stateMutability: "nonpayable", inputs: [{ name: "_usdd", type: "address" }] },
  {
    type: "function", name: "buyShares", stateMutability: "nonpayable",
    inputs: [
      { name: "marketId", type: "bytes32" },
      { name: "isYes", type: "bool" },
      { name: "amount", type: "uint256" },
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
  {
    type: "function", name: "settle", stateMutability: "nonpayable",
    inputs: [
      { name: "marketId", type: "bytes32" },
      { name: "outcome", type: "bytes8" },
      { name: "winner", type: "address" },
      { name: "payout", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function", name: "settleSimulated", stateMutability: "nonpayable",
    inputs: [
      { name: "marketId", type: "bytes32" },
      { name: "outcome", type: "bytes8" },
    ],
    outputs: [],
  },
  {
    type: "function", name: "getMarket", stateMutability: "view",
    inputs: [{ name: "marketId", type: "bytes32" }],
    outputs: [
      { name: "exists", type: "bool" },
      { name: "settled", type: "bool" },
      { name: "outcome", type: "bytes8" },
      { name: "liquidity", type: "uint256" },
      { name: "totalStaked", type: "uint256" },
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
