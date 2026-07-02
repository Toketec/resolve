-- ─────────────────────────────────────────────────────────────
-- RESOLVE — 迁移 00002: 添加 Agents 表 + 6 个 Agent 种子数据
-- ─────────────────────────────────────────────────────────────
-- 在 Supabase Dashboard → SQL Editor 中执行（在 00001 之后）
-- ─────────────────────────────────────────────────────────────

-- =============================================================
-- 表 5: agents — AI Agent 定义（6 个预设 Agent）
-- =============================================================
CREATE TABLE IF NOT EXISTS agents (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id      TEXT UNIQUE NOT NULL,            -- 唯一标识，如 "bull-1"
  name          TEXT NOT NULL,                   -- 显示名称，如 "BULL-1"
  role          TEXT NOT NULL,                   -- 角色标识，如 "exchange-oracle"
  role_label    TEXT NOT NULL,                   -- 角色标签，如 "Exchange Oracle"
  tier          TEXT NOT NULL CHECK (tier IN ('active', 'standby')),
  stance        TEXT NOT NULL DEFAULT 'NEUT' CHECK (stance IN ('BULL', 'BEAR', 'NEUT')),
  weight        NUMERIC(3, 2) NOT NULL DEFAULT 1.0,
  description   TEXT NOT NULL DEFAULT '',
  provider      TEXT NOT NULL DEFAULT 'claude',  -- 推理提供商: 'claude' | 'bai' | 'mock'
  status        TEXT NOT NULL DEFAULT 'idle'     -- 'idle' | 'thinking' | 'voted'
                  CHECK (status IN ('idle', 'thinking', 'voted')),
  confidence    NUMERIC(5, 4) DEFAULT 0,         -- 最近投票置信度
  last_vote     TEXT DEFAULT NULL,               -- 'YES' | 'NO' | 'ABSTAIN' | null
  evidence_summary TEXT DEFAULT '',
  ba_8004_id    TEXT DEFAULT NULL,               -- B.AI 8004 身份 ID
  powered_by    TEXT DEFAULT 'Claude',            -- 展示用: 'Claude' | 'B.AI' | 'Mock'
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_agents_agent_id ON agents (agent_id);
CREATE INDEX IF NOT EXISTS idx_agents_tier ON agents (tier);

-- 触发器：自动更新 updated_at
CREATE TRIGGER trg_agents_updated_at
  BEFORE UPDATE ON agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================
-- 种子数据：6 个 Agent（全部 ACTIVE — 无 STANDBY 层）
-- =============================================================
INSERT INTO agents (agent_id, name, role, role_label, tier, stance, weight, description, provider, powered_by, sort_order) VALUES
  ('bull-1',  'BULL-1',  'exchange-oracle',  'Exchange Oracle',  'active', 'BULL', 1.0, 'Technical analysis agent specializing in BTC price trends, trading volume, and HTX order book signals. Provisioned with real-time HTX market data.',  'openai', 'GPT + HTX', 1),
  ('bull-2',  'BULL-2',  'tech-oracle',      'Tech Oracle',      'active', 'BULL', 0.8, 'Fundamentals agent tracking TEE/L2 adoption, network throughput, and developer activity for a technology-driven bullish read.',  'openai', 'GPT', 2),
  ('bear-1',  'BEAR-1',  'media-oracle',     'Media Oracle',     'active', 'BEAR', 0.8, 'Fundamental analysis agent focusing on news sentiment, regulatory developments, and macro risks. Uses curated evidence set for balanced assessment.',  'openai', 'GPT', 3),
  ('bear-2',  'BEAR-2',  'regulation-oracle','Regulation Oracle', 'active', 'BEAR', 0.8, 'Global regulatory agent monitoring SEC, MiCA, and cross-border policy for downside risk to the thesis.',  'openai', 'GPT', 4),
  ('neut-1',  'NEUT-1',  'onchain-oracle',   'Onchain Oracle',   'active', 'NEUT', 0.9, 'Data-driven neutral analysis agent examining on-chain holdings, whale movements, and exchange net flows for impartial assessment.',  'openai', 'GPT', 5),
  ('neut-2',  'NEUT-2',  'macro-oracle',     'Macro Oracle',     'active', 'NEUT', 0.9, 'Macro agent weighing rates, liquidity, and geopolitics for a probabilistic neutral stance.',  'openai', 'GPT', 6)
ON CONFLICT (agent_id) DO NOTHING;
