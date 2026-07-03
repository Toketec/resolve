# Spec 11: 实现 Deploy Market 完整数据流

## 问题

Create Market 页面（`apps/web/app/create/page.tsx`）的 **"Deploy market"** 按钮目前没有 ``onClick`` 处理函数，点击无反应。用户填写完市场信息（问题、描述、标准、阈值、过期时间、初始流动性）后无法真正创建市场。

需要串联完整的数据流：**表单验证 → Supabase 写入元数据 → TRON 合约创建链上市场并锁仓 USDD → 跳转到市场详情页**。

## 现有基础设施

### Supabase 层（已就绪）
- `packages/db/migrations/00001_initial_schema.sql` → ``markets`` 表 schema ✅
- `packages/db/src/data.ts` → ``listMarkets()`` / ``getMarketBySlug()`` / ``updateMarket()`` ✅
- **缺**: ``insertMarket()`` 函数

### API 层（已就绪）
- `apps/web/app/api/markets/route.ts` → GET 列表 ✅
- `apps/web/app/api/markets/[slug]/route.ts` → GET 单市场 ✅
- `apps/web/app/api/buy/route.ts` → POST 买入（参考模式，做了 validate + DB insert） ✅
- **缺**: POST /api/markets 创建市场

### 合约层（已就绪）
- `apps/contracts/ResolveSettlement.sol:55` → ``createMarket(bytes32 marketId, uint256 liquidity)`` ✅
- `apps/web/lib/contract/settlement.ts` → ``settle()`` / ``settleSimulated()`` / ``buyShares()`` ✅
- `apps/web/lib/contract/usdd.ts` → ``approveUSDD()`` / ``balanceOf()`` ✅
- **缺**: ``createMarket()`` 的合约封装

### 前端（已就绪）
- `apps/web/lib/hooks/useTronWallet.ts` → TronLink 状态管理 ✅
- `apps/web/app/create/page.tsx` → 表单 UI + 4 步表单 ✅
- **缺**: "Deploy market" 按钮的 ``onClick`` 处理

## 方案：双层写入

```
用户点击 "Deploy market"
         │
    ┌─────┴─────┐
    │ validation │  ← 必填项检查 + slug 生成
    └─────┬─────┘
          │
   ┌──────▼──────┐
   │  POST /api/ │  ● step 1: Supabase 写入元数据
   │   markets   │  ● 返回 marketId + slug
   └──────┬──────┘
          │
   ┌──────▼─────────────────┐
   │  TronLink 签名（可选）    │  ● step 2: 如果 TronLink 已连接且有流动性
   │  approve USDD →        │  ● 调用合约 createMarket()
   │  createMarket()        │  ● 锁仓 USDD
   └──────┬─────────────────┘
          │
   ┌──────▼──────┐
   │ 跳转到       │
   │ /markets/    │
   │ {slug}      │
   └─────────────┘
```

**关键原则：Supabase 始终写入，TRON 按条件写入（TronLink 已连接 + liquidity > 0）。**

## 不涉及的

- ☆ Agent 注册相关逻辑（已在 Spec 10 处理）
- ☆ 市场结算（resolve/settle）已有独立路径
- ☆ 用户权限/登录认证（Demo 阶段无需）
- ☆ slug 唯一性冲突的"编辑中"提示（暂时简单提示，"slug 已存在"）

## 依赖项

- ``packages/db`` 已正确链接到 Supabase 项目
- ``SETTLEMENT_ADDRESS`` 环境变量指向已部署的 `ResolveSettlement` 合约
- ``USDD_ADDRESS`` 环境变量指向 USDD TRC-20 合约（Shasta 测试网）
- TronLink 浏览器扩展（用户端可选，DB-only 模式不依赖）

## 后续优化（赛后）

- slug 实时唯一性校验（输入即检查）
- 批量创建市场（管理员界面）
- gas 费用估算预览
- 上链失败的 graceful fallback 到 DB-only 模式
- TronLink 未安装时的纯前端新建导向
