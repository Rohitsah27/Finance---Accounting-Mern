import express from 'express';
import BankTransaction from '../models/BankTransaction.js';
import { SEED_BANK_TRANSACTIONS } from '../data/seedData.js';

const router = express.Router();

// GET all bank transactions
router.get('/', async (req, res) => {
  try {
    const { status, type } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;

    const txns = await BankTransaction.find(filter).sort({ date: -1 });
    res.json(txns);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST restore the baseline demo bank feed — upserts SEED_BANK_TRANSACTIONS
// by id, so it's purely additive (never deletes/overwrites anything a real
// bank sync would have produced). This is what actually backs the
// "Get Transactions" / "Auto-Sync" buttons on Bank Reconciliation: without
// it those buttons only showed a toast and did nothing, so a feed wiped by
// Reset Data could never come back short of a full database reseed.
router.post('/seed', async (req, res) => {
  try {
    for (const txn of SEED_BANK_TRANSACTIONS) {
      await BankTransaction.findOneAndUpdate({ id: txn.id }, txn, { upsert: true, new: true });
    }
    const txns = await BankTransaction.find({}).sort({ date: -1 });
    res.status(200).json(txns);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH match or update transaction
router.patch('/:id/match', async (req, res) => {
  try {
    const { status, contraAccount } = req.body;
    const txn = await BankTransaction.findOneAndUpdate(
      { id: req.params.id },
      { status: status || 'Matched', contraAccount },
      { new: true }
    );
    if (!txn) return res.status(404).json({ error: 'Transaction not found' });
    res.json(txn);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
