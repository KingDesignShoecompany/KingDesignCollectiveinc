# Judge workflow (on-site and remote)

## Quick verification
1. Open judge app/scanner.
2. Scan card UID.
3. Call `POST /verifyCardForTournament` with `cardUid` and `judgeId`.
4. Record returned `status` and `proof.signature`.

## Dispute collection
- Capture server logs via `/requestMatchState` for the match.
- Export signed proof JSON for manual review.
- Escalate to committee if tamper evidence is strong.

## Notes
- Keep judge tokens short-lived and mapped to event IDs.
- Use same audit logging as `anti-cheat` package.
