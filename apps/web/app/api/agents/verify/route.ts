/**
 * GET /api/agents/verify — 从 Shasta 链上 AgentRegistry 合约读取 6 个 Agent 的注册地址
 *
 * 用于前端展示链上可验证的 Agent 身份，替代 mock 模式下派生的假 8004 ID。
 * 结果缓存 5 分钟以减少 RPC 调用。
 *
 * 响应:
 *   { contract: "TU5XS8...", agents: { "bull-1": "TLVn5...", ... }, verified: true }
 */
import { TronWeb } from "tronweb";

const REGISTRY_ADDRESS =
  process.env.NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS || "";
const FULL_HOST =
  process.env.NEXT_PUBLIC_TRON_FULL_HOST || "https://api.shasta.trongrid.io";

const AGENT_IDS = ["bull-1", "bull-2", "bear-1", "bear-2", "neut-1", "neut-2"];

// 缓存 5 分钟
let cache: { data: Record<string, string>; ts: number } | null = null;
const TTL = 5 * 60 * 1000;

/** 从 ABI 编码的 32 字节 hex 中提取 TRON base58 地址 */
function decodeAddress(hex32: string, tronWeb: TronWeb): string | null {
  try {
    // ABI-encoded address: 32 bytes, 后 20 bytes 是实际地址
    const addrHex = "41" + hex32.slice(-40);
    return tronWeb.address.fromHex(addrHex);
  } catch {
    return null;
  }
}

export const dynamic = "force-dynamic";

export async function GET() {
  if (!REGISTRY_ADDRESS) {
    return Response.json(
      { error: "AgentRegistry not configured", contract: null, agents: null, verified: false },
      { status: 200 }, // 200 而非 503，让前端优雅降级
    );
  }

  // 返回缓存（通过 Last-Modified 头让调用方知道是缓存）
  if (cache && Date.now() - cache.ts < TTL) {
    return Response.json({
      contract: REGISTRY_ADDRESS,
      agents: cache.data,
      verified: Object.keys(cache.data).length === 6,
      cached: true,
      at: new Date(cache.ts).toISOString(),
    });
  }

  const tronWeb = new TronWeb({ fullHost: FULL_HOST });
  // triggerConstantContract 需要一个 owner_address（只读查询用零地址即可）
  const dummyAddr = "T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb";
  const registryHex = tronWeb.address.toHex(REGISTRY_ADDRESS);
  const ownerHex = tronWeb.address.toHex(dummyAddr);

  const agents: Record<string, string> = {};
  const errors: string[] = [];

  for (const agentId of AGENT_IDS) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result: any =
        await tronWeb.transactionBuilder.triggerConstantContract(
          registryHex,
          "getAgent(string)",
          {},
          [{ type: "string", value: agentId }],
          ownerHex,
        );

      const raw = result?.constant_result?.[0];
      if (raw) {
        const addr = decodeAddress(raw, tronWeb);
        if (addr) {
          agents[agentId] = addr;
          continue;
        }
      }
      errors.push(`${agentId}: no result`);
    } catch (e) {
      errors.push(`${agentId}: ${(e as Error).message}`);
    }
  }

  if (errors.length > 0) {
    console.warn("[api/agents/verify] partial failures:", errors);
  }

  cache = { data: agents, ts: Date.now() };

  return Response.json({
    contract: REGISTRY_ADDRESS,
    agents,
    verified: Object.keys(agents).length === 6,
    errors: errors.length > 0 ? errors : undefined,
    at: new Date().toISOString(),
  });
}
