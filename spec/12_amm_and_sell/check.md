# Spec 12: 验收方案

## AI 自检

```bash
pnpm typecheck
pnpm build
pnpm --filter @resolve/web dev
```

## 手动验收步骤

### 场景 A: Buy + AMM 价格

| 步骤 | 操作 | 预期结果 |
|:----|:------|----------|
| A1 | 打开 `/markets/btc-150k-2026` | 详情页渲染 |
| A2 | TradePanel 显示当前 YES price（如 52%） | 价格与合约查询一致 |
| A3 | 输入 $100，Buy YES | "~192.3 shares" 显示 |
| A4 | 连接 TronLink，确认签名 | 交易成功，positions 余额更新 |

### 场景 B: Sell

| 步骤 | 操作 | 预期结果 |
|:----|:------|----------|
| B1 | 切换到 "Sell YES" tab | 显示当前 YES 持仓数量（如 500 shares）|
| B2 | 输入 200 shares | "将获得约 $110 USDD（扣 0.1% 费后）" |
| B3 | 点击 Sell YES → TronLink 签名 | 交易成功，positions 余额减少 |
| B4 | 切换到 Buy tab 重新 YES price | 价格应略有下降（卖压） |

### 场景 C: Recent Trades

| 步骤 | 操作 | 预期结果 |
|:----|:------|----------|
| C1 | 页面底部 "Recent trades" | 显示真实交易记录（非 mock） |
| C2 | 包含不同 wallet 的 buy/sell 记录 | 每条带 side/shares/price/when/fee |
| C3 | 新交易出现后刷新 | 更新时间正确 |

### 场景 D: 创建市场 + 创建费

| 步骤 | 操作 | 预期结果 |
|:----|:------|----------|
| D1 | `/create` → 填表单 → liquidity = 1000 | 预览正常 |
| D2 | 点击 Deploy market → TronLink | 第一次弹：approve USDD（1010 USDD = 1000 流动性+10 创建费）|
| D3 | 第二次弹：createMarket() 签名 | 交易成功 |
| D4 | 跳转到 `/markets/{slug}` | 页面渲染正常 |
| D5 | Tronscan 查看新合约 | MARKETCREATED 事件；count 增加；feePool 显示 10 USDD |

### 场景 E: 费用验证

| 步骤 | 操作 | 预期结果 |
|:----|:------|----------|
| E1 | 通过 Tronscan 查看合约状态 | `feePool` 字段累积 > 0 |
| E2 | Owner 页面的 "Claim fees" 按钮 | 点击后 feePool 归零，owner 收到 USDD |

## 边界条件

- **持仓不足时 sell**：卖出超限应显示 "Insufficient balance"，不触发签名
- **市场已结算时 sell**：按钮 disabled 或显示 "Market settled"
- **滑点保护**：如果大额卖出导致 price 大幅变动，应警告
- **创建费不足**：用户 USDD 余额 < (流动性 + 10) → 显示 "Insufficient USDD for creation fee"
- **trades 表查询空**：空状态显示 "No trades yet" 而非空白或崩溃

## 错误恢复预案

| 错误 | 表现 | 恢复操作 |
|:----|------|----------|
| 合约部署失败 | Solidity 编译错 | 检查 TVM 兼容性（Solidity 0.8.24） |
| TronLink sell 签名失败 | "Transaction rejected" | 提示重试，positions 保持不变 |
| DB migrate 字段冲突 | positions 表已存在 | 写 SQL 迁移脚本，不走自动 migrate |
| 价格计算溢出 | 大数运算异常 | 检查合约内整数运算（使用 uint256 safe math） |

## 加分项

- [ ] AMM 价格变化动画（价格的实时折线叠加在 TradePanel 内）
- [ ] "Slippage"（滑点）提示：大额卖出的估计损失百分比
- [ ] Sell tab 的 "Max" 按钮：一键卖出全部持仓
- [ ] 历史成交价图：PriceChart 叠加成交量柱状图
- [ ] 创建费 wallet 提示：在 Deploy 前显示 "创建本市场需支付 10 USDD + L USDD 流动性"
