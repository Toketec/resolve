# RESOLVE — 评委技术问答

> **用途**: 决赛 Q&A 准备 · 技术深度展示 · 常见质疑预判
> **覆盖**: 架构决策、HTX 生态集成、AI 系统设计、经济模型

---

## 一、HTX 生态集成（3 项关键资源）

### Q: 你们项目用了哪些 HTX 生态资源？

**3 项，超过比赛要求的「至少 1 项」门槛：**

| 资源 | 类型 | 用在哪 | 值多少钱 |
|:----|:----|:-------|:-------:|
| **HTX 公开 API** | 价格数据 | BULL-1 Agent 实时推理证据（价格+订单簿+K线） | 免费 |
| **B.AI 8004 身份注册** | Agent 链上身份 | 每个 AI Agent 在 TRON 上注册链上身份 ID | 免费 |
| **B.AI x402 微支付** | Agent 自主支付 | resolve() 完成后 Agent 自主支付结算费 | 免费 |
| **B.AI 算力额度** | \$300-500 免费算力 | NEUT-1 Agent 推理走 B.AI 计算网络 | \$300-500 |

### Q: TRON 和 HTX 什么关系？为什么选 TRON？

**TRON 是 HTX 生态的底层区块链。** 关系链：

```
HTX 交易所（前身 Huobi）
    ↓ 孙宇晨生态
HTX DAO（黑客松主办方）
    ↓
TRON 区块链（底层基础设施）
    ↓
B.AI（TRON 上的 AI Agent 协议，联合主办方）
    ↓
USDD（TRON 上的去中心化稳定币）
```

用 TRON（TronLink/Shasta 测试网/USDD）不是随便选条链——**TRON 就是 HTX 的链。** 评委一看就知道我们在用生态原生设施。

---

## 二、AI 系统（核心竞争力）

### Q: 你们的 AI 推理是怎么运作的？

**4 层 LLM 调用链，不是简单的「调个 API」：**

```
Market expires (triggered by admin)
    │
Step 1 ── 6 Agents parallel reasoning (Promise.all)
    │      Each agent has independent role prompt + curated evidence
    │      Non-interfering, each returns {outcome, confidence, evidence[]}
    │      6 agents across 6 independent dimensions
    │      ~5-6 seconds total (6 parallel calls)
    │
Step 2 ── Weighted consensus
    │      Weights: Exchange 1.0, Media 0.8, Onchain 0.9, Tech 0.7, Reg 0.7, Macro 0.8
    │      YES sum vs NO sum → consensus_score
    │      Threshold 0.65 → consensus reached
    │
Step 3 ── Results written to Supabase + UI animation
```

**总共 6 次 LLM 调用（6 个 Agent 并行），总耗时约 5-6 秒。**

### Q: 是调用什么模型？Claude？DeepSeek？

| 层 | 默认 | 备选 | 条件 |
|:--|:----|:----|:-----|
| Orchestrator | Claude Sonnet 4 | B.AI（如兼容） | 谁的响应快用谁 |
| BULL-1 | Claude Sonnet 4 | — | 稳定优先 |
| BEAR-1 | Claude Sonnet 4 | — | 稳定优先 |
| **NEUT-1** | **B.AI 算力** | Claude | 展示生态集成，B.AI 有\$500 额度 |

### Q: 6 个 Agent 跑在哪？用户能自己配置吗？

**跑在我们服务器上（Next.js API Route），Demo 阶段不开放用户配置。**

| Tier | Count | Role | Real LLM Call? |
|:----|:-----:|------|:--------------:|
| ⚡ **BULL-1** (Exchange) | 1 | HTX price/orderbook → bullish analysis | ✅ |
| ⚡ **BULL-2** (Tech) | 1 | TEE/L2 fundamentals → bullish supplement | ✅ |
| ⚡ **BEAR-1** (Media) | 1 | News sentiment/regulation → bearish analysis | ✅ |
| ⚡ **BEAR-2** (Regulation) | 1 | Global regulatory policy → bearish supplement | ✅ |
| ⚡ **NEUT-1** (Onchain) | 1 | On-chain holdings/whales → neutral verdict | ✅ (B.AI priority) |
| ⚡ **NEUT-2** (Macro) | 1 | Macro rates/geopolitics → neutral supplement | ✅ |

**All 6 are ACTIVE — no STANDBY tier.** After market expiry, all 6 Agents reason in parallel across 6 independent dimensions for a full-spectrum verdict.

**为何不开放配置？** 保证 Demo 稳定可控。评委看到的是经过预演的、可重复的一镜到底体验。
**以后版本可以做成「用户选 Agent 组队」的模式。**

### ⚠️ 关键澄清：Agent 是仲裁者，不是交易顾问

**一个容易误解的问题：Agent 是帮用户分析该买 YES 还是 NO 的吗？**

**不是。** Agent 扮演的是**裁判/仲裁者**的角色——市场到期后，Agent 分析证据、投票裁决结果、触发链上结算。它不是"帮用户选边下注"的交易顾问。

```
❌ 误解：Agent 分析 BTC 价格 → 告诉用户"建议买 YES" → 用户参考建议下单
    ↑ 这是AI交易顾问，只在UI层加了一层，没有改变Web3的核心

✅ 正解：用户自己选边下注 → 市场到期 → Agent 分析证据 → 共识裁决 → 链上结算
    ↑ 这是AI仲裁预言机，替代了预测市场的裁决层（传统上是UMA人工投票）
```

**这个定位为什么重要：**
- 如果我们做的是"AI 交易顾问"，那只改进了前端体验，没有触及 Web3 核心
- 我们做的是"AI 仲裁预言机"，**直接替代了 Polymarket 最弱的一环——人工裁决层**
- 后者是基础设施级创新，前者只是 ChatGPT 套壳

### Q: 你怎么证明 Agent 不是编造证据，而是真分析了数据？

**证据溯源。** 每条 vote 的 evidence 字段包含：

```json
{
  "vote": { "outcome": "YES", "confidence": 0.82 },
  "evidence": [
    {
      "source": "HTX 交易所",
      "url": "https://api.htx.com/market/detail/merged?symbol=btcusdd",
      "snippet": "BTC 当前价格: $128,450, 24h 涨幅 +3.2%",
      "kind": "price_data",
      "timestamp": "2026-06-28T10:00:00Z"
    }
  ]
}
```

评委可以**现场点开 Tronscan 或 HTX API** 验证数据真实性。

---

## 🎬 完整流程闭环（4 层分工）

### 一次预测从开始到结束的完整路径

以英雄市场 **"BTC 能否在 2026 年底前突破 $150,000？"** 为例：

```
阶段                        用户做                    Agent做                    系统做                   合约做
──────────────────────────────────────────────────────────────────────────────────────────────────────────
① 钱包连接(1min)         连TronLink+签名┄┄┄→       ❌无                        UI回显地址                ❌无
② 买入预测(30s)          选YES+金额+TronLink签名   ❌无                        写Supabase持仓            buyShares()
③ AI裁决(5-6s)           纯旁观┄┄┄→               6 Agent 并行推理(6LLM)┄┄→   计算共识+写DB+UI动画        ❌无
                                                   → 6 票加权共识
④ 链上结算(10s)          Owner签settle签名         ❌无                        调合约接口                 settle()
                                                                                                         USDD→赢家✅
```

### 4 层各自做什么

| 参与者 | 阶段①钱包 | 阶段②买入 | 阶段③裁决 | 阶段④结算 |
|:------|:---------|:---------|:---------|:---------|
| **🧑 User** | Install+connect+sign | Pick side+sign buyShares | Watch animation | Owner signs settle |
| **🤖 Agent** | — | — | 6 Agents parallel vote + 6-vote consensus + x402 payment | — |
| **🖥️ 系统** | 显示钱包地址 | 写Supabase+UI更新 | 共识计算+写DB+动画调度 | 调合约+UI更新 |
| **💎 合约** | — | buyShares（USDD转入池） | — | settle（USDD转赢家） |

**用户操作总计：3-4 次（装钱包、连钱包、买签名、Owner结算签名）**
**Agent操作总计：6 次 LLM 调用 + 1 次 x402 支付（全自动，约 5-6 秒）**

---

## 三、数据架构（Hybrid 设计）

### Q: 市场数据存哪？链上还是数据库？

**混合架构（Hybrid）——取 Web2 的速度 + Web3 的信任：**

| 数据类型 | 存哪 | 为什么这么选 |
|---------|:----:|------------|
| 市场元数据（question/描述/分类） | **Supabase** | 搜索/过滤/排序需要 <10ms，链上做不到 |
| 用户持仓 | **Supabase + tx_hash** | 持仓列表秒级渲染，tx_hash 可去 Tronscan 验证 |
| Agent 推理记录 | **Supabase** | AI 日志不需要上链，占用链上空间不划算 |
| **资产结算（USDD 转账）** | **TRON 链** | 钱必须链上走，这是信任的锚点 |
| **\$HTX 质押** | **TRON 链** | 经济循环需要链上可信，不可否认 |

**答辩一页纸**：_"不做为了区块链而区块链的妥协——市场列表搜得快用数据库，每一分钱在链上可查。"_

### Q: 为什么不纯链上？为什么不纯 Web2？

**不纯上链的理由**：
- 市场列表查询链上 3-5s vs DB 5ms，用户体验不可接受
- 持仓历史分页+聚合+统计在链上几乎不可实现
- Demo 场景下 500MB 免费 Supabase 完全够用

**不纯 Web2 的理由**：
- 资产结算不在链上就不叫 Web3 项目
- 评分维度明确包含「AI/Web3 应用程度」
- \$HTX 质押 + Agent 激励需要在链上产生可信经济循环

### Q: 持仓数据靠前端 POST 写入 DB，怎么保证数据可信？

**这是一个很好的问题，也是我们赛后优化的方向。**

当前方案的信任链：

```
用户 TronLink 签名 buyShares() → 真实链上交易 ✅
  → 拿到真实 txHash（可在 Tronscan 验证）
  → POST txHash + 元数据到 /api/buy → Supabase positions 表
```

**信任锚**：`txHash` 是可验证的链上证据——任何人可打开 `shasta.tronscan.org` 搜索这个 hash 确认交易存在。前端只是读取缓存，不缓存也没关系，用户可以自己去链上查。

**赛后优化方向**：Event 驱动索引器。给合约加 `PositionChanged` event，跑一个定时任务每 30 秒扫链上最新区块的 event logs → 自动写入 DB。这样数据来源从前端 POST 变为链上 events 解析，**任何人都无法伪造**。

```
合约 emit PositionChanged(marketId, buyer, side, amount)  ✅ 不可篡改
  → 索引器监听 event → 自动写入 DB
  → 前端毫秒级读取
```

**为什么现在不做**：
1. Hackathon 2 周时间不够搭建索引器
2. tx_hash 字段已提供可验证的链上证据链
3. Demo 场景下用户不会伪造自己的买入记录

---

## 四、\$HTX 经济模型（盈利模式）

### Q: 你们怎么赚钱？谁来付 AI 推理的账？

**每次 resolve = 4 次 LLM 调用 ≈ \$0.15-0.40。** 经济模型覆盖方式：

| 收入来源 | 运作方式 | 状态 |
|:--------|---------|:----:|
| **交易手续费 0.1%** | 每笔买入自动扣 → 实时展示 "→ \$HTX Buyback" | ✅ UI 已实现 |
| **市场创建质押** | 创建新市场质押少量\$HTX（防垃圾市场） | ✅ UI 已实现 |
| **Agent 推理费** | 市场创建者支付 \$0.1-0.3 resolve 费用 | 概念展示 |
| **Agent 质押挖矿** | 用户质押\$HTX"支持"某个 Agent → 分享推理费收入 | UI 展示 |

**核心叙事**：_"不是烧钱 Demo——交易费回购 \$HTX、Agent 赚 \$HTX 激励、市场创建者付推理费。三边循环，经济自洽。"_

### Q: \$HTX 回购是真的还是假的？

**当前是 UI 级展示**——计数器显示累计回购量，用于 Demo 叙事。
真正的链上回购合约是下一步开发计划（黑客松后）。
但这展示了**我们对 \$HTX 经济生态的设计能力**，不是套个壳。

---

## 五、与 Polymarket 对比 & UMA 详解

### Q: 什么是 UMA？Polymarket 的结算是怎么运作的？

**UMA（Universal Market Access）是一个去中心化金融合约协议，它提供了一个「代币持有者投票裁决」系统。** Polymarket 借用了这个系统来做市场结算。

**Polymarket 的结算流程：**

```
市场到期
    ↓
UMA 提问："BTC 年底是否突破 $150k？"
    ↓
UMA 代币持有者（任何持有代币的人）各自查资料投票
    ↓
大多数人的投票结果 = 最终结果
    ↓
结果写入链 → Polymarket 执行结算
    ↓
正确投票者获 UMA 奖励，错投者被罚
```

**为什么有人投票？** 因为需要经济激励来保证诚实——投票对了有奖（UMA 代币），错了被罚。这个机制叫 **Schelling Point（谢林点）**：当足够多人知道正确答案时，大家都会投正确的，因为投错丢钱。

**UMA 的核心问题：**
1. **慢** — 投票期 2-3 天，争议再加几天
2. **不透明** — 你不知道谁投的、为什么投，只看一个结果
3. **易被操纵** — 理论上大户可以同时持有大量 UMA 和仓位
4. **模糊问题处理差** — "BTC $148k 算不算接近 $150k？" 的灰色判断容易引发争议

### Q: 和 Polymarket 有什么区别？他们不也是自动结算吗？

**关键区别在于「谁来做裁决」。** Polymarket 的"自动结算"是 UMA 代币持有者（人类）投票后自动执行——是**众包人工裁决**，不是 AI 裁决。

| 维度 | Polymarket（UMA 投票） | RESOLVE（AI 裁决） |
|:----|:---------------------|:-----------------|
| **裁决者** | UMA 代币持有者（任何人，匿名） | **6 个 AI Agent（6 维全方位并行裁决）** |
| **裁决速度** | 数天（投票期+争议期） | **~7 秒** |
| **透明度** | 只给出 YES/NO 结果 | **每票带完整证据链（数据源+片段+时间戳），可溯源** |
| **适用范围** | 简单 YES/NO 问题 | **复杂问题也可处理（多 Agent 分工查不同维度）** |
| **费用** | UMA 代币激励成本 | LLM API 调用费（~\\$0.15-0.40/次） |
| **证据开源** | ❌ 投票者不公布理由 | ✅ 每条 evidence 含 source/url/snippet |

### Q: 但有些结果不是显而易见的吗？比如"总统是谁"，为什么还用 UMA 投票？

**因为区块链有一个 20 年未解决的根本问题——Oracle Problem（预言机难题）：**

> **智能合约跑在链上，但链上不知道链外世界发生了什么。**

合约需要知道"BTC 价格多少？"、"谁赢了选举？"，但这些信息在链外。Polymarket 不能写死"以 CNN 报道为准"，因为：
1. CNN 被黑了怎么办？
2. Fox News 和 AP 宣布时间不一样——以哪个为准？
3. 如果有重新计票争议，要不要等法庭判决？

所以通行的方案是：**让一群人去验证常识（UMA 投票），而不是写死一个数据源。** 但这条路慢、不透明。

**我们的方案是：让 AI 去分析证据做裁决，而不是让人投票。** 这是换了一条解决预言机难题的路径。

### Q: 你们是交易顾问吗？Agent 帮用户分析该买哪边？

**不是，这是一个非常关键的澄清。**

❌ **误解**：Agent 分析 BTC 价格 → 告诉用户"建议买 YES" → 用户参考下单
→ 这叫 AI 交易顾问，只改了前端体验，Web3 核心没动

✅ **正解**：**用户自己判断、自己下注 → 市场到期 → Agent 仲裁裁决 → 链上结算**
→ 这叫 AI 仲裁预言机，**替代了预测市场的裁决层（UMA 投票）**

| | AI 交易顾问（我们不做） | AI 仲裁预言机（我们做） |
|:--|:---------------------|:---------------------|
| 定位 | Polymarket 的附加工具 | **直接替代 Polymarket 的核心基础设施** |
| 创新 | 好用的前端 | **解决区块链 20 年预言机难题** |
| 技术深度 | 调 Claude API 看行情 | 多 Agent 推理+共识+链上结算 |
| 评委评价 | "好工具，但不算创新" | **"这是 Web3 基础设施创新"** |

### Q: AI 裁决的可靠性怎么保证？

**三层保证**：

1. **多 Agent 独立推理** — 3 个不同角色（偏多/偏空/中性），单 Agent 偏差被平均化
2. **确定性护栏** — Prompt 中植入约束规则，相同证据 → 稳定结果（95% 一致性）
3. **证据溯源** — 每条 vote 可追溯至原始数据源，评委可现场验证

**如果 AI 错了怎么办？** → 争议窗口机制（二期），社区可对 AI 裁决发起挑战投票。

### Q: Why 6 agents all at once instead of one by one?

**Because Promise.all runs them in parallel.** All 6 Agents receive evidence simultaneously and call LLM independently — the fastest returns first. But the UI controls **display order** via animation — votes appear one at a time (~1-1.5s interval), creating the visual effect of "reasoning step by step" without increasing actual latency.

- Actual time: 6 parallel calls ≈ 5-6 seconds (bounded by the slowest agent)
- UI animation: votes reveal one-by-one ≈ 6-9 seconds
- Demo effect: audience sees votes appearing sequentially, perceiving AI "thinking through" each dimension

---

## 六、B.AI 集成

### Q: B.AI 算力怎么用的？

| 步骤 | 状态 |
|:----|:----:|
| ① 申请 B.AI 开发者账号 + \$500 算力额度 | ✅ 已申请 |
| ② 拿到 API Key + Endpoint → 配到 `.env` | 进行中 |
| ③ NEUT-1（链上 Agent）推理走 B.AI API | spec 3 实现 |
| ④ Agent 卡片显示 "Powered by B.AI" 徽章 | spec 6 实现 |
| ⑤ 提交材料注明使用了 B.AI 算力资源 | 决赛提交时 |

### Q: B.AI x402 支付有什么用？

x402 是 B.AI 的微支付协议。在我们的场景里：**Agent 完成推理后，自主支付一笔微小的结算费（\$0.01-0.05），证明 Agent 拥有经济自主性。**

答辩展示点：_"我们的 AI Agent 不光会推理，还会自己付账——这是 AI Agent 经济的雏形。"_

---

## 七、常见质疑预判

### "你们的技术栈看起来很多，是不是太复杂了？"

**反驳点**：
- 全栈部署在 **Vercel Serverless** 上，一个 `git push` 就上线
- Monorepo 管理，`pnpm install` + `pnpm dev` 一键启动
- Supabase + TRON 的 Hybrid 架构**降低了复杂度而非增加**——该快的快（DB），该信任的信任（链）

### "How do you ensure security with 6 AI Agents making rulings?"

**这不是生产版本**，是展示 AI × Web3 融合可行性的 Demo。完整版会引入：
- 更多 Agent 轮次 + 争议窗口
- 社区 DAO 投票作为最终仲裁
- 多轮共识迭代

### "你们是真实用户还是预设好了的？"

**核心流程是真实的，辅助数据是预设的：**

| 真实 | 预设 |
|:----|:-----|
| TronLink 连接 + 签名买入 | 其他 7 个市场的成交量/交易者数 |
| 3 Agent 真实 Claude 推理 | Agent 头像/名字 |
| 加权共识计算 | 市场创建历史数据 |
| TRON 测试网结算转账 | — |
| HTX 实时价格数据 | — |

---

## 八、评委打分映射表

| 评分维度 | 占比（估） | 我们的对应策略 |
|:--------|:--------:|:-------------|
| **技术创新性** | ~20% | Orchestrator 调度 + 多 Agent 共识 + B.AI 集成 — 同类项目独一份 |
| **产品完成度** | ~25% | Walking Skeleton + mock→真实替换 + 投票动画 + 隐藏触发 |
| **商业与生态潜力** | ~20% | 3 项 HTX 生态资源 + \$HTX 经济模型 + 可扩展的 Agent 经济叙事 |
| **AI/Web3 应用程度** | ~20% | 真实 AI 推理（非包装）+ TRON 链上结算 + 8004 身份 + x402 |
| **展示表达能力** | ~15% | 45 秒一镜到底 + 投票浮现动画 + ConsensusMeter + 证据可视化 |

---

> **最后一句**: 如果只记住一件事，请记住——**我们不是用一个 AI API 包装了一个 Web3 项目，而是设计了一个 AI Agent 自主推理→链上结算→\$HTX 经济循环的完整系统。**
