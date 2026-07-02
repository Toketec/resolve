---
num: 7
phase: dev_finish_portfolio_api
status: pending
---

# ✅ Spec 7 — Portfolio API Integration · 测试验收文件

> **版本**: 1.0 · **用途**: AI 自检 + 人工 curl 验证，确保持仓/交易 API 可用，页面数据从 mock 切换到 API
> **AI 自检原则**: 只跑 `pnpm typecheck` + `pnpm build` + curl 验证

---

## 前提条件

| # | 条件 | 检查方法 |
|:-:|------|----------|
| P1 | `pnpm install` 已执行 | `ls node_modules/.pnpm/lock.yaml` |
| P2 | 开发服务器已启动 | `curl -s -o /dev/null http://localhost:3000/api/markets` 返回 200 |
| P3 | `lib/mock/positions.ts` 存在（作为兜底） | `ls apps/web/lib/mock/positions.ts` |

---

## 🔧 AI 自检步骤

```bash
# Step 1: 类型检查
pnpm typecheck

# Step 2: 构建验证
pnpm build
```

---

## 🧪 人工检查步骤

**前提**: `pnpm dev` 运行中。

### 一、API 路由

| # | 操作步骤 | 预期结果 |
|:-:|----------|----------|
| **7.1** | `curl "http://localhost:3000/api/positions?wallet=TTest123" \| python3 -m json.tool` | 返回 Position 数组，每条含 id/marketId/marketTitle/side/shares/avgPrice/currentPrice/status |
| **7.2** | `curl "http://localhost:3000/api/trades?wallet=TTest123" \| python3 -m json.tool` | 返回 Trade 数组，每条含 id/marketId/marketTitle/side/price/shares/at/user |
| **7.3** | `curl "http://localhost:3000/api/positions" \| python3 -m json.tool` | 返回空数组 `[]`（无 wallet 参数） |
| **7.4** | `curl "http://localhost:3000/api/positions?wallet=NONEXISTENT" \| python3 -m json.tool` | 返回 mock 兜底数据（不返回 500） |

### 二、页面

| # | 操作步骤 | 预期结果 |
|:-:|----------|----------|
| **7.5** | 浏览器打开 `/portfolio` | 页面正常渲染：顶部统计面板 + open positions 表格 + activity 表格 |
| **7.6** | 检查统计面板 | Total value、P&L、open 计数显示合理数值 |
| **7.7** | 检查右侧 Wallet 卡片 | 显示了真实钱包状态 `T...xxx` 或"未连接"提示（不再显示 "Mock wallet"） |

---

## 📋 JSON 结构完整性检查

- [ ] positions 数组每个元素 8 个字段齐全（id/marketId/marketTitle/marketCategory/side/shares/avgPrice/currentPrice/status）
- [ ] trades 数组每个元素 7 个字段齐全（id/marketId/marketTitle/side/price/shares/at/user）
- [ ] 所有字段均为合理类型（数字不为 NaN，字符串不为 null）
- [ ] 时间字段为 ISO 8601 字符串

---

## ✅ 验收通过条件

| 等级 | 条件 |
|:----:|------|
| **必需** | 7.1–7.5 测试全部通过 |
| **推荐** | 7.6–7.7 通过 |

---

## ⚡ 错误恢复

| # | 测试场景 | 预期结果 |
|:-:|----------|----------|
| E1 | 无 wallet 参数 | 返回空数组 `[]` |
| E2 | Supabase 不可达 | 返回 mock 数据 + HTTP 200（不崩溃） |
| E3 | wallet 地址无持仓 | 返回 mock 兜底（或空数组——由实现决定） |
