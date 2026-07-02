# Spec 9: 验收方案

## AI 自检

```bash
# 在项目根目录执行

# 1. 类型检查
pnpm typecheck

# 2. 构建检查
pnpm build

# 3. 搜索残留 "3 Agent" 文案
grep -rn "trinity\|three.*agent\|Three.*agents\|三个.*智能体\|3.*Agent\|Tres.*oráculo" apps/web/ --include="*.tsx" --include="*.ts" --include="*.js" || echo "✅ 无残留"
```

## 人工检查（浏览器）

| # | 位置 | 操作 | 预期结果 |
|:-:|------|------|---------|
| 1 | 首页 Hero | 打开 `/` | 「Six AI oracles, three stances.」/「六个 AI 预言机三种立场」不再有「Three」 |
| 2 | 首页 How it works | 滚动到 Pillars | BULL Stance / BEAR Stance / NEUT Stance 三个卡片，各描述 2 个 Agent |
| 3 | Agent 页面 | 打开 `/agents` | 6 个 Agent 卡片显示 BULL-1/BULL-2/BEAR-1/BEAR-2/NEUT-1/NEUT-2 |
| 4 | Agent 页面 | 查看投票数 | 已解决市场显示 "6" 而非 "4" |
| 5 | 市场详情页 | 打开 `/markets/btc-150k-2026` | Threshold 显示 "65%" 而非 "75%" |
| 6 | Consensus Meter | 打开已解决市场 | 投票列表显示 6 票（3 列布局） |

## 错误恢复预案

| 场景 | 处理方式 |
|------|---------|
| `pnpm typecheck` 报类型错误 | 检查 `tier`/`weight` 字段是否在 `Agent` 类型中正确定义，且 mock data 包含这些字段 |
| Agent 页面布局错乱 | `grid-cols-3` 改为 `grid-cols-2 sm:grid-cols-3` 确保移动端显示正常 |
| i18n 某语言 key 遗漏 | 其他语言会回退到英文（t() 的 fallback 链） |

## 加分项

- [ ] Agent 页面按 BULL/BEAR/NEUT 分组显示，带分组标题
- [ ] Agent 卡片图标反映立场（BULL→📈/🚀, BEAR→🛡️/⚠️, NEUT→⚖️/📊）
- [ ] 首页 Pillar 卡片图标更新为匹配 BULL/BEAR/NEUT 立场
