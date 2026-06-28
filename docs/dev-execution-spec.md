# RESOLVE — Dev 执行任务规格

> **版本**: 1.0 · **锚点**: 2026-06-27 · **面向**: Dev A (链) / Dev B (AI) / Dev C (应用)
> **目标**: 7月5日前完成可演示的Hero Market端到端，全真路径可跑

---

## 0. 约定

### 0.1 接口契约（不可变更，已锁定）

三条切片的接口已在 `docs/CHI/api-contracts.zh.md` 和 `packages/shared/src/index.ts` 中定义。
**任何类型改动必须经过三方同意。** 未经同意私自修改类型→回滚。

核心接口一览（复用 `@resolve/shared` 类型）：

```ts
// Interface 1 (C↔B): resolve market
resolve(market: Market): Promise<AIConsensus>

// Interface 2 (C↔A): buy + settle
buyShares({ marketId, side, amount, walletAddress }): Promise<Position>
settle({ marketId, outcome, winnerWallet }): Promise<{ txHash, simulated }>

// Interface 3 (C→B): price feed
getPrice(symbol): Promise<{ symbol, price, source, at }>
```

### 0.2 工作方式

- **Walking Skeleton 优先**: 先用 mock 打通端到端，再逐个替换为真实实现
- **分叉不阻塞**: 各自对着接口开发，接口不变则工作不阻塞
- **每日集成**: 至少每天一次 push，C 负责接缝
- **冻结日 7/3 12:00**: 之后只修复 bug，不新增功能

### 0.3 预置/造假/砍掉规则（来自 product-spec）

| 类别 | 内容 |
|------|------|
| **必须真实** | TronLink连接→测试网买入→到期→AI推理→共识→测试网赔付 + 8004身份 + x402 |
| **造假/预置** | 其他市场数据、成交量、交易者数、价格发现——静态mock |
| **砍掉(本次不做)** | 卖出仓位、订单簿、做市逻辑、LP收益、争议投票、跨链、完整代币经济 |

---

## 1. 任务全景（按切片）

### 🧩 Dev A — Chain / Money（链上/资产）

| ID | 任务 | 优先级 | 预估工时 | 依赖 | 验收标准 |
|:--:|------|:------:|:--------:|:----:|---------|
| A-01 | TronLink连接(基本) | P0 | 4h | — | 页面点击Connect Wallet → 弹出TronLink → 连接成功显示地址 |
| A-02 | TRON测试网环境搭建 | P0 | 2h | — | Shasta测试网有USDD测试币，可转账 |
| A-03 | 结算合约(预注资) | P0 | 6h | A-02 | Solidity合约部署到Shasta，预注资，可向赢家地址转账 |
| A-04 | 测试网买入(单边签名) | P0 | 4h | A-01 | 用户签名→支付USDD→仓位记录上链 |
| A-05 | 测试网赔付 | P0 | 4h | A-03 | 共识达成后合约向赢家地址支付(TRC-20) |
| A-06 | 气囊按钮(模拟赔付) | P1 | 2h | A-03 | 一键返回假txHash，UI不察觉差异 |
| A-07 | 🆕 B.AI 8004 Agent身份注册 | **P0** (↑从P1) | 4h | — | **比赛关键加分项**。在B.AI注册Agent身份，拿到8004 ID。展示HTX生态使用 |
| A-08 | 🆕 B.AI x402微支付集成 | **P0** (↑从P2) | 4h | A-07 | resolve()中触发x402支付，展示Agent经济自主性。比赛关键加分项 |
| A-09 | api-contracts中settle()实现 | P0 | 2h | A-03 | 暴露出 `settle()` 供C的API路由调用 |

**A 的依赖风险**: A-02(测试网有币)被其他项目方卡住→找主办方要测试币或手动领水。
**A 的安全要求**: 私钥/助记词绝不出现在代码中，用 `.env` 管理。

---

### 🧩 Dev B — AI Oracle（AI 推理 / 亮点）+ 路演

| ID | 任务 | 优先级 | 预估工时 | 依赖 | 验收标准 |
|:--:|------|:------:|:--------:|:----:|---------|
| B-01 | 选定英雄市场 | P0 | 2h | — | 确定1个问题 + 预期结果 + 精选证据素材 |
| B-02 | 单Agent真实Claude推理 | P0 | 6h | B-01 | prompt→Claude API→parse {outcome, confidence, evidence} |
| B-03 | 3-Agent并行推理 + prompt设计 | P0 | 6h | B-02 | 3个不同角色prompt(交易所/媒体/链上)，各自产出投票 |
| B-04 | 精选证据装置(英雄市场) | P0 | 4h | B-01 | 预取证据集HTX价格/新闻/链上数据, 喂给对应Agent |
| B-05 | 共识数学 + 确定性护栏 | P0 | 3h | B-03 | 加权投票→加权共识。英雄市场预演确保≥0.65阈值 |
| B-06 | resolve()真实实现→替换mock | P0 | 2h | B-05 | `packages/ai/src/index.ts` 中 `resolveMarket` 真实调用 |
|| B-07 | HTX交易所Agent证据源 | P1 | 3h | B-01, C-03 | 消费HTX价格数据作为推理证据的一部分 |
|| B-08 | Pitch Deck初稿(10-12页) | P1 | 6h | — | 问题→方案→技术→商业→团队→路线图 |
|| B-09 | Demo脚本(45s) | P1 | 2h | B-05 | 分秒级的演示话术和屏幕操作引导 |
|| B-10 | 路演排练 | P1 | 4h | B-08, B-09 | 流畅讲述+回答问题准备 |
|| B-11 | 社区投票文案 | P2 | 1h | — | 推特/社区一条可转发的内容 |
|| **B-12** | 🆕 **Prompt工程 — 3个ACTIVE Agent精准设计** | **P0** | **4h** | B-01 | 编写BULL-1/BEAR-1/NEUT-1三份角色prompt，每份含：角色人设、推理规则、证据集成方式、输出JSON schema、确定性护栏。hero market预演≥3次确保95%一致性 |
|| **B-13** | 🆕 **Orchestrator — 6选3智能调度Agent** | **P0** | **3h** | B-02 | 在resolve流程最前面增加一层LLM调用。给定市场问题+6个Agent能力描述，选最优3个ACTIVE+给出选择理由。selectAgent()返回 {selected:["bull-1","bear-1","neut-1"], reasoning:"..."} |
|| **B-14** | 🆕 **B.AI LLM服务集成（视API兼容性）** | **P1** | **2h** | B-02, 用户提供B.AI Key | 将至少1个Agent（建议NEUT-1）的推理路由到B.AI提供的LLM服务。`.env`配`BAI_API_KEY`+`BAI_API_ENDPOINT`。兼容OpenAI格式则一行代码切换 |

**B 的依赖风险**: Claude API key + rate limit → 提前测试调用频率。B.AI API兼容性待用户注册后确认。
**B 的关键决策**: 先定 G6(3个Agent) 和 G8(英雄市场问题)，不决定就不开工。**新增B-13(Orchestrator)改变resolve流程为: selectAgent() → parallel inference → consensus。**

**Agents角色设计建议**（更新：新增 Orchestrator 调度层）:

| Agent | ID | Tier | 角色 | 证据源 | Prompt风格 |
|-------|-----|:----:|------|--------|-----------|
| **Orchestrator** | agent-selector | ⚡ **调度层** | 总调度 | 市场问题+6个Agent档案 | 分析市场→选最优3个 |
| **BULL-1** (交易所预言机) | bull-1 | ⚡ ACTIVE | 看多分析 | HTX BTC价格、交易量趋势 | 技术分析偏多 |
| **BEAR-1** (媒体预言机) | bear-1 | ⚡ ACTIVE | 看空/谨慎 | 新闻情绪、监管动态 | 基本面偏保守 |
| **NEUT-1** (链上预言机) | neut-1 | ⚡ ACTIVE | 中性判断 | 链上数据、持仓分布 | 数据驱动中性 |
| **BULL-2** (技术预言机) | bull-2 | 💤 STANDBY | 备用看多 | — | — |
| **BEAR-2** (监管预言机) | bear-2 | 💤 STANDBY | 备用看空 | — | — |
| **NEUT-2** (宏观预言机) | neut-2 | 💤 STANDBY | 备选中性 | — | — |

**resolve 流程（更新）**:
```
Market expires (triggered)
  → orchestrator.selectAgent(market, all_agents)  ← 新增！多一层LLM调用
    → 返回 {selected: ["bull-1","bear-1","neut-1"], reasoning: "..."}
  → parallel inference on selected 3 agents
  → weighted consensus
  → UI shows Agent Selection reason → votes 1-by-1
```

**设计说明**: UI 展示 6 个 Agent 的 Pool + 1 个 Orchestrator 调度器。Orchestrator 先展示"正在选择最优 Agent 组合…"动画，然后 3 个被选中的 Agent 依次推理。未选中的显示"Standby for this market"。

---

### 🧩 Dev C — Application / Data / Seams（应用 / 接缝）

| ID | 任务 | 优先级 | 预估工时 | 依赖 | 验收标准 |
|:--:|------|:------:|:--------:|:----:|---------|
|| C-01 | API路由骨架 | P0 | 4h | — | `/api/markets`(/agents/price/buy/resolve/settle) 路由定义好。市场/Agent 从 Supabase 读取（真实数据），价格/深度/K线从 HTX 公开 API 读取（真实数据），buy 写入 Supabase positions（数据真链上签名 mock），resolve/settle 返回 mock（等 spec 3/4 替换） |
|| C-02 | Supabase数据层搭建 + Schema部署 | P0 | 3h | — | 在 Supabase SQL Editor 执行迁移，`markets/positions/agent_consensus/agent_votes` 四表创建完成，英雄市场种子数据插入 |
| C-03 | HTX行情数据只读API | P1 | 2h | — | 通过HTX公开API获取BTC/USDT价格 |
| C-04 | Walking Skeleton集成 | P0 | 4h | C-01, A-09(mock), B-06(mock) | 全部mock但真实API接口连通→UI端到端 |
| C-05 | A-01集成(真实TronLink) | P0 | 2h | A-01 | Connect Wallet按钮指向真实TronLink连接 |
| C-06 | A-04集成(真实买入) | P0 | 2h | A-04 | TradePanel中买入按钮调真实签名 |
| C-07 | B-06集成(真实resolve) | P0 | 2h | B-06 | 市场到期自动调真实AI推理 |
| C-08 | G4: 投票浮现动画 | P1 | 3h | C-07 | consensus votes一条接一条显示(每1-2秒一条UI动画) |
| C-09 | G5: 隐藏"立即解析"触发器 | P1 | 2h | C-08 | admin按键(开发环境或secret tap)触发resolve |
| C-10 | G3: USDC→USDD文字替换 | P1 | 0.5h | — | TradePanel和所有UI中USDC改为USDD |
| C-11 | A-05集成(真实赔付) | P0 | 2h | A-05 | settle按钮调真实合约调用，UI显示txHash |
| C-12 | A-06气囊按钮集成 | P1 | 1h | A-06 | 测试网不稳时一键切模拟模式 |
| C-13 | 英雄镜头排练+脚本固化 | P0 | 4h | C-08 ~ C-11 | 一镜到底demo走5次全通无错 |
| C-14 | 备用视频录制(Screenflow) | P0 | 2h | C-13 | 录制一个45-60s的完整演示录屏 |
| C-15 | 🆕 Vercel部署+HTTPS（零ICP备案） | P0 | 2h | — | 部署到Vercel Hobby免费计划。`vercel.app` 子域名，零ICP备案，全球CDN |
| C-16 | 提交材料(GitHub描述等) | P1 | 2h | — | GitHub README完善+项目简介 |
| C-17 | 🆕 AGENTS.md/CLAUDE.md更新 | P2 | 1h | — | 反映最终架构和dev命令 |
| C-18 | 🆕 B.AI 8004身份展示页 | P1 | 2h | A-07 | 在UI中展示Agent的8004 ID及链上证明链接 |
|| C-19 | 🆕 B.AI x402触发演示 | P1 | 2h | A-08 | 在consensus达成后触发x402支付并展示交易哈希 |
||| **C-20** | 🆕 **\$HTX 经济模型全展示（盈利模型代码化）** | **P1** | **4h** | C-11 | ① TradePanel显示"0.1% fee → \$HTX Buyback"实时计数器 ② 结算后Agent卡片显示\$HTX Earned金额 ③ Agent详情页显示\$HTX质押量（静态数据）和累计收益 ④ 市场详情页顶部显示"Market Stake: X \$HTX"——纯前端不可否认账，展示完整\$HTX经济循环叙事 |
||| **C-21** | 🆕 **HTX 订单簿深度 + K线数据** | **P1** | **1.5h** | C-03 | 新增`/api/price/:symbol/depth`(订单簿)和`/api/price/:symbol/kline`(K线)路由；前端市场详情页展示订单簿深度和价格走势图；BULL-1 Agent证据中加入订单簿数据 |
||| **C-22** | 🆕 **B.AI 算力注册 + LLM集成 + 展示徽章** | **P1** | **2h** | — | ① 申请B.AI算力额度(\$300-500) ② `.env`配`BAI_API_KEY`+`BAI_API_ENDPOINT` ③ 至少1个Agent推理路由至B.AI（兼容OpenAI格式则一行代码） ④ Agent卡片显示"Powered by B.AI"徽章 ⑤ 提交材料注明使用了B.AI算力资源 |

**C 的关键路径**: C-01(C-03) → C-04 → C-05/C-06/C-07 → C-08/C-09 → C-13 → C-18/C-19 → **C-20/C-21**
**C 的风险**: 如果A或B延迟，C可以通过mock确保前端不阻塞。C从第一天起就可以用mock工作。

---

## 2. 集成时间线

```
周一 6/28  ─── 各自开发mock API + 单Agent原型
     ↓
周二 6/29  ─── Walking Skeleton (全部mock, 接口真实)
     ↓
周三 6/30  ─── 真实替换 #1: TronLink连接 + 单Agent真实推理
     ↓
周四 7/1   ─── 真实替换 #2: 测试网买入 + 3-Agent共识 + 赔付
     ↓
周五 7/2   ─── 打磨: 投票动画 + 触发控制 + demo排练 + **\$HTX UI + 更多HTX API**
     ↓
周六 7/3   ⛔ 硬冻结: 只修复不新增
     ↓
周日 7/4   ─── 提交材料 + 备用录屏
     ↓
周一 7/5   ─── 提交截止
```

---

## 3. 代码规范

### 3.1 分支策略

```
main          ── 只接受可构建、可演示的提交
  ├── dev-c   ── Dev C 日常工作分支
  ├── dev-a   ── Dev A 日常工作分支
  └── dev-b   ── Dev B 日常工作分支
```

- 每日集成: dev-c → dev-a(拉取) + dev-b(拉取)
- 冻结后: 只允许 main PR，必须经过代码审查

### 3.2 类型安全

```bash
pnpm typecheck    # 必须通过才能提交
pnpm build        # 必须通过才能合并到main
```

### 3.3 敏感信息

- API Keys / Private Keys 全部存入 `.env` (已在 `.gitignore` 中)
- `.env` 模板 → `.env.example` (标注哪些key需要填)
- 测试网私钥绝不提交

### 3.4 Commit message 规范

```
格式: <type>: <简短描述>
类型: feat|fix|chore|docs|refactor|test
示例:
  feat: add TronLink wallet connection
  fix: resolve consensus meter not updating
  chore: bump shared type version
```

---

## 4. 验收检查清单（决赛前必须全部通过）

### 4.1 Hero Market 端到端 ✅

- [ ] TronLink 连接正常，显示地址
- [ ] 选中 "BTC $150K EOY?" 市场（英雄市场）
- [ ] 输入金额，点击 Buy YES → 签名弹窗 → 交易成功
- [ ] 市场到期（通过隐藏触发器）
- [ ] 3个Agent依次显示投票(带evidence)
- [ ] YES/NO 加权 → 共识越过0.65阈值
- [ ] ConsensusMeter 显示 "Consensus reached"
- [ ] 结算按钮 → TRON测试网转账成功
- [ ] 钱包收到赔付
- [ ] 全过程 45 秒内完成（包括等待AI推理的间隔）
- [ ] 🆕 **Orchestrator**: resolve开始前端显示"正在选择最优Agent组合…"动画
- [ ] 🆕 **Orchestrator**: 返回后显示选择理由"Selected BULL-1/BEAR-1/NEUT-1 for BTC market"
- [ ] 🆕 **\$HTX 展示**: TradePanel底部显示"0.1% fee → \$HTX Buyback"计数器
- [ ] 🆕 **\$HTX 展示**: 结算后Agent卡片显示\$HTX Earned金额
- [ ] 🆕 **\$HTX 展示**: Agent详情页显示\$HTX质押量和累计收益
- [ ] 🆕 **HTX 深度数据**: 市场详情页显示订单簿深度图
- [ ] 🆕 **\$HTX 展示**: 结算后Agent卡片显示\$HTX Earned金额
- [ ] 🆕 **HTX 深度数据**: 市场详情页显示订单簿深度图
- [ ] 🆕 **HTX K线**: 市场详情页显示HTX BTC真实K线走势
- [ ] 🆕 **B.AI 算力**: Agent卡片显示"Powered by B.AI"徽章

### 4.2 提交材料 ✅

- [ ] GitHub README: 项目介绍、团队、demo链接、架构图
- [ ] 项目演示视频(45-60s)
- [ ] 提交表单信息完整
- [ ] UAT环境可公网访问(Vercel)

### 4.3 路演准备 ✅

- [ ] Pitch Deck 10页+（问题→方案→技术→商业→团队→路线图）
- [ ] 45秒demo脚本（话术+操作同步）
- [ ] 评委常见QA预演（至少准备3个最可能的问题）

---

## 5. 常见问题提前准备

| 可能的问题 | 回答要点 |
|-----------|---------|
| 你们和Polymarket什么区别？ | 他们人工/社区裁决，我们是AI Agent自动解析+链上自动结算 |
| AI裁决可靠性如何？ | 多Agent独立推理+加权共识+证据溯源，单Agent偏差被平均化 |
| 如果AI错了怎么办？ | 争议窗口机制+社区兜底投票(二期)，DEMO中三个Agent一致性已验证 |
| 为什么用TRON？ | HTX生态、低手续费、高吞吐。测试网结算已在Shasta验证 |
|| B.AI集成的价值？ | 8004身份注册使Agent链上可信，x402支付让Agent自主支付结算费 |
|| **\$HTX 在你们项目中的角色？** | **交易手续费自动回购\$HTX，AI Agent获\$HTX激励—活的经济模型而非套壳概念** |
|| **B.AI 算力怎么用的？** | **已申请B.AI \$500算力额度，部分Agent推理路由至B.AI计算网络，打标"Powered by B.AI"** |
|| 商业模型？ | 交易费+Agent结算费+未来B.AI推理市场(二级路线图) |
| 下一步计划？ | 完整订单簿+多链部署+LPs流动性激励+社区争议投票(见路线图) |

---

> **最后一句**: Walking Skeleton 端到端跑通之前，没有人在"做真东西"。先用假数据跑通整条链路，再一条一条换真的。这是整个计划里最重要的一句话。
