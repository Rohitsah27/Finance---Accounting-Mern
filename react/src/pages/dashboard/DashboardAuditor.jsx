import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export function DashboardAuditor() {
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const AUDIT_EVENTS = [
    { time: '2026-08-30 14:12:08', user: 'Diego Alvarez (mga@gmail.com)', action: 'Bordereau Transmission', details: 'POL-V8NHT production reported to Southlake Carrier ($33,257.00)', ip: '192.168.1.42', status: 'Verified' },
    { time: '2026-08-28 09:30:15', user: 'Priya Menon (broker@gmail.com)', action: 'AR Cash Receipt Post', details: 'Customer Ayushi payment collected: $39,260.00 into Trust', ip: '192.168.1.88', status: 'Verified' },
    { time: '2026-08-20 16:45:00', user: 'Jordan Blake (admin@veridex.com)', action: 'Policy Binding Event', details: 'Bound POL-V8NHT Commercial Auto liability policy', ip: '10.0.0.12', status: 'Verified' }
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
          <div className="page-title">Internal &amp; NAIC Auditor Workspace</div>
          <div className="page-subtitle">
            Segregation of duties (SoD), immutable audit trail, journal entry change logs, and statutory compliance checks
          </div>
        </div>
        <div className="page-actions">
          <Link to="/audit-trail" className="btn btn-outline btn-sm">Full Audit Trail</Link>
          <button className="btn btn-primary btn-sm" onClick={() => showToast('Audit compliance pack generated')}>
            Export Audit Pack
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '18px' }}>
        <div className="stat-card" style={{ borderTop: '3px solid #2e7d32' }}>
          <div className="stat-info">
            <div className="stat-label">SoD Violations</div>
            <div className="stat-value" style={{ color: '#2e7d32' }}>0 Flags</div>
            <div style={{ fontSize: '11px', color: '#2e7d32', fontWeight: 600 }}>Zero Conflicts</div>
          </div>
        </div>

        <div className="stat-card" style={{ borderTop: '3px solid #1565c0' }}>
          <div className="stat-info">
            <div className="stat-label">Immutable Audit Records</div>
            <div className="stat-value" style={{ color: '#1565c0' }}>4,821</div>
            <div style={{ fontSize: '11px', color: 'var(--color-muted)' }}>100% Cryptographically Chained</div>
          </div>
        </div>

        <div className="stat-card" style={{ borderTop: '3px solid #e65100' }}>
          <div className="stat-info">
            <div className="stat-label">Manual Journal Overrides</div>
            <div className="stat-value" style={{ color: '#e65100' }}>0</div>
            <div style={{ fontSize: '11px', color: '#2e7d32', fontWeight: 600 }}>All Rules-Engine Driven</div>
          </div>
        </div>

        <div className="stat-card" style={{ borderTop: '3px solid #6a1b9a' }}>
          <div className="stat-info">
            <div className="stat-label">NAIC Model Audit Rule (MAR)</div>
            <div className="stat-value" style={{ color: '#6a1b9a' }}>Compliant</div>
            <div style={{ fontSize: '11px', color: '#2e7d32', fontWeight: 600 }}>Internal Controls Certified</div>
          </div>
        </div>
      </div>

      {/* Recent Audit Log Table */}
      <div className="table-wrap">
        <div className="table-head-row">
          <div className="table-head-title">Real-Time Platform Security &amp; Accounting Audit Trail</div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User / Service</th>
              <th>Action Category</th>
              <th>Audit Narrative &amp; Transaction Details</th>
              <th>IP Origin</th>
              <th>Integrity</th>
            </tr>
          </thead>
          <tbody>
            {AUDIT_EVENTS.map((e, idx) => (
              <tr key={idx}>
                <td style={{ fontFamily: 'monospace', fontSize: '11.5px' }}>{e.time}</td>
                <td style={{ fontWeight: 600 }}>{e.user}</td>
                <td><span className="v-badge-config">{e.action}</span></td>
                <td>{e.details}</td>
                <td style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--color-muted)' }}>{e.ip}</td>
                <td><span className="badge badge-green">{e.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
