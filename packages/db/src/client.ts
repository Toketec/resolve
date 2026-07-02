import { createClient } from '@supabase/supabase-js';

/**
 * Supabase 客户端工厂
 *
 * 因为本包是内部私有包，且 Supabase 的 Row 泛型
 * 在无 Database 类型时推断为 never，所以我们返回 any，
 * 在 data.ts 中统一做业务类型断言。
 */

function env(key: string): string {
  try {
    return (process as any)?.env?.[key] ?? '';
  } catch {
    return '';
  }
}

type SupabaseClient = ReturnType<typeof createClient>;

let anonClient: SupabaseClient | null = null;
let serviceClient: SupabaseClient | null = null;

/**
 * 获取匿名客户端
 *
 * 环境变量来源（优先级从高到低）:
 *   SUPABASE_URL
 *   SUPABASE_ANON_KEY
 */
export function getAnonClient(): SupabaseClient {
  if (anonClient) return anonClient;

  const url = env('SUPABASE_URL');
  const key = env('SUPABASE_ANON_KEY');

  if (!url || !key) {
    throw new Error(
      'Supabase 未配置。请在 .env.local 中设置 ' +
      'SUPABASE_URL / SUPABASE_ANON_KEY'
    );
  }

  anonClient = createClient(url, key);
  return anonClient;
}

/**
 * 获取服务端客户端（fallback 到匿名）
 */
export function getServiceClient(): SupabaseClient {
  if (serviceClient) return serviceClient;

  const url = env('SUPABASE_URL');
  const key = env('SUPABASE_SERVICE_KEY') || env('SUPABASE_ANON_KEY');

  if (!url || !key) {
    return getAnonClient();
  }

  serviceClient = createClient(url, key);
  return serviceClient;
}

/**
 * 获取 any 版的 client，用于需要手动类型断言的场景
 */
export function getAnyClient(): any {
  return getAnonClient();
}
