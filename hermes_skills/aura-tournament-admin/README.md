# tournament-admin skill directory
How to use
1. Run SQL migration `migrations/001_tournament_schema.sql`.
2. Start service `node src/app.js`.
3. Judges use `POST /judge/verifyCard` to get signed proof for physical cards.
4. Use `POST /tournament/createMatch` to create timed matches with sideboard support.
5. Export match logs via `GET /tournament/matchLog/:matchId` for appeals.
Notes
- Signed proofs use server `AUDIT_SIGNING_SECRET`.
- Banned lists are stored in `banned_list` table and updated monthly.
