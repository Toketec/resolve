# Spec 11: 验收方案

## AI 自检

```bash
# 1. 类型检查
pnpm typecheck

# 2. 构建
pnpm build

# 3. (可选) 启动 dev server
pnpm --filter @resolve/web dev
```

## 手动验收步骤

### 场景 A: 创建市场（DB 写入成功）

| 步骤 | 操作 | 预期结果 |
|:----|------|----------|
| A1 | 浏览器打开 `/create` | Create Market 页面正常渲染，4 步表单可见 |
| A2 | 输入 question: "Will ETH close above $5,000 by Sep 30 2026?" | 表单字段正常 |
| A3 | 选 category: crypto (默认) | — |
| A4 | 填写 Resolution criteria，threshold = 75% | — |
| A5 | 设置 expires 日期 | — |
| A6 | Step 2 → continue → Step 3，留 liquidity = 0 | 表示"不走链" |
| A7 | Step 3 → continue → Step 4 Review | 预览信息正确 |
| A8 | **点击 "Deploy market"** | 按钮变为 "Deploying…"，显示 loading |
| A9 | 自动跳转到 `/markets/will-eth-close-above-5000` | 新市场页面正常渲染（显示 live/active 状态） |
| A10 | 检查 Supabase Dashboard → `markets` 表 | 新行存在，question/slug/expires_at/status=active 正确 |
| A11 | 回到市场列表 `/markets` | 新市场出现在列表中 |

### 场景 B: 创建市场 + 链上部署（TronLink 已连接 + 有 USDD）

| 步骤 | 操作 | 预期结果 |
|:----|------|----------|
| B1 | 连接 TronLink（Shasta 测试网） | 钱包地址显示，网络为 Shasta |
| B2 | 确认 USDD 余额 > 500 | — |
| B3 | 创建市场，填写 liquidity = 500 | — |
| B4 | 点击 "Deploy market" | 进度显示 "Approving USDD…" → "Deploying on-chain…" → "Creating market record…" |
| B5 | TronLink 弹出交易签名框（两次：approve + createMarket） | 用户签名后交易提交，先链后库写入 |
| B6 | 跳转到 `/markets/{slug}` | 页面正常渲染 |
| B7 | 检查 Tronscan（Shasta） | `createMarket` 交易存在，liquidity 正确 |
| B8 | 检查 Supabase | `markets` 表记录存在，`settlement_tx_hash` 字段有值 |

### 场景 C: 错误恢复

| 步骤 | 操作 | 预期结果 |
|:----|------|----------|
| C1 | 点击 Deploy 但 question 为空 | 红色错误提示"Question is required"，按钮恢复 |
| C2 | TronLink 未连接但 liquidity > 0 | 仅 POST API 写入 DB（跳过链上），正常跳转 |
| C3 | USDD 余额不足 | 红色错误提示"USDD 余额不足"，**不写入 DB**，按钮恢复 |
| C4 | 用户拒绝 TronLink 签名 | 捕获错误，显示 "User rejected the transaction. Market was not created."，**无 DB 记录** |
| C5 | slug 已存在 | POST 返回 409，提示 "Market with this slug already exists" |

## 边界条件

- **特殊字符**：question 含 Unicode/emoji/中文字 → slug 生成应安全降级
- **超长 question**：> 200 字符 → slug 截取前 60 字符
- **expiry 为过去日期**：允许创建（显示"已过期的市场"），但要给 toast 提醒
- **liquidity 非数字输入**：表单已做 `replace(/[^0-9.]/g, "")` 处理

## 错误恢复预案

| 错误 | 表现 | 恢复操作 |
|:----|------|----------|
| API 返回 503 | "Service unavailable" | 检查 Supabase 连接 + 环境变量 |
| TronLink timeout | "Transaction timeout" | 重试或跳过链上部署 |
| Build 失败 | 类型错误 | 检查签名和类型导入 |

## 加分项

- [ ] Slug 实时预览（输入 question 时 slug 即时显示在小字位置）
- [ ] "Success" toast 动画（而非静默跳转）
- [ ] TronLink 交易进度条（等待确认中……）
- [x] 链上部署后同步 `settlement_tx_hash` 到 DB
- [ ] 重名 slug 自动追加编号（"my-market-2"）而非报错
