import mongoose from 'mongoose';

const periodSchema = new mongoose.Schema({
  id: {
    type: String, // e.g. '2026-01'
    required: true,
    unique: true,
    index: true
  },
  month: {
    type: String, // 'January', etc.
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'soft_close', 'hard_locked'],
    default: 'open'
  },
  softClose: {
    type: Boolean,
    default: false
  },
  hardLock: {
    type: Boolean,
    default: false
  },
  closedAt: {
    type: String,
    default: null
  },
  closedBy: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

const Period = mongoose.model('Period', periodSchema);

export default Period;
