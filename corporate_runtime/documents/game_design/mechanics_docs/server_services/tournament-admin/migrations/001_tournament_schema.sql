CREATE TABLE IF NOT EXISTS tournaments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT,
  start_at TIMESTAMP WITH TIME ZONE,
  format TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID REFERENCES tournaments(id),
  player1 UUID,
  player2 UUID,
  status TEXT DEFAULT 'scheduled',
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  sideboard_changes JSONB DEFAULT '[]'::jsonb,
  match_log JSONB DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS banned_list (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id INT,
  reason TEXT,
  effective_from TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS match_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  player_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS match_disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'OPEN',
  resolution JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_matches_tournament ON matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_match_logs_match ON match_logs(match_id);
CREATE INDEX IF NOT EXISTS idx_match_disputes_match ON match_disputes(match_id);
