# ⟁ RESOLVE: Privacy Policy

## What data we collect and how we use it

> **Version**: 1.0 · **Date**: July 2026  
> **Scope**: This policy applies to the RESOLVE application accessible at `resolve-prediction.vercel.app`

---

## 1. What We Collect

RESOLVE is a prediction market platform built on a hybrid Web2 + Web3 architecture. We collect only the data necessary to operate the platform.

### 1.1 Wallet Address

When you connect your TronLink wallet to use RESOLVE, we store your **TRON wallet address** (e.g., `TXYZ...`) in our Supabase PostgreSQL database. This is used to:

- Display your positions and trade history on the portfolio page
- Record your participation in market settlement
- Link on-chain transactions to your account

**We never store your private keys.** Your private keys remain in your TronLink wallet at all times. We only receive the public wallet address after you sign a connection request.

### 1.2 Prediction Market Activity

We record the following activity associated with your wallet address:

- Markets you create (title, description, resolution criteria, expiry)
- Positions you take (market, side, amount) — stored for display and settlement
- Consensus votes and evidence logs from AI agent deliberation

This data is stored in Supabase PostgreSQL and linked to your wallet address via a `wallet_address` foreign key.

### 1.3 Website Usage Data

We use Vercel's built-in analytics to collect anonymous usage data:

- Page views, referrer, browser type, device type
- General geographic region (country level only)
- Session duration and interaction patterns

This data is **aggregated and anonymized** — it cannot be linked back to your wallet address or personal identity.

### 1.4 Blockchain Data

When you interact with RESOLVE's smart contracts on the TRON Shasta testnet:

- Your wallet address and transaction hashes are publicly visible on the TRON blockchain (Shasta explorer)
- Settlement transaction data is permanently recorded on-chain
- AI agent identity data registered via B.AI 8004 protocol is on-chain and publicly verifiable

**We have no ability to delete or modify on-chain data** — blockchain immutability is a feature, not a bug.

---

## 2. How We Use Your Data

| Data | Purpose | Legal Basis |
|:-----|:--------|:-----------|
| Wallet address | Identity, position display, settlement | Contractual necessity (operate the service) |
| Market activity | Core product functionality | Contractual necessity |
| Usage analytics | Improve UX, fix bugs | Legitimate interest |
| On-chain data | Trust-minimized settlement | Public blockchain transparency |

**We do not:**
- Sell your data to third parties
- Use your data for advertising or profiling
- Share your wallet address with unrelated third parties
- Analyze your trading patterns for any purpose beyond displaying your portfolio

---

## 3. Third-Party Services

RESOLVE relies on the following third-party services:

| Service | Role | Data Shared | Privacy Policy |
|:--------|:-----|:------------|:---------------|
| **Supabase** | Database & authentication | Wallet address, market activity | [supabase.com/privacy](https://supabase.com/privacy) |
| **Vercel** | Hosting & analytics | Anonymous usage data | [vercel.com/privacy](https://vercel.com/privacy) |
| **TRON** (Shasta testnet) | Blockchain settlement | Public wallet address, tx hashes | [tron.network/privacy](https://tron.network/privacy) |
| **B.AI** | Agent compute & identity | Agent inference prompts (no user PII) | [b.ai/privacy](https://b.ai/privacy) |
| **Claude (Anthropic)** | AI agent reasoning | Market evidence text (no user PII) | [anthropic.com/privacy](https://anthropic.com/privacy) |

AI agent inference calls use **market resolution criteria and public data only** — your wallet address, personal information, and trade history are never sent to LLM providers.

---

## 4. Data Retention

| Data Type | Retention Period | Rationale |
|:----------|:----------------:|:----------|
| Market metadata & positions | Indefinite (while platform operates) | Core product state |
| Wallet→position associations | Indefinite | Portfolio display & settlement audit |
| On-chain settlement data | Permanent (immutable ledger) | Blockchain property |
| Anonymous usage analytics | 12 months rolling | Product improvement |
| Server logs | 30 days | Debugging & security |

You can request deletion of your off-chain data at any time by contacting the team. On-chain data cannot be deleted.

---

## 5. Your Rights

You have the right to:

1. **Access**: Request a copy of all data associated with your wallet address
2. **Rectification**: Correct any inaccurate data we hold
3. **Deletion**: Request deletion of your off-chain data (we will anonymize or remove Supabase records)
4. **Portability**: Export your position and market history
5. **Objection**: Object to our processing of your data for any purpose

To exercise these rights, reach out via the contact methods in Section 7.

**Important limitation**: Data recorded on the TRON blockchain (settlement transactions, 8004 registrations) cannot be altered or deleted — this is inherent to the blockchain architecture we rely on for trust-minimized settlement.

---

## 6. Security

We implement the following security measures:

- **No private keys stored** — wallet interaction happens entirely client-side via TronLink
- **No PII in LLM prompts** — AI agents only receive market data, never user information
- **API routes validate signatures** — every server action requires a valid wallet signature
- **Supabase Row-Level Security** — users can only access their own position data
- **Vercel deployment** — HTTPS enforced, DDoS protection included
- **Regular dependency audits** — pnpm audit run on each deployment

That said, RESOLVE is a **hackathon project in active development**. We recommend:

- Using only testnet tokens (Shasta TRX)
- Not depositing real assets
- Treating the platform as experimental

---

## 7. Contact

RESOLVE is built by a team of developers for the HTX Genesis Hackathon.

For privacy-related inquiries:
- **GitHub**: [repository link]
- **X/Twitter**: [@resolve_prediction]

We aim to respond to privacy requests within 7 business days.

---

## 8. Changes to This Policy

This privacy policy may be updated as the platform evolves. Changes will be:

1. Posted on this page with an updated version number and date
2. Noted in the application's footer

Last updated: July 2026 · Version 1.0

---

*This privacy policy is provided for transparency regarding the HTX Genesis Hackathon entry. It is not legal advice and does not create any binding contractual obligations.*
