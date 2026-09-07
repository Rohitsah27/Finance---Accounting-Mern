/* ============================================================
   Shared report filters, export, and table utilities
   ============================================================ */

function toggleFilterPanel(panelId) {
  const panel = document.getElementById(panelId || 'report-filter-panel');
  if (!panel) return;
  panel.classList.toggle('open');
  const btn = document.querySelector('[data-filter-toggle]');
  if (btn) btn.classList.toggle('active', panel.classList.contains('open'));
}

function getReportFilterValues(prefix) {
  const p = prefix ? prefix + '-' : '';
  const get = id => document.getElementById(p + id)?.value || '';
  return {
    state: get('filter-state') || 'All States',
    mga: get('filter-mga') || 'All MGA',
    period: get('filter-period') || 'FY 2025-26',
    lob: get('filter-lob') || 'All LOB',
    search: (get('filter-search') || '').toLowerCase().trim()
  };
}

function matchesReportFilters(row, filters) {
  if (filters.state && filters.state !== 'All States' && row.state !== filters.state) return false;
  if (filters.mga && filters.mga !== 'All MGA' && row.mga !== filters.mga) return false;
  if (filters.lob && filters.lob !== 'All LOB' && row.lob !== filters.lob) return false;
  if (filters.period && row.period && filters.period !== 'All Periods' && row.period !== filters.period) return false;
  if (filters.search) {
    const hay = JSON.stringify(row).toLowerCase();
    if (!hay.includes(filters.search)) return false;
  }
  return true;
}

function tableToCSV(tableEl) {
  const rows = [];
  tableEl.querySelectorAll('tr').forEach(tr => {
    const cells = [...tr.querySelectorAll('th, td')].map(td => {
      let t = (td.innerText || '').replace(/\s+/g, ' ').trim();
      if (t.includes(',') || t.includes('"')) t = '"' + t.replace(/"/g, '""') + '"';
      return t;
    });
    if (cells.length) rows.push(cells.join(','));
  });
  return rows.join('\n');
}

function downloadCSV(filename, csvContent) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function exportTableCSV(tableId, filename) {
  const table = document.getElementById(tableId);
  if (!table) {
    showToast('No table to export', 'warning');
    return;
  }
  const name = filename || tableId + '-' + new Date().toISOString().slice(0, 10) + '.csv';
  downloadCSV(name, tableToCSV(table));
  showToast('Downloaded ' + name, 'success');
}

function exportReportData(filename, rows, columns) {
  const header = columns.map(c => c.label).join(',');
  const body = rows.map(r => columns.map(c => {
    let v = r[c.key];
    if (c.format === 'inr') v = v;
    else if (v == null) v = '';
    if (String(v).includes(',')) v = '"' + v + '"';
    return v;
  }).join(','));
  downloadCSV(filename, [header, ...body].join('\n'));
  showToast('Exported ' + filename, 'success');
}

function applyTableFilter(tableId, rows, renderFn, filters) {
  const filtered = rows.filter(r => matchesReportFilters(r, filters));
  renderFn(filtered);
  const countEl = document.querySelector('[data-filter-count]');
  if (countEl) countEl.textContent = filtered.length + ' of ' + rows.length + ' rows';
}

function initReportToolbar(options) {
  const { prefix, onFilter, tableId } = options;
  document.querySelectorAll('[data-export-table]').forEach(btn => {
    btn.addEventListener('click', () => exportTableCSV(btn.getAttribute('data-export-table')));
  });
  const applyBtn = document.getElementById((prefix || '') + 'apply-filters');
  if (applyBtn && onFilter) applyBtn.addEventListener('click', onFilter);
  const resetBtn = document.getElementById((prefix || '') + 'reset-filters');
  if (resetBtn) resetBtn.addEventListener('click', () => {
    ['filter-state', 'filter-mga', 'filter-period', 'filter-lob', 'filter-search'].forEach(id => {
      const el = document.getElementById((prefix || '') + id);
      if (el) el.selectedIndex = 0;
      if (el && el.tagName === 'INPUT') el.value = '';
    });
    onFilter && onFilter();
  });
}

function buildReportToolbarHTML(opts) {
  const id = opts.prefix || '';
  return `
    <div class="report-toolbar">
      <button type="button" class="btn btn-outline btn-sm" data-filter-toggle onclick="toggleFilterPanel('${opts.panelId || 'report-filter-panel'}')">
        <span class="toolbar-icon">▾</span> Filters
        <span class="filter-badge" data-filter-count></span>
      </button>
      <button type="button" class="btn btn-outline btn-sm" data-export-table="${opts.tableId || 'report-table'}">
        <span class="toolbar-icon">↓</span> Export CSV
      </button>
      ${opts.extraButtons || ''}
    </div>
    <div class="report-filter-panel" id="${opts.panelId || 'report-filter-panel'}">
      <div class="report-filter-grid">
        <label>State<select class="filter-select" id="${id}filter-state"><option>All States</option><option>TX</option><option>CA</option><option>FL</option><option>NY</option><option>GA</option></select></label>
        <label>MGA<select class="filter-select" id="${id}filter-mga"><option>All MGA</option><option>Futuristic</option><option>NTA</option><option>ACCL</option></select></label>
        <label>Period<select class="filter-select" id="${id}filter-period"><option>FY 2025-26</option><option>Q1 2026</option><option>Q2 2026</option><option>MTD May 2026</option></select></label>
        <label>LOB<select class="filter-select" id="${id}filter-lob"><option>All LOB</option><option>Auto</option><option>Property</option><option>Liability</option></select></label>
        <label>Search<input type="text" class="filter-input" id="${id}filter-search" placeholder="Search rows…"></label>
      </div>
      <div class="report-filter-actions">
        <button type="button" class="btn btn-primary btn-sm" id="${id}apply-filters">Apply Filters</button>
        <button type="button" class="btn btn-ghost btn-sm" id="${id}reset-filters">Reset</button>
      </div>
    </div>`;
}
