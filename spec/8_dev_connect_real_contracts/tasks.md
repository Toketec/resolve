# 8_dev_connect_real_contracts — Tasks

## 任务列表

| ID | 任务 | 状态 | 工时 | 备注 |
|:--:|------|:----:|:----:|------|
| 8.1 | **新建** `lib/contract/tronweb.ts` — tronWeb 实例工厂 | ✅ | 20min | 双模式（客户端 `window.tronLink.tronWeb` / 服务端 `TRON_PRIVATE_KEY`）；4 个导出函数 |
| 8.2 | **新建** `lib/contract/usdd.ts` — USDD approve/balanceOf/allowance | ✅ | 25min | 精度 6 位；客户端签名；server 可选参数 |
| 8.3 | **重构** `lib/contract/settlement.ts` — buyShares/settle/settleSimulated/getMarket | ✅ | 45min | buyShares 客户端签名；settle/settleSimulated 服务端签名；feeLimit=1e9 |
| 8.4 | **修改** `api/buy/route.ts` — 去掉 mock txHash，只做持久化 | ✅ | 20min | txHash 必传参数；校验非 mock 前缀；保留 Supabase 写入 + 兜底 |
| 8.5 | **修改** `api/settle/route.ts` — 调用真实 settle/settleSimulated | ✅ | 30min | 气囊模式控制；服务端 tronWeb 签名；错误处理 |
| 8.6 | **修改** TradePanel — Buy 流程接入真实合约 | ✅ | 1.5h | approve → buyShares → POST 记录；TronLink 状态检查；Loading/Error/Success 三态 |
| 8.7 | 更新 `.env.example` + 文档 | ✅ | 10min | 添加 `TRON_PRIVATE_KEY` 说明；注明 Shasta 要求 |
| 8.8 | **验证**: typecheck + build + 安全扫描 | ✅ | 30min | typecheck ✅ / build ✅ / 无私钥硬编码 ✅ |

## 验证清单

- [x] `pnpm typecheck` 通过
- [x] `pnpm build` 通过
- [x] TronLink 安装并切换到 Shasta → TradePanel 显示已连接
- [x] 点击 Buy YES → TronLink 弹出 approve 签名 → 确认 → txHash 返回
- [x] approve 完成后 TronLink 弹出 buyShares 签名 → 确认 → txHash 返回
- [x] 前端 Buy 成功后显示仓位信息 + txHash 链接到 Tronscan
- [x] 在 `https://shasta.tronscan.org` 搜索 txHash → 交易可查
- [x] 气囊模式（默认）→ 调用 settle → 返回真实 settleSimulated txHash
- [x] 真实模式（`AIRBAG_ENABLED=false`）→ 调用 settle → 赢家收到 USDD
- [x] TronLink 未安装时 Buy 按钮显示 "请安装 TronLink"
- [x] 无 `TRON_PRIVATE_KEY` 时 settle 返回错误信息（不崩溃）
- [x] `.env` 中无私钥硬编码（仅 `.env.example` 有占位）
