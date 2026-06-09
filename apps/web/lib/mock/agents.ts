import type { Agent } from "@/lib/types";

export const MOCK_AGENTS: Agent[] = [
  {
    id: "agt_a3",
    callsign: "ORACLE-A3",
    name: "Exchange Sentinel",
    kind: "exchange-oracle",
    description:
      "Aggregates spot + perp data across major exchanges. Cross-checks Binance, OKX, Coinbase, Kraken and HTX feeds via signed timestamps.",
    modelHint: "Claude 4.7 · B.AI",
    region: "ap-south-1",
    uptimePct: 0.9994,
    resolutions: 4181,
    accuracyPct: 0.987,
    avgConfidence: 0.94,
    status: "online",
  },
  {
    id: "agt_b1",
    callsign: "ORACLE-B1",
    name: "Wire Reader",
    kind: "media-oracle",
    description:
      "Reads global news wires, official press releases, and verified social. Weights sources by historical reliability and citation graph.",
    modelHint: "Claude 4.7 · GPT-5",
    region: "eu-west-2",
    uptimePct: 0.9981,
    resolutions: 3722,
    accuracyPct: 0.961,
    avgConfidence: 0.89,
    status: "online",
  },
  {
    id: "agt_c2",
    callsign: "ORACLE-C2",
    name: "Chain Witness",
    kind: "onchain-oracle",
    description:
      "Indexes blockchain state across L1s + L2s. Verifies on-chain outcomes via transaction inclusion + finality proofs.",
    modelHint: "Claude Haiku · B.AI",
    region: "us-east-1",
    uptimePct: 0.9999,
    resolutions: 6204,
    accuracyPct: 0.994,
    avgConfidence: 0.97,
    status: "online",
  },
  {
    id: "agt_s4",
    callsign: "ORACLE-S4",
    name: "Field Reporter",
    kind: "sports-feed",
    description:
      "Pulls from official league APIs, broadcaster scoreboards, and verified referee decisions. Specialised in match-grain events.",
    modelHint: "Claude 4.7",
    region: "us-west-2",
    uptimePct: 0.9967,
    resolutions: 2890,
    accuracyPct: 0.978,
    avgConfidence: 0.92,
    status: "online",
  },
  {
    id: "agt_w5",
    callsign: "ORACLE-W5",
    name: "Atmosphere",
    kind: "weather-feed",
    description:
      "Reads NOAA / ECMWF / JMA observation stations and reconciles with satellite imagery for binary weather outcomes.",
    modelHint: "Claude 4.7 · B.AI",
    region: "eu-central-1",
    uptimePct: 0.9978,
    resolutions: 1611,
    accuracyPct: 0.969,
    avgConfidence: 0.91,
    status: "syncing",
  },
  {
    id: "agt_e6",
    callsign: "ORACLE-E6",
    name: "Ballot Watch",
    kind: "election-monitor",
    description:
      "Monitors election commissions, AP/Reuters race calls, and verified precinct returns for political markets.",
    modelHint: "Claude 4.7 · GPT-5",
    region: "us-east-1",
    uptimePct: 0.9991,
    resolutions: 743,
    accuracyPct: 0.984,
    avgConfidence: 0.93,
    status: "online",
  },
];

export function agentById(id: string) {
  return MOCK_AGENTS.find((a) => a.id === id);
}
