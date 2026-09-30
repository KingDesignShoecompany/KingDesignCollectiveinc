# Client event contract

## TRINITY_ACTIVATED
```json
{
  "eventType": "TRINITY_ACTIVATED",
  "trinityMembers": ["UID_50", "UID_75", "UID_100"],
  "effects": { "statMultiplier": 1.5, "ultimateReady": true },
  "stateVersion": 123
}
```

## TRINITY_CANCELLED
```json
{
  "eventType": "TRINITY_CANCELLED",
  "reason": "member_removed",
  "stateVersion": 124
}
```

## Blueprint behavior
- On `TRINITY_ACTIVATED`: lock input, play VFX, show banner, enable 3-action turn if `sharedConsciousness` is true.
- On `TRINITY_CANCELLED`: unlock input, clear banner, revert buffed stats to pre-trim values from last known server state snapshot.
