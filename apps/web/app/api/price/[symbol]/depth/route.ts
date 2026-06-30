// GET /api/price/[symbol]/depth — HTX 订单簿深度代理
import { toHtxSymbol, htxFetch, fallbackDepth } from "@/lib/htx";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ symbol: string }> },
) {
  const { symbol } = await params;
  const htxSymbol = toHtxSymbol(symbol);

  try {
    const data = await htxFetch(`/market/depth?symbol=${htxSymbol}&type=step0`);
    const tick = data?.tick;
    return Response.json({
      symbol: symbol.toUpperCase(),
      pair: htxSymbol,
      bids: (tick?.bids ?? []).slice(0, 20).map(([price, amount]: [number, number]) => ({ price, amount })),
      asks: (tick?.asks ?? []).slice(0, 20).map(([price, amount]: [number, number]) => ({ price, amount })),
      source: "htx",
      at: new Date().toISOString(),
    });
  } catch (err) {
    console.error(`[api/price/${symbol}/depth] HTX fetch failed, using fallback:`, err);
    return Response.json(fallbackDepth(symbol));
  }
}
