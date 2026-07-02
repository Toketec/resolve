---
num: 1
phase: dev_finish_core_api
status: pending
---

# ✅ Spec 1 — Core API Routes & Data Layer · 测试验收文件

> **版本**: 1.0 · **用途**: AI 自检 + 人工 curl 验证，确保所有 API Route 可用且返回正确数据结构
> **AI 自检原则**: 只跑 `pnpm typecheck` + `pnpm build` + curl 验证 — 不超过 60 秒
> **人工检查原则**: 步骤清晰、言简意赅、照着做就能验证
> **加分项 (C-21)**: HTX 订单簿深度 + K 线数据

---

## 前提条件 (Prerequisites)

| # | 条件 | 检查方法 |
|:-:|------|----------|
| P1 | `pnpm install` 已执行，node_modules 完整 | `ls node_modules/.pnpm/lock.yaml` |
| P2 | `.env.local` 已配置 `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`（或 `SUPABASE_ANON_KEY`） | `grep SUPABASE .env.local` |
| P3 | Supabase 迁移 `00001_initial_schema.sql` 已执行 | Dashboard SQL Editor 确认 `markets` 表存在 |
| P4 | Supabase 迁移 `00002_add_agents.sql` 已执行 | Dashboard SQL Editor 确认 `agents` 表存在且有 6 条种子数据 |
| P5 | 开发服务器已启动，终端无报错 | `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/markets` 返回 `200` |
| P6 | HTX 公开 API 可达（无需注册/API Key） | `curl -s https://api.htx.com/market/detail/merged?symbol=btcusdd | head -c 100` 返回 JSON |

---

## 🔧 AI 自检步骤

```bash
# === Step 1: 类型检查（~15秒）===
# 在项目根目录执行
pnpm typecheck

# === Step 2: 构建验证（~30秒）===
pnpm build
```

**AI 自检通过条件**: 以上两条命令均以 exit code 0 退出，无 TypeScript 错误、无构建报错。

---

## 🧪 人工检查步骤

**前提**: `pnpm dev` 在本地运行，终端无报错。打开新终端窗口执行以下 curl 命令。

### 一、必需路由 (Core API)

| # | 操作步骤 | 预期结果 |
|:-:|----------|----------|
| **1.1** | `curl http://localhost:3000/api/markets \| python3 -m json.tool` | 返回 JSON **数组**，每条记录包含 `id`/`slug`/`title`/`question`/`status`/`expires_at`/`volume`/`yes_price`/`no_price` 等字段。数组中应包含英雄市场 `btc-150k-eoy` |
| **1.2** | `curl http://localhost:3000/api/markets/btc-150k-eoy \| python3 -m json.tool` | 返回单个 JSON **对象**，`slug="btc-150k-eoy"`，`status` 为 `live` 或 `pending`，含 `expires_at` 日期 |
| **1.3** | `curl http://localhost:3000/api/markets/btc-150k-eoy/resolve \| python3 -m json.tool` | 返回 mock AIConsensus JSON，含 `status`/`votes`/`consensus` 字段。`votes` 是数组（目前 mock，等 spec 3 替换） |
| **1.4** | `curl http://localhost:3000/api/agents \| python3 -m json.tool` | 返回 JSON **数组**，长度为 **6**（全部 active）。每条含 `id`/`name`/`role`/`tier`/`powered_by`/`description` 字段。**不再有 `"tier": "standby"` 的 Agent** |
| **1.5** | `curl -X POST http://localhost:3000/api/buy -H 'Content-Type: application/json' -d '{"marketId":"mk_btc_150k","side":"YES","amount":100,"walletAddress":"TTest123"}' \| python3 -m json.tool` | 返回 Position JSON，含 `id`/`marketId`/`side`/`shares`/`txHash`/`status` 字段。`txHash` 以 `mock_tx_` 开头 |
| **1.6** | `curl http://localhost:3000/api/price/BTC \| python3 -m json.tool` | 返回 JSON，含 `symbol` (="BTC")/`price`(数字)/`change24h`/`high24h`/`low24h`/`vol24h`/`source`(="htx")/`at`(ISO时间) |
| **1.7** | 等 5 秒后再次执行 `curl http://localhost:3000/api/price/BTC \| python3 -m json.tool` | `price` 字段值与前一次略有波动（证明是实时数据，非固定 mock 值）。两次 `at` 时间戳不同 |

### 二、可选路由 — 单个 Agent

| # | 操作步骤 | 预期结果 |
|:-:|----------|----------|
| **1.8** | `curl http://localhost:3000/api/agents/bull-1 \| python3 -m json.tool` | 返回单个 Agent JSON，`id="bull-1"`，`tier="active"`，含 `role`/`description` |
| **1.9** | `curl http://localhost:3000/api/agents/neut-2 \| python3 -m json.tool` | 返回单个 Agent JSON，`id="neut-2"`，`tier="active"` |
| **1.10** | `curl http://localhost:3000/api/agents/nonexistent \| python3 -m json.tool` | 返回 `404` 或 `{ error: "Agent not found" }`，系统不崩溃 |

### 三、加分项 🆕 C-21 — HTX 订单簿深度 + K 线数据

| # | 操作步骤 | 预期结果 | 加分项 |
|:-:|----------|----------|:------:|
| **1.11** | `curl http://localhost:3000/api/price/BTC/depth \| python3 -m json.tool` | 返回 JSON，含 `symbol`(="BTC")/`bids`(非空二维数组)/`asks`(非空二维数组)/`source`(="htx")。bids[0] 格式为 `[价格, 数量]` | ✅ C-21 |
| **1.12** | `curl http://localhost:3000/api/price/BTC/kline \| python3 -m json.tool` | 返回 JSON，含 `symbol`(="BTC")/`period`(="1day")/`klines`(数组，长度约30)/`source`(="htx")。每条 kline 含 `timestamp`/`open`/`close`/`high`/`low`/`volume` | ✅ C-21 |

### 四、可选路由 — Settle (mock)

| # | 操作步骤 | 预期结果 |
|:-:|----------|----------|
| **1.13** | `curl -X POST http://localhost:3000/api/settle -H 'Content-Type: application/json' -d '{"marketId":"mk_btc_150k","outcome":"YES","winnerWallet":"TTest123"}' \| python3 -m json.tool` | 返回 JSON，含 `txHash`(字符串) 和 `marketId`/`outcome`/`winnerWallet` 回显字段 |

---

## 📋 JSON 结构完整性检查

对 **1.1~1.7** 的每个返回值，确认：

- [ ] 是合法 JSON（`python3 -m json.tool` 不报错）
- [ ] 核心字段不为 `null`/`undefined`
- [ ] 数组字段不为空（如 `votes` 至少空数组 `[]`，不缺失）
- [ ] 数字字段为合理的数值类型（非字符串 "NaN"）
- [ ] 时间字段为 ISO 8601 字符串格式

---

## ✅ 验收通过条件

| 等级 | 条件 |
|:----:|------|
| **必需** | 1.1–1.7 共 **7 条** curl 测试全部通过，返回合法 JSON，字段完整 |
| **推荐** | 1.8–1.10（Agent 详情 + 容错）通过 |
| **加分项** | 1.11–1.12（HTX 订单簿深度 + K 线，C-21）通过 |
| **可选** | 1.13（Settle mock，等 spec 4 替换）通过 |

---

## ⚡ 错误恢复检查

| # | 测试场景 | 操作步骤 | 预期结果 |
|:-:|----------|----------|----------|
| E1 | 网络断开（HTX 不可达） | 断开网络 → `curl http://localhost:3000/api/price/BTC` | API 不崩溃，返回 `{ error, fallback: true }` 或 HTTP 502 代理错误。服务器不宕机 |
| E2 | 无效 market slug | `curl http://localhost:3000/api/markets/nonexistent-slug` | 返回 `404` JSON 格式错误，不返回 HTML 或崩溃 |
| E3 | POST /api/buy 缺少必填字段 | `curl -X POST http://localhost:3000/api/buy -H 'Content-Type: application/json' -d '{}'` | 返回 `400` + `{ error: "..." }`，明确提示缺少的字段 |
| E4 | HTX symbol 不存在 | `curl http://localhost:3000/api/price/INVALID999` | API 不崩溃，返回 HTX 原始错误或 `{ price: 0, error: "symbol not found" }` |

---

## 🔄 后置依赖

| 后续 Spec | 依赖说明 |
|:---------:|----------|
| **Spec 3** (AI Oracle) | 替换 `/api/markets/[slug]/resolve` 的 mock → 真实 Claude 推理 |
| **Spec 4** (Contract) | 替换 `/api/buy` 的 mock txHash → 真实链上签名；替换 `/api/settle` 的 mock → 真实合约调用 |
| **Spec 5** (Integration) | 前端停止从 `lib/mock/` import，改为调用这些 API Routes |

---

## 📝 备注

- HTX API 使用 `btcusdd` 格式（小写无分隔符）。API Route 中需要将前端传入的 `BTC` 转换为 `btcusdd` 再请求 HTX
- Next.js 16 App Router 中 `params` 为 `Promise` 类型：`{ params }: { params: Promise<{ slug: string }> }`
- 所有日期保持 ISO 字符串格式
- `POST /api/buy` 的数据已真实写入 Supabase `positions` 表！可在 Supabase Dashboard 中检查该表是否有新记录
