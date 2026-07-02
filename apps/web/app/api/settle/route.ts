// POST /api/settle — 结算（赔付赢家）
// 调用真实合约 settleSimulated()（气囊模式，默认）或 settle()（真实赔付）。
// 使用服务端 owner 私钥签名（TRON_PRIVATE_KEY 环境变量）。
import { settle, settleSimulated } from "@/lib/contract/settlement";

export const dynamic = "force-dynamic";

interface SettleBody {
  marketId: string;
  outcome: "YES" | "NO";
  winnerWallet?: string;
  payoutSun?: string; // 赔付金额（最小单位 sun），真实模式必需
}

export async function POST(req: Request) {
  let body: SettleBody;
  try {
    body = (await req.json()) as SettleBody;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { marketId, outcome, winnerWallet, payoutSun } = body;
  if (!marketId || !outcome) {
    return Response.json(
      { error: "Missing required fields: marketId, outcome" },
      { status: 400 },
    );
  }

  const airbag = process.env.NEXT_PUBLIC_AIRBAG_ENABLED !== "false";

  try {
    if (airbag) {
      // 气囊模式：调用 settleSimulated（标记已结算，不转账）
      const txHash = await settleSimulated(marketId, outcome);
      return Response.json({
        marketId,
        outcome,
        txHash,
        winnerWallet: winnerWallet ?? null,
        paidOut: false,
        simulated: true,
      });
    } else {
      // 真实模式：调用 settle（向赢家转账赔付）
      if (!winnerWallet) {
        return Response.json(
          { error: "winnerWallet is required for non-airbag settle" },
          { status: 400 },
        );
      }
      if (!payoutSun || BigInt(payoutSun) <= BigInt(0)) {
        return Response.json(
          { error: "payoutSun must be a positive integer" },
          { status: 400 },
        );
      }
      const txHash = await settle(
        marketId,
        outcome,
        winnerWallet,
        BigInt(payoutSun),
      );
      return Response.json({
        marketId,
        outcome,
        txHash,
        winnerWallet,
        paidOut: true,
        simulated: false,
      });
    }
  } catch (err) {
    console.error("[api/settle] Chain call failed:", err);
    return Response.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Settle failed — check TRON_PRIVATE_KEY and contract state",
      },
      { status: 500 },
    );
  }
}
