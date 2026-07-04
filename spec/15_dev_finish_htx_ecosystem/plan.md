# Spec 15: 执行计划

> **总估时**: 模块 A 约 1.5h + 模块 B 约 0.5h + 模块 C 约 1h
> **执行顺序**: A → B（可并行）→ C（需合约部署后验证，纯配置无需代码）
> **分支**: 在 `main` 上直接开发

---

## 模块 A：$HTX Economy Display（~1.5h）

### A01 — 扩展 Type 定义（~10min）

**文件**: `apps/web/lib/types.ts`

在 `Market` 接口新增（可选字段）：
```typescript
htxBuybackTotal?: number;  // 累计 $HTX Buyback USDD 等价值
```

在 `Agent` 接口新增：
```typescript
htxEarned?: number;         // 累计 $HTX 收益（USDD 等价值）
```

### A02 — TradePanel 底部 Buyback 计数器（~30min）

**文件**: `apps/web/components/trade-panel.tsx`

替换底部底部文字：
```
"0.10% fee · resolves via AI consensus"
```
→
```
"0.10% fee → $HTX Buyback: {total} USDD · resolves via AI consensus"
```

实现：
1. 新增 `buybackTotal` useState，默认从 `localStorage` 读取（持久化跨会话演示）
2. buy 和 sell 成功后，fee 的 50% 累加到 `buybackTotal`（平台费的一半流入 Buyback）
3. 更新 `localStorage` 存储
4. Buyback 值用 `formatUSD(total, {compact: true})` 格式化

### A03 — Agent 卡片显示 $HTX Earned（~20min）

**文件**: `apps/web/app/agents/page.tsx`

在 Agent 卡片底部（`modelHint` 和 `region` 之间）新增一行：
```
"$HTX earned · {formatUSD(a.htxEarned ?? 0, {compact: true})}"
```

**文件**: `apps/web/lib/mock/agents.ts`

给每个 mock agent 添加 `htxEarned` 字段，值为 100-500 之间的值（BULL-1/NEUT-1 偏大，BEAR-2 偏小）。

### A04 — Agent 投票卡 $HTX 显示（~15min）

**文件**: `apps/web/components/oracle-deliberation.tsx`

在投票卡底部，8004 身份下方新增：
```
"$HTX earned: {formatUSD(agent.htxEarned ?? 0, {compact: true})}"
```

### A05 — 市场详情页 Stake 展示（~15min）

**文件**: `apps/web/app/markets/[slug]/page.tsx`

在 KPI 区域：
- 当 `poolState` 可用时：在 Liquidity 下方新增 Stake 行，值 = `formatUSD(Number(poolState.feePool) / 1e6, {compact: true}) + " $HTX"`
- 当 `poolState` 不可用时：显示 `"$HTX Stake: — (airbag)"`

---

## 模块 B：B.AI Hash Badge + 8004 身份展示（~0.5h）

### B01 — Agent 列表页 B.AI Hash Badge（~15min）

**文件**: `apps/web/app/agents/page.tsx`

在 Agent 卡片底部文字行中，如果 `modelHint` 包含 `"B.AI"`，显示：
```
"⚡ Powered by B.AI"
```
否则保持原样。

### B02 — Agent 投票卡 B.AI 标识（~10min）

**文件**: `apps/web/components/oracle-deliberation.tsx`

在投票卡 agent 信息的 `modelHint` 展示位置，如果匹配 `"B.AI"`，显示：
```
"⚡ Powered by B.AI"
```

### B03 — 8004 身份 Tronscan 超链接化（~10min）

**文件**: `apps/web/components/oracle-deliberation.tsx`

当前 8004 ID 只是纯文字。改为可点击的 Tronscan 链接：
```tsx
<a href={`https://shasta.tronscan.org/#/address/${agent.ba8004Id}`}
   target="_blank" rel="noopener noreferrer">
  {agent.ba8004Id} <ExternalLink className="inline size-3" />
</a>
```

---

## 模块 C：AgentRegistry 自建合约（~1h）

### C01 — 创建 AgentRegistry.sol（~15min）

**文件**: 新建 `apps/contracts/AgentRegistry.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice 最小 Agent 链上身份注册表
/// @dev 为 6 个已知 Agent (bull-1 ~ neut-2) 注册 TRON 地址。
///      部署后 owner 调用 6 次 register() 即可。
///      B.AI 8004 协议开通后，此合约可作为配置层被替换。
contract AgentRegistry {
    address public owner;
    mapping(string => address) public agents;
    
    event Registered(string indexed agentId, address indexed agentAddress);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    function register(string calldata agentId, address agentAddress) external onlyOwner {
        require(agentAddress != address(0), "Invalid address");
        agents[agentId] = agentAddress;
        emit Registered(agentId, agentAddress);
    }
    
    function getAgent(string calldata agentId) external view returns (address) {
        return agents[agentId];
    }
    
    function agentCount() external view returns (uint256) {
        // 固定 6 个 Agent
        return 6;
    }
}
```

### C02 — 部署脚本（~15min）

**文件**: 新建 `apps/contracts/scripts/deployAgentRegistry.js`（参考已有 deploy.js 格式）

功能：
1. 编译 AgentRegistry.sol（或用已有 truffle/tronbox 编译流程）
2. 部署到 Shasta
3. 输出合约地址
4. 调用 6 次 register() 注册 Agent

**注册地址策略**：6 个 Agent 共享部署钱包地址（简单演示），后续可改为各自独立地址。

### C03 — 前端配置层（~20min）

**文件**: 新建 `apps/web/lib/bai/agent-registry.ts`

```typescript
/**
 * Agent 链上身份配置层
 * 
 * 三档模式（由 NEXT_PUBLIC_AGENT_REGISTRY_MODE 控制）：
 *   mock       - 使用 derive8004Id() 派生串（当前行为，默认）
 *   preconfig  - 使用本地预设的 TRON 地址（格式正确，无链上交易）
 *   live       - 从链上 AgentRegistry 合约实时读取
 */

type RegistryMode = 'mock' | 'preconfig' | 'live';
const MODE: RegistryMode = 
  (process.env.NEXT_PUBLIC_AGENT_REGISTRY_MODE as RegistryMode) || 'mock';

// preconfig 模式：6 个硬编码 TRON 地址（部署后替换为真实地址）
const PRECONFIG_ADDRESSES: Record<string, string> = {
  'bull-1': 'TXYZ...01',
  'bull-2': 'TXYZ...02',
  'bear-1': 'TXYZ...03',
  'bear-2': 'TXYZ...04',
  'neut-1': 'TXYZ...05',
  'neut-2': 'TXYZ...06',
};

export function getAgentAddress(agentId: string, dbValue: string | null): string | null {
  switch (MODE) {
    case 'live':
      // 从 AgentRegistry 合约实时读取（需要合约已部署）
      return dbValue ?? null;
    case 'preconfig':
      return PRECONFIG_ADDRESSES[agentId] ?? null;
    default:
      return null; // mock 模式 → 交给 derive8004Id 处理
  }
}
```

### C04 — 修改 mappers.ts（~5min）

**文件**: `apps/web/lib/mappers.ts`

第 158 行修改 fallback 链：
```typescript
// 原来: ba8004Id: row.ba_8004_id ?? derive8004Id(row.agent_id),
// 改为:
ba8004Id: getAgentAddress(row.agent_id, row.ba_8004_id) ?? derive8004Id(row.agent_id),
```

### C05 — 环境变量（~2min）

**文件**: `.env.example`

新增：
```
# Agent 链上身份注册模式: mock | preconfig | live
NEXT_PUBLIC_AGENT_REGISTRY_MODE=preconfig
# AgentRegistry 合约地址（live 模式需要）
NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS=
```

---

## 注意事项

1. **模块 A/B 不涉及合约调用，纯前端可视化** — 气囊模式下可直接开发验证
2. **模块 C 的 preconfig 模式** — 不需要合约部署即可验证 UI，tronscan 链接可点击但地址查不到交易
3. **$HTX Buyback 计数器使用 localStorage 持久化** — 跨会话演示时可见累计值
4. **所有 mock agent 的 htxEarned 用确定性值**，保证 SSR/CSR 一致
5. **x402 保持 simulated**，等 B.AI 开通后改 URL 即可
