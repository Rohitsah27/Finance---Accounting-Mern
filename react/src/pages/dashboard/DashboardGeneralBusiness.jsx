import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';

export function DashboardGeneralBusiness() {
  const { currentUser } = useAuth();
  const { policy, lifecycleStage, executeStageAction } = useFinance();
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const COIS = [
    { certId: 'COI-2026-081', holder: 'Walmart Freight Distribution', coverage: '$1,000,000 Auto Liability', exp: '2027-08-20', status: 'Active' },
    { certId: 'COI-2026-082', holder: 'Amazon Logistics TX Hub', coverage: '$1,000,000 Auto Liability', exp: '2027-08-20', status: 'Active' },
    { certId: 'COI-2026-083', holder: 'Target Supply Chain LLC', coverage: '$100,000 Cargo Liability', exp: '2027-08-20', status: 'Active' }
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
          <div className="page-title">Commercial Policyholder &amp; Business Workspace</div>
          <div className="page-subtitle">
            {currentUser?.entityName || 'Ayushi Fleet Logistics Corp'} — Fleet insurance expense center, premium invoice settlements, and Certificates of Insurance (COI)
          </div>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline btn-sm" onClick={() => showToast('Certificates of Insurance exported (PDF)')}>
            Download All COIs
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => showToast('Expense ledger synchronized', 'info')}>
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '18px' }}>
        <div className="stat-card" style={{ borderTop: '3px solid #8b5cf6' }}>
          <div className="stat-info">
            <div className="stat-label">Total Commercial Premium</div>
            <div className="stat-value" style={{ color: '#8b5cf6' }}>$39,260.00</div>
            <div style={{ fontSize: '11px', color: 'var(--color-muted)' }}>Commercial Trucking LOB</div>
          </div>
        </div>

        <div className="stat-card" style={{ borderTop: '3px solid #2e7d32' }}>
          <div className="stat-info">
            <div className="stat-label">Invoice Payment Status</div>
            <div className="stat-value" style={{ color: '#2e7d32' }}>{lifecycleStage >= 2 ? 'Paid in Full' : 'Due Upon Receipt'}</div>
            <div style={{ fontSize: '11px', color: '#2e7d32', fontWeight: 600 }}>
              {lifecycleStage >= 2 ? 'Settled via ACH Deposit' : 'Due: $39,260.00'}
            </div>
          </div>
        </div>

        <div className="stat-card" style={{ borderTop: '3px solid #1565c0' }}>
          <div className="stat-info">
            <div className="stat-label">Active Fleet Vehicles</div>
            <div className="stat-value" style={{ color: '#1565c0' }}>24 Units</div>
            <div style={{ fontSize: '11px', color: '#2e7d32', fontWeight: 600 }}>100% Insured Coverage</div>
          </div>
        </div>

        <div className="stat-card" style={{ borderTop: '3px solid #0d1b4b' }}>
          <div className="stat-info">
            <div className="stat-label">Active COIs Issued</div>
            <div className="stat-value" style={{ color: 'var(--navy)' }}>3 Certificates</div>
            <div style={{ fontSize: '11px', color: 'var(--color-muted)' }}>Shippers Verified</div>
          </div>
        </div>
      </div>

      {/* Policy Details & Payment Action */}
      <div className="card" style={{ marginBottom: '18px', border: '1.5px solid var(--color-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-ink)' }}>
              Primary Commercial Auto Policy: POL-V8NHT
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '4px' }}>
              Broker: <strong>HIT Agency Group</strong> · Underwriter: <strong>Southlake Insurance Co.</strong> · Period: 2026-08-20 to 2027-08-20
            </div>
          </div>
          <div>
            {lifecycleStage === 1 && (
              <button
                className="btn btn-primary"
                onClick={() => {
                  executeStageAction(2);
                  showToast('Premium payment $39,260.00 paid to Retail Broker (HIT)!');
                }}
              >
                Pay Premium Invoice ($39,260.00) →
              </button>
            )}
            {lifecycleStage >= 2 && (
              <span className="badge badge-green" style={{ fontSize: '12.5px', padding: '6px 14px' }}>
                ✓ Premium Paid in Full
              </span>
            )}
          </div>
        </div>
      </div>

      {/* COI List Table */}
      <div className="table-wrap">
        <div className="table-head-row">
          <div className="table-head-title">Shipper Certificates of Insurance (COI) Register</div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Certificate ID</th>
              <th>Certificate Holder (Shipper / Broker)</th>
              <th>Coverage Level</th>
              <th>Expiration Date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {COIS.map((c) => (
              <tr key={c.certId}>
                <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{c.certId}</td>
                <td style={{ fontWeight: 600 }}>{c.holder}</td>
                <td>{c.coverage}</td>
                <td>{c.exp}</td>
                <td><span className="badge badge-green">{c.status}</span></td>
                <td>
                  <button className="btn btn-ghost btn-sm" onClick={() => showToast(`Downloaded ${c.certId}`)}>
                    Download PDF
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
