# ✅ Spec 5 — Walking Skeleton Integration 验收检查表

> **用途**: 验证前端 ⇄ API ⇄ 真实逻辑的每一条 seam（接缝）是否通畅
> **执行人**: 开发完成后由 AI 自检 + 人工浏览器验证
> **核心原则**: 每条检查强调 seam 两端的状态——数据从哪来到哪去，mock 切换干净

---

## 🔧 AI 自检（每次提交前运行）

```bash
# 10 秒类型检查
pnpm typecheck || exit 1

# 30 秒构建验证
pnpm build || exit 1

# 开发服务器可达性（如果已启动）
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/markets
```

**失败则停止提交，先修复。**

---

## 🧪 端到端检查点（5 条核心 seam）

### Seam 1: 首页市场列表 — mock → API

| # | 操作步骤 | 预期结果 | seam 验证 |
|:-:|----------|----------|-----------|
| 5.1 | 打开 `localhost:3000` | 首页展示市场卡片列表，内容与根 `GET /api/markets` 返回一致 | 数据源不再是 `import markets from '@/lib/mock'`，而是 `fetch('/api/markets')` |
| 5.2 | 打开开发者工具 → Network → 筛选 `api/markets` | 看到一条指向 `GET /api/markets` 的 XHR 请求，状态200 | 确认前端确实发出 HTTP 请求而非静默使用 mock |

### Seam 2: 市场详情页 — API 数据串联

| # | 操作步骤 | 预期结果 | seam 验证 |
|:-:|----------|----------|-----------|
| 5.3 | 点击第一个市场 → 进入 `/markets/btc-150k-2026` | 详情页加载：价格走势、Agent 列表、TradePanel 可见 | 页面从 `GET /api/markets/[slug]` 读取，数据形状与之前 mock 一致 |
| 5.4 | Network 筛选 `api/markets/btc-150k-2026` | 请求返回 id/slug/title/status/description/resolveTime 等完整字段 | API 返回字段覆盖页面全部渲染需求 |

### Seam 3: TradePanel — Wallet + Buy 操作流

| # | 操作步骤 | 预期结果 | seam 验证 |
|:-:|----------|----------|-----------|
| 5.5 | 点击「Connect Wallet」→ TronLink 授权 | 右上角地址 `T...xxx` + 绿点 + "Shasta" | 连接操作路由到 spec 2 的 `tronLink.connect()`，而非硬编码假连接 |
| 5.6 | 选择 YES → 输入 100 USDD → 点击「Buy YES」 | TronLink 签名弹窗 → 确认后 TradePanel 显示 "Order placed" + 仓位信息 | buy 调用 `POST /api/buy`（先走 mock 响应，再接 spec 4 真实合约签名） |
| 5.7 | 检查 Network → 找到 POST `/api/buy` 请求 | 请求 body 含 marketId/side/amountUSDT/walletAddress；响应含 id/txHash | seam: buy 请求 → API handler → store 更新 → UI 反馈 |

### Seam 4: Resolve + ConsensusMeter — AI Oracle 集成

| # | 操作步骤 | 预期结果 | seam 验证 |
|:-:|----------|----------|-----------|
| 5.8 | 在市场详情页触发 resolve（通过 dev 触发或等待到期） | ConsensusMeter 出现，显示 consensus 进度；Agent 投票出现 | 调用 `GET /api/markets/[slug]/resolve` → 响应含 votes[] + consensus{} |
| 5.9 | 检查 resolve API 返回的 votes | votes 含 agentId/outcome/confidence/evidence[] | seam: resolve API 从 spec 3 AI Oracle 获取数据 → ConsensusMeter 正确渲染 |

### Seam 5: Settle + Agent 页面

| # | 操作步骤 | 预期结果 | seam 验证 |
|:-:|----------|----------|-----------|
| 5.10 | 点击「Settle」 | 显示 txHash + "Settlement complete" 提示 | 调用 `POST /api/settle` → 调用 spec 4 合约 settle → 返回 txHash |
| 5.11 | 打开 `/agents` | 显示 6 个 Agent（全部 active） | 页面从 `GET /api/agents` 读取，而非静态数据 |
| 5.12 | 点击某个 Agent | 显示 Agent 详情，含 8004 ID 和链上链接 | 🆕 B.AI 8004 身份展示 seam |

---

## ✅ 加分项检查

| # | 操作步骤 | 预期结果 |
|:-:|----------|----------|
| 5.13 🆕 | 在 ConsensusMeter 区域查找 x402 交易哈希 | 显示交易哈希 + "View on Tronscan" 链上链接 |
| 5.14 🆕 | 点击 x402 链接 | 跳转至 Tronscan 对应交易页 |

---

## 📋 验收通过标准

| 类别 | 要求 | 必须通过 |
|:----|------|:--------:|
| ⭐ 核心 seam | 5.1–5.6 | ✅ 必须通过 |
| 🔄 resolve 流程 | 5.8–5.9 | ✅ 必须通过 |
| 📄 Agent 页面 | 5.11 | ✅ 必须通过 |
| ✅ 构建检查 | AI 自检 3 条 | ✅ 必须通过 |
| 🆕 B.AI + x402 | 5.12–5.14 | ⭕ 可选加分 |

**最终判定**: 5.1–5.6 + 5.8–5.9 + 5.11 + AI 自检全部通过 → **Spec 5 通过 ✓**
