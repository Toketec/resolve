# 6_dev_finish_demo_ux — Tasks

## 任务列表

| ID | 任务 | 状态 | 工时 | 备注 |
|:--:|------|:----:|:----:|------|
| 6.1 | USDC → USDD 全项目搜索替换 | ☐ | 15min | grep + patch |
| 6.2 | 投票浮现动画 — ConsensusMeter 改为 staged 模式 | ☐ | 1.5h | 核心改动 |
| 6.3 | 隐藏"立即解析"触发器 — ?dev=1 + Force Resolve 按钮 | ☐ | 45min | url search param |
| 6.4 | loading/error 状态 — skeleton + retry + processing 状态 | ☐ | 1h | |
| 6.5 | resolving 轮询 — 每 3s 轮询 market API 直到 consensus | ☐ | 30min | |
| 6.6 | 验证: typecheck + build + 浏览器完整流程 | ☐ | 30min | |

## 验证清单

- [ ] `pnpm typecheck` 通过
- [ ] `pnpm build` 通过
- [ ] TradePanel 显示 USDD 而非 USDC
- [ ] 所有页面 USDC → USDD 替换完毕
- [ ] `?dev=1` 显示 Force Resolve 按钮
- [ ] 点击 Force Resolve → status 切换为 resolving
- [ ] Votes 一条接一条出现（间隔 ~1.5s）
- [ ] 每条 Vote 有进入动画
- [ ] ConsensusMeter 进度条逐渐增长
- [ ] 全部 3 条 vote 出现后 → consensus 达成
- [ ] API 失败时显示 "Retry" 按钮
- [ ] 买入时按钮显示 "Processing..." + 禁用
- [ ] 正常模式（无 ?dev=1）看不到 Force Resolve 按钮
