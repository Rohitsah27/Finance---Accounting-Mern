import mongoose from 'mongoose';

const commissionPlanSchema = new mongoose.Schema({
  id: {
    type: String, // 'plan-<timestamp>'
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['Tiered', 'Flat', 'Sliding Scale', 'Volume', 'Profit-Sharing'],
    default: 'Tiered'
  },
  summary: {
    type: String,
    default: ''
  },
  date: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    default: 'Active'
  }
}, {
  timestamps: true
});

const CommissionPlan = mongoose.model('CommissionPlan', commissionPlanSchema);

export default CommissionPlan;
