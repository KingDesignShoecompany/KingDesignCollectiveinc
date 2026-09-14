#!/usr/bin/env bash
# Minimal test scaffold: assumes local test server exposes POST /checkTrinity
API="http://localhost:3000"
cat > /tmp/trinity_state.json <<'JSON'
{
  "teams": [
    {
      "monsters": [
        {"card_id": 50, "hp": 100},
        {"card_id": 75, "hp": 100},
        {"card_id": 100, "hp": 100}
      ],
      "equipment": [{"item_card_id": 50}]
    }
  ],
  "trinityState": "inactive"
}
JSON
curl -s -X POST "$API/checkTrinity" -H "Content-Type: application/json" -d '{"battleId":"test","teamIndex":0}' | jq .
