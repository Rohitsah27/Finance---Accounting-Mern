import express from 'express';
import { seedDatabase, resetDataKeepUsers } from '../seed-cli.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const clean = req.body.clean === true || req.query.clean === 'true';
    const result = await seedDatabase(clean);
    res.status(200).json({
      message: 'Database seeded successfully',
      cleanMode: clean,
      ...result
    });
  } catch (error) {
    res.status(500).json({
      error: 'Seeding failed',
      details: error.message
    });
  }
});

// Wipe all transactional data (Accounts, Journal Entries, Periods, Bank
// Transactions, Invoices) but keep Users so login credentials still work.
router.post('/reset-data', async (req, res) => {
  try {
    const result = await resetDataKeepUsers();
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Reset failed',
      details: error.message
    });
  }
});

export default router;
