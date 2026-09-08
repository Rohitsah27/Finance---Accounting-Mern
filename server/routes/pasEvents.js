import express from 'express';
import PasEvent from '../models/PasEvent.js';

const router = express.Router();

// GET all injected PAS events, optionally filtered by policy number
router.get('/', async (req, res) => {
  try {
    const { policyNumber } = req.query;
    const filter = {};
    if (policyNumber) filter['policy.policy_number'] = policyNumber;

    const events = await PasEvent.find(filter).sort({ createdAt: -1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST persist a newly injected PAS event — rejected with 409 if this
// policy/event_type stage was already injected, so a stage can only ever be
// posted once regardless of client-side state or a page refresh.
router.post('/', async (req, res) => {
  try {
    const { policy, event_type } = req.body;
    if (!policy?.policy_number || !event_type) {
      return res.status(400).json({ error: 'policy.policy_number and event_type are required' });
    }

    const existing = await PasEvent.findOne({ 'policy.policy_number': policy.policy_number, event_type });
    if (existing) {
      return res.status(409).json({ error: `${event_type} has already been injected for ${policy.policy_number}`, event: existing });
    }

    const event = new PasEvent(req.body);
    await event.save();
    res.status(201).json(event);
  } catch (error) {
    if (error.code === 11000) {
      const existing = await PasEvent.findOne({ 'policy.policy_number': req.body.policy?.policy_number, event_type: req.body.event_type });
      return res.status(409).json({ error: 'This stage has already been injected for this policy', event: existing });
    }
    res.status(400).json({ error: error.message });
  }
});

export default router;
