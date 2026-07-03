-- 00004_pool_state_sync: 链上池状态快照表
-- 每个市场一行，通过 UNIQUE(market_id) + UPSERT 保证数据最新
-- 由 buy/sell API (即时触发) 或 cron/refresh-pools (兜底刷新) 写入

CREATE TABLE IF NOT EXISTS market_pool_states (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  market_id   UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  yes_price   NUMERIC(10, 8) NOT NULL,
  no_price    NUMERIC(10, 8) NOT NULL,
  yes_supply  NUMERIC(40, 0) NOT NULL,
  no_supply   NUMERIC(40, 0) NOT NULL,
  liquidity   NUMERIC(40, 0) NOT NULL,
  fee_pool    NUMERIC(40, 0) NOT NULL,
  source      TEXT NOT NULL DEFAULT 'chain',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(market_id)
);

CREATE INDEX IF NOT EXISTS idx_pool_states_market ON market_pool_states (market_id);
CREATE INDEX IF NOT EXISTS idx_pool_states_updated ON market_pool_states (updated_at);
