# 2_dev_finish_wallet — TronLink Wallet Connection & Testnet Setup

## 解决的问题

产品核心交互起点是用户通过 TronLink 钱包连接后，才能在预测市场下注。
当前前端有 "Connect Wallet" 按钮但没有任何实际连接逻辑。
此规格实现 TronLink 钱包的检测、连接、地址显示和测试网环境配置。

## 工作边界

- ✅ 检测浏览器是否安装了 TronLink 扩展
- ✅ 点击 Connect Wallet 按钮 → 弹出 TronLink 授权 → 连接成功
- ✅ 连接成功后显示连接的 TRON 地址
- ✅ 显示当前网络（Shasta 测试网 / 主网）
- ✅ 切换账户时自动重新连接
- ✅ 断开钱包功能
- ✅ Shasta 测试网环境已配置可用
- ❌ 不实现买入签名/交易（那是 spec 4）
- ❌ 不实现 TRC-20 转账（那是 spec 4）
- ❌ 不处理 mainnet 资产（只在测试网活动）

## 依赖项

- 前置: spec 1（API routes）— 需要 store 作为钱包状态容器
- 后置: spec 5（integration）需要钱包连接后 UI 交互
- 外部依赖: TronLink 浏览器扩展（用户需安装）

## 验收标准

1. 未安装 TronLink 时 → 显示 "Install TronLink" 提示 + 下载链接
2. 已安装 TronLink 但未连接 → 显示 "Connect Wallet" 按钮
3. 点击 Connect → TronLink 授权弹窗 → 授权后显示截断地址 `T...xxx`
4. 地址旁显示小绿点 + "Shasta Testnet" 标签
5. 切换 TronLink 账户 → 前端自动更新地址
6. 点击断开 → 回到未连接状态
7. Header/Nav 中的钱包状态随连接状态联动
8. `pnpm typecheck` + `pnpm build` 通过

## 边界与约束

- 只在浏览器环境中运行（TronLink 是浏览器扩展）
- 使用 window.tronLink / window.tron 对象检测
- 不引入多余第三方依赖——TronLink 已暴露 tronWeb 全局对象
- 仅在开发/测试环境下测试，不需要主网测试
