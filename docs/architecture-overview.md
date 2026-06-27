# RESOLVE 系统架构设计

> **版本**: 1.0 · **锚点日期**: 2026-06-27 · **设计原则**: 轻量化 + HTX生态优先 + 零ICP备案
> **目标**: 以最简基础设施支撑可获奖的 Hero Market 端到端演示

---

## 0. 设计原则（来自团队决策）

| # | 原则 | 本架构如何满足 |
|---|------|-------------|
| 1 | **产品开发完成为目标** | 所有技术决策以「7月5日前跑通Hero Market」为唯一时间锚点 |
| 2 | **轻量化，降低复杂度** | Monorepo单仓库部署到Vercel Serverless，不需要独立后端服务器 |
| 3 | **减少非必要云支出** | 全栈 $0 基础设施成本（Vercel Hobby + 免费API + 测试网） |
| 4 | **优先HTX生态设施** | 使用 3 项 HTX 生态资源（比赛关键加分项）：HTX API + B.AI 8004 + B.AI x402 |
| 5 | **避免ICP备案** | Vercel全球CDN，不触及大陆服务器，零备案流程 |

---

## 1. 系统架构总览（三层）

```
┌──────────────────────────────────────────────────────────────────┐
│                      用户层 (Browser)                             │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  Next.js UI  │  │  TronLink    │  │  Claude API 间接调用 │   │
│  │  (Dark Mode) │  │  (浏览器钱包) │  │  (通过 B.AI/API)    │   │
│  └──────┬──────┘  └──────┬───────┘  └──────────┬───────────┘   │
└─────────┼────────────────┼──────────────────────┼───────────────┘
          │                │                      │
          ▼                ▼                      ▼
┌──────────────────────────────────────────────────────────────────┐
│                  RESOLVE 应用层 (Vercel Serverless)               │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │              Next.js 16.2.7 (web)                        │     │
│  │  ┌──────────┐  ┌──────────┐  ┌─────────────────────┐   │     │
│  │  │ Page     │  │ API      │  │ @resolve/ai         │   │     │
│  │  │ Routes   │◄─┤ Routes   │◄─┤ (AI Oracle Logic)   │   │     │
│  │  │ (UI)     │  │ (/api/*) │  │ consensus + prompts │   │     │
│  │  └──────────┘  └──────────┘  └─────────────────────┘   │     │
│  │                      │               │                  │     │
│  │               ┌──────┴──────┐  ┌─────┴──────┐          │     │
│  │               │ @resolve/   │  │ Data Layer  │          │     │
│  │               │ shared      │  │ (JSON/内存)  │          │     │
│  │               │ (Types)     │  │            │          │     │
│  │               └─────────────┘  └────────────┘          │     │
│  └─────────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────────┘
          │                │                      │
          ▼                ▼                      ▼
┌──────────────────────────────────────────────────────────────────┐
│                HTX 生态 & 第三方基础设施层                         │
│                                                                   │
│  ┌──────────────┐  ┌────────────┐  ┌──────────────────┐         │
│  │ HTX 交易所   │  │ B.AI       │  │ Claude API        │         │
│  │ 公开API      │  │ 8004 + x402│  │ (DeepSeek备选)    │         │
│  │ 价格数据     │  │ Agent身份/  │  │ AI推理引擎        │         │
│  │              │  │ 支付       │  │                  │         │
│  └──────────────┘  └────────────┘  └──────────────────┘         │
│                                                                   │
│  ┌──────────────┐  ┌────────────┐  ┌──────────────────┐         │
│  │ TRON Shasta  │  │ Trongrid   │  │ Vercel Edge      │         │
│  │ 测试网       │  │ 公共节点    │  │ 全球CDN + SSL    │         │
│  │ 合约+结算    │  │ API服务    │  │ 托管             │         │
│  └──────────────┘  └────────────┘  └──────────────────┘         │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. 组件明细

### 2.1 前端层（apps/web — Next.js 16.2.7）

| 组件 | 技术 | 说明 |
|------|------|------|
| 路由 | Next.js App Router | 7+页面（首页、市场列表、市场详情、交易面板、Agent裁决视图、用户管理） |
| UI框架 | Tailwind CSS + Radix UI | 暗黑主题，深色渐变背景 |
| 动画 | Framer Motion | ConsensusMeter、Agent投票浮现、结果揭示动画 |
| 钱包 | TronLink | 使用 `@tronweb3/tronwallet-adapter` |
| 图表 | Recharts | 价格走势、投票分布 |
| 状态管理 | React useState/Context | 轻量化，不需要Redux |

**部署**: Vercel Serverless (Hobby 免费计划)
**域名策略**: 使用 `resolve-prediction.vercel.app`（默认），或购买 `.xyz` 域名指向 Vercel（可选，$10-15/年）

### 2.2 API 层（apps/web API Routes）

所有 API 以 Next.js API Routes 实现，运行在 Vercel Serverless 上：

| Route | 功能 | 对接方 | 状态 |
|-------|------|--------|:----:|
| `POST /api/markets/:slug/resolve` | 触发AI解析 | @resolve/ai → Claude API | 需开发 |
| `POST /api/buy` | 买入仓位 | TronLink签名 → TRON测试网 | 需开发 |
| `POST /api/settle` | 结算盈利 | TRON合约调用 | 需开发 |
| `GET /api/price/:symbol` | 价格数据 | HTX公开API缓存 | 需开发 |
| `GET /api/agent/identity` | Agent 8004身份 | B.AI 8004 Registry | 需开发 |

**无需独立后端服务** — 全部以 Serverless Function 方式运行。

### 2.3 AI Oracle 层（packages/ai）

| 组件 | 说明 |
|------|------|
| Agent 推理引擎 | 3个Agent独立调用 Claude API，返回 `{outcome, confidence, evidence}` |
| 证据收集器 | 从HTX API + 预精选证据集收集数据，喂给对应Agent |
| 共识引擎 | 加权投票 → 加权共识。阈值 ≥ 0.65 |
| 确定性护栏 | 英雄市场预演确保固定证据集下输出稳定 |

**LLM Provider**: Anthropic Claude API（主）| DeepSeek API（备，通过OpenRouter代理）

### 2.4 链上层

| 组件 | 技术 | 说明 |
|------|------|------|
| 结算合约 | Solidity + TVM | 部署到 TRON Shasta 测试网，预注资USDD |
| 钱包连接 | TronLink Extension | 用户通过浏览器扩展连接 |
| 节点服务 | Trongrid | 免费公共节点，无需自建节点 |
| Agent身份 | B.AI 8004 Protocol | Agent在TRON上的链上身份注册 |
| Agent支付 | B.AI x402 Protocol | Agent自主支付结算费 |

**为什么选 TRON 而非其他链**:
- 比赛明确要求 HTX 生态 — TRON 是 HTX 底链
- Shasta 测试网免费且稳定
- B.AI 8004/x402 是比赛主办方核心生态资源
- 低手续费、高吞吐（适合 Demo）

### 2.5 数据层

| 数据 | 存储方式 | 说明 |
|------|---------|------|
| 市场价格 | 内存缓存 | 从HTX API获取，缓存5分钟 |
| 用户仓位 | JSON文件 | 单用户，存储在 `/data/` 目录 |
| Agent推理结果 | 内存 | 单次推理结果，结算后清除 |
| 共识历史 | JSON文件 | 记录每次resolve结果供UI展示 |

**为何不用数据库**:
- 黑客松场景只有一个英雄市场和一个用户（演示者）
- JSON文件+内存完全够用，且零运维成本
- 避免引入PostgreSQL/Supabase等额外依赖

---

## 3. HTX生态资源使用明细（比赛加分关键）

比赛明确要求「建议使用至少1项主办方生态资源」。我们使用 **3项**：

### 3.1 🟢 HTX 公开 API — 价格数据

**用途**: Agent 证据源的实时价格数据
**接口**: `GET https://api.htx.com/market/detail/merged?symbol=btcusdt`
**免费**: ✅ 无需 API Key，公开市场数据
**集成点**: `GET /api/price/:symbol` 作为代理，前端和Agent消费

### 3.2 🟢 B.AI 8004 Protocol — Agent 链上身份

**用途**: 在 TRON 上注册 AI Agent 的身份，获得 8004 ID
**意义**: 让评委看到「Agent做了链上身份注册」— 这是比赛主办方 B.AI 的核心产品
**对齐**: 直接对应评分维度「AI/Web3应用程度」和「生态契合度」
**实现**: 调用 B.AI 的注册 API 或直接在 Tronscan 8004 注册

### 3.3 🟢 B.AI x402 Protocol — Agent 自主支付

**用途**: resolve() 过程中触发一笔 x402 微支付，展示 Agent 自主支付结算费
**意义**: 演示 AI Agent 的经济自主性 — 这是比赛「AI Agent 经济」主题的核心展示
**对齐**: 直接证明 AI×Web3 融合的深度

### 3.4 🟢 TRON Shasta 测试网 — 结算层

**用途**: 部署预测市场结算合约，用户买入/结算都在 Shasta 测试网完成
**意义**: 整个 Web3 部分的基石

---

## 4. 部署拓扑

```
用户浏览器
    │
    ▼
┌──────────────────────┐
│  Vercel Edge Network  │  ← 全球CDN，自动HTTPS，零ICP备案
│  (cdn.vercel.com)     │
├──────────────────────┤
│  Vercel Serverless    │  ← 运行 Next.js App + API Routes
│  (us-east-1 / iad1)   │     Serverless Functions
├──────────────────────┤
│  Vercel Static Assets │  ← JS/CSS/图片静态资源
│  (Vercel Object Store)│
└──────────────────────┘
    │
    ├──→ HTX API (htx.com)         ← 价格数据
    ├──→ B.AI API (b.ai)           ← 8004 + x402
    ├──→ Trongrid (api.trongrid.io) ← TRON节点
    ├──→ Claude API (api.anthropic.com) ← AI推理
    └──→ TRON Shasta Testnet       ← 智能合约
```

---

## 5. 基础设施成本分析

| 服务项 | 方案 | 成本 |
|-------|------|:----:|
| 前端托管 | Vercel Hobby Plan | $0 |
| 域名 | vercel.app 子域名（默认） | $0 |
| 区块链节点 | Trongrid 免费公共节点 | $0 |
| 价格数据 | HTX 公开API | $0 |
| Agent身份 | B.AI 8004 免费注册 | $0 |
| AI推理 | Claude API 按用量（预计$20-50） | $20-50 |
| SSL证书 | Vercel 自动 Let's Encrypt | $0 |
| CDN | Vercel Edge Network | $0 |
| 数据库 | JSON文件（无DB） | $0 |
| **总计** | | **≈ $20-50**（仅AI推理费用）|

**对比阿里云方案**: ECS 最低配 ¥500+/月 + 域名备案 10-20工作日 + CDN ¥100+/月 + RDS ¥100+/月 = ❌ 成本高+备案慢

---

## 6. 安全性考虑

| 风险 | 缓解措施 |
|------|---------|
| Claude API Key 泄露 | 存到 Vercel Environment Variables，不进入代码库 |
| TRON 私钥泄露 | 仅测试网私钥，存 `.env`，`.gitignore` 已配置 |
| HTX API 请求限制 | 缓存价格数据（5分钟TTL），减少调用频率 |
| 跨域问题 | Next.js API Routes 同域代理，无CORS问题 |
| XSS | Next.js 默认转义，CodeQL 扫描 |

---

## 7. 架构决策记录（ADR）

### ADR-001: 选择 Vercel 而非阿里云

**选择**: Vercel Hobby
**理由**:
1. 零成本（vs 阿里云最低 ¥500+/月）
2. 无需 ICP 备案（vs 阿里云需10-20工作日）
3. Next.js 原生支持，CI/CD 零配置
4. 全球 CDN 加速，Demo Day 评委全球分布

### ADR-002: Serverless API Routes 而非独立后端

**选择**: Next.js API Routes（Monorepo内）
**理由**:
1. 零运维 — Vercel 自动扩缩容
2. 无跨域 — 前端和后端同域名
3. 部署简单 — `git push` 即部署
4. 预热时间 < 1秒（Edge+Node.js混合）

### ADR-003: 使用 HTX API + B.AI 8004 + B.AI x402 三项生态资源

**选择**: 三项全用
**理由**:
1. 比赛明确要求「至少1项」— 我们用 3 项 ➔ 加分
2. 每项对应评委看到的不同维度：
   - HTX API → 生态契合度
   - 8004 → AI×Web3 融合深度
   - x402 → AI Agent 经济自主性
3. 三者均为免费/低成本

### ADR-004: JSON文件存储替代数据库

**选择**: JSON + 内存
**理由**:
1. 单用户演示场景
2. Serverless Function 不需要持久化DB
3. 零运维、零成本
4. 如需扩展可迁到 SQLite（写入 `tmp/` 目录）

---

## 8. 模块依赖图

```
apps/web (Next.js 16)
  ├── @resolve/shared (types)
  ├── @resolve/ai (oracle)
  │     ├── anthropic-sdk (or openai)
  │     ├── @resolve/shared
  │     └── ...evidence data
  ├── @tronweb3/tronwallet-adapter
  ├── @tronweb3/tronweb
  ├── @bankofai/agent-wallet (8004 + x402)
  ├── tailwindcss
  ├── framer-motion
  └── recharts

apps/contracts (Solidity)
  ├── @openzeppelin/contracts
  └── tronbox (deploy tool)

packages/shared
  └── ...no external deps (pure types)

packages/ai
  ├── @resolve/shared
  └── ...AI provider SDK
```

---

## 9. 与比赛评分维度的映射

| 评分维度（五维） | 架构上如何支撑 | 对应组件 |
|------------|------------|---------|
| **1. 技术创新性** | 多Agent独立推理 + 加权共识 + 8004身份 + x402支付 — 赛道内独一份 | 3-Agent系统 + B.AI集成 |
| **2. 产品完成度** | Walking Skeleton 优先 + Mock→真实逐步替换 + 完整UX | 前端 + API Routes + 集成计划 |
| **3. 商业与生态潜力** | 预测市场 × AI Agent经济叙事 + 3项HTX生态资源使用 | HTX API + B.AI + TRON |
| **4. AI/Web3应用程度** | 真实AI推理(非封装) + 链上结算 + Agent链上身份 | AI Oracle + TRON合约 + 8004 |
| **5. 展示表达能力** | 45秒英雄镜头 + UI动画 + ConsensusMeter可视化 | Framer Motion + 定制UI组件 |

**特别奖「Best AI+Web3 Fusion」($1,500)**: 本架构天然对齐 — AI推理真实 + 链上结算 + Agent自主身份/支付 = 真正的 Fusion

---

## 10. 与原有计划对比

| 方面 | 原计划 | 新架构（变更） |
|------|-------|------------|
| 部署 | Vercel（已有） | ✅ 不变，明确为唯一部署平台 |
| 后端 | 独立API/后端 | ✅ 简化为Next.js API Routes |
| 数据库 | 未明确 | ✅ 明确为JSON+内存，零DB |
| HTX生态 | 仅HTX价格数据 | ✅ 扩展为HTX API + B.AI 8004 + B.AI x402 |
| Agent身份 | 8004注册（A-07） | ✅ 提升为架构级集成点 |
| 域名 | 默认vercel.app | ✅ 不加自定义域名，省成本 |
| 阿里云 | 未明确 | ❌ 放弃，全栈Vercel |
| ICP备案 | 未讨论 | ✅ 明确避免 — Vercel全球CDN |
| 基础设施成本 | 未计算 | ✅ 明确为 $20-50（仅AI推理）|

---

> **一句话总结**: 全栈部署在 Vercel Serverless 上，零基础设施成本，使用3项HTX生态资源（HTX API + B.AI 8004 + B.AI x402），不做任何需要ICP备案的部署。核心哲学：**用一个 git push 就能上线整个产品。**
