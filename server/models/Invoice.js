import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
  id: {
    type: String, // Display id, e.g. 'INV-AP-001' / 'INV-AR-001'
    unique: true,
    sparse: true,
    index: true
  },
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  direction: {
    type: String,
    enum: ['AR', 'AP'], // AR = Customer/Partner Invoice, AP = Vendor Bill
    required: true
  },
  partnerName: {
    type: String,
    required: true
  },
  partnerType: {
    type: String,
    enum: ['Broker', 'Carrier', 'Vendor', 'MGA', 'Insured'],
    default: 'Broker'
  },
  policyNumber: {
    type: String,
    default: ''
  },
  entity: {
    type: String,
    default: 'ENT-MGA-01'
  },
  entityName: {
    type: String,
    default: ''
  },
  // Set when this invoice represents an inter-entity settlement (e.g. a
  // Broker bill for what it owes the MGA) — paying it must also post a
  // matching receipt JE to the counterparty's own book.
  counterpartyEntity: {
    id: { type: String },
    name: { type: String }
  },
  glAcct: {
    type: String,
    default: ''
  },
  counterpartyReceivableAcct: {
    type: String,
    default: ''
  },
  method: {
    type: String,
    default: ''
  },
  // Where this invoice was raised from, e.g. 'PAS' for the Policy Admin
  // Event Injector — lets consuming pages merge in only dynamically-raised
  // rows without touching unrelated static demo data.
  source: {
    type: String,
    default: ''
  },
  // A follow-on bill descriptor to raise (in the counterparty's own book)
  // once THIS bill is paid — e.g. paying the Broker's bill to the MGA
  // raises the MGA's own bill to the Carrier. Consumed once by payApInvoice
  // and not itself a schema-shaped record, hence Mixed.
  nextBill: {
    type: mongoose.Schema.Types.Mixed,
    default: undefined
  },
  amount: {
    type: Number,
    required: true
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  balance: {
    type: Number,
    default: 0
  },
  dueDate: {
    type: String,
    required: true
  },
  issueDate: {
    type: String,
    default: () => new Date().toISOString().split('T')[0]
  },
  status: {
    type: String,
    default: 'Pending Approval'
  },
  matchStatus: {
    type: String,
    default: ''
  },
  agingBucket: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    default: 'General'
  },
  description: {
    type: String,
    default: ''
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

const Invoice = mongoose.model('Invoice', invoiceSchema);

export default Invoice;
