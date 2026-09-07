import express from 'express';
import CommissionPlan from '../models/CommissionPlan.js';

const router = express.Router();

// GET all commission plans
router.get('/', async (req, res) => {
  try {
    const { status, type } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;

    const plans = await CommissionPlan.find(filter).sort({ createdAt: -1 });
    res.json(plans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create commission plan
router.post('/', async (req, res) => {
  try {
    const { id, name, type, summary, date, status } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }

    const planId = id || `plan-${Date.now()}`;
    const existing = await CommissionPlan.findOne({ id: planId });
    if (existing) return res.status(200).json(existing);

    const plan = new CommissionPlan({
      id: planId,
      name,
      type: type || 'Tiered',
      summary: summary || '',
      date: date || '',
      status: status || 'Active'
    });

    await plan.save();
    res.status(201).json(plan);
  } catch (error) {
    if (error.code === 11000) {
      const existing = await CommissionPlan.findOne({ id: req.body.id });
      if (existing) return res.status(200).json(existing);
    }
    res.status(400).json({ error: error.message });
  }
});

// DELETE a commission plan
router.delete('/:id', async (req, res) => {
  try {
    const plan = await CommissionPlan.findOneAndDelete({ id: req.params.id });
    if (!plan) return res.status(404).json({ error: 'Commission plan not found' });
    res.json({ success: true, id: req.params.id });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
