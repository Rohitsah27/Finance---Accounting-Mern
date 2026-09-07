import mongoose from 'mongoose';

const accountSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  group: {
    type: String,
    required: true,
    enum: ['asset', 'liability', 'equity', 'revenue', 'expense']
  },
  type: {
    type: String,
    required: true
  },
  dimensions: {
    type: [String],
    default: []
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived'],
    default: 'active'
  },
  normalBalance: {
    type: String,
    enum: ['Debit', 'Credit'],
    required: true
  },
  balance: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: String,
    default: 'System'
  }
}, {
  timestamps: true
});

const Account = mongoose.model('Account', accountSchema);

export default Account;
