// GET /api/price/[symbol] — HTX 实时价格代理（如 /api/price/BTC）
import { toHtxSymbol, htxFetch, fallbackPrice } from "@/lib/htx";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ symbol: string }> },
) {
  const { symbol } = await params;
  const htxSymbol = toHtxSymbol(symbol);

  try {
    const data = await htxFetch(`/market/detail/merged?symbol=${htxSymbol}`);
    const tick = data?.tick;
    if (!tick) throw new Error(`No tick for ${htxSymbol}`);
    const open = Number(tick.open) || 0;
    const close = Number(tick.close) || 0;
    const change24h = open ? ((close - open) / open) * 100 : 0;
    return Response.json({
      symbol: symbol.toUpperCase(),
      pair: htxSymbol,
      price: close,
      change24h,
      high24h: Number(tick.high) || 0,
      low24h: Number(tick.low) || 0,
      vol24h: Number(tick.vol) || 0,
      source: "htx",
      at: new Date().toISOString(),
    });
  } catch (err) {
    console.error(`[api/price/${symbol}] HTX fetch failed, using fallback:`, err);
    return Response.json(fallbackPrice(symbol));
  }
}
