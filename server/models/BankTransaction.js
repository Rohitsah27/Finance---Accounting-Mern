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
  },
  // Which entity and which of its bank accounts this transaction actually
  // hit — Bank Reconciliation filters the feed down to the logged-in
  // role's own account by these two fields (see ROLE_CONFIG in
  // BankReconciliationPage.jsx), so without them every synced transaction
  // fails that filter and the page shows empty no matter how many
  // transactions exist in this collection.
  entity: {
    type: String,
    default: null
  },
  account: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

const BankTransaction = mongoose.model('BankTransaction', bankTransactionSchema);

export default BankTransaction;
