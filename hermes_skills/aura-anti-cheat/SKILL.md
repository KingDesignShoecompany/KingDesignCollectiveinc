---
name: aura-anti-cheat
description: "Verification, replay protection, logging, and HMAC-based action validation."
version: 1.0.0
author: Hermes Agent
license: MIT
category: gaming
metadata:
  hermes:
    tags: ["aura-champions", "anti-cheat", "hmac", "nonce", "audit", "verification"]
    related_skills: [game-design, aura-champions]
---

# Anti-Cheat

## Overview
Provide authoritative verification, replay protection, audit logging, and judge verification for Aura Champions.

## When to use
Use when you need:
- HMAC signing and verification
- Nonce issuance and expiry checks
- Audit logging with signed entries
- Tournament judge proof generation

## Deliverables
- `secureUtils.js`: `hmacSign`, `sha256Base64`, `signAuditEntry`
- Middleware: `hmacAuth.js`, `nonceCheck.js`
- Services: `nonceService.js`, `auditLogger.js`, `judgeVerification.js`
- Routes: `issueNonce.js`, `verifyAction.js`, `verifyCardForTournament.js`
- Postman collection and sample logs

## Security Rules
- All secrets via env vars: `HMAC_MASTER_SECRET`, `AUDIT_SIGNING_SECRET`, `JWT_SECRET`
- Use `crypto.timingSafeEqual` for signature comparison
- Nonces expire after `NONCE_TTL_SECONDS` (default 45)
- Audit log entries are append-only and signed
