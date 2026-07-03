-- =============================================================
-- RESOLVE — AMM + Sell 功能 Schema 迁移
-- =============================================================
-- 变更内容:
--   1. 新增 trades 表（交易历史记录）
--   2. 迁移 positions 表：从"每笔买入一条记录"改为"(market_id, wallet_address) 唯一余额模型
-- =============================================================

-- =============================================================
-- Part 1: 新增 trades 表
-- =============================================================
CREATE TABLE IF NOT EXISTS trades (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  market_id     UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  side          TEXT NOT NULL CHECK (side IN ('YES', 'NO')),
  type          TEXT NOT NULL CHECK (type IN ('buy', 'sell')),
  shares        NUMERIC(20,6) NOT NULL,
  price         NUMERIC(10,6) NOT NULL,
  usdd_amount   NUMERIC(20,6) NOT NULL,
  fee           NUMERIC(20,6) DEFAULT 0,
  tx_hash       TEXT NOT NULL DEFAULT '',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trades_market ON trades (market_id);
CREATE INDEX IF NOT EXISTS idx_trades_wallet ON trades (wallet_address);
CREATE INDEX IF NOT EXISTS idx_trades_created_at ON trades (created_at);

-- =============================================================
-- Part 2: 迁移 positions 表 — 改为余额模型
-- =============================================================

-- 检测 positions 表是否存在且使用旧 schema（有 side / amount 列）
DO $$
DECLARE
    has_side_col BOOLEAN;
    has_yes_balance_col BOOLEAN;
BEGIN
    -- 检查是否已是新 schema
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'positions' AND column_name = 'yes_balance'
    ) INTO has_yes_balance_col;

    -- 如果已经是新 schema，直接跳过
    IF has_yes_balance_col THEN
        RAISE NOTICE 'positions table already has new schema, skipping migration';
        RETURN;
    END IF;

    -- 检查是否有旧 schema（有 side 列）
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'positions' AND column_name = 'side'
    ) INTO has_side_col;

    IF has_side_col THEN
        -- 旧 schema 存在 → 备份、迁移数据
        RAISE NOTICE 'Migrating positions from old schema to balance model...';

        -- 备份数据
        CREATE TEMP TABLE positions_old AS SELECT * FROM positions;

        -- 删除旧表（CASCADE 清除 FK 引用）
        DROP TABLE positions CASCADE;

        -- 创建新表
        CREATE TABLE positions (
          id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          market_id     UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
          wallet_address TEXT NOT NULL,
          yes_balance   NUMERIC(20,6) DEFAULT 0,
          no_balance    NUMERIC(20,6) DEFAULT 0,
          total_bought  NUMERIC(20,6) DEFAULT 0,
          total_sold    NUMERIC(20,6) DEFAULT 0,
          created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UNIQUE (market_id, wallet_address)
        );

        -- 索引
        CREATE INDEX idx_positions_market_v2 ON positions (market_id);
        CREATE INDEX idx_positions_wallet_v2 ON positions (wallet_address);

        -- 触发器
        CREATE TRIGGER trg_positions_updated_at
          BEFORE UPDATE ON positions
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

        -- 从备份迁移数据
        INSERT INTO positions (market_id, wallet_address, yes_balance, no_balance, total_bought)
        SELECT
          market_id,
          wallet_address,
          SUM(CASE WHEN side = 'YES' THEN amount ELSE 0 END) AS yes_balance,
          SUM(CASE WHEN side = 'NO'  THEN amount ELSE 0 END) AS no_balance,
          SUM(amount) AS total_bought
        FROM positions_old
        GROUP BY market_id, wallet_address;

        -- 清理
        DROP TABLE IF EXISTS positions_old;
        RAISE NOTICE 'Migration complete';
    ELSE
        -- positions 表不存在或为空 → 直接创建新表
        RAISE NOTICE 'positions table missing, creating fresh balance-model table...';

        DROP TABLE IF EXISTS positions CASCADE;

        CREATE TABLE positions (
          id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          market_id     UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
          wallet_address TEXT NOT NULL,
          yes_balance   NUMERIC(20,6) DEFAULT 0,
          no_balance    NUMERIC(20,6) DEFAULT 0,
          total_bought  NUMERIC(20,6) DEFAULT 0,
          total_sold    NUMERIC(20,6) DEFAULT 0,
          created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UNIQUE (market_id, wallet_address)
        );

        CREATE INDEX idx_positions_market_v2 ON positions (market_id);
        CREATE INDEX idx_positions_wallet_v2 ON positions (wallet_address);

        CREATE TRIGGER trg_positions_updated_at
          BEFORE UPDATE ON positions
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- =============================================================
-- RLS: 新表启用（公开可读，服务端写入）
-- =============================================================
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
