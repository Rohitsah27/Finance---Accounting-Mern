/* ============================================================
   DBA (Direct Bill to Agency) Lifecycle Test
   ============================================================
   Drives the live Express API through the 5-stage DBA event
   sequence documented in:
     finance-and-accounting-main/README.md
     Section 4.1 "Complete Cross-Entity Lifecycle Matrix: DBA"

   It posts the same journal-entry lines the PAS Event Data
   Injector ("Quick Simulate End-to-End") generates for
   POL-V8NHT (see react/src/pages/insurance/PasPolicyPage.jsx,
   generateRulesEngineLines()), then asserts:
     1. Every JE is double-entry balanced (debits === credits).
     2. Every JE matches the account codes / amounts documented
        for that stage in the README table.
     3. The resulting Chart of Accounts *movement* (balance after
        minus balance before this test's postings — the seeded
        demo accounts don't start at $0.00, so absolute balances
        aren't meaningful) matches the README's "Closed Financial
        Position" deltas: 1100 and 2200 net to $0.00 (fully clear),
        4001 moves by +$33,257.00 (GWP), 5100 moves by +$3,500.00
        (acquisition cost), 1001 nets the combined cash movement
        across all 5 stages ($39,260 - $36,760 + $29,757 = $32,257),
        since this app books one shared GL rather than three
        separate per-entity databases the way the legacy static
        prototype simulated.

   Account codes used here match the LIVE seeded Chart of Accounts
   (server/data/seedData.js SEED_ACCOUNTS) — not the legacy
   prototype's or the frontend's local-mock numbering, which use
   different codes for these same concepts (see the comment above
   generateRulesEngineLines() in PasPolicyPage.jsx for the mapping).

   Usage:
     node test-dba-flow.js               (against http://localhost:5000)
     API_BASE=http://host:port node test-dba-flow.js
   ============================================================ */

const API_BASE = process.env.API_BASE || 'http://localhost:5000/api';

let pass = 0;
let fail = 0;
const failures = [];

function assertEqual(actual, expected, label) {
  const ok = Math.abs((Number(actual) || 0) - (Number(expected) || 0)) < 0.01;
  if (ok) {
    pass++;
    console.log(`  ✓ ${label}`);
  } else {
    fail++;
    failures.push(`${label} — expected ${expected}, got ${actual}`);
    console.log(`  ✗ ${label} — expected ${expected}, got ${actual}`);
  }
}

async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(`${options.method || 'GET'} ${path} -> ${res.status}: ${data?.error || res.statusText}`);
  }
  return data;
}

// The exact 5-stage DBA event sequence and journal-entry lines documented in
// README.md Section 4.1, reproducing what generateRulesEngineLines() in
// PasPolicyPage.jsx computes for the live reference policy POL-V8NHT.
const DBA_STAGES = [
  {
    stage: 'Stage 1: Policy Binding & Invoicing (JE-2026-0001 equivalent)',
    description: 'POLICY BINDING INVOICED — POL-V8NHT (DBA test)',
    lines: [
      { accountCode: '1100', accountName: 'Premium Receivable', debit: 39260.00, credit: 0 },
      { accountCode: '2200', accountName: 'Net Premium Payable to Carrier', debit: 0, credit: 36760.00 },
      { accountCode: '4100', accountName: 'MGA Program Override & Policy Fee Revenue', debit: 0, credit: 2500.00 }
    ]
  },
  {
    stage: 'Stage 2: Customer Premium Collection',
    description: 'PAYMENT RECEIVED — POL-V8NHT (DBA test)',
    lines: [
      { accountCode: '1001', accountName: 'Cash / Bank (Operating Account)', debit: 39260.00, credit: 0 },
      { accountCode: '1100', accountName: 'Premium Receivable', debit: 0, credit: 39260.00 }
    ]
  },
  {
    stage: 'Stage 3: Broker Settlement to MGA',
    description: 'BROKER SETTLEMENT COMPLETED — POL-V8NHT (DBA test)',
    lines: [
      { accountCode: '2200', accountName: 'Net Premium Payable to Carrier', debit: 36760.00, credit: 0 },
      { accountCode: '1001', accountName: 'Cash / Bank (Operating Account)', debit: 0, credit: 36760.00 }
    ]
  },
  {
    stage: 'Stage 4: Carrier Bordereau Ingestion',
    description: 'BORDEREAU INGESTED — POL-V8NHT (DBA test)',
    lines: [
      { accountCode: '1100', accountName: 'Premium Receivable', debit: 29757.00, credit: 0 },
      { accountCode: '5100', accountName: 'Acquisition Costs & Broker Commissions', debit: 3500.00, credit: 0 },
      { accountCode: '4001', accountName: 'Gross Written Premium (GWP)', debit: 0, credit: 33257.00 }
    ]
  },
  {
    stage: 'Stage 5: MGA Net Settlement / Carrier Matches Inbound Wire',
    description: 'CARRIER PAYMENT COMPLETED — POL-V8NHT (DBA test)',
    lines: [
      { accountCode: '1001', accountName: 'Cash / Bank (Operating Account)', debit: 29757.00, credit: 0 },
      { accountCode: '1100', accountName: 'Premium Receivable', debit: 0, credit: 29757.00 }
    ]
  }
];

async function run() {
  console.log('============================================================');
  console.log(' DBA Lifecycle Test — POL-V8NHT (README Section 4.1)');
  console.log('============================================================\n');

  console.log('[Setup] Resetting to a clean seeded baseline...');
  await api('/seed?clean=true', { method: 'POST' });
  console.log('[Setup] Done.\n');

  const accountsBefore = await api('/accounts');
  const balanceBefore = Object.fromEntries(accountsBefore.map(a => [a.code, a.balance]));

  const postedEntries = [];

  for (const stageDef of DBA_STAGES) {
    console.log(`${stageDef.stage}`);
    const totalDebit = stageDef.lines.reduce((s, l) => s + l.debit, 0);
    const totalCredit = stageDef.lines.reduce((s, l) => s + l.credit, 0);
    assertEqual(totalDebit, totalCredit, `${stageDef.stage}: double-entry balanced (Dr ${totalDebit.toFixed(2)} = Cr ${totalCredit.toFixed(2)})`);

    const entry = await api('/journal-entries', {
      method: 'POST',
      body: JSON.stringify({
        date: '2026-08-20',
        entity: 'ENT-MGA-01',
        entityName: 'NTA Program Administrators',
        reference: `DBA-TEST-${stageDef.lines[0].accountCode}`,
        description: stageDef.description,
        status: 'posted',
        lines: stageDef.lines
      })
    });
    postedEntries.push({ stageDef, entry });
    console.log(`  -> Posted as ${entry.id}\n`);
  }

  console.log('------------------------------------------------------------');
  console.log(' Verifying posted lines match README-documented amounts');
  console.log('------------------------------------------------------------');
  for (const { stageDef, entry } of postedEntries) {
    stageDef.lines.forEach((expectedLine, i) => {
      const actualLine = entry.lines[i];
      assertEqual(actualLine.debit, expectedLine.debit, `${stageDef.stage} line ${i + 1} (${expectedLine.accountCode}) debit`);
      assertEqual(actualLine.credit, expectedLine.credit, `${stageDef.stage} line ${i + 1} (${expectedLine.accountCode}) credit`);
    });
  }

  console.log('\n------------------------------------------------------------');
  console.log(' Verifying Chart of Accounts movement (closed financial position)');
  console.log('------------------------------------------------------------');
  const accountsAfter = await api('/accounts');
  const byCode = Object.fromEntries(accountsAfter.map(a => [a.code, a]));
  const delta = (code) => (byCode[code]?.balance || 0) - (balanceBefore[code] || 0);

  // 1100 Premium Receivable: +39260 -39260 +29757 -29757 = 0 (README: "$0.00")
  assertEqual(delta('1100'), 0, 'Account 1100 (Premium Receivable) movement clears to $0.00');
  // 2200 Net Premium Payable to Carrier: +36760 -36760 = 0 (README: "$0.00")
  assertEqual(delta('2200'), 0, 'Account 2200 (Net Premium Payable) movement clears to $0.00');
  // 5100 Acquisition Costs & Broker Commissions: +3500 (README: MGA Override Expense "$3,500.00")
  assertEqual(delta('5100'), 3500.00, 'Account 5100 (Acquisition Costs & Broker Commissions) movement = +$3,500.00');
  // 4001 Gross Written Premium: +33257 (README: "$33,257.00")
  assertEqual(delta('4001'), 33257.00, 'Account 4001 (Gross Written Premium) movement = +$33,257.00');
  // 4100 MGA Program Override & Policy Fee Revenue: +2500 (Stage 1 commission line)
  assertEqual(delta('4100'), 2500.00, 'Account 4100 (MGA Program Override & Policy Fee Revenue) movement = +$2,500.00');
  // 1001 Cash: combined single-ledger net of all 3 cash legs = 39260 - 36760 + 29757 = 32257
  // (this app books one shared GL, not three separate per-entity databases,
  // so this is the combined net cash movement across the whole DBA chain)
  assertEqual(delta('1001'), 32257.00, 'Account 1001 (Cash) combined net movement = +$32,257.00');

  console.log('\n============================================================');
  console.log(` RESULT: ${pass} passed, ${fail} failed`);
  console.log('============================================================');
  if (fail > 0) {
    console.log('\nFailures:');
    failures.forEach(f => console.log('  - ' + f));
    process.exit(1);
  }
  process.exit(0);
}

run().catch(err => {
  console.error('\n[FATAL]', err.message);
  process.exit(1);
});
