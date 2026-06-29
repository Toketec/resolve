# RESOLVE — 总验收方案 & 测试检查表

> **版本**: 1.0 · **锚点**: 2026-06-28 · **用途**: 一页式验证全部 6 个 spec + 加分项，每次提交前运行
> **AI 自检原则**: 只跑 `pnpm typecheck` + `pnpm build` + 简单 curl — 不超过 60 秒
> **人工检查原则**: 步骤清晰、言简意赅、照着做就能验证

---

## 快速总览

| 阶段 | 交付物 | AI 自检 | 人工检查 | 对应 Spec |
|:----:|--------|:-------:|:--------:|:---------:|
| 1 | API 骨架 + 数据层 | ✓ 跑类型检查 | ✓ 浏览器/curl 验证 | [spec/1/check.md](../spec/1_dev_finish_core_api/check.md) |
| 2 | TronLink 钱包连接 | ✓ 跑类型检查 | ✓ 浏览器实测 | [spec/2/check.md](../spec/2_dev_finish_wallet/check.md) |
| 3 | AI Oracle 推理 | ✓ 跑类型检查 | ✓ 真实 API 调用 | [spec/3/check.md](../spec/3_dev_finish_ai_oracle/check.md) |
| 4 | 合约 + 链上逻辑 | ✓ 跑类型检查 | ✓ 链上验证 | [spec/4/check.md](../spec/4_dev_finish_contract/check.md) |
| 5 | Walking Skeleton 集成 | ✓ 跑类型检查 | ✓ 浏览器全流程 | [spec/5/check.md](../spec/5_dev_finish_integration/check.md) |
| 6 | Demo 打磨 (UX/动画) | ✓ 跑类型检查 | ✓ 浏览器 Demo 模拟 | [spec/6/check.md](../spec/6_dev_finish_demo_ux/check.md) |
| **E1** | 🆕 **$HTX 经济展示** | ✓ 跑类型检查 | ✓ 检查 Buyback + Agent 激励 UI | C-20 |
| **E2** | 🆕 **更多 HTX API** | ✓ 跑类型检查 | ✓ 检查订单簿 + K 线图表 | C-21 |
| **E3** | 🆕 **B.AI 算力徽章** | ✓ 跑类型检查 | ✓ 检查 "Powered by B.AI" | C-22 |

> **每个 spec 都有独立的详细 check.md** — 从上方表格展开查看逐步验证。本文件是**总编排队**，协调所有 spec 并运行 Hero Market 终验。

---

## 🔧 AI 自检（通用 — 每次提交前执行）

```bash
# === 1. 类型检查（10秒）===
pnpm typecheck

# === 2. 构建验证（30秒）===
pnpm build

# === 3. 开发服务器可达性（如果已启动）===
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/markets
```

**如果以上任一失败 → 不提交，先修。**

---

## 🧪 人工验证（按 spec 展开）

### ✅ Spec 1 — Core API Routes & Data Layer

**前提**: `pnpm dev` 在本地运行，终端无报错。

**详细步骤**: 参见 [spec/1/check.md](../spec/1_dev_finish_core_api/check.md)

**概要**:
1. `curl http://localhost:3000/api/markets` → JSON 数组，6+ 条市场
2. `curl http://localhost:3000/api/markets/btc-150k-2026` → 单条市场，slug 匹配
3. `curl http://localhost:3000/api/markets/btc-150k-2026/resolve` → AIConsensus，含 votes
4. `curl http://localhost:3000/api/agents` → 6 个 Agent（全部 active）
5. `curl -X POST http://localhost:3000/api/buy ...` → Position，含 txHash
6. `curl http://localhost:3000/api/price/BTC` → 价格数据，再次调用验证非静态值

---

### ✅ Spec 2 — TronLink Wallet Connection

**前提**: Chrome 已安装 TronLink 扩展，已切换到 Shasta 测试网。

**详细步骤**: 参见 [spec/2/check.md](../spec/2_dev_finish_wallet/check.md)

**概要**:
1. 隐身窗口 → `localhost:3000` → 显示 "Install TronLink →"
2. 安装后刷新 → 按钮变为 "Connect Wallet"
3. 点击 → TronLink 弹窗 → 确认 → 地址 `T...xxx` + 绿点 + "Shasta"
4. 切换 TronLink 账户 → 前端地址自动更新
5. Disconnect → 回到 "Connect Wallet"
6. 刷新页面 → 仍为已连接状态（会话持久化）

---

### ✅ Spec 3 — AI Oracle Reasoning Pipeline

**前提**: `.env` 已配 `ANTHROPIC_API_KEY`。

**详细步骤**: 参见 [spec/3/check.md](../spec/3_dev_finish_ai_oracle/check.md)

**概要**:
1. 运行 AI oracle 脚本 → 返回 AIConsensus，含 3 条 vote
2. 每条 vote: agentId/outcome/confidence/evidence[].{source,url,snippet}
3. 共识: status="consensus"，confidence ≥ 0.65
4. 投票体现角色差异（BULL-1 偏向 YES，BEAR-1 NO/中性，NEUT-1 数据驱动）
5. 不带 API key → mock fallback，不崩溃
6. 同参数调用 2 次 → 结果在合理范围内一致
7. evidence 包含 HTX 价格数据

---

### ✅ Spec 4 — Settlement Contract & B.AI Integration

**前提**: Shasta 测试网有 USDD 测试币，合约已部署。

**详细步骤**: 参见 [spec/4/check.md](../spec/4_dev_finish_contract/check.md)

**概要**:
1. 合约在 Shasta 浏览器可见，有交易记录
2. 合约地址与 `lib/constants.ts` 一致
3. `buyShares()` 通过 TronLink → 成功 → txHash
4. 测试网浏览器中 buy 交易 → 成功，余额增加
5. 气囊 ON → settle → `{ txHash, simulated: true }`，余额不变
6. 气囊 OFF → settle → 赢家收到 USDD
7. 🆕 B.AI 8004 身份在 B.AI 平台可查询
8. 🆕 resolve() 过程中触发 x402 → 交易哈希可见
9. 代码中无明文私钥/助记词

---

### ✅ Spec 5 — Walking Skeleton Frontend ⇄ API

**前提**: spec 1–4 已完成，API 可返回真实数据。

**详细步骤**: 参见 [spec/5/check.md](../spec/5_dev_finish_integration/check.md)

**概要（seam 验证）**:
1. 首页: 市场列表从 API 读取（非 mock import）— **seam mock→API**
2. 市场详情: 从 `GET /api/markets/[slug]` 加载 — **seam slug→数据**
3. 连接钱包 → 调用 tronLink.connect() — **seam UI→钱包**
4. Buy YES → `POST /api/buy` → TronLink 签名 → 仓位 — **seam 买入→链**
5. Resolve → `GET /api/markets/[slug]/resolve` → ConsensusMeter 显示投票 — **seam resolve→AI**
6. Settle → `POST /api/settle` → txHash — **seam 结算→合约**
7. `/agents` → `GET /api/agents` → 6 个 Agent（全部 active）
8. 🆕 Agent 详情显示 8004 ID + Tronscan 链接
9. 🆕 ConsensusMeter 下方显示 x402 交易哈希

---

### ✅ Spec 6 — Demo Controls & UX Polish

**前提**: spec 5 已跑通，完整 Walking Skeleton 可操作。

**详细步骤**: 参见 [spec/6/check.md](../spec/6_dev_finish_demo_ux/check.md)

**概要**:
1. `/markets/...?dev=1` → Force Resolve 按钮可见（不加参数则隐藏）
2. 点击 Force Resolve → 状态变为 `resolving`
3. 投票一条接一条出现（~1.5s 间隔），淡入 + 上移动画
4. ConsensusMeter 进度条随投票逐步增长
5. 3 条投票全部出现 → status "consensus" + ✓ 标记
6. TradePanel 显示 "USDD"（非 USDC）— 全局 USDC→USDD 替换
7. 断网 → 友好错误 + Retry 按钮，页面不崩溃
8. 加载中 → "Processing..." + 禁用状态
9. 🆕 Agent 8004 卡片，带 Tronscan 链接
10. 🆕 ConsensusMeter 区域显示 x402 交易哈希
11. 🆕 **$HTX Buyback** 计数器（C-20）
12. 🆕 **Agent $HTX 激励** 显示（C-20）
13. 🆕 **HTX 订单簿深度** 图（C-21）
14. 🆕 **HTX K线走势** 图（C-21）
15. 🆕 **B.AI 算力徽章** 在 Agent 卡片上（C-22）

---

## 🎬 Hero Market 终验 — 完整演示流程

> 决赛前一次性跑通。每次改动后至少跑一轮端到端。

| # | 步骤 | 操作 | 通过标准 | 时间 |
|:-:|------|------|----------|:---:|
| H1 | 钱包连接 | 打开页面 → 连接 TronLink | 显示地址 `T...xxx` + 绿点 + Shasta | 5s |
| H2 | 进入市场 | 点击英雄市场卡片 | 详情页加载正常，TradePanel 可见 | 3s |
| H3 | 买入 | 选 YES → 输入金额 → Buy | TronLink 签名 → 仓位显示 | 10s |
| H4 | 触发 resolve | Secret tap / `?dev=1` Force | status → resolving | 1s |
| H5 | AI 推理 | 等待 votes 一条一条出现 | 3 条 votes × 1.5s = 4.5s | 5s |
| H6 | 共识达成 | 观察 ConsensusMeter | ≥0.65 ✓ | — |
| H7 | 结算 | 点击 Settle | txHash 显示 | 5s |
| H8 | 检查赔付 | 钱包余额变化 | USDD 余额增加 | — |
| H9 🆕 | B.AI 展示 | Agent 8004 ID 可见 | 跳转 Tronscan | — |
| H10 🆕 | x402 txHash 可见 | ConsensusMeter 下方 | 链上链接有效 | — |
| **H11** 🆕 | **$HTX Buyback** | TradePanel 底部累计数 | 计数器可见且非零 | — |
| **H12** 🆕 | **HTX K线+深度** | 市场详情页图表 | 图表渲染真实数据 | — |
| **H13** 🆕 | **B.AI 算力徽章** | Agent 卡片 | "Powered by B.AI" 可见 | — |

**总演示时长**: ~30 秒（含 4.5s AI 推理等待）

---

## 📋 决赛提交检查清单

- [ ] GitHub README 完整（项目介绍、团队、demo 链接、架构图）
- [ ] Demo 演示视频 45–60s 已录制（Screenflow 录屏）
- [ ] Pitch Deck 10+ 页（问题→方案→技术→商业→团队→路线图）
- [ ] 公网可访问（Vercel 部署 `resolve-prediction.vercel.app`）
- [ ] 提交表单信息完整
- [ ] **生态资源使用说明 — 在提交材料中专门写明使用了 HTX API、$HTX 经济模型、B.AI 算力** ⚠️ 关键
- [ ] 至少 3 个评委 Q&A 已准备
- [ ] Hero Market 端到端完整跑通 ≥ 5 次
- [ ] 🆕 $HTX Fee Pool / Buyback 计数器在 UI 正确显示
- [ ] 🆕 HTX 订单簿 + K 线图在市场详情页可见
- [ ] 🆕 Agent 卡片显示 "Powered by B.AI" 徽章

---

## ⚡ AI 自检速查（开发阶段，每次提交前）

```bash
# 30秒检查清单
pnpm typecheck  || exit 1
pnpm build      || exit 1
echo "AI 自检通过 ✓"
```

**仅此两条。** 花哨的测试框架留给正式项目——黑客松 AI 自检唯一需要的就是不编译报错、不构建失败。
