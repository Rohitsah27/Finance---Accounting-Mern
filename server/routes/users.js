import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// GET all users
router.get('/', async (req, res) => {
  try {
    const { role, status, search } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    const users = await User.find(filter).sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create user
router.post('/', async (req, res) => {
  try {
    const { name, email, role, department, status, twoFactorEnabled } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    const user = new User({
      name,
      email: email.toLowerCase(),
      role: role || 'Accountant',
      department: department || 'Finance & Accounting',
      status: status || 'Active',
      twoFactorEnabled: !!twoFactorEnabled
    });

    await user.save();
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Helper: find a user by Mongo _id or by email (frontend keys users by email)
function findUserQuery(idParam) {
  const or = [{ email: String(idParam).toLowerCase() }];
  if (idParam.match(/^[0-9a-fA-F]{24}$/)) or.push({ _id: idParam });
  return { $or: or };
}

// PUT update user
router.put('/:id', async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.email) updates.email = updates.email.toLowerCase();
    const user = await User.findOneAndUpdate(findUserQuery(req.params.id), updates, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE user
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findOneAndDelete(findUserQuery(req.params.id));
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
