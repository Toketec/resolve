# RESOLVE

## Overview

RESOLVE is an AI-native prediction market powered by decentralized AI consensus.

Unlike traditional prediction markets that rely on centralized or human-operated oracle systems, RESOLVE uses multiple AI agents to validate, monitor, and automatically resolve prediction markets.

Users can create markets about:

- Crypto
- Sports
- Politics
- Weather
- Technology
- Finance
- Entertainment

Participants trade YES/NO positions while liquidity providers earn fees.

When a market expires, AI agents independently gather evidence, evaluate outcomes, reach consensus, and automatically settle the market.

The goal is to create a prediction market where AI becomes the oracle layer.

---

# Hackathon Alignment (HTX Genesis Hackathon)

The project is designed for the HTX Genesis Hackathon and must be aligned with HTX ecosystem requirements.

IMPORTANT: Before final implementation, the team must research HTX ecosystem resources such as:
- HTX APIs
- HTX wallet integration
- HTX token utility ($HTX model)
- B.AI compute infrastructure
- HTX developer tools and authentication systems

This is NOT optional. The architecture should be updated after research.

---

# Core Idea

A prediction market like Polymarket, but:

Instead of humans/oracles resolving outcomes,
we use decentralized AI agents running on HTX/B.AI compute.

AI replaces the oracle layer.

---

# Core Flow

1. User creates a prediction market
2. Users trade YES/NO positions
3. Liquidity providers fund markets
4. Market expires
5. AI agents gather evidence
6. AI agents reach consensus
7. Smart settlement resolves market

---

# AI Resolution System

Multiple agents:

- Agent A: official APIs + exchanges
- Agent B: news + media sources
- Agent C: blockchain + on-chain data

Output:

{
  outcome: "YES",
  confidence: 0.97,
  evidence: []
}

If consensus >= threshold → resolve automatically
Else → community dispute mode

---

# Tech Stack

Frontend:
- Next.js (App Router)
- Tailwind
- TypeScript

Backend:
- Next.js API routes

Database:
- PostgreSQL (local dev via Docker)
- Prisma ORM

AI Layer:
- OpenAI / Claude (MVP)
- B.AI compute (hackathon target)

---

# API Routes

- GET /api/markets
- POST /api/markets
- GET /api/markets/[id]
- POST /api/trades
- POST /api/resolve
- POST /api/ai/resolve

---

# Database Models

User:
- id
- walletAddress
- email

Market:
- id
- title
- description
- resolutionCriteria
- expiration
- status

Position:
- id
- marketId
- userId
- side (YES/NO)
- amount

---

# MVP Scope

Must have:
- Market creation
- Trading (YES/NO)
- Market listing
- AI resolution simulation
- Settlement logic

Skip:
- Full smart contracts (mock first)
- Cross-chain complexity

---

# Why This Wins Hackathon

- Strong AI × Web3 narrative
- Clear HTX ecosystem dependency (AI compute + APIs)
- Fully demo-able MVP in Next.js
- Unique AI oracle replacement system
- High commercial potential

---

# One-line Summary

RESOLVE is an AI-native prediction market where decentralized AI agents replace traditional oracles and automatically resolve outcomes on-chain.
