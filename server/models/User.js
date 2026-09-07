import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  password: {
    type: String,
    default: 'admin@123'
  },
  role: {
    type: String,
    default: 'owner'
  },
  roleLabel: {
    type: String,
    default: 'Standard User'
  },
  entityId: {
    type: String,
    default: 'ENT-MINE'
  },
  entityName: {
    type: String,
    default: 'My Business'
  },
  businessType: {
    type: String,
    enum: ['mga', 'carrier', 'agency', 'general-business', 'reinsurer'],
    default: 'mga'
  },
  businessLabel: {
    type: String,
    default: 'MGA / Program Manager'
  },
  avatarColor: {
    type: String,
    default: '#0369A1'
  },
  initials: {
    type: String,
    default: 'US'
  },
  department: {
    type: String,
    default: 'Finance & Accounting'
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Suspended', 'Pending'],
    default: 'Active'
  },
  twoFactorEnabled: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);

export default User;
