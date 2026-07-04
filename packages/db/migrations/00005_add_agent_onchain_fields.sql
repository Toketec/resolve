-- ─────────────────────────────────────────────────────────────
-- RESOLVE — 迁移 00005: Agents 表添加链上部署字段
-- ─────────────────────────────────────────────────────────────
-- 在 Supabase Dashboard → SQL Editor 中执行（在 00002 之后）
-- 部署 AgentRegistry 合约后，运行 sync-agents-to-db.js 填充以下字段
-- ─────────────────────────────────────────────────────────────

ALTER TABLE agents
  ADD COLUMN IF NOT EXISTS tron_address       TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deployment_tx_hash TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS registry_contract  TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deployment_status  TEXT DEFAULT 'pending'
    CHECK (deployment_status IN ('pending', 'deployed', 'failed')),
  ADD COLUMN IF NOT EXISTS deployed_at        TIMESTAMPTZ DEFAULT NULL;

-- 索引：按部署状态筛选
CREATE INDEX IF NOT EXISTS idx_agents_deployment_status ON agents (deployment_status);

COMMENT ON COLUMN agents.tron_address       IS 'Agent 在 TRON 链上注册的地址';
COMMENT ON COLUMN agents.deployment_tx_hash IS '注册交易哈希（Shasta 测试网可查）';
COMMENT ON COLUMN agents.registry_contract  IS 'AgentRegistry 合约地址';
COMMENT ON COLUMN agents.deployment_status  IS '部署状态: pending | deployed | failed';
COMMENT ON COLUMN agents.deployed_at        IS '部署/注册完成时间';
