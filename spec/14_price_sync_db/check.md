# ✅ Spec 14 — 链上池状态同步到数据库 验收检查表

> **用途**: 验证 DB 同步管道是否通畅、前端是否彻底切换到 DB 数据源、旧轮询代码是否清理干净
> **执行人**: 开发完成后由 AI 自检 + 人工浏览器验证
> **核心原则**: 每个检查点强调新旧两条路径的切换状态——旧路径已死，新路径通畅

---

## 🔧 AI 自检（每次提交前运行）

```bash
# 10 秒类型检查
pnpm typecheck || exit 1

# 30 秒构建验证
pnpm build || exit 1

# 确认旧文件已删除
test ! -f apps/web/lib/hooks/useChainPrices.ts || { echo "FAIL: useChainPrices.ts still exists!"; exit 1; }
test ! -f apps/web/app/api/prices/route.ts || { echo "FAIL: prices route still exists!"; exit 1; }
test ! -f apps/web/app/api/pool-state/\[slug\]/route.ts || { echo "FAIL: pool-state route still exists!"; exit 1; }

# 确认新文件存在
test -f packages/db/migrations/00004_pool_state_sync.sql || { echo "FAIL: migration missing!"; exit 1; }
test -f apps/web/app/api/cron/refresh-pools/route.ts || { echo "FAIL: refresh-pools route missing!"; exit 1; }

# 确认无 useChainPrices 残留引用（不包含自身文件——已删除）
grep -r "useChainPrices\|applyChainPrices" apps/web/app/ apps/web/components/ apps/web/lib/ --include="*.ts" --include="*.tsx" 2>/dev/null \
  | grep -v "node_modules" \
  | grep -v "\.next" \
  && echo "WARNING: residual useChainPrices references found!" \
  || echo "✓ No residual references"

# 开发服务器可达性（如果已启动）
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/markets
echo ""
```

**失败则停止提交，先修复。**

---

## 🧪 数据库层检查

| # | 操作步骤 | 预期结果 |
|:-:|----------|----------|
| 14.DB.1 | 执行 Migration `00004_pool_state_sync.sql`（或通过 Supabase CLI / Dashboard 手动执行） | `market_pool_states` 表创建成功，含 `id, market_id, yes_price, no_price, yes_supply, no_supply, liquidity, fee_pool, source, updated_at` 列，`market_id` 有 UNIQUE 约束 |
| 14.DB.2 | 调用 `GET /api/cron/refresh-pools` | 返回 `{ refreshed: N }`，Supabase `market_pool_states` 表中出现活跃市场的行 |
| 14.DB.3 | 在 Supabase Dashboard 中查询 `SELECT * FROM market_pool_states` | 每个 active 市场一行，`yes_price` / `no_price` 为 0–1 之间的小数，`source = 'chain'` |

---

## 🧪 API 层检查（4 条核心 seam）

### Seam 1: 市场列表 API — DB JOIN 返回真实价格

| # | 操作步骤 | 预期结果 | seam 验证 |
|:-:|----------|----------|-----------|
| 14.API.1 | `curl http://localhost:3000/api/markets \| jq '.[0].yesPrice'` | 返回真实链上价格（如 `0.52`），非 mock 伪随机值 | `GET /api/markets` 内部走 `db.listMarkets() → db.listLatestPoolStates() → marketRowToMarket(row, poolState)` 路径，`yesPrice` 来自 `market_pool_states.yes_price` |
| 14.API.2 | `curl http://localhost:3000/api/markets \| jq '.[0].liquidityUSD'` | 返回真实流动性（从 `pool_state.liquidity` 转换），非 mock 伪随机 | `liquidityUSD = Number(poolState.liquidity) / 1e6` |
| 14.API.3 | 确认 API 响应中不再有 mock 派生的字段（Volume/Traders 等 mock 衍生字段可保留作为展示占位） | `yesPrice` 和 `liquidityUSD` 来自 DB pool_state；其他展示字段仍可用 mock 兜底 |

### Seam 2: 交易后即时刷新

| # | 操作步骤 | 预期结果 | seam 验证 |
|:-:|----------|----------|-----------|
| 14.API.4 | 在 TradePanel 买入 100 USDD YES → 确认 TronLink 签名 → 等待返回 | 交易成功返回 `status: "confirmed"` | buy API 返回正常 |
| 14.API.5 | 立即查询 Supabase `SELECT * FROM market_pool_states WHERE market_id = '<刚才的市场ID>'` | `updated_at` 是最近几秒，`yes_price` / `no_price` 已更新 | buy/sell API 在交易成功后异步刷新了池状态 |
| 14.API.6 | 再次调用 `curl http://localhost:3000/api/markets` | 刚才交易的市场 `yesPrice` 已反映最新价格 | DB ⇄ API 通道通畅 |

### Seam 3: 周期性兜底刷新

| # | 操作步骤 | 预期结果 | seam 验证 |
|:-:|----------|----------|-----------|
| 14.API.7 | `curl http://localhost:3000/api/cron/refresh-pools` | 返回 `{ refreshed: N }`（N ≥ 1） | 遍历所有 active 市场，逐个调 `getPoolState()` → `upsertPoolState()` |
| 14.API.8 | 检查 Supabase 中所有 market_pool_states 的 `updated_at` | 全部刷新为当前时间 | 兜底刷新覆盖所有 active 市场 |

### Seam 4: 详情页优先读 DB

| # | 操作步骤 | 预期结果 | seam 验证 |
|:-:|----------|----------|-----------|
| 14.API.9 | 调用详情 API（具体路由取决于实现：可能是 `GET /api/markets/[slug]` 或 SSR 中直接查 DB） | 返回的市场数据包含真实 `yesPrice`（来自 pool_states 表） | 详情页数据流：DB pool_states → API → 前端 |
| 14.API.10 | 删除某个市场在 pool_states 中的行，再次请求该市场详情 | 仍能正常返回，yesPrice 通过 fallback 实时查询链上并写入 DB | 冷启动兜底机制正常 |

---

## 🧪 前端层检查

### 列表页 — /markets

| # | 操作步骤 | 预期结果 | seam 验证 |
|:-:|----------|----------|-----------|
| 14.FE.1 | 打开 `localhost:3000/markets` | 展示 8 个市场卡片，价格与 `/api/markets` 返回一致 | 页面用 `fetchMarkets()` 获取数据，不再客户端轮询 |
| 14.FE.2 | 打开开发者工具 → Network | **看不到** 指向 `/api/prices` 或 `/api/pool-state/` 的周期性 XHR 请求 | 确认客户端轮询已移除 |
| 14.FE.3 | 页面加载后等待 30 秒 | Network 中没有新的 `/api/prices` 请求出现 | 确认没有残留轮询逻辑 |

### 首页 — /

| # | 操作步骤 | 预期结果 | seam 验证 |
|:-:|----------|----------|-----------|
| 14.FE.4 | 打开 `localhost:3000` | 首页正常渲染，市场数据来自 API | 检查是否仍引用了 `useChainPrices`，确认已移除 |

### 详情页 — /markets/[slug]

| # | 操作步骤 | 预期结果 | seam 验证 |
|:-:|----------|----------|-----------|
| 14.FE.5 | 打开 `localhost:3000/markets/btc-150k-2026` | 详情页正常加载，包含价格数据 | 价格来自 DB pool_states 而非实时 RPC 调用 |

---

## 🧹 清理检查

| # | 操作步骤 | 预期结果 |
|:-:|----------|----------|
| 14.CL.1 | 搜索 `apps/web/lib/hooks/` 目录 | `useChainPrices.ts` 文件不存在 |
| 14.CL.2 | 搜索 `apps/web/app/api/prices/` 目录 | `prices/route.ts` 文件不存在 |
| 14.CL.3 | 搜索 `apps/web/app/api/pool-state/` 目录 | `pool-state/[slug]/route.ts` 文件不存在 |
| 14.CL.4 | `grep -r "useChainPrices" apps/ --include="*.ts" --include="*.tsx" \| grep -v node_modules \| grep -v .next` | 无任何匹配结果 |
| 14.CL.5 | `grep -r "applyChainPrices" apps/ --include="*.ts" --include="*.tsx" \| grep -v node_modules \| grep -v .next` | 无任何匹配结果 |
| 14.CL.6 | `grep -r "fetchPoolPrices" apps/ --include="*.ts" --include="*.tsx" \| grep -v node_modules \| grep -v .next` | 无任何匹配结果（如果 `api-client.ts` 中的 `fetchPoolPrices` 也被移除） |

---

## ✅ 加分项检查

| # | 操作步骤 | 预期结果 |
|:-:|----------|----------|
| 14.B.1 | 在 Vercel Dashboard 配置 Cron Job 指向 `/api/cron/refresh-pools`，频率 60s | 自动周期性刷新，无需手动触发 |
| 14.B.2 | 在 Supabase Dashboard 监控 `market_pool_states` 表的行数变化 | 与 active 市场数一致，无孤儿行 |
| 14.B.3 | 用 Lighthouse 测试 `/markets` 页面性能 | LCP < 2s（改造前约 3-5s） |

---

## 📋 验收通过标准

| 类别 | 要求 | 必须通过 |
|:----|------|:--------:|
| 🗄️ DB 层 | 14.DB.1–14.DB.3 | ✅ 必须通过 |
| 🔌 API seam 1（列表 JOIN） | 14.API.1–14.API.3 | ✅ 必须通过 |
| 🔄 API seam 2（交易刷新） | 14.API.4–14.API.6 | ✅ 必须通过 |
| ⏱️ API seam 3（兜底刷新） | 14.API.7–14.API.8 | ✅ 必须通过 |
| 📄 API seam 4（详情优先DB） | 14.API.9–14.API.10 | ✅ 必须通过 |
| 🖥️ 前端页面 | 14.FE.1–14.FE.5 | ✅ 必须通过 |
| 🧹 清理检查 | 14.CL.1–14.CL.6 | ✅ 必须通过（零残留） |
| 🔧 构建检查 | AI 自检全部通过 | ✅ 必须通过 |
| ⭐ 加分项 | 14.B.1–14.B.3 | ⭕ 可选加分 |

**最终判定**: 数据库 + API + 前端 + 清理 + 构建 全部通过 → **Spec 14 通过 ✓**
