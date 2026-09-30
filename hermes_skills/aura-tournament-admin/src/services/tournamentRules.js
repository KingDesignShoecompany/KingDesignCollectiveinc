// tournamentRules.js
const penaltyLadder = [
  'Warning',
  'Game Loss',
  'Match Loss',
  'Tournament DQ',
  'Ban'
];

function checkSideboard({ currentChanges, allowed = 3 }) {
  return currentChanges <= allowed;
}

function checkRoundTime({ elapsedSeconds, limitSeconds = 45 * 60 }) {
  return elapsedSeconds <= limitSeconds;
}

function canUseTrinity({ trinityAllowed }) {
  return !!trinityAllowed;
}

const db = require('../db');

// Create a match row; players[0]->player1, players[1]->player2.
// Returns { id } so the route can pass match.id downstream.
async function createMatch({ tournamentId, players, format }) {
  const player1 = players[0];
  const player2 = players[1];
  const q = await db.query(
    'INSERT INTO matches(tournament_id, player1, player2, status, format) VALUES($1,$2,$3,$4,$5) RETURNING id',
    [tournamentId, player1, player2, 'scheduled', format || null]
  );
  return { id: q.rows[0].id };
}

// Record a winner for a match, flip status to 'complete'.
async function recordResult({ matchId, winnerUserId, resultPayload }) {
  const q = await db.query(
    'UPDATE matches SET status=$1, winner_user_id=$2, result_payload=$3 WHERE id=$4 RETURNING id',
    ['complete', winnerUserId, resultPayload || {}, matchId]
  );
  return { status: 'OK', matchId };
}

module.exports = {
  penaltyLadder,
  checkSideboard,
  checkRoundTime,
  canUseTrinity,
  createMatch,
  recordResult
};
