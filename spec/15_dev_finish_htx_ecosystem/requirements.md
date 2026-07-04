# Spec 15: HTX 生态展示补全 — $HTX Economy + B.AI Hash Badge + Agent 链上注册

## 问题

当前 RESOLVE 项目已实现了 14 个核心开发 Spec（核心 API、钱包、AI 预言机、合约、集成、Demo UX、组合 API、合约连接、文本描述、Agent 配置同步、市场部署、AMM/Sell、真实结算、价格同步），但在 HTX 生态展示层存在 4 个未实现功能：

| # | 功能 | 文档宣称 | 实际状态 | 评分影响 |
|:-:|------|----------|:--------:|:--------:|
| ① | **$HTX Economy Display** | "UI 已实现" | ❌ 0% 未实现 | 商业潜力（15-20%） |
| ② | **B.AI Hash Badge** | "Powered by B.AI" 标识 | ❌ 0% 未实现 | 生态集成（5-10%） |
| ③ | **Agent 链上注册** | 显示 TRON 地址而非派生串 | ❌ `8004:8004-742` 格式 | AI/Web3 融合（10-15%） |
| ④ | **B.AI x402 微支付** | "Agent 自我支付" | ❌ 全 simulated | AI/Web3 融合（5-10%） |

> **③ 不再依赖 B.AI 8004 协议**。本质目标是"Agent 有链上可查地址"，自建最小合约即可实现。B.AI 开通后可通过配置层切换。
> **④ x402 保持现状**。UI 上仅一个 txHash 标签，45 秒 demo 中评委几乎不可能验证，等 B.AI 开通后改一行 URL 即可。

## 分工方案

4 个功能分为 **2 个 UI 模块（独立、无依赖）** + **1 个合约模块** + **1 个保持现状**：

```
                  ┌─────────────────────────────┐
                  │  Spec 15: HTX 生态展示补全    │
                  └──────────┬──────────────────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
     ┌──────▼──────┐  ┌─────▼──────┐  ┌──────▼──────┐
     │  模块 A     │  │  模块 B    │  │  模块 C     │
     │ $HTX 经济   │  │ B.AI 标识+ │  │ AgentRegistry│
     │ 纯UI展示    │  │ Hash Badge │  │ 自建合约     │
     │ 无依赖      │  │ 纯UI      │  │ 依赖合约部署  │
     └─────────────┘  └────────────┘  └──────┬───────┘
                                             │
                                     x402 保持现状
                                     (simulated=true)
```

**执行顺序**：A → B（可并行）→ C

**x402 决策说明**：x402 保持 simulated 不变。原因：
1. UI 上仅一个 txHash 标签，45 秒 demo 中评委几乎不可能点开 Tronscan 验证
2. B.AI 未开通，自建替代没有必要（x402 本质是 HTTP 402 支付协议演示，非核心功能）
3. 待 B.AI 开通后，改 `x402.ts` 中的端点 URL 即可切换

## 各模块详述

### 模块 A：$HTX Economy Display（C-20 / E1）

**现有代码分析**：
- `apps/web/components/trade-panel.tsx` — 底部显示 `"0.10% fee · resolves via AI consensus"`，无任何 $HTX 引用
- `apps/web/lib/mock/markets.ts` — 无 `$HTX` 相关字段
- `apps/web/lib/types.ts` — Market/Agent 类型无 `$HTX` 字段

**目标**：在 3 个位置展示 $HTX 经济模型（纯 UI，不可否认账，无需链上调用）：

| 位置 | 展示内容 | 数据来源 |
|------|---------|---------|
| TradePanel 底部 | 累计 $HTX Buyback 计数器 + fee 流向标语 | localStorage 持久化 |
| Agent 卡片/详情 | $HTX Earned 金额 | Agent 数据结构新增 htxEarned |
| 市场详情页顶部 | "Market Stake: X $HTX" | 从 feePool 派生 |

**设计**：
- $HTX Buyback 计数器：TradePanel 底部显示 `"0.10% fee → $HTX Buyback: {total}"`
- 每次交易（buy/sell）时，fee 的 50% 计入 Buyback 累计值（前端累加）
- Agent 卡片底部新增一行 `"$HTX earned: {amount}"`
- 市场详情页 KPI 区域新增 Stake 行

### 模块 B：B.AI Hash Badge + 8004 身份展示真实化（C-22 / E3）

**现有代码分析**：
- `apps/web/lib/mappers.ts` — `derive8004Id()` 产生 `8004:8004-742` 格式
- `apps/web/components/oracle-deliberation.tsx` — 已在投票卡展示 ba8004Id
- 缺少 "Powered by B.AI" 视觉标识

**目标**：

| 子项 | 展示位置 | 改动 |
|------|---------|------|
| B.AI Hash Badge | Agent 卡片 `modelHint` 旁 | 显示 "⚡ Powered by B.AI" |
| 8004 身份优化 | 投票卡 + Agent 列表页 | Tronscan 可点击超链接 |

### 模块 C：AgentRegistry 自建合约（替换 B.AI 8004）

**目标**：不再等 B.AI 开通。自建一个极简的 AgentRegistry 合约部署到 Shasta，为 6 个 Agent 注册链上地址。部署后通过 sync 脚本将链上数据写入 Supabase，Web 端从 DB 读取展示。

**合约逻辑**（~37 行 Solidity）：

```
AgentRegistry.sol
├── mapping(string => address) public agents
├── register(string agentId, address agentAddress) → 外部调用
├── getAgent(string agentId) → view 查询
├── agentCount() → pure 返回 6
└── event Registered(agentId, agentAddress)
```

**完整数据流（部署 → DB → Web）**：

```
deploy.js AgentRegistry
  ↓ 产出 deployment-output.json（合约地址 + 每 Agent 的 txHash + TRON 地址）
  ↓
Supabase migration 00005（添加 tron_address / deployment_tx_hash / registry_contract / deployment_status / deployed_at 列）
  ↓
sync-agents-to-db.js（读取 JSON → Supabase REST API → 写入 agents 表）
  ↓
Web 端 /api/agents → DB listAgents() → agentRowToAgent()
  ↓ ba8004Id = tron_address（来自 DB）
  ↓
前端展示 "Verified on-chain · TLVn5S…gcQ" + AgentRegistry 合约验证横幅
```

**代码层**：
- `apps/contracts/AgentRegistry.sol` — 合约源码（已存在）
- `apps/contracts/scripts/deploy.js` — 统一部署脚本，部署后输出 `deployment-output.json`
- `apps/contracts/scripts/sync-agents-to-db.js` — 读取 JSON → Supabase REST API 写入（无需额外依赖）
- `packages/db/migrations/00005_add_agent_onchain_fields.sql` — ALTER TABLE 添加 5 个链上字段
- `packages/db/src/types.ts` — AgentRow 新增 tron_address 等字段
- `packages/db/src/data.ts` — 新增 `updateAgentOnchain()` 函数
- `apps/web/lib/bai/agent-registry.ts` — 三档模式配置层 + 导出 `getAgentAddress()`/`getRegistryContractAddress()`
- `apps/web/lib/mappers.ts` — ba8004Id 降级链：`tron_address ?? getAgentAddress() ?? derive8004Id()`
- `apps/web/lib/constants.ts` — 新增 `AGENT_REGISTRY_ADDRESS` 常量
- `apps/web/components/oracle-deliberation.tsx` — "Verified on-chain" 绿色徽章 + AgentRegistry 合约验证横幅
- `apps/web/app/agents/page.tsx` — Agent 舰队页验证区块 + 每张卡片底部 on-chain 地址

**三档模式**（配置化）：
| 模式 | env 值 | 行为 | 链上展示效果 |
|:----:|:------:|------|:-------------:|
| mock | （默认） | `derive8004Id()` 产生 8004:... 串 | 不可跳转 |
| preconfig | `preconfig` | 读取本地预设 TRON 地址 | 格式正确，查不到交易 |
| live | `live` | 从 DB tron_address 读取（部署时 sync 写入） | 可见注册交易 + AgentRegistry 合约验证横幅 |

**关键设计决策**：
- Web 端不直接调链上 RPC 读取 Agent 地址，而是从 DB 读取 — 避免 Shasta 节点波动、TronWeb `call()` 返回值解码 bug
- 部署合约时一次性写入 DB，后续全从 DB 读
- `deployment-output.json` 保留完整部署快照，可追溯每笔注册交易

## 不涉及的

- ⭐ Dispute Mode（争议模式）— 文档已有，比赛无需实现
- ⭐ B.AI x402 真实集成 — 保持 simulated 不变
- ⭐ 合约部署本身（已在 spec 4/8 中讨论）

## 依赖项

- 模块 A/B：无外部依赖，纯前端改动
- 模块 C：需 Shasta 测试网合约已部署（先解决 0 TRX 问题）
