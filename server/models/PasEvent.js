import mongoose from 'mongoose';

const pasEventSchema = new mongoose.Schema({
  event_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  event_type: {
    type: String,
    required: true
  },
  transaction_id: String,
  invoice_number: String,
  policy: {
    policy_id: String,
    policy_number: { type: String, required: true },
    lob: String,
    state: String
  },
  parties: mongoose.Schema.Types.Mixed,
  financials: mongoose.Schema.Types.Mixed,
  dates: mongoose.Schema.Types.Mixed,
  source_system: String,
  status: {
    type: String,
    default: 'POSTED'
  },
  jeNumber: String,
  jeLines: {
    type: [mongoose.Schema.Types.Mixed],
    default: []
  },
  jeGroups: {
    type: [mongoose.Schema.Types.Mixed],
    default: []
  },
  arInvoiceId: String,
  apInvoiceId: String,
  timestamp: String
}, {
  timestamps: true
});

// A stage can only ever be injected once per policy — this is the source of
// truth the "Already Injected" lockout checks against, so it survives a page
// refresh instead of resetting with client-side session state.
pasEventSchema.index({ 'policy.policy_number': 1, event_type: 1 }, { unique: true });

const PasEvent = mongoose.model('PasEvent', pasEventSchema);

export default PasEvent;
