/* Statutory Reports - state-based data, charts, filters, bulk export */

let statData = null;
let statCharts = {};
let activeStatReport = 'trial-balance';
let draftLocked = 'draft';

function formatStatINR(n) {
  if (Math.abs(n) >= 1000000000) return '$' + (n / 1000000000).toFixed(2) + 'B';
  if (Math.abs(n) >= 1000000) return '$' + (n / 1000000).toFixed(2) + 'M';
  if (Math.abs(n) >= 1000) return '$' + (n / 1000).toFixed(1) + 'K';
  return '$' + Number(n).toLocaleString('en-US');
}

async function initStatutoryReports() {
  try {
    const res = await fetch('data/statutory-reports.json');
    statData = await res.json();
    const active = (typeof getActiveEntity === 'function') ? getActiveEntity() : null;
    if (active && active.id === 'ENT-MINE') {
      statData.trialBalance = [];
      statData.balanceSheet = [];
      statData.profitLoss = [];
      statData.cashFlow = [];
      statData.schedules = [];
      statData.footnotes = [];
      statData.quarterly = [];
      statData.filings = [];
      statData.trendByState = {};
    }
    populateStatFilters();
    bindStatNav();
    renderStatReport('trial-balance');
    initTrendCharts();
    updateFilingTable();
    renderScheduleCards();
    document.getElementById('stat-draft-lock')?.addEventListener('change', e => {
      draftLocked = e.checked ? 'locked' : 'draft';
      showToast('Layout ' + (e.checked ? 'locked' : 'unlocked'), 'info');
    });
  } catch (e) {
    showToast('Load statutory data via local server (data/statutory-reports.json)', 'error', 5000);
  }
}

function populateStatFilters() {
  const f = statData.filters;
  fillStatSelect('stat-filter-state', f.states);
  fillStatSelect('stat-filter-mga', f.mga);
  fillStatSelect('stat-filter-period', f.periods);
}

function fillStatSelect(id, opts) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = opts.map(o => `<option>${o}</option>`).join('');
}

function getStatFilters() {
  return {
    state: document.getElementById('stat-filter-state')?.value || 'All States',
    mga: document.getElementById('stat-filter-mga')?.value || 'All MGA',
    period: document.getElementById('stat-filter-period')?.value || 'FY 2025-26',
    lob: 'All LOB',
    search: (document.getElementById('stat-filter-search')?.value || '').toLowerCase()
  };
}

function bindStatNav() {
  document.querySelectorAll('.stat-nav-item').forEach(el => {
    el.addEventListener('click', () => {
      document.querySelectorAll('.stat-nav-item').forEach(n => n.classList.remove('active'));
      el.classList.add('active');
      renderStatReport(el.dataset.report);
    });
  });
}

function filterStatRows(rows) {
  const f = getStatFilters();
  return rows.filter(r => {
    if (f.state !== 'All States' && r.state !== f.state) return false;
    if (f.mga !== 'All MGA' && r.mga !== f.mga) return false;
    if (f.period !== 'All Periods' && r.period && r.period !== f.period) return false;
    if (f.search && !JSON.stringify(r).toLowerCase().includes(f.search)) return false;
    return true;
  });
}

function renderStatReport(reportId) {
  activeStatReport = reportId;
  const title = document.getElementById('stat-report-title');
  const configs = {
    'trial-balance': { title: 'Trial Balance', key: 'trialBalance', cols: ['account', 'opening', 'debit', 'credit', 'closing'], headers: ['Account', 'Opening ($)', 'Debit ($)', 'Credit ($)', 'Closing ($)', 'State', 'Action'], fmt: ['', 'inr', 'inr', 'inr', 'inr'] },
    'balance-sheet': { title: 'Balance Sheet', key: 'balanceSheet', cols: ['category', 'currentFY', 'priorFY'], headers: ['Category', 'Current FY ($)', 'Prior FY ($)', 'State', 'MGA', 'Action'] },
    'profit-loss': { title: 'Profit & Loss', key: 'profitLoss', cols: ['category', 'currentFY', 'priorFY'], headers: ['Category', 'Amount FY ($)', 'Prev FY ($)', 'State', 'Action'] },
    'cash-flow': { title: 'Cash Flow', key: 'cashFlow', cols: ['activity', 'currentFY', 'priorFY'], headers: ['Activity Type', 'Current FY ($)', 'Prior FY ($)', 'State', 'Action'] },
    'schedules': { title: 'Schedules', key: 'schedules', cols: ['schedule', 'description', 'status'], headers: ['Schedule', 'Description', 'Status', 'State', 'Action'] },
    'footnotes': { title: 'Footnotes', key: 'footnotes', cols: ['note', 'title', 'status'], headers: ['Note', 'Title', 'Status', 'State', 'Action'] },
    'quarterly': { title: 'Quarterly Statement', key: 'quarterly', cols: ['metric', 'q1FY26', 'q1FY25'], headers: ['Metric', 'Q1 FY26 ($)', 'Q1 FY25 ($)', 'Variance', 'Trend', 'State'] }
  };
  const cfg = configs[reportId] || configs['trial-balance'];
  if (title) title.textContent = cfg.title;

  const rows = filterStatRows(statData[cfg.key] || []);
  const tbody = document.getElementById('stat-report-tbody');
  const count = document.querySelector('[data-stat-filter-count]');
  if (count) count.textContent = rows.length;

  if (!tbody) return;

  tbody.innerHTML = rows.map(r => {
    if (reportId === 'quarterly') {
      const v = (r.q1FY26 || 0) - (r.q1FY25 || 0);
      const pct = r.q1FY25 ? Math.round((v / r.q1FY25) * 100) : 0;
      return `<tr>
        <td class="font-semibold">${r.metric}</td>
        <td class="text-right">${formatStatINR(r.q1FY26)}</td>
        <td class="text-right text-muted">${formatStatINR(r.q1FY25)}</td>
        <td class="text-right">${v >= 0 ? '+' : ''}${formatStatINR(v)}</td>
        <td><span class="badge ${pct >= 0 ? 'badge-green' : 'badge-red'}">${pct >= 0 ? '+' : ''}${pct}%</span></td>
        <td><span class="badge badge-navy">${r.state}</span></td>
      </tr>`;
    }
    if (reportId === 'schedules' || reportId === 'footnotes') {
      const badge = r.status === 'Ready' || r.status === 'Final' ? 'badge-green' : r.status === 'In Progress' || r.status === 'Draft' ? 'badge-orange' : 'badge-blue';
      return `<tr>
        <td class="font-semibold">${r.schedule || r.note}</td>
        <td>${r.description || r.title}</td>
        <td><span class="badge ${badge}">${r.status}</span></td>
        <td><span class="badge badge-navy">${r.state}</span></td>
        <td><button class="btn btn-link btn-sm" onclick="showToast('Opening details…','info')">View Details</button></td>
      </tr>`;
    }
    const cells = cfg.cols.map((c, i) => {
      const v = r[c];
      const formatted = cfg.fmt && cfg.fmt[i] === 'inr' ? formatStatINR(v) : v;
      return `<td class="${i > 0 && typeof v === 'number' ? 'text-right' : ''}">${formatted}</td>`;
    }).join('');
    return `<tr>${cells}
      <td><span class="badge badge-navy">${r.state}</span></td>
      ${reportId !== 'trial-balance' ? `<td class="text-muted">${r.mga || ' - '}</td>` : ''}
      <td><button class="btn btn-link btn-sm" onclick="showToast('View ${r.account || r.category || r.activity}','info')">View Details</button></td>
    </tr>`;
  }).join('') || '<tr><td colspan="8" class="text-muted" style="text-align:center;padding:24px;">No rows for selected state / MGA / period</td></tr>';

  updateStatThead(cfg.headers);
}

function updateStatThead(headers) {
  const thead = document.getElementById('stat-report-thead');
  if (thead) thead.innerHTML = '<tr>' + headers.map(h => `<th${h.includes('$') || h === 'Variance' || h === 'Trend' ? ' class="text-right"' : ''}>${h}</th>`).join('') + '</tr>';
}

function initTrendCharts() {
  if (typeof Chart === 'undefined' || !statData) return;
  const state = document.getElementById('stat-filter-state')?.value || 'TX';
  const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May'];
  const data = statData.trendByState[state] || statData.trendByState.TX;

  destroyStatChart('stat-chart-period');
  const ctx1 = document.getElementById('stat-chart-period');
  if (ctx1) {
    statCharts.period = new Chart(ctx1, {
      type: 'line',
      data: {
        labels,
        datasets: [{ label: 'Premium ($L)', data, borderColor: '#6a5acd', backgroundColor: 'rgba(106,90,205,0.2)', fill: true, tension: 0.4 }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
  }

  destroyStatChart('stat-chart-compare');
  const ctx2 = document.getElementById('stat-chart-compare');
  if (ctx2) {
    statCharts.compare = new Chart(ctx2, {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: 'FY 2025-26', data, borderColor: '#e05470', tension: 0.35 },
          { label: 'FY 2023-24', data: data.map(v => Math.round(v * 0.82)), borderColor: '#0d1b4b', tension: 0.35 }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }
}

function destroyStatChart(id) {
  const key = id.replace('stat-chart-', '');
  if (statCharts[key]) { statCharts[key].destroy(); delete statCharts[key]; }
}

function onStatFilterApply() {
  renderStatReport(activeStatReport);
  initTrendCharts();
  updateFilingTable();
  renderScheduleCards();
  showToast('Filters applied', 'success');
}

function updateFilingTable() {
  const f = getStatFilters();
  const rows = (statData.filings || []).filter(r => f.state === 'All States' || r.state === f.state);
  const tbody = document.getElementById('stat-filings-tbody');
  if (!tbody) return;
  tbody.innerHTML = rows.map(r => {
    const daysBadge = r.daysLeft <= 5 ? 'badge-red' : r.daysLeft <= 30 ? 'badge-orange' : 'badge-green';
    const st = r.status === 'Filed' ? 'badge-green' : r.status === 'In Progress' ? 'badge-orange' : r.status === 'Under Review' ? 'badge-blue' : 'badge-gray';
    return `<tr>
      <td class="font-semibold">${r.filing}</td>
      <td><span class="badge badge-navy">${r.state}</span></td>
      <td>${r.period}</td>
      <td>${r.dueDate}</td>
      <td><span class="badge ${daysBadge}">${r.daysLeft} days</span></td>
      <td><span class="badge ${st}">${r.status}</span></td>
      <td>${r.assignee}</td>
      <td>
        <button class="btn btn-outline btn-sm" onclick="exportStatRow('${r.filing}')">Export</button>
        <button class="btn btn-ghost btn-sm" onclick="showToast('Prepare filing…','info')">Prepare</button>
      </td>
    </tr>`;
  }).join('');
}

function exportCurrentStatReport() {
  const table = document.getElementById('stat-report-table');
  if (table) exportTableCSV('stat-report-table', 'statutory-' + activeStatReport + '-' + new Date().toISOString().slice(0, 10) + '.csv');
}

function bulkExportStatutory() {
  if (!statData) return;
  const keys = ['trialBalance', 'balanceSheet', 'profitLoss', 'cashFlow', 'schedules', 'footnotes', 'quarterly'];
  const f = getStatFilters();
  let combined = 'Report,State,MGA,Period,Field,Value\n';
  keys.forEach(key => {
    filterStatRows(statData[key] || []).forEach(r => {
      Object.entries(r).forEach(([k, v]) => {
        if (k !== 'state' && k !== 'mga' && k !== 'period') return;
      });
      combined += [key, r.state, r.mga || '', r.period || '', JSON.stringify(r).replace(/,/g, ';')].join(',') + '\n';
    });
  });
  downloadCSV('veridex-statutory-bulk-' + f.state.replace(/\s/g, '-') + '-' + new Date().toISOString().slice(0, 10) + '.csv', combined);
  showToast('Bulk export downloaded (all statutory reports)', 'success', 4000);
}

function exportStatRow(name) {
  showToast('Exported: ' + name, 'success');
}

function runStatValidation() {
  showToast('Running NAIC validation by state…', 'info');
  setTimeout(() => showToast('4 passed · 1 warning (Schedule F - CA)', 'warning'), 1200);
}

function renderScheduleCards() {
  const grid = document.getElementById('stat-schedule-cards');
  if (!grid || !statData) return;
  grid.innerHTML = filterStatRows(statData.schedules).map(s => `
    <div class="form-card" style="padding:20px;">
      <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
        <div class="card-title">${s.schedule}</div>
        <span class="badge badge-navy">${s.state}</span>
      </div>
      <div style="font-size:12.5px;color:var(--gray-600);margin-bottom:16px;">${s.description}</div>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-outline btn-sm" onclick="showToast('Preview ${s.schedule}','info')">Preview</button>
        <button class="btn btn-primary btn-sm" onclick="exportStatRow('${s.schedule}')">Export</button>
      </div>
    </div>`).join('');
}

document.addEventListener('DOMContentLoaded', () => initStatutoryReports());
