# ⟁ RESOLVE: Dispute Mode

## When consensus isn't enough — how participants challenge an AI verdict

> **Version**: 1.0 · **Protocol**: Staked challenge with re-run consensus · **Window**: 6 hours
> **Target**: Prevent frivolous disputes while enabling legitimate outcome corrections

---

## Why Disputes Exist

AI consensus is powerful but not perfect. Even six independent agents, weighted by accuracy and armed with evidence, can make mistakes:

- **Data gaps**: An agent may miss a critical piece of evidence that a participant spotted.
- **Event timing**: A market's outcome may change moments after expiry — a CEO tweet, a regulatory announcement — that the agents did not see.
- **Ambiguous criteria**: The market question itself may have edge cases the resolution criteria did not anticipate.

Multi-agent consensus **reduces** error rates (to ~3–5% in our testing), but it does not **eliminate** them. A healthy prediction market needs a safety valve — a way for participants to flag a bad verdict and demand reconsideration.

Dispute Mode is that safety valve. It is designed as a **staked challenge process**: anyone can dispute a verdict by depositing tokens, presenting counter-evidence, and triggering a fresh agent deliberation.

---

## Dispute Lifecycle

```
       Consensus Reached (strength ≥ 0.65)
                  │
                  ▼
┌─────────────────────────────────┐
│  Challenge Window Opens         │
│  ⏱ 6 hours from verdict         │
│  Anyone can post a dispute      │
│  by staking tokens + evidence   │
└──────────┬──────────────────────┘
           │ (dispute filed)
           ▼
┌─────────────────────────────────┐
│  Staking Requirement            │
│  Challenger deposits:           │
│  ├─ Fixed fee (prevents spam)   │
│  └─ Additional stake            │
│      (proportional to market    │
│       volume)                   │
│  If frivolous → stake forfeited │
└──────────┬──────────────────────┘
           │ (stake accepted)
           ▼
┌─────────────────────────────────┐
│  Evidence Appeal                │
│  Challenger submits:            │
│  ├─ New evidence (links, data)  │
│  ├─ Explanation of error        │
│  └─ Correct outcome claimed     │
│  Evidence reviewed for relevance│
└──────────┬──────────────────────┘
           │ (evidence accepted)
           ▼
┌─────────────────────────────────┐
│  Re-run Consensus               │
│  All 6 agents re-deliberate    │
│  with ORIGINAL evidence         │
│  + challenger's NEW evidence    │
│  Fresh votes, fresh weights     │
│  ~5 seconds                     │
└──────────┬──────────────────────┘
           │
           ▼
     ┌─────┴─────┐
     │           │
  Overturned   Upheld
     │           │
     ▼           ▼
┌──────────┐ ┌──────────┐
│ Verdict  │ │ Verdict  │
│ CHANGED  │ │ STANDS   │
│          │ │          │
│ Dispute  │ │ Challenger│
│ winner   │ │ loses    │
│ gets     │ │ stake    │
│ stake    │ │          │
│ + fee    │ │ Fee goes │
│          │ │ to       │
│          │ │ treasury │
└──────────┘ └──────────┘
```

---

## Step-by-Step Detail

### 1. Challenge Window

Once consensus is reached and the verdict posted, a **6-hour challenge window** opens. During this window, any participant holding tokens on the TRON network can file a dispute.

**Why 6 hours?**
- Long enough for a diligent participant to review the verdict and gather counter-evidence.
- Short enough that market settlement is not delayed indefinitely.
- Aligned with typical market settlement expectations (same-day resolution).

The window is enforced by the **settlement smart contract** on TRON. No dispute can be filed before the window opens or after it closes. The contract tracks `verdictTimestamp` and `disputeDeadline` as immutable parameters.

### 2. Staking

Filing a dispute requires depositing a **stake**. This serves two purposes:

- **Prevent frivolous challenges**: If anyone could dispute for free, every losing trader would challenge every verdict. The stake makes disputes costly enough to only attract legitimate cases.
- **Fund the system**: If a dispute is upheld (verdict overturned), the challenger gets their stake back plus the losing side's stake. If the dispute is rejected, the challenger's stake is forfeited — partly burned, partly sent to the protocol treasury.

The stake amount is proportional to the **total trading volume** of the disputed market. A market with $10k in volume requires a larger stake than a $100 market, ensuring the economic incentive scales with the real value at stake.

### 3. Evidence Appeal

The challenger must submit **new evidence** — data, links, screenshots, or analysis that the original consensus did not consider. This is not a rehash of the same arguments; it must be genuinely new material.

Examples of valid new evidence:
- A price tick that shows BTC closed above $150k (the agents read an outdated tick).
- A regulatory filing published after the agents collected their evidence.
- A discrepancy in the resolution criteria that changes the interpretation.

Evidence is reviewed by a **lightweight automated validator** that checks for:
- Source freshness (is this genuinely new?)
- Format validity (are the links reachable?)
- Relevance (does this materially affect the outcome?)

Invalid or irrelevant evidence is rejected immediately, and the challenger loses their stake.

### 4. Re-run Consensus

If the evidence passes validation, the system triggers a **full re-run** of the consensus pipeline:

1. All 6 agents receive their **original evidence** unchanged.
2. All 6 agents additionally receive the **challenger's new evidence**.
3. Each agent re-votes: `{ vote, confidence, reasoning, evidence[] }`.
4. The weighted consensus is recalculated with the same weights and threshold (0.65).

The re-run is identical to the original pipeline, except the evidence set is strictly larger. This ensures fairness: agents reconsider their positions with new information, not with changed rules.

### 5. Resolution

| Scenario | Verdict | Challenger gets | Market gets |
|----------|:-------:|:---------------:|:-----------:|
| **Valid dispute** (verdict overturned) | Changed to challenger's claimed outcome | Stake returned + fee from original settlement | Correct outcome settled on-chain |
| **Invalid dispute** (verdict upheld) | Unchanged | Stake forfeited | Stake goes to treasury (protocol funding) |

---

## Smart Contract Enforcement

Every step of the dispute lifecycle is enforced by the **RESOLVE settlement contract** on TRON Shasta testnet:

```solidity
// Simplified dispute structure
struct Dispute {
    bytes32 marketId;
    address challenger;
    uint256 stake;
    string evidenceIpfsHash;
    uint256 filedAt;
    DisputeStatus status; // Pending, Accepted, Resolved
    Outcome claimedOutcome;
}

// Key parameters
uint256 constant CHALLENGE_WINDOW = 6 hours;
uint256 constant MIN_STAKE_BPS = 100; // 1% of total volume
```

The contract:
- Enforces the 6-hour challenge window
- Locks and releases stakes
- Triggers the re-run consensus via off-chain oracle
- Settles the final outcome on-chain

---

## Comparison: RESOLVE vs. UMA Dispute Mechanism

| Feature | UMA | RESOLVE |
|---------|:---:|:-------:|
| Who resolves disputes | UMA token holders vote again | **AI re-run with new evidence** |
| Time to resolve | 2–3 days | **~5 seconds** |
| Cost to dispute | High (UMA staking + gas) | Proportional stake (returned if valid) |
| Evidence handling | Manual submission, human review | Automated validation, AI review |
| Transparency | Discussion threads, unclear process | Full audit trail, deterministic rules |
| Escalation | Single level | **Multi-level** (future: add more agents) |

The key difference: UMA replaces one human jury with another human jury for disputes. RESOLVE keeps the same AI agents — but gives them **better information**. The dispute is not about which side has more supporters; it's about whether the agents missed something.

---

## Security Model

Dispute Mode is secured by **economic disincentive**:

- **For challengers**: Filing a frivolous dispute costs you real tokens. Only challenge when you have genuinely new evidence.
- **For the protocol**: The 0.65 threshold already filters weak consensus. A dispute requires the challenger to **out-argue 6 AI agents** with new evidence — a high bar.
- **For the market**: If the agents were wrong, the dispute corrects the outcome. If they were right, the dispute burns tokens and reinforces trust in the system.

> **In short**: The economic game is designed so that rational participants only dispute when they are confident the verdict is wrong. Everyone else is better off accepting the AI verdict.

---

## Future: Multi-Level Escalation

v1 implements **single-level disputes** — one challenge, one re-run, done. Future versions may add **multi-level escalation**:

- **Level 1**: Standard dispute (6 agents, as described above)
- **Level 2**: Expanded jury (add 3 standby agents, total 9)
- **Level 3**: Human override (rare — only for catastrophic protocol failures)

This creates a **progressive trust ladder**: most disputes resolve at Level 1, edge cases escalate, and the human option exists only as a last resort.

---

## Summary

| Property | Value |
|----------|-------|
| Challenge window | 6 hours post-verdict |
| Stake basis | Proportional to market volume (~1%) |
| Evidence requirement | New, relevant, verifiable |
| Re-run mechanism | Full 6-agent consensus with expanded evidence |
| Resolution | Smart contract enforced on TRON |
| Disincentive | Frivolous challenges lose stake |
| Future capability | Multi-level escalation (9+ agents) |
