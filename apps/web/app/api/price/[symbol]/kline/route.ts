// GET /api/price/[symbol]/kline — HTX K 线数据代理（默认 30 根日线）
import { toHtxSymbol, htxFetch, fallbackKline } from "@/lib/htx";

export const dynamic = "force-dynamic";

const PERIOD = "1day";
const SIZE = 30;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ symbol: string }> },
) {
  const { symbol } = await params;
  const htxSymbol = toHtxSymbol(symbol);

  try {
    const data = await htxFetch(
      `/market/history/kline?symbol=${htxSymbol}&period=${PERIOD}&size=${SIZE}`,
    );
    const klines = (data?.data ?? [])
      .map((k) => ({
        timestamp: k.id,
        open: k.open,
        close: k.close,
        high: k.high,
        low: k.low,
        volume: k.vol,
      }))
      // HTX 返回最新在前，反转为时间升序便于绘图
      .reverse();
    return Response.json({
      symbol: symbol.toUpperCase(),
      pair: htxSymbol,
      period: PERIOD,
      klines,
      source: "htx",
      at: new Date().toISOString(),
    });
  } catch (err) {
    console.error(`[api/price/${symbol}/kline] HTX fetch failed, using fallback:`, err);
    return Response.json(fallbackKline(symbol, SIZE));
  }
}
