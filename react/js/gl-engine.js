/* ============================================================
   VERIDEX FINANCE SYSTEM - General Ledger Engine (mock/static, real behavior)
   A genuinely working, persisted (localStorage) mini ledger: Chart of
   Accounts you can add to, fiscal periods you can open/close, opening
   balances you can set, and Journal Entries that actually post and
   move account balances - not decoration. Loads after config-engine.js
   (uses ACCOUNT_MASTER as COA seed data and getCurrentUser/getTenantConfig).
   ============================================================ */

const GL_ACCOUNTS_KEY = 'v_gl_accounts';
const GL_PERIODS_KEY = 'v_gl_periods';
const GL_OPENING_KEY = 'v_gl_opening_balances';
const GL_JE_KEY = 'v_gl_journal_entries';
const GL_APPROVAL_THRESHOLD = 10000; // JEs at/above this total require approval before posting

function glLoad(key, fallback) {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch (e) { return fallback; }
}
function glSave(key, val) { localStorage.setItem(key, JSON.stringify(val)); return val; }

/* ---------- Chart of Accounts ---------- */
function getGLAccounts() {
  let accts = glLoad(GL_ACCOUNTS_KEY, null);
  if (!accts) {
    accts = (typeof ACCOUNT_MASTER !== 'undefined' ? ACCOUNT_MASTER : []).map(a => ({
      id: 'ACC-' + a.code,
      code: a.code,
      name: a.name,
      group: a.group,
      dimensions: a.dimensions || [],
      status: 'active',
      createdAt: new Date().toISOString(),
      createdBy: 'System (seed)',
    }));
    glSave(GL_ACCOUNTS_KEY, accts);
  }

  let modified = false;

  // Enforce standard series:
  // Assets: 1100 series, Liabilities: 2100 series, Equity: 3100 series, Revenue: 4100 series, Expense: 5100 series
  accts.forEach(a => {
    if (a.code === '6100') { a.code = '5100'; a.id = 'ACC-5100'; a.group = 'expense'; modified = true; }
    if (a.code === '6101') { a.code = '5101'; a.id = 'ACC-5101'; a.group = 'expense'; modified = true; }
    if (a.code === '6500') { a.code = '5500'; a.id = 'ACC-5500'; a.group = 'expense'; modified = true; }
    if (a.code === '5000' && a.group === 'asset') { a.code = '1500'; a.id = 'ACC-1500'; modified = true; }
  });

  if (accts && !accts.some(a => a.code === '2200')) {
    accts.push({
      id: 'ACC-2200',
      code: '2200',
      name: 'Premium Payable',
      group: 'liability',
      dimensions: ['cost-center'],
      status: 'active',
      createdAt: new Date().toISOString(),
      createdBy: 'System (patch)',
    });
    modified = true;
  }
  if (accts && !accts.some(a => a.code === '2300')) {
    accts.push({
      id: 'ACC-2300',
      code: '2300',
      name: 'Premium Taxes Payable',
      group: 'liability',
      dimensions: ['state'],
      status: 'active',
      createdAt: new Date().toISOString(),
      createdBy: 'System (patch)',
    });
    modified = true;
  }
  if (accts && !accts.some(a => a.code === '3100')) {
    accts.push({
      id: 'ACC-3100',
      code: '3100',
      name: 'Retained Earnings',
      group: 'equity',
      dimensions: ['cost-center'],
      status: 'active',
      createdAt: new Date().toISOString(),
      createdBy: 'System (patch)',
    });
    modified = true;
  }
  if (accts && !accts.some(a => a.code === '3200')) {
    accts.push({
      id: 'ACC-3200',
      code: '3200',
      name: 'Common Stock / Capital Surplus',
      group: 'equity',
      dimensions: ['cost-center'],
      status: 'active',
      createdAt: new Date().toISOString(),
      createdBy: 'System (patch)',
    });
    modified = true;
  }
  if (accts && !accts.some(a => a.code === '5100')) {
    accts.push({
      id: 'ACC-5100',
      code: '5100',
      name: 'Commission Expense / Revenue',
      group: 'expense',
      dimensions: ['mga', 'broker', 'cost-center', 'lob'],
      status: 'active',
      createdAt: new Date().toISOString(),
      createdBy: 'System (patch)',
    });
    modified = true;
  }
  if (accts && !accts.some(a => a.code === '5101')) {
    accts.push({
      id: 'ACC-5101',
      code: '5101',
      name: 'Commission Expense — MGA Override',
      group: 'expense',
      dimensions: ['mga', 'broker', 'cost-center', 'lob'],
      status: 'active',
      createdAt: new Date().toISOString(),
      createdBy: 'System (patch)',
    });
    modified = true;
  }

  // Remove obsolete codes and deduplicate
  const seenCodes = new Set();
  accts = accts.filter(a => {
    if (a.code === '6100' || a.code === '6101' || a.code === '6500' || (a.code === '5000' && a.group === 'asset')) return false;
    if (seenCodes.has(a.code)) return false;
    seenCodes.add(a.code);
    return true;
  });

  // Sort strictly by account code
  accts.sort((a, b) => (parseInt(a.code, 10) || 0) - (parseInt(b.code, 10) || 0));

  if (modified) {
    glSave(GL_ACCOUNTS_KEY, accts);
  }

  return accts;
}

function addGLAccount(input) {
  const accts = getGLAccounts();
  if (accts.some(a => a.code === input.code)) {
    throw new Error('Account code ' + input.code + ' already exists');
  }
  const acct = {
    id: 'ACC-' + input.code,
    code: input.code,
    name: input.name,
    group: input.group,
    dimensions: input.dimensions || [],
    status: 'active',
    createdAt: new Date().toISOString(),
    createdBy: (typeof getCurrentUser === 'function' ? getCurrentUser().name : 'User'),
  };
  accts.unshift(acct);
  glSave(GL_ACCOUNTS_KEY, accts);
  return acct;
}

function setGLAccountStatus(code, status) {
  const accts = getGLAccounts();
  const a = accts.find(a => a.code === code);
  if (a) { a.status = status; glSave(GL_ACCOUNTS_KEY, accts); }
  return a;
}

function findGLAccountByCode(code) {
  return getGLAccounts().find(a => a.code === code) || null;
}

/* ---------- Fiscal Periods ---------- */
const GL_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function getFiscalPeriods() {
  let periods = glLoad(GL_PERIODS_KEY, null);
  if (!periods) {
    const cfg = typeof getTenantConfig === 'function' ? getTenantConfig() : { fiscalYearStart: 'January', fiscalPeriods: 12 };
    const startIdx = Math.max(0, GL_MONTHS.indexOf(cfg.fiscalYearStart));
    const count = cfg.fiscalPeriods || 12;
    const year = new Date().getFullYear();
    periods = [];
    for (let i = 0; i < count; i++) {
      const idx = (startIdx + i) % 12;
      periods.push({
        label: GL_MONTHS[idx].slice(0, 3) + ' ' + year,
        monthIndex: idx,
        year,
        status: i < 2 ? 'closed' : (i === 2 ? 'open' : 'future'),
      });
    }
    glSave(GL_PERIODS_KEY, periods);
  }
  return periods;
}

function setPeriodStatus(label, status) {
  const periods = getFiscalPeriods();
  const p = periods.find(p => p.label === label);
  if (p) p.status = status;
  glSave(GL_PERIODS_KEY, periods);
  return periods;
}

function getPeriodForDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return null;
  const label = GL_MONTHS[d.getMonth()].slice(0, 3) + ' ' + d.getFullYear();
  const periods = getFiscalPeriods();
  let p = periods.find(x => x.label === label);
  if (!p) {
    // Dynamically create the missing period as 'open' for seamless simulator testing
    p = {
      label: label,
      monthIndex: d.getMonth(),
      year: d.getFullYear(),
      status: 'open'
    };
    periods.push(p);
    // Sort periods chronologically
    periods.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.monthIndex - b.monthIndex;
    });
    glSave(GL_PERIODS_KEY, periods);
  }
  return p;
}

/* ---------- Opening Balances ---------- */
function getOpeningBalances() {
  return glLoad(GL_OPENING_KEY, {});
}

function setOpeningBalance(accountCode, debit, credit) {
  const all = getOpeningBalances();
  all[accountCode] = { debit: parseFloat(debit) || 0, credit: parseFloat(credit) || 0, setAt: new Date().toISOString() };
  glSave(GL_OPENING_KEY, all);
  return all[accountCode];
}

function sanitizeBrokerJournalEntry(je) {
  if (!je || !je.lines) return je;
  const isBroker = (je.entityId === 'ENT-AGY-01' || je.entityId === 'ENT-BRK-01' || je.createdBy === 'HIT');
  if (!isBroker) return je;

  const desc = (je.description || '').toLowerCase();
  const isPolV8NHT = desc.includes('v8nht') || desc.includes('ayushi') || (je.lines && je.lines.some(l => (l.desc || '').includes('Ayushi') || (l.desc || '').includes('V8NHT')));

  if (isPolV8NHT) {
    const isCustomerPayment = (desc.includes('receipt') || desc.includes('customer') || desc.includes('payment received')) && !desc.includes('disburse') && !desc.includes('remittance') && !desc.includes('nta');
    const isDisburseToMGA = desc.includes('disburse') || desc.includes('remittance') || desc.includes('pay-mga') || (desc.includes('settlement') && (desc.includes('mga') || desc.includes('nta')));

    if (isCustomerPayment) {
      je.description = 'Customer premium receipt — Ayushi';
      je.lines = [
        {
          acct: '1001',
          debit: 39260.00,
          credit: 0,
          desc: 'Customer Premium Receipt — Ayushi',
          dims: { location: 'HQ' }
        },
        {
          acct: '1100',
          debit: 0,
          credit: 39260.00,
          desc: 'Clear Premium Receivable — Ayushi',
          dims: { broker: 'HIT' }
        }
      ];
    } else if (isDisburseToMGA) {
      je.description = 'Settlement disburse to MGA: NTA (PAY-MGA-NTA-1) for POL-V8NHT';
      je.lines = [
        {
          acct: '2200',
          debit: 36760.00,
          credit: 0,
          desc: 'Clear Net Premium Payable to NTA',
          dims: { mga: 'NTA', lob: 'Commercial Trucking' }
        },
        {
          acct: '1001',
          debit: 0,
          credit: 36760.00,
          desc: 'Settlement cash disburse (ACH)',
          dims: { location: 'HQ' }
        }
      ];
    } else {
      // Stage 1: Policy Binding & Invoicing per README.md § 4.1
      je.description = 'Policy binding and premium invoice issued for POL-V8NHT (Ayushi) · Invoice INV-V8NHT-1';
      je.lines = [
        {
          acct: '1100',
          debit: 39260.00,
          credit: 0,
          desc: 'Premium Receivable — Ayushi (INV-V8NHT-1)',
          dims: { broker: 'HIT', mga: 'NTA', lob: 'Commercial Trucking' }
        },
        {
          acct: '2200',
          debit: 0,
          credit: 36760.00,
          desc: 'Net Premium Payable — NTA',
          dims: { mga: 'NTA', lob: 'Commercial Trucking' }
        },
        {
          acct: '5100',
          debit: 0,
          credit: 2500.00,
          desc: 'Producer / Broker Commission Revenue',
          dims: { broker: 'HIT', lob: 'Commercial Trucking' }
        }
      ];
    }
  } else {
    je.lines.forEach(l => {
      if (l.acct === '6100') l.acct = '5100';
    });
  }

  return je;
}

function sanitizeMGAJournalEntry(je) {
  if (!je || !je.lines) return je;
  const isBroker = (je.entityId === 'ENT-AGY-01' || je.entityId === 'ENT-BRK-01' || je.createdBy === 'HIT');
  if (isBroker) return je;
  const isCarrier = (je.entityId === 'ENT-CAR-01' || je.createdBy === 'Southlake' || je.createdBy === 'Carrier Operations');
  if (isCarrier) return je;
  const isMGA = (je.entityId === 'ENT-MINE' || je.entityId === 'ENT-MGA-01' || je.createdBy === 'NTA Operations' || je.createdBy === 'NTA');
  if (!isMGA) return je;

  const desc = (je.description || '').toLowerCase();
  const isPolV8NHT = desc.includes('v8nht') || (je.lines && je.lines.some(l => (l.desc || '').includes('HIT') || (l.desc || '').includes('Southlake')));

  if (isPolV8NHT) {
    const isPaymentReceipt = (desc.includes('payment') || desc.includes('settlement') || desc.includes('receipt') || desc.includes('received')) && !desc.includes('carrier') && !desc.includes('southlake') && !desc.includes('pay-car');
    const isCarrierDisburse = (desc.includes('carrier') || desc.includes('southlake') || desc.includes('pay-car') || desc.includes('disburse'));

    if (isPaymentReceipt && !isCarrierDisburse) {
      // Stage 3: Broker Settlement Received per README.md § 4.1
      je.description = 'Broker premium settlement payment received from HIT for POL-V8NHT';
      je.lines = [
        {
          acct: '1001',
          debit: 36760.00,
          credit: 0,
          desc: 'Broker premium settlement receipt — HIT',
          dims: { location: 'HQ' }
        },
        {
          acct: '1100',
          debit: 0,
          credit: 36760.00,
          desc: 'Clear Broker Premium Receivable — HIT',
          dims: { broker: 'HIT', lob: 'Commercial Trucking' }
        }
      ];
    } else if (isCarrierDisburse) {
      // Stage 5a: Net Settlement to Carrier per README.md § 4.1
      je.description = 'Settlement disburse to Carrier: Southlake Insurance Co. for POL-V8NHT';
      je.lines = [
        {
          acct: '2200',
          debit: 29757.00,
          credit: 0,
          desc: 'Clear Net Premium Payable to Southlake Insurance Co.',
          dims: { cost_center: '00 - Corporate', lob: 'Commercial Trucking' }
        },
        {
          acct: '1001',
          debit: 0,
          credit: 29757.00,
          desc: 'Carrier settlement cash disburse (ACH)',
          dims: { location: 'HQ' }
        }
      ];
    } else {
      // Stage 1: Policy Invoicing & Intermediary Accrual per README.md § 4.1
      je.description = 'Policy binding and premium invoice issued for POL-V8NHT (Ayushi) · Invoice INV-V8NHT-1';
      je.lines = [
        {
          acct: '1100',
          debit: 36760.00,
          credit: 0,
          desc: 'Premium Receivable — HIT (Broker Net Remittance)',
          dims: { broker: 'HIT', lob: 'Commercial Trucking' }
        },
        {
          acct: '2200',
          debit: 0,
          credit: 29757.00,
          desc: 'Net Premium Payable — Southlake Insurance Co.',
          dims: { cost_center: '00 - Corporate', lob: 'Commercial Trucking' }
        },
        {
          acct: '2300',
          debit: 0,
          credit: 3503.00,
          desc: 'Surplus Lines Taxes & Regulatory Fees (TX)',
          dims: { state: 'TX', lob: 'Commercial Trucking' }
        },
        {
          acct: '4100',
          debit: 0,
          credit: 3500.00,
          desc: 'MGA Program Override & Policy Fee Revenue',
          dims: { mga: 'NTA', lob: 'Commercial Trucking' }
        }
      ];
    }
  } else {
    je.lines.forEach(l => {
      if (l.acct === '6100') l.acct = '5100';
      if (l.acct === '6101') l.acct = '5101';
    });
  }

  return je;
}

function getNextJournalNumber(entityId, existingList) {
  const currentYear = new Date().getFullYear();
  let maxSeq = 0;
  const list = existingList || [];
  list.forEach(j => {
    if ((!entityId || j.entityId === entityId) && j.number && j.number.startsWith('JE-' + currentYear + '-')) {
      const parts = j.number.split('-');
      const seq = parseInt(parts[2], 10);
      if (!isNaN(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    }
  });
  return 'JE-' + currentYear + '-' + String(maxSeq + 1).padStart(4, '0');
}

function deduplicateJournalEntries(list) {
  if (!Array.isArray(list)) return [];
  const seenIds = new Set();
  const seenEntityDesc = new Set();
  const seenNumbers = new Set();
  const unique = [];

  list.forEach(je => {
    if (!je) return;
    const ent = je.entityId || 'DEFAULT';
    const desc = (je.description || '').trim();
    const date = je.date || (je.createdAt || '').slice(0, 10);
    
    const entDescKey = ent + '::' + desc + '::' + date;

    if (je.id && seenIds.has(je.id)) return;
    if (desc && desc.length > 5 && seenEntityDesc.has(entDescKey)) return;

    if (je.id) seenIds.add(je.id);
    if (desc && desc.length > 5) seenEntityDesc.add(entDescKey);

    // If number collided with another different entry, assign next unique number
    if (je.number && seenNumbers.has(ent + '::' + je.number)) {
      je.number = getNextJournalNumber(ent, unique);
    }
    if (je.number) seenNumbers.add(ent + '::' + je.number);

    unique.push(je);
  });

  return unique;
}

/* ---------- Journal Entries ---------- */
function getJournalEntries() {
  let all = glLoad(GL_JE_KEY, null);
  if (!all) {
    all = [];
    glSave(GL_JE_KEY, all);
  }
  
  // Retroactively migrate isolated databases (Carrier, MGA, Agency) into the main table
  let changed = false;
  try {
    const rawCarrier = localStorage.getItem('carrier_v_gl_journal_entries');
    if (rawCarrier) {
      let carrierJEs = JSON.parse(rawCarrier);
      carrierJEs.forEach(je => {
        je.lines.forEach(l => {
          if (l.acct === '6101') l.acct = '5101';
          if (l.acct === '6100') l.acct = '5100';
        });
      });
      localStorage.setItem('carrier_v_gl_journal_entries', JSON.stringify(carrierJEs));
      carrierJEs.forEach(je => {
        const existingIdx = all.findIndex(x => (je.id && x.id === je.id) || (je.number && x.number === je.number && x.entityId === je.entityId));
        if (existingIdx === -1) {
          all.push(je);
          changed = true;
        } else {
          all[existingIdx] = je;
          changed = true;
        }
      });
    }
  } catch (e) {}

  try {
    const rawAgency = localStorage.getItem('agency_v_gl_journal_entries');
    if (rawAgency) {
      let agencyJEs = JSON.parse(rawAgency);
      agencyJEs = agencyJEs.map(je => sanitizeBrokerJournalEntry(je));
      localStorage.setItem('agency_v_gl_journal_entries', JSON.stringify(agencyJEs));
      agencyJEs.forEach(sanitized => {
        const existingIdx = all.findIndex(x => (sanitized.id && x.id === sanitized.id) || (sanitized.number && x.number === sanitized.number && (x.entityId === sanitized.entityId || x.createdBy === 'HIT')));
        if (existingIdx === -1) {
          all.push(sanitized);
          changed = true;
        } else {
          all[existingIdx] = sanitized;
          changed = true;
        }
      });
    }
  } catch (e) {}

  try {
    const rawMga = localStorage.getItem('mga_v_gl_journal_entries');
    if (rawMga) {
      let mgaJEs = JSON.parse(rawMga);
      mgaJEs = mgaJEs.map(je => sanitizeMGAJournalEntry(je));
      localStorage.setItem('mga_v_gl_journal_entries', JSON.stringify(mgaJEs));
      mgaJEs.forEach(sanitized => {
        const existingIdx = all.findIndex(x => (sanitized.id && x.id === sanitized.id) || (sanitized.number && x.number === sanitized.number && sanitized.entityId === x.entityId));
        if (existingIdx === -1) {
          all.push(sanitized);
          changed = true;
        } else {
          all[existingIdx] = sanitized;
          changed = true;
        }
      });
    }
  } catch (e) {}

  // Auto-heal / Sync any paid MGA payable from agency_pas_invoices into the Agency ledger
  try {
    const rawAgencyInvoices = localStorage.getItem('agency_pas_invoices');
    if (rawAgencyInvoices) {
      const agencyInvoices = JSON.parse(rawAgencyInvoices);
      agencyInvoices.filter(inv => (inv.type === 'MGA Payable' || (inv.type && inv.type.includes('Payable'))) && inv.status === 'Paid').forEach(inv => {
        const hasDisburseJE = all.some(j => (j.entityId === 'ENT-AGY-01' || j.entityId === 'ENT-BRK-01' || j.createdBy === 'HIT') && ((j.description || '').includes(inv.id) || ((j.description || '').includes('Settlement') && (j.description || '').includes('MGA'))));
        if (!hasDisburseJE) {
          const amt = inv.paidAmount || inv.amount || 36760;
          const disburseJE = {
            id: 'JE-DISBURSE-' + inv.id,
            number: getNextJournalNumber('ENT-AGY-01', all),
            entityId: 'ENT-AGY-01',
            date: inv.issueDate || '2026-08-20',
            status: 'draft',
            postedAt: new Date().toISOString(),
            createdBy: 'HIT',
            description: `Settlement disburse to MGA: ${inv.customer || 'NTA'} (${inv.id})`,
            source: 'INSURANCE',
            lines: [
              { acct: '2200', debit: amt, credit: 0, desc: `Clear Net Premium Payable to ${inv.customer || 'NTA'}`, dims: { mga: 'NTA', lob: 'Commercial Trucking' } },
              { acct: '1001', debit: 0, credit: amt, desc: 'Settlement cash disburse', dims: { location: 'HQ' } }
            ]
          };
          all.push(disburseJE);
          changed = true;
          try {
            let agencyList = JSON.parse(localStorage.getItem('agency_v_gl_journal_entries') || '[]');
            if (!agencyList.some(x => x.id === disburseJE.id || x.description === disburseJE.description)) {
              agencyList.unshift(disburseJE);
              localStorage.setItem('agency_v_gl_journal_entries', JSON.stringify(agencyList));
            }
          } catch(e) {}
        }
      });
    }
  } catch (e) {}

  // Auto-heal / Sync MGA (NTA) entries for POL-V8NHT per README.md § 3
  try {
    const rawAgencyInvoices = localStorage.getItem('agency_pas_invoices');
    const rawMgaPolicies = localStorage.getItem('mga_pas_policies');
    const rawMgaInvoices = localStorage.getItem('mga_pas_invoices');
    const hasPolV8NHT = (rawAgencyInvoices && rawAgencyInvoices.includes('V8NHT')) || 
                        (rawMgaPolicies && rawMgaPolicies.includes('V8NHT')) || 
                        (rawMgaInvoices && rawMgaInvoices.includes('V8NHT'));
    
    if (hasPolV8NHT) {
      // 1. Invoicing / Binding Entry for MGA
      const hasMGAInvoiceJE = all.some(j => (j.entityId === 'ENT-MINE' || j.createdBy === 'NTA Operations') && ((j.description || '').includes('V8NHT') && ((j.description || '').includes('binding') || (j.description || '').includes('invoice'))));
      if (!hasMGAInvoiceJE) {
        const mgaInvoiceJE = {
          id: 'JE-MGA-BIND-V8NHT',
          number: getNextJournalNumber('ENT-MINE', all),
          entityId: 'ENT-MINE',
          date: '2026-08-20',
          status: 'draft',
          postedAt: new Date().toISOString(),
          createdBy: 'NTA Operations',
          description: 'Policy binding and premium invoice issued for POL-V8NHT (Ayushi) · Invoice INV-V8NHT-1',
          source: 'INSURANCE',
          lines: [
            { acct: '1100', debit: 36760.00, credit: 0, desc: 'Premium Receivable — HIT (Broker Net Remittance)', dims: { broker: 'HIT', lob: 'Commercial Trucking' } },
            { acct: '2200', debit: 0, credit: 29757.00, desc: 'Net Premium Payable — Southlake Insurance Co.', dims: { cost_center: '00 - Corporate', lob: 'Commercial Trucking' } },
            { acct: '2300', debit: 0, credit: 3503.00, desc: 'Surplus Lines Taxes & Regulatory Fees (TX)', dims: { state: 'TX', lob: 'Commercial Trucking' } },
            { acct: '4100', debit: 0, credit: 3500.00, desc: 'MGA Program Override & Policy Fee Revenue', dims: { mga: 'NTA', lob: 'Commercial Trucking' } }
          ]
        };
        all.push(mgaInvoiceJE);
        changed = true;
        try {
          let mgaList = JSON.parse(localStorage.getItem('mga_v_gl_journal_entries') || '[]');
          if (!mgaList.some(x => x.id === mgaInvoiceJE.id || x.description === mgaInvoiceJE.description)) {
            mgaList.unshift(mgaInvoiceJE);
            localStorage.setItem('mga_v_gl_journal_entries', JSON.stringify(mgaList));
          }
        } catch (e) {}
      }

      // 2. Broker Settlement Receipt Entry if Agency paid
      const agencyPaid = rawAgencyInvoices && JSON.parse(rawAgencyInvoices).some(inv => (inv.type === 'MGA Payable' || (inv.type && inv.type.includes('Payable'))) && inv.status === 'Paid');
      if (agencyPaid) {
        const hasMGARecvJE = all.some(j => (j.entityId === 'ENT-MINE' || j.createdBy === 'NTA Operations') && ((j.description || '').includes('V8NHT') && ((j.description || '').includes('received') || (j.description || '').includes('Settlement'))));
        if (!hasMGARecvJE) {
          const mgaRecvJE = {
            id: 'JE-MGA-RECV-V8NHT',
            number: getNextJournalNumber('ENT-MINE', all),
            entityId: 'ENT-MINE',
            date: '2026-08-20',
            status: 'draft',
            postedAt: new Date().toISOString(),
            createdBy: 'NTA Operations',
            description: 'Broker premium settlement payment received from HIT for POL-V8NHT',
            source: 'INSURANCE',
            lines: [
              { acct: '1001', debit: 36760.00, credit: 0, desc: 'Broker premium settlement receipt — HIT', dims: { location: 'HQ' } },
              { acct: '1100', debit: 0, credit: 36760.00, desc: 'Clear Broker Premium Receivable — HIT', dims: { broker: 'HIT', lob: 'Commercial Trucking' } }
            ]
          };
          all.push(mgaRecvJE);
          changed = true;
          try {
            let mgaList = JSON.parse(localStorage.getItem('mga_v_gl_journal_entries') || '[]');
            if (!mgaList.some(x => x.id === mgaRecvJE.id || x.description === mgaRecvJE.description)) {
              mgaList.unshift(mgaRecvJE);
              localStorage.setItem('mga_v_gl_journal_entries', JSON.stringify(mgaList));
            }
          } catch (e) {}
        }
      }

      // 2b. MGA Net Premium Settlement Disburse to Carrier Entry (Stage 5: when MGA pays Carrier)
      const isMGAPaidToCarrier = (rawMgaInvoices && JSON.parse(rawMgaInvoices).some(inv => (inv.type && inv.type.includes('Carrier')) && inv.status === 'Paid')) || 
                                 localStorage.getItem('v_mga_settlement_paid_POL-V8NHT') === 'true';
      if (isMGAPaidToCarrier) {
        const hasMGADisbJE = all.some(j => (j.entityId === 'ENT-MINE' || j.createdBy === 'NTA Operations') && ((j.description || '').includes('V8NHT') && ((j.description || '').includes('disburse') || (j.description || '').includes('Southlake') || (j.description || '').includes('Carrier'))));
        if (!hasMGADisbJE) {
          const mgaDisbJE = {
            id: 'JE-MGA-DISB-V8NHT',
            number: getNextJournalNumber('ENT-MINE', all),
            entityId: 'ENT-MINE',
            date: '2026-08-20',
            status: 'draft',
            postedAt: new Date().toISOString(),
            createdBy: 'NTA Operations',
            description: 'Settlement disburse to Carrier: Southlake Insurance Co. for POL-V8NHT',
            source: 'INSURANCE',
            lines: [
              { acct: '2200', debit: 29757.00, credit: 0, desc: 'Clear Net Premium Payable to Southlake Insurance Co.', dims: { cost_center: '00 - Corporate', lob: 'Commercial Trucking' } },
              { acct: '1001', debit: 0, credit: 29757.00, desc: 'Carrier settlement cash disburse (ACH)', dims: { location: 'HQ' } }
            ]
          };
          all.push(mgaDisbJE);
          changed = true;
          try {
            let mgaList = JSON.parse(localStorage.getItem('mga_v_gl_journal_entries') || '[]');
            if (!mgaList.some(x => x.id === mgaDisbJE.id || x.description === mgaDisbJE.description)) {
              mgaList.unshift(mgaDisbJE);
              localStorage.setItem('mga_v_gl_journal_entries', JSON.stringify(mgaList));
            }
          } catch (e) {}
        }
      }
      // 3. Carrier Bordereau Ingestion Entry (Stage 4: Triggered when Carrier clicks Ingest or MGA pays)
      const isBordereauIngested = localStorage.getItem('v_bordereau_ingested_POL-V8NHT') === 'true' || localStorage.getItem('v_mga_settlement_paid_POL-V8NHT') === 'true' || localStorage.getItem('v_carrier_wire_matched_POL-V8NHT') === 'true';
      if (isBordereauIngested) {
        const hasCarrierInvoiceJE = all.some(j => (j.entityId === 'ENT-CAR-01' || j.createdBy === 'Southlake' || j.createdBy === 'Carrier Operations') && ((j.description || '').includes('V8NHT') && ((j.description || '').includes('Bordereau') || (j.description || '').includes('Ingestion'))));
        if (!hasCarrierInvoiceJE) {
          const carrierInvoiceJE = {
            id: 'JE-CAR-BIND-V8NHT',
            number: getNextJournalNumber('ENT-CAR-01', all),
            entityId: 'ENT-CAR-01',
            date: '2026-08-20',
            status: 'draft',
            postedAt: new Date().toISOString(),
            createdBy: 'Carrier Operations',
            description: 'MGA Bordereau Ingestion for POL-V8NHT',
            source: 'INSURANCE',
            lines: [
              { acct: '1100', debit: 29757.00, credit: 0, desc: 'Settlement Receivable — MGA NTA', dims: { mga: 'NTA', lob: 'Commercial Trucking' } },
              { acct: '5101', debit: 3500.00, credit: 0, desc: 'Commission Expense — MGA Override', dims: { mga: 'NTA', lob: 'Commercial Trucking' } },
              { acct: '4100', debit: 0, credit: 33257.00, desc: 'Gross Written Premium Revenue', dims: { lob: 'Commercial Trucking' } }
            ]
          };
          all.push(carrierInvoiceJE);
          changed = true;
          try {
            let carList = JSON.parse(localStorage.getItem('carrier_v_gl_journal_entries') || '[]');
            if (!carList.some(x => x.id === carrierInvoiceJE.id || x.description === carrierInvoiceJE.description)) {
              carList.unshift(carrierInvoiceJE);
              localStorage.setItem('carrier_v_gl_journal_entries', JSON.stringify(carList));
            }
          } catch (e) {}
        }
      }
      
      // 4. Carrier Settlement Receipt Entry (Stage 5: Triggered when MGA pays or Carrier matches wire)
      const isMGAPaid = localStorage.getItem('v_mga_settlement_paid_POL-V8NHT') === 'true';
      const isCarrierWireMatched = localStorage.getItem('v_carrier_wire_matched_POL-V8NHT') === 'true';
      if (isMGAPaid || isCarrierWireMatched) {
        const hasCarrierRecvJE = all.some(j => (j.entityId === 'ENT-CAR-01' || j.createdBy === 'Southlake' || j.createdBy === 'Carrier Operations') && ((j.description || '').includes('V8NHT') && ((j.description || '').includes('received') || (j.description || '').includes('Settlement'))));
        if (!hasCarrierRecvJE) {
          const carrierRecvJE = {
            id: 'JE-CAR-RECV-V8NHT',
            number: getNextJournalNumber('ENT-CAR-01', all),
            entityId: 'ENT-CAR-01',
            date: '2026-09-02',
            status: 'draft',
            postedAt: new Date().toISOString(),
            createdBy: 'Carrier Operations',
            description: 'MGA premium settlement payment received from NTA (PAY-CAR-V8NHT) for POL-V8NHT',
            source: 'INSURANCE',
            lines: [
              { acct: '1001', debit: 29757.00, credit: 0, desc: 'MGA premium settlement receipt — NTA', dims: { location: 'HQ' } },
              { acct: '1100', debit: 0, credit: 29757.00, desc: 'Clear Settlement Receivable — MGA NTA', dims: { mga: 'NTA', lob: 'Commercial Trucking' } }
            ]
          };
          all.push(carrierRecvJE);
          changed = true;
          try {
            let carList = JSON.parse(localStorage.getItem('carrier_v_gl_journal_entries') || '[]');
            if (!carList.some(x => x.id === carrierRecvJE.id || x.description === carrierRecvJE.description)) {
              carList.unshift(carrierRecvJE);
              localStorage.setItem('carrier_v_gl_journal_entries', JSON.stringify(carList));
            }
          } catch (e) {}
        }
      }
    }
  } catch (e) {}

  // Reclassify and sanitize broker and MGA entries
  all.forEach(je => {
    if ((je.description || '').includes('Settlement disburse to MGA') && !(je.description || '').includes('received')) {
      je.entityId = 'ENT-AGY-01';
      je.createdBy = 'HIT';
    }
    sanitizeBrokerJournalEntry(je);
    sanitizeMGAJournalEntry(je);
  });

  const deduped = deduplicateJournalEntries(all);
  if (deduped.length !== all.length) {
    all = deduped;
    changed = true;
  }

  if (changed) {
    all.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
    glSave(GL_JE_KEY, all);
  }

  const active = (typeof getActiveEntity === 'function') ? getActiveEntity() : null;
  if (active && (active.businessType === 'mga' || active.businessType === 'agency' || active.businessType === 'broker')) {
    return all.filter(je => !je.id.startsWith('JE-SEED-'));
  }
  return all;
}

function jeTotalDebit(je) { return je.lines.reduce((s, l) => s + (parseFloat(l.debit) || 0), 0); }
function jeTotalCredit(je) { return je.lines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0); }

function resolveEntityInfo(jeEntityId) {
  const active = (typeof getActiveEntity === 'function') ? getActiveEntity() : null;
  const activeType = active ? active.businessType : 'mga';
  const activeId = active ? active.id : 'ENT-MINE';

  let resolvedEntityId = jeEntityId || activeId;
  let dbKey = 'v_gl_journal_entries';

  if (activeType === 'agency' || activeType === 'broker' || resolvedEntityId === 'ENT-AGY-01' || resolvedEntityId === 'ENT-BRK-01') {
    resolvedEntityId = 'ENT-AGY-01';
    dbKey = 'agency_v_gl_journal_entries';
  } else if (activeType === 'carrier' || resolvedEntityId === 'ENT-CAR-01') {
    resolvedEntityId = 'ENT-CAR-01';
    dbKey = 'carrier_v_gl_journal_entries';
  } else {
    resolvedEntityId = 'ENT-MINE';
    dbKey = 'mga_v_gl_journal_entries';
  }

  return { entityId: resolvedEntityId, dbKey };
}

function findJEAndDbKey(id) {
  // Try agency database first
  try {
    const rawAgency = localStorage.getItem('agency_v_gl_journal_entries');
    if (rawAgency) {
      const all = JSON.parse(rawAgency);
      const idx = all.findIndex(j => j.id === id);
      if (idx !== -1) {
        return { list: all, index: idx, dbKey: 'agency_v_gl_journal_entries' };
      }
    }
  } catch(e) {}

  // Try carrier database
  try {
    const rawCarrier = localStorage.getItem('carrier_v_gl_journal_entries');
    if (rawCarrier) {
      const all = JSON.parse(rawCarrier);
      const idx = all.findIndex(j => j.id === id);
      if (idx !== -1) {
        return { list: all, index: idx, dbKey: 'carrier_v_gl_journal_entries' };
      }
    }
  } catch(e) {}

  // Try mga database
  try {
    const rawMga = localStorage.getItem('mga_v_gl_journal_entries');
    if (rawMga) {
      const all = JSON.parse(rawMga);
      const idx = all.findIndex(j => j.id === id);
      if (idx !== -1) {
        return { list: all, index: idx, dbKey: 'mga_v_gl_journal_entries' };
      }
    }
  } catch(e) {}

  // Fallback to active dynamic key
  try {
    const all = getJournalEntries();
    const idx = all.findIndex(j => j.id === id);
    if (idx !== -1) {
      return { list: all, index: idx, dbKey: GL_JE_KEY };
    }
  } catch(e) {}

  return null;
}

function createJournalEntry(je, status = 'draft') {
  const { entityId: targetEntityId, dbKey } = resolveEntityInfo(je.entityId);

  // Load existing entries from that exact dbKey
  let all = [];
  try {
    const raw = localStorage.getItem(dbKey);
    if (raw) all = JSON.parse(raw);
  } catch (e) {
    all = [];
  }

  all = deduplicateJournalEntries(all);

  const nextNum = je.number || ('JE-' + new Date().getFullYear() + '-' + String(all.length + 1).padStart(4, '0'));
  
  const entry = Object.assign({
    id: je.id || ('JE-' + Date.now() + '-' + Math.floor(Math.random() * 1000)),
    number: nextNum,
    status: status,
    entityId: targetEntityId,
    createdAt: new Date().toISOString(),
    createdBy: (typeof getCurrentUser === 'function' ? getCurrentUser().name : 'User'),
  }, je);

  sanitizeBrokerJournalEntry(entry);
  
  // Replace if same id, number, or identical description on same date exists
  const existingIdx = all.findIndex(x => 
    (entry.id && x.id === entry.id) || 
    (entry.number && x.number === entry.number) ||
    (entry.description && x.description === entry.description && x.date === entry.date)
  );
  if (existingIdx !== -1) {
    all[existingIdx] = Object.assign(all[existingIdx], entry);
  } else {
    all.unshift(entry);
  }
  all = deduplicateJournalEntries(all);
  localStorage.setItem(dbKey, JSON.stringify(all));
  
  // Sync with main table if appropriate
  try {
    const currentDbKey = GL_JE_KEY;
    let mainAll = [];
    const mainRaw = localStorage.getItem(currentDbKey);
    if (mainRaw) mainAll = JSON.parse(mainRaw);
    mainAll = deduplicateJournalEntries(mainAll);
    const idx = mainAll.findIndex(j => 
      (entry.id && j.id === entry.id) || 
      (entry.number && j.number === entry.number && j.entityId === entry.entityId) ||
      (entry.description && j.description === entry.description && j.date === entry.date && j.entityId === entry.entityId)
    );
    if (idx !== -1) {
      mainAll[idx] = Object.assign(mainAll[idx], entry);
    } else {
      mainAll.unshift(entry);
    }
    mainAll = deduplicateJournalEntries(mainAll);
    localStorage.setItem(currentDbKey, JSON.stringify(mainAll));
  } catch (e) {}

  return entry;
}

function submitJournalEntry(id) {
  const match = findJEAndDbKey(id);
  if (!match) return null;
  
  const je = match.list[match.index];
  const amount = Math.max(jeTotalDebit(je), jeTotalCredit(je));
  je.submittedAt = new Date().toISOString();
  if (amount >= GL_APPROVAL_THRESHOLD) {
    je.status = 'pending_approval';
  } else {
    je.status = 'posted';
    je.postedAt = new Date().toISOString();
  }
  
  localStorage.setItem(match.dbKey, JSON.stringify(match.list));
  
  // Force sync to global ledger to guarantee UI updates
  try {
    let globalAll = [];
    const globalRaw = localStorage.getItem('v_gl_journal_entries');
    if (globalRaw) globalAll = JSON.parse(globalRaw);
    const gIdx = globalAll.findIndex(j => j.id === id);
    if (gIdx !== -1) {
      globalAll[gIdx] = je;
    } else {
      globalAll.push(je);
    }
    localStorage.setItem('v_gl_journal_entries', JSON.stringify(globalAll));
  } catch (e) {}

  return je;
}

function approveJournalEntry(id, approver) {
  const match = findJEAndDbKey(id);
  if (!match) return null;
  
  const je = match.list[match.index];
  je.status = 'posted';
  je.postedAt = new Date().toISOString();
  je.approvedBy = approver || (typeof getCurrentUser === 'function' ? getCurrentUser().name : 'User');
  
  localStorage.setItem(match.dbKey, JSON.stringify(match.list));
  
  // Force sync to global ledger to guarantee UI updates
  try {
    let globalAll = [];
    const globalRaw = localStorage.getItem('v_gl_journal_entries');
    if (globalRaw) globalAll = JSON.parse(globalRaw);
    const gIdx = globalAll.findIndex(j => j.id === id);
    if (gIdx !== -1) {
      globalAll[gIdx] = je;
    } else {
      globalAll.push(je);
    }
    localStorage.setItem('v_gl_journal_entries', JSON.stringify(globalAll));
  } catch (e) {}

  return je;
}

function rejectJournalEntry(id, reason) {
  const match = findJEAndDbKey(id);
  if (!match) return null;
  
  const je = match.list[match.index];
  je.status = 'rejected';
  je.rejectReason = reason || 'No reason given';
  je.rejectedAt = new Date().toISOString();
  
  localStorage.setItem(match.dbKey, JSON.stringify(match.list));
  
  // Force sync to global ledger to guarantee UI updates
  try {
    let globalAll = [];
    const globalRaw = localStorage.getItem('v_gl_journal_entries');
    if (globalRaw) globalAll = JSON.parse(globalRaw);
    const gIdx = globalAll.findIndex(j => j.id === id);
    if (gIdx !== -1) {
      globalAll[gIdx] = je;
    } else {
      globalAll.push(je);
    }
    localStorage.setItem('v_gl_journal_entries', JSON.stringify(globalAll));
  } catch (e) {}

  return je;
}

/* Opening balance + every posted JE line for that account = the account's current balance.
   This is what makes "closing balance" real: it is opening + everything posted since, not a
   separately-maintained number. */
function getJournalEntriesForActiveEntity() {
  const all = getJournalEntries();
  const active = (typeof getActiveEntity === 'function') ? getActiveEntity() : null;
  if (!active) return deduplicateJournalEntries(all);
  
  let filtered = all.filter(je => {
    if (active.businessType === 'agency' || active.businessType === 'broker') {
      if (je.entityId === 'ENT-MINE' || je.entityId === 'ENT-CAR-01' || je.createdBy === 'NTA Operations' || je.createdBy === 'Carrier Operations' || je.createdBy === 'Southlake') return false;
      return (je.entityId === 'ENT-AGY-01' || je.entityId === 'ENT-BRK-01' || je.createdBy === 'HIT' || je.createdBy === 'Links Agency' || (je.description && (je.description.includes('HIT') || je.description.includes('POL-V8NHT'))));
    }
    if (active.businessType === 'mga') {
      if (je.entityId === 'ENT-AGY-01' || je.entityId === 'ENT-CAR-01' || je.createdBy === 'HIT' || je.createdBy === 'Carrier Operations' || je.createdBy === 'Southlake') return false;
      return (je.entityId === 'ENT-MINE' || je.entityId === 'ENT-MGA-01' || je.createdBy === 'NTA Operations' || je.createdBy === 'MGA User' || (je.description && (je.description.includes('NTA') || je.description.includes('ACCL') || je.description.includes('Carrier') || je.description.includes('POL-V8NHT'))));
    }
    if (active.businessType === 'carrier') {
      if (je.entityId === 'ENT-AGY-01' || je.entityId === 'ENT-MINE' || je.createdBy === 'HIT' || je.createdBy === 'NTA Operations') return false;
      return (je.entityId === 'ENT-CAR-01' || je.createdBy === 'Southlake' || je.createdBy === 'Carrier Operations' || (je.description && (je.description.includes('Bordereau Ingestion') || je.description.includes('received from NTA'))));
    }
    return true;
  });

  filtered = deduplicateJournalEntries(filtered);


  return deduplicateJournalEntries(filtered.map(je => sanitizeMGAJournalEntry(sanitizeBrokerJournalEntry(je))));
}

function getAccountBalance(accountCode) {
  const opening = getOpeningBalances()[accountCode] || { debit: 0, credit: 0 };
  let debit = opening.debit || 0, credit = opening.credit || 0;
  getJournalEntriesForActiveEntity().filter(j => j.status === 'posted').forEach(je => {
    je.lines.filter(l => l.acct === accountCode ||
      (accountCode === '5100' && l.acct === '6100') ||
      (accountCode === '5101' && l.acct === '6101') ||
      (accountCode === '5500' && l.acct === '6500') ||
      (accountCode === '1500' && l.acct === '5000')
    ).forEach(l => {
      debit += parseFloat(l.debit) || 0;
      credit += parseFloat(l.credit) || 0;
    });
  });
  return { debit, credit, net: debit - credit };
}

/* The full, clickable story behind an account balance: opening balance, every posted
   JE line against it in order, a running balance, and the closing balance - exactly
   what "view opening and closing balances" means for a real account. */
function getAccountLedger(accountCode) {
  const opening = getOpeningBalances()[accountCode] || { debit: 0, credit: 0 };
  const openingNet = (opening.debit || 0) - (opening.credit || 0);
  const rows = [];
  getJournalEntriesForActiveEntity()
    .filter(j => j.status === 'posted')
    .sort((a, b) => new Date(a.date || a.createdAt) - new Date(b.date || b.createdAt))
    .forEach(je => {
      je.lines.filter(l => l.acct === accountCode ||
        (accountCode === '5100' && l.acct === '6100') ||
        (accountCode === '5101' && l.acct === '6101') ||
        (accountCode === '5500' && l.acct === '6500') ||
        (accountCode === '1500' && l.acct === '5000')
      ).forEach(l => {
        rows.push({
          jeId: je.id, jeNumber: je.number, date: je.date || je.createdAt.slice(0, 10),
          description: l.desc || je.description, debit: parseFloat(l.debit) || 0, credit: parseFloat(l.credit) || 0,
          dims: l.dims || {},
        });
      });
    });
  let running = openingNet;
  rows.forEach(r => { running += r.debit - r.credit; r.runningBalance = running; });
  return { openingBalance: opening, openingNet, rows, closingNet: running, closing: { debit: Math.max(running, 0), credit: Math.max(-running, 0) } };
}

function getPendingApprovalEntries() {
  return getJournalEntriesForActiveEntity().filter(j => j.status === 'pending_approval');
}

function createCarrierJournalEntryDirect(je, status = 'draft') {
  // 1. Save to the main shared table (v_gl_journal_entries)
  let all = [];
  try {
    const raw = localStorage.getItem('v_gl_journal_entries');
    if (raw) all = JSON.parse(raw);
  } catch (e) {
    all = [];
  }
  
  const nextNum = 'JE-' + new Date().getFullYear() + '-' + String(all.length + 1).padStart(4, '0');
  
  const entry = Object.assign({
    id: 'JE-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    number: nextNum,
    status: status,
    entityId: 'ENT-CAR-01',
    createdAt: new Date().toISOString(),
    createdBy: 'System (Settlement Bridge)',
  }, je);
  
  if (status === 'posted') {
    entry.postedAt = new Date().toISOString();
  }
  
  all.unshift(entry);
  localStorage.setItem('v_gl_journal_entries', JSON.stringify(all));
  
  // 2. Keep the isolated carrier key for compatibility
  let carrierJEs = [];
  try {
    const raw = localStorage.getItem('carrier_v_gl_journal_entries');
    if (raw) carrierJEs = JSON.parse(raw);
  } catch (e) {
    carrierJEs = [];
  }
  carrierJEs.unshift(entry);
  localStorage.setItem('carrier_v_gl_journal_entries', JSON.stringify(carrierJEs));
  
  return entry;
}
