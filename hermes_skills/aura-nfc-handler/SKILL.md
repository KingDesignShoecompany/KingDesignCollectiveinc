---
name: aura-nfc-handler
description: "NTAG216 NFC handling: memory layout, read/write rules, fusion and registration flows."
version: 1.0.0
author: Hermes Agent
license: MIT
category: gaming
metadata:
  hermes:
    tags: ["aura-champions", "nfc", "ntag216", "android", "ios", "card"]
    related_skills: [game-design, aura-champions]
---

# NFC Handler

## Overview
Define how the client reads/writes NTAG216 cards, how memory is mapped to game fields, and what actions require server verification. Emphasize minimal writes, write-protection, and tamper detection.

## When to use
Use when implementing:
- NFC read/write code on mobile (iOS/Android)
- Card registration and transfer flows
- Fusion and upgrade flows that touch card memory

## Memory Map (high-level)
**NTAG216 total:** 888 bytes (use server-side canonical mapping)

**Monster Card (888 bytes)**
- **Base Data (immutable)**  100 bytes: `card_uid`, `card_id`, `rarity`, `immutable_flags`
- **Stats & Level**  200 bytes: `level`, `xp`, `current_stats`
- **Equipment Links**  200 bytes: `equipped_item_uids` (references)
- **Battle History**  200 bytes: last 10 battle summaries (hashes)
- **Security**  188 bytes: `checksum`, `owner_signature`, `reserved`

**Item Card (444 bytes)**
- **Item Data**  100 bytes
- **Usage History**  100 bytes
- **Owner/Upgrade Data**  100 bytes
- **Future**  144 bytes

## Read/Write Rules
- **Read-only by default**: client reads card memory and sends snapshot to server for verification.
- **Writes**: only performed when server authorizes (e.g., transfer ownership, permanent enhancement). Server returns signed write payload that the client writes to card.
- **Write-protection**: emulate by storing `write_protected` flag in server and only allowing writes with server-signed token.
- **Fusion**: client sends both card UIDs to server; server returns new card data and a signed write package to update one card and invalidate the other.
- **Registration**: `POST /registerCard` with `cardUid`, `ownerId`, `checksum`. Server responds with `registrationToken` to be written to card.

## Checksum & Tamper Detection
- Compute canonical checksum over immutable card data on server during registration.
- On every read, client sends memory snapshot; server compares to canonical `checksum` in `card_registry`.
- Mismatch → mark card `tampered=true`, log to `scans_log`, and block registration/usage until review.
- Use server-stored `immutable_data` hash chain for additional tamper evidence.
- Treat checksum mismatch as high-severity anti-cheat event.
