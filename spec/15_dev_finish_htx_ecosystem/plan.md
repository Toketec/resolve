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

## 模块 C：AgentRegistry 自建合约（~2h）

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
    
    function agentCount() external pure returns (uint256) {
        // 固定 6 个 Agent
        return 6;
    }
}
```

### C02 — 部署脚本改造：统一 deploy.js（~15min）

**文件**: `apps/contracts/scripts/deploy.js`

部署 AgentRegistry 时：
1. 调用 `deployArtifact(tronWeb, "AgentRegistry")` 部署合约
2. 注册 6 个 Agent（feeLimit: 10 TRX 防止 OUT_OF_ENERGY）
3. 收集部署信息（合约地址 + 每 Agent 的 txHash + TRON 地址）
4. 输出 `deployment-output.json` 文件供 sync 脚本读取

```javascript
// deploy.js 部署完成后输出:
{
  "deployer": "TLVn5Sa9Y3fJjiGZwkjkiF1dmR1XQwwgcQ",
  "contract": "AgentRegistry",
  "contractAddress": "TUPKCih56sjeJD5SwvH3zZ8TPtdJDAv6vy",
  "deployedAt": "2026-07-04T06:35:44.033Z",
  "agents": [
    { "agentId": "bull-1", "address": "TLVn5S...", "txHash": "5cd4f2..." },
    // ... 共 6 个
  ]
}
```

### C02b — Supabase DB Migration（~5min）

**文件**: 新建 `packages/db/migrations/00005_add_agent_onchain_fields.sql`

```sql
ALTER TABLE agents
  ADD COLUMN IF NOT EXISTS tron_address       TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deployment_tx_hash TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS registry_contract  TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deployment_status  TEXT DEFAULT 'pending'
    CHECK (deployment_status IN ('pending', 'deployed', 'failed')),
  ADD COLUMN IF NOT EXISTS deployed_at        TIMESTAMPTZ DEFAULT NULL;
```

在 Supabase Dashboard → SQL Editor 中手动执行。

**同时更新**：
- `packages/db/src/types.ts` — AgentRow 新增对应的 TypeScript 字段
- `packages/db/src/data.ts` — 新增 `updateAgentOnchain(agentId, input)` 函数
- `packages/db/src/index.ts` — 导出新函数

### C02c — 同步脚本（~15min）：部署 JSON → Supabase

**文件**: 新建 `apps/contracts/scripts/sync-agents-to-db.js`

功能：
1. 读取 `deployment-output.json`
2. 从 `apps/web/.env` 自动加载 Supabase 凭据（SUPABASE_URL / SUPABASE_ANON_KEY）
3. 通过 Supabase REST API (`PATCH /rest/v1/agents`) 逐条更新 6 个 Agent 的链上字段
4. 无需额外 npm 依赖（使用 Node 18 内置的 fetch）

用法：
```bash
cd apps/contracts
node scripts/sync-agents-to-db.js
```

### C03 — 前端配置层（~20min）

**文件**: `apps/web/lib/bai/agent-registry.ts`

```typescript
/**
 * Agent 链上身份配置层
 * 
 * 三档模式（由 NEXT_PUBLIC_AGENT_REGISTRY_MODE 控制）：
 *   mock       - 使用 derive8004Id() 派生串（当前行为，默认）
 *   preconfig  - 使用本地预设的 TRON 地址（格式正确，无链上交易）
 *   live       - 返回 DB tron_address（部署后 sync 写入）
 */
```

live 模式下返回 `LIVE_ADDRESSES[agentId]` 作为降级值（部署者地址），实际以 DB 为准。

新增导出函数：
- `getAgentAddress(agentId, dbValue)` — 按模式返回地址
- `getRegistryContractAddress()` — 返回合约地址
- `getRegistryMode()` — 返回当前模式

### C04 — 修改 mappers.ts（~5min）

**文件**: `apps/web/lib/mappers.ts`

ba8004Id 降级链（越前优先级越高）：
```typescript
ba8004Id: row.tron_address          // DB 部署字段（sync 写入）
  ?? getAgentAddress(row.agent_id, row.ba_8004_id)  // 配置层（live/preconfig/mock）
  ?? derive8004Id(row.agent_id),                     // 确定性派生（最终降级）
```

### C05 — 环境变量（~2min）

**文件**: `apps/web/.env`

```bash
# Agent 链上身份注册
NEXT_PUBLIC_AGENT_REGISTRY_MODE=live
NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS=<部署后的合约地址>
```

**文件**: `apps/web/lib/constants.ts`

新增导出：
```typescript
export const AGENT_REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS || "";
```

### C06 — 前端链上验证 UI（~30min）

**文件**: `apps/web/components/oracle-deliberation.tsx`

1. **AgentRegistry 合约验证横幅**：在投票卡上方展示合约地址 + "6 verified" 绿色徽章，点击跳转 Shasta 浏览器
2. **每张投票卡底部**：替换假 `8004:8004-XXX` → 绿色 `Verified on-chain · TLVn5S…gcQ` 徽章，点击跳转 Tronscan 验证地址
3. **数据来源**：直接读 `agent.ba8004Id`（来自 DB），不再客户端调链上 RPC

**文件**: `apps/web/app/agents/page.tsx`

1. **舰队页顶部**：AgentRegistry 合约验证横幅
2. **每张 Agent 卡片底部**：`on-chain · TLVn5S…gcQ` 地址行

---

## 注意事项

1. **模块 A/B 不涉及合约调用，纯前端可视化** — 气囊模式下可直接开发验证
2. **模块 C 完整链路** — 部署合约 → SQL migration → sync 脚本 → Web 读 DB。Web 端不直接调链上 RPC，避免 Shasta 节点波动和 TronWeb `call()` 解码 bug
3. **$HTX Buyback 计数器使用 localStorage 持久化** — 跨会话演示时可见累计值
4. **所有 mock agent 的 htxEarned 用确定性值**，保证 SSR/CSR 一致
5. **x402 保持 simulated**，等 B.AI 开通后改 URL 即可
6. **注册 feeLimit 设为 10 TRX** — 避免 Shasta 测试网 energy 不足导致 OUT_OF_ENERGY
7. **deployment-output.json 为部署快照** — 每次部署覆盖，保留最新一次注册结果
