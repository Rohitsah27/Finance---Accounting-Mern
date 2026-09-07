import express from 'express';
import BankTransaction from '../models/BankTransaction.js';

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
