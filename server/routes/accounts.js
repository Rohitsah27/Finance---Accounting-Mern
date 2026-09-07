import express from 'express';
import Account from '../models/Account.js';

const router = express.Router();

// GET all accounts
router.get('/', async (req, res) => {
  try {
    const { group, status, search } = req.query;
    const filter = {};
    if (group) filter.group = group.toLowerCase();
    if (status) filter.status = status.toLowerCase();
    if (search) {
      filter.$or = [
        { code: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }
      ];
    }

    const accounts = await Account.find(filter).sort({ code: 1 });
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET account by code
router.get('/:code', async (req, res) => {
  try {
    const account = await Account.findOne({ code: req.params.code });
    if (!account) return res.status(404).json({ error: 'Account not found' });
    res.json(account);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST new account
router.post('/', async (req, res) => {
  try {
    const { code, name, group, type, dimensions, normalBalance, balance } = req.body;
    if (!code || !name || !group) {
      return res.status(400).json({ error: 'Missing required account fields (code, name, group)' });
    }

    const existing = await Account.findOne({ code });
    if (existing) {
      return res.status(409).json({ error: `Account with code ${code} already exists` });
    }

    const account = new Account({
      code,
      name,
      group,
      type: type || (group.charAt(0).toUpperCase() + group.slice(1)),
      dimensions: dimensions || [],
      normalBalance: normalBalance || (['asset', 'expense'].includes(group.toLowerCase()) ? 'Debit' : 'Credit'),
      balance: balance || 0
    });

    await account.save();
    res.status(201).json(account);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT update account
router.put('/:code', async (req, res) => {
  try {
    const account = await Account.findOneAndUpdate(
      { code: req.params.code },
      req.body,
      { new: true, runValidators: true }
    );
    if (!account) return res.status(404).json({ error: 'Account not found' });
    res.json(account);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE account
router.delete('/:code', async (req, res) => {
  try {
    const account = await Account.findOneAndDelete({ code: req.params.code });
    if (!account) return res.status(404).json({ error: 'Account not found' });
    res.json({ message: 'Account deleted', code: req.params.code });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
