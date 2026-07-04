# Spec 15: 验收方案 — HTX 生态展示补全

## 自动检查

```bash
# 1. Type check（10s）
pnpm typecheck

# 2. Build verify（30s）
pnpm build
```

**任一失败 → DO NOT COMMIT. Fix first.**

---

## 手动验收

### 模块 A：$HTX Economy Display

**前置**: `pnpm dev` 运行中，浏览器打开 localhost:3000

| # | 操作 | 预期结果 | 加分指标 |
|:-:|------|---------|:--------:|
| A01 | 打开任意市场详情页（如 /markets/btc-150k-2026） | TradePanel 底部显示 "0.10% fee → $HTX Buyback: 0 USDD · resolves via AI consensus" | Buyback 计数格式紧凑（如 "1.2K"） |
| A02 | 触发 buy/sell（气囊模式可跳过 TronLink 签名） | Buyback 计数器增加（fee × 50%）；刷新页面后计数恢复 | 计数器有增量过渡动画 |
| A03 | 打开 Agents 列表页（/agents） | 每张 Agent 卡片底部显示 "$HTX earned · X USDD" | BULL-1/NEUT-1 值偏大，BEAR-2 值偏小 |
| A04 | 打开市场详情页 → 等待共识结果 | OracleDeliberation 投票卡底部显示 "$HTX earned: X USDD" | 格式与列表页一致 |
| A05 | 打开市场详情页 | KPI 区域显示 Stake 行：有链上数据时显示真实值，无链上时显示 "— (airbag)" | — |

### 模块 B：B.AI Hash Badge + 8004 身份

| # | 操作 | 预期结果 | 加分指标 |
|:-:|------|---------|:--------:|
| B01 | 打开 Agents 列表页 | modelHint 含 "B.AI" 的 Agent 显示 "⚡ Powered by B.AI" | 标签有绿色闪电图标 |
| B02 | 打开市场详情页 → 查看投票卡 | 投票卡 Agent 信息区域也显示 B.AI 标识 | 与列表页视觉一致 |
| B03 | 点击投票卡中 Agent 的 8004 ID | 新标签页打开 shasta.tronscan.org 地址页 | 即使地址不存在也能打开（展示交互意图） |

### 模块 C：AgentRegistry 自建合约

| # | 操作 | 预期结果 | 加分指标 |
|:-:|------|---------|:--------:|
| C01 | 设置 `AGENT_REGISTRY_MODE=preconfig` 后启动 dev | Agent 卡片显示 T 开头的 TRON 地址格式（如 `TXYZ...abc`） | 链接可点击跳 Tronscan |
| C02 | 设置 `AGENT_REGISTRY_MODE=live` + 合约地址 | Agent 地址从链上 AgentRegistry 合约读取 | 地址可在 Tronscan 查到 |
| C03 | 不设置任何 env（默认 mock 模式） | 回退到当前 `derive8004Id()` 行为，不崩溃 | — |

---

## 错误恢复预案

| 场景 | 表现 | 处理 |
|------|------|------|
| Buyback 计数器 NaN/Infinity | Buyback 显示异常 | `localStorage` 读取时加 `Number()` 转换和 `isNaN` 兜底 |
| 8004 Tronscan 链接打不开 | 派生 ID 不是真实 TRON 地址 | 链接仍可点击显示意图；注释标注"合约部署后替换" |
| AgentRegistry 合约未部署时设 live 模式 | Agent 地址全空，回退到 derive8004Id | 配置层自动降级 |

---

## 总验收清单

- [ ] V01 — `pnpm typecheck` 零错误
- [ ] V02 — `pnpm build` 22 条路由成功
- [ ] A01 — TradePanel Buyback 计数器可见且格式正确
- [ ] A02 — Buy/Sell 后 Buyback 值累加
- [ ] A03 — Agent 列表页 $HTX Earned 显示
- [ ] A04 — Agent 投票卡 $HTX Earned 显示
- [ ] A05 — 市场详情页 Stake 展示
- [ ] B01 — Agent 卡片 B.AI Hash Badge 可见
- [ ] B02 — 投票卡 B.AI 标识可见
- [ ] B03 — 8004 ID 可点击跳 Tronscan
- [ ] C01 — preconfig 模式显示 TRON 地址格式
- [ ] C02 — live 模式从链上读取（可选，待合约部署）
