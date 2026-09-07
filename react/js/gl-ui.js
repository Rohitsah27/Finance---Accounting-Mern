/* ============================================================
   VERIDEX FINANCE SYSTEM - Shared GL detail modals
   Two reusable, self-injecting modals: an account's full ledger
   (opening balance -> every posted JE line -> closing balance),
   and a single journal entry's full detail (lines, dimensions,
   status). Include this script on any page that wants a real
   "click a balance / click a JE and see the story" drill-through
   instead of a static number. Requires js/gl-engine.js and
   js/app.js (showToast) already loaded.
   ============================================================ */

function ensureGlUiModals() {
  if (document.getElementById('gl-ledger-modal')) return;
  const div = document.createElement('div');
  div.innerHTML = `
    <div class="sl-modal-overlay" id="gl-ledger-modal" onclick="if(event.target===this) closeAccountLedgerModal()">
      <div class="sl-modal" style="max-width:820px;width:92vw;">
        <div class="sl-modal-header">
          <h3 class="sl-modal-title" id="gl-ledger-modal-title">Account Ledger</h3>
          <button type="button" class="btn btn-ghost btn-sm" onclick="closeAccountLedgerModal()" aria-label="Close">&#10005;</button>
        </div>
        <div class="sl-modal-body" id="gl-ledger-modal-body"></div>
        <div class="sl-modal-footer">
          <button type="button" class="btn btn-outline" onclick="closeAccountLedgerModal()">Close</button>
        </div>
      </div>
    </div>
    <div class="sl-modal-overlay" id="gl-je-modal" onclick="if(event.target===this) closeJournalEntryModal()">
      <div class="sl-modal" style="max-width:760px;width:92vw;">
        <div class="sl-modal-header">
          <h3 class="sl-modal-title" id="gl-je-modal-title">Journal Entry</h3>
          <button type="button" class="btn btn-ghost btn-sm" onclick="closeJournalEntryModal()" aria-label="Close">&#10005;</button>
        </div>
        <div class="sl-modal-body" id="gl-je-modal-body"></div>
        <div class="sl-modal-footer" id="gl-je-modal-footer"></div>
      </div>
    </div>`;
  document.body.appendChild(div);
}

/* ---------- Account Ledger modal: opening balance -> every posted line -> closing ---------- */
function openAccountLedgerModal(accountCode) {
  ensureGlUiModals();
  const acct = findGLAccountByCode(accountCode);
  const ledger = getAccountLedger(accountCode);
  document.getElementById('gl-ledger-modal-title').textContent = accountCode + ' - ' + (acct ? acct.name : 'Account Ledger');
  const rowsHtml = ledger.rows.map(r => `
    <tr>
      <td class="cell-link" style="cursor:pointer;" onclick="openJournalEntryModal('${r.jeId}')">${r.jeNumber}</td>
      <td>${r.date}</td>
      <td>${r.description}</td>
      <td class="r">${r.debit ? fmtCurrency(r.debit) : ' - '}</td>
      <td class="r">${r.credit ? fmtCurrency(r.credit) : ' - '}</td>
      <td class="r">${fmtCurrency(r.runningBalance)}</td>
    </tr>`).join('');
  document.getElementById('gl-ledger-modal-body').innerHTML = `
    <div class="v-lock-note" style="margin-bottom:12px;">
      <strong>Opening balance:</strong> Dr ${fmtCurrency(ledger.openingBalance.debit || 0)} / Cr ${fmtCurrency(ledger.openingBalance.credit || 0)}
      (net ${fmtCurrency(ledger.openingNet)}), set on Chart of Accounts.
    </div>
    <div style="overflow-x:auto;">
    <table class="data-table">
      <thead><tr><th>JE #</th><th>Date</th><th>Description</th><th class="r">Debit</th><th class="r">Credit</th><th class="r">Running Balance</th></tr></thead>
      <tbody>${rowsHtml || '<tr><td colspan="6" style="text-align:center;color:var(--gray-400);padding:16px;">No posted activity yet, this account is still at its opening balance.</td></tr>'}</tbody>
      <tfoot><tr class="total-row" style="font-weight:700;"><td colspan="5" style="text-align:right;">Closing balance</td><td class="r">${fmtCurrency(ledger.closingNet)}</td></tr></tfoot>
    </table>
    </div>
    <div style="font-size:11px;color:var(--gray-400);margin-top:10px;">Click any JE number to see its full detail. This is the same math used everywhere else this account's balance shows up (Chart of Accounts, Trial Balance, Balance Sheet).</div>`;
  document.getElementById('gl-ledger-modal').classList.add('open');
}
function closeAccountLedgerModal() {
  const m = document.getElementById('gl-ledger-modal');
  if (m) m.classList.remove('open');
}

/* ---------- Journal Entry detail modal ---------- */
const GL_JE_STATUS_BADGE = { posted: 'badge-green', pending_approval: 'badge-orange', rejected: 'badge-red', draft: 'badge-gray' };
const GL_JE_STATUS_LABEL = { posted: 'Posted', pending_approval: 'Pending Approval', rejected: 'Rejected', draft: 'Draft' };

function formatCleanJeDescription(desc) {
  if (!desc) return 'Standard Journal Entry';
  let s = desc;
  if (s.includes('POLICY_BINDING_INVOICED')) {
    s = s.replace(/POLICY_BINDING_INVOICED\s*[-–:]*\s*/gi, 'Policy binding & premium invoice issued for ');
  } else if (s.includes('PREMIUM_ADJUSTED')) {
    s = s.replace(/PREMIUM_ADJUSTED\s*[-–:]*\s*/gi, 'Policy endorsement & premium adjustment for ');
  } else if (s.includes('PAYMENT_RECEIVED')) {
    s = s.replace(/PAYMENT_RECEIVED\s*[-–:]*\s*/gi, 'Premium collection receipt for ');
  } else if (s.includes('COMMISSION_CALCULATED')) {
    s = s.replace(/COMMISSION_CALCULATED\s*[-–:]*\s*/gi, 'Producer commission accrual & allocation for ');
  } else if (s.includes('CARRIER_PAYMENT_COMPLETED')) {
    s = s.replace(/CARRIER_PAYMENT_COMPLETED\s*[-–:]*\s*/gi, 'Net premium settlement remittance to carrier for ');
  } else if (s.includes('POLICY_CANCELLED')) {
    s = s.replace(/POLICY_CANCELLED\s*[-–:]*\s*/gi, 'Policy cancellation & unearned premium reversal for ');
  }
  return s;
}

function formatCleanLineDesc(desc) {
  if (!desc) return '';
  const map = {
    'Premium AR': 'Premium Receivable',
    'Net Carrier Payable': 'Net Carrier Settlement Payable',
    'Net MGA Payable': 'Net Premium Payable — MGA',
    'Net Premium Payable — NTA': 'Net Premium Payable — NTA',
    'Net Premium Payable — MGA': 'Net Premium Payable — MGA',
    'Producer / Broker Commission Revenue': 'Producer / Broker Commission Revenue',
    'Broker Commission Revenue': 'Broker Commission Revenue',
    'Premium Taxes & Fees Payable (TX)': 'Surplus Lines Taxes & Regulatory Fees (TX)',
    'MGA Comm. & Producer Revenue': 'MGA Override & Producer Commission Revenue',
    'Broker/Producer Commission Expense': 'Producer Commission Expense',
    'Broker Commission Payable': 'Producer Commission Payable',
    'Clear premium AR': 'Clear Premium Receivable',
    'Partial clear premium AR': 'Partial Clear Premium Receivable',
    'Premium Receipt': 'Customer Premium Receipt',
    'Disburse Settle Payment to Carrier': 'Disburse Net Carrier Settlement',
    'Clear Carrier Payable': 'Clear Carrier Settlement Payable',
    'Unapplied Customer Credit': 'Unapplied Cash / Customer Credit',
    'MGA Commission Expense': 'MGA Commission Override Expense',
    'Gross Written Premium Revenue': 'Gross Written Premium Revenue',
    'Receivable from MGA': 'Direct Receivable from MGA',
    'Settlement cash received from MGA': 'Settlement Cash Received from MGA',
    'Clear MGA Receivable': 'Clear MGA Settlement Receivable'
  };

  let clean = desc;
  Object.keys(map).forEach(k => {
    if (clean.startsWith(k)) {
      clean = clean.replace(k, map[k]);
    }
  });
  return clean;
}

function formatDimLabel(k) {
  const map = {
    mga: 'MGA',
    lob: 'LOB',
    state: 'State',
    cost_center: 'Cost Center',
    location: 'Location',
    broker: 'Broker'
  };
  return map[k.toLowerCase()] || k.toUpperCase();
}

function openJournalEntryModal(jeId) {
  ensureGlUiModals();
  const je = getJournalEntries().find(j => j.id === jeId);
  if (!je) { showToast('Journal entry not found', 'error'); return; }
  document.getElementById('gl-je-modal-title').textContent = je.number;
  
  const dimBits = l => {
    const keys = Object.keys(l.dims || {}).filter(k => l.dims[k]);
    if (!keys.length) return '';
    return `<div style="display:flex; flex-wrap:wrap; gap:4px; margin-top:4px;">` +
      keys.map(k => `<span class="badge badge-gray" style="font-size:9.5px; padding:1px 6px; font-weight:600; text-transform:none; border-radius:3px;">${formatDimLabel(k)}: ${l.dims[k]}</span>`).join('') +
      `</div>`;
  };

  const getAccountDisplay = (acctCode, jeEntity) => {
    let code = acctCode;
    if (code === '6100') code = '5100';
    if (code === '6101') code = '5101';
    if (code === '6500') code = '5500';
    if (code === '5000') code = '1500';
    const a = (typeof findGLAccountByCode === 'function') ? findGLAccountByCode(code) : null;
    const isBroker = jeEntity === 'ENT-AGY-01' || jeEntity === 'ENT-BRK-01' || (typeof getActiveEntity === 'function' && getActiveEntity() && (getActiveEntity().businessType === 'agency' || getActiveEntity().businessType === 'broker'));
    if (!a) {
      if (code === '5100') return code + ' - ' + (isBroker ? 'Producer / Broker Commission Revenue' : 'Commission Expense / Revenue');
      return code;
    }
    if (code === '5100') {
      return code + ' - ' + (isBroker ? 'Producer / Broker Commission Revenue' : a.name);
    }
    return code + ' - ' + a.name;
  };

  const linesHtml = je.lines.map(l => `
    <tr>
      <td style="font-weight:600; color:var(--navy);">${getAccountDisplay(l.acct, je.entityId)}</td>
      <td>
        <div style="font-size:12.5px; color:var(--gray-800);">${formatCleanLineDesc(l.desc || '')}</div>
        ${dimBits(l)}
      </td>
      <td class="r" style="font-weight:600;">${l.debit ? fmtCurrency(l.debit) : ' - '}</td>
      <td class="r" style="font-weight:600;">${l.credit ? fmtCurrency(l.credit) : ' - '}</td>
    </tr>`).join('');

  document.getElementById('gl-je-modal-body').innerHTML = `
    <div class="v-config-row head" style="grid-template-columns:1fr 1fr 1fr; margin-bottom:8px;">
      <div>Date: <strong>${je.date || (je.createdAt || '').slice(0, 10)}</strong></div>
      <div>Status: <span class="badge ${GL_JE_STATUS_BADGE[je.status] || 'badge-gray'}">${GL_JE_STATUS_LABEL[je.status] || je.status}</span></div>
      <div>Created by: <strong>${je.createdBy || ' - '}</strong></div>
    </div>
    <div style="margin:10px 0 14px; font-size:12.5px; font-weight:600; color:var(--navy); background:var(--gray-50); padding:8px 12px; border-radius:6px; border-left:3px solid var(--brand);">
      ${formatCleanJeDescription(je.description)}
    </div>
    <div style="overflow-x:auto;">
    <table class="data-table">
      <thead><tr><th>Account</th><th>Description &amp; Dimensions</th><th class="r">Debit</th><th class="r">Credit</th></tr></thead>
      <tbody>${linesHtml}</tbody>
      <tfoot><tr class="total-row"><td colspan="2" style="text-align:right;font-weight:700;">Totals</td><td class="r"><strong>${fmtCurrency(jeTotalDebit(je))}</strong></td><td class="r"><strong>${fmtCurrency(jeTotalCredit(je))}</strong></td></tr></tfoot>
    </table>
    </div>
    ${je.rejectReason ? `<div class="v-lock-note" style="margin-top:10px;border-left:3px solid var(--red);">Rejected: ${je.rejectReason}</div>` : ''}`;

  const footer = document.getElementById('gl-je-modal-footer');
  if (je.status === 'pending_approval') {
    footer.innerHTML = `<button type="button" class="btn btn-primary" onclick="approveJournalEntry('${je.id}');closeJournalEntryModal();showToast('${je.number} approved and posted','success');if(typeof renderRecentJE==='function')renderRecentJE();if(typeof renderAll==='function')renderAll();">Approve &amp; Post</button>
      <button type="button" class="btn btn-outline" onclick="closeJournalEntryModal()">Close</button>`;
  } else if (je.status === 'draft') {
    footer.innerHTML = `<button type="button" class="btn btn-primary" onclick="approveJournalEntry('${je.id}');closeJournalEntryModal();showToast('${je.number} posted to ledger','success');if(typeof renderRecentJE==='function')renderRecentJE();if(typeof renderAll==='function')renderAll();">Post to Ledger</button>
      <button type="button" class="btn btn-outline" onclick="closeJournalEntryModal()">Close</button>`;
  } else {
    footer.innerHTML = `<button type="button" class="btn btn-outline" onclick="closeJournalEntryModal()">Close</button>`;
  }
  document.getElementById('gl-je-modal').classList.add('open');
}
function closeJournalEntryModal() {
  const m = document.getElementById('gl-je-modal');
  if (m) m.classList.remove('open');
}
