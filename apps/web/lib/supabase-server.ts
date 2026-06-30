// ─────────────────────────────────────────────
// 服务端 Supabase 接入 — Server-side Supabase access
// ─────────────────────────────────────────────
// API Routes 通过此模块判断 Supabase 是否已配置：
//   - 已配置 → 返回 @resolve/db 数据访问层（真实数据）
//   - 未配置 → 返回 null，调用方回退到 lib/mock 兜底数据集
//
// 本环境（demo/无凭据）下 Supabase 通常未配置，
// 所有路由因此自动走 mock 兜底，保证 pnpm dev / build 不依赖外部服务。
// ─────────────────────────────────────────────

import * as db from "@resolve/db";

/** Supabase 是否已通过环境变量配置 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key);
}

/**
 * 获取 @resolve/db 数据访问层；未配置时返回 null（调用方回退 mock）。
 *
 * 返回的是整个 db 模块（listMarkets / getMarketBySlug / insertPosition ...），
 * 这样 API Route 既能拿到真实查询函数，也能在 null 时优雅降级。
 */
export function getDb(): typeof db | null {
  return isSupabaseConfigured() ? db : null;
}
