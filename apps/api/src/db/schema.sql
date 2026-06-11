-- Developer Life Dashboard — PostgreSQL Schema
-- Run: psql $DATABASE_URL -f schema.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Users ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  github_id     BIGINT UNIQUE NOT NULL,
  username      VARCHAR(255) NOT NULL,
  email         VARCHAR(255),
  display_name  VARCHAR(255),
  avatar_url    TEXT,
  github_token  TEXT,
  timezone      VARCHAR(60) DEFAULT 'UTC',
  settings      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_github_id ON users(github_id);

-- ─── Platform connections ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS platform_connections (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform       VARCHAR(50) NOT NULL,
  username       VARCHAR(255) NOT NULL,
  access_token   TEXT,
  refresh_token  TEXT,
  metadata       JSONB NOT NULL DEFAULT '{}',
  sync_enabled   BOOLEAN NOT NULL DEFAULT TRUE,
  connected_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_synced_at TIMESTAMPTZ,
  UNIQUE(user_id, platform)
);

CREATE INDEX IF NOT EXISTS idx_platform_connections_user ON platform_connections(user_id);

-- ─── Activities ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS activities (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform      VARCHAR(50) NOT NULL,
  activity_type VARCHAR(100) NOT NULL,
  activity_date DATE NOT NULL,
  count         INTEGER NOT NULL DEFAULT 1,
  score         FLOAT NOT NULL DEFAULT 1.0,
  metadata      JSONB NOT NULL DEFAULT '{}',
  external_id   VARCHAR(512),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE NULLS NOT DISTINCT (user_id, platform, activity_type, activity_date, external_id)
);

CREATE INDEX IF NOT EXISTS idx_activities_user_date    ON activities(user_id, activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_activities_platform     ON activities(user_id, platform, activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_activities_type         ON activities(user_id, activity_type, activity_date DESC);

-- ─── Streaks ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS streaks (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  streak_type       VARCHAR(50) NOT NULL,
  current_streak    INTEGER NOT NULL DEFAULT 0,
  longest_streak    INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  streak_start_date  DATE,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, streak_type)
);

CREATE INDEX IF NOT EXISTS idx_streaks_user ON streaks(user_id);

-- ─── Goals ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS goals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title         VARCHAR(255) NOT NULL,
  description   TEXT,
  goal_type     VARCHAR(50) NOT NULL,
  platform      VARCHAR(50),
  target_value  FLOAT NOT NULL,
  current_value FLOAT NOT NULL DEFAULT 0,
  deadline      DATE,
  status        VARCHAR(20) NOT NULL DEFAULT 'active'
                CHECK (status IN ('active', 'completed', 'failed', 'paused')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_goals_user_status ON goals(user_id, status);

-- ─── Achievements ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS achievements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_key VARCHAR(100) NOT NULL,
  title           VARCHAR(255) NOT NULL,
  description     TEXT NOT NULL DEFAULT '',
  icon            VARCHAR(100) NOT NULL DEFAULT '🏆',
  earned_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata        JSONB NOT NULL DEFAULT '{}',
  UNIQUE(user_id, achievement_key)
);

CREATE INDEX IF NOT EXISTS idx_achievements_user ON achievements(user_id, earned_at DESC);

-- ─── Sync jobs ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sync_jobs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform       VARCHAR(50) NOT NULL,
  status         VARCHAR(20) NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  started_at     TIMESTAMPTZ,
  completed_at   TIMESTAMPTZ,
  records_synced INTEGER NOT NULL DEFAULT 0,
  error_message  TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sync_jobs_user ON sync_jobs(user_id, platform, created_at DESC);

-- ─── Auto-update timestamps ───────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER goals_updated_at
  BEFORE UPDATE ON goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
