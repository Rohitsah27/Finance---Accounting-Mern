import mongoose from 'mongoose';

const journalLineSchema = new mongoose.Schema({
  accountCode: { type: String, required: true },
  acct: { type: String },
  accountName: { type: String, required: true },
  debit: { type: Number, default: 0 },
  credit: { type: Number, default: 0 },
  desc: { type: String },
  dims: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { _id: false });

const journalEntrySchema = new mongoose.Schema({
  id: { type: String, unique: true, index: true },
  number: { type: String, required: true },
  date: { type: String, required: true },
  entity: { type: String, default: 'ENT-MGA-01' },
  entityId: { type: String, default: 'ENT-MINE' },
  entityName: { type: String, default: 'NTA Program Administrators' },
  reference: { type: String },
  description: { type: String, required: true },
  status: {
    type: String,
    enum: ['draft', 'posted', 'void', 'reversed'],
    default: 'draft'
  },
  lines: [journalLineSchema],
  postedAt: { type: Date },
  postedBy: { type: String, default: 'System' }
}, {
  timestamps: true
});

// Calculate total debit and total credit virtuals
journalEntrySchema.virtual('totalDebit').get(function() {
  return this.lines ? this.lines.reduce((sum, line) => sum + (line.debit || 0), 0) : 0;
});

journalEntrySchema.virtual('totalCredit').get(function() {
  return this.lines ? this.lines.reduce((sum, line) => sum + (line.credit || 0), 0) : 0;
});

const JournalEntry = mongoose.model('JournalEntry', journalEntrySchema);

export default JournalEntry;
