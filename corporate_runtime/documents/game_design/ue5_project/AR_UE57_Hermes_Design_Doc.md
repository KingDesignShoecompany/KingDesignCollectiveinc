# Aura Champions: UE 5.7 Design Document — Hermes-Native Architecture

> Reconstructed from `Game guide1.2.docx` and `Aura prompts.docx`.
> All references to Agent Zero / Replit have been replaced with Hermes Agent + local Ollama.
> Corrupted source file: `AR UE 5.7 game document.docx` (contained embedded LLM error traceback).

---

## 1. Game Overview

- **Genre:** AR Turn-Based Tactical Card Battle
- **Players:** 1-2 (Single Player AI, Multiplayer PvP)
- **Cards:** 100 Monster Cards + 50 Equipment Cards
- **NFC Chip:** NTAG216 (888 bytes memory)
- **Platform:** iOS/Android with ARCore/ARKit support
- **Battle Format:** 3v3 Turn-Based
- **Tagline:** "Summon your reality."

---

## 2. Core Gameplay Loop

1. Scan NFC card -> Summon monster
2. 3v3 turn-based tactical combat on 7x7 grid
3. Victory/defeat -> XP/currency
4. Level up / evolve

### Initiative
- Team SPD total determines first mover
- Individual SPD sets action order within team

### Action Phase (per monster)
1. Movement: 0-3 tiles based on SPD
2. Choose ONE action:
   - Basic Attack (100% ATK damage)
   - Special Ability (cooldown applies)
   - Use Item (consumable)
   - Switch Positions (with adjacent ally)
   - Defend (+50% DEF next turn)

### Status Phase
- Apply status effects: burn, freeze, poison, stun
- Process healing over time
- Check victory conditions

---

## 3. Battlefield Layout

```
7x7 Grid:
[ ][ ][ ][N][ ][ ][ ]  - N = Celestial Node (capture point)
[ ][ ][ ][ ][ ][ ][ ]
[ ][ ][ ][ ][ ][ ][ ]  - Center Line
[P1][ ][ ][ ][ ][ ][P2] - Starting Positions
[ ][ ][ ][ ][ ][ ][ ]
```

---

## 4. Victory Conditions

| Condition | Description |
|---|---|
| Elimination | Defeat all 3 enemy monsters |
| Node Control | Hold center celestial node for 3 consecutive turns |
| Timeout | Most total HP after 20 rounds |
| Concession | Opponent surrenders |
| Disqualification | Rule violation |

---

## 5. Damage Calculation

```
Total Damage = (Base ATK + Weapon ATK + Bonus ATK) *
               (1 + Element Bonus%) *
               Ability Multiplier -
               Target DEF * (1 - DEF Penetration%)
```

---

## 6. Elemental Multipliers

| Attacker -> Defender | Solar | Lunar | Void | Stellar | Terra |
|---|---|---|---|---|---|
| Solar | 1.0x | 1.5x | 0.8x | 1.2x | 0.7x |
| Lunar | 0.7x | 1.0x | 1.5x | 1.1x | 1.3x |
| Void | 1.3x | 0.7x | 1.0x | 1.5x | 1.2x |
| Stellar | 0.9x | 1.2x | 0.7x | 1.0x | 1.5x |
| Terra | 1.5x | 0.9x | 1.2x | 0.8x | 1.0x |

---

## 7. Status Effects

| Effect | Duration | Stackable | Damage/Effect | Removal |
|---|---|---|---|---|
| Burn | 3 turns | Yes (3 max) | 5-10% max HP/turn | Water items |
| Freeze | 1-2 turns | No | Skip turns, 2x damage when broken | Fire items |
| Poison | 4 turns | Yes | 3-8% current HP/turn | Healing |
| Stun | 1 turn | No | Skip turn | Time |

---

## 8. Deck Building Rules

| Rule | Description |
|---|---|
| Active Monsters | 3 per battle |
| Reserve Monsters | 3 maximum (for substitutions) |
| Equipment per Monster | 1 Weapon, 1 Armor/Shield, 1 Accessory |
| Consumables per Player | 3 per battle |
| Duplicate Cards | No duplicate monsters in active team |
| Element Balance | Bonus for 3 different elements |

---

## 9. Monster Card Memory Format (NTAG216)

| Field | Bytes |
|---|---|
| Card ID | 4 |
| Monster Name | 16 |
| Lore Description | 50 |
| Element | 1 |
| Rarity | 1 |
| Base Stats (HP/ATK/DEF/SPD) | 16 |
| Abilities (4) | 48 |
| Level Data | 8 |
| Experience | 4 |
| Owner ID | 16 |
| Battle History | 100 |
| Encryption/Checksum | 30 |
| **Total** | **294** |

---

## 10. Equipment Card Memory Format (NTAG216)

| Field | Bytes |
|---|---|
| Item ID | 4 |
| Item Name | 16 |
| Description | 30 |
| Type | 1 |
| Rarity | 1 |
| Element | 1 |
| Stat Bonuses | 16 |
| Special Effect | 30 |
| Cooldown | 1 |
| Usage History | 50 |
| Owner ID | 16 |
| **Total** | **166** |

---

## 11. The Five Celestial Elements

| Element | Domain | Weak Against | Strong Against |
|---|---|---|---|
| Solar | Light, Fire, Energy | Terra-Celestial | Lunar |
| Lunar | Shadow, Water, Emotion | Solar | Void |
| Void | Space, Nothingness, Entropy | Lunar | Stellar |
| Stellar | Stars, Harmony, Time | Void | Terra-Celestial |
| Terra-Celestial | Earth, Gravity, Form | Stellar | Solar |

---

## 12. Technical Specifications

- **Hardware:** iOS/Android with NFC + ARCore/ARKit
- **Recommended:** iPhone 7+ or Android 8.0+ with 4GB RAM
- **UE Version:** 5.7
- **Network:** Local-first with optional backend sync
- **Backend:** Hermes Agent + local Ollama for game logic, anti-cheat, and state verification

---

## 13. Hermes-Native Architecture

### Old Agent Zero Model (Deprecated)
- Agent Zero wrote all backend + client code
- Replit hosted the "source of truth"
- Custom prompt injection for every component

### New Hermes Agent Model
- **Hermes Skills** own each domain:
  - `game-design` skill: UE5 C++, Blueprint, combat logic
  - `crypto-treasury` skill: NFC card registry, anti-cheat verification, token-backed rewards
  - `innovation-hub` skill: backend API contracts, database schema
- **Local Ollama** provides inference for all skill execution
- **Subagent delegation** runs parallel workstreams

### Prompt Mapping

| Old Agent Zero Prompt | New Hermes Equivalent |
|---|---|
| Backend Master Prompt | `innovation-hub` skill + `crypto-treasury` skill for registry/verification |
| Architect & Developer Prompt | `game-design` skill with UE5.7 C++ implementation |
| Card verification service | `crypto-treasury` skill Ed25519 payload verification |
| Battle state manager | `game-design` skill turn-system implementation |
| NFC UID handling | `game-design` skill + `crypto-treasury` skill binding |

### Security Model
- **Never trust the client:** UE5 sends inputs to Hermes/Ollama for validation
- **Server-side math:** All damage, status, and element calculations happen in Hermes skills
- **NFC integrity:** Card UID + checksum verified through `crypto-treasury` signature protocol
- **Anti-cheat:** Any client-side stat modification fails Hermes validation and is rejected

---

## 14. Development Roadmap

| Phase | Focus | Owner Skill |
|---|---|---|
| 1 | NFC & Backend Connection | `game-design` + `crypto-treasury` |
| 2 | Combat Logic | `game-design` |
| 3 | AR/Visuals | `game-design` |
| 4 | Progression/UI | `game-design` + `innovation-hub` |

---

## 15. Reconstruction Notes

- Source `AR UE 5.7 game document.docx` was corrupted; contents replaced with this reconstructed document.
- Source `Aura prompts.docx` was rewritten to remove Agent Zero / Replit dependencies.
- Architecture now targets Hermes Agent skills + local Ollama inference.
- All game rules, card data, and mechanics from the readable sources are preserved.
