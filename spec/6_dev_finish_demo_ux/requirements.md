# 6_dev_finish_demo_ux — Demo Controls, Animations & Polish

## 解决的问题

英雄镜头的 DEMO 体验决定了评分维度中的"展示表达能力"（10 分）和"产品完成度"（25 分）。
当前缺少三个关键 demo 特性:
1. **G4**: AI 投票不会一条接一条浮现——现在是一起出现
2. **G5**: 没有"立即解析"隐藏触发——Demo 操作者不能站在台上等时钟到点
3. **G3**: UI 写的是 USDC 但实际要用 USDD
此外还需要一些视觉打磨来提升 demo 质感。

## 工作边界

- ✅ G4: 投票浮现动画——共识 votes 一条一条按序显示（每~1.5 秒一条）
- ✅ G5: 隐藏"立即解析"按钮——仅 demo 操作者可见（Secret tap / 特定 URL 参数 / admin 区域）
- ✅ G3: USDC → USDD（全局替换）
- ✅ Loading 状态: API 调用期间显示骨架屏/加载动画
- ✅ Error 处理: API 失败时不崩溃，显示友好的 retry 提示
- ✅ 市场详情页: resolving 状态的实时反馈（轮询 resolve API）
- ✅ 🆕 **B.AI 8004展示**: Agent详情/Tooltip中显示8004 ID + Tronscan链接按钮
- ✅ 🆕 **x402展示**: ConsensusReached后显示x402交易哈希 + 链上链接
- ❌ 不做完整 45 秒 demo 排练脚本（那是 Dev B 路演准备的事）
- ❌ 不做 pitch deck（那是 Dev B 的范围）

## 依赖项

- 前置: spec 5（walking skeleton）——UI 已连接 API
- 前置: spec 3（AI oracle）——resolve 返回真实数据
- 外部: 动画用 CSS transition / Framer Motion（已安装）

## 验收标准

1. 市场从 `live` → `resolving` → 触发 resolve API → votes 一条接一条出现（间隔 1-2s）
2. 每条 vote 出现时有进入动画（淡入 + 上移）
3. ConsensusMeter 进度条随投票逐步更新
4. "立即解析"隐藏触发器正常工作（地址栏加 `?dev=1` 或 secret click）
5. UI 中所有 USDC 被替换为 USDD（TradePanel、KPI、描述文字）
6. API loading 状态有骨架屏或 spin indicator
7. API error 状态显示重试按钮 + 不崩溃
8. 🆕 Agent 8004 身份卡片可见，点击可跳转 Tronscan
9. 🆕 x402 交易哈希在 ConsensusMeter 下方可见，点击可跳转
10. `pnpm typecheck` + `pnpm build` 通过
