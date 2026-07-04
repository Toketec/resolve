# RESOLVE 部署手册

> 全新环境从零部署。按章节顺序执行，每步做完再往下。
> 所有模块：数据库 (Supabase) + 智能合约 (Shasta) + 后端脚本同步 + 前端 (Vercel) + 定时任务 (Cron)

---

## 第一章：账号注册

| 服务 | 注册链接 | 用途 |
|------|---------|------|
| Vercel | vercel.com（用 GitHub 登录） | 托管网页和 API |
| Supabase | supabase.com（用 GitHub 登录） | PostgreSQL 数据库 |
| Shasta 水龙头 | shasta.trongrid.io | 领测试 TRX（合约部署费） |
| LLM API | openrouter.ai 或任意 OpenAI 兼容 | AI 推理（可选，不配也能跑） |

---

## 第二章：数据库（Supabase）

**1. 创建项目**

supabase.com → **New Project**：
- Name: `resolve`
- Password: 自己设，记下来
- Region: **Singapore**
- 等 ~2 分钟创建完成

**2. 导入表结构 + 种子数据**

左侧菜单 → **SQL Editor** → 按顺序执行以下 5 个 SQL 文件（每个跑完再跑下一个）：

| 顺序 | 文件 | 做了什么 |
|:---:|------|---------|
| 1 | `packages/db/migrations/00001_initial_schema.sql` | 创建 4 张表 + 插入英雄市场 |
| 2 | `packages/db/migrations/00002_add_agents.sql` | 创建 agents 表 + 插入 6 个 AI Agent |
| 3 | `packages/db/migrations/00003_amm_schema.sql` | 创建 trades 表 + 持仓余额模型 |
| 4 | `packages/db/migrations/00004_pool_state_sync.sql` | 创建市场池状态表 |
| 5 | `packages/db/migrations/00005_add_agent_onchain_fields.sql` | 给 agents 表加 5 个链上字段 |

执行完后，数据库中应已有：
- 7 张表：`markets`、`positions`、`agent_consensus`、`agent_votes`、`agents`、`trades`、`market_pool_states`
- 1 条英雄市场记录：slug=`btc-150k-eoy`
- 6 条 Agent 记录：bull-1 ~ neut-2

**3. 记录连接凭据**

Project Settings → **API** → 记下这 3 个值：

```
SUPABASE_URL       = https://xxxx.supabase.co
SUPABASE_ANON_KEY  = eyJhbG...
SUPABASE_SERVICE_KEY = eyJhbG...
```

---

## 第三章：智能合约（部署到 Shasta 测试网）

### 3.1 准备部署环境

在你有 Node.js 的机器上执行：

```bash
# 1. 进入合约目录
cd apps/contracts

# 2. 安装依赖
pnpm install

# 3. 编译 Solidity（生成 build/ 目录）
node scripts/compile.js
```

编译产物：
- `build/MockUSDD.json`
- `build/ResolveSettlement.json`

### 3.2 部署三个合约

```bash
# 部署全部（按顺序：MockUSDD → ResolveSettlement → AgentRegistry + 注册 6 Agent）
TRON_PRIVATE_KEY=<部署钱包私钥> node scripts/deploy.js all
```

部署顺序（后一个依赖前一个的地址）：

```
① MockUSDD（测试 USDD 代币，含水龙头）
   ↓ 地址传入构造函数
② ResolveSettlement（核心结算合约：创建市场、买卖、批量赔付、AMM）
   ↓
③ AgentRegistry（Agent 链上身份注册表） + 注册 6 个 Agent
```

部署成功后终端输出三个地址，**每个都要记下来**：

```
📋 NEXT_PUBLIC_USDD_ADDRESS="TMock..."
📋 NEXT_PUBLIC_SETTLEMENT_ADDRESS="TSettle..."
📋 NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS="TReg..."
```

> ⚠️ `deployment-output.json` 文件中**只记录了 AgentRegistry 的信息**。USDD 和 Settlement 的地址在终端输出中，部署人员需要手动从终端复制。

### 3.3 链上数据同步到数据库

```bash
SUPABASE_URL=<第二章记下的> SUPABASE_ANON_KEY=<第二章记下的> \
node scripts/sync-agents-to-db.js
```

此脚本将链上已注册的 Agent 地址写入 Supabase 的 `agents` 表（更新 tron_address、deployment_tx_hash 等字段）。

### 3.4 创建链上市场（可选）

如需测试真实的买入/卖出（非模拟模式）：

1. 用部署钱包调用 ResolveSettlement 的 `createMarket(marketId, liquidity)`
2. `marketId` 需与数据库中的 `btc-150k-eoy` 对应（bytes32 编码）
3. 调用 `approve(SETTLEMENT_ADDRESS, amount)` 授权 USDD
4. 合约自动注入流动性

> 气囊模式（`AIRBAG_ENABLED=true`）下不需要此步骤，系统走模拟流程。

---

## 第四章：前端 + API（部署到 Vercel）

### 4.1 创建 Vercel 项目

1. vercel.com → **Add New → Project**
2. 选择 GitHub 仓库 `resolve`
3. 自动检测为 Next.js 项目

### 4.2 构建设置

| 配置项 | 填什么 |
|--------|--------|
| Framework Preset | Next.js（自动） |
| Root Directory | 留空 |
| Build Command | `cd apps/web && npx next build` |
| Install Command | `pnpm install` |
| Node.js Version | **20.x** |

> 不要用 `pnpm build`（即 `pnpm -r build`），因为合约包依赖 solc 编译器，Vercel 构建环境没有。

### 4.3 设置环境变量

在 Vercel 项目 **Settings → Environment Variables** 中添加以下 13 个变量：

**① 数据库（从第二章获取）**

| 变量名 | 值 |
|--------|----|
| `SUPABASE_URL` | `https://xxxx.supabase.co` |
| `SUPABASE_ANON_KEY` | `eyJhbG...` |
| `SUPABASE_SERVICE_KEY` | `eyJhbG...` |

**② 区块链（从第三章 3.2 获取）**

| 变量名 | 值 |
|--------|----|
| `NEXT_PUBLIC_SETTLEMENT_ADDRESS` | 3.2 部署输出的结算合约地址 |
| `NEXT_PUBLIC_USDD_ADDRESS` | 3.2 部署输出的 USDD 地址 |
| `NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS` | 3.2 部署输出的 AgentRegistry 地址 |
| `NEXT_PUBLIC_TRON_FULL_HOST` | `https://api.shasta.trongrid.io` |
| `NEXT_PUBLIC_AGENT_REGISTRY_MODE` | `live`（从链上读取地址）或 `preconfig`（用预设地址） |
| `NEXT_PUBLIC_AIRBAG_ENABLED` | `true`（模拟结算，适合演示） |
| `TRON_PRIVATE_KEY` | 部署钱包私钥（仅 Production 环境，用于 settle 签名） |

**③ AI 推理（可选，不配则自动 mock）**

| 变量名 | 值 |
|--------|----|
| `OPENAI_API_KEY` | 从 LLM 提供商获取 |
| `OPENAI_BASE_URL` | 如 `https://openrouter.ai/api/v1` |
| `OPENAI_MODEL` | 如 `gpt-5.5` |

### 4.4 部署

点击 **Deploy**。首次构建约 2-5 分钟。部署后获得域名：

```
https://resolve-prediction.vercel.app
```

---

## 第五章：定时任务（Vercel Cron）

在项目根目录创建 `vercel.json`：

```json
{
  "crons": [
    {
      "path": "/api/cron/refresh-pools",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

- 提交到 main 分支后 Vercel 自动加载
- 每 5 分钟从链上读取各市场的价格/流动性，更新到 `market_pool_states` 表
- Hobby 计划免费支持 2 个 cron 任务

首次手动执行验证：

```bash
curl https://resolve-prediction.vercel.app/api/cron/refresh-pools
```

---

## 第六章：验证

### 6.1 API 端点测试

```bash
# 市场列表（应有 btc-150k-eoy）
curl https://resolve-prediction.vercel.app/api/markets

# Agent 列表（应有 6 个）
curl https://resolve-prediction.vercel.app/api/agents

# Agent 链上验证
curl https://resolve-prediction.vercel.app/api/agents/verify

# BTC 价格
curl https://resolve-prediction.vercel.app/api/price/BTC

# 定时任务
curl https://resolve-prediction.vercel.app/api/cron/refresh-pools

# K 线
curl https://resolve-prediction.vercel.app/api/price/BTC/kline
```

### 6.2 页面检查

| URL | 检查内容 |
|-----|---------|
| `/` | 首页显示市场列表 |
| `/markets` | 英雄市场 `btc-150k-eoy` 可见，状态 active |
| `/markets/btc-150k-eoy` | 市场详情页 + TradePanel 交易面板 |
| `/agents` | 6 个 Agent 卡片，各有 TRON 地址链接 |
| `/portfolio` | 持仓页面（需连接 TronLink 钱包） |
| `/create` | 创建市场页面 |

### 6.3 容错检查

| 场景 | 预期表现 |
|------|---------|
| Supabase 不可用 | 页面显示 mock 数据，不崩溃 |
| 合约地址未配置 | 气囊模式自动开启，走模拟流程 |
| 无 LLM API Key | AI 共识走 mock 兜底，不报错 |
| 未安装 TronLink | 显示"请安装 TronLink"提示 |

---

## 附：完整组件清单

| # | 组件 | 类型 | 部署位置 | 部署方式 |
|:-:|------|------|---------|---------|
| 1 | PostgreSQL 数据库（7 表） | 数据层 | Supabase | SQL Editor 执行 5 个迁移文件 |
| 2 | 种子数据（1 市场 + 6 Agent） | 数据层 | Supabase | SQL 迁移文件中自带 INSERT |
| 3 | MockUSDD 合约 | 智能合约 | Shasta 测试网 | `node scripts/deploy.js all` |
| 4 | ResolveSettlement 合约（含 AMM） | 智能合约 | Shasta 测试网 | 同上 |
| 5 | AgentRegistry 合约 | 智能合约 | Shasta 测试网 | 同上 |
| 6 | 6 Agent 链上注册 | 初始化 | Shasta 测试网 | deploy.js 自动完成 |
| 7 | 链上地址同步到 DB | 初始化 | 本地运行 | `node scripts/sync-agents-to-db.js` |
| 8 | Next.js 网页 + 16 个 API | 应用层 | Vercel | GitHub push → 自动构建 |
| 9 | i18n 地理检测中间件 | 应用层 | Vercel | 随 Next.js 部署 |
| 10 | 池状态刷新定时任务 | 定时任务 | Vercel Cron | `vercel.json` 配置 |
| 11 | AI 共识推理 | 按需调用 | Vercel API | 作为 API 路由的一部分 |
| 12 | 13 个环境变量 | 配置 | Vercel | 手动填入 |
