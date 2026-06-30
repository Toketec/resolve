// ─────────────────────────────────────────────
// x402 微支付（简化版）— Agent 经济自主性演示
// ─────────────────────────────────────────────
// x402 是"HTTP 402 Payment Required"支付协议。共识达成时，编排方向参与
// 推理的 Agent 支付一笔微款（演示 Agent 经济）。本实现为简化/模拟版：
// 产出可展示的交易哈希与金额；真实集成可替换 settleX402 内部的 fetch。
// ─────────────────────────────────────────────

import { TRONSCAN_SHASTA } from "@/lib/constants";

export interface X402Receipt {
  /** 交易哈希（可点击跳 Tronscan） */
  txHash: string;
  /** 支付金额（USDD） */
  amount: number;
  /** 收款 Agent 数 */
  recipients: number;
  /** Tronscan 链接 */
  explorerUrl: string;
  simulated: boolean;
  at: string;
}

/** 每个参与 Agent 的微支付额（USDD） */
const PER_AGENT_FEE = 0.05;

/**
 * 触发一次 x402 结算微支付（共识达成后调用）。
 * @param agentCount 参与推理的 Agent 数（决定总额）
 */
export async function settleX402(agentCount = 6): Promise<X402Receipt> {
  // 模拟一次确定性的链上微支付。真实集成时，这里换成对 B.AI x402
  // 端点的 fetch（带 402 challenge/response），返回真实 txHash。
  const total = Number((PER_AGENT_FEE * agentCount).toFixed(2));
  const txHash = `x402_${Date.now().toString(16)}${Math.floor(agentCount).toString(16)}`;
  return {
    txHash,
    amount: total,
    recipients: agentCount,
    explorerUrl: `${TRONSCAN_SHASTA}/#/transaction/${txHash}`,
    simulated: true,
    at: new Date().toISOString(),
  };
}
