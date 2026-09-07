import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export function DashboardReinsurer() {
  const { currentUser } = useAuth();
  const [period, setPeriod] = useState('ytd');
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const TREATIES = [
    { id: 'QS-2026-01', name: 'Southlake Commercial Auto Quota Share', cedant: 'Southlake Insurance Co.', type: 'Quota Share (20%)', cededGwp: '$2,964,000', cedingComm: '$592,800', lossRatio: '54.2%' },
    { id: 'XL-2026-02', name: 'Southlake Property Catastrophe Excess', cedant: 'Southlake Insurance Co.', type: 'Excess of Loss ($5M xs $1M)', cededGwp: '$1,420,000', cedingComm: '$142,000', lossRatio: '32.1%' },
    { id: 'FAC-2026-07', name: 'Atlas Petroleum Fleet Facultative', cedant: 'Atlas Specialty Ltd', type: 'Facultative Pro-Rata', cededGwp: '$750,000', cedingComm: '$112,500', lossRatio: '41.0%' }
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
          <div className="page-title">Reinsurer Workspace — Portfolio Dashboard</div>
          <div className="page-subtitle">
            {currentUser?.entityName || 'Starlight Reinsurance Corp'} — Assumed treaty &amp; facultative risk, ceding commission accounting, and retrocession
          </div>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline btn-sm" onClick={() => showToast('Treaty statement pack exported')}>
            Export Treaty Pack
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => showToast('Portfolio revalued', 'info')}>
            Refresh Portfolio
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar" style={{ marginBottom: '18px' }}>
        <span className="filter-bar-label">Accounting Period</span>
        <select className="filter-select" value={period} onChange={(e) => setPeriod(e.target.value)}>
          <option value="ytd">YTD 2026</option>
          <option value="q2">Q2 2026</option>
          <option value="fy2025">FY 2025</option>
        </select>
        <span className="filter-bar-label">Cedant</span>
        <select className="filter-select" defaultValue="all">
          <option value="all">All Ceding Carriers</option>
          <option value="southlake">Southlake Insurance Co.</option>
          <option value="atlas">Atlas Specialty Ltd</option>
        </select>
        <span className="filter-bar-label">Treaty Type</span>
        <select className="filter-select" defaultValue="all">
          <option value="all">Quota Share &amp; Excess of Loss</option>
          <option value="qs">Quota Share</option>
          <option value="xl">Excess of Loss</option>
        </select>
        <div style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--color-muted)' }}>
          Assumed Risk Portfolio Active
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '18px' }}>
        <div className="stat-card" style={{ borderTop: '3px solid #7c3aed' }}>
          <div className="stat-info">
            <div className="stat-label">Assumed Premium (YTD)</div>
            <div className="stat-value" style={{ color: '#7c3aed' }}>$5,134,000</div>
            <div style={{ fontSize: '11px', color: '#2e7d32', fontWeight: 600 }}>↑ +16.5% vs prior year</div>
          </div>
        </div>

        <div className="stat-card" style={{ borderTop: '3px solid #0d1b4b' }}>
          <div className="stat-info">
            <div className="stat-label">Ceding Commission Paid</div>
            <div className="stat-value" style={{ color: 'var(--navy)' }}>$847,300</div>
            <div style={{ fontSize: '11px', color: 'var(--color-muted)' }}>Weighted 16.5%</div>
          </div>
        </div>

        <div className="stat-card" style={{ borderTop: '3px solid #e65100' }}>
          <div className="stat-info">
            <div className="stat-label">Assumed Loss Ratio</div>
            <div className="stat-value" style={{ color: '#e65100' }}>46.2%</div>
            <div style={{ fontSize: '11px', color: '#2e7d32', fontWeight: 600 }}>Underwriting Gain</div>
          </div>
        </div>

        <div className="stat-card" style={{ borderTop: '3px solid #2e7d32' }}>
          <div className="stat-info">
            <div className="stat-label">Unearned Premium Reserve (UPR)</div>
            <div className="stat-value" style={{ color: '#2e7d32' }}>$1,980,400</div>
            <div style={{ fontSize: '11px', color: '#2e7d32', fontWeight: 600 }}>✓ Fully Collateralized</div>
          </div>
        </div>
      </div>

      {/* Treaty Portfolio Table */}
      <div className="table-wrap">
        <div className="table-head-row">
          <div className="table-head-title">In-Force Reinsurance Treaties &amp; Cessions</div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Treaty ID</th>
              <th>Treaty Name</th>
              <th>Ceding Carrier (Cedant)</th>
              <th>Structure</th>
              <th>Assumed GWP</th>
              <th>Ceding Commission</th>
              <th>Loss Ratio</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {TREATIES.map((t) => (
              <tr key={t.id}>
                <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{t.id}</td>
                <td style={{ fontWeight: 600 }}>{t.name}</td>
                <td>{t.cedant}</td>
                <td><span className="v-badge-config">{t.type}</span></td>
                <td style={{ fontWeight: 600 }}>{t.cededGwp}</td>
                <td style={{ color: '#e65100' }}>{t.cedingComm}</td>
                <td style={{ fontWeight: 600, color: '#2e7d32' }}>{t.lossRatio}</td>
                <td><span className="badge badge-green">Active</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
