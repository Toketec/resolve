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
| C01 | 创建 AgentRegistry.sol | `apps/contracts/AgentRegistry.sol` | ✅ | 合约编译通过；含 register/getAgent 函数和 Registered 事件 |
| C02 | 统一部署脚本（deploy.js）+ 产出 JSON | `apps/contracts/scripts/deploy.js` | ✅ | 部署到 Shasta 后 6 次 register() 成功；输出 `deployment-output.json`；feeLimit 10 TRX 防 OUT_OF_ENERGY |
| C02b | DB Migration 00005（添加链上字段） | `packages/db/migrations/00005_add_agent_onchain_fields.sql` | ✅ | agents 表新增 tron_address / deployment_tx_hash / registry_contract / deployment_status / deployed_at 列 |
| C02c | DB TypeScript 类型 + data.ts 更新 | `packages/db/src/types.ts` + `packages/db/src/data.ts` | ✅ | AgentRow 新增 5 字段；updateAgentOnchain() 导出 |
| C02d | 同步脚本 sync-agents-to-db.js | `apps/contracts/scripts/sync-agents-to-db.js` | ✅ | 读取 deployment-output.json → Supabase REST API 写入；typecheck 通过 |
| C03 | 前端配置层 bai/agent-registry.ts | `apps/web/lib/bai/agent-registry.ts` | ✅ | 三档模式（mock/preconfig/live）；导出 getAgentAddress()/getRegistryContractAddress()；typecheck 通过 |
| C04 | 修改 mappers.ts fallback 链 | `apps/web/lib/mappers.ts` | ✅ | ba8004Id 降级链：tron_address → getAgentAddress() → derive8004Id() |
| C05 | 环境变量 + constants.ts | `apps/web/.env` + `apps/web/lib/constants.ts` | ✅ | AGENT_REGISTRY_ADDRESS 导出；.env 含 MODE=live + 合约地址 |
| C06 | OracleDeliberation 链上验证 UI | `apps/web/components/oracle-deliberation.tsx` | ✅ | AgentRegistry 合约验证横幅 + "Verified on-chain" 绿色徽章；不调链上 RPC，从 DB 读 |
| C07 | Agents 舰队页链上验证区块 | `apps/web/app/agents/page.tsx` | ✅ | 合约验证横幅 + 每张卡片底部 on-chain 地址行 |

## 全局验证

| # | 任务 | 命令 | 状态 | Done 检查条件 |
|:-:|------|------|:----:|---------------|
| V01 | `pnpm typecheck` | `pnpm typecheck` | ✅ | 全 4 包零错误零警告 |
| V02 | `pnpm build` | `pnpm build` | ⚠️ | Google Fonts 网络超时导致 next/font 失败（与代码改动无关） |
| V03 | 手动验收 | 浏览器（按 check.md） | ⏳ | 待 Supabase migration 执行 + sync 脚本运行后验收 |
