# RESOLVE 项目 — Vercel 部署计划

> 版本: 1.0 · 日期: 2026-07-04
> 作者: 公孙离
> 用途: 手工执行的 Vercel 部署操作手册

---

## 目录

1. [架构总览](#1-架构总览)
2. [前置条件](#2-前置条件)
3. [事前修复（代码改动，必须做）](#3-事前修复代码改动必须做)
4. [Step 1 — Supabase（数据库）](#step-1--supabase数据库)
5. [Step 2 — Vercel（前端 + API）](#step-2--vercel前端--api)
6. [Step 3 — 环境变量完整清单](#step-3--环境变量完整清单)
7. [Step 4 — 智能合约部署验证](#step-4--智能合约部署验证)
8. [Step 5 — 定时任务配置](#step-5--定时任务配置)
9. [Step 6 — 链上数据初始化](#step-6--链上数据初始化)
10. [Step 7 — 部署验证清单](#step-7--部署验证清单)

---

## 1. 架构总览

```
┌─────────────────────────────────────────────────────────┐
│                    Vercel 云平台                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │          Next.js 16 (Serverless Functions)       │   │
│  │                                                    │   │
│  │  ┌─────────────┐  ┌────────────┐  ┌────────────┐  │   │
│  │  │ 前端页面     │  │ API Routes │  │ Middleware  │  │   │
│  │  │ (SSR)       │  │ (16 个)    │  │ (i18n geo) │  │   │
│  │  └─────────────┘  └─────┬──────┘  └────────────┘  │   │
│  └──────────────────────────┼───────────────────────────┘   │
│                             │                              │
└─────────────────────────────┼──────────────────────────────┘
                              │
           ┌──────────────────┼──────────────────┐
           ▼                  ▼                  ▼
  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
  │  Supabase    │   │  Shasta      │   │  OpenAI 兼容 │
  │ PostgreSQL  │   │  TRON 测试网 │   │  LLM API    │
  │ (数据库)     │   │ (智能合约)    │   │ (AI推理)     │
  └──────────────┘   └──────────────┘   └──────────────┘
```

### 部署到哪

| 组件 | 部署位置 | 费用 | 说明 |
|------|---------|------|------|
| **Web 前端 + API** | Vercel Hobby | **$0/月** | Next.js 16，Serverless Functions |
| **数据库** | Supabase Free | **$0/月** | 500MB PostgreSQL |
| **智能合约** | Shasta 测试网 | **$0** | 已部署（测试 TRX 免费领取） |
| **AI 推理** | relay.zijo.io | **≈$0** | OpenAI 兼容端点，模拟 6 Agent 推理 |
| **Cron 定时任务** | Vercel Cron | **$0** | Hobby 计划支持 2 个免费 cron |

### ⚠️ 已知限制

- **Vercel Hobby 的函数超时上限为 60 秒**，但 `/api/markets/[slug]/resolve` 设置了 120 秒（6 个 Agent 并行 LLM 调用耗时 ~30s）。Hobby 下此端点可能超时。解决：升级 Pro（\$20/月，300s 超时），或用气囊模式下 mock 数据。
- **Vercel 被 GFW 阻断**，中国评委访问需要 VPN 或本地演示。

---

## 2. 前置条件

### 你需要准备的账号

| 服务 | 注册链接 | 费用 | 用途 |
|------|---------|------|------|
| **Vercel** | vercel.com 用 GitHub 登录 | **$0** | 托管 Next.js |
| **Supabase** | supabase.com 用 GitHub 登录 | **$0** | PostgreSQL 数据库 |
| **GitHub** | 已有 | **$0** | 源码仓库 |
| **Shasta 测试网 TRX** | shasta.trongrid.io 水龙头 | **$0** | 合约部署 + 测试交易 |

### 手头需有的信息

- [ ] `TRON_PRIVATE_KEY` — 合约部署钱包的私钥（用于 settle 签名）
- [ ] Shasta 钱包地址 `TLVn5Sa9Y3fJjiGZwkjkiF1dmR1XQwwgcQ`
- [ ] AgentRegistry 合约地址 `TE1EvYNCHks9WUJsj8LmwLZw6fZSnPErz5`
- [ ] ResolveSettlement 合约地址（**尚未部署**，需你部署）
- [ ] MockUSDD / USDD 合约地址（**尚未部署**）
- [ ] 6 个 Agent 已注册地址（目前在 `deployment-output.json` 中）
- [ ] OpenAI 兼容 API Key（如 relay.zijo.io / B.AI）

---

## 3. 事前修复（代码改动，必须做）

以下 3 个问题必须在 Vercel 部署之前修复，否则构建或运行会失败。

### 🔴 修复 1：@resolve/db 缺少 build 脚本

**问题**: `packages/db/package.json` 没有 `build` 命令。`pnpm -r build` 执行 `build` 时对所有包并行运行，缺少此命令会报错退出。

**修复**: 编辑 `packages/db/package.json`，在 `scripts` 里添加：

```json
{
  "scripts": {
    "build": "tsc",
    "typecheck": "tsc --noEmit"
  }
}
```

并确保 `tsconfig.json` 的 `compilerOptions.outDir` 存在（设为 `./dist`），添加 `include: ["./src"]`。

<details>
<summary>点开查看完整修复脚本</summary>

```json
{
  "name": "@resolve/db",
  "version": "0.1.0",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.49.4"
  },
  "devDependencies": {
    "@types/node": "^20",
    "typescript": "^5"
  }
}
```
</details>

### 🔴 修复 2：proxy.ts 重命名为 middleware.ts

**问题**: 文件名为 `apps/web/proxy.ts`，但 Next.js 只识别 `middleware.ts`（必须放在 `app/` 或根目录）。当前文件不会被加载，导致 i18n geo 检测不生效。

**修复**: 将 `apps/web/proxy.ts` **重命名**为 `apps/web/middleware.ts`，并**默认导出** proxy 函数：

```typescript
// apps/web/middleware.ts
import { NextResponse, type NextRequest } from "next/server";
import { COUNTRY_COOKIE } from "@/lib/i18n/server";

export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const country = req.headers.get("x-vercel-ip-country");
  if (country && req.cookies.get(COUNTRY_COOKIE)?.value !== country) {
    res.cookies.set(COUNTRY_COOKIE, country, {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
```

然后删除旧的 `apps/web/proxy.ts`。

### 🔴 修复 3：resolve API 端点超时设置

**问题**: `/api/markets/[slug]/resolve` 设置了 `maxDuration = 120`（120 秒），但 Vercel Hobby 最大函数超时为 **60 秒**。部署后此端点会超时报错（504）。

**两种方案**：

| 方案 | 操作 | 代价 |
|:----|------|:----:|
| **A: 严格模式** | 保持 120s，升级 Vercel Pro（$20/月） | ✅ 正常运行，$20/月 |
| **B: 降级模式** | 降低到 30s，无 OPENAI_API_KEY 时自动 mock 兜底 | ✅ $0，但 AI 推理走 mock（适合比赛） |

**推荐方案 B**（比赛阶段用 mock，赛后换 Pro）：

编辑 `apps/web/app/api/markets/[slug]/resolve/route.ts`：

```typescript
export const maxDuration = 30;
```

注意：`@resolve/ai` 的 `resolveMarket()` 函数内部已有 mock 兜底逻辑——无 `OPENAI_API_KEY` 或 API 调用失败时，会自动按 Agent 角色偏向输出确定性 mock 答案。

### 🟡 修复 4（可选）：添加 runtime = "nodejs"

**问题**: 所有 API 路由未设置 `runtime`，默认可能使用 Edge Runtime。`tronweb` 和 `@supabase/supabase-js` 依赖 Node.js 内置模块。

**修复**: 在以下使用 `tronweb` 或 `supabase` 的路由中添加 `export const runtime = "nodejs"`。

需要添加的路由：

| 文件 | 原因 |
|------|------|
| `apps/web/app/api/settle/route.ts` | 使用 tronweb 签名交易 |
| `apps/web/app/api/buy/route.ts` | 使用 Supabase |
| `apps/web/app/api/sell/route.ts` | 使用 Supabase |
| `apps/web/app/api/cron/refresh-pools/route.ts` | 使用 Supabase + tronweb |
| `apps/web/app/api/markets/[slug]/resolve/route.ts` | 使用 Supabase + openai |
| `apps/web/app/api/agents/verify/route.ts` | 使用 tronweb |

每个文件添加一行（在 `dynamic` 旁边）：

```typescript
export const runtime = "nodejs";
```

---

## Step 1 — Supabase（数据库）

### 1.1 创建 Supabase 项目

1. 打开 supabase.com → 用 GitHub 登录
2. 点击 **New Project**
3. 填写：
   - **Name**: `resolve`
   - **Database Password**: 设一个强密码（记下来）
   - **Region**: 选 **Singapore**（亚太，离 Vercel 和 Shasta 都近）
   - **Pricing Plan**: Free
4. 等待 ~2 分钟创建完成

### 1.2 获取连接凭据

项目创建后，进入 **Project Settings → API**：

```
Project URL: https://xxxx.supabase.co     ← SUPABASE_URL
anon public key: eyJhbGciOi...             ← SUPABASE_ANON_KEY
service_role key: eyJhbGciOi...            ← SUPABASE_SERVICE_KEY（仅服务端）
```

将这 3 个值记下来，后续填入 Vercel 环境变量。

### 1.3 执行数据库迁移

打开 Supabase Dashboard → **SQL Editor**，**按顺序**执行以下 SQL 文件：

| 顺序 | 文件 | 说明 |
|:---:|------|------|
| 1 | `packages/db/migrations/00001_initial_schema.sql` | 基础表 + 英雄市场种子 |
| 2 | `packages/db/migrations/00002_add_agents.sql` | agents 表 + 6 个 Agent 种子 |
| 3 | `packages/db/migrations/00003_amm_schema.sql` | trades 表 + positions 余额模型 |
| 4 | `packages/db/migrations/00004_pool_state_sync.sql` | market_pool_states 表 |
| 5 | `packages/db/migrations/00005_add_agent_onchain_fields.sql` | agents 表追加链上字段 |

**⚠️ 重要**: 必须严格按顺序执行！每个 migration 执行完毕后检查是否有报错，再执行下一个。

### 1.4 验证种子数据

执行完 5 个 migration 后，在 SQL Editor 运行验证：

```sql
-- 验证市场
SELECT slug, question, status FROM markets;
-- 预期: btc-150k-eoy | Will Bitcoin close above $150,000 by Dec 31, 2026? | active

-- 验证 Agent
SELECT agent_id, callsign, name, stance FROM agents ORDER BY sort_order;
-- 预期: 6 行 (bull-1~neut-2)

-- 验证表数量
SELECT table_name FROM information_schema.tables 
WHERE table_schema='public' AND table_type='BASE TABLE';
-- 预期: markets, positions, agent_consensus, agent_votes, agents, trades, market_pool_states
```

---

## Step 2 — Vercel（前端 + API）

### 2.1 导入项目

1. 打开 vercel.com → 用 GitHub 登录
2. 点击 **Add New → Project**
3. 搜索并选择 `resolve` 仓库
4. Vercel 会自动检测为 Next.js 项目

### 2.2 配置构建设置

**Framework Preset**: Next.js（自动检测）

**Root Directory**: （留空，使用仓库根目录）

**Build Command**:
```bash
cd apps/web && npx next build
```

> ⚠️ 不要用 `pnpm build`（即 `pnpm -r build`），因为 `apps/contracts` 目录的 build 依赖 solc（TRON 编译器），在 Vercel 构建环境中没有。我们只构建 web 包。

**Install Command**:
```bash
pnpm install
```

**Output Directory**: `.next`（Next.js 默认，自动检测）

### 2.3 Node.js 版本

在 Vercel 项目 **Settings → General → Node.js Version** 中，选择 **20.x**（推荐 20.x）。

### 2.4 配置环境变量

在 Vercel 项目 **Settings → Environment Variables** 中，添加以下变量（详见 Step 3 完整清单）。

可以先在 Development/Preview/Production 三个环境都配同样的值（除了 `TRON_PRIVATE_KEY` 建议仅 Production）。

### 2.5 部署

回到 **Deployments** 页面，点击 **Deploy**。

首次构建耗时约 2-5 分钟。部署完成后，Vercel 会自动生成 `xxx.vercel.app` 域名。

### 2.6 pnpm 版本锁定

确保 Vercel 使用正确的 pnpm 版本。在根目录 `package.json` 中已有 `packageManager` 字段则自动生效，否则在 Vercel 的 Settings → General 中设置：

```
ENABLE_PNPM: 1
```

（Vercel 会自动检测 pnpm-workspace.yaml）

---

## Step 3 — 环境变量完整清单

### 3.1 NEXT_PUBLIC_（浏览器端可见，必须配）

| 变量 | 示例值 | 来源 | 必填 |
|------|--------|------|:----:|
| `NEXT_PUBLIC_SETTLEMENT_ADDRESS` | `TXYZ...`（ResolveSettlement 合约地址） | 部署合约后获得 | ✅ |
| `NEXT_PUBLIC_USDD_ADDRESS` | `TXYZ...`（USDD/MockUSDD 地址） | 部署 USDD 后获得 | ✅ |
| `NEXT_PUBLIC_TRON_FULL_HOST` | `https://api.shasta.trongrid.io` | 固定值 | ✅ |
| `NEXT_PUBLIC_AIRBAG_ENABLED` | `true` | 默认 true | ❌ |
| `NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS` | `TE1EvYNCHks9WUJsj8LmwLZw6fZSnPErz5` | 已部署 | ✅（live 模式） |
| `NEXT_PUBLIC_AGENT_REGISTRY_MODE` | `preconfig` | 选 preconfig 或 mock | ✅ |

### 3.2 服务端私有（仅 API Routes 读取）

| 变量 | 示例值 | 来源 | 必填 |
|------|--------|------|:----:|
| `SUPABASE_URL` | `https://xxxx.supabase.co` | Supabase 项目 | ✅ |
| `SUPABASE_ANON_KEY` | `eyJhbGciOi...` | Supabase 项目 | ✅ |
| `SUPABASE_SERVICE_KEY` | `eyJhbGciOi...` | Supabase 项目 | ✅ |
| `TRON_PRIVATE_KEY` | `0x...`（owner 私钥） | 你的钱包 | ✅ |
| `OPENAI_API_KEY` | `sk-...` | relay / B.AI | ❌（无 key 走 mock） |
| `OPENAI_BASE_URL` | `https://relay.zijo.io/v1` | 服务商提供 | ❌ |
| `OPENAI_MODEL` | `gpt-5.5` | 选填 | ❌ |

### 3.3 当前已部署合约地址（可直接用）

| 合约 | 地址 | 状态 |
|------|------|:----:|
| **AgentRegistry** | `TE1EvYNCHks9WUJsj8LmwLZw6fZSnPErz5` | ✅ 已部署 |
| **ResolveSettlement** | **待部署** | ❌ **需补** |
| **MonitorUSDD** | **待部署** | ❌ **需补** |

### 3.4 实际配置建议

比赛/演示阶段推荐用 **气囊模式 + preconfig**，无需部署 ResolveSettlement 即可展示：

```
NEXT_PUBLIC_AIRBAG_ENABLED=true
NEXT_PUBLIC_AGENT_REGISTRY_MODE=preconfig
```

这样所有结算走模拟流程，Agent 地址走硬编码——页面展示完整，不依赖链上真实合约调用。

如果想展示真实链上交互，再部署 ResolveSettlement 并关闭气囊。

---

## Step 4 — 智能合约部署验证

### 4.1 当前已部署

| 合约 | 地址 | 说明 |
|------|------|------|
| AgentRegistry | `TE1EvYNCHks9WUJsj8LmwLZw6fZSnPErz5` | 存储 6 个 Agent 的链上地址 |
| 6 个 Agent 注册 | 全部指向 `TLVn5Sa9Y3fJjiGZwkjkiF1dmR1XQwwgcQ` | 已注册 |

### 4.2 需要补部署（可选，不阻塞 Demo）

如果需要真实链上买/卖/结算流程：

**部署 ResolveSettlement**（含 AMM、buyShares、sellShares、settleBatch）：

```bash
cd apps/contracts

# 1. 安装依赖
pnpm install

# 2. 编译合约
node scripts/compile.js

# 3. 部署 MockUSDD + ResolveSettlement + AgentRegistry
TRON_PRIVATE_KEY=<你的私钥> node scripts/deploy.js all
```

部署成功后输出：
```
=== Deployment Summary ===
Next.js .env entries:
  NEXT_PUBLIC_USDD_ADDRESS="<地址>"
  NEXT_PUBLIC_SETTLEMENT_ADDRESS="<地址>"
  NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS="<地址>"
```

### 4.3 同步 Agent 链上地址到数据库

```bash
SUPABASE_URL=<url> SUPABASE_ANON_KEY=<key> node scripts/sync-agents-to-db.js
```

此脚本读取 `deployment-output.json`，通过 Supabase REST API 更新 agents 表的链上字段。

---

## Step 5 — 定时任务配置

### 5.1 定时任务清单

| 端点 | 频率 | 用途 | 依赖 |
|------|------|------|------|
| `GET /api/cron/refresh-pools` | 每 5 分钟 | 从链上刷新各市场的价格/流动性 | 需部署 ResolveSettlement |

### 5.2 Vercel Cron Jobs 配置

Vercel 支持通过 `cron.json` 或 `vercel.json` 配置定时任务。

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

**注意**：
- Vercel Hobby 计划**支持 Cron Jobs**（免费 2 个）
- 每次 Cron 调用会触发一次 Serverless Function 执行
- 如果 `refresh-pools` 没有合约地址，会自动跳过（不报错）

### 5.3 手动触发

部署后可以手动触发验证：

```bash
# 替换为你的 Vercel 域名
curl https://resolve-prediction.vercel.app/api/cron/refresh-pools
```

---

## Step 6 — 链上数据初始化

### 6.1 创建测试市场（链上）

如果是真实模式，需要一个链上市场才能展示 buy/sell：

1. Owner 调用 `createMarket(slug, question, description, expiresAt)` 在合约上创建市场
2. 给合约 approve + transfer USDD 作为流动性
3. Supabase 中同步插入对应行（`NEXT_PUBLIC_AIRBAG_ENABLED=false` 后自动同步）

气囊模式下不需要此步骤，数据直接来自 mock/DB。

### 6.2 初始化 Pool State

```bash
curl https://resolve-prediction.vercel.app/api/cron/refresh-pools
```

此端点会遍历所有 active 市场，从链上读取价格/流动性并存入 `market_pool_states` 表。
气囊模式下返回空结果。

---

## Step 7 — 部署验证清单

### 7.1 构建验证（在本地先跑）

```bash
# 先修复 @resolve/db 的 build 脚本
pnpm install
cd apps/web && npx next build
```

确认构建通过无报错。

### 7.2 部署后验证（在浏览器打开）

| # | 检查项 | 预期结果 |
|:-:|--------|---------|
| 1 | `GET /` 首页 | ⚡ 市场卡片列表 + Agent 页面链接正常 |
| 2 | `GET /markets` 市场页 | 英雄市场 `btc-150k-eoy` 显示为 active |
| 3 | `GET /markets/btc-150k-eoy` 详情 | 市场详情、TradePanel 加载正常 |
| 4 | `GET /agents` Agent 页 | 6 个 Agent 卡片，显示 BULL/BEAR/NEUT |
| 5 | `GET /api/markets` | 返回 JSON 市场列表 |
| 6 | `GET /api/agents` | 返回 6 个 Agent JSON |
| 7 | `GET /api/agents/verify` | 返回链上 Agent 注册地址 |
| 8 | `GET /api/price/BTC` | 返回 BTC 实时价格 |
| 9 | `GET /api/cron/refresh-pools` | 返回刷新结果（气囊模式返回空） |
| 10 | 切换语言 | 语言选择器中/英文切换正常 |

### 7.3 错误恢复检查

| # | 场景 | 预期行为 |
|:-:|------|----------|
| E1 | Supabase 不可用 | 页面不崩溃，显示 mock 数据（气囊保护） |
| E2 | 打开 TronLink | 自动检测并显示连接按钮 |
| E3 | LLM API Key 未配 | AI 共识走 mock 兜底，不报错 |
| E4 | 合约地址未配 | 气囊模式自动开启 |

### 7.4 中国访问测试

如果部署后需要测试中国可用性：

```bash
# 从国内服务器或代理测试
curl -s -o /dev/null -w "%{http_code} %{time_total}s" https://resolve-prediction.vercel.app
```

- 如果返回 `000` 或超时 → 被 GFW 阻断。建议比赛时直接用本地演示。
- 如果返回 `200` → 可以访问，但后续可能会被加入屏蔽列表。

---

## 附：部署流程图

```
┌─────────────────────────┐
│  事前修复（3 个代码改动）│
│ ① @resolve/db + build   │
│ ② proxy → middleware    │
│ ③ maxDuration 30s       │
└──────────┬──────────────┘
           ▼
┌─────────────────────────┐
│  Step 1: Supabase       │  ~10 min
│  创建项目 → 执行 5 个     │
│  migration → 验证       │
└──────────┬──────────────┘
           ▼
┌─────────────────────────┐
│  Step 2: Vercel         │  ~5 min
│  导入 GitHub 仓库 →      │
│  配置构建/环境变量 → 部署  │
└──────────┬──────────────┘
           ▼
┌─────────────────────────┐
│  Step 3: 环境变量        │  ~3 min
│  填入所有 ENV            │
│  重新部署                │
└──────────┬──────────────┘
           ▼
┌─────────────────────────┐
│  Step 4: 合约部署验证    │  ~10 min（可选）
│  补部署 ResolveSettlement│
│  → sync-agents-to-db    │
└──────────┬──────────────┘
           ▼
┌─────────────────────────┐
│  Step 5: Cron Jobs      │  ~2 min
│  配 vercel.json         │
│  手动触发验证            │
└──────────┬──────────────┘
           ▼
┌─────────────────────────┐
│  Step 6: 验证            │  ~10 min
│  全链路跑一遍             │
│  Check! ✅               │
└─────────────────────────┘
```

**预计总耗时**: 30-40 分钟（不含合约补部署）

---

## 附录：文件引用索引

| 文件 | 用途 |
|------|------|
| `apps/web/package.json` | 前端依赖和脚本 |
| `apps/web/next.config.ts` | Next.js 配置 |
| `apps/web/proxy.ts` | **需重命名** → `middleware.ts` |
| `apps/web/.env.example` | 环境变量模板（前端） |
| `packages/db/package.json` | **需添加** `build: "tsc"` |
| `packages/db/migrations/00001_*.sql` ~ `00005_*.sql` | 按顺序执行 |
| `apps/contracts/scripts/deploy.js` | 合约部署脚本 |
| `apps/contracts/scripts/sync-agents-to-db.js` | Agent 链上→DB 同步 |
| `apps/contracts/deployment-output.json` | 当前已部署状态 |
| `apps/web/app/api/cron/refresh-pools/route.ts` | 定时任务端点 |
| `apps/web/lib/constants.ts` | 所有常量和 ABI |
| `apps/web/lib/contract/settlement.ts` | 合约交互（气囊 + 真实） |
| `packages/ai/src/llm.ts` | AI 推理层（含 mock 兜底） |
