-- ─────────────────────────────────────────────────────────────
-- RESOLVE — 迁移 00002: 添加 Agents 表 + 6 个 Agent 种子数据
-- ─────────────────────────────────────────────────────────────
-- 在 Supabase Dashboard → SQL Editor 中执行（在 00001 之后）
-- 此文件是 6 个 Agent 的唯一编辑点。mock/agents.ts 为其镜像。
-- ─────────────────────────────────────────────────────────────

-- =============================================================
-- 表 5: agents — AI Agent 定义（6 个预设 Agent）
-- =============================================================
CREATE TABLE IF NOT EXISTS agents (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id        TEXT UNIQUE NOT NULL,            -- 唯一标识，如 "bull-1"
  callsign        TEXT NOT NULL,                   -- 显示简称，如 "BULL-1"
  name            TEXT NOT NULL,                   -- 全名，如 "Exchange Oracle"
  role            TEXT NOT NULL,                   -- 角色标识，如 "exchange-oracle"
  role_label      TEXT NOT NULL,                   -- 角色标签，如 "Exchange Oracle"
  stance          TEXT NOT NULL CHECK (stance IN ('BULL', 'BEAR', 'NEUT')),
  tier            TEXT NOT NULL CHECK (tier IN ('active', 'standby')),
  weight          NUMERIC(3, 1) NOT NULL DEFAULT 1.0,   -- 共识权重
  description     TEXT NOT NULL DEFAULT '',
  model_hint      TEXT NOT NULL DEFAULT '',              -- UI 展示模型名，如 "Claude 4.7 · B.AI"
  provider        TEXT NOT NULL DEFAULT 'claude',        -- 推理提供商
  region          TEXT NOT NULL DEFAULT 'us-east-1',     -- 部署区域
  powered_by      TEXT DEFAULT 'Claude',
  status          TEXT NOT NULL DEFAULT 'idle'
                    CHECK (status IN ('idle', 'thinking', 'voted')),
  confidence      NUMERIC(5, 4) DEFAULT 0,
  last_vote       TEXT DEFAULT NULL,
  evidence_summary TEXT DEFAULT '',
  ba_8004_id      TEXT DEFAULT NULL,
  -- 展示用统计字段
  uptime_pct      NUMERIC(6, 4) NOT NULL DEFAULT 0.9900,
  resolutions     INTEGER NOT NULL DEFAULT 0,
  accuracy_pct    NUMERIC(6, 4) NOT NULL DEFAULT 0.9500,
  avg_confidence  NUMERIC(5, 4) NOT NULL DEFAULT 0.9000,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
INSERT INTO agents (agent_id, callsign, name, role, role_label, stance, tier, weight, description, model_hint, provider, region, powered_by, uptime_pct, resolutions, accuracy_pct, avg_confidence, sort_order) VALUES
  ('bull-1',  'BULL-1',  'Exchange Oracle',  'exchange-oracle',  'Exchange Oracle',  'BULL',  'active',  1.0,
    'Technical analysis agent specializing in BTC price trends, trading volume, and HTX order book signals. Provisioned with real-time HTX market data.',
    'Claude 4.7 · B.AI',  'openai',  'ap-south-1',      'GPT + HTX', 0.9994, 4181, 0.987, 0.94, 1),
  ('bull-2',  'BULL-2',  'Tech Oracle',      'tech-oracle',      'Tech Oracle',      'BULL',  'active',  0.8,
    'Fundamentals agent tracking TEE/L2 adoption, network throughput, and developer activity for a technology-driven bullish read. Supplements BULL-1 with infrastructure-level signals.',
    'Claude 4.7',          'openai',  'eu-west-2',        'GPT',       0.9981, 3240, 0.964, 0.89, 2),
  ('bear-1',  'BEAR-1',  'Media Oracle',     'media-oracle',     'Media Oracle',     'BEAR',  'active',  0.8,
    'Fundamental analysis agent focusing on news sentiment, regulatory developments, and macro risks. Uses a curated evidence set of global news wires and verified social media for balanced assessment.',
    'Claude 4.7 · GPT-5',  'openai',  'us-east-1',        'GPT',       0.9999, 3722, 0.961, 0.88, 3),
  ('bear-2',  'BEAR-2',  'Regulation Oracle','regulation-oracle','Regulation Oracle','BEAR',  'active',  0.8,
    'Global regulatory agent monitoring SEC, MiCA, and cross-border policy for downside risk to the thesis. Specializes in legal and compliance threat detection.',
    'Claude 4.7 · GPT-5',  'openai',  'eu-central-1',     'GPT',       0.9978, 2890, 0.974, 0.91, 4),
  ('neut-1',  'NEUT-1',  'Onchain Oracle',   'onchain-oracle',  'Onchain Oracle',   'NEUT',  'active',  0.9,
    'Data-driven neutral analysis agent examining on-chain holdings, whale movements, and exchange net flows for impartial assessment. No bullish or bearish bias — follows the data.',
    'Claude Haiku · B.AI',  'openai',  'us-west-2',       'GPT',       0.9967, 6204, 0.994, 0.97, 5),
  ('neut-2',  'NEUT-2',  'Macro Oracle',     'macro-oracle',     'Macro Oracle',     'NEUT',  'active',  0.9,
    'Macro agent weighing interest rates, global liquidity, and geopolitical events for a probabilistic neutral stance. Integrates economic indicators without market bias.',
    'Claude 4.7 · GPT-5',  'openai',  'ap-northeast-1',   'GPT',       0.9991, 2114, 0.981, 0.93, 6)
ON CONFLICT (agent_id) DO NOTHING;
