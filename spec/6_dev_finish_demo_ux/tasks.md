# 6_dev_finish_demo_ux — Tasks

## 任务列表

| ID | 任务 | 状态 | 工时 | 备注 |
|:--:|------|:----:|:----:|------|
| 6.1 | USDC → USDD 全项目搜索替换 | ☑ | 15min | 7 处全替换（trade-panel/portfolio/create/home ticker） |
| 6.2 | 投票浮现动画 — staged 模式 | ☑ | 1.5h | `oracle-deliberation.tsx` 逐条浮现(1.2s/条)+`vote-enter` 动画；进度条随票增长 |
| 6.3 | 隐藏"立即解析"触发器 — ?dev=1 + Force Resolve | ☑ | 45min | window.location 检测；headless 验证 dev 显示/非 dev 隐藏 |
| 6.4 | loading/error 状态 — skeleton + retry + processing | ☑ | 1h | deliberating 思考态 + retry + buy Processing |
| 6.5 | resolving 轮询 — 每 3s 轮询直到 consensus | ☑ | 30min | + 自动触发 resolve；轮询作兜底 |
| 6.6 | 验证: typecheck + build + 浏览器完整流程 | ☑ | 30min | CDP 驱动真实流程：Force Resolve→6 票浮现→共识 68%→x402→settle，0 报错 |

> 🆕 8004 身份卡片（每票，链 Tronscan）+ 🆕 x402 微支付收据（共识后，链 Tronscan）均已实现。
> 注：真实 gpt-5.5 推理约 57s（deliberating 思考态覆盖等待）；可通过 `OPENAI_MODEL` 换更快模型。

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
