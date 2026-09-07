import mongoose from 'mongoose';

const bankTransactionSchema = new mongoose.Schema({
  id: {
    type: String, // 'TXN-9021'
    required: true,
    unique: true,
    index: true
  },
  date: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['Credit', 'Debit'],
    required: true
  },
  status: {
    type: String,
    enum: ['Matched', 'Unallocated Suspense', 'Manual Match', 'Pending'],
    default: 'Pending'
  },
  contraAccount: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

const BankTransaction = mongoose.model('BankTransaction', bankTransactionSchema);

export default BankTransaction;
