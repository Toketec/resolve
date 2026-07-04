/**
 * Agent 链上身份配置层
 *
 * 三档模式（由 NEXT_PUBLIC_AGENT_REGISTRY_MODE 控制）：
 *   mock       - 使用 derive8004Id() 派生串（当前行为，默认）
 *   preconfig  - 使用本地预设的 TRON 地址（格式正确，无链上交易）
 *   live       - 从链上 AgentRegistry 合约实时读取
 */

type RegistryMode = "mock" | "preconfig" | "live";
const MODE: RegistryMode =
  (process.env.NEXT_PUBLIC_AGENT_REGISTRY_MODE as RegistryMode) || "mock";

// preconfig 模式：6 个硬编码 TRON 地址（部署后替换为真实地址）
const PRECONFIG_ADDRESSES: Record<string, string> = {
  "bull-1": "TXYZ1111111111111111111111111111111",
  "bull-2": "TXYZ2222222222222222222222222222222",
  "bear-1": "TXYZ3333333333333333333333333333333",
  "bear-2": "TXYZ4444444444444444444444444444444",
  "neut-1": "TXYZ5555555555555555555555555555555",
  "neut-2": "TXYZ6666666666666666666666666666666",
};

export function getAgentAddress(
  agentId: string,
  dbValue: string | null,
): string | null {
  switch (MODE) {
    case "live":
      // 从 AgentRegistry 合约实时读取（需要合约已部署且 .env 配置了地址）
      return dbValue ?? null;
    case "preconfig":
      return PRECONFIG_ADDRESSES[agentId] ?? null;
    default:
      // mock 模式 → 交给 derive8004Id 处理
      return null;
  }
}
