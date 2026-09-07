import express from 'express';
import JournalEntry from '../models/JournalEntry.js';
import Account from '../models/Account.js';

const router = express.Router();

// GET all journal entries
router.get('/', async (req, res) => {
  try {
    const { status, limit = 50, page = 1 } = req.query;
    const filter = {};
    if (status) filter.status = status.toLowerCase();

    const entries = await JournalEntry.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await JournalEntry.countDocuments(filter);

    res.json({
      entries,
      total,
      page: Number(page),
      limit: Number(limit)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single journal entry
router.get('/:id', async (req, res) => {
  try {
    const entry = await JournalEntry.findOne({ $or: [{ id: req.params.id }, { number: req.params.id }] });
    if (!entry) return res.status(404).json({ error: 'Journal entry not found' });
    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create journal entry
router.post('/', async (req, res) => {
  try {
    const { number, date, entity, entityName, reference, description, status = 'draft', lines = [] } = req.body;

    if (!description || !lines.length) {
      return res.status(400).json({ error: 'Description and at least two lines are required' });
    }

    // Verify debit/credit balance if posting
    const totalDebit = lines.reduce((acc, l) => acc + (Number(l.debit) || 0), 0);
    const totalCredit = lines.reduce((acc, l) => acc + (Number(l.credit) || 0), 0);

    if (status === 'posted' && Math.abs(totalDebit - totalCredit) > 0.01) {
      return res.status(400).json({
        error: `Unbalanced journal entry: Debits ($${totalDebit.toFixed(2)}) must equal Credits ($${totalCredit.toFixed(2)})`
      });
    }

    const nextNumber = number || `JE-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
    const id = req.body.id || nextNumber;

    const entry = new JournalEntry({
      id,
      number: nextNumber,
      date: date || new Date().toISOString().split('T')[0],
      entity: entity || 'ENT-MGA-01',
      entityName: entityName || 'NTA Program Administrators',
      reference,
      description,
      status,
      lines,
      postedAt: status === 'posted' ? new Date() : null,
      postedBy: req.body.postedBy || 'Admin'
    });

    await entry.save();

    // If posted, update account balances
    if (status === 'posted') {
      for (const line of lines) {
        const acct = await Account.findOne({ code: line.accountCode });
        if (acct) {
          const delta = acct.normalBalance === 'Debit'
            ? (Number(line.debit) || 0) - (Number(line.credit) || 0)
            : (Number(line.credit) || 0) - (Number(line.debit) || 0);
          acct.balance = (acct.balance || 0) + delta;
          await acct.save();
        }
      }
    }

    res.status(201).json(entry);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PATCH post a draft journal entry — applies its lines to the Chart of
// Accounts balances. This is what actually "hits the COA"; creating a
// draft entry does not.
router.patch('/:id/post', async (req, res) => {
  try {
    const entry = await JournalEntry.findOne({ $or: [{ id: req.params.id }, { number: req.params.id }] });
    if (!entry) return res.status(404).json({ error: 'Journal entry not found' });

    if (entry.status === 'posted') {
      return res.json(entry);
    }

    const totalDebit = entry.lines.reduce((acc, l) => acc + (Number(l.debit) || 0), 0);
    const totalCredit = entry.lines.reduce((acc, l) => acc + (Number(l.credit) || 0), 0);
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return res.status(400).json({
        error: `Unbalanced journal entry: Debits ($${totalDebit.toFixed(2)}) must equal Credits ($${totalCredit.toFixed(2)})`
      });
    }

    entry.status = 'posted';
    entry.postedAt = new Date();
    entry.postedBy = req.body.postedBy || 'Admin';
    await entry.save();

    for (const line of entry.lines) {
      const acct = await Account.findOne({ code: line.accountCode });
      if (acct) {
        const delta = acct.normalBalance === 'Debit'
          ? (Number(line.debit) || 0) - (Number(line.credit) || 0)
          : (Number(line.credit) || 0) - (Number(line.debit) || 0);
        acct.balance = (acct.balance || 0) + delta;
        await acct.save();
      }
    }

    res.json(entry);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
