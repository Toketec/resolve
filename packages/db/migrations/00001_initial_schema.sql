-- ─────────────────────────────────────────────────────────────
-- RESOLVE — Supabase 初始 Schema 迁移
-- ─────────────────────────────────────────────────────────────
-- 在 Supabase Dashboard → SQL Editor 中执行
-- 使用方法: 打开你的 Supabase 项目 SQL Editor 并执行
--           粘贴此文件全部内容并运行
-- ─────────────────────────────────────────────────────────────

-- 1. 启用扩展（UUID 生成）
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================
-- 表 1: markets — 预测市场定义
-- =============================================================
CREATE TABLE IF NOT EXISTS markets (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug          TEXT UNIQUE NOT NULL,          -- 唯一 URL 标识，如 "btc-150k-eoy"
  question      TEXT NOT NULL,                  -- 市场问题，如 "Will BTC close above $150K by Dec 31, 2026?"
  description   TEXT NOT NULL DEFAULT '',        -- 详细描述
  status        TEXT NOT NULL DEFAULT 'active'  -- 'active' | 'resolving' | 'resolved' | 'settled'
                  CHECK (status IN ('active', 'resolving', 'resolved', 'settled')),
  expires_at    TIMESTAMPTZ,                     -- 到期时间（不早于此时间触发 resolve）
  resolved_outcome TEXT,                         -- 'YES' | 'NO' | null
  settlement_tx_hash TEXT,                       -- 结算交易哈希（TRON）
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_markets_slug ON markets (slug);
CREATE INDEX IF NOT EXISTS idx_markets_status ON markets (status);

-- 触发器：自动更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_markets_updated_at
  BEFORE UPDATE ON markets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================
-- 表 2: positions — 用户仓位（购入记录）
-- =============================================================
CREATE TABLE IF NOT EXISTS positions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  market_id     UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,                  -- TRON 钱包地址
  side          TEXT NOT NULL CHECK (side IN ('YES', 'NO')),
  amount        NUMERIC(20, 6) NOT NULL,         -- 购入金额（USDD）
  tx_hash       TEXT NOT NULL DEFAULT '',         -- TRON 交易哈希
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_positions_market ON positions (market_id);
CREATE INDEX IF NOT EXISTS idx_positions_wallet ON positions (wallet_address);

-- =============================================================
-- 表 3: agent_consensus — AI 共识结果（每次 resolve 产生一条）
-- =============================================================
CREATE TABLE IF NOT EXISTS agent_consensus (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  market_id       UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  outcome         TEXT NOT NULL CHECK (outcome IN ('YES', 'NO', 'UNCERTAIN')),
  yes_votes       INTEGER NOT NULL DEFAULT 0,
  no_votes        INTEGER NOT NULL DEFAULT 0,
  yes_confidence  NUMERIC(5, 4) NOT NULL DEFAULT 0,  -- 看多方加权置信度 [0,1]
  no_confidence   NUMERIC(5, 4) NOT NULL DEFAULT 0,   -- 看空方加权置信度 [0,1]
  consensus_score NUMERIC(5, 4) NOT NULL DEFAULT 0,   -- 最终共识得分 [0,1]
  threshold       NUMERIC(5, 4) NOT NULL DEFAULT 0.65, -- 共识阈值
  total_agents    INTEGER NOT NULL DEFAULT 0,
  active_agents   INTEGER NOT NULL DEFAULT 0,          -- 实际参与推理的 Agent 数
  evidence_summary JSONB DEFAULT '{}'::jsonb,          -- 汇总证据摘要
  triggered_by    TEXT NOT NULL DEFAULT 'manual',       -- 'manual' | 'auto' | 'admin'
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consensus_market ON agent_consensus (market_id);

-- =============================================================
-- 表 4: agent_votes — 单个 Agent 的投票记录
-- =============================================================
CREATE TABLE IF NOT EXISTS agent_votes (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consensus_id  UUID NOT NULL REFERENCES agent_consensus(id) ON DELETE CASCADE,
  agent_name    TEXT NOT NULL,                    -- 如 "BULL-1"
  agent_role    TEXT NOT NULL,                    -- 如 "Exchange Oracle"
  vote          TEXT NOT NULL CHECK (vote IN ('YES', 'NO', 'ABSTAIN')),
  confidence    NUMERIC(5, 4) NOT NULL DEFAULT 0.5, -- [0,1]
  evidence      TEXT NOT NULL DEFAULT '',           -- Agent 引用的证据
  status        TEXT NOT NULL DEFAULT 'active'      -- 'active' | 'standby'
                  CHECK (status IN ('active', 'standby')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_votes_consensus ON agent_votes (consensus_id);

-- =============================================================
-- Row Level Security (RLS) — 公开可读，仅服务端可写
-- =============================================================

-- 全部开放可读（Demo 阶段无需身份认证）
ALTER TABLE markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_consensus ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_votes ENABLE ROW LEVEL SECURITY;

-- 注意：由于 Demo 阶段不使用 Supabase Auth，
-- anon key 在服务端（API Routes）和管理员 SQL 中直接操作。
-- 如需在浏览器端用 JS 直接读写，需改为：
--   CREATE POLICY "public_read" ON markets FOR SELECT USING (true);
--   CREATE POLICY "service_role_all" ON markets FOR ALL USING (auth.role() = 'service_role');
-- 但目前所有 API 经 Next.js API Routes 代理，不直接暴露 Supabase anon。

-- =============================================================
-- 种子数据：英雄市场
-- =============================================================
INSERT INTO markets (slug, question, description, status, expires_at)
VALUES (
  'btc-150k-eoy',
  'Will Bitcoin close above $150,000 by Dec 31, 2026?',
  'The flagship market for the RESOLVE genesis hackathon demo. Multiple AI agents independently analyze on-chain data, market sentiment, and macro indicators to reach a consensus on whether Bitcoin will surpass the $150,000 threshold by year-end 2026.',
  'active',
  '2026-12-31T23:59:59Z'
)
ON CONFLICT (slug) DO NOTHING;
