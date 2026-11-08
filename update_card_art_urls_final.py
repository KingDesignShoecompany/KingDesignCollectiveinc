#!/usr/bin/env python3
"""
Update 011_card_art_urls.sql to include 3D art URLs for Legendary cards.
Also create card back art reference.
"""
import os

# Read existing SQL
sql_path = r"C:\Users\young\agents\hermes_skills\aura-backend-master\migrations\011_card_art_urls.sql"
with open(sql_path, "r") as f:
    sql = f.read()

art_dir = r"C:\Users\young\agents\aura_champions_card_art\art_raw"

# Legendary cards (rarity 5 = card_id % 5 == 4)
legendary_cards = [m for m in range(1, 101) if m % 5 == 4]
legendary_cards += [e for e in range(101, 151) if e % 5 == 4]

# Trinity cards
trinity_cards = [50, 75, 100]

# Build 3D art URL updates
legendary_updates = []

for card_id in legendary_cards:
    check_path = os.path.join(art_dir, f"legendary_3d_card_{card_id}.png")
    web_path = f"/aura_champions_card_art/art_raw/legendary_3d_card_{card_id}.png"
    if os.path.exists(check_path):
        legendary_updates.append(f"    WHEN {card_id} THEN '{web_path}'")

for card_id in trinity_cards:
    check_path = os.path.join(art_dir, f"trinity_card_{card_id}.png")
    web_path = f"/aura_champions_card_art/art_raw/trinity_card_{card_id}.png"
    if os.path.exists(check_path):
        legendary_updates.append(f"    WHEN {card_id} THEN '{web_path}'")

# Build UPDATE for 3D art
update_3d = f"""
-- Update art_url_3d for Legendary and Trinity event cards with 3D renders
UPDATE card_catalog
SET immutable_data = jsonb_set(
    immutable_data,
    '{{art_url_3d}}',
    to_jsonb(
        CASE card_id
{chr(10).join(legendary_updates)}
        ELSE immutable_data->>'art_url_3d'
        END
    )
)
WHERE card_id IN ({', '.join(str(c) for c in legendary_cards + trinity_cards)});
"""

# Append to existing SQL
with open(sql_path, "a") as f:
    f.write(update_3d)

print(f"Appended {len(legendary_updates)} 3D art URL updates")
print(f"Legendary cards checked: {len(legendary_cards)}")
print(f"Trinity cards checked: {len(trinity_cards)}")
