# Judge App Flow

## Overview
This document describes the judge-side flow for tournament verification and dispute resolution in Aura Champions.

## Prerequisites
- Judge account with valid JWT
- Tournament assigned to judge
- `tournament-admin` service running
- Access to card registry and NFC read path

## Flow
1. **Verify Card**
   - Endpoint: `POST /tournament/verifyCard`
   - Body: `{ "cardUid": "<UID>" }`
   - Returns signed proof for match records

2. **Flag Dispute**
   - Endpoint: `POST /judge/flagDispute`
   - Body: `{ "matchId": "<UUID>", "reason": "..." }`
   - Creates dispute record with status `OPEN`

3. **Override Result**
   - Endpoint: `POST /judge/overrideResult`
   - Body: `{ "matchId": "<UUID>", "newWinnerUserId": "<UUID>", "reason": "..." }`
   - Updates match with judge override

4. **Export Match Logs**
   - Endpoint: `POST /tournament/exportLogs`
   - Body: `{ "matchId": "<UUID>", "format": "json" }`
   - Returns match logs for review

## Notes
- All judge endpoints require HMAC/JWT auth
- Disputes are immutable once resolved
- Export supports `json` and `csv`
