import React, { useState } from 'react';
import './budgeting-forecasting.css';

const INITIAL_BUDGET_ROWS = [
  { name: 'Underwriting Operations', budget: 4200000, actual: 4085000 },
  { name: 'Claims Administration', budget: 3600000, actual: 3780000 },
  { name: 'Sales & Distribution', budget: 2950000, actual: 2810000 },
  { name: 'Information Technology', budget: 2100000, actual: 2340000 },
  { name: 'General & Administrative', budget: 1850000, actual: 1795000 },
  { name: 'Marketing', budget: 1200000, actual: 1265000 },
  { name: 'Human Resources', budget: 980000, actual: 940000 },
  { name: 'Facilities', budget: 720000, actual: 705000 },
];

const SCENARIO_MULT = { best: 1.08, base: 1.0, worst: 0.9 };

export default function BudgetingForecastingPage() {
  const [scenario, setScenario] = useState('base');
  const [toast, setToast] = useState(null);

  // Driver Inputs
  const [headcount, setHeadcount] = useState(86);
  const [unitsSold, setUnitsSold] = useState(12400);
  const [pif, setPif] = useState(9200);

  // Versions State
  const [versions, setVersions] = useState([
    { id: 1, name: 'FY2026 Operating Budget v3', status: 'Locked', createdBy: 'Priya Nathan', date: '2026-01-15' },
    { id: 2, name: 'FY2026 Operating Budget v4', status: 'Approved', createdBy: 'Priya Nathan', date: '2026-03-02' },
    { id: 3, name: 'FY2027 Draft Budget v1', status: 'Draft', createdBy: 'Marcus Webb', date: '2026-07-28' },
    { id: 4, name: 'FY2027 Draft Budget v2', status: 'Draft', createdBy: 'Marcus Webb', date: '2026-08-12' },
    { id: 5, name: 'Q3 2026 Reforecast', status: 'Approved', createdBy: 'Priya Nathan', date: '2026-07-05' },
  ]);
  const [selectedVersionId, setSelectedVersionId] = useState(null);

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const mult = SCENARIO_MULT[scenario];
  const totalBudget = INITIAL_BUDGET_ROWS.reduce((s, r) => s + r.budget, 0) * mult;
  const totalActual = INITIAL_BUDGET_ROWS.reduce((s, r) => s + r.actual, 0);
  const variancePct = ((totalActual - totalBudget) / totalBudget) * 100;

  // Driver calculations:
  // Revenue = Policies-in-Force × $1,240 avg. annual premium + Units Sold × $18 avg. unit price
  // Expense = Headcount × $96,500 fully-loaded cost + Units Sold × $6.50 variable unit cost
  const driverRev = (pif * 1240) + (unitsSold * 18);
  const driverExp = (headcount * 96500) + (unitsSold * 6.5);

  const handleSetScenario = (sc) => {
    setScenario(sc);
    const labels = { best: 'Best Case', base: 'Base Case', worst: 'Worst Case' };
    showToast(`Scenario switched to ${labels[sc]}`, 'info');
  };

  const submitVersionForApproval = (id) => {
    const v = versions.find(x => x.id === id);
    if (!v) return;
    setVersions(versions.map(item => item.id === id ? { ...item, status: 'Pending Approval' } : item));
    setSelectedVersionId(id);
    showToast(`${v.name} submitted for approval`, 'success');
  };

  const approveVersion = (id) => {
    const v = versions.find(x => x.id === id);
    if (!v) return;
    setVersions(versions.map(item => item.id === id ? { ...item, status: 'Approved' } : item));
    setSelectedVersionId(id);
    showToast(`${v.name} approved`, 'success');
  };

  const addNewBudgetVersion = () => {
    const newId = versions.length + 1;
    const name = `FY2028 Operating Budget v1`;
    setVersions([...versions, { id: newId, name, status: 'Draft', createdBy: 'You', date: new Date().toISOString().slice(0, 10) }]);
    setSelectedVersionId(newId);
    showToast(`${name} created`, 'success');
  };

  const addNewVersionOfLatestDraft = () => {
    const drafts = versions.filter(v => /Draft Budget v\d+$/.test(v.name));
    let base = 'FY2027 Draft Budget';
    let nextNum = 1;
    if (drafts.length) {
      const last = drafts[drafts.length - 1];
      const m = last.name.match(/^(.*) v(\d+)$/);
      if (m) {
        base = m[1];
        nextNum = parseInt(m[2], 10) + 1;
      }
    }
    const name = `${base} v${nextNum}`;
    const newId = versions.length + 1;
    setVersions([...versions, { id: newId, name, status: 'Draft', createdBy: 'You', date: new Date().toISOString().slice(0, 10) }]);
    setSelectedVersionId(newId);
    showToast(`${name} created`, 'success');
  };

  const exportBudgetWorkbook = () => {
    showToast('Budget workbook exported', 'success');
  };

  const exportBudgetDetail = () => {
    showToast('Budget vs actual detail exported as CSV', 'success');
  };

  const selectedVersion = versions.find(v => v.id === selectedVersionId);

  // SVG Chart rendering
  const chartW = 760;
  const chartH = 180;
  const pad = 30;
  const maxVal = Math.max(...INITIAL_BUDGET_ROWS.map(r => Math.max(r.budget * mult, r.actual)));
  const groupW = (chartW - pad * 2) / INITIAL_BUDGET_ROWS.length;
  const barW = groupW / 3;

  return (
    <>
      {toast && (
        <div className={`veridex-toast veridex-toast-${toast.type}`}>
          <span>{toast.type === 'error' ? '✕' : toast.type === 'warning' ? '⚠️' : '✓'}</span>
          <span>{toast.msg}</span>
        </div>
      )}

      {/* ═══ PAGE HEADER ═══ */}
      <div className="page-header">
        <div>
          <div className="page-title">Budgeting &amp; Forecasting</div>
          <div className="page-subtitle">Budget vs actual, driver-based planning, and scenario modeling</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline btn-sm" onClick={exportBudgetWorkbook}>Export</button>
          <button className="btn btn-primary btn-sm" onClick={addNewBudgetVersion}>+ Create New Budget</button>
        </div>
      </div>

      {/* ═══ STAT CARDS ═══ */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon si-navy">💵</div>
          <div className="stat-info">
            <div className="stat-value">${(totalBudget / 1e6).toFixed(2)}M</div>
            <div className="stat-label">Annual Budget Total</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon si-coral">📆</div>
          <div className="stat-info">
            <div className="stat-value">${(totalActual / 1e6).toFixed(2)}M</div>
            <div className="stat-label">YTD Actual</div>
          </div>
        </div>
        <div className="stat-card">
          <div className={`stat-icon ${variancePct <= 0 ? 'si-green' : 'si-orange'}`}>📉</div>
          <div className="stat-info">
            <div className="stat-value" style={{ color: variancePct <= 0 ? 'var(--green, #2e7d32)' : 'var(--red, #c62828)' }}>
              {variancePct >= 0 ? '+' : ''}{variancePct.toFixed(1)}%
            </div>
            <div className="stat-label">Variance %</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon si-orange">🧭</div>
          <div className="stat-info">
            <div className="stat-value">3</div>
            <div className="stat-label">Active Scenarios</div>
          </div>
        </div>
      </div>

      {/* ═══ BUDGET VS ACTUAL ═══ */}
      <div className="table-wrap" style={{ marginBottom: '20px' }}>
        <div className="table-head-row">
          <div className="table-head-title">Budget vs Actual</div>
          <div className="table-head-actions">
            <button className="btn btn-outline btn-sm" onClick={exportBudgetDetail}>Export CSV</button>
          </div>
        </div>
        <div className="bud-chart-wrap">
          <div className="bud-chart-legend">
            <span><i style={{ background: 'var(--navy, #0d1b4b)' }} /> Budget</span>
            <span><i style={{ background: 'var(--coral, #e05470)' }} /> Actual</span>
          </div>
          <svg width="100%" height="180" viewBox="0 0 760 180" preserveAspectRatio="xMinYMin meet">
            {INITIAL_BUDGET_ROWS.map((r, i) => {
              const x = pad + i * groupW;
              const bgt = r.budget * mult;
              const bH = (bgt / maxVal) * (chartH - 40);
              const aH = (r.actual / maxVal) * (chartH - 40);
              return (
                <g key={r.name}>
                  <rect x={x} y={chartH - 24 - bH} width={barW} height={bH} fill="#0d1b4b" rx="2" />
                  <rect x={x + barW + 3} y={chartH - 24 - aH} width={barW} height={aH} fill="#e05470" rx="2" />
                  <text x={x + barW} y={chartH - 8} fontSize="8.5" fill="#6b7280" textAnchor="middle">
                    {r.name.split(' ')[0]}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Account / Department</th>
              <th>Budget</th>
              <th>Actual</th>
              <th>Variance $</th>
              <th>Variance %</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {INITIAL_BUDGET_ROWS.map((r) => {
              const bgt = r.budget * mult;
              const varDollar = r.actual - bgt;
              const varP = (varDollar / bgt) * 100;
              const favorable = varDollar <= 0;
              return (
                <tr key={r.name}>
                  <td><strong>{r.name}</strong></td>
                  <td>${bgt.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                  <td>${r.actual.toLocaleString('en-US')}</td>
                  <td style={{ color: favorable ? '#2e7d32' : '#c62828' }}>
                    {varDollar >= 0 ? '+' : ''}${Math.round(varDollar).toLocaleString('en-US')}
                  </td>
                  <td>{varP >= 0 ? '+' : ''}{varP.toFixed(1)}%</td>
                  <td>
                    <span className={`badge ${favorable ? 'badge-green' : 'badge-red'}`}>
                      {favorable ? 'Favorable' : 'Unfavorable'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ═══ BUDGET VERSIONS ═══ */}
      <div className="table-wrap" style={{ marginBottom: '20px' }}>
        <div className="table-head-row">
          <div className="table-head-title">Budget Versions</div>
          <div className="table-head-actions">
            <button className="btn btn-outline btn-sm" onClick={addNewVersionOfLatestDraft}>+ New Version</button>
          </div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Version</th>
              <th>Status</th>
              <th>Created By</th>
              <th>Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {versions.map((v) => {
              const isSelected = selectedVersionId === v.id;
              return (
                <tr key={v.id} style={{ background: isSelected ? 'var(--gray-50, #f9fafb)' : 'transparent' }}>
                  <td><strong>{v.name}</strong></td>
                  <td>
                    <span className={`badge ${
                      v.status === 'Approved' ? 'badge-green' :
                      v.status === 'Draft' ? 'badge-orange' :
                      v.status === 'Pending Approval' ? 'badge-blue' : 'badge-navy'
                    }`}>
                      {v.status}
                    </span>
                  </td>
                  <td>{v.createdBy}</td>
                  <td>{v.date}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setSelectedVersionId(v.id)}>
                        {v.status === 'Draft' ? 'Edit' : 'View'}
                      </button>
                      {v.status === 'Draft' && (
                        <button className="btn btn-outline btn-sm" onClick={() => submitVersionForApproval(v.id)}>
                          Submit for Approval
                        </button>
                      )}
                      {v.status === 'Pending Approval' && (
                        <button className="btn btn-primary btn-sm" onClick={() => approveVersion(v.id)}>
                          Approve
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{ padding: '14px 18px', borderTop: '1px solid var(--gray-200, #e5e7eb)', background: 'var(--gray-50, #f9fafb)', fontSize: '12.5px', color: 'var(--gray-500, #6b7280)' }}>
          {selectedVersion ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--gray-900, #111827)' }}>{selectedVersion.name}</div>
                <div style={{ fontSize: '11.5px', color: 'var(--gray-500, #6b7280)', marginTop: '4px' }}>
                  Created by {selectedVersion.createdBy} on {selectedVersion.date}
                </div>
              </div>
              <span className={`badge ${
                selectedVersion.status === 'Approved' ? 'badge-green' :
                selectedVersion.status === 'Draft' ? 'badge-orange' :
                selectedVersion.status === 'Pending Approval' ? 'badge-blue' : 'badge-navy'
              }`}>
                {selectedVersion.status}
              </span>
            </div>
          ) : (
            'Select a version above to view its details.'
          )}
        </div>
      </div>

      {/* ═══ DRIVER-BASED PLANNING ═══ */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-header">
          <div className="card-title">Driver-Based Planning</div>
          <span className="badge badge-blue">Live Recalculation</span>
        </div>
        <div className="card-body">
          <div className="bud-driver-grid">
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label className="field-label">Headcount</label>
              <input
                className="field-input"
                type="number"
                value={headcount}
                min="0"
                onChange={(e) => setHeadcount(Number(e.target.value))}
              />
            </div>
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label className="field-label">Units Sold</label>
              <input
                className="field-input"
                type="number"
                value={unitsSold}
                min="0"
                onChange={(e) => setUnitsSold(Number(e.target.value))}
              />
            </div>
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label className="field-label">Policies-in-Force</label>
              <input
                className="field-input"
                type="number"
                value={pif}
                min="0"
                onChange={(e) => setPif(Number(e.target.value))}
              />
            </div>
          </div>
          <div className="bud-driver-output">
            <div className="bud-driver-output-item">
              <div className="bud-driver-output-val">${Math.round(driverRev).toLocaleString('en-US')}</div>
              <div className="bud-driver-output-label">Calculated Revenue</div>
            </div>
            <div className="bud-driver-output-item">
              <div className="bud-driver-output-val">${Math.round(driverExp).toLocaleString('en-US')}</div>
              <div className="bud-driver-output-label">Calculated Expense</div>
            </div>
          </div>
          <div className="bud-driver-note">
            Revenue = Policies-in-Force × $1,240 avg. annual premium + Units Sold × $18 avg. unit price. Expense = Headcount × $96,500 fully-loaded cost + Units Sold × $6.50 variable unit cost.
          </div>
        </div>
      </div>

      {/* ═══ SCENARIO PLANNING ═══ */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-header">
          <div className="card-title">Scenario Planning</div>
          <span className="badge badge-navy">
            {scenario === 'best' ? 'Best Case' : scenario === 'worst' ? 'Worst Case' : 'Base Case'}
          </span>
        </div>
        <div className="card-body">
          <div className="bud-scenario-row">
            <button
              className={`bud-scenario-btn ${scenario === 'best' ? 'active' : ''}`}
              onClick={() => handleSetScenario('best')}
            >
              Best Case
            </button>
            <button
              className={`bud-scenario-btn ${scenario === 'base' ? 'active' : ''}`}
              onClick={() => handleSetScenario('base')}
            >
              Base Case
            </button>
            <button
              className={`bud-scenario-btn ${scenario === 'worst' ? 'active' : ''}`}
              onClick={() => handleSetScenario('worst')}
            >
              Worst Case
            </button>
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--gray-500, #6b7280)' }}>
            Switching scenarios rescales the Budget column, Variance, and the Annual Budget Total / Variance % stat cards above using a scenario multiplier - Best Case +8%, Base Case unchanged, Worst Case −10%.
          </div>
        </div>
      </div>

      {/* ═══ INSURANCE-SPECIFIC BUDGET ═══ */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-header">
          <div className="card-title">
            Insurance-Specific Budget <span className="v-badge-industry-only">Insurance Only</span>
          </div>
        </div>
        <div className="card-body">
          <div className="bud-industry-card">
            <div className="stats-row" style={{ marginBottom: 0 }}>
              <div className="stat-card">
                <div className="stat-icon si-navy">📈</div>
                <div className="stat-info">
                  <div className="stat-value">$114.6M</div>
                  <div className="stat-label">GWP Forecast</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon si-coral">📊</div>
                <div className="stat-info">
                  <div className="stat-value">$98.2M</div>
                  <div className="stat-label">Earned Premium Model</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon si-orange">🎯</div>
                <div className="stat-info">
                  <div className="stat-value">62.5%</div>
                  <div className="stat-label">Loss Ratio Target</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon si-green">🧮</div>
                <div className="stat-info">
                  <div className="stat-value">96.8%</div>
                  <div className="stat-label">Combined Ratio Budget</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
