# 2_dev_finish_wallet — Tasks

## 任务列表

| ID | 任务 | 状态 | 工时 | 备注 |
|:--:|------|:----:|:----:|------|
| 2.1 | 创建 `lib/hooks/useTronWallet.ts` — 封装 TronLink 检测/连接/事件监听 | ☐ | 2h | 核心 hook |
| 2.2 | 创建 `components/wallet-provider.tsx` — Context Provider | ☐ | 30min | 暴露 useWallet() |
| 2.3 | 创建 `components/wallet-button.tsx` — 三态 UI 组件 | ☐ | 1h | 未安装/未连接/已连接 |
| 2.4 | 修改 `components/site-nav.tsx` — 替换 wallet 占位 | ☐ | 30min | |
| 2.5 | 修改 `app/layout.tsx` — 加 WalletProvider | ☐ | 5min | |
| 2.6 | 验证: typecheck + build + 浏览器手动测试 | ☐ | 30min | 需要 Chrome + TronLink |

## 验证清单

- [ ] `pnpm typecheck` 通过
- [ ] `pnpm build` 通过
- [ ] 未安装 TronLink → 显示 "Install TronLink →"（带下载链接）
- [ ] 安装 TronLink 后 → 显示 "Connect Wallet" 按钮
- [ ] 点击连接 → TronLink 授权弹窗
- [ ] 授权后 → 显示地址 (T...xx) + Shasta 标签
- [ ] 切换 TronLink 账户 → 地址自动更新
- [ ] 断开钱包 → 回到未连接状态
- [ ] 网络切换(Shasta ↔ Mainnet) → 标签更新
