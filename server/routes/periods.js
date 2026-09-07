import express from 'express';
import Period from '../models/Period.js';

const router = express.Router();

// GET all periods
router.get('/', async (req, res) => {
  try {
    const periods = await Period.find().sort({ id: 1 });
    res.json(periods);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH update period status (lock/unlock)
router.patch('/:id', async (req, res) => {
  try {
    const { status, softClose, hardLock, closedBy } = req.body;
    const updates = {};
    if (status !== undefined) updates.status = status;
    if (softClose !== undefined) updates.softClose = softClose;
    if (hardLock !== undefined) updates.hardLock = hardLock;
    if (closedBy !== undefined) updates.closedBy = closedBy;
    if (status === 'hard_locked') {
      updates.closedAt = new Date().toISOString().split('T')[0];
    }

    const period = await Period.findOneAndUpdate({ id: req.params.id }, updates, { new: true });
    if (!period) return res.status(404).json({ error: 'Period not found' });
    res.json(period);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
