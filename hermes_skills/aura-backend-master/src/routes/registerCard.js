// registerCard.js
const express = require('express');
const router = express.Router();
const db = require('../db');

/**
 * POST /registerCard
 * body: { userId, cardUid, checksum }
 */
router.post('/', async (req, res) => {
  const { userId, cardUid, checksum } = req.body;
  if (!userId || !cardUid || !checksum) return res.status(400).json({ error: 'Missing fields' });

  try {
    const reg = await db.query('SELECT * FROM card_registry WHERE card_uid=$1', [cardUid]);
    if (reg.rowCount === 0) return res.status(404).json({ error: 'Card not found in registry' });

    const canonical = reg.rows[0].checksum;
    if (canonical !== checksum) {
      await db.query('INSERT INTO scans_log(user_id, card_uid, action, payload) VALUES($1,$2,$3,$4)', [
        userId, cardUid, 'register_attempt_mismatch', { provided: checksum, canonical }
      ]);
      return res.status(409).json({ error: 'Checksum mismatch', tamper: true });
    }

    if (reg.rows[0].card_type === 'monster') {
      const insert = await db.query(
        `INSERT INTO cards_monster(owner_id, card_uid, stats, equipment, battle_history, last_scan)
         VALUES($1,$2,$3,$4,$5,now()) RETURNING *`,
        [userId, cardUid, {}, {}, []]
      );
      return res.status(201).json({ status: 'OK', card: insert.rows[0] });
    } else {
      const insert = await db.query(
        `INSERT INTO cards_item(owner_id, card_uid, usage_history, owner_data, last_scan)
         VALUES($1,$2,$3,$4,now()) RETURNING *`,
        [userId, cardUid, [], {}]
      );
      return res.status(201).json({ status: 'OK', card: insert.rows[0] });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
