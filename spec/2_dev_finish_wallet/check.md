---
num: 2
phase: dev_finish_wallet
status: pending
---

# ✅ Spec 2 — TronLink Wallet Connection · 测试验收文件

> **版本**: 1.0 · **用途**: AI 自检 + 人工浏览器手动测试，确保 TronLink 钱包检测、连接、显示、切换、断开、持久化全部正常
> **AI 自检原则**: 只跑 `pnpm typecheck` + `pnpm build` — 不超过 60 秒
> **人工检查原则**: 步骤清晰、言简意赅、照着做就能验证。需要 Chrome 浏览器 + TronLink 扩展

---

## 前提条件 (Prerequisites)

| # | 条件 | 检查方法 |
|:-:|------|----------|
| P1 | `pnpm install` 已执行，node_modules 完整 | `ls node_modules/.pnpm/lock.yaml` |
| P2 | 开发服务器已启动（`pnpm dev`），终端无报错 | 浏览器访问 `http://localhost:3000` 页面正常加载 |
| P3 | Chrome 浏览器已安装 **TronLink 扩展**（v3+） | Chrome 地址栏右侧可见 TronLink 图标（🦊 风格） |
| P4 | TronLink 已切换到 **Shasta 测试网** | 点击 TronLink 图标 → 顶部网络选择器显示 "Shasta Testnet" |
| P5 | TronLink 中至少有一个测试网账户 | 点击 TronLink 图标 → 可见账户地址（以 `T` 开头） |
| P6 | Shasta 测试网有 USDD 或 TRX 测试币（可选，用于后续买入测试） | 可通过 [Shasta Faucet](https://shasta.trongrid.io/faucet) 获取 |

---

## 🔧 AI 自检步骤

```bash
# === Step 1: 类型检查（~15秒）===
cd /home/wst1/王圣滔/C主要项目/resolve
pnpm typecheck

# === Step 2: 构建验证（~30秒）===
pnpm build
```

**AI 自检通过条件**: 以上两条命令均以 exit code 0 退出，无 TypeScript 错误、无构建报错。

---

## 🧪 人工检查步骤

**前提**: Chrome 已安装 TronLink 扩展，已切换到 Shasta 测试网。打开 `http://localhost:3000`。

### 一、必需检查 — 7 步人机操作流程

| # | 操作步骤 | 预期结果 |
|:-:|----------|----------|
| **2.1** | **检测未安装状态**：在 Chrome 中禁用/卸载 TronLink 扩展后，刷新 `localhost:3000` | 页面右上角（Header/Nav 区域）显示 **"Install TronLink →"** 按钮或提示。点击后应跳转至 Chrome 网上应用店 TronLink 安装页面（或显示下载链接）。**不显示** "Connect Wallet" |
| **2.2** | **检测已安装未连接状态**：重新启用 TronLink 扩展，确保 TronLink 中未授权当前站点。刷新页面 | 右上角按钮变为 **"Connect Wallet"**（或类似文案）。不再显示安装提示 |
| **2.3** | **触发连接**：点击 **"Connect Wallet"** 按钮 | TronLink 扩展自动弹出授权弹窗，请求连接当前站点的权限。弹窗内容包含待连接的账户地址 |
| **2.4** | **确认授权**：在 TronLink 弹窗中点击 **确认/Connect** | ① 页面右上角按钮变为 **地址缩写** `T...xxx`（取地址前 1 位 + 后 3 位，如 `T...123`）<br>② 地址旁显示 **绿色圆点**（表示已连接）<br>③ 地址旁显示网络标签 **"Shasta"**（或 "Shasta Testnet"） |
| **2.5** | **切换账户**：点击 TronLink 扩展图标 → 切换至另一个 TRON 账户（如账户 2） | ① 前端的地址显示**自动更新**为新账户的地址<br>② 无需再次点击 "Connect Wallet"<br>③ 绿色圆点保持亮起，不断开 |
| **2.6** | **断开连接**：点击已连接的地址按钮 → 在弹出的下拉菜单或选项中点击 **"Disconnect"**（或断开/退出） | ① 页面回到 **"Connect Wallet"** 状态<br>② 地址消失，绿色圆点消失<br>③ TronLink 扩展中该站点权限被清除（可选检查） |
| **2.7** | **会话持久化**：在 2.4 已连接状态下，**刷新页面**（F5 / Cmd+R） | ① 页面加载后**仍为已连接状态**，地址 `T...xxx` 保持显示<br>② 无需再次点击 Connect Wallet<br>③ 绿色圆点 + "Shasta" 标签依然显示 |

### 二、延伸检查（推荐）

| # | 操作步骤 | 预期结果 |
|:-:|----------|----------|
| **2.8** | **复制地址功能**：点击已连接的地址按钮 → 选择 "Copy Address" | 地址已复制到剪贴板。粘贴到文本编辑器后为完整 TRON 地址（以 `T` 开头，34 位） |
| **2.9** | **网络切换**：在 TronLink 扩展中将网络从 Shasta 切换至 Mainnet | 前端网络标签从 "Shasta" 更新为 "Mainnet"（或 "主网"）。连接状态保持 |
| **2.10** | **多次连接/断开**：连接 → 断开 → 连接 → 断开，重复 3 次 | 每次均正常切换，无卡顿、无报错、无残留状态 |
| **2.11** | **多页面保持**：连接后 → 浏览到其他页面（如 `/markets`）→ 返回首页 | 钱包连接状态在所有页面间保持一致 |

---

## ✅ 验收通过条件

| 等级 | 条件 |
|:----:|------|
| **必需** | **2.1–2.6** 共 **6 步**全部通过（扩展检测 → 连接 → 显示 → 切换 → 断开） |
| **推荐** | **2.7**（会话持久化 — 刷新后保持连接）通过 |
| **可选** | 2.8–2.11（复制地址、网络切换、多次操作、多页保持）按功能实现情况检查 |

---

## ⚡ 错误恢复检查

| # | 测试场景 | 操作步骤 | 预期结果 |
|:-:|----------|----------|----------|
| E1 | 连接过程中用户拒绝授权 | 点击 "Connect Wallet" → 在 TronLink 弹窗中点击 **取消/拒绝** | 前端停留在未连接状态，显示 "Connect Wallet"，无错误崩溃。可再次点击重新发起连接 |
| E2 | 连接后 TronLink 扩展被禁用 | 连接成功后 → 在 Chrome 扩展管理页禁用 TronLink → 刷新页面 | 前端检测到 TronLink 不存在，显示 "Install TronLink →" 或友好提示。不崩溃 |
| E3 | 连接后切换到一个空账户（无余额） | 连接后 → 切换到一个从未使用过的 Shasta 账户 | 前端仍显示地址（连接正常），余额显示为 0 或 "--"。不报错 |
| E4 | 页面在未安装 TronLink 时整体行为 | 未安装 TronLink → 浏览所有页面（首页、市场、Agent） | 所有页面正常加载，仅钱包区域显示安装提示。不阻塞其他功能 |
| E5 | localStorage 被清除 | 连接后 → 在 DevTools Application → Storage → Clear site data → 刷新 | 连接状态丢失，回到 "Connect Wallet" 状态。不崩溃（正常行为：持久化依赖 localStorage） |

---

## 🔄 后置依赖

| 后续 Spec | 依赖说明 |
|:---------:|----------|
| **Spec 4** (Contract) | 使用 `useWallet()` 提供的地址和 `window.tronLink` 做买入签名/TRC-20 转账 |
| **Spec 5** (Integration) | 钱包连接后 TradePanel 启用买入功能，地址传递给 `/api/buy` |
| **Spec 6** (Demo UX) | 钱包连接动画、状态提示等 UI 打磨 |

---

## 📝 备注

- TronLink v3+ 使用 `window.tronLink.request({ method: 'tron_requestAccounts' })` 发起连接请求
- 网络检测通过 `window.tronLink.tronWeb.fullNode.host` 判断：
  - Shasta: `https://api.shasta.trongrid.io`
  - Mainnet: `https://api.trongrid.io`
- 账户切换监听：`window.tronLink.on('accountsChanged', handler)`
- 网络切换监听：`window.tronLink.on('networkChanged', handler)`
- 不要存任何私钥/助记词——TronLink 自己管理密钥
- TronLink 仅在浏览器环境中可用，SSR 时需要 `typeof window !== 'undefined'` 保护
- 会话持久化方案：连接成功后，将 `walletAddress` + `network` 存入 `localStorage`，页面加载时从中恢复并验证
