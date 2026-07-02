# Spec 10: Agent 规范配置 — 最终定稿

> 以下数据全部来自 docs/（whitepaper + judge-qa + dev-execution-spec），作为 canonical 的 Agent 设计。

## 6 个 Agent 规范设计

| Agent | 名字 | Role | RoleLabel | 立场 | 权重 | 分析视角（证据来源） | 模型 |
|:-----:|:----:|:----:|:---------:|:----:|:----:|:-------------------|:----:|
| **BULL-1** | Exchange Oracle | exchange-oracle | Exchange Oracle | BULL | 1.0 | HTX price data, orderbook depth, K-line trends, volume analysis | **Claude Sonnet 4** |
| **BULL-2** | Tech Oracle | tech-oracle | Tech Oracle | BULL | 0.8 | TEE adoption, L2 scaling, blockchain fundamentals, protocol upgrades | Claude Sonnet 4 |
| **BEAR-1** | Media Oracle | media-oracle | Media Oracle | BEAR | 0.8 | News sentiment, regulatory announcements, social media signals, FUD detection | **Claude Sonnet 4** |
| **BEAR-2** | Regulation Oracle | regulation-oracle | Regulation Oracle | BEAR | 0.8 | Global policy landscape (SEC, EU MiCA, Asia), compliance risk, legal precedent | Claude Sonnet 4 |
| **NEUT-1** | Onchain Oracle | onchain-oracle | Onchain Oracle | NEUT | 0.9 | On-chain metrics, whale positions, exchange flows, DeFi TVL, wallet activity | **B.AI优先** |
| **NEUT-2** | Macro Oracle | macro-oracle | Macro Oracle | NEUT | 0.9 | Interest rates, GDP forecasts, geopolitical risk, macro indicators, correlation analysis | Claude Sonnet 4 |

**模型说明**：
- BULL-1、BEAR-1 → docs 明确指定 **Claude Sonnet 4**（稳定优先）
- NEUT-1 → docs 明确指定 **B.AI 算力优先**（展示生态集成）
- BULL-2、BEAR-2、NEUT-2 → docs 未指定，沿用 Claude Sonnet 4（与 BULL-1/BEAR-1 一致）

## 当前代码与规范设计的差异

| 字段 | 当前代码的问题 | 规范版本 |
|------|--------------|---------|
| **mock bull-1 modelHint** | `Claude 4.7 · B.AI` | `Claude Sonnet 4` |
| **mock bear-1 modelHint** | `Claude 4.7 · GPT-5` | `Claude Sonnet 4` |
| **mock neut-1 modelHint** | `Claude Haiku · B.AI` | `B.AI（主推）` |
| **mock bull-2 description** | `"Supplements BULL-1 with infrastructure-level signals."` | `"TEE adoption, L2 scaling, blockchain fundamentals, protocol upgrades"`（来自 whitepaper） |
| **mock bear-1 description** | 含 `macro risks`（与 NEUT-2 重叠） | 去掉宏观，聚焦 `news sentiment, regulatory announcements, social media, FUD detection` |
| **FALLBACK_AGENTS modelHint** | 全部 `GPT` 占位 | 按规范配置统一 |
| **KIND_FROM_ROLE 映射** | bull-2→exchange, bear-2→media, neut-2→onchain | ✅ 保持这个映射（同族共用图标是合理设计）但改为明确映射表 |
| **统计字段** | mock 有精确值，mappers 用 hash 派生不匹配 | 以 mock 的精确值为准，硬编码至规范配置 |

## 最终 canonical 配置（待你确认）

**descriptions**（取 whitepaper 的 analytical lens 作为 UI 展示用 description）：

```
BULL-1:  "Technical analysis agent specializing in BTC price trends, trading volume, and HTX order book signals. Provisioned with real-time HTX market data."
BULL-2:  "Fundamentals agent tracking TEE adoption, L2 scaling, blockchain fundamentals, and protocol upgrades for a technology-driven bullish read."
BEAR-1:  "Fundamental analysis agent focusing on news sentiment, regulatory announcements, and social media signals for FUD detection and balanced assessment."
BEAR-2:  "Global regulatory agent monitoring SEC, EU MiCA, and cross-border policy for downside risk assessment and compliance threat detection."
NEUT-1:  "Data-driven neutral analysis agent examining on-chain metrics, whale positions, exchange flows, and DeFi TVL for impartial assessment."
NEUT-2:  "Macro agent weighing interest rates, GDP forecasts, geopolitical risk, and global liquidity for a probabilistic neutral stance."
```

**modelHint**（UI 展示用，来自 judge-qa 的模型分配）：
```
bull-1: "Claude Sonnet 4"
bull-2: "Claude Sonnet 4"
bear-1: "Claude Sonnet 4"
bear-2: "Claude Sonnet 4"
neut-1: "B.AI（主推）"
neut-2: "Claude Sonnet 4"
```

**描述来源依据**：
- 名字、role、权重 → `docs/whitepaper.md` 第 169-178 行
- 模型分配 → `docs/ENG/judge-qa.md` 第 68-73 行
- role 设计说明 → `docs/ENG/dev-execution-spec.md` 第 103-114 行
- 架构说明 → `docs/ENG/architecture-overview.md` 第 106-108 行
