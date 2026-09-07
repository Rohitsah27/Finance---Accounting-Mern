import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';
import './dashboard.css';

export function DashboardCarrier() {
  const { currentUser } = useAuth();
  const [period, setPeriod] = useState('ytd');
  const [stateFilter, setStateFilter] = useState('all');
  const [lobFilter, setLobFilter] = useState('all');
  const [basis, setBasis] = useState('gross');
  const [chartType, setChartType] = useState('bar'); // 'bar' or 'line'
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const basisMultiplier = {
    gross: 1.0,
    ceded: 0.42,
    net: 0.58
  }[basis];

  const gwpBase = 14.82;
  const nwpBase = 8.60;
  const earnedBase = 8.10;
  const uprBase = 6.22;

  const currentGWP = (gwpBase * basisMultiplier).toFixed(2);
  const currentNWP = (nwpBase * (basis === 'ceded' ? 0.42 : basis === 'gross' ? 1.0 : 0.58)).toFixed(2);

  const MONTHLY_PREMIUMS = [
    { month: 'Jan', val: 2.1 * basisMultiplier },
    { month: 'Feb', val: 2.3 * basisMultiplier },
    { month: 'Mar', val: 2.5 * basisMultiplier },
    { month: 'Apr', val: 2.4 * basisMultiplier },
    { month: 'May', val: 2.7 * basisMultiplier },
    { month: 'Jun', val: 2.8 * basisMultiplier },
  ];

  const TREATIES = [
    { name: 'Property Quota Share 40%', treaty: 'QS-2026-01', premium: '$4,120,000', commission: '$824,000 (20%)', recoverable: '$1,450,000', share: 58 },
    { name: 'Casualty Excess of Loss $5M xs $1M', treaty: 'XL-2026-02', premium: '$1,850,000', commission: '$185,000 (10%)', recoverable: '$680,000', share: 26 },
    { name: 'Marine & Spec Cargo Fac', treaty: 'FAC-2026-03', premium: '$620,000', commission: '$93,000 (15%)', recoverable: '$190,000', share: 16 },
  ];

  return (
    <>
      {toast && (
        <div className={`veridex-toast veridex-toast-${toast.type}`}>
          <span>{toast.type === 'error' ? '✕' : '✓'}</span>
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header">
        <div>
          <div className="page-title">Carrier Dashboard</div>
          <div className="page-subtitle">
            Executive underwriting, reinsurance &amp; NAIC solvency overview · Southlake Insurance Co.
          </div>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline btn-sm" onClick={() => showToast('Statutory filing pack exported (NAIC quarterly)', 'success')}>
            Export Filing Pack
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => showToast('Carrier metrics refreshed')}>
            Refresh
          </button>
        </div>
      </div>

      {/* Filter Bar Header */}
      <div className="filter-bar" style={{ marginBottom: 0, borderRadius: '10px 10px 0 0' }}>
        <span className="filter-bar-label">Period</span>
        <select className="filter-select" value={period} onChange={(e) => setPeriod(e.target.value)}>
          <option value="ytd">YTD 2026</option>
          <option value="q1">Q1 2026</option>
          <option value="fy2025">FY 2025</option>
        </select>

        <span className="filter-bar-label">State</span>
        <select className="filter-select" value={stateFilter} onChange={(e) => setStateFilter(e.target.value)}>
          <option value="all">All States (Multi-Jurisdiction)</option>
          <option value="TX">Texas (TX)</option>
          <option value="CA">California (CA)</option>
          <option value="FL">Florida (FL)</option>
          <option value="NY">New York (NY)</option>
        </select>

        <span className="filter-bar-label">Line of Business</span>
        <select className="filter-select" value={lobFilter} onChange={(e) => setLobFilter(e.target.value)}>
          <option value="all">All LOBs</option>
          <option value="Commercial Property">Commercial Property</option>
          <option value="General Casualty">General Casualty</option>
          <option value="Commercial Auto">Commercial Auto</option>
          <option value="Marine">Inland Marine</option>
        </select>

        <div className="filter-spacer" />
        <button className="btn btn-outline btn-sm" onClick={() => { setPeriod('ytd'); setStateFilter('all'); setLobFilter('all'); setBasis('gross'); }}>
          Clear Filters
        </button>
      </div>

      {/* Primary Financial Canvas Wrapper */}
      <div style={{ border: '1.5px solid var(--gray-200, #e2e8f0)', borderTop: 'none', borderRadius: '0 0 10px 10px', padding: '16px', marginBottom: '18px', background: '#fff' }}>
        
        {/* Basis Switcher Bar */}
        <div className="fin-bar">
          <div className="fin-bar-left">Underwriting Basis</div>
          <div className="gbn-toggle">
            <button className={`gbn-btn ${basis === 'gross' ? 'active' : ''}`} onClick={() => setBasis('gross')}>Gross</button>
            <button className={`gbn-btn ${basis === 'ceded' ? 'active' : ''}`} onClick={() => setBasis('ceded')}>Ceded</button>
            <button className={`gbn-btn ${basis === 'net' ? 'active' : ''}`} onClick={() => setBasis('net')}>Net</button>
          </div>
          <div className="fin-bar-meta">
            All figures in USD · NAIC Statutory Accounting Principles (SAP)
          </div>
        </div>

        {/* 8 KPI Cards Row */}
        <div className="kpi-metrics-row">
          <div className="kpi-mc c-gwp">
            <div className="kpi-mc-label">{basis === 'ceded' ? 'Ceded Premium' : basis === 'net' ? 'Net Written (NWP)' : 'Gross Written (GWP)'}</div>
            <div className="kpi-mc-value">${currentGWP}M</div>
            <div className="kpi-mc-delta up">↑ +6.4%</div>
            <div className="kpi-mc-sublabel">Target: $14.2M</div>
            <span className="kpi-mc-status s-ontrack">On Track</span>
          </div>

          <div className="kpi-mc c-nwp">
            <div className="kpi-mc-label">Net Retained Premium</div>
            <div className="kpi-mc-value">${currentNWP}M</div>
            <div className="kpi-mc-delta up">↑ +5.2%</div>
            <div className="kpi-mc-sublabel">58.0% Net Retention</div>
            <span className="kpi-mc-status s-ontrack">On Track</span>
          </div>

          <div className="kpi-mc c-earned">
            <div className="kpi-mc-label">Net Earned Premium</div>
            <div className="kpi-mc-value">${(earnedBase * basisMultiplier).toFixed(2)}M</div>
            <div className="kpi-mc-delta up">↑ +4.8%</div>
            <div className="kpi-mc-sublabel">1/365 Pro-Rata Recog.</div>
            <span className="kpi-mc-status s-ontrack">On Track</span>
          </div>

          <div className="kpi-mc c-upr">
            <div className="kpi-mc-label">Unearned Premium (UPR)</div>
            <div className="kpi-mc-value">${(uprBase * basisMultiplier).toFixed(2)}M</div>
            <div className="kpi-mc-delta up">↑ +3.1%</div>
            <div className="kpi-mc-sublabel">Balance Sheet Reserve</div>
            <span className="kpi-mc-status s-ontrack">On Track</span>
          </div>

          <div className="kpi-mc c-loss">
            <div className="kpi-mc-label">Loss Ratio (YTD)</div>
            <div className="kpi-mc-value" style={{ color: '#e65100' }}>58.4%</div>
            <div className="kpi-mc-delta warn">↑ +1.2 pts</div>
            <div className="kpi-mc-sublabel">Target: ≤ 60.0%</div>
            <span className="kpi-mc-status s-watch">Watch</span>
          </div>

          <div className="kpi-mc c-expense">
            <div className="kpi-mc-label">Expense Ratio</div>
            <div className="kpi-mc-value">28.2%</div>
            <div className="kpi-mc-delta up">↓ -0.8 pts</div>
            <div className="kpi-mc-sublabel">Target: ≤ 30.0%</div>
            <span className="kpi-mc-status s-ontrack">On Track</span>
          </div>

          <div className="kpi-mc c-combined">
            <div className="kpi-mc-label">Combined Ratio</div>
            <div className="kpi-mc-value" style={{ color: '#2e7d32' }}>86.6%</div>
            <div className="kpi-mc-delta up">↑ Strong Margin</div>
            <div className="kpi-mc-sublabel">Underwriting Gain: 13.4%</div>
            <span className="kpi-mc-status s-strong">Strong</span>
          </div>

          <div className="kpi-mc c-rbc">
            <div className="kpi-mc-label">RBC Solvency Ratio</div>
            <div className="kpi-mc-value" style={{ color: '#37474f' }}>342%</div>
            <div className="kpi-mc-delta up">↑ +18 pts</div>
            <div className="kpi-mc-sublabel">NAIC Reg Floor: 200%</div>
            <span className="kpi-mc-status s-strong">Strong</span>
          </div>
        </div>

        {/* 2 Charts Grid */}
        <div className="charts-2col">
          {/* Premium Trend Chart */}
          <div className="chart-card">
            <div className="chart-card-hdr">
              <div>
                <div className="chart-title">Premium Written Trend</div>
                <div className="chart-sub">Monthly Volume ({basis.toUpperCase()}) · Jan–Jun 2026</div>
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => setChartType(chartType === 'bar' ? 'line' : 'bar')}>
                {chartType === 'bar' ? 'Line View' : 'Bar View'}
              </button>
            </div>
            
            {chartType === 'bar' ? (
              <div style={{ height: '160px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', padding: '10px 10px', borderBottom: '1px solid #e2e8f0' }}>
                {MONTHLY_PREMIUMS.map((m, idx) => (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '40px' }}>
                    <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--navy, #0d1b4b)', marginBottom: '4px' }}>
                      ${m.val.toFixed(1)}M
                    </div>
                    <div style={{
                      width: '26px',
                      height: `${m.val * 45}px`,
                      background: 'linear-gradient(180deg, #0d1b4b 0%, #1a237e 100%)',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.3s ease'
                    }} />
                    <div style={{ fontSize: '10.5px', color: 'var(--gray-500, #64748b)', marginTop: '4px' }}>
                      {m.month}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ height: '160px', position: 'relative', borderBottom: '1px solid #e2e8f0', padding: '10px' }}>
                <svg width="100%" height="100%" viewBox="0 0 400 140" preserveAspectRatio="none">
                  <path
                    d="M 20 90 L 85 75 L 150 55 L 215 65 L 280 40 L 350 30"
                    fill="none"
                    stroke="#0d1b4b"
                    strokeWidth="3"
                  />
                  {[
                    { cx: 20, cy: 90, val: '$2.1M' },
                    { cx: 85, cy: 75, val: '$2.3M' },
                    { cx: 150, cy: 55, val: '$2.5M' },
                    { cx: 215, cy: 65, val: '$2.4M' },
                    { cx: 280, cy: 40, val: '$2.7M' },
                    { cx: 350, cy: 30, val: '$2.8M' }
                  ].map((pt, i) => (
                    <circle key={i} cx={pt.cx} cy={pt.cy} r="4" fill="#1565c0" stroke="#fff" strokeWidth="2" />
                  ))}
                </svg>
              </div>
            )}

            <div className="chart-legend">
              <div className="legend-item"><div className="legend-dot" style={{ background: '#0d1b4b' }} />Written Premium</div>
            </div>
            <div className="chart-footer">$ USD, millions · Pro-rated unearned run-off</div>
          </div>

          {/* Underwriting Ratio Trend */}
          <div className="chart-card">
            <div className="chart-card-hdr">
              <div>
                <div className="chart-title">Ratio Trend Breakdown</div>
                <div className="chart-sub">Loss (58.4%) · Expense (28.2%) · Combined (86.6%)</div>
              </div>
            </div>
            <div style={{ height: '160px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '14px', padding: '0 10px', borderBottom: '1px solid #e2e8f0' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>
                  <span>Loss Ratio</span>
                  <span style={{ color: '#e05470' }}>58.4%</span>
                </div>
                <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: '58.4%', height: '100%', background: '#e05470', borderRadius: '4px' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>
                  <span>Expense Ratio</span>
                  <span style={{ color: '#e65100' }}>28.2%</span>
                </div>
                <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: '28.2%', height: '100%', background: '#e65100', borderRadius: '4px' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, marginBottom: '4px' }}>
                  <span>Combined Ratio (Net Underwriting Gain)</span>
                  <span style={{ color: '#0d1b4b' }}>86.6%</span>
                </div>
                <div style={{ height: '10px', background: '#f1f5f9', borderRadius: '5px', overflow: 'hidden' }}>
                  <div style={{ width: '86.6%', height: '100%', background: '#0d1b4b', borderRadius: '5px' }} />
                </div>
              </div>
            </div>
            <div className="chart-legend">
              <div className="legend-item"><div className="legend-dot" style={{ background: '#e05470' }} />Loss</div>
              <div className="legend-item"><div className="legend-dot" style={{ background: '#e65100' }} />Expense</div>
              <div className="legend-item"><div className="legend-dot" style={{ background: '#0d1b4b' }} />Combined (Target &le; 95%)</div>
            </div>
            <div className="chart-footer">Break-even ceiling = 100%</div>
          </div>
        </div>

        {/* 3 Panels Row: Cession, Reserves, NAIC Health */}
        <div className="panels-3col">
          <div className="panel-card">
            <div className="panel-title">Reinsurance Cession Summary</div>
            <div className="panel-row"><span>Quota Share Treaty</span><span className="panel-total">42.0% ceded</span></div>
            <div className="panel-row"><span>Excess of Loss (XL)</span><span className="panel-total">18.5% ceded</span></div>
            <div className="panel-row"><span>Facultative Placements</span><span className="panel-total">6.0% ceded</span></div>
            <div className="panel-row"><span>Total Ceded YTD</span><span className="panel-total">$6.22M</span></div>
            <div className="panel-row"><span>Ceding Commission Recv.</span><span className="panel-total">$1.18M</span></div>
            <div className="panel-row"><span>Treaty Renewal</span><span className="ps ps-due">31 Jul 2026</span></div>
          </div>

          <div className="panel-card">
            <div className="panel-title">Claims Reserve Movement</div>
            <div className="panel-row"><span>Case Reserves (Open)</span><span className="panel-total">$6,450,000</span></div>
            <div className="panel-row"><span>IBNR Actuarial Reserve</span><span className="panel-total">$4,180,000</span></div>
            <div className="panel-row"><span>Total Carried Reserve</span><span className="panel-total">$10,630,000</span></div>
            <div className="panel-row"><span>Paid Losses YTD</span><span className="panel-total">$4,820,000</span></div>
            <div className="panel-row"><span>Large Losses (&gt; $1M)</span><span className="ps ps-due">4 open claims</span></div>
            <div className="panel-row"><span>Avg Settlement Cycle</span><span className="panel-total">21 Days</span></div>
          </div>

          <div className="panel-card">
            <div className="panel-title">NAIC Filing Health</div>
            <div className="panel-row"><span>TX TDI Quarterly Statement</span><span className="ps ps-due">Due in 9 days</span></div>
            <div className="panel-row"><span>CA DOI Annual Statement</span><span className="ps ps-ok">Filed &amp; Accepted</span></div>
            <div className="panel-row"><span>FL OIR Surplus Cert.</span><span className="ps ps-ok">Compliant</span></div>
            <div className="panel-row"><span>NY RBC Risk Capital Report</span><span className="ps ps-overdue">2 days overdue</span></div>
            <div className="panel-row"><span>Premium Tax Multi-State</span><span className="ps ps-due">Due 12 Sep</span></div>
            <div className="panel-row"><span>Reinsurance Certification</span><span className="ps ps-ok">Current</span></div>
          </div>
        </div>
      </div>

      {/* Cession by Treaty Type Table */}
      <div className="chart-card" style={{ marginBottom: '18px' }}>
        <div className="chart-card-hdr">
          <div>
            <div className="chart-title">Cession by Treaty Type &amp; Recoverables</div>
            <div className="chart-sub">Reinsurance treaty structure and active cession book</div>
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => showToast('Treaty detail exported', 'success')}>
            Export Treaties
          </button>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Treaty Agreement</th>
              <th>Treaty Reference</th>
              <th>Ceded Premium</th>
              <th>Ceding Commission</th>
              <th>Net Recoverable</th>
              <th>Portfolio Share</th>
            </tr>
          </thead>
          <tbody>
            {TREATIES.map((t, idx) => (
              <tr key={idx}>
                <td className="font-semibold">{t.name}</td>
                <td><span className="badge badge-navy">{t.treaty}</span></td>
                <td>{t.premium}</td>
                <td style={{ color: '#2e7d32', fontWeight: 600 }}>{t.commission}</td>
                <td className="font-semibold">{t.recoverable}</td>
                <td style={{ width: '150px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1, height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${t.share}%`, height: '100%', background: '#1565c0', borderRadius: '3px' }} />
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 600 }}>{t.share}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
