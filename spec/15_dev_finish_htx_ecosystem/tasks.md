# Spec 15: 任务跟踪

## 模块 A：$HTX Economy Display

| # | 任务 | 文件 | 状态 | Done 检查条件 |
|:-:|------|------|:----:|---------------|
| A01 | Type 定义扩展（htxBuybackTotal / htxEarned） | `apps/web/lib/types.ts` | ☐ | `pnpm typecheck` 通过；Market 和 Agent 接口新增可选字段 |
| A02 | TradePanel Buyback 计数器 | `apps/web/components/trade-panel.tsx` | ☐ | 底部显示 "$HTX Buyback: X USDD"；buy/sell 后计数累加；localStorage 持久化 |
| A03 | Agent 列表页 $HTX Earned | `apps/web/app/agents/page.tsx` + `apps/web/lib/mock/agents.ts` | ☐ | Agent 卡片底部显示 "$HTX earned: X"；mock 数据有 htxEarned |
| A04 | Agent 投票卡 $HTX 显示 | `apps/web/components/oracle-deliberation.tsx` | ☐ | 投票卡底部显示 "$HTX earned: X" |
| A05 | 市场详情页 Stake 展示 | `apps/web/app/markets/[slug]/page.tsx` | ☐ | feePool 可用时显示 "Stake: X $HTX"；不可用时占位显示 |

## 模块 B：B.AI Hash Badge + 8004 身份

| # | 任务 | 文件 | 状态 | Done 检查条件 |
|:-:|------|------|:----:|---------------|
| B01 | Agent 列表页 B.AI Hash Badge | `apps/web/app/agents/page.tsx` | ☐ | modelHint 含 "B.AI" 的 Agent 显示 "⚡ Powered by B.AI" |
| B02 | 投票卡 B.AI 标识 | `apps/web/components/oracle-deliberation.tsx` | ☐ | 投票卡 modelHint 含 "B.AI" 时显示标识 |
| B03 | 8004 身份 Tronscan 超链接 | `apps/web/components/oracle-deliberation.tsx` | ☐ | 8004 ID 可点击跳转 Tronscan；外部链接图标可见 |

## 模块 C：AgentRegistry 自建合约

| # | 任务 | 文件 | 状态 | Done 检查条件 |
|:-:|------|------|:----:|---------------|
| C01 | 创建 AgentRegistry.sol | `apps/contracts/AgentRegistry.sol` | ☐ | 合约编译通过；含 register/getAgent 函数和 Registered 事件 |
| C02 | 部署脚本 + 注册 6 Agent | `apps/contracts/scripts/deployAgentRegistry.js` | ☐ | 部署到 Shasta 后 6 次 register() 调用成功；合约地址可查 |
| C03 | 前端配置层 bai/agent-registry.ts | `apps/web/lib/bai/agent-registry.ts` | ☐ | 三档模式（mock/preconfig/live）可用；typecheck 通过 |
| C04 | 修改 mappers.ts fallback 链 | `apps/web/lib/mappers.ts` | ☐ | getAgentAddress() 作为中间层，不打破现有 mock 降级 |
| C05 | 环境变量 + .env.example | `.env.example` | ☐ | AGENT_REGISTRY_MODE 和 AGENT_REGISTRY_ADDRESS 条目存在 |

## 全局验证

| # | 任务 | 命令 | 状态 | Done 检查条件 |
|:-:|------|------|:----:|---------------|
| V01 | `pnpm typecheck` | `pnpm typecheck` | ☐ | 零错误零警告 |
| V02 | `pnpm build` | `pnpm build` | ☐ | 22 条路由全部构建成功 |
| V03 | 手动验收 | 浏览器（按 check.md） | ☐ | 所有验收步骤通过 |
