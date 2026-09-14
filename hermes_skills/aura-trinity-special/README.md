# trinity-special skill directory
How to use
1. Add `src/services/trinityService.js` to your backend services.
2. Hook `trinityService` into the battle resolution loop: run `checkTrinity` during Status Phase.
3. When activated, emit `TRINITY_ACTIVATED` event and persist `trinityState` in battle state JSON.
4. Client listens for `TRINITY_ACTIVATED` and plays VFX only after authoritative confirmation.
Notes
- All Trinity calculations must be server-side.
- Provide `trinityAllowed` flag per match for tournament formats.
