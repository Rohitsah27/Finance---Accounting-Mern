import React, { useState } from 'react';

export function SubledgerProcessingPage() {
  const [period, setPeriod] = useState('ytd');
  const [selectedSubledger, setSelectedSubledger] = useState('premium');
  const [stateFilter, setStateFilter] = useState('');
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const HEALTH = [
    { name: 'Premium Subledger', val: '$14,820,400', sub: 'Control Acct 1100', status: 'In Balance', color: '#0d1b4b' },
    { name: 'Claims Subledger', val: '$4,120,000', sub: 'Control Acct 2500', status: 'In Balance', color: '#1565c0' },
    { name: 'Reinsurance Subledger', val: '$3,411,708', sub: 'Control Acct 2210', status: 'In Balance', color: '#7c3aed' },
    { name: 'AP Payables', val: '$33,740', sub: 'Control Acct 2001', status: 'In Balance', color: '#e65100' },
    { name: 'AR Receivables', val: '$142,000', sub: 'Control Acct 1100', status: 'In Balance', color: '#00838f' },
    { name: 'MGA Settlement', val: '$29,757', sub: 'Control Acct 1150', status: 'In Balance', color: '#2e7d32' }
  ];

  const TRANSACTIONS = [
    { id: 'SL-PRM-001', date: '2026-08-20', pol: 'POL-V8NHT', insured: 'Ayushi Fleet Logistics', type: 'Gross Written Premium', amount: '$39,260.00', glBatch: 'GLB-2026-0820', status: 'Posted' },
    { id: 'SL-PRM-002', date: '2026-08-25', pol: 'POL-99412', insured: 'Lone Star Logistics', type: 'Endorsement Premium', amount: '$18,400.00', glBatch: 'GLB-2026-0825', status: 'Posted' },
    { id: 'SL-PRM-003', date: '2026-08-28', pol: 'POL-88301', insured: 'Apex Cargo Carriers', type: 'Renewal Binder', amount: '$44,500.00', glBatch: 'GLB-2026-0828', status: 'Posted' }
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
          <div className="page-title">Subledger Processing</div>
          <div className="page-subtitle">
            Six automated insurance subledgers — each tied to the GL via control accounts with daily auto-reconciliation
          </div>
        </div>
        <div className="page-actions">
          <div style={{ display: 'flex', border: '1px solid var(--color-border)', borderRadius: '6px', overflow: 'hidden' }}>
            {['itd', 'ytd', 'mtd'].map((p) => (
              <button
                key={p}
                className={`btn btn-sm ${period === p ? 'btn-primary' : 'btn-ghost'}`}
                style={{ borderRadius: 0, textTransform: 'uppercase', height: '28px', fontSize: '11px' }}
                onClick={() => setPeriod(p)}
              >
                {p}
              </button>
            ))}
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => showToast('Daily reconciliation run: 0 breaks found')}>
            Run Daily Recon
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => showToast('Subledger report generated')}>
            Generate Report
          </button>
        </div>
      </div>

      {/* Subledger Health Cards (6-Grid) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px', marginBottom: '18px' }}>
        {HEALTH.map((h, idx) => (
          <div key={idx} className="stat-card" style={{ borderTop: `3px solid ${h.color}`, padding: '12px' }}>
            <div className="stat-label" style={{ fontSize: '10px' }}>{h.name}</div>
            <div className="stat-value" style={{ fontSize: '16px', margin: '4px 0' }}>{h.val}</div>
            <div style={{ fontSize: '10px', color: 'var(--color-muted)' }}>{h.sub}</div>
            <div style={{ fontSize: '10px', color: '#2e7d32', fontWeight: 700, marginTop: '4px' }}>✓ {h.status}</div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <span className="filter-bar-label">Subledger:</span>
        <select className="filter-select" value={selectedSubledger} onChange={(e) => setSelectedSubledger(e.target.value)}>
          <option value="premium">Premium Subledger</option>
          <option value="claims">Claims Subledger</option>
          <option value="reins">Reinsurance Subledger</option>
          <option value="ap">AP (Payables)</option>
          <option value="ar">AR (Receivables)</option>
          <option value="mga">MGA Settlement Subledger</option>
        </select>
        <span className="filter-bar-label">State:</span>
        <select className="filter-select" value={stateFilter} onChange={(e) => setStateFilter(e.target.value)}>
          <option value="">All States</option>
          <option value="TX">Texas (TX)</option>
          <option value="CA">California (CA)</option>
          <option value="FL">Florida (FL)</option>
        </select>
        <div style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--color-muted)' }}>
          Control Accounts Reconciled
        </div>
      </div>

      {/* Transactions Data Table */}
      <div className="table-wrap">
        <div className="table-head-row">
          <div className="table-head-title">Subledger Journal Batch Entries</div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Subledger ID</th>
              <th>Transaction Date</th>
              <th>Policy Ref</th>
              <th>Insured Account</th>
              <th>Transaction Classification</th>
              <th>Batch Amount</th>
              <th>GL Control Batch</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {TRANSACTIONS.map((t) => (
              <tr key={t.id}>
                <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{t.id}</td>
                <td>{t.date}</td>
                <td><span className="v-badge-config">{t.pol}</span></td>
                <td style={{ fontWeight: 600 }}>{t.insured}</td>
                <td>{t.type}</td>
                <td style={{ fontWeight: 700 }}>{t.amount}</td>
                <td style={{ fontFamily: 'monospace', fontSize: '11px' }}>{t.glBatch}</td>
                <td><span className="badge badge-green">{t.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
