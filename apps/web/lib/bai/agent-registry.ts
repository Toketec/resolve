/**
 * Agent 链上身份配置层
 *
 * 三档模式（由 NEXT_PUBLIC_AGENT_REGISTRY_MODE 控制）：
 *   mock        - 使用 derive8004Id() 派生串（默认，无链上语义）
 *   preconfig   - 使用本地预设的 TRON 地址
 *   live        - 返回 AgentRegistry 合约中注册的真实 TRON 地址
 *
 * live 模式下，前端组件应优先调用 /api/agents/verify 获取最新链上数据；
 * 本函数返回的地址为部署时写入的初始地址（部署者地址），作为降级兜底。
 */

type RegistryMode = "mock" | "preconfig" | "live";
const MODE: RegistryMode =
  (process.env.NEXT_PUBLIC_AGENT_REGISTRY_MODE as RegistryMode) || "mock";

// preconfig 模式：预设 TRON 地址
const PRECONFIG_ADDRESSES: Record<string, string> = {
  "bull-1": "TXYZ1111111111111111111111111111111",
  "bull-2": "TXYZ2222222222222222222222222222222",
  "bear-1": "TXYZ3333333333333333333333333333333",
  "bear-2": "TXYZ4444444444444444444444444444444",
  "neut-1": "TXYZ5555555555555555555555555555555",
  "neut-2": "TXYZ6666666666666666666666666666666",
};

// live 模式：AgentRegistry 合约中注册的初始地址（部署者地址）
// 部署后通过 /api/agents/verify 实时读取链上数据并覆盖此处
const LIVE_ADDRESSES: Record<string, string> = {
  "bull-1": "TLVn5Sa9Y3fJjiGZwkjkiF1dmR1XQwwgcQ",
  "bull-2": "TLVn5Sa9Y3fJjiGZwkjkiF1dmR1XQwwgcQ",
  "bear-1": "TLVn5Sa9Y3fJjiGZwkjkiF1dmR1XQwwgcQ",
  "bear-2": "TLVn5Sa9Y3fJjiGZwkjkiF1dmR1XQwwgcQ",
  "neut-1": "TLVn5Sa9Y3fJjiGZwkjkiF1dmR1XQwwgcQ",
  "neut-2": "TLVn5Sa9Y3fJjiGZwkjkiF1dmR1XQwwgcQ",
};

/**
 * 获取 Agent 的链上 TRON 地址。
 *
 * live 模式：返回 AgentRegistry 合约中注册的 TRON 地址。
 *   前端组件可进一步调用 /api/agents/verify 获取最新链上数据。
 * preconfig 模式：返回预设的本地地址。
 * mock 模式：返回 null → 交给 derive8004Id() 派生。
 */
export function getAgentAddress(
  agentId: string,
  dbValue: string | null,
): string | null {
  switch (MODE) {
    case "live":
      // 优先使用 DB 值，其次使用 LIVE_ADDRESSES（部署时注册的初始地址），最后返回 null
      return dbValue ?? LIVE_ADDRESSES[agentId] ?? null;
    case "preconfig":
      return PRECONFIG_ADDRESSES[agentId] ?? null;
    default:
      // mock 模式 → 交给 derive8004Id 处理
      return null;
  }
}

/** 获取 AgentRegistry 合约地址（live 模式） */
export function getRegistryContractAddress(): string | null {
  if (MODE !== "live") return null;
  return process.env.NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS || null;
}

/** 当前模式 */
export function getRegistryMode(): RegistryMode {
  return MODE;
}
