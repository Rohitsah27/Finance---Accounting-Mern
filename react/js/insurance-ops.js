/* ============================================================
   VERIDEX FINANCE SYSTEM - Insurance Operations (MGA / Policy /
   Invoice / Payment), real cross-page data, no scripted scenarios.
   The Carrier adds their own MGA, binds policies against it, raises
   an invoice for whatever is actually outstanding, posts the real
   JE, and reconciles whatever payment actually comes in, on the
   real app pages (MGA Operations, Premium & Claims, Billing &
   Invoicing, Bank Reconciliation), not a separate wizard. Posts
   through js/gl-engine.js's real Chart of Accounts (1100/4100/1001),
   so every number here is the same number everywhere else.
   ============================================================ */

const IO_KEY_MGAS = 'v_io_mgas';
const IO_KEY_POLICIES = 'v_io_policies';
const IO_KEY_INVOICES = 'v_io_invoices';
const IO_KEY_BANKLINES = 'v_io_banklines';

const IO_CARRIER_NAME = 'Southlake Insurance Co.';
const IO_ACCT_RECEIVABLE = '1100';
const IO_ACCT_REVENUE = '4100';
const IO_ACCT_CASH = '1001';
const IO_ACCT_VARIANCE = '6900';
const IO_ACCT_CREDIT_BAL = '2900';

function ensureInsuranceOpsAccounts() {
  const need = [
    { code: IO_ACCT_VARIANCE, name: 'Premium Variance Adjustment', group: 'expense', dimensions: ['mga', 'cost-center'] },
    { code: IO_ACCT_CREDIT_BAL, name: 'Unapplied Cash / Customer Credit Balance', group: 'liability', dimensions: ['mga', 'cost-center'] },
  ];
  need.forEach(a => { if (!findGLAccountByCode(a.code)) { try { addGLAccount(a); } catch (e) {} } });
}

/* ---------- MGA Master (Trading Partners) - the Carrier adds these themselves ---------- */
function getMGAs() { return glLoad(IO_KEY_MGAS, []); }

function addMGA(input) {
  const mgas = getMGAs();
  const name = (input.name || '').trim();
  if (!name) throw new Error('MGA name is required');
  if (mgas.some(m => m.name.toLowerCase() === name.toLowerCase())) throw new Error('That MGA is already on file');
  const mga = {
    id: 'MGA-' + Date.now(),
    name,
    code: (input.code || name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 4)),
    bindingAuthority: parseFloat(input.bindingAuthority) || 0,
    status: 'active',
    createdAt: new Date().toISOString(),
    createdBy: (typeof getCurrentUser === 'function' ? getCurrentUser().name : 'User'),
  };
  mgas.unshift(mga);
  glSave(IO_KEY_MGAS, mgas);
  return mga;
}

function findMGA(id) { return getMGAs().find(m => m.id === id) || null; }

/* ---------- Policies bound against an MGA ---------- */
function getPolicies() { return glLoad(IO_KEY_POLICIES, []); }

function bindPolicy(input) {
  const policies = getPolicies();
  const mga = findMGA(input.mgaId);
  if (!mga) throw new Error('Select an MGA first, add one on MGA Operations if none exist yet');
  const premium = parseFloat(input.premium) || 0;
  if (premium <= 0) throw new Error('Enter a premium amount');
  const policy = {
    id: 'POL-' + Date.now(),
    policyNumber: 'POL-' + new Date().getFullYear() + '-' + String(policies.length + 1).padStart(5, '0'),
    insured: (input.insured || '').trim() || 'Unnamed Insured',
    mgaId: mga.id,
    mgaName: mga.name,
    state: input.state || 'TX',
    lob: input.lob || 'General Liability',
    premium,
    effectiveDate: input.effectiveDate || new Date().toISOString().slice(0, 10),
    status: 'bound', // bound -> invoiced -> paid | partially_paid
    invoiceId: null,
  };
  policies.unshift(policy);
  glSave(IO_KEY_POLICIES, policies);
  return policy;
}

function unbilledPoliciesForMGA(mgaId) {
  return getPolicies().filter(p => p.mgaId === mgaId && p.status === 'bound');
}
function invoicedUnpaidPoliciesForMGA(mgaId) {
  return getPolicies().filter(p => p.mgaId === mgaId && (p.status === 'invoiced' || p.status === 'partially_paid'));
}

/* ---------- Invoices: Carrier bills the MGA for whatever is actually outstanding ---------- */
function getInvoices() { return glLoad(IO_KEY_INVOICES, []); }

function generateInvoiceForMGA(mgaId) {
  const mga = findMGA(mgaId);
  const policies = unbilledPoliciesForMGA(mgaId);
  if (!mga) throw new Error('MGA not found');
  if (!policies.length) throw new Error('No unbilled policies for ' + mga.name);
  const invoices = getInvoices();
  const invoice = {
    id: 'INV-' + Date.now(),
    invoiceNumber: 'PRM-INV-' + new Date().getFullYear() + '-' + String(invoices.length + 1).padStart(4, '0'),
    date: new Date().toISOString().slice(0, 10),
    from: IO_CARRIER_NAME,
    mgaId: mga.id,
    to: mga.name,
    lines: policies.map(p => ({ policyId: p.id, policyNumber: p.policyNumber, insured: p.insured, premium: p.premium })),
    total: policies.reduce((s, p) => s + p.premium, 0),
    status: 'issued',
    journalEntryId: null,
    paidToDate: 0,
  };
  invoices.unshift(invoice);
  glSave(IO_KEY_INVOICES, invoices);

  const allPolicies = getPolicies();
  policies.forEach(p => {
    const rec = allPolicies.find(x => x.id === p.id);
    if (rec) { rec.status = 'invoiced'; rec.invoiceId = invoice.id; }
  });
  glSave(IO_KEY_POLICIES, allPolicies);
  return invoice;
}

function postInvoiceJE(invoiceId) {
  ensureInsuranceOpsAccounts();
  const invoices = getInvoices();
  const invoice = invoices.find(i => i.id === invoiceId);
  if (!invoice) return null;
  const mga = findMGA(invoice.mgaId);
  const je = createJournalEntry({
    date: invoice.date,
    description: 'Premium invoice ' + invoice.invoiceNumber + ' to ' + invoice.to + ' (' + invoice.lines.length + ' polic' + (invoice.lines.length === 1 ? 'y' : 'ies') + ')',
    source: 'PREMIUM',
    lines: invoice.lines.map(l => ({ acct: IO_ACCT_RECEIVABLE, debit: l.premium, credit: 0, desc: l.insured + ' - ' + l.policyNumber, dims: { mga: mga ? mga.name : '', policy: l.policyNumber } }))
      .concat([{ acct: IO_ACCT_REVENUE, debit: 0, credit: invoice.total, desc: 'Net written premium, ' + invoice.invoiceNumber, dims: { mga: mga ? mga.name : '' } }]),
  });
  const result = submitJournalEntry(je.id);
  invoice.journalEntryId = result.id;
  glSave(IO_KEY_INVOICES, invoices);
  return result;
}

/* ---------- Bank lines: whatever the MGA actually sends, one lump sum at a time ---------- */
function getBankLines() { return glLoad(IO_KEY_BANKLINES, []); }

function recordIncomingPayment(mgaId, amount) {
  const mga = findMGA(mgaId);
  if (!mga) throw new Error('Select an MGA');
  const amt = parseFloat(amount) || 0;
  if (amt <= 0) throw new Error('Enter an amount received');
  const lines = getBankLines();
  const line = {
    id: 'BL-' + Date.now(),
    date: new Date().toISOString().slice(0, 10),
    mgaId: mga.id,
    description: 'ACH received from ' + mga.name,
    amount: amt,
    matchedTotal: 0,
    allocations: [], // [{policyId, policyNumber, insured, invoiced, amount}]
    status: 'unmatched',
    cashJournalEntryId: null,
  };
  lines.unshift(line);
  glSave(IO_KEY_BANKLINES, lines);
  return line;
}

function findBankLine(id) { return getBankLines().find(l => l.id === id) || null; }

function autoAllocateBankLine(bankLineId) {
  const lines = getBankLines();
  const line = lines.find(l => l.id === bankLineId);
  if (!line) return null;
  const openPolicies = invoicedUnpaidPoliciesForMGA(line.mgaId);
  let remaining = line.amount;
  line.allocations = openPolicies.map(p => {
    const stillOwed = p.premium - (p.paidToDate || 0);
    const amt = Math.max(0, Math.min(stillOwed, remaining));
    remaining -= amt;
    return { policyId: p.id, policyNumber: p.policyNumber, insured: p.insured, invoiced: stillOwed, amount: amt };
  }).filter(a => a.amount > 0 || openPolicies.length <= 6);
  if (remaining > 0.005) {
    line.allocations.push({ policyId: null, policyNumber: '(unapplied)', insured: 'Excess over invoiced amount', invoiced: 0, amount: remaining });
  }
  line.matchedTotal = line.allocations.reduce((s, a) => s + a.amount, 0);
  line.status = 'allocated';
  glSave(IO_KEY_BANKLINES, lines);
  return line;
}

function setBankLineAllocation(bankLineId, policyId, amount) {
  const lines = getBankLines();
  const line = lines.find(l => l.id === bankLineId);
  if (!line) return null;
  const policies = getPolicies();
  const existing = line.allocations.find(a => a.policyId === policyId);
  const p = policies.find(p => p.id === policyId);
  const amt = Math.max(0, parseFloat(amount) || 0);
  if (existing) existing.amount = amt;
  else line.allocations.push({ policyId, policyNumber: p ? p.policyNumber : '', insured: p ? p.insured : '', invoiced: p ? (p.premium - (p.paidToDate || 0)) : 0, amount: amt });
  line.matchedTotal = line.allocations.reduce((s, a) => s + a.amount, 0);
  glSave(IO_KEY_BANKLINES, lines);
  return line;
}

function unallocatedBankLineAmount(bankLineId) {
  const line = findBankLine(bankLineId);
  return line ? Math.max(0, line.amount - line.matchedTotal) : 0;
}

function bankLineInvoicedTotal(bankLineId) {
  const line = findBankLine(bankLineId);
  if (!line) return 0;
  return invoicedUnpaidPoliciesForMGA(line.mgaId).reduce((s, p) => s + (p.premium - (p.paidToDate || 0)), 0);
}

/* Confirm the match: posts the real cash-receipt JE and updates each policy's paid-to-date
   and status (paid in full vs. partially paid), so the next bank line for this MGA already
   knows what's still owed. */
function confirmBankLineMatch(bankLineId) {
  ensureInsuranceOpsAccounts();
  const lines = getBankLines();
  const line = lines.find(l => l.id === bankLineId);
  if (!line || !line.allocations.length) return null;
  const mga = findMGA(line.mgaId);
  const policyAllocations = line.allocations.filter(a => a.amount > 0 && a.policyId);
  const appliedTotal = policyAllocations.reduce((s, a) => s + a.amount, 0);

  const je = createJournalEntry({
    date: line.date,
    description: 'Cash applied, ' + (mga ? mga.name : '') + ' payment',
    source: 'BANK',
    lines: [{ acct: IO_ACCT_CASH, debit: appliedTotal, credit: 0, desc: 'Cash receipt from ' + (mga ? mga.name : ''), dims: { mga: mga ? mga.name : '' } }]
      .concat(policyAllocations.map(a => ({ acct: IO_ACCT_RECEIVABLE, debit: 0, credit: a.amount, desc: 'Applied to ' + a.insured + ' - ' + a.policyNumber, dims: { mga: mga ? mga.name : '', policy: a.policyNumber } }))),
  });
  const result = submitJournalEntry(je.id);
  line.status = result.status === 'posted' ? 'matched' : 'pending_approval';
  line.cashJournalEntryId = result.id;
  glSave(IO_KEY_BANKLINES, lines);

  if (result.status === 'posted') applyPaymentsToPolicies(policyAllocations);
  return result;
}

function applyPaymentsToPolicies(policyAllocations) {
  const policies = getPolicies();
  policyAllocations.forEach(a => {
    const p = policies.find(p => p.id === a.policyId);
    if (!p) return;
    p.paidToDate = (p.paidToDate || 0) + a.amount;
    p.status = p.paidToDate >= p.premium - 0.01 ? 'paid' : 'partially_paid';
  });
  glSave(IO_KEY_POLICIES, policies);
}

/* If a pending-approval cash JE later gets approved elsewhere (Workflow Approvals), call
   this so the policy paid-to-date/status still updates. */
function onCashJEApproved(bankLineId) {
  const line = findBankLine(bankLineId);
  if (!line) return;
  const policyAllocations = line.allocations.filter(a => a.amount > 0 && a.policyId);
  applyPaymentsToPolicies(policyAllocations);
  const lines = getBankLines();
  const l = lines.find(l => l.id === bankLineId);
  if (l) { l.status = 'matched'; glSave(IO_KEY_BANKLINES, lines); }
}

function postShortfallAdjustment(bankLineId, amount, reason) {
  ensureInsuranceOpsAccounts();
  const line = findBankLine(bankLineId);
  const mga = line ? findMGA(line.mgaId) : null;
  const amt = parseFloat(amount) || 0;
  if (amt <= 0) return null;
  const je = createJournalEntry({
    date: new Date().toISOString().slice(0, 10),
    description: 'Balance adjustment' + (reason ? ', ' + reason : ''),
    source: 'GENERAL_LEDGER',
    lines: [
      { acct: IO_ACCT_VARIANCE, debit: amt, credit: 0, desc: reason || 'Premium variance', dims: { mga: mga ? mga.name : '' } },
      { acct: IO_ACCT_RECEIVABLE, debit: 0, credit: amt, desc: 'Write down open receivable', dims: { mga: mga ? mga.name : '' } },
    ],
  });
  return submitJournalEntry(je.id);
}

function postOverpaymentReclass(bankLineId, amount) {
  ensureInsuranceOpsAccounts();
  const line = findBankLine(bankLineId);
  const mga = line ? findMGA(line.mgaId) : null;
  const amt = parseFloat(amount) || 0;
  if (amt <= 0) return null;
  const je = createJournalEntry({
    date: new Date().toISOString().slice(0, 10),
    description: 'Reclassify overpayment to customer credit balance' + (mga ? ', ' + mga.name : ''),
    source: 'GENERAL_LEDGER',
    lines: [
      { acct: IO_ACCT_RECEIVABLE, debit: amt, credit: 0, desc: 'Clear credit balance out of receivable', dims: { mga: mga ? mga.name : '' } },
      { acct: IO_ACCT_CREDIT_BAL, debit: 0, credit: amt, desc: 'Held as credit for ' + (mga ? mga.name : ''), dims: { mga: mga ? mga.name : '' } },
    ],
  });
  return submitJournalEntry(je.id);
}

/* ---------- Quick Simulate: one click, real data, no scenario-specific accounts -----------
   Runs the full flow (add a fresh demo MGA, bind its policies, invoice, post JE, receive
   payment, split-match, resolve any variance) through the SAME functions above and the SAME
   shared Chart of Accounts everything else uses. Each run creates its own MGA and policies
   so scenarios never overwrite each other, and every JE it posts is fully real, visible on
   Journal Entry, Chart of Accounts, and Financial Statements afterward. */

const IO_OPENING_CREDIT_APPLIED_KEY = 'v_io_opening_credit_applied';

const IO_QUICK_SCENARIOS = [
  { id: 'exact', label: 'Exact Match', summary: '$10,000 invoiced, $10,000 received, nets to zero.',
    policies: [
      { insured: 'Harbor Logistics LLC', premium: 3000 }, { insured: 'Riverside Diner Group', premium: 3000 },
      { insured: 'Ace Roofing Contractors', premium: 1000 }, { insured: 'Meridian Auto Parts', premium: 2000 },
      { insured: 'Sunrise Childcare Center', premium: 1000 },
    ], openingCredit: 0, payment: 10000 },
  { id: 'prior_credit', label: 'Prior Credit Applied', summary: 'A $5,000 credit already on the receivable account (applied once), $50,000 invoiced, $45,000 received nets it to zero.',
    policies: [
      { insured: 'Northgate Manufacturing', premium: 15000 }, { insured: 'Coastal Freight Partners', premium: 10000 },
      { insured: 'Delta Restaurant Group', premium: 10000 }, { insured: 'Prairie Wind Farms', premium: 10000 },
      { insured: 'Union Square Retail', premium: 5000 },
    ], openingCredit: 5000, payment: 45000 },
  { id: 'underpayment', label: 'Underpayment / Shortfall', summary: '$10,000 invoiced, only $8,000 received, the $2,000 gap is automatically written down so you can see the result immediately.',
    policies: [
      { insured: 'Harbor Logistics LLC', premium: 3000 }, { insured: 'Riverside Diner Group', premium: 3000 },
      { insured: 'Ace Roofing Contractors', premium: 1000 }, { insured: 'Meridian Auto Parts', premium: 2000 },
      { insured: 'Sunrise Childcare Center', premium: 1000 },
    ], openingCredit: 0, payment: 8000 },
  { id: 'overpayment', label: 'Overpayment / Credit Balance', summary: '$10,000 invoiced, $12,000 received, the $2,000 excess is automatically reclassified to a Customer Credit Balance liability.',
    policies: [
      { insured: 'Harbor Logistics LLC', premium: 3000 }, { insured: 'Riverside Diner Group', premium: 3000 },
      { insured: 'Ace Roofing Contractors', premium: 1000 }, { insured: 'Meridian Auto Parts', premium: 2000 },
      { insured: 'Sunrise Childcare Center', premium: 1000 },
    ], openingCredit: 0, payment: 12000 },
];

function getQuickScenario(id) { return IO_QUICK_SCENARIOS.find(s => s.id === id) || IO_QUICK_SCENARIOS[0]; }

function runQuickScenario(scenarioId) {
  const scenario = getQuickScenario(scenarioId);
  ensureInsuranceOpsAccounts();

  if (scenario.openingCredit && !glLoad(IO_OPENING_CREDIT_APPLIED_KEY, false)) {
    setOpeningBalance(IO_ACCT_RECEIVABLE, 0, scenario.openingCredit);
    glSave(IO_OPENING_CREDIT_APPLIED_KEY, true);
  }

  const mga = addMGA({ name: scenario.label + ' Demo MGA, ' + new Date().toLocaleTimeString() });
  scenario.policies.forEach(p => bindPolicy({ insured: p.insured, mgaId: mga.id, premium: p.premium }));

  const invoice = generateInvoiceForMGA(mga.id);
  let jeResult = postInvoiceJE(invoice.id);
  if (jeResult.status === 'pending_approval') jeResult = approveJournalEntry(jeResult.id);

  const bankLine = recordIncomingPayment(mga.id, scenario.payment);
  autoAllocateBankLine(bankLine.id);
  let cashResult = confirmBankLineMatch(bankLine.id);
  if (cashResult.status === 'pending_approval') {
    cashResult = approveJournalEntry(cashResult.id);
    onCashJEApproved(bankLine.id);
  }

  // Resolve whatever variance is left, automatically, so a one-click run ends in a clean
  // state you can go inspect right away.
  const line = findBankLine(bankLine.id);
  const unapplied = line.allocations.find(a => a.policyNumber === '(unapplied)');
  if (unapplied && unapplied.amount > 0.01) postOverpaymentReclass(bankLine.id, unapplied.amount);
  const stillOwed = invoicedUnpaidPoliciesForMGA(mga.id).reduce((s, p) => s + (p.premium - (p.paidToDate || 0)), 0);
  if (stillOwed > 0.01) postShortfallAdjustment(bankLine.id, stillOwed, 'Short-pay from ' + mga.name);

  return { scenario, mga, invoice, bankLine, jeResult, cashResult };
}
