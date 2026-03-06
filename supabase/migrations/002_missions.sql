-- ─────────────────────────────────────────
-- Module Veille Missions
-- À coller dans Supabase → SQL Editor → Run
-- ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS mission_sources (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  platform text NOT NULL DEFAULT 'rss',  -- rss | linkedin | malt | upwork | custom
  feed_url text,
  keywords text[] DEFAULT '{}',
  active boolean DEFAULT true,
  api_key text,
  api_config jsonb DEFAULT '{}',
  last_fetched_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS missions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  source_id uuid REFERENCES mission_sources(id) ON DELETE SET NULL,
  platform text NOT NULL DEFAULT 'rss',
  title text NOT NULL,
  description text,
  skills text[] DEFAULT '{}',
  budget_min numeric,
  budget_max numeric,
  location text,
  remote boolean DEFAULT true,
  url text,
  published_at timestamptz,
  fetched_at timestamptz DEFAULT now(),
  status text DEFAULT 'new',  -- new | seen | saved | dismissed
  UNIQUE(user_id, url)
);

CREATE TABLE IF NOT EXISTS mission_preferences (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  tech_stack text[] DEFAULT '{}',
  excluded_keywords text[] DEFAULT '{}',
  min_budget numeric,
  max_budget numeric,
  remote_only boolean DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE mission_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_sources" ON mission_sources FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_missions" ON missions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_prefs" ON mission_preferences FOR ALL USING (auth.uid() = user_id);
