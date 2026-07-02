# 7_dev_finish_portfolio_api — Tasks

## 任务列表

| ID | 任务 | 状态 | 工时 | 备注 |
|:--:|------|:----:|:----:|------|
| 7.1 | 创建 `app/api/positions/route.ts` — Supabase 查+兜底 | ☐ | 30min | wallet 参数过滤 |
| 7.2 | 创建 `app/api/trades/route.ts` — Supabase 查+兜底 | ☐ | 20min | 与 positions 类似 |
| 7.3 | 修改 `lib/api-client.ts` — 添加 fetchPositions/fetchTrades | ☐ | 10min | |
| 7.4 | 修改 `app/portfolio/page.tsx` — 客户端化+API数据+钱包联动 | ☐ | 1h | 最复杂改动 |
| 7.5 | 验证: typecheck + build + curl + 浏览器 | ☐ | 20min | |

## 验证清单

### AI 自检
- [ ] `pnpm typecheck` 通过
- [ ] `pnpm build` 通过

### 人工检查
- [ ] `curl http://localhost:3000/api/positions` → 返回 `[]`（无 wallet 参数）
- [ ] `curl http://localhost:3000/api/positions?wallet=TTest123` → 返回 Position 数组（mock 兜底数据）
- [ ] `curl http://localhost:3000/api/trades?wallet=TTest123` → 返回 Trade 数组
- [ ] 浏览器打开 `/portfolio` → 显示持仓/统计/交易三个区块，布局不变
- [ ] 统计数据（value/cost/pnl）由实时 data 计算，与 mock 数据一致
- [ ] Wallet 卡片不再显示 "Mock wallet" 占位
