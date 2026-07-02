# Spec 9: 执行计划 — 文字描述统一优化

## 优先级与执行顺序

按「对用户可见程度」从高到低排序，保证最早改动用户第一眼看到的文字。

---

## Step 1: i18n 文案更新（核心，影响首页 Hero + How pillars）

**文件**: `apps/web/lib/i18n/messages.ts`

### 1.1 更新 EN 文案

```diff
- "hero.subtitleBold": "Three AI oracles.",
+ "hero.subtitleBold": "Six AI oracles, three stances.",

- "hero.subtitle": "One signed truth. Trade YES/NO on anything verifiable — the agents read the wires, the chain, and the APIs, then settle the market.",
+ "hero.subtitle": "One signed truth. Trade YES/NO on anything verifiable — six specialized agents across bullish, bearish, and neutral stances read the markets, the news, and the chain, then settle with weighted consensus.",

- "how.titleA": "Three agents.",
+ "how.titleA": "Six agents, two per stance.",

- "oracle.aEyebrow": "Oracle A — Exchanges",
- "oracle.aTitle": "Reads the source.",
- "oracle.aBody": "Signed timestamps from major exchanges and primary APIs. Cross-checks the feed.",
+ "oracle.aEyebrow": "BULL Stance — 2 agents",
+ "oracle.aTitle": "Bullish on fundamentals.",
+ "oracle.aBody": "BULL-1 reads exchange prices, volume, and order books. BULL-2 tracks TEE/L2 adoption and dev activity. Both lean YES when data supports.",

- "oracle.bEyebrow": "Oracle B — Newswire",
- "oracle.bTitle": "Reads the world.",
- "oracle.bBody": "Global wires, official press, and citation-weighted social. Trust by reputation graph.",
+ "oracle.bEyebrow": "BEAR Stance — 2 agents",
+ "oracle.bTitle": "Cautious on risk.",
+ "oracle.bBody": "BEAR-1 monitors news sentiment and macro risk. BEAR-2 tracks global regulatory policy. Both lean NO when threats emerge.",

- "oracle.cEyebrow": "Oracle C — On-chain",
- "oracle.cTitle": "Reads the chain.",
- "oracle.cBody": "Verifies inclusion + finality across L1s and L2s. The state of record.",
+ "oracle.cEyebrow": "NEUT Stance — 2 agents",
+ "oracle.cTitle": "Data-driven, impartial.",
+ "oracle.cBody": "NEUT-1 analyzes on-chain flows, whale behavior, and exchange net positions. NEUT-2 weighs macro rates and geopolitics. Both follow the data, not a narrative.",
```

### 1.2 同步更新其他 10 种语言

用相同语义翻译步骤 1.1 的改动到：`es`, `zh`, `fr`, `de`, `ja`, `ko`, `pt`, `ar`, `hi`, `it`

**特别注意**: `ja` 和 `ko` 的 subtitleBold 写的是「3 つの」/「셋」— 改为「6 つの」/「여섯」

---

## Step 2: Mock Agent 数据重写

**文件**: `apps/web/lib/mock/agents.ts`

替换全部 6 个 Agent 为正确的 2+2+2 设计：

```typescript
export const MOCK_AGENTS: Agent[] = [
  {
    id: "bull-1", callsign: "BULL-1",
    name: "Exchange Oracle", kind: "exchange-oracle",
    description: "Technical analysis agent specializing in BTC price trends, trading volume, and HTX order book signals. Provisioned with real-time HTX market data.",
    modelHint: "GPT + HTX", tier: "BULL", weight: 1.0, // 新增 tier + weight
    ...
  },
  // BULL-2, BEAR-1, BEAR-2, NEUT-1, NEUT-2
];
```

**要点**:
- Agent `id` = `bull-1`, `bull-2`, `bear-1`, `bear-2`, `neut-1`, `neut-2` — 与 `oracle-deliberation.tsx` 的 `WEIGHT` map 对齐
- 每个 Agent 加 `tier: "BULL" | "BEAR" | "NEUT"` 字段
- 每个 Agent 加 `weight: number` 字段（与 consensus.ts 的 `ROLE_WEIGHTS` 对齐）
- `kind` 对应用正确值：`exchange-oracle`, `tech-oracle`, `media-oracle`, `regulation-oracle`, `onchain-oracle`, `macro-oracle`

---

## Step 3: 类型定义更新

### 3.1 `packages/shared/src/index.ts`

- 移除 `AgentKind` 中的 `sports-feed`/`weather-feed`/`election-monitor`
- 如新增，加 `tech-oracle`/`regulation-oracle`/`macro-oracle`
- `Agent` 类型增加 `tier: string` 和 `weight: number`（可选字段，向后兼容）
- `AgentVote` 增加 `tier?: string` 和 `weight?: number`

### 3.2 `apps/web/lib/types.ts`

同步更新同 3.1。

### 3.3 `apps/web/lib/mappers.ts`

`ApiAgent` 增加 `stance: "BULL" | "BEAR" | "NEUT"` 字段。
`FALLBACK_AGENTS` 已正确使用 BULL/BEAR/NEUT callsign，但需补足 `stance` 字段。

---

## Step 4: Mock Markets 修正

**文件**: `apps/web/lib/mock/markets.ts`

- `buildConsensus()` 中 `MOCK_AGENTS.slice(0, 4)` → `MOCK_AGENTS`（全 6 个）
- threshold 默认值 `0.75` → 对齐 `0.65`
- 为 resolving/resolved 市场生成 6 票共识（目前 4 票）

---

## Step 5: 前端页面/组件更新

### 5.1 首页 (`app/page.tsx`)
- 首页 3 Pillar 卡片文字已由 i18n 驱动（Step 1 更新后自动生效）
- 确认 Pillar 卡片图标更匹配 BULL/BEAR/NEUT 立场（如火箭/盾牌/天平等）

### 5.2 Agent 页面 (`app/agents/page.tsx`)
- `L208`: `/ 4` → `/ 6`
- 在 Agent 卡片上方/侧边新增 BULL/BEAR/NEUT 分组标签
- 用 `TONE_BY_INDEX` 按 BULL→BEAR→NEUT 顺序分配颜色

### 5.3 市场详情页 (`app/markets/[slug]/page.tsx`)
- `L162`: `(market.consensus?.threshold ?? 0.75)` → `0.65`

### 5.4 Consensus Meter (`components/consensus-meter.tsx`)
- `L82`: votes grid `grid-cols-2 sm:grid-cols-4` → `grid-cols-3`

---

## Step 6: 项目根 README.md

更新 README.md 中的 Agent Trinity 表格和架构图，使其反映 6 Agent 2+2+2 设计。

---

## 文件改动清单

| # | 文件 | 操作 |
|:-:|------|:----:|
| 1 | `apps/web/lib/i18n/messages.ts` | 修改 11 种语言的 7 个 key |
| 2 | `apps/web/lib/mock/agents.ts` | 重写全部 6 个 Agent |
| 3 | `packages/shared/src/index.ts` | 修改 AgentKind/Agent 类型 |
| 4 | `apps/web/lib/types.ts` | 同步修改类型定义 |
| 5 | `apps/web/lib/mappers.ts` | 新增 stance 字段 |
| 6 | `apps/web/lib/mock/markets.ts` | 修复 4→6、阈值 0.75→0.65 |
| 7 | `apps/web/app/agents/page.tsx` | 修复 /4→/6、加分组标签 |
| 8 | `apps/web/app/page.tsx` | i18n 驱动，图标可选调整 |
| 9 | `apps/web/app/markets/[slug]/page.tsx` | 阈值默认值 0.75→0.65 |
| 10 | `apps/web/components/consensus-meter.tsx` | grid-cols 4→3 |
| 11 | `README.md` | 更新 Agent 表格/架构 |
