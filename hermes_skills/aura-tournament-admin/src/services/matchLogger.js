// matchLogger.js
const db = require('../db');

async function logMatchEvent({ matchId, eventType, payload = {}, playerId = null, roundIndex = null }) {
  await db.query(
    'INSERT INTO match_logs(match_id, event_type, payload, player_id) VALUES($1,$2,$3,$4)',
    [matchId, eventType, payload, playerId]
  );
  return { matchId, eventType, roundIndex };
}

async function logSideboardSwap({ matchId, playerId, addedCardUids, removedCardUids, roundIndex }) {
  return logMatchEvent({
    matchId,
    eventType: 'sideboard_swap',
    payload: { addedCardUids, removedCardUids, roundIndex },
    playerId,
    roundIndex
  });
}

async function getMatchLogs(matchId) {
  const q = await db.query('SELECT * FROM match_logs WHERE match_id=$1 ORDER BY created_at ASC', [matchId]);
  return q.rows;
}

module.exports = { logMatchEvent, logSideboardSwap, getMatchLogs };
