// POST /api/settle — 结算（赔付赢家）
// 本阶段返回 mock txHash；阶段 4 替换为真实合约 settle() / 气囊 settleSimulated()。
export const dynamic = "force-dynamic";

interface SettleBody {
  marketId: string;
  outcome: "YES" | "NO";
  winnerWallet?: string;
}

export async function POST(req: Request) {
  let body: SettleBody;
  try {
    body = (await req.json()) as SettleBody;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { marketId, outcome, winnerWallet } = body;
  if (!marketId || !outcome) {
    return Response.json(
      { error: "Missing required fields: marketId, outcome" },
      { status: 400 },
    );
  }

  const airbag = process.env.NEXT_PUBLIC_AIRBAG_ENABLED !== "false";

  return Response.json({
    marketId,
    outcome,
    winnerWallet: winnerWallet ?? null,
    txHash: `mock_settle_${Date.now().toString(16)}`,
    paidOut: true,
    simulated: airbag,
  });
}
