import type { AIConsensus } from "@/lib/types";
import { formatPct } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Props {
  consensus: AIConsensus;
  className?: string;
}

const LABEL: Record<AIConsensus["status"], string> = {
  pending: "Pending",
  deliberating: "Deliberating",
  consensus: "Consensus reached",
  dispute: "Community dispute",
};

const STYLE: Record<AIConsensus["status"], { color: string; bg: string }> = {
  pending:      { color: "#5B5B58", bg: "#E8E5DD" },
  deliberating: { color: "#0A0A0A", bg: "#FFB800" },
  consensus:    { color: "#0A0A0A", bg: "#00B14F" },
  dispute:      { color: "#FFFFFF", bg: "#FF2D6F" },
};

export function ConsensusMeter({ consensus, className }: Props) {
  const s = STYLE[consensus.status];
  const pct = Math.round(consensus.confidence * 100);
  const thr = Math.round(consensus.threshold * 100);

  return (
    <div className={cn("overflow-hidden rounded-2xl border-2 border-ink bg-card", className)}>
      <div className="flex items-center justify-between border-b-2 border-ink bg-raised px-4 py-2.5">
        <p className="font-score text-[10px] font-bold uppercase tracking-[0.18em] text-muted">
          AI Consensus
        </p>
        <span
          className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em]"
          style={{ backgroundColor: s.bg, color: s.color }}
        >
          {consensus.status === "deliberating" && (
            <span className="pulse-dot inline-block size-1.5 rounded-full bg-ink" />
          )}
          {LABEL[consensus.status]}
        </span>
      </div>

      <div className="p-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p
              className="font-display text-5xl font-black leading-none tracking-tight"
              style={{ color: s.bg === "#E8E5DD" ? "#0A0A0A" : s.bg }}
            >
              {pct}%
            </p>
            <p className="font-score mt-2 text-[10px] font-bold uppercase tracking-wider text-muted">
              {consensus.outcome ? `outcome · ${consensus.outcome}` : "confidence"}
            </p>
          </div>
          <div className="flex-1">
            <div className="relative h-3 overflow-hidden rounded-full border-2 border-ink bg-raised">
              <div
                className="h-full transition-all"
                style={{ width: `${pct}%`, background: s.bg === "#E8E5DD" ? "#0A0A0A" : s.bg }}
              />
              <div
                className="absolute inset-y-0 w-0.5 bg-ink"
                style={{ left: `${thr}%` }}
                title="Threshold"
              />
            </div>
            <div className="font-score mt-1.5 flex justify-between text-[10px] font-bold text-muted">
              <span>0%</span>
              <span style={{ marginLeft: `${thr}%`, transform: "translateX(-50%)" }}>
                thr {thr}%
              </span>
              <span>100%</span>
            </div>
          </div>
        </div>

        {consensus.votes.length > 0 && (
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {consensus.votes.map((v) => (
              <div
                key={v.agentId}
                className="rounded-xl border-2 border-ink bg-raised px-3 py-2"
              >
                <p className="font-score text-[10px] font-bold uppercase tracking-wider text-muted">
                  {v.callsign}
                </p>
                <p
                  className="font-display text-base font-black"
                  style={{ color: v.vote === "YES" ? "#00B14F" : "#FF2D6F" }}
                >
                  {v.vote}
                </p>
                <p className="font-score mt-0.5 text-[10px] font-bold text-muted">
                  conf {formatPct(v.confidence, 0)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
