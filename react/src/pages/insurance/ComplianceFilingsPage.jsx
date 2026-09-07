import React, { useState } from 'react';

export function ComplianceFilingsPage() {
  const [activeTab, setActiveTab] = useState('calendar');
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const FILINGS = [
    { form: 'TX Surplus Lines Tax Return', entity: 'Texas Comptroller', due: '2026-09-15', amount: '$3,503.00', status: 'Pending Filing' },
    { form: 'NAIC Schedule P - Part 1 (Summary)', entity: 'NAIC Financial Registry', due: '2026-09-30', amount: 'N/A', status: 'Validated' },
    { form: 'California SLA Monthly Stamping', entity: 'SLA California', due: '2026-10-01', amount: '$1,240.00', status: 'Draft' },
    { form: 'Form 1099-NEC Producer Statements', entity: 'IRS FIRE System', due: '2027-01-31', amount: '$386,110.00', status: 'Accruing' }
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
          <div className="page-title">Compliance &amp; Statutory Filings</div>
          <div className="page-subtitle">
            Statutory filing calendar, NAIC Schedule P, surplus lines state stamping, and 1099 producer tax reporting
          </div>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline" onClick={() => showToast('Audit Pack generated')}>
            Generate Audit Pack
          </button>
          <button className="btn btn-primary" onClick={() => showToast('New filing modal opened')}>
            + New Filing
          </button>
        </div>
      </div>

      {/* Compliance Score Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0d1b4b, #1a3a6b)',
        borderRadius: '10px',
        padding: '20px 24px',
        marginBottom: '20px',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>Overall Compliance &amp; Regulatory Score</div>
          <div style={{ fontSize: '12.5px', opacity: 0.8 }}>
            Based on on-time filings, validation pass rate, and zero unresolved audit breaks — rolling 12 months
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#4caf50' }}>97%</div>
            <div style={{ fontSize: '11px', opacity: 0.7 }}>Score</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#ffb74d' }}>1</div>
            <div style={{ fontSize: '11px', opacity: 0.7 }}>Action Item</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#4caf50' }}>34</div>
            <div style={{ fontSize: '11px', opacity: 0.7 }}>Filed YTD</div>
          </div>
        </div>
      </div>

      {/* Page Tabs */}
      <div className="page-tabs" style={{ marginBottom: '14px' }}>
        <button className={`page-tab ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => setActiveTab('calendar')}>
          Filing Calendar
        </button>
        <button className={`page-tab ${activeTab === 'state' ? 'active' : ''}`} onClick={() => setActiveTab('state')}>
          State Surplus Lines
        </button>
        <button className={`page-tab ${activeTab === 'naic' ? 'active' : ''}`} onClick={() => setActiveTab('naic')}>
          NAIC Schedule P
        </button>
        <button className={`page-tab ${activeTab === '1099' ? 'active' : ''}`} onClick={() => setActiveTab('1099')}>
          1099-NEC Reporting
        </button>
      </div>

      {/* Filings Table */}
      <div className="table-wrap">
        <div className="table-head-row">
          <div className="table-head-title">Upcoming Statutory Deadlines &amp; Filings</div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Filing / Form Name</th>
              <th>Regulatory Body / Jurisdiction</th>
              <th>Statutory Due Date</th>
              <th>Liability / Tax Amount</th>
              <th>Filing Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {FILINGS.map((f, idx) => (
              <tr key={idx}>
                <td style={{ fontWeight: 600 }}>{f.form}</td>
                <td>{f.entity}</td>
                <td>{f.due}</td>
                <td style={{ fontWeight: 700 }}>{f.amount}</td>
                <td>
                  <span className={`badge ${f.status === 'Validated' ? 'badge-green' : 'badge-orange'}`}>
                    {f.status}
                  </span>
                </td>
                <td>
                  <button className="btn btn-primary btn-sm" style={{ height: '26px', fontSize: '11px', padding: '0 8px' }} onClick={() => showToast(`Prepared ${f.form}`)}>
                    Submit Filing
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
