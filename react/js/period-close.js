/* MGA Period Close - 45-day policy, manual steps + automation */

let closeData = null;
let currentStep = 1;
let closeStarted = false;

const STEP_STORAGE = 'sl_period_close_april2026';

async function initPeriodClose() {
  try {
    const res = await fetch('data/period-close.json');
    closeData = await res.json();
    const active = (typeof getActiveEntity === 'function') ? getActiveEntity() : null;
    if (active && active.id === 'ENT-MINE') {
      closeData.validations = [];
      closeData.periodsByState = [];
      closeData.closeReports = [];
      closeData.currentPeriod = {
        label: "May 2026",
        periodEnd: "2026-05-31",
        status: "open",
        mga: "All MGA",
        states: []
      };
    }
    const saved = localStorage.getItem(STEP_STORAGE);
    if (saved) {
      const s = JSON.parse(saved);
      currentStep = s.step || 1;
      closeStarted = s.started || false;
    }
    renderPolicyBanner();
    renderStepper();
    renderStepContent();
    renderPeriodsByState();
    renderValidations();
    renderCloseReports();
  } catch (e) {
    showToast('Load period-close.json via local HTTP server', 'error', 5000);
  }
}

function daysSincePeriodEnd() {
  const end = new Date(closeData.currentPeriod.periodEnd);
  const now = new Date('2026-05-21');
  return Math.floor((now - end) / (86400000));
}

function daysRemainingInPolicy() {
  return Math.max(0, closeData.policy.mgaCloseWindowDays - daysSincePeriodEnd());
}

function renderPolicyBanner() {
  const days = daysSincePeriodEnd();
  const remaining = daysRemainingInPolicy();
  const p = closeData.policy;
  const el = document.getElementById('policy-banner');
  if (!el) return;

  let level = 'info';
  let msg = `MGA close window: <strong>${remaining} days</strong> remaining (${days} days since ${closeData.currentPeriod.periodEnd}).`;
  if (days >= p.automation.escalationDay) {
    level = 'warning';
    msg += ' <strong>Escalation:</strong> Controller notified.';
  }
  if (days >= p.automation.autoSoftLockSuggestionDay) {
    level = 'danger';
    msg += ' <strong>Auto-recommendation:</strong> Soft-lock suggested per 45-day policy.';
  } else if (days >= p.automation.validationReminderDay) {
    msg += ' Automated validation reminders are active.';
  }

  el.className = 'policy-banner policy-' + level;
  el.innerHTML = `
    <div>
      <div class="policy-banner-title">45-Day MGA Period Close Policy</div>
      <div class="policy-banner-text">${msg}</div>
      <div class="policy-banner-sub">${p.description}</div>
    </div>
    <div class="policy-banner-meta">
      <div class="policy-days"><span>${remaining}</span><small>days left</small></div>
      <button class="btn btn-outline btn-sm" style="color:inherit;border-color:currentColor;" onclick="runAutoValidations()">Run Auto Checks</button>
    </div>`;
}

function renderStepper() {
  const wrap = document.getElementById('close-stepper');
  if (!wrap || !closeData) return;
  wrap.innerHTML = closeData.steps.map(s => {
    const done = s.id < currentStep;
    const active = s.id === currentStep;
    const cls = done ? 'close-step done' : active ? 'close-step active' : 'close-step';
    return `<div class="${cls}" data-step="${s.id}">
      <div class="close-step-icon">${done ? '✓' : s.id}</div>
      <div class="close-step-label">STEP ${s.id}</div>
      <div class="close-step-name">${s.title}</div>
    </div>`;
  }).join('');

  document.getElementById('close-period-label').textContent = closeData.currentPeriod.label;
  const badge = document.getElementById('close-period-status');
  if (badge) {
    badge.textContent = closeStarted ? (currentStep >= 5 ? 'Closing' : 'In Progress') : 'Open';
    badge.className = 'badge ' + (closeStarted ? 'badge-orange' : 'badge-red');
  }
}

function saveProgress() {
  localStorage.setItem(STEP_STORAGE, JSON.stringify({ step: currentStep, started: closeStarted }));
}

function renderStepContent() {
  const step = closeData.steps.find(s => s.id === currentStep);
  const area = document.getElementById('close-step-content');
  if (!area || !step) return;

  let actions = '';
  if (step.key === 'pre-start') {
    actions = `<button class="btn btn-primary" onclick="startMonthClose()" ${closeStarted ? 'disabled' : ''}>▶ Start Month Close</button>`;
  } else if (step.key === 'update-ledgers') {
    actions = `<button class="btn btn-primary" onclick="autoUpdateLedgers()">⟳ Auto-Sync Ledgers</button>
               <button class="btn btn-outline" onclick="advanceStep()">Mark Complete →</button>`;
  } else if (step.key === 'validations') {
    actions = `<button class="btn btn-primary" onclick="runAutoValidations()">Run All Validations</button>
               <button class="btn btn-outline" onclick="advanceStep()">Continue →</button>`;
  } else if (step.key === 'generate-reports') {
    actions = `<button class="btn btn-primary" onclick="generateAllReports()">Generate All Reports</button>`;
  } else if (step.key === 'close-month') {
    const blockers = (closeData.validations || []).filter(v => v.status === 'fail').length;
    actions = `<button class="btn btn-primary" onclick="closeTheMonth()" ${blockers ? 'title="Resolve blockers first"' : ''}>🔒 Close the Month</button>`;
    if (blockers) actions += `<span class="text-muted" style="font-size:12px;margin-left:12px;">${blockers} blocker(s) must pass</span>`;
  }

  area.innerHTML = `
    <div class="close-step-header">
      <div>
        <h2 class="close-step-title">${step.title}</h2>
        <p class="close-step-desc">${step.description}</p>
        <span class="badge ${step.auto ? 'badge-navy' : 'badge-orange'}">${step.mode === 'manual' ? 'Manual' : step.mode === 'auto' ? 'Automated' : 'Manual + Auto'}</span>
      </div>
      <div class="close-step-actions">${actions}</div>
    </div>
    <div id="close-step-body"></div>`;

  const body = document.getElementById('close-step-body');
  if (step.key === 'validations') {
    body.innerHTML = `
      <div class="validation-summary">
        <div class="val-card val-total"><span id="val-total">0</span><small>Total Checks</small></div>
        <div class="val-card val-pass"><span id="val-passed">0</span><small>Passed</small></div>
        <div class="val-card val-warn"><span id="val-warnings">0</span><small>Warnings</small></div>
        <div class="val-card val-block"><span id="val-blockers">0</span><small>Blockers</small></div>
      </div>
      <div class="filter-bar" style="margin-top:16px;">
        <span class="filter-bar-label">Filter by state:</span>
        <select class="filter-select" id="close-filter-state-inner" onchange="document.getElementById('close-filter-state').value=this.value; renderValidations()">
          <option>All States</option><option>TX</option><option>CA</option><option>FL</option>
        </select>
        <button class="btn btn-outline btn-sm" onclick="exportTableCSV('close-validations-table','validations.csv')">Export CSV</button>
      </div>
      <table class="data-table" id="close-validations-table">
        <thead><tr><th>ID</th><th>Name</th><th>State</th><th>Status</th><th>Created at</th><th>Created by</th><th>Document</th><th>Action</th></tr></thead>
        <tbody id="close-validations-tbody"></tbody>
      </table>`;
  } else if (step.key === 'generate-reports') {
    body.innerHTML = `<p style="font-size:13px;color:var(--gray-600);margin:0 0 16px;">Generate monthly closing reports by state. Export or regenerate individual reports.</p>
      <div class="close-reports-grid" id="close-reports-grid"></div>`;
  } else if (step.key === 'pre-start') {
    body.innerHTML = `<div class="close-info-card">Period <strong>${closeData.currentPeriod.label}</strong> · States: ${closeData.currentPeriod.states.join(', ')} · Complete close within <strong>45 days</strong> of period end.</div>`;
  } else if (step.key === 'close-month') {
    body.innerHTML = `<div class="close-info-card warn">Finalize ${closeData.currentPeriod.label}. This locks the period and prevents further postings. Break-glass requires audit trail.</div>`;
  } else body.innerHTML = '';

  if (step.key === 'validations') renderValidations();
  if (step.key === 'generate-reports') renderCloseReports();
}

function startMonthClose() {
  closeStarted = true;
  currentStep = 2;
  saveProgress();
  renderStepper();
  renderStepContent();
  showToast('Month close started for ' + closeData.currentPeriod.label, 'success');
}

function autoUpdateLedgers() {
  showToast('Auto-syncing GL by state and MGA…', 'info');
  setTimeout(() => {
    showToast('Ledgers updated - TX, CA, FL posted', 'success');
    if (currentStep === 2) { currentStep = 3; saveProgress(); renderStepper(); renderStepContent(); }
  }, 1500);
}

function runAutoValidations() {
  showToast('Running automated validations (45-day policy day ' + daysSincePeriodEnd() + ')…', 'info');
  setTimeout(() => showToast('10 passed · 0 warnings · 2 blockers', 'warning'), 1200);
}

function advanceStep() {
  if (currentStep < 5) {
    currentStep++;
    saveProgress();
    renderStepper();
    renderStepContent();
  }
}

function generateAllReports() {
  showToast('Generating all state closing reports…', 'info');
  closeData.closeReports.forEach((r, i) => {
    setTimeout(() => {
      r.status = 'completed';
      r.progress = 100;
      renderCloseReports();
    }, 400 * (i + 1));
  });
  setTimeout(() => {
    showToast('All reports generated', 'success');
    if (currentStep === 4) { currentStep = 5; saveProgress(); renderStepper(); renderStepContent(); }
  }, 2800);
}

function regenerateReport(id) {
  showToast('Regenerating report #' + id, 'info');
}

function closeTheMonth() {
  const blockers = (closeData.validations || []).filter(v => v.status === 'fail').length;
  if (blockers) {
    showToast('Resolve ' + blockers + ' validation blocker(s) before close', 'error');
    return;
  }
  if (!confirm('Close ' + closeData.currentPeriod.label + ' for all states? This will soft-lock the period.')) return;
  showToast('Period closed and soft-locked', 'success');
  currentStep = 5;
  closeData.currentPeriod.status = 'soft_closed';
  saveProgress();
  renderStepper();
  renderPolicyBanner();
}

function renderValidations() {
  const tbody = document.getElementById('close-validations-tbody');
  if (!tbody) return;
  const stateF = document.getElementById('close-filter-state')?.value;
  let rows = closeData.validations || [];
  if (stateF && stateF !== 'All States') rows = rows.filter(r => r.state === stateF);

  const passed = rows.filter(r => r.status === 'pass').length;
  const failed = rows.filter(r => r.status === 'fail').length;
  ['val-total', 'val-passed', 'val-warnings', 'val-blockers'].forEach((id, i) => {
    const el = document.getElementById(id);
    if (!el) return;
    const vals = [rows.length, passed, 0, failed];
    el.textContent = vals[i];
  });

  tbody.innerHTML = rows.map(v => {
    const st = v.status === 'pass' ? 'badge-green' : 'badge-red';
    return `<tr>
      <td>${v.id}</td>
      <td>${v.name}</td>
      <td><span class="badge badge-navy">${v.state}</span></td>
      <td><span class="badge ${st}">${v.status === 'pass' ? 'Pass' : 'Fail'}</span></td>
      <td class="text-muted">${v.createdAt}</td>
      <td>${v.createdBy}</td>
      <td><button class="btn btn-outline btn-sm" onclick="showToast('Download validation doc','info')">Download</button></td>
      <td><button class="btn btn-ghost btn-sm" onclick="recheckValidation('${v.id}')">Re-check</button></td>
    </tr>`;
  }).join('');
}

function recheckValidation(id) {
  showToast('Re-running ' + id + '…', 'info');
}

function renderCloseReports() {
  const grid = document.getElementById('close-reports-grid');
  if (!grid) return;
  grid.innerHTML = (closeData.closeReports || []).map(r => {
    const done = r.status === 'completed';
    return `<div class="close-report-card ${done ? 'done' : ''}">
      <div class="close-report-num">#${r.id}</div>
      <div class="close-report-name">${r.name}</div>
      <div class="close-report-states">${r.states.map(s => `<span class="badge badge-navy">${s}</span>`).join(' ')}</div>
      <div class="progress-bar" style="margin:10px 0;"><div class="progress-fill ${done ? 'pf-green' : 'pf-coral'}" style="width:${r.progress}%"></div></div>
      <div class="close-report-footer">
        <span class="badge ${done ? 'badge-green' : 'badge-orange'}">${done ? 'Completed' : r.progress ? 'In Progress' : 'Pending'}</span>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-outline btn-sm" onclick="exportTableCSV(null); showToast('Exported ${r.name}','success')">Export</button>
          <button class="btn btn-ghost btn-sm" onclick="regenerateReport(${r.id})">↻ Regenerate</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function renderPeriodsByState() {
  const tbody = document.getElementById('periods-by-state-tbody');
  if (!tbody) return;
  tbody.innerHTML = (closeData.periodsByState || []).map(p => {
    const rem = p.daysRemaining;
    const pct = Math.round((rem / 45) * 100);
    const barColor = rem <= 5 ? 'pf-coral' : rem <= 15 ? 'pf-navy' : 'pf-green';
    const st = p.status === 'hard_closed' ? 'badge-red' : p.status === 'soft_closed' ? 'badge-orange' : p.status === 'in_close' ? 'badge-blue' : 'badge-green';
    return `<tr>
      <td><span class="badge badge-navy">${p.state}</span></td>
      <td class="font-semibold">${p.period}</td>
      <td>${p.mga}</td>
      <td><span class="badge ${st}">${p.status.replace('_', ' ')}</span></td>
      <td>${p.daysSinceEnd}d</td>
      <td>
        <div style="display:flex;align-items:center;gap:8px;">
          <div class="progress-bar" style="flex:1;max-width:120px;"><div class="progress-fill ${barColor}" style="width:${pct}%"></div></div>
          <span style="font-size:11.5px;">${rem}d left</span>
        </div>
      </td>
      <td>
        <button class="btn btn-outline btn-sm" onclick="showToast('Export ${p.state} period','success')">Export</button>
        ${p.status === 'open' ? `<button class="btn btn-primary btn-sm" onclick="startMonthClose()">Start Close</button>` : ''}
      </td>
    </tr>`;
  }).join('');
}

document.addEventListener('DOMContentLoaded', initPeriodClose);
