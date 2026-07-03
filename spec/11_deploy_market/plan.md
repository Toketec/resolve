# Spec 11: 执行计划

## 架构总览

```
packages/db/src/data.ts       ←── 新增 insertMarket()（数据访问）
apps/web/app/api/markets/route.ts  ←── 新增 POST handler（API 端点）
apps/web/lib/contract/settlement.ts ←── 新增 createMarket() 合约封装
apps/web/app/create/page.tsx  ←── 按钮 onClick + 串联逻辑
```

## 步骤

### Step 1: DB 层 — 新增 ``insertMarket()``

**文件**: `packages/db/src/data.ts`

新增函数，接收 ``Omit<MarketRow, 'id' | 'created_at' | 'updated_at'>`` 参数，调用 Supabase ``.from('markets').insert().select()`` 返回新行。

```typescript
/** 创建新市场 */
export async function insertMarket(input: {
  slug: string;
  question: string;
  description: string;
  status?: 'active' | 'resolving' | 'resolved' | 'settled';
  expires_at?: string;
  resolved_outcome?: 'YES' | 'NO' | null;
  settlement_tx_hash?: string | null;
}): Promise<MarketRow> {
  const { data, error } = await getAnyClient()
    .from('markets')
    .insert({
      ...input,
      status: input.status ?? 'active',
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create market: ${error.message}`);
  return data as MarketRow;
}
```

### Step 2: API 层 — 新增 POST /api/markets

**文件**: `apps/web/app/api/markets/route.ts`

在已有 GET 函数后新增 POST 函数。扮演**Supabase 端写入者**角色：

```typescript
export async function POST(req: Request) {
  let body;
  try { body = await req.json(); } catch { ... }

  // field validate: slug, question, description, expires_at
  // 可选 settlement_tx_hash（链上 createMarket 成功后传入）
  // slug 由前端 makeSlug() 生成后传入

  const db = getDb();
  if (!db) return Response.json({ error: "No DB" }, { status: 503 });

  // 检查 slug 冲突 → 409
  const existing = await db.getMarketBySlug(slug);
  if (existing) return Response.json({ error: "slug exists" }, { status: 409 });

  const row = await db.insertMarket({
    slug, question, description, status: "active",
    expires_at, settlement_tx_hash,
  });
  return Response.json(marketRowToMarket(row), { status: 201 });
}
```

**slug 生成算法**:
1. 取 question 前 40 字符
2. 小写化
3. 替换非字母数字空格和连字符为 `-`
4. 合并连续分隔符
5. 去除首尾分隔符
6. 若 slug 已存在，追加 `-2`, `-3`…（此版本先抛错，提示用户修改；因演示场景一般不会冲突）

### Step 3: 合约层 — 新增 ``createMarket()`` 封装

**文件**: `apps/web/lib/contract/settlement.ts`

新增函数，客户端 TronLink 签名调合约 ``createMarket()``：

```typescript
/** 客户端创建链上市场（TronLink 签名）—— 预注资流动性 */
export async function createMarket(
  marketId: string,
  liquiditySun: bigint,
): Promise<{ txHash: string }> {
  const tw = getClientTronWeb();
  if (!tw) throw new Error("TronLink 未安装/未连接");
  
  const c = await tw.contract(SETTLEMENT_ABI as any).at(SETTLEMENT_ADDRESS);
  const mid = marketIdToBytes32(marketId);
  const txHash: string = await c
    .createMarket(mid, String(liquiditySun))
    .send({ feeLimit: 1_000_000_000, callValue: 0 });
  return { txHash };
}
```

若 liquidity = 0 或 TronLink 未连接，跳过此步。

### Step 4: 前端 — 按钮串联

**文件**: `apps/web/app/create/page.tsx`

核心是：**从已有表单 state 提取数据 → 按序调 API + TronLink → 跳转**。

#### 4a. slug 生成函数（放在 utils.ts 或页面内）

```typescript
// 生成 URL slug: "Will BTC close > 150k?" → "will-btc-close-above-150k"
function makeSlug(question: string): string {
  return question
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'market';
}
```

#### 4b. "Deploy market" button onClick（先链后库）

```typescript
const [deployStep, setDeployStep] = useState<DeployStep>("idle");
const [deployError, setDeployError] = useState<string | null>(null);
const router = useRouter();

async function handleDeploy() {
  setDeployError(null);

  try {
    // validate 表单必填项
    if (!title.trim()) { throw new Error("Question is required"); }
    if (!expiry) { throw new Error("Expiry date is required"); }

    const slug = makeSlug(title);
    const liqNum = Number(liquidity);
    let txHash: string | undefined;

    // Step 1: 先上链（如果 TronLink 已连接 + liquidity > 0）
    // 用户拒绝签名 → 什么都不写入，干净退出
    if (wallet.connected && liqNum > 0) {
      const amountSun = usddToSun(liqNum);

      // 检查 USDD 余额
      const bal = await usddBalanceOf(wallet.address);
      if (bal < amountSun) throw new Error(`USDD 余额不足，需要 ${liquidity} USDD`);

      setDeployStep("approving");
      await approveUSDD(SETTLEMENT_ADDRESS, amountSun);

      setDeployStep("deploying");
      const result = await createMarket(slug, amountSun);
      txHash = result.txHash;
    }

    // Step 2: 再同步数据库（链上确认后才写入）
    setDeployStep("creating");
    const res = await fetch('/api/markets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug,
        question: title,
        description,
        expires_at: new Date(expiry).toISOString(),
        settlement_tx_hash: txHash, // 链上 txHash（如果有）
      }),
    });
    if (!res.ok) throw new Error(await res.text());
    const market = await res.json();

    router.push(`/markets/${market.slug}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Deploy failed';
    if (msg.toLowerCase().includes('rejected') || msg.toLowerCase().includes('user')) {
      setDeployError('User rejected the transaction. Market was not created.');
    } else {
      setDeployError(msg);
    }
    setDeployStep("idle");
  }
}
```

#### 4c. UI 状态处理

- Button 文字变为 `Deploying…`，disabled
- 按钮下方显示 loading spinner + 进度（"Approving USDD…" / "Deploying on-chain…" / "Creating market record…"）
- 失败时显示红色错误提示，按钮恢复可点击
- 用户拒绝签名时提示 "Market was not created"（无 DB 残留）
- 成功后跳转到 `/markets/{slug}`

### Step 5: 集成验证

```bash
pnpm typecheck
pnpm build
# 手动测试：启动 dev server → 填写表单 → 点击 Deploy market
```

## 文件修改清单

| # | 文件 | 操作 |
|:-:|------|------|
| 1 | `packages/db/src/data.ts` | 新增 `insertMarket()` 函数 |
| 2 | `apps/web/app/api/markets/route.ts` | 新增 `POST` 函数 |
| 3 | `apps/web/lib/contract/settlement.ts` | 新增 `createMarket()` 函数（可选，也可在同一个文件新增） |
| 4 | `apps/web/app/create/page.tsx` | 按钮 onClick + state + 表单引用 + error/loading UI |
