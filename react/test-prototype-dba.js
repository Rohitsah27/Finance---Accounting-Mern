/**
 * test-prototype-dba.js
 * Verification of the 5-Stage DBA (Agency Bill) lifecycle for POL-V8NHT ($39,260)
 * matching README.md Section 4.1 and Section 5.A, 5.B, 5.C down to the cent.
 */

const assert = require('assert');

class LedgerAccount {
  constructor(code, name) {
    this.code = code;
    this.name = name;
    this.debit = 0;
    this.credit = 0;
  }
  post(d, c) {
    this.debit += d;
    this.credit += c;
  }
  get netDebit() {
    return Math.round((this.debit - this.credit) * 100) / 100;
  }
  get netCredit() {
    return Math.round((this.credit - this.debit) * 100) / 100;
  }
}

class EntityLedger {
  constructor(name) {
    this.name = name;
    this.accounts = {};
  }
  getAccount(code, name = '') {
    if (!this.accounts[code]) {
      this.accounts[code] = new LedgerAccount(code, name);
    }
    return this.accounts[code];
  }
  postJE(lines) {
    let totalD = 0;
    let totalC = 0;
    lines.forEach(l => {
      totalD += l.debit;
      totalC += l.credit;
      this.getAccount(l.acct, l.name).post(l.debit, l.credit);
    });
    assert.strictEqual(Math.round(totalD * 100) / 100, Math.round(totalC * 100) / 100, `JE unbalanced in ${this.name}`);
  }
}

console.log('----------------------------------------------------------------');
console.log(' PROTOTYPE DBA VERIFICATION: POL-V8NHT ($39,260 TOTAL BILLED)  ');
console.log('----------------------------------------------------------------');

const broker = new EntityLedger('Broker HIT (ENT-AGY-01)');
const mga = new EntityLedger('MGA NTA (ENT-MINE)');
const carrier = new EntityLedger('Carrier SOUTHLAKE (ENT-CAR-01)');

// -------------------------------------------------------------
// STAGE 1: Policy Binding & Invoicing
// -------------------------------------------------------------
// Broker: JE-2026-0001
broker.postJE([
  { acct: '1100', name: 'Premium Receivable — Ayushi', debit: 39260.00, credit: 0 },
  { acct: '2200', name: 'Net Premium Payable — NTA', debit: 0, credit: 36760.00 },
  { acct: '6100', name: 'Producer / Broker Commission Revenue', debit: 0, credit: 2500.00 }
]);

// MGA: JE-2026-0001
mga.postJE([
  { acct: '1100', name: 'Premium Receivable — HIT (Broker Net Remittance)', debit: 36760.00, credit: 0 },
  { acct: '2200', name: 'Net Premium Payable — Southlake Insurance Co.', debit: 0, credit: 29757.00 },
  { acct: '2300', name: 'Surplus Lines Taxes & Regulatory Fees (TX)', debit: 0, credit: 3503.00 },
  { acct: '4100', name: 'MGA Program Override & Policy Fee Revenue', debit: 0, credit: 3500.00 }
]);

// Carrier: OFF-LEDGER pending monthly Bordereau submission
assert.strictEqual(Object.keys(carrier.accounts).length, 0, 'Stage 1: Carrier remains off-ledger at binding');

assert.strictEqual(broker.getAccount('1100').netDebit, 39260.00, 'Stage 1: Broker AR recognized ($39,260.00)');
assert.strictEqual(broker.getAccount('2200').netCredit, 36760.00, 'Stage 1: Broker AP to MGA recognized ($36,760.00)');
assert.strictEqual(broker.getAccount('6100').netCredit, 2500.00, 'Stage 1: Broker Commission Revenue ($2,500.00)');

assert.strictEqual(mga.getAccount('1100').netDebit, 36760.00, 'Stage 1: MGA AR from Broker recognized ($36,760.00)');
assert.strictEqual(mga.getAccount('2200').netCredit, 29757.00, 'Stage 1: MGA AP to Carrier recognized ($29,757.00)');
assert.strictEqual(mga.getAccount('2300').netCredit, 3503.00, 'Stage 1: MGA Tax Liability recognized ($3,503.00)');
assert.strictEqual(mga.getAccount('4100').netCredit, 3500.00, 'Stage 1: MGA Program Override Revenue ($3,500.00)');
console.log('✅ Stage 1 passed: Broker & MGA booked, Carrier off-ledger.');

// -------------------------------------------------------------
// STAGE 2: Customer Premium Collection
// -------------------------------------------------------------
// Ayushi pays Broker $39,260.00
broker.postJE([
  { acct: '1001', name: 'Cash / Bank (Premium Trust)', debit: 39260.00, credit: 0 },
  { acct: '1100', name: 'Clear Premium Receivable — Ayushi', debit: 0, credit: 39260.00 }
]);

assert.strictEqual(broker.getAccount('1100').netDebit, 0, 'Stage 2: Broker AR cleared to $0');
assert.strictEqual(broker.getAccount('1001').netDebit, 39260.00, 'Stage 2: Broker received $39,260.00 cash');
console.log('✅ Stage 2 passed: Customer collection posted by Broker, zero entries on MGA & Carrier.');

// -------------------------------------------------------------
// STAGE 3: Broker Settlement to MGA
// -------------------------------------------------------------
// Broker disburses $36,760.00 to MGA
broker.postJE([
  { acct: '2200', name: 'Clear Net Premium Payable to NTA', debit: 36760.00, credit: 0 },
  { acct: '1001', name: 'Disburse Net Premium to NTA', debit: 0, credit: 36760.00 }
]);

// MGA receives $36,760.00 from Broker
mga.postJE([
  { acct: '1001', name: 'Broker Premium Settlement Receipt — HIT', debit: 36760.00, credit: 0 },
  { acct: '1100', name: 'Clear Broker Premium Receivable — HIT', debit: 0, credit: 36760.00 }
]);

assert.strictEqual(broker.getAccount('2200').netCredit, 0, 'Stage 3: Broker AP to MGA cleared to $0');
assert.strictEqual(broker.getAccount('1001').netDebit, 2500.00, 'Stage 3: Broker Ending Cash equals retained commission ($2,500.00)');
assert.strictEqual(mga.getAccount('1100').netDebit, 0, 'Stage 3: MGA AR from Broker cleared to $0');
assert.strictEqual(mga.getAccount('1001').netDebit, 36760.00, 'Stage 3: MGA received $36,760.00 cash from Broker');
console.log('✅ Stage 3 passed: Broker settled to MGA, Broker cash = $2,500 retained commission.');

// -------------------------------------------------------------
// STAGE 4: MGA Submits Monthly Bordereau (BX)
// -------------------------------------------------------------
// Carrier ingests monthly Bordereau report
carrier.postJE([
  { acct: '1100', name: 'Settlement Receivable — MGA NTA', debit: 29757.00, credit: 0 },
  { acct: '6101', name: 'Commission Expense — MGA Override', debit: 3500.00, credit: 0 },
  { acct: '4100', name: 'Gross Written Premium Revenue', debit: 0, credit: 33257.00 }
]);

assert.strictEqual(carrier.getAccount('1100').netDebit, 29757.00, 'Stage 4: Carrier AR from MGA recognized ($29,757.00)');
assert.strictEqual(carrier.getAccount('6101').netDebit, 3500.00, 'Stage 4: Carrier MGA Commission Expense ($3,500.00)');
assert.strictEqual(carrier.getAccount('4100').netCredit, 33257.00, 'Stage 4: Carrier Gross Written Premium Revenue ($33,257.00)');
console.log('✅ Stage 4 passed: Carrier ingests Bordereau, recognizes GWP $33,257 & AR $29,757.');

// -------------------------------------------------------------
// STAGE 5: MGA Net Settlement to Carrier
// -------------------------------------------------------------
// MGA disburses $29,757.00 net wire to Carrier
mga.postJE([
  { acct: '2200', name: 'Clear Net Premium Payable to Southlake', debit: 29757.00, credit: 0 },
  { acct: '1001', name: 'Disburse Net Carrier Settlement (ACH)', debit: 0, credit: 29757.00 }
]);

// Carrier matches wire against open Bordereau AR
carrier.postJE([
  { acct: '1001', name: 'MGA Premium Settlement Receipt — NTA', debit: 29757.00, credit: 0 },
  { acct: '1100', name: 'Clear Settlement Receivable — MGA NTA', debit: 0, credit: 29757.00 }
]);

assert.strictEqual(mga.getAccount('2200').netCredit, 0, 'Stage 5: MGA AP to Carrier cleared to $0');
assert.strictEqual(mga.getAccount('1001').netDebit, 7003.00, 'Stage 5: MGA Ending Cash ($7,003.00 = $3,500 Override + $3,503 Tax Liability)');
assert.strictEqual(carrier.getAccount('1100').netDebit, 0, 'Stage 5: Carrier AR from MGA cleared to $0');
assert.strictEqual(carrier.getAccount('1001').netDebit, 29757.00, 'Stage 5: Carrier Cash settled ($29,757.00)');
console.log('✅ Stage 5 passed: MGA paid Carrier, Carrier matched wire, entire chain reconciled!');

console.log('----------------------------------------------------------------');
console.log(' ALL 5 STAGES OF DBA FLOW RECONCILED WITH 100% ACCURACY!       ');
console.log('----------------------------------------------------------------');
