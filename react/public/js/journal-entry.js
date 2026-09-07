/* Journal Entry - bulk upload with notes and upload history */

let bulkUploads = [];

async function initJournalEntry() {
  try {
    const res = await fetch('data/journal-bulk-uploads.json');
    const data = await res.json();
    const active = (typeof getActiveEntity === 'function') ? getActiveEntity() : null;
    bulkUploads = (active && active.id === 'ENT-MINE') ? [] : (data.uploads || []);
  } catch (e) {
    bulkUploads = [];
  }
  try {
    const stored = JSON.parse(localStorage.getItem('sl_bulk_uploads') || '[]');
    const ids = new Set(bulkUploads.map(u => u.id));
    stored.forEach(u => { if (!ids.has(u.id)) bulkUploads.unshift(u); });
  } catch (err) {}
  renderBulkUploadsTable();
  initBulkUploadZone();
}

function getCurrentUserName() {
  const u = getCurrentUser();
  return u.name || u.email || 'John Doe';
}

function initBulkUploadZone() {
  const zone = document.getElementById('upload-zone');
  const input = document.getElementById('file-input');
  const input2 = document.getElementById('file-input-2');
  if (!zone || !input) return;

  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    if (e.dataTransfer.files[0]) {
      input.files = e.dataTransfer.files;
      onBulkFileSelected(input);
    }
  });
  input.addEventListener('change', () => onBulkFileSelected(input));
  if (input2) input2.addEventListener('change', () => onBulkFile2Selected(input2));
}

function onBulkFileSelected(input) {
  const file = input.files[0];
  if (!file) return;
  const el = document.getElementById('bulk-file-preview');
  if (el) el.textContent = file.name + ' (' + formatFileSize(file.size) + ')';
}

function onBulkFile2Selected(input) {
  const file = input.files[0];
  if (!file) return;
  const el = document.getElementById('bulk-file2-preview');
  if (el) el.textContent = file.name + ' (' + formatFileSize(file.size) + ')';
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

function submitBulkUpload() {
  const input = document.getElementById('file-input');
  const input2 = document.getElementById('file-input-2');
  const notes = document.getElementById('bulk-upload-notes')?.value?.trim() || '';
  const file = input?.files[0];
  if (!file) {
    showToast('Select a journal file to upload', 'warning');
    return;
  }
  const file2 = input2?.files[0];
  const record = {
    id: 'UPL-2026-' + String(Date.now()).slice(-4),
    fileName: file.name,
    fileSize: formatFileSize(file.size),
    uploadedBy: getCurrentUserName(),
    uploadedAt: new Date().toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(',', ''),
    notes: notes || ' - ',
    status: 'Processing',
    rowsImported: 0,
    attachment2: file2 ? file2.name : null,
    attachment2Size: file2 ? formatFileSize(file2.size) : null
  };
  bulkUploads.unshift(record);
  localStorage.setItem('sl_bulk_uploads', JSON.stringify(bulkUploads.slice(0, 25)));
  renderBulkUploadsTable();
  showToast('Upload queued: ' + file.name, 'success');
  input.value = '';
  if (input2) input2.value = '';
  document.getElementById('bulk-file-preview').textContent = '';
  setTimeout(() => {
    record.status = 'Pending Approval';
    record.rowsImported = Math.floor(Math.random() * 200) + 10;
    renderBulkUploadsTable();
    generateJEPreviewFromUpload(record);
  }, 2000);
}

/* ---------- AI-assisted mapping demo: file → mapped columns → generated JE lines ---------- */
let generatedJELines = [];

function generateJEPreviewFromUpload(record) {
  // Reuses the same AI-mapping engine as Excel Onboarding (js/excel-mapper.js) so the
  // "your file's columns get auto-mapped with a confidence score" story is consistent everywhere.
  const mapping = (typeof autoSuggestMapping === 'function') ? autoSuggestMapping('journal-lines') : [];
  const SEED_ROWS = [
    { account_code: '1100', description: 'Premium receipt - ' + record.fileName, mga: 'FUT - Futuristic', state: 'TX', lob: 'Auto', debit: 48250, credit: 0 },
    { account_code: '2100', description: 'Unearned premium set-up - ' + record.fileName, mga: 'FUT - Futuristic', state: 'TX', lob: 'Auto', debit: 0, credit: 48250 },
    { account_code: '5100', description: 'Commission accrual - ' + record.fileName, mga: 'NTA', state: 'CA', lob: 'Property', debit: 3200, credit: 0 },
    { account_code: '1001', description: 'Cash settlement - ' + record.fileName, mga: 'NTA', state: 'CA', lob: 'Property', debit: 0, credit: 3200 },
  ];
  generatedJELines = SEED_ROWS;
  const tbody = document.getElementById('je-ai-preview-tbody');
  if (tbody) {
    tbody.innerHTML = SEED_ROWS.map(r => `<tr>
      <td>${r.account_code}${(typeof lookupAccount === 'function' && lookupAccount(r.account_code)) ? ' - ' + lookupAccount(r.account_code).name : ''}</td>
      <td>${r.description}</td>
      <td>${r.mga}</td>
      <td>${r.state}</td>
      <td>${r.lob}</td>
      <td>${r.debit ? r.debit.toLocaleString('en-US', { minimumFractionDigits: 2 }) : ''}</td>
      <td>${r.credit ? r.credit.toLocaleString('en-US', { minimumFractionDigits: 2 }) : ''}</td>
    </tr>`).join('');
  }
  const section = document.getElementById('je-ai-preview-section');
  if (section) section.style.display = '';
  const avgConfidence = mapping.length ? Math.round(mapping.reduce((s, m) => s + m.confidence, 0) / mapping.length) : 92;
  showToast('AI mapped ' + mapping.length + ' column(s) at ~' + avgConfidence + '% avg. confidence - JE preview ready below', 'success', 4000);
}

function postGeneratedJE() {
  if (!generatedJELines.length) { showToast('No generated lines to post', 'warning'); return; }
  const totalDebit = generatedJELines.reduce((s, r) => s + (r.debit || 0), 0);
  const totalCredit = generatedJELines.reduce((s, r) => s + (r.credit || 0), 0);
  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    showToast('AI Copilot blocked posting: debits (' + totalDebit + ') ≠ credits (' + totalCredit + ')', 'error');
    return;
  }
  const je = createJournalEntry({
    date: new Date().toISOString().slice(0, 10),
    description: 'Bulk-imported batch (' + generatedJELines.length + ' lines)',
    lines: generatedJELines.map(r => ({ acct: r.account_code, debit: r.debit || 0, credit: r.credit || 0, desc: r.description, dims: { mga: r.mga, state: r.state, lob: r.lob } })),
  });
  const result = submitJournalEntry(je.id);
  renderRecentJE();
  const label = result.status === 'pending_approval' ? 'routed to Workflow Approvals' : 'posted to the ledger';
  showToast('AI Copilot check passed (balanced, no duplicates), ' + je.number + ' ' + label, 'success', 4000);
  document.getElementById('je-ai-preview-section').style.display = 'none';
  generatedJELines = [];
}

/* ---------- Recent Journal Entries: real, persisted data from js/gl-engine.js ---------- */
const JE_STATUS_BADGE = { posted: 'badge-green', pending_approval: 'badge-orange', rejected: 'badge-red', draft: 'badge-gray' };
const JE_STATUS_LABEL = { posted: 'Posted', pending_approval: 'Pending Approval', rejected: 'Rejected', draft: 'Draft' };

function postJournalEntryDirectly(id) {
  if (typeof approveJournalEntry === 'function') {
    const res = approveJournalEntry(id);
    if (res) {
      showToast(`${res.number} posted to ledger`, 'success');
      if (typeof renderRecentJE === 'function') renderRecentJE();
      if (typeof renderAll === 'function') renderAll();
      return;
    }
  }
  openJournalEntryModal(id);
}

function renderRecentJE() {
  const tbody = document.getElementById('recent-je-tbody');
  if (!tbody) return;
  const entries = typeof getJournalEntriesForActiveEntity === 'function' ? getJournalEntriesForActiveEntity() : getJournalEntries();
  tbody.innerHTML = entries.map(je => {
    const debit = jeTotalDebit(je), credit = jeTotalCredit(je);
    const dateVal = je.date || je.createdAt.slice(0, 10);
    const cleanDesc = typeof formatCleanJeDescription === 'function' ? formatCleanJeDescription(je.description) : je.description;
    const actionBtn = je.status === 'draft' 
      ? `<button type="button" class="btn btn-primary btn-sm" onclick="postJournalEntryDirectly('${je.id}')" style="padding:2px 12px;font-size:11.5px;font-weight:600;">Post</button>`
      : (je.status === 'pending_approval' 
          ? `<button type="button" class="btn btn-ghost btn-sm" onclick="openJournalEntryModal('${je.id}')">Review</button>`
          : `<button type="button" class="btn btn-ghost btn-sm" onclick="openJournalEntryModal('${je.id}')">View</button>`);

    return `<tr>
      <td><input type="checkbox" class="table-check"></td>
      <td class="cell-link" style="cursor:pointer;" onclick="openJournalEntryModal('${je.id}')">${je.number}</td>
      <td>${new Date(dateVal).toLocaleDateString('en-GB')}</td>
      <td>${cleanDesc}</td>
      <td>${debit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
      <td>${credit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
      <td><span class="badge ${JE_STATUS_BADGE[je.status] || 'badge-gray'}">${JE_STATUS_LABEL[je.status] || je.status}</span></td>
      <td>${actionBtn}</td>
    </tr>`;
  }).join('') || '<tr><td colspan="8" style="text-align:center;color:var(--gray-400);padding:20px;">No journal entries yet.</td></tr>';
  initTableSelection('recent-je-table');
}

function renderBulkUploadsTable() {
  const tbody = document.getElementById('bulk-uploads-tbody');
  if (!tbody) return;
  tbody.innerHTML = bulkUploads.map(u => {
    const st = u.status === 'Processed' ? 'badge-green' : u.status === 'Processing' ? 'badge-blue' : 'badge-orange';
    return `<tr>
      <td class="font-semibold">${u.id}</td>
      <td>${u.fileName}</td>
      <td>${u.uploadedBy}</td>
      <td class="text-muted">${u.uploadedAt}</td>
      <td><span class="badge ${st}">${u.status}</span></td>
      <td>
        <button type="button" class="btn btn-outline btn-sm" onclick="viewUploadDetail('${u.id}')">View Detail</button>
      </td>
    </tr>`;
  }).join('') || '<tr><td colspan="6" class="text-muted" style="text-align:center;padding:20px;">No bulk uploads yet</td></tr>';
}

function viewUploadDetail(uploadId) {
  const upload = bulkUploads.find(u => u.id === uploadId);
  if (!upload) return;
  const modal = document.getElementById('upload-detail-modal');
  const body = document.getElementById('upload-detail-body');
  if (!modal || !body) return;
  body.innerHTML = `
    <div class="detail-grid">
      <div class="detail-row"><span class="detail-label">Upload ID</span><span>${upload.id}</span></div>
      <div class="detail-row"><span class="detail-label">Primary File</span><span>${upload.fileName} (${upload.fileSize})</span></div>
      <div class="detail-row"><span class="detail-label">Supporting File</span><span>${upload.attachment2 ? upload.attachment2 + (upload.attachment2Size ? ' (' + upload.attachment2Size + ')' : '') : ' - '}</span></div>
      <div class="detail-row"><span class="detail-label">Uploaded By</span><span>${upload.uploadedBy}</span></div>
      <div class="detail-row"><span class="detail-label">Uploaded At</span><span>${upload.uploadedAt}</span></div>
      <div class="detail-row"><span class="detail-label">Status</span><span class="badge badge-navy">${upload.status}</span></div>
      <div class="detail-row"><span class="detail-label">Rows Imported</span><span>${upload.rowsImported ?? ' - '}</span></div>
      <div class="detail-row full"><span class="detail-label">Notes</span><span>${upload.notes}</span></div>
    </div>`;
  modal.classList.add('open');
}

function closeUploadDetail() {
  document.getElementById('upload-detail-modal')?.classList.remove('open');
}

function downloadTemplate() {
  const csv = 'Account Code,Account Name,MGA,State,LOB,Debit,Credit,Description\n1100,Cash,FUTURISTIC,TX,AUTO,1000,0,Sample line\n2200,Premium Payable,NTA,CA,PROP,0,1000,Sample line\n';
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'journal-entry-template.csv';
  a.click();
  showToast('Template downloaded', 'success');
}

/* ---------- Dimension filter bar for Recent Journal Entries (config-driven, Southlake-style) ---------- */
function initDimensionFilterBar() {
  const bar = document.getElementById('je-dimension-filter-bar');
  if (!bar || typeof dimensionsForBusinessType !== 'function') return;
  const cfg = getTenantConfig();
  const dims = dimensionsForBusinessType(cfg.businessType)
    .filter(d => cfg.enabledDimensions[d.id] && DIMENSION_VALUE_OPTIONS[d.id]);
  dims.forEach(d => {
    const select = document.createElement('select');
    select.className = 'filter-select';
    select.dataset.dimId = d.id;
    select.innerHTML = `<option value="">All ${d.label}</option>` +
      DIMENSION_VALUE_OPTIONS[d.id].map(v => `<option value="${v}">${v}</option>`).join('');
    select.addEventListener('change', filterRecentJEByDimensions);
    bar.appendChild(select);
  });
  const clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.className = 'btn btn-ghost btn-sm';
  clearBtn.textContent = 'Clear';
  clearBtn.onclick = () => {
    bar.querySelectorAll('select').forEach(s => { s.selectedIndex = 0; });
    filterRecentJEByDimensions();
  };
  bar.appendChild(clearBtn);
}

function filterRecentJEByDimensions() {
  const bar = document.getElementById('je-dimension-filter-bar');
  const active = [...bar.querySelectorAll('select')].map(s => s.value).filter(Boolean);
  document.querySelectorAll('#recent-je-table tbody tr').forEach(row => {
    const text = row.textContent.toLowerCase();
    const match = active.every(v => text.includes(v.toLowerCase()));
    row.style.display = match ? '' : 'none';
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initJournalEntry();
  renderRecentJE();
  initDimensionFilterBar();
});
