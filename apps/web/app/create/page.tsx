"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { CATEGORIES } from "@/lib/mock";
import type { Category } from "@/lib/types";
import { useWallet } from "@/components/wallet-provider";
import { createMarket } from "@/lib/contract/settlement";
import { approveUSDD, usddBalanceOf, usddToSun } from "@/lib/contract/usdd";
import { SETTLEMENT_ADDRESS } from "@/lib/constants";

const STEPS = ["Question", "Resolution", "Liquidity", "Review"] as const;

const TEMPLATES = [
  "Will [X] happen before [date]?",
  "Will [token] close above $[price] on [date]?",
  "Will [team] win [match/tournament]?",
  "Will [body] approve [decision] before [date]?",
];

/** 生成 URL slug: "Will BTC close > 150k?" → "will-btc-close-above-150k" */
function makeSlug(question: string): string {
  return question
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "market";
}

type DeployStep = "idle" | "creating" | "approving" | "deploying";

const DEPLOY_LABELS: Record<DeployStep, string> = {
  idle: "",
  creating: "Creating market record…",
  approving: "Approving USDD…",
  deploying: "Deploying on-chain…",
};

export default function CreateMarketPage() {
  const router = useRouter();
  const wallet = useWallet();
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>("crypto");
  const [criteria, setCriteria] = useState("");
  const [threshold, setThreshold] = useState(75);
  const [expiry, setExpiry] = useState("2026-12-31");
  const [liquidity, setLiquidity] = useState("500");
  const [deployStep, setDeployStep] = useState<DeployStep>("idle");
  const [deployError, setDeployError] = useState("");

  const deploying = deployStep !== "idle";

  const handleDeploy = async () => {
    // 验证必填项
    if (!title.trim()) {
      setDeployError("Question is required");
      return;
    }
    if (!expiry) {
      setDeployError("Expiry date is required");
      return;
    }
    if (deploying) return;

    setDeployError("");
    const slug = makeSlug(title);

    try {
      const liqNum = Number(liquidity);
      let txHash: string | undefined;
      const creationFeeUSDD = 10; // 10 USDD 创建费
      const totalNeeded = liqNum + creationFeeUSDD;

      // === 先上链（如果钱包已连接且有流动性）===
      if (wallet.connected && liqNum > 0) {
        const amountSun = usddToSun(liqNum);
        const totalSun = usddToSun(totalNeeded);

        // 检查 USDD 余额
        try {
          const bal = await usddBalanceOf(wallet.address);
          if (bal < totalSun) {
            throw new Error(
              `USDD 余额不足，需要 ${totalNeeded} USDD（流动性 ${liquidity} + 创建费 ${creationFeeUSDD}）`,
            );
          }
        } catch (balErr) {
          throw new Error(
            balErr instanceof Error ? balErr.message : "无法查询 USDD 余额",
          );
        }

        // Approve USDD（流动性 + 创建费）
        setDeployStep("approving");
        await approveUSDD(SETTLEMENT_ADDRESS, totalSun);

        // Create market on-chain（合约内部会拉取 liquidity + 10 USDD 创建费）
        setDeployStep("deploying");
        const result = await createMarket(slug, amountSun);
        txHash = result.txHash;
      }

      // === 再同步数据库（链上确认后才写入）===
      setDeployStep("creating");
      const res = await fetch("/api/markets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          question: title.trim(),
          description: description.trim(),
          expires_at: new Date(expiry).toISOString(),
          settlement_tx_hash: txHash,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const err = (data as { error?: string }).error;
        if (res.status === 409) throw new Error(err || "Market with this slug already exists");
        throw new Error(err || `Server error (${res.status})`);
      }

      const market = await res.json();
      router.push(`/markets/${market.slug}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Deploy failed";
      if (msg.toLowerCase().includes("rejected") || msg.toLowerCase().includes("user")) {
        setDeployError("User rejected the transaction. Market was not created.");
      } else {
        setDeployError(msg);
      }
      setDeployStep("idle");
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="flex items-end justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-pitch-700">
            New market
          </span>
          <h1 className="font-display mt-2 text-5xl font-black uppercase tracking-tight text-ink sm:text-7xl">
            Make a market.
          </h1>
          <p className="mt-3 max-w-lg text-base font-medium text-ink/70">
            Anything verifiable can be a market. The oracles handle the resolution.
          </p>
        </div>
        <Link
          href="/markets"
          className="hidden text-sm font-black uppercase tracking-wider text-ink hover:text-magenta-500 sm:inline-flex"
        >
          ← markets
        </Link>
      </div>

      {/* Steps */}
      <div className="mt-8 rounded-3xl border-2 border-ink bg-card p-2 shadow-stamp-sm">
        <div className="grid grid-cols-4 gap-1">
          {STEPS.map((s, i) => (
            <button
              key={s}
              onClick={() => setStep(i)}
              className={cn(
                "rounded-2xl px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider transition",
                i === step
                  ? "bg-ink text-canvas"
                  : i < step
                  ? "bg-pitch-50 text-pitch-700"
                  : "text-ink/55 hover:bg-raised",
              )}
            >
              <span className="font-score mr-2">{String(i + 1).padStart(2, "0")}</span>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-5 rounded-3xl border-2 border-ink bg-card p-6 shadow-stamp">
          {step === 0 && (
            <>
              <Field label="Question">
                <textarea
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Will Bitcoin close above $150,000 by Dec 31, 2026?"
                  className="min-h-[100px] w-full resize-none rounded-2xl border-2 border-ink bg-canvas px-4 py-3 text-base font-semibold text-ink outline-none placeholder:text-ink/35 focus:bg-card"
                />
              </Field>
              <div>
                <p className="font-score text-[10px] font-bold uppercase tracking-wider text-muted">
                  Templates
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {TEMPLATES.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTitle(t)}
                      className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-raised px-3 py-1 text-[11px] font-bold text-ink hover:bg-card"
                    >
                      <Sparkles className="size-3 text-goal-600" strokeWidth={2.5} />
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <Field label="Category">
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.filter((c) => c.id !== "all").map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setCategory(c.id as Category)}
                      className={cn(
                        "rounded-full border-2 border-ink px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition",
                        category === c.id
                          ? "bg-ink text-canvas"
                          : "bg-raised text-ink/70 hover:bg-card",
                      )}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Description">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Resolves YES if … Resolves NO if … Edge cases …"
                  className="min-h-[120px] w-full resize-none rounded-2xl border-2 border-ink bg-canvas px-4 py-3 text-sm font-medium text-ink outline-none placeholder:text-ink/35 focus:bg-card"
                />
              </Field>
            </>
          )}

          {step === 1 && (
            <>
              <Field label="Resolution criteria">
                <textarea
                  value={criteria}
                  onChange={(e) => setCriteria(e.target.value)}
                  placeholder="AI agents will cross-check the Coinbase, Kraken, and HTX BTC/USD daily close. Falls back to community dispute if confidence < threshold."
                  className="min-h-[140px] w-full resize-none rounded-2xl border-2 border-ink bg-canvas px-4 py-3 text-sm font-medium text-ink outline-none placeholder:text-ink/35 focus:bg-card"
                />
              </Field>
              <Field label="Consensus threshold">
                <div className="rounded-2xl border-2 border-ink bg-canvas p-4">
                  <div className="flex items-baseline justify-between">
                    <p className="font-display text-3xl font-black text-pitch-700">{threshold}%</p>
                    <p className="font-score text-[10px] font-bold uppercase tracking-wider text-muted">
                      required oracle confidence
                    </p>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={95}
                    step={1}
                    value={threshold}
                    onChange={(e) => setThreshold(Number(e.target.value))}
                    className="mt-3 w-full accent-pitch-500"
                  />
                </div>
              </Field>
              <Field label="Expires">
                <input
                  type="date"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  className="w-full rounded-2xl border-2 border-ink bg-canvas px-4 py-3 text-sm font-bold text-ink outline-none focus:bg-card"
                />
              </Field>
            </>
          )}

          {step === 2 && (
            <>
              <Field label="Seed liquidity (USDD)">
                <input
                  value={liquidity}
                  inputMode="decimal"
                  onChange={(e) => setLiquidity(e.target.value.replace(/[^0-9.]/g, ""))}
                  placeholder="500"
                  className="font-display w-full rounded-2xl border-2 border-ink bg-canvas px-4 py-4 text-3xl font-black text-ink outline-none focus:bg-card"
                />
              </Field>
              <div className="rounded-2xl border-2 border-ink bg-magenta-100 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-magenta-700">
                  Creation fee: 10 USDD
                </p>
                <p className="mt-1 text-xs font-semibold text-ink/70">
                  Creating a market costs 10 USDD (paid once on deploy). Together with your liquidity deposit, you'll need {liquidity ? `${Number(liquidity) + 10} USDD` : "liquidity + 10 USDD"} total.
                </p>
              </div>
              <div className="rounded-2xl border-2 border-ink bg-goal-500 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-ink">Why this matters</p>
                <p className="mt-2 text-sm font-semibold text-ink/85">
                  Liquidity providers earn 0.05% per trade. The more depth you seed,
                  the tighter the YES/NO spread — the more traders engage.
                </p>
              </div>
              <Field label="Initial price">
                <div className="flex items-center gap-2 rounded-2xl border-2 border-ink bg-canvas px-4 py-3">
                  <span className="font-display text-lg font-black">YES = 50%</span>
                  <span className="font-score ml-auto text-xs font-bold uppercase tracking-wider text-muted">
                    starting bid
                  </span>
                </div>
              </Field>
            </>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <Summary label="Question" value={title || "—"} />
              <Summary label="Category" value={category} />
              <Summary label="Description" value={description || "—"} />
              <Summary label="Criteria" value={criteria || "—"} />
              <Summary label="Threshold" value={`${threshold}%`} />
              <Summary label="Expires" value={expiry} />
              <Summary label="Seed liquidity" value={`${liquidity || 0} USDD`} />
              <Summary label="Creation fee" value="10 USDD" />
              <Summary label="Total needed" value={`${liquidity ? (Number(liquidity) + 10) + ' USDD' : '—'}`} />
            </div>
          )}

          <div className="flex items-center justify-between pt-3">
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="text-sm font-black uppercase tracking-wider text-muted hover:text-ink disabled:opacity-30"
            >
              ← back
            </button>
            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
                className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-pitch-500 px-6 py-2.5 text-sm font-black uppercase tracking-[0.12em] text-ink shadow-stamp-sm transition hover:-translate-y-0.5 hover:shadow-stamp"
              >
                Continue <ArrowRight className="size-4" />
              </button>
            ) : (
              <div className="flex flex-col items-end gap-1.5">
                <button
                  onClick={handleDeploy}
                  disabled={deploying || !title.trim()}
                  className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-pitch-500 px-6 py-2.5 text-sm font-black uppercase tracking-[0.12em] text-ink shadow-stamp transition hover:-translate-y-0.5 hover:shadow-stamp-lg disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deploying ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Deploying…
                    </>
                  ) : (
                    <>Deploy market <ArrowRight className="size-4" /></>
                  )}
                </button>
                {deployStep !== "idle" && (
                  <p className="text-[11px] font-bold text-goal-600 animate-pulse">
                    {DEPLOY_LABELS[deployStep]}
                  </p>
                )}
              </div>
            )}
          </div>
          {deployError && (
            <p className="text-sm font-bold text-red-600 mt-2">{deployError}</p>
          )}
        </div>

        {/* Live preview */}
        <aside>
          <div className="sticky top-24 overflow-hidden rounded-3xl border-2 border-ink bg-card shadow-stamp-sm">
            <div className="border-b-2 border-ink bg-raised px-4 py-3">
              <p className="font-score text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
                Live preview
              </p>
            </div>
            <div className="space-y-3 p-5">
              <p className="font-score text-[10px] font-bold uppercase tracking-wider text-magenta-700">
                {category}
              </p>
              <h3 className="font-display text-xl font-black uppercase leading-[0.95] tracking-tight text-ink">
                {title || "Your market question appears here."}
              </h3>
              <p className="text-sm font-medium text-ink/70">
                {description || "Add a description to set context for traders."}
              </p>
              <div className="grid grid-cols-2 gap-2 pt-2">
                <div className="rounded-xl border-2 border-ink bg-pitch-50 px-3 py-2">
                  <span className="font-score text-[10px] font-bold uppercase tracking-wider text-pitch-700">
                    YES
                  </span>
                  <p className="font-score text-base font-black text-pitch-700">50%</p>
                </div>
                <div className="rounded-xl border-2 border-ink bg-crowd-100 px-3 py-2">
                  <span className="font-score text-[10px] font-bold uppercase tracking-wider text-magenta-700">
                    NO
                  </span>
                  <p className="font-score text-base font-black text-magenta-700">50%</p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-score text-[10px] font-bold uppercase tracking-[0.18em] text-muted">{label}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 rounded-2xl border-2 border-ink bg-canvas px-4 py-3">
      <p className="font-score text-[10px] font-bold uppercase tracking-wider text-muted">{label}</p>
      <p className="max-w-[60%] text-right text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}
