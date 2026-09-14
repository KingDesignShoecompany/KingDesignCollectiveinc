-- 010_card_catalog_seed.sql
-- Full Aura Champions card catalog: 100 monsters (card_id 1..100) + 50 equipment (101..150).
-- Idempotent: existing rows (incl. test cards 50/75) are preserved via ON CONFLICT DO NOTHING.
-- Elements: 0=Solar 1=Lunar 2=Void 3=Stellar 4=Terra (from design doc).

-- Monsters: deterministic, element-rotated, stats scale with id.
INSERT INTO card_registry (card_uid, card_id, card_type, checksum, immutable_data)
SELECT
  'AURA' || lpad(to_hex(m::int), 8, '0') || lpad(to_hex((m*2654435761)::bigint & 4294967295), 8, '0'),
  m,
  'monster',
  md5('monster-' || m::text),
  jsonb_build_object(
    'cardId', m,
    'name', 'Monster #' || m,
    'element', (m % 5),
    'rarity', (m % 5) + 1,
    'stats', jsonb_build_object(
      'hp', 80 + (m % 20) * 5,
      'atk', 30 + (m % 15) * 3,
      'def', 25 + (m % 12) * 3,
      'spd', 10 + (m % 10) * 2
    ),
    'abilities', jsonb_build_array('AbilityA', 'AbilityB', 'AbilityC', 'AbilityD')
  )
FROM generate_series(1, 100) AS m
ON CONFLICT (card_uid) DO NOTHING;

-- Equipment: 50 items, card_id 101..150.
INSERT INTO card_registry (card_uid, card_id, card_type, checksum, immutable_data)
SELECT
  'EQPT' || lpad(to_hex(e::int), 8, '0') || lpad(to_hex((e*40503)::bigint & 4294967295), 8, '0'),
  e,
  'equipment',
  md5('equipment-' || e::text),
  jsonb_build_object(
    'itemId', e,
    'name', 'Gear #' || e,
    'type', (e % 4),
    'rarity', (e % 5) + 1,
    'element', (e % 5),
    'statBonuses', jsonb_build_object(
      'atk', (e % 10) * 2,
      'def', (e % 8) * 2,
      'spd', (e % 6)
    )
  )
FROM generate_series(101, 150) AS e
ON CONFLICT (card_uid) DO NOTHING;
