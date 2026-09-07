import mongoose from 'mongoose';

const commissionTransactionSchema = new mongoose.Schema({
  id: {
    type: String, // 'COMM-<timestamp>'
    required: true,
    unique: true,
    index: true
  },
  producer: {
    type: String,
    required: true
  },
  producerName: {
    type: String,
    default: ''
  },
  policyNumber: {
    type: String,
    required: true
  },
  invoiceRef: {
    type: String,
    default: ''
  },
  insured: {
    type: String,
    default: ''
  },
  lob: {
    type: String,
    default: ''
  },
  mga: {
    type: String,
    default: ''
  },
  carrier: {
    type: String,
    default: ''
  },
  grossPremium: {
    type: Number,
    required: true
  },
  ratePct: {
    type: Number,
    default: 0
  },
  grossCommission: {
    type: Number,
    default: 0
  },
  clawback: {
    type: Number,
    default: 0
  },
  netPayable: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    default: 'Pending'
  },
  period: {
    type: String,
    default: ''
  },
  date: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

const CommissionTransaction = mongoose.model('CommissionTransaction', commissionTransactionSchema);

export default CommissionTransaction;
