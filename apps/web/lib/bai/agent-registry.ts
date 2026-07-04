/**
 * Agent 链上身份配置层
 *
 * 三档模式（由 NEXT_PUBLIC_AGENT_REGISTRY_MODE 控制）：
 *   mock       - 使用 derive8004Id() 派生串（当前行为，默认）
 *   preconfig  - 使用部署后的真实 TRON 地址（推荐，无需 RPC 调用）
 *   live       - 从链上 AgentRegistry 合约实时读取（异步，需额外改造）
 */
type RegistryMode = "mock" | "preconfig" | "live";
const MODE: RegistryMode =
  (process.env.NEXT_PUBLIC_AGENT_REGISTRY_MODE as RegistryMode) || "mock";

// preconfig 模式：部署 AgentRegistry 后填入 6 个 Agent 的真实注册地址
// 运行 apps/contracts/scripts/deployAgentRegistry.js 后，
// 控制台会输出每个 Agent 的注册地址，复制粘贴到这里。
const PRECONFIG_ADDRESSES: Record<string, string> = {
  "bull-1": "TLVn5Sa9Y3fJjiGZwkjkiF1dmR1XQwwgcQ",
  "bull-2": "TLVn5Sa9Y3fJjiGZwkjkiF1dmR1XQwwgcQ",
  "bear-1": "TLVn5Sa9Y3fJjiGZwkjkiF1dmR1XQwwgcQ",
  "bear-2": "TLVn5Sa9Y3fJjiGZwkjkiF1dmR1XQwwgcQ",
  "neut-1": "TLVn5Sa9Y3fJjiGZwkjkiF1dmR1XQwwgcQ",
  "neut-2": "TLVn5Sa9Y3fJjiGZwkjkiF1dmR1XQwwgcQ",
};

export function getAgentAddress(
  agentId: string,
  dbValue: string | null,
): string | null {
  switch (MODE) {
    case "live":
      // TODO(赛后): 异步调 AgentRegistry.getAgent() 后移入缓存
      return dbValue ?? null;
    case "preconfig":
      return PRECONFIG_ADDRESSES[agentId] ?? null;
    default:
      // mock 模式 → 交给 derive8004Id 处理
      return null;
  }
}
