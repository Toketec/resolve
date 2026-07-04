# RESOLVE 部署手册（面向部署人员）

> 全新环境部署清单。按顺序执行，每步做完再往下走。
> 预计耗时：1-2 小时（含合约部署等待时间）

---

## 一、你需要准备的账号

| 服务 | 注册地址 | 用途 |
|------|---------|------|
| Vercel | vercel.com（GitHub 登录） | 托管网页 + API |
| Supabase | supabase.com（GitHub 登录） | 数据库 |
| Shasta 测试网 TRX | shasta.trongrid.io 水龙头 | 合约部署手续费 |
| LLM API | openrouter.ai / deepseek / 任意 OpenAI 兼容 | AI 推理（可选，不配也能跑） |

---

## 二、基础设施搭建

### 2.1 Supabase（数据库）

1. 创建项目：
   - supabase.com → **New Project**
   - Name: `resolve`
   - Database Password: 随便设，记下来
   - Region: **Singapore**
   - 等待约 2 分钟

2. 执行数据库初始化：
   - 左侧菜单 → **SQL Editor**
   - 新建查询 → 粘贴文件内容 → 运行
   - **按此顺序执行 5 个文件**（每个执行完再跑下一个）：

   | 顺序 | 文件路径 | 用途 |
   |:---:|----------|------|
   | 1 | `packages/db/migrations/00001_initial_schema.sql` | 建表 + 创建英雄市场 |
   | 2 | `packages/db/migrations/00002_add_agents.sql` | 建 agents 表 + 写入 6 个 AI Agent |
   | 3 | `packages/db/migrations/00003_amm_schema.sql` | 建 trades 表 + 持仓余额模型 |
   | 4 | `packages/db/migrations/00004_pool_state_sync.sql` | 建市场池状态表 |
   | 5 | `packages/db/migrations/00005_add_agent_onchain_fields.sql` | agents 表追加链上地址字段 |

3. 记录连接凭据：
   - **Project Settings → API** → 记下 3 个值：

   | 名称 | 对应环境变量 |
   |------|-------------|
   | Project URL | `SUPABASE_URL` |
   | anon public key | `SUPABASE_ANON_KEY` |
   | service_role key | `SUPABASE_SERVICE_KEY` |

### 2.2 智能合约部署（至 Shasta 测试网）

**前提**：部署钱包有 Shasta 测试 TRX（去 https://shasta.trongrid.io 领）。

1. 在本地（或 CI 机）执行：

```bash
cd apps/contracts
pnpm install
node scripts/compile.js
TRON_PRIVATE_KEY=<部署钱包私钥> node scripts/deploy.js all
```

2. 部署成功后，终端输出类似：

```
=== Deployment Summary ===
Next.js .env entries:
  NEXT_PUBLIC_USDD_ADDRESS="TXYZabc123..."
  NEXT_PUBLIC_SETTLEMENT_ADDRESS="TXYZdef456..."
  NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS="TXYZghi789..."
```

3. 记录这 3 个合约地址，后面要用。
4. 运行 Agent 链上地址同步脚本（将合约地址写入数据库）：

```bash
SUPABASE_URL=<上一步记下的值> \
SUPABASE_ANON_KEY=<上一步记下的值> \
node scripts/sync-agents-to-db.js
```

5. 创建测试市场并注入流动性（让 buy/sell 有数据可展示）：

```bash
TRON_PRIVATE_KEY=<部署钱包私钥> \
SETTLEMENT_ADDRESS=<上一步记下的 SETTLEMENT_ADDRESS> \
USDD_ADDRESS=<上一步记下的 USDD_ADDRESS> \
node scripts/create-test-market.js
```

> 注：此脚本需自行创建（项目未提供），或手动在链上调用 `createMarket()` + `approve()` + 转入 USDD。

---

## 三、应用部署（Vercel）

### 3.1 创建项目

1. vercel.com → **Add New → Project**
2. 选择 GitHub 仓库 `resolve`

### 3.2 构建设置

| 配置项 | 值 |
|--------|----|
| Framework Preset | Next.js（自动检测） |
| Root Directory | 留空 |
| Build Command | `cd apps/web && npx next build` |
| Install Command | `pnpm install` |
| Node.js Version | 20.x |

### 3.3 环境变量

在 Vercel 项目 **Settings → Environment Variables** 中添加：

| 变量名 | 值 | 说明 |
|--------|----|------|
| `SUPABASE_URL` | 从 Supabase 获取 | 数据库地址 |
| `SUPABASE_ANON_KEY` | 从 Supabase 获取 | 数据库匿名密钥 |
| `SUPABASE_SERVICE_KEY` | 从 Supabase 获取 | 数据库服务密钥（全权限） |
| `NEXT_PUBLIC_TRON_FULL_HOST` | `https://api.shasta.trongrid.io` | TRON RPC 节点地址 |
| `NEXT_PUBLIC_SETTLEMENT_ADDRESS` | 合约部署输出 | ResolveSettlement 合约地址 |
| `NEXT_PUBLIC_USDD_ADDRESS` | 合约部署输出 | USDD/MockUSDD 合约地址 |
| `NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS` | 合约部署输出 | AgentRegistry 合约地址 |
| `NEXT_PUBLIC_AGENT_REGISTRY_MODE` | `live` | Agent 地址读取模式 |
| `NEXT_PUBLIC_AIRBAG_ENABLED` | `false` | `true`=模拟结算，`false`=真实链上赔付 |
| `TRON_PRIVATE_KEY` | 你的部署钱包私钥 | 用于 settle 交易签名（仅 Production 环境） |
| `OPENAI_API_KEY` | 从 LLM 提供商获取 | AI Agent 推理（可选，不配则自动 mock） |
| `OPENAI_BASE_URL` | LLM 提供商 API 端点 | 如 `https://openrouter.ai/api/v1` |
| `OPENAI_MODEL` | 模型名 | 如 `gpt-5.5` / `deepseek-chat` |

### 3.4 部署

- 点击 **Deploy**
- 首次构建约 2-5 分钟
- 部署完成后获得域名：`https://resolve-prediction.vercel.app`

### 3.5 配置定时任务

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

提交到 main 分支后 Vercel 自动生效。

首次手动触发验证：

```bash
curl https://resolve-prediction.vercel.app/api/cron/refresh-pools
```

预期返回：`{ "refreshed": 1, "failed": 0, "total": 1, "results": [...] }`

---

## 四、部署验证清单

执行以下检查，确认系统完整可用：

### 4.1 API 端点

```bash
# 市场列表
curl https://resolve-prediction.vercel.app/api/markets
# 预期：返回 JSON 数组，包含 btc-150k-eoy

# Agent 列表
curl https://resolve-prediction.vercel.app/api/agents
# 预期：返回 6 个 Agent

# Agent 链上验证
curl https://resolve-prediction.vercel.app/api/agents/verify
# 预期：返回每个 Agent 的链上 TRON 地址

# BTC 实时价格
curl https://resolve-prediction.vercel.app/api/price/BTC
# 预期：返回含 price 字段的 JSON

# 池状态刷新（定时任务）
curl https://resolve-prediction.vercel.app/api/cron/refresh-pools
# 预期：返回刷新结果 JSON
```

### 4.2 页面

在浏览器打开以下 URL，确认页面正常渲染：

| URL | 检查内容 |
|-----|---------|
| `/` | 首页显示市场列表 |
| `/markets` | 市场列表页，英雄市场可见 |
| `/markets/btc-150k-eoy` | 市场详情 + TradePanel 交易面板 |
| `/agents` | 6 个 AI Agent 卡片，各有 TRON 地址链接 |
| `/portfolio` | 持仓页（需连接 TronLink 钱包后有数据） |
| `/create` | 创建市场页面 |

### 4.3 错误场景

| 场景 | 预期行为 |
|------|---------|
| Supabase 不可达 | 页面显示 mock 数据，不崩溃 |
| TRON 合约不可达 | 气囊模式自动开启，走模拟结算 |
| 无 LLM API Key | AI 共识走 mock 兜底，不报错 |
| 未安装 TronLink | 显示「请安装 TronLink」提示 |

---

## 五、常见问题

### Q: 部署后页面白屏 / 500 错误

A: 检查 Vercel 部署日志。最常见原因是环境变量未配全——确认 `SUPABASE_URL` 和 `SUPABASE_ANON_KEY` 正确。

### Q: buy/sell 按钮点了没反应

A: 检查 `NEXT_PUBLIC_SETTLEMENT_ADDRESS` 和 `NEXT_PUBLIC_USDD_ADDRESS` 是否已填。气囊模式下（`AIRBAG_ENABLED=true`）交易走模拟，不需要合约地址。

### Q: Agent 页面不显示 TRON 地址

A: 检查 `NEXT_PUBLIC_AGENT_REGISTRY_MODE` 是否为 `live` 或 `preconfig`。`mock` 模式下不会显示真实地址。
