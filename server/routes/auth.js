import express from 'express';
import User from '../models/User.js';

const router = express.Router();

const DEMO_CREDENTIALS = {
  'carrier@gmail.com': { password: 'admin@123', role: 'carrier', name: 'Southlake Insurance Co.' },
  'mga@gmail.com': { password: 'admin@123', role: 'mga', name: 'NTA Program Administrators' },
  'broker@gmail.com': { password: 'admin@123', role: 'broker', name: 'HIT Agency Group' },
  'insured@gmail.com': { password: 'admin@123', role: 'insured', name: 'Ayushi Fleet Logistics' },
  'admin@veridex.com': { password: 'admin@123', role: 'owner', name: 'Jordan Blake' }
};

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Check MongoDB user
    let user = await User.findOne({ email: trimmedEmail });

    // If not found in DB but is one of our demo users, auto-create
    if (!user && DEMO_CREDENTIALS[trimmedEmail]) {
      const demo = DEMO_CREDENTIALS[trimmedEmail];
      user = new User({
        email: trimmedEmail,
        name: demo.name,
        role: demo.role,
        password: demo.password,
        status: 'Active'
      });
      await user.save().catch(() => {});
    }

    // Verify password
    const validPassword = (user && user.password) ? user.password === password : password === 'admin@123';

    if (!user || !validPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Password for demo accounts is admin@123.'
      });
    }

    // Update lastLogin
    user.lastLogin = new Date();
    await user.save().catch(() => {});

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        roleLabel: user.roleLabel,
        entityId: user.entityId,
        entityName: user.entityName,
        businessType: user.businessType,
        businessLabel: user.businessLabel,
        avatarColor: user.avatarColor,
        initials: user.initials
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/auth/users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
