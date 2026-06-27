# 5_dev_finish_integration — Walking Skeleton: Frontend ⇄ API ⇄ Real Logic

## 解决的问题

前端当前直接从 `lib/mock/` 读取硬编码数据、UI 按钮没有任何真实功能。
前 4 个 spec 各自创建了独立模块（API + Wallet + AI + Contract），
但没有一个连接的终端用户流程。此规格将一切串联为端到端的 Walking Skeleton。

## 工作边界

- ✅ 首页（landing）市场数据从 API 读取而非直接 import mock
- ✅ 市场列表页（/markets）从 `GET /api/markets` 读取
- ✅ 市场详情页（/[slug]）从 `GET /api/markets/[slug]` 读取
- ✅ TradePanel connect wallet → 调用 spec 2 的 TronLink 连接
- ✅ TradePanel buy → 调用 `POST /api/buy`（先 mock，再接 spec 4 真实合约）
- ✅ 市场到期时 → 调用 `GET /api/markets/[slug]/resolve`
- ✅ ConsensusMeter + Agent 投票从 resolve API 渲染
- ✅ settle 按钮 → 调用 `POST /api/settle`
- ✅ Agent 页面（/agents）从 `GET /api/agents` 读取
- ✅ Portfolio 页面从 store 读取持仓
- ✅ 🆕 **B.AI 8004身份展示** — Agent详情页增加8004 ID、链上链接
- ✅ 🆕 **x402支付展示** — ConsensusMeter区域增加x402交易hash展示
- ❌ 不实现投票浮现动画（那是 spec 6）
- ❌ 不实现隐藏的"立即解析"触发器（那是 spec 6）
- ❌ 不修改现有 mock 内容——只是切换数据源

## 依赖项

- 前置: spec 1（API routes）✅ 已创建
- 前置: spec 2（TronLink 钱包）— 连接功能
- 前置: spec 3（AI Oracle）— resolve 返回值
- 前置: spec 4（合约）— buy/settle 链上逻辑
- **策略**: 先全部用 mock API 跑通 UI，再逐个替换真实调用

## 验收标准

1. 首页展示来自 API 的市场列表（不再直接 import mock）
2. 市场详情页渲染与之前完全一致（数据形状不变）
3. TradePanel 中点击 "Buy YES" → 通过 API 创建 Position
4. 市场详情页的 Oracle deliberation 部分显示来自 resolve API 的数据
5. Agent 页面从 API 读取
6. 🆕 Agent详情展示8004 ID并链接至Tronscan
7. 🆕 ConsensusMeter下方展示x402交易哈希
8. `pnpm typecheck` + `pnpm build` 通过
9. 开发环境 `next dev` 可正常访问所有页面
10. 页面内容和结构迁移前后视觉无差异
