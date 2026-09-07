import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';
import './dashboard.css';

export function DashboardOwner() {
  const { currentUser } = useAuth();
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const TOP_CUSTOMERS = [
    { name: 'Apex Global Logistics', initials: 'AG', amt: '$384,500', status: 'Current' },
    { name: 'Meridian Capital Partners', initials: 'MC', amt: '$248,000', status: 'Current' },
    { name: 'Starlight Re Underwriters', initials: 'SR', amt: '$196,400', status: 'Current' },
    { name: 'Beacon Health Systems', initials: 'BH', amt: '$142,000', status: '15d Overdue' },
    { name: 'Pacific Trade Transport', initials: 'PT', amt: '$98,600', status: 'Current' }
  ];

  const UPCOMING_BILLS = [
    { vendor: 'Amazon Web Services (AWS)', due: 'Due Tomorrow', amt: '$28,450', status: 'Scheduled' },
    { vendor: 'Lloyd\'s Reinsurance Cession', due: 'In 3 days', amt: '$142,000', status: 'Pending Approval' },
    { vendor: 'Corporate Office Leases', due: 'In 5 days', amt: '$36,000', status: 'Approved' },
    { vendor: 'Willis Towers Watson Advisory', due: 'In 7 days', amt: '$18,500', status: 'Scheduled' },
    { vendor: 'State Surplus Lines Stamp Tax', due: 'In 10 days', amt: '$64,200', status: 'Scheduled' }
  ];

  const ENTITIES = [
    { name: 'Southlake Insurance Co.', type: 'Carrier', rev: '$14,820,400', exp: '$11,411,708', net: '$3,408,692', margin: '23.0%' },
    { name: 'NTA Program Administrators', type: 'MGA', rev: '$2,590,000', exp: '$1,980,000', net: '$610,000', margin: '23.5%' },
    { name: 'HIT Agency Group', type: 'Agency', rev: '$386,110', exp: '$242,000', net: '$144,110', margin: '37.3%' },
    { name: 'AC Manufacturing Inc.', type: 'Corporate', rev: '$4,810,000', exp: '$3,920,000', net: '$890,000', margin: '18.5%' },
  ];

  const MONTHS_12 = [
    { m: 'Jan', rev: 1.2, exp: 0.9 },
    { m: 'Feb', rev: 1.3, exp: 1.0 },
    { m: 'Mar', rev: 1.5, exp: 1.1 },
    { m: 'Apr', rev: 1.4, exp: 1.05 },
    { m: 'May', rev: 1.6, exp: 1.2 },
    { m: 'Jun', rev: 1.7, exp: 1.25 },
    { m: 'Jul', rev: 1.65, exp: 1.2 },
    { m: 'Aug', rev: 1.8, exp: 1.3 },
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
          <div className="page-title">Owner Executive Workspace</div>
          <div className="page-subtitle">
            Multi-entity enterprise dashboard, consolidated cash positions, real-time profitability, and business health
          </div>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline btn-sm" onClick={() => showToast('Owner metrics refreshed')}>
            Refresh
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => showToast('Exporting full board report...', 'info')}>
            Export Full Board Report
          </button>
        </div>
      </div>

      {/* Live Status Bar */}
      <div className="live-status-bar">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span className="live-pulse" />
          <strong>Live Enterprise Feed</strong>
          <span style={{ marginLeft: '8px', color: 'var(--gray-500, #64748b)' }}>
            All general ledger, insurance sub-ledger, and treasury transactions synced in real-time.
          </span>
        </div>
        <div style={{ fontSize: '11px', color: 'var(--gray-500, #64748b)' }}>
          Last reconciled: Today at 11:20 AM
        </div>
      </div>

      {/* 5 KPI Summary Cards Row */}
      <div className="own-kpi-row">
        <div className="own-kpi kpi-cash">
          <div className="own-kpi-top">
            <span className="own-kpi-label">Cash on Hand</span>
            <span className="own-kpi-badge badge-up">↑ +8.4%</span>
          </div>
          <div className="own-kpi-val">$2,845,600</div>
          <div className="own-kpi-note">Unrestricted operating &amp; trust</div>
        </div>

        <div className="own-kpi kpi-ar">
          <div className="own-kpi-top">
            <span className="own-kpi-label">Accounts Receivable</span>
            <span className="own-kpi-badge badge-up">94.2% Current</span>
          </div>
          <div className="own-kpi-val">$1,420,800</div>
          <div className="own-kpi-note">42 open customer accounts</div>
        </div>

        <div className="own-kpi kpi-ap">
          <div className="own-kpi-top">
            <span className="own-kpi-label">Accounts Payable</span>
            <span className="own-kpi-badge badge-warn">5 Due Soon</span>
          </div>
          <div className="own-kpi-val">$842,100</div>
          <div className="own-kpi-note">28 scheduled vendor payments</div>
        </div>

        <div className="own-kpi kpi-profit">
          <div className="own-kpi-top">
            <span className="own-kpi-label">Net Profit YTD</span>
            <span className="own-kpi-badge badge-up">23.4% EBITDA</span>
          </div>
          <div className="own-kpi-val">$3,408,692</div>
          <div className="own-kpi-note">Revenue: $17.8M vs Budget</div>
        </div>

        <div className="own-kpi kpi-trend">
          <div className="own-kpi-top">
            <span className="own-kpi-label">Monthly Growth Rate</span>
            <span className="own-kpi-badge badge-up">+14.8%</span>
          </div>
          <div className="own-kpi-val">+14.8%</div>
          <div className="own-kpi-note">Annualized organic run-rate</div>
        </div>
      </div>

      {/* Multi-Chart Grid: 12-Month Rev vs Exp & Cash Runway */}
      <div className="chart-grid-2col">
        {/* Revenue vs Expenses */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div className="chart-title">12-Month Consolidated Revenue vs. Expenses</div>
            <div className="chart-legend">
              <div className="legend-item"><div className="legend-color" style={{ background: '#2563EB' }} />Revenue</div>
              <div className="legend-item"><div className="legend-color" style={{ background: '#E2E8F0' }} />Expenses</div>
            </div>
          </div>
          <div style={{ height: '180px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', padding: '10px 10px', borderBottom: '1px solid #e2e8f0' }}>
            {MONTHS_12.map((d, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '38px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px' }}>
                  <div style={{ width: '12px', height: `${d.exp * 70}px`, background: '#cbd5e1', borderRadius: '3px 3px 0 0' }} title={`Exp: $${d.exp}M`} />
                  <div style={{ width: '12px', height: `${d.rev * 70}px`, background: '#2563EB', borderRadius: '3px 3px 0 0' }} title={`Rev: $${d.rev}M`} />
                </div>
                <div style={{ fontSize: '10.5px', color: 'var(--gray-500, #64748b)', marginTop: '6px' }}>
                  {d.m}
                </div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--gray-500, #64748b)', marginTop: '8px', textAlign: 'center' }}>
            Strong positive operating margin across all 8 consecutive months in FY 2026.
          </div>
        </div>

        {/* Cash Flow Runway & Liquidity */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div className="chart-title">Cash Runway &amp; Liquidity Forecast</div>
            <span className="badge badge-green">Zero Debt</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '180px', gap: '14px', padding: '0 10px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', fontWeight: 600, marginBottom: '4px' }}>
                <span>30-Day Liquidity Buffer</span>
                <span style={{ color: '#2563EB' }}>$3.12M Projected</span>
              </div>
              <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '85%', height: '100%', background: '#2563EB', borderRadius: '4px' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', fontWeight: 600, marginBottom: '4px' }}>
                <span>60-Day Runway Trajectory</span>
                <span style={{ color: '#10B981' }}>$3.45M Projected</span>
              </div>
              <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '92%', height: '100%', background: '#10B981', borderRadius: '4px' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', fontWeight: 600, marginBottom: '4px' }}>
                <span>90-Day Enterprise Cash Reserve</span>
                <span style={{ color: '#8B5CF6' }}>$3.88M Projected</span>
              </div>
              <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '98%', height: '100%', background: '#8B5CF6', borderRadius: '4px' }} />
              </div>
            </div>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--gray-500, #64748b)', textAlign: 'center' }}>
            Runway coverage: 24+ Months operating expenses without additional financing.
          </div>
        </div>
      </div>

      {/* 3-Column List Grid: Top Debtors, Upcoming Bills, Actuarial Gauges */}
      <div className="chart-grid-3col">
        {/* Top Debtors */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div className="chart-title">Top Receivables / Debtors</div>
            <Link to="/accounts-receivable" className="btn btn-outline btn-sm">View All</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {TOP_CUSTOMERS.map((c, i) => (
              <div key={i} className="cust-row">
                <div className="cust-info">
                  <div className="cust-avatar">{c.initials}</div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{c.name}</div>
                    <div style={{ fontSize: '10px', color: 'var(--gray-400, #94a3b8)' }}>{c.status}</div>
                  </div>
                </div>
                <div style={{ fontWeight: 700 }}>{c.amt}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Bills */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div className="chart-title">Upcoming Payable Obligations</div>
            <Link to="/accounts-payable" className="btn btn-outline btn-sm">View All</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {UPCOMING_BILLS.map((b, i) => (
              <div key={i} className="bills-row">
                <div>
                  <div style={{ fontWeight: 600 }}>{b.vendor}</div>
                  <div style={{ fontSize: '10px', color: '#e65100' }}>{b.due}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700 }}>{b.amt}</div>
                  <span className="badge badge-gray" style={{ fontSize: '9px' }}>{b.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actuarial Metrics Gauges */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div className="chart-title">Actuarial &amp; Risk Health</div>
            <span className="badge badge-green">Solvent</span>
          </div>
          <div className="gauge-strip">
            <div className="gauge-box">
              <div className="gauge-label">Loss Ratio</div>
              <div className="gauge-val" style={{ color: '#e65100' }}>58.4%</div>
              <div className="gauge-status" style={{ color: '#2e7d32' }}>Within Band</div>
            </div>
            <div className="gauge-box">
              <div className="gauge-label">Comb. Ratio</div>
              <div className="gauge-val" style={{ color: '#2e7d32' }}>86.6%</div>
              <div className="gauge-status" style={{ color: '#2e7d32' }}>Underwriting Gain</div>
            </div>
            <div className="gauge-box">
              <div className="gauge-label">Solvency (RBC)</div>
              <div className="gauge-val" style={{ color: '#1565c0' }}>342%</div>
              <div className="gauge-status" style={{ color: '#1565c0' }}>Superior</div>
            </div>
          </div>
          <div style={{ marginTop: '16px', fontSize: '11px', color: 'var(--gray-500, #64748b)', lineHeight: '1.5' }}>
            Insurance underwriting portfolios remain well-capitalized with $10.6M in claims reserves backed by liquid investment trust assets.
          </div>
        </div>
      </div>

      {/* Multi-Entity Performance Matrix Table */}
      <div className="chart-card" style={{ marginBottom: '18px' }}>
        <div className="chart-card-header">
          <div className="chart-title">Consolidated Entity Performance Matrix</div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Legal Entity</th>
              <th>Business Classification</th>
              <th>Gross Revenue</th>
              <th>Operating Expenses</th>
              <th>Net Operating Income</th>
              <th>Operating Margin</th>
            </tr>
          </thead>
          <tbody>
            {ENTITIES.map((e, idx) => (
              <tr key={idx}>
                <td className="font-semibold">{e.name}</td>
                <td><span className="badge badge-navy">{e.type}</span></td>
                <td className="font-semibold">{e.rev}</td>
                <td style={{ color: 'var(--gray-500, #64748b)' }}>{e.exp}</td>
                <td className="font-semibold" style={{ color: '#2e7d32' }}>{e.net}</td>
                <td className="font-semibold" style={{ color: '#2563EB' }}>{e.margin}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
