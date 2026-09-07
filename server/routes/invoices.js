import express from 'express';
import Invoice from '../models/Invoice.js';

const router = express.Router();

// Helper: find an invoice by its custom display id, invoiceNumber, or Mongo _id
function findInvoiceQuery(idParam) {
  const or = [{ id: idParam }, { invoiceNumber: idParam }];
  if (idParam.match(/^[0-9a-fA-F]{24}$/)) or.push({ _id: idParam });
  return { $or: or };
}

// GET all invoices (filter by direction AR or AP)
router.get('/', async (req, res) => {
  try {
    const { direction, status, search } = req.query;
    const filter = {};
    if (direction) filter.direction = direction.toUpperCase();
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { partnerName: { $regex: search, $options: 'i' } }
      ];
    }

    const invoices = await Invoice.find(filter).sort({ createdAt: -1 });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create invoice or bill
router.post('/', async (req, res) => {
  try {
    const {
      id, invoiceNumber, direction, partnerName, partnerType,
      policyNumber, entity, entityName, amount, dueDate, category, description,
      notes, status, matchStatus, agingBucket,
      counterpartyEntity, glAcct, counterpartyReceivableAcct, method, source, nextBill
    } = req.body;

    if (!partnerName || !amount || !dueDate) {
      return res.status(400).json({ error: 'partnerName, amount, and dueDate are required' });
    }

    const dir = direction || 'AR';
    const number = invoiceNumber || id || `${dir === 'AP' ? 'BILL' : 'INV'}-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;

    const existing = id ? await Invoice.findOne({ id }) : null;
    if (existing) return res.status(200).json(existing);

    const invoice = new Invoice({
      id: id || number,
      invoiceNumber: number,
      direction: dir,
      partnerName,
      partnerType: partnerType || 'Broker',
      policyNumber: policyNumber || '',
      entity: entity || 'ENT-MGA-01',
      entityName: entityName || '',
      amount: Number(amount),
      paidAmount: 0,
      balance: Number(amount),
      dueDate,
      category: category || 'General',
      description: description || '',
      notes,
      status: status || 'Pending Approval',
      matchStatus: matchStatus || '',
      agingBucket: agingBucket || '',
      counterpartyEntity: counterpartyEntity || undefined,
      glAcct: glAcct || '',
      counterpartyReceivableAcct: counterpartyReceivableAcct || '',
      method: method || '',
      source: source || '',
      nextBill: nextBill || undefined
    });

    await invoice.save();
    res.status(201).json(invoice);
  } catch (error) {
    if (error.code === 11000) {
      const existing = await Invoice.findOne(findInvoiceQuery(req.body.id || req.body.invoiceNumber || ''));
      if (existing) return res.status(200).json(existing);
    }
    res.status(400).json({ error: error.message });
  }
});

// PATCH pay or update status
router.patch('/:id/pay', async (req, res) => {
  try {
    const { paymentAmount, status } = req.body;
    const invoice = await Invoice.findOne(findInvoiceQuery(req.params.id));
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    invoice.paidAmount = (invoice.paidAmount || 0) + Number(paymentAmount || invoice.balance || invoice.amount);
    invoice.balance = Math.max(0, invoice.amount - invoice.paidAmount);
    invoice.status = status || (invoice.balance <= 0 ? 'Paid' : 'Partial');

    await invoice.save();
    res.json(invoice);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PATCH generic status/field update
router.patch('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndUpdate(findInvoiceQuery(req.params.id), req.body, { new: true, runValidators: true });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json(invoice);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
