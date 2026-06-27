# 6_dev_finish_demo_ux — Implementation Plan

## Step 1: USDC → USDD 全局替换

搜索整个 `apps/web/` 目录找到所有 USDC 引用:

```bash
grep -rn "USDC" apps/web/app/ apps/web/components/ apps/web/lib/
```

替换内容:
- `components/trade-panel.tsx:59` — "USDC" → "USDD"
- 其他页面/组件中的 USDC 引用

## Step 2: 投票浮现动画

### 方法: 脚本化逐步揭示

**文件**: `apps/web/components/consensus-meter.tsx`

- 当前 consensus 是一次性传入所有 votes
- 修改为: 当 status = "deliberating" 时，votes 数组按时间戳排序
- 使用 setTimeout 或 Framer Motion `AnimatePresence` 逐条显示
- 间隔 1500ms/条，模拟 AI 逐个推理

**文件**: `apps/web/app/markets/[slug]/page.tsx`

- resolve API 返回后，将 votes 数据存入 client state
- 传递给 ConsensusMeter 时带上 staged 模式参数
- 每条 vote 出现时:
  - ConsensusMeter 进度条跳到对应 confidence
  - VoteCard 从下方淡入（opacity 0 → 1, translateY 10px → 0）

## Step 3: 隐藏"立即解析"触发器

**方案**: 地址栏 URL search param `?dev=1` 或点击市场标题 5 次

**文件**: `apps/web/app/markets/[slug]/page.tsx`

```typescript
const searchParams = useSearchParams()
const isDev = searchParams.get('dev') === '1'

// 如果 isDev，在页面 secret 位置渲染一个按钮
{isDev && (
  <button onClick={handleForceResolve}>
    ⚡ Force Resolve (dev only)
  </button>
)}
```

点击 Force Resolve:
1. `PATCH /api/markets/[slug]` → 将 status 改为 `resolving`
2. 触发 resolve API 调用
3. 开始投票浮现动画序列

## Step 4: Loading + Error 状态

**文件**: `apps/web/app/markets/[slug]/page.tsx` / `apps/web/components/trade-panel.tsx`

- TradePanel 买入时: 按钮显示 "Processing..." + 禁用
- resolve 调用时: 骨架屏替代 ConsensusMeter（灰色脉动块）
- 失败时: "Failed to resolve — Retry" 按钮
- 结算时: "Settling..." → txHash 确认信息

## Step 5: 轮询 resolve

市场处在 "resolving" 状态时:
- 每 3 秒轮询 `GET /api/markets/[slug]`
- 当 consensus.status 变为 "consensus" 时停止轮询
- UI 自动切换到 settled 视图

## Step 6: 验证

```
pnpm typecheck
pnpm build
# 浏览器:
# 1. 打开 /markets/btc-150k-2026?dev=1
# 2. 点击 Force Resolve
# 3. 观察投票一条条浮现
# 4. 验证 USDD 显示代替 USDC
# 5. 网络断开测试 error 处理
```

## 注意事项

- 动画不要太花哨——demo 需要的是"清晰"而非"华丽"
- Force Resolve 按钮在非 dev 模式完全隐藏，不影响正常用户体验
- 投票浮现的时间控制要考虑 demo 解说节奏: 3 个 Agent × 1.5s = 4.5s — 正好
- USDD 替换后 TradePanel 的 "0.10% fee" 文字也要检查是否匹配

## 关键文件

| 文件 | 操作 |
|------|------|
| `apps/web/components/consensus-meter.tsx` | [修改] 投票浮现动画 |
| `apps/web/components/trade-panel.tsx` | [修改] USDD + loading/error |
| `apps/web/app/markets/[slug]/page.tsx` | [修改] + 隐藏触发器 + 轮询 + USDD |
| `apps/web/components/price-chart.tsx` | [修改] USDD if needed |
| `apps/web/app/markets/page.tsx` | [修改] USDD |
