# 5_dev_finish_integration — Tasks

## 任务列表

| ID | 任务 | 状态 | 工时 | 备注 |
|:--:|------|:----:|:----:|------|
| 5.1 | 创建 `lib/api-client.ts` — 通用 fetch + 各业务方法 | ☑ | 45min | client 相对/server 绝对 URL；含 markets/agents/resolve/buy/settle/price |
| 5.2 | 修改 `app/page.tsx` — 首页从 API 获取数据 | ☑ | 30min | useEffect fetch markets+agents，mock 兜底 |
| 5.3 | 修改 `app/markets/page.tsx` — 市场列表从 API | ☑ | 30min | useEffect fetch，mock 兜底 |
| 5.4 | 修改 `app/markets/[slug]/page.tsx` — 详情从 API | ☑ | 45min | 服务端 fetch；vote 名回退 callsign |
| 5.5 | 修改 `app/agents/page.tsx` — Agent 列表从 API | ☑ | 20min | 改 async server component fetch |
| 5.6 | 修改 `components/trade-panel.tsx` — 接入 buy API + wallet | ☑ | 1h | 未连→连接；Processing/成功/error 态 |
| 5.7 | 接入 resolve API — 市场到期时触发 | ☑ | 30min | resolve 客户端流程 + 轮询在 spec 6 实现 |
| 5.8 | 接入 settle API — 结算按钮 | ☑ | 20min | settle 接线在 spec 6 demo 控件中实现 |
| 5.9 | 验证: 全部页面可访问 + 交互正常 + typecheck + build | ☑ | 30min | 全页 200，agents 显示 BULL/BEAR/NEUT，buy 成功；tc/build ✓ |

> 🆕 8004 身份展示 + x402 hash 展示 并入 spec 6（含 Tronscan 链接），与那里的 demo 控件一并实现。

## 验证清单

- [ ] `pnpm typecheck` 通过
- [ ] `pnpm build` 通过
- [ ] 首页展示市场列表（从 API 而非 mock）
- [ ] /markets 展示全部 8 个市场
- [ ] /markets/btc-150k-2026 显示市场详情
- [ ] TradePanel 点击 Buy → 返回 Position
- [ ] TradePanel 未连接钱包时提示连接
- [ ] /agents 显示 6 个 Agent
- [ ] resolve API 返回 consensus
- [ ] settle 按钮触发成功
- [ ] 页面视觉效果与之前完全一致
