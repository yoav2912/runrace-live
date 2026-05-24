-- RunRace Live — PostgreSQL schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- Users (synced from Supabase/Firebase auth)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_provider_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  level INT NOT NULL DEFAULT 1,
  xp INT NOT NULL DEFAULT 0,
  league TEXT NOT NULL DEFAULT 'bronze' CHECK (league IN ('bronze','silver','gold','platinum','elite')),
  competitive_rank INT NOT NULL DEFAULT 1000,
  trust_score NUMERIC(5,2) NOT NULL DEFAULT 100.00,
  total_races INT NOT NULL DEFAULT 0,
  wins INT NOT NULL DEFAULT 0,
  win_streak INT NOT NULL DEFAULT 0,
  is_banned BOOLEAN NOT NULL DEFAULT FALSE,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  kyc_status TEXT DEFAULT 'none' CHECK (kyc_status IN ('none','pending','verified','rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_stats (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  total_distance_m BIGINT NOT NULL DEFAULT 0,
  total_time_sec BIGINT NOT NULL DEFAULT 0,
  avg_pace_sec_per_km INT,
  best_5k_sec INT,
  best_10k_sec INT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','blocked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(requester_id, addressee_id)
);

CREATE TABLE follows (
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);

CREATE TABLE races (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code CHAR(6) UNIQUE NOT NULL,
  host_id UUID NOT NULL REFERENCES users(id),
  race_type TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'public',
  status TEXT NOT NULL DEFAULT 'lobby',
  target_distance_m INT,
  target_duration_sec INT,
  interval_config JSONB,
  max_participants INT NOT NULL DEFAULT 32,
  countdown_ends_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  weather_snapshot JSONB,
  replay_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE race_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  race_id UUID NOT NULL REFERENCES races(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  final_rank INT,
  distance_m NUMERIC(12,2) NOT NULL DEFAULT 0,
  finish_time TIMESTAMPTZ,
  avg_pace_sec_per_km INT,
  avg_speed_mps NUMERIC(8,3),
  xp_earned INT NOT NULL DEFAULT 0,
  disqualified BOOLEAN NOT NULL DEFAULT FALSE,
  cheat_confidence NUMERIC(5,4),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(race_id, user_id)
);

CREATE TABLE gps_tracks (
  id BIGSERIAL PRIMARY KEY,
  race_id UUID NOT NULL REFERENCES races(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  altitude_m DOUBLE PRECISION,
  accuracy_m DOUBLE PRECISION NOT NULL,
  speed_mps DOUBLE PRECISION,
  heading DOUBLE PRECISION,
  recorded_at TIMESTAMPTZ NOT NULL,
  validated BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_gps_tracks_race_user ON gps_tracks(race_id, user_id, recorded_at);

CREATE TABLE race_replays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  race_id UUID NOT NULL REFERENCES races(id) ON DELETE CASCADE,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE anti_cheat_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  race_id UUID REFERENCES races(id),
  flag_type TEXT NOT NULL,
  confidence NUMERIC(5,4) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE trust_score_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  previous_score NUMERIC(5,2) NOT NULL,
  new_score NUMERIC(5,2) NOT NULL,
  delta NUMERIC(6,2) NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_url TEXT
);

CREATE TABLE user_badges (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, badge_id)
);

CREATE TABLE daily_missions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mission_key TEXT NOT NULL,
  title TEXT NOT NULL,
  progress INT NOT NULL DEFAULT 0,
  target INT NOT NULL,
  xp_reward INT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  mission_date DATE NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE(user_id, mission_key, mission_date)
);

CREATE TABLE tournaments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  entry_fee_cents INT NOT NULL DEFAULT 0,
  prize_pool_cents INT NOT NULL DEFAULT 0,
  sponsored BOOLEAN NOT NULL DEFAULT FALSE,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  balance_cents BIGINT NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  frozen BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID NOT NULL REFERENCES wallets(id),
  amount_cents BIGINT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('deposit','withdrawal','entry_fee','prize','refund','sponsor_reward')),
  reference_id UUID,
  metadata JSONB,
  fraud_flag BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE activity_feed (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  activity_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE clubs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE club_members (
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  PRIMARY KEY (club_id, user_id)
);

CREATE TABLE push_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, token)
);

CREATE TABLE admin_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES users(id),
  action TEXT NOT NULL,
  target_user_id UUID,
  target_race_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_races_status ON races(status);
CREATE INDEX idx_races_code ON races(code);
CREATE INDEX idx_anti_cheat_user ON anti_cheat_logs(user_id, created_at DESC);
