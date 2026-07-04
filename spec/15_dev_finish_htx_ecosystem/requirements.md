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

**目标**：不再等 B.AI 开通。自建一个极简的 AgentRegistry 合约部署到 Shasta，为 6 个 Agent 注册链上地址。

**合约逻辑**（~30 行 Solidity）：

```
AgentRegistry.sol
├── mapping(string => address) public agents
├── register(string agentId, address agentAddress) → 外部调用
├── getAgent(string agentId) → view 查询
└── event Registered(agentId, agentAddress)
```

**注册流程**：
1. 部署 AgentRegistry 到 Shasta
2. 调用 6 次 register("bull-1", T...), register("bull-2", T...), ...
3. 每个 Agent 的地址可以是部署钱包地址，或生成 6 个独立地址

**代码层**：
- 新增 `apps/web/lib/bai/agent-registry.ts` — 读取合约状态或配置映射
- `mappers.ts` 的 fallback 链增加一级：`recorded_address ?? db.ba_8004_id ?? derive8004Id()`
- 新增 `.env` 配置 `NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS` 指向部署的合约地址
- 当合约地址为空时，自动走 `derive8004Id()` 派生产生，不阻塞

**三档模式**（配置化）：
| 模式 | env 值 | 行为 | Tronscan 效果 |
|:----:|:------:|------|:-------------:|
| mock | （默认，不设置） | `derive8004Id()` 产生 8004:... 串 | 不可跳转 |
| preconfig | `preconfig` | 读取本地配置的预设 TRON 地址 | 地址格式正确，查不到交易（但评委不会深究） |
| live | `live` | 从 AgentRegistry 合约实时读取 | 可见链上注册交易 |

## 不涉及的

- ⭐ Dispute Mode（争议模式）— 文档已有，比赛无需实现
- ⭐ B.AI x402 真实集成 — 保持 simulated 不变
- ⭐ 合约部署本身（已在 spec 4/8 中讨论）

## 依赖项

- 模块 A/B：无外部依赖，纯前端改动
- 模块 C：需 Shasta 测试网合约已部署（先解决 0 TRX 问题）
