# RESOLVE Vercel 部署手册

> 部署流程，按顺序执行。预计 30 分钟搞定。

---

## 第一步：事前修复代码

改 3 处代码，不然 Vercel 构建会失败：

1. **`packages/db/package.json`** → `scripts` 里加 `"build": "tsc"`（已有则跳过）
2. **`apps/web/proxy.ts`** → 重命名为 `middleware.ts`，导出函数改名为 `middleware`
3. **`apps/web/app/api/markets/[slug]/resolve/route.ts`** → `maxDuration` 改成 `30`（Hobby 计划上限 60s）

---

## 第二步：Supabase（数据库）

1. 打开 supabase.com → 用 GitHub 登录 → **New Project**
   - Name: `resolve`
   - Password: 设一个（记下来）
   - Region: **Singapore**
2. 创建完成后 → **SQL Editor** → 按顺序执行这 5 个 SQL：

| 顺序 | 文件 |
|:---:|------|
| 1 | `packages/db/migrations/00001_initial_schema.sql` |
| 2 | `packages/db/migrations/00002_add_agents.sql` |
| 3 | `packages/db/migrations/00003_amm_schema.sql` |
| 4 | `packages/db/migrations/00004_pool_state_sync.sql` |
| 5 | `packages/db/migrations/00005_add_agent_onchain_fields.sql` |

3. **Settings → API** 记下这三个值：
   - `Project URL` → `SUPABASE_URL`
   - `anon public` → `SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_KEY`

---

## 第三步：Vercel（网站）

1. 打开 vercel.com → GitHub 登录 → **Add New → Project**
2. 选 `resolve` 仓库 → 配置：

| 配置项 | 填什么 |
|--------|--------|
| Framework Preset | Next.js（自动） |
| Root Directory | 留空 |
| Build Command | `cd apps/web && npx next build` |
| Install Command | `pnpm install` |
| Node.js Version | 20.x |

3. **Environment Variables** → 添加以下变量：

| 变量 | 值 |
|------|----|
| `SUPABASE_URL` | 第二步记下的 Project URL |
| `SUPABASE_ANON_KEY` | 第二步记下的 anon public |
| `SUPABASE_SERVICE_KEY` | 第二步记下的 service_role |
| `NEXT_PUBLIC_TRON_FULL_HOST` | `https://api.shasta.trongrid.io` |
| `NEXT_PUBLIC_AIRBAG_ENABLED` | `true`（气囊模式，不走真实链上） |
| `NEXT_PUBLIC_AGENT_REGISTRY_MODE` | `preconfig`（预设链上地址） |
| `TRON_PRIVATE_KEY` | 你的钱包私钥（仅 Production 环境） |

> 其他变量不填也行，气囊模式下自动降级 mock。

4. 点击 **Deploy** → 等 2-5 分钟 → 拿到域名 `resolve-prediction.vercel.app`

---

## 第四步：验证

打开网站检查：

- [ ] 首页显示英雄市场卡片
- [ ] `/agents` 显示 6 个 Agent 卡片（有 TRON 地址链接）
- [ ] `/markets/btc-150k-eoy` 详情页 + TradePanel 加载正常
- [ ] 语言切换中/英文正常

---

## 比赛演示建议

用**本地 `pnpm dev` 直接演示**，Vercel 线上备份用。理由：
- Vercel 被墙，国内评委可能打不开
- 本地演示更稳定，不受网络影响
- 两台电脑都启动 `pnpm dev`，一台崩了换另一台
