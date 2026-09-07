import express from 'express';
import CommissionTransaction from '../models/CommissionTransaction.js';

const router = express.Router();

// GET all commission transactions
router.get('/', async (req, res) => {
  try {
    const { status, producer } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (producer) filter.producer = producer;

    const txns = await CommissionTransaction.find(filter).sort({ createdAt: -1 });
    res.json(txns);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create commission transaction
router.post('/', async (req, res) => {
  try {
    const {
      id, producer, producerName, policyNumber, invoiceRef, insured, lob,
      mga, carrier, grossPremium, ratePct, grossCommission, clawback, netPayable,
      status, period, date
    } = req.body;

    if (!producer || !policyNumber || grossPremium === undefined || grossPremium === null) {
      return res.status(400).json({ error: 'producer, policyNumber and grossPremium are required' });
    }

    const txnId = id || `COMM-${Date.now()}`;
    const existing = await CommissionTransaction.findOne({ id: txnId });
    if (existing) return res.status(200).json(existing);

    const txn = new CommissionTransaction({
      id: txnId,
      producer,
      producerName: producerName || producer,
      policyNumber,
      invoiceRef: invoiceRef || '',
      insured: insured || '',
      lob: lob || '',
      mga: mga || '',
      carrier: carrier || '',
      grossPremium: Number(grossPremium),
      ratePct: Number(ratePct) || 0,
      grossCommission: Number(grossCommission) || 0,
      clawback: Number(clawback) || 0,
      netPayable: Number(netPayable) || 0,
      status: status || 'Pending',
      period: period || '',
      date: date || ''
    });

    await txn.save();
    res.status(201).json(txn);
  } catch (error) {
    if (error.code === 11000) {
      const existing = await CommissionTransaction.findOne({ id: req.body.id });
      if (existing) return res.status(200).json(existing);
    }
    res.status(400).json({ error: error.message });
  }
});

// DELETE a commission transaction
router.delete('/:id', async (req, res) => {
  try {
    const txn = await CommissionTransaction.findOneAndDelete({ id: req.params.id });
    if (!txn) return res.status(404).json({ error: 'Commission transaction not found' });
    res.json({ success: true, id: req.params.id });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
