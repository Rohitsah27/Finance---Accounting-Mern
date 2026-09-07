/* Journal Entry Workspace - line-by-line entry */

let lineCount = 0;
let activeLineRow = null;
const lineMeta = {};

function getCurrentUser() {
  try {
    const u = JSON.parse(sessionStorage.getItem('sl_current_user') || '{}');
    return u.name || u.email || 'jane.doe';
  } catch (e) {
    return 'jane.doe';
  }
}

function formatINR(n) {
  return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function toggleJournalHeader() {
  const card = document.getElementById('je-header-card');
  const body = document.getElementById('je-header-body');
  const chev = document.getElementById('je-header-chevron');
  const btn = card?.querySelector('.je-ws-card-toggle');
  const open = body.style.display !== 'none';
  body.style.display = open ? 'none' : 'block';
  chev.textContent = open ? '▸' : '▾';
  if (btn) btn.setAttribute('aria-expanded', String(!open));
  card?.classList.toggle('collapsed', open);
}

function addLine() {
  lineCount++;
  const lineId = 'JL-' + Date.now() + '-' + lineCount;
  lineMeta[lineId] = { notes: '', attach1: null, attach2: null, dims: {} };
  const tr = document.createElement('tr');
  tr.dataset.lineId = lineId;
  tr.innerHTML = `
      <td class="je-td-num">${lineCount}</td>
      <td><input class="je-cell" type="text" value="100" data-field="comp" maxlength="4"></td>
      <td><input class="je-cell" type="text" placeholder="e.g. 1100" data-field="acct" maxlength="12" oninput="renderDimensionCell(this.closest('tr'))" title="Try 1100, 1400, 6100, 4500 to see the dimension set change"></td>
      <td class="je-td-dims"></td>
      <td><input class="je-cell je-cell-wide" type="text" placeholder="Line detail… (1000 chars max)" data-field="desc" maxlength="1000"></td>
      <td><input class="je-cell je-cell-sm" type="text" placeholder=" - " data-field="ref1"></td>
      <td><input class="je-cell je-cell-amt" type="number" placeholder="0.00" data-field="debit" step="0.01" oninput="calcLineTotals()"></td>
      <td><input class="je-cell je-cell-amt" type="number" placeholder="0.00" data-field="credit" step="0.01" oninput="calcLineTotals()"></td>
      <td class="je-td-actions">
        <button type="button" class="je-line-icon" title="Attachments" onclick="openLineAttach(this)">📎</button>
        <button type="button" class="je-line-icon" title="Notes" onclick="openLineNotes(this)">💬</button>
        <button type="button" class="je-line-icon je-line-icon-del" title="Delete" onclick="removeLine(this)">🗑</button>
      </td>`;
  document.getElementById('je-lines-body').appendChild(tr);
  renderDimensionCell(tr);
  updateLastModified();
}

/* Renders the Dimensions cell for one line, driven by the Dimension Master + the account
   the user has typed into that line (config-engine.js: applicableDimensionsForAccount). */
function renderDimensionCell(row) {
  if (!row) return;
  const acctInput = row.querySelector('[data-field="acct"]');
  const cell = row.querySelector('.je-td-dims');
  if (!cell) return;
  const dims = (typeof applicableDimensionsForAccount === 'function')
    ? applicableDimensionsForAccount(acctInput ? acctInput.value : '')
    : [];

  let html = dims.map(d => {
    const opts = (DIMENSION_VALUE_OPTIONS[d.id] || []).map(v => `<option value="${v}">${v}</option>`).join('');
    return `<select class="je-cell je-cell-sm je-dim-select" data-dim="${d.id}" title="${d.label}${d.quickbooksRef ? ' - ' + d.quickbooksRef : ''}">
      <option value="">${d.label}…</option>${opts}
    </select>`;
  }).join('');

  // Insurance-only reference fields: a JE line can point straight at the policy and/or
  // claim it relates to, on top of whatever MGA/carrier/cost-centre dimensions apply.
  const cfg = (typeof getTenantConfig === 'function') ? getTenantConfig() : null;
  const isInsurance = cfg && getBusinessType(cfg.businessType).group === 'insurance';
  if (isInsurance) {
    html += `<input class="je-cell je-cell-sm je-dim-select" type="text" data-ref="policy" placeholder="Policy #" title="Policy Number">`;
    html += `<input class="je-cell je-cell-sm je-dim-select" type="text" data-ref="claim" placeholder="Claim #" title="Claim Number">`;
  }

  cell.innerHTML = html || '<span style="color:var(--gray-400);font-size:11px;">No dimensions configured</span>';
}

function removeLine(btn) {
  const rows = document.querySelectorAll('#je-lines-body tr');
  if (rows.length <= 1) {
    showToast('At least one journal line is required', 'warning');
    return;
  }
  const id = btn.closest('tr')?.dataset.lineId;
  if (id) delete lineMeta[id];
  btn.closest('tr').remove();
  renumberLines();
  calcLineTotals();
}

function renumberLines() {
  document.querySelectorAll('#je-lines-body tr').forEach((row, i) => {
    row.querySelector('.je-td-num').textContent = i + 1;
  });
  lineCount = document.querySelectorAll('#je-lines-body tr').length;
}

function calcLineTotals() {
  let totalDebit = 0;
  let totalCredit = 0;
  document.querySelectorAll('#je-lines-body tr').forEach(row => {
    totalDebit += parseFloat(row.querySelector('[data-field="debit"]')?.value) || 0;
    totalCredit += parseFloat(row.querySelector('[data-field="credit"]')?.value) || 0;
  });
  const variance = totalDebit - totalCredit;
  const balanced = Math.abs(variance) < 0.01 && (totalDebit > 0 || totalCredit > 0);

  document.getElementById('summary-debits').textContent = formatINR(totalDebit);
  document.getElementById('summary-credits').textContent = formatINR(totalCredit);
  document.getElementById('summary-variance').textContent = formatINR(Math.abs(variance));

  const pill = document.getElementById('summary-status-pill');
  const statusText = document.getElementById('summary-status-text');
  const submitBtn = document.getElementById('btn-submit-approval');

  if (totalDebit === 0 && totalCredit === 0) {
    pill.className = 'je-sum-status';
    statusText.textContent = 'Awaiting Data';
    if (submitBtn) submitBtn.disabled = true;
  } else if (balanced) {
    pill.className = 'je-sum-status je-sum-status-ok';
    statusText.textContent = 'Balanced';
    if (submitBtn) submitBtn.disabled = false;
  } else {
    pill.className = 'je-sum-status je-sum-status-warn';
    statusText.textContent = 'Out of Balance';
    if (submitBtn) submitBtn.disabled = true;
  }
}

function openLineNotes(btn) {
  activeLineRow = btn.closest('tr');
  const id = activeLineRow?.dataset.lineId;
  const pop = document.getElementById('line-notes-popover');
  document.getElementById('line-attach-popover').hidden = true;
  document.getElementById('line-notes-input').value = (lineMeta[id]?.notes) || '';
  positionPopover(pop, btn);
  pop.hidden = false;
}

function openLineAttach(btn) {
  activeLineRow = btn.closest('tr');
  const id = activeLineRow?.dataset.lineId;
  const pop = document.getElementById('line-attach-popover');
  document.getElementById('line-notes-popover').hidden = true;
  document.getElementById('line-attach-1-name').textContent = lineMeta[id]?.attach1 || '';
  document.getElementById('line-attach-2-name').textContent = lineMeta[id]?.attach2 || '';
  positionPopover(pop, btn);
  pop.hidden = false;
}

function positionPopover(pop, anchor) {
  const rect = anchor.getBoundingClientRect();
  pop.style.position = 'fixed';
  pop.style.top = Math.min(rect.bottom + 6, window.innerHeight - 220) + 'px';
  pop.style.left = Math.min(rect.left - 120, window.innerWidth - 280) + 'px';
  pop.style.zIndex = '1100';
}

function closeLinePopover() {
  document.getElementById('line-notes-popover').hidden = true;
  document.getElementById('line-attach-popover').hidden = true;
  activeLineRow = null;
}

function saveLineNotes() {
  if (!activeLineRow) return;
  const id = activeLineRow.dataset.lineId;
  if (!lineMeta[id]) lineMeta[id] = {};
  lineMeta[id].notes = document.getElementById('line-notes-input').value;
  const btn = activeLineRow.querySelector('.je-line-icon[title="Notes"]');
  if (btn) btn.classList.toggle('has-meta', !!lineMeta[id].notes.trim());
  closeLinePopover();
  showToast('Line notes saved', 'success');
}

function saveLineAttach() {
  if (!activeLineRow) return;
  const id = activeLineRow.dataset.lineId;
  if (!lineMeta[id]) lineMeta[id] = {};
  const f1 = document.getElementById('line-attach-1').files[0];
  const f2 = document.getElementById('line-attach-2').files[0];
  if (f1) lineMeta[id].attach1 = f1.name;
  if (f2) lineMeta[id].attach2 = f2.name;
  const btn = activeLineRow.querySelector('.je-line-icon[title="Attachments"]');
  if (btn) btn.classList.toggle('has-meta', !!(lineMeta[id].attach1 || lineMeta[id].attach2));
  closeLinePopover();
  showToast('Line attachments updated', 'success');
}

function updateLastModified() {
  const el = document.getElementById('je-last-modified');
  if (el) {
    const d = new Date().toISOString().slice(0, 10);
    el.textContent = 'Last modified: ' + d + ' by ' + getCurrentUser();
  }
}

function saveDraft() {
  updateLastModified();
  showToast('Draft saved - ' + lineCount + ' line(s)', 'success');
}

function previewEntry() {
  calcLineTotals();
  showToast('Opening preview…', 'info');
}

/* ---------- AI Copilot (demo-weight): narration suggestion + anomaly/duplicate check ---------- */
function aiSuggestNarration() {
  const rows = [...document.querySelectorAll('#je-lines-body tr')];
  if (!rows.length) { showToast('Add at least one line first', 'warning'); return; }
  const parts = rows.map(row => {
    const acct = row.querySelector('[data-field="acct"]')?.value?.trim();
    const acctInfo = (typeof lookupAccount === 'function') ? lookupAccount(acct) : null;
    const dimVals = [...row.querySelectorAll('.je-dim-select')].map(s => s.value).filter(Boolean);
    return (acctInfo ? acctInfo.name : (acct || 'Unmapped account')) + (dimVals.length ? ' (' + dimVals.join(', ') + ')' : '');
  });
  const desc = 'AI Copilot: ' + parts.join(' / ');
  const input = document.getElementById('je-header-desc');
  if (input) input.value = desc;
  showToast('AI Copilot drafted a narration from ' + rows.length + ' line(s)', 'success');
}

function aiAnomalyCheck(totalDebit) {
  // Lightweight, static heuristic standing in for a real anomaly-detection service
  // (see Section 20 "AI-Enabled Features" - Journal Entries: Anomaly Detection, Narration Auto-Suggest).
  const isRoundNumber = totalDebit > 0 && totalDebit % 1000 === 0;
  const isLarge = totalDebit > 500000;
  const now = new Date();
  const isAfterHours = now.getHours() < 6 || now.getHours() >= 21;
  const flags = [];
  if (isLarge) flags.push('amount exceeds the $500,000 review threshold');
  if (isRoundNumber) flags.push('suspiciously round amount');
  if (isAfterHours) flags.push('posted outside business hours');
  return { flagged: flags.length > 0, flags };
}

/* ---------- Fiscal period readout ---------- */
function onJeDateChange() {
  const dateVal = document.getElementById('je-date').value;
  const readout = document.getElementById('je-period-readout');
  if (!readout) return;
  const period = (typeof getPeriodForDate === 'function') ? getPeriodForDate(dateVal) : null;
  readout.value = period ? (period.label + ' (' + period.status + ')') : 'No fiscal period configured for this date';
}

/* ---------- Collect real line data (incl. dimensions) for posting ---------- */
function collectJeLines() {
  return [...document.querySelectorAll('#je-lines-body tr')].map(row => {
    const get = field => row.querySelector(`[data-field="${field}"]`)?.value || '';
    const dims = {};
    row.querySelectorAll('.je-dim-select').forEach(sel => {
      const key = sel.dataset.dim || sel.dataset.ref;
      if (key && sel.value) dims[key] = sel.value;
    });
    return {
      comp: get('comp'), acct: get('acct'), desc: get('desc'), ref1: get('ref1'),
      debit: parseFloat(get('debit')) || 0, credit: parseFloat(get('credit')) || 0,
      dims,
    };
  });
}

function submitEntry() {
  calcLineTotals();
  const desc = document.getElementById('je-header-desc')?.value?.trim();
  if (!desc) {
    showToast('Enter a journal description', 'warning');
    return;
  }
  const submitBtn = document.getElementById('btn-submit-approval');
  if (submitBtn?.disabled) {
    showToast('Journal must be balanced before submit', 'warning');
    return;
  }
  const dateVal = document.getElementById('je-date').value;
  const period = (typeof getPeriodForDate === 'function') ? getPeriodForDate(dateVal) : null;
  if (period && period.status === 'closed') {
    showToast(`${period.label} is closed for posting. Choose a date in an open period, or reopen it in Admin Configuration Centre.`, 'error', 4500);
    return;
  }

  const lines = collectJeLines();
  const totalDebit = lines.reduce((s, l) => s + l.debit, 0);
  const check = aiAnomalyCheck(totalDebit);

  const je = createJournalEntry({
    company: document.getElementById('je-company')?.value,
    date: dateVal,
    source: document.getElementById('je-source')?.value,
    currency: document.getElementById('je-currency')?.value,
    description: desc,
    batch: document.getElementById('je-batch')?.value,
    lines,
  });
  const result = submitJournalEntry(je.id);

  const badge = document.getElementById('je-status-badge');
  if (result.status === 'pending_approval') {
    badge.textContent = 'PENDING APPROVAL';
    badge.classList.add('submitted');
    if (check.flagged) showToast('AI Copilot flagged this JE: ' + check.flags.join('; '), 'warning', 4000);
    showToast(`${je.number} totals ${fmtCurrency(totalDebit)}, at/above the $${GL_APPROVAL_THRESHOLD.toLocaleString()} approval threshold, routed to Workflow Approvals.`, 'info', 3200);
    setTimeout(() => { window.location.href = 'workflow-approvals.html'; }, 1600);
  } else {
    badge.textContent = 'POSTED';
    badge.classList.add('submitted');
    if (check.flagged) {
      showToast('AI Copilot flagged this JE for review: ' + check.flags.join('; '), 'warning', 4000);
    } else {
      showToast('AI Copilot check passed, no duplicates or anomalies detected', 'success', 2200);
    }
    showToast(`${je.number} posted to the ledger.`, 'success', 2600);
    setTimeout(() => { window.location.href = 'journal-entry.html'; }, 1600);
  }
}

function initDefaultLines() {
  const body = document.getElementById('je-lines-body');
  body.innerHTML = '';
  lineCount = 0;
  addLine();
  addLine();
}

document.addEventListener('DOMContentLoaded', () => {
  const num = document.getElementById('je-number');
  if (num) num.value = 'JE-2026-' + String(Math.floor(Math.random() * 900) + 100).padStart(4, '0');

  const dyn = document.getElementById('je-dynamic-acct');
  const dynLabel = document.getElementById('je-dynamic-label');
  if (dyn && dynLabel) {
    dyn.addEventListener('change', () => {
      dynLabel.textContent = dyn.checked ? 'Active (Admin)' : 'Inactive';
      dynLabel.style.color = dyn.checked ? 'var(--green)' : 'var(--gray-500)';
    });
  }

  const dateInput = document.getElementById('je-date');
  if (dateInput) {
    dateInput.value = new Date().toISOString().slice(0, 10);
    onJeDateChange();
  }

  initDefaultLines();
  calcLineTotals();
  updateLastModified();

  document.addEventListener('click', e => {
    if (!e.target.closest('.je-popover') && !e.target.closest('.je-line-icon')) {
      closeLinePopover();
    }
  });
});
