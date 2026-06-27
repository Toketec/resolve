# 2_dev_finish_wallet — Implementation Plan

## 前置说明

TronLink 作为浏览器扩展注入 `window.tronLink` 和 `window.tron`（tronWeb 实例）。
连接流程: 检测 tronLink → request accounts → 获取地址 → 获取网络。

### Step 1: 创建钱包管理 Hook

**文件**: `apps/web/lib/hooks/useTronWallet.ts`

```
功能:
- 检测 tronLink 是否安装
- requestAccounts() → 获取授权+地址
- 监听 accountChanged / networkChanged 事件
- disconnect() — 清除本地状态
- 返回: { connected, address, network, balance, connecting, error, connect, disconnect }
```

类型定义使用 `@resolve/shared` 中的 `WalletState`。

### Step 2: 创建钱包状态上下文

**文件**: `apps/web/components/wallet-provider.tsx`

React Context Provider:
- 包装整个 app（在 layout.tsx 中添加）
- 通过 useTronWallet hook 管理状态
- 暴露 `useWallet()` hook 供全应用消费

### Step 3: 创建钱包连接 UI

**文件**: `apps/web/components/wallet-button.tsx`

根据状态渲染不同 UI:
- 未安装: "Install TronLink →" 按钮（跳转到 Chrome 商店）
- 已安装未连接: "Connect Wallet" 按钮
- 已连接: 地址展示 `T...xxxx` + 网络标签 + 下拉菜单（断开、复制地址）

### Step 4: 集成到 Header（site-nav）

**文件**: `apps/web/components/site-nav.tsx`（修改）

- 替换现有的 "Connect Wallet" 占位按钮
- 引用 `<WalletButton />`
- 连接成功后 Header 右上角显示钱包状态

### Step 5: 更新类型定义

- 确认 `WalletState` 类型在 `packages/shared` 中已存在且兼容
- 如果 TronLink 返回的网络值需要映射，在 hook 中处理

### Step 6: 验证

```bash
pnpm typecheck
pnpm build
# 浏览器手动测试:
# 1. Chrome 打开 localhost:3000
# 2. 未安装 TronLink → 显示安装提示
# 3. 安装 TronLink → 显示 Connect Wallet
# 4. 连接 → 显示地址
# 5. 切换账户 → 自动更新
```

## 注意事项

- `window.tronLink` 检测用 `typeof window !== 'undefined' && window.tronLink`
- TronLink v3+ 使用 `window.tronLink.request({ method: 'tron_requestAccounts' })`
- 网络检测: `window.tronLink.tronWeb.fullNode.host` 判断
- Shasta 测试网 fullNode: `https://api.shasta.trongrid.io`
- 不要存任何私钥/助记词——TronLink 自己管理
- accountChanged 事件: `window.tronLink.on('accountsChanged', handler)`

## 关键文件

| 文件 | 操作 |
|------|------|
| `apps/web/lib/hooks/useTronWallet.ts` | [新建] 钱包连接 hook |
| `apps/web/components/wallet-provider.tsx` | [新建] React Context provider |
| `apps/web/components/wallet-button.tsx` | [新建] 钱包按钮 UI 组件 |
| `apps/web/components/site-nav.tsx` | [修改] 集成钱包按钮 |
| `apps/web/app/layout.tsx` | [修改] 添加 WalletProvider |
