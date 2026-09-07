/* ============================================================
   VERIDEX FINANCE SYSTEM - Application Logic (shared utilities)
   ============================================================ */

/* ---------- KPI Accordions ---------- */
function toggleAccordion(bodyId, toggleBtn) {
  const body = document.getElementById(bodyId);
  if (!body) return;
  const isOpen = body.classList.contains('open');
  body.classList.toggle('open');
  if (toggleBtn) toggleBtn.textContent = isOpen ? '+' : '−';
}

/* ---------- Tab Switching ---------- */
function switchTab(tabGroupId, tabId) {
  const group = document.getElementById(tabGroupId) || document;
  group.querySelectorAll('.page-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  const tab = group.querySelector(`[data-tab="${tabId}"]`);
  const panel = document.querySelector(`[data-panel="${tabId}"]`);
  if (tab) tab.classList.add('active');
  if (panel) panel.classList.add('active');
}

/* ---------- Tree toggle (Entity Hierarchy, COA tree) ---------- */
function toggleTree(nodeEl, event) {
  if (event && event.target.closest('a,button,input,select')) return;
  nodeEl.classList.toggle('open');
}

/* ---------- OTP Input Handling ---------- */
function initOtpInputs() {
  const inputs = document.querySelectorAll('.otp-digit');
  inputs.forEach((input, idx) => {
    input.addEventListener('keydown', e => {
      if (e.key === 'Backspace' && !input.value && idx > 0) inputs[idx - 1].focus();
    });
    input.addEventListener('input', () => {
      input.value = input.value.replace(/\D/g, '').slice(0, 1);
      if (input.value && idx < inputs.length - 1) inputs[idx + 1].focus();
    });
    input.addEventListener('paste', e => {
      e.preventDefault();
      const paste = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '');
      paste.split('').forEach((ch, i) => { if (inputs[idx + i]) inputs[idx + i].value = ch; });
      const nextEmpty = [...inputs].findIndex((inp, i) => i >= idx && !inp.value);
      if (nextEmpty !== -1) inputs[nextEmpty].focus();
    });
  });
}

/* ---------- Toast Notifications ---------- */
function showToast(message, type = 'default', duration = 3000) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type !== 'default' ? 'toast-' + type : ''}`;
  const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ', default: '●' };
  toast.innerHTML = `<span>${icons[type] || icons.default}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s ease reverse';
    setTimeout(() => toast.remove(), 280);
  }, duration);
}

/* ---------- Table Row Selection ---------- */
function initTableSelection(tableId) {
  const table = document.getElementById(tableId);
  if (!table) return;
  const headerCheck = table.querySelector('thead .table-check');
  const rowChecks = table.querySelectorAll('tbody .table-check');
  if (headerCheck) {
    headerCheck.addEventListener('change', () => {
      rowChecks.forEach(c => { c.checked = headerCheck.checked; });
    });
  }
  rowChecks.forEach(c => {
    c.addEventListener('change', () => {
      if (headerCheck) headerCheck.indeterminate = [...rowChecks].some(r => r.checked) && [...rowChecks].some(r => !r.checked);
    });
  });
}

/* ---------- Simple Search Filter ---------- */
function initTableFilter(inputId, tableId) {
  const input = document.getElementById(inputId);
  const table = document.getElementById(tableId);
  if (!input || !table) return;
  input.addEventListener('input', () => {
    const term = input.value.toLowerCase();
    table.querySelectorAll('tbody tr').forEach(row => {
      row.style.display = row.textContent.toLowerCase().includes(term) ? '' : 'none';
    });
  });
}

/* ---------- Form Validation ---------- */
function validateRequired(formId) {
  const form = document.getElementById(formId);
  if (!form) return true;
  let valid = true;
  form.querySelectorAll('[required]').forEach(field => {
    if (!field.value.trim()) {
      field.style.borderColor = 'var(--coral)';
      valid = false;
      field.addEventListener('input', () => { field.style.borderColor = ''; }, { once: true });
    }
  });
  return valid;
}

/* ---------- Upload Zone Interactions ---------- */
function initUploadZone(zoneId, inputId) {
  const zone = document.getElementById(zoneId);
  const input = document.getElementById(inputId);
  if (!zone) return;
  zone.addEventListener('dragover', e => {
    e.preventDefault();
    zone.classList.add('drag');
  });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag');
    const files = e.dataTransfer.files;
    if (files.length) handleUpload(files[0], zone);
  });
  zone.addEventListener('click', () => { if (input) input.click(); });
  if (input) {
    input.addEventListener('change', () => {
      if (input.files.length) handleUpload(input.files[0], zone);
    });
  }
}

function handleUpload(file, zone) {
  zone.innerHTML = `
    <div style="color:var(--v-teal);font-size:13px;font-weight:600;">
      📎 ${file.name}
      <div style="font-size:11px;color:var(--gray-500);margin-top:4px;font-weight:400;">${(file.size / 1024).toFixed(1)} KB</div>
    </div>`;
  showToast(`File "${file.name}" ready for upload`, 'success');
}

/* ---------- Import result handoff (Excel Onboarding -> results page) ----------
   Closes the "upload, then see it show up here" loop: excel-onboarding.html stashes
   what it just imported via config-engine.js's stashImportResult(); the relevant feature
   page calls this once on load to show a real preview of that import. */
function renderImportResultBanner(uploadTypeId) {
  if (typeof consumeImportResult !== 'function') return null;
  const result = consumeImportResult(uploadTypeId);
  if (!result) return null;
  const mount = document.querySelector('.main-content');
  if (!mount) return result;
  const p = result.payload;
  const tableHtml = `
    <table class="data-table" style="margin-top:10px;">
      <thead><tr>${p.columns.map(c => `<th>${c}</th>`).join('')}</tr></thead>
      <tbody>${p.rows.map(r => `<tr>${r.map(v => `<td>${v == null ? '' : v}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>`;
  const banner = document.createElement('div');
  banner.className = 'v-lock-note';
  banner.style.marginBottom = '16px';
  banner.style.borderLeft = '3px solid var(--green)';
  banner.innerHTML = `<div><strong>${p.rowCount} rows imported</strong> via Excel Onboarding (${p.uploadTypeLabel}) just now. Preview of the mapped columns below, matching what you'll see reflected in the tables on this page.</div>${tableHtml}`;
  const header = mount.querySelector('.page-header');
  if (header) header.insertAdjacentElement('afterend', banner);
  else mount.insertAdjacentElement('afterbegin', banner);
  return result;
}

/* ---------- Number Formatting ---------- */
function fmtCurrency(val, symbol = '$') {
  return symbol + Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtNumber(val) { return Number(val || 0).toLocaleString('en-US'); }
function fmtLakhCrore(val) { return Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function today() { return new Date().toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' }); }

/* ---------- Authentication & Logout ---------- */
function handleLogout() {
  sessionStorage.clear();
  localStorage.removeItem('v_current_user');
  localStorage.removeItem('v_remembered_user');
  localStorage.removeItem('v_remember_until');
  if (typeof VeriDexComponents !== 'undefined' && VeriDexComponents.showToast) {
    VeriDexComponents.showToast('You have been signed out.', 'info');
  }
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 100);
}

/* ---------- Init on DOMContentLoaded ---------- */
document.addEventListener('DOMContentLoaded', () => {
  initOtpInputs();
  document.querySelectorAll('[data-table-init]').forEach(t => initTableSelection(t.id));
  document.querySelectorAll('[data-filter-input]').forEach(i => {
    const targetTable = i.getAttribute('data-filter-input');
    if (targetTable) initTableFilter(i.id, targetTable);
  });
  document.querySelectorAll('[data-upload-zone]').forEach(z => {
    initUploadZone(z.id, z.getAttribute('data-upload-zone'));
  });
});
