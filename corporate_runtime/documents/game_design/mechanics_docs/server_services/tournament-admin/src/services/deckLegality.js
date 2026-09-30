// deckLegality.js
// Validates team composition and deck legality
const db = require('../db');

async function validateTeam({ team }) {
  const errors = [];
  const monsters = team.monsters || [];

  if (monsters.length !== 3) {
    errors.push('Team must have exactly 3 monsters');
  }

  // 1) No duplicate card_uid
  const uids = monsters.map(m => m.card_uid).filter(Boolean);
  const uniqueUids = new Set(uids);
  if (uniqueUids.size !== uids.length) {
    errors.push('Team contains duplicate card_uid values');
  }

  // 2) Max 2 copies of any card_id
  const ids = monsters.map(m => m.card_id);
  const idCounts = {};
  for (const id of ids) {
    idCounts[id] = (idCounts[id] || 0) + 1;
    if (idCounts[id] > 2) {
      errors.push(`Card #${id} appears more than 2 times`);
    }
  }

  // 3) Ban list by effective_from
  const banned = await db.query('SELECT card_id FROM banned_list WHERE effective_from <= now()');
  const bannedIds = new Set(banned.rows.map(r => r.card_id));
  for (const id of ids) {
    if (bannedIds.has(id)) {
      errors.push(`Banned monster: #${id}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

async function validateDeck({ deck }) {
  const errors = [];

  if (!Array.isArray(deck) || deck.length < 30 || deck.length > 60) {
    errors.push('Deck size must be between 30 and 60');
  }

  // 1) No duplicate card_uid
  const uids = deck.map(c => c.cardUid).filter(Boolean);
  const uniqueUids = new Set(uids);
  if (uniqueUids.size !== uids.length) {
    errors.push('Deck contains duplicate card_uid values');
  }

  // 2) Max 2 copies of any card_id
  const idCounts = {};
  for (const c of deck) {
    const id = c.card_id;
    if (id == null) continue;
    idCounts[id] = (idCounts[id] || 0) + 1;
    if (idCounts[id] > 2) {
      errors.push(`Card #${id} appears more than 2 times`);
    }
  }

  return { valid: errors.length === 0, errors };
}

async function validateSideboardSwap({ currentDeck, currentSideboard, swapCards }) {
  const errors = [];

  // 5) Sideboard swap size <= 5 cards
  if (!Array.isArray(swapCards) || swapCards.length > 5) {
    errors.push('Sideboard swap must be 5 cards or fewer');
  }

  // Ensure swapped cards exist in either deck or sideboard
  const allCards = new Set([...currentDeck, ...currentSideboard].map(c => c.cardUid).filter(Boolean));
  for (const c of swapCards) {
    if (!allCards.has(c.cardUid)) {
      errors.push(`Card ${c.cardUid} not found in deck or sideboard`);
    }
  }

  return { valid: errors.length === 0, errors };
}

module.exports = { validateTeam, validateDeck, validateSideboardSwap };
