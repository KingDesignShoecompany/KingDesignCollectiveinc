-- 003_players_text.sql
-- player1/player2 are opaque user identifiers (string user-ids used across the
-- anti-cheat / battle-sync flows, e.g. x-user-id). Relax from UUID -> TEXT so
-- non-UUID identifiers are accepted. Idempotent.
ALTER TABLE matches ALTER COLUMN player1 TYPE TEXT USING player1::text;
ALTER TABLE matches ALTER COLUMN player2 TYPE TEXT USING player2::text;
