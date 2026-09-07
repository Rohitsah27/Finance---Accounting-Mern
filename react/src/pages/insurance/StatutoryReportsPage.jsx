import React, { useState } from 'react';

const NAIC_SCHEDULES = [
  { code: 'Schedule P (Parts 1-4)', name: 'Loss & LAE Development Triangles', lines: 'Commercial Auto Liability, Physical Damage, Cargo', status: 'Generated (100%)', due: '2027-03-01' },
  { code: 'Schedule F (Parts 1-8)', name: 'Reinsurance Ceded & Recoverables Aging', lines: 'Quota Share, XOL Layers, Authorized Reinsurers', status: 'Generated (100%)', due: '2027-03-01' },
  { code: 'Schedule T', name: 'Premiums Written & Allocated by State', lines: 'Texas, Florida, California, Georgia', status: 'Ready for Review', due: '2027-03-01' },
  { code: 'Schedule D', name: 'Invested Assets & High-Grade Bonds', lines: 'US Treasuries, Investment Grade Municipal Bonds', status: 'Audited', due: '2027-03-01' }
];

export function StatutoryReportsPage() {
  const [activeTab, setActiveTab] = useState('naic');
  const [accountingStd, setAccountingStd] = useState('SAP');
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div>
      {toastMessage && (
        <div className={`veridex-toast veridex-toast-${toastMessage.type}`}>
          <span>{toastMessage.type === 'error' ? '✕' : '✓'}</span>
          <span>{toastMessage.msg}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '16px' }}>
        <div>
          <div className="page-title">Statutory Reports — Filings</div>
          <div className="page-subtitle">
            NAIC Annual Statement (Yellow Book) &middot; SAP Solvency &middot; Schedule P Triangles &middot; State Stamping Returns
          </div>
        </div>
        <div className="page-actions">
          <div className="sr-std-toggle" style={{ display: 'flex', gap: '6px' }}>
            {['SAP', 'GAAP'].map(std => (
              <button
                key={std}
                type="button"
                className={`sr-std-btn ${accountingStd === std ? 'active' : ''}`}
                onClick={() => setAccountingStd(std)}
                style={{
                  padding: '5px 14px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  border: '1.5px solid var(--color-border)',
                  borderRadius: '6px',
                  background: accountingStd === std ? 'var(--color-brand)' : '#fff',
                  color: accountingStd === std ? '#fff' : 'var(--color-muted)',
                  cursor: 'pointer'
                }}
              >
                {std} Standard
              </button>
            ))}
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => showToast('Exporting Statutory Yellow Book Pack...')}>
            Export NAIC Pack
          </button>
        </div>
      </div>

      {/* Stats Row matching statutory-reports.html */}
      <div className="sr-stats" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '14px',
        marginBottom: '20px'
      }}>
        <div className="sr-stat c-navy" style={{ background: '#fff', border: '1.5px solid var(--color-border)', borderRadius: '10px', padding: '15px 18px', borderTop: '3px solid #0d1b4b' }}>
          <div style={{ fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.4px', color: 'var(--color-muted)' }}>
            Net Admitted Assets
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-ink)', margin: '4px 0 2px' }}>
            $1,870,600.00
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-muted)' }}>Excludes non-admitted furniture &amp; fixtures</div>
        </div>

        <div className="sr-stat c-green" style={{ background: '#fff', border: '1.5px solid var(--color-border)', borderRadius: '10px', padding: '15px 18px', borderTop: '3px solid #2e7d32' }}>
          <div style={{ fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.4px', color: 'var(--color-muted)' }}>
            Policyholders' Surplus
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#2e7d32', margin: '4px 0 2px' }}>
            $1,833,840.00
          </div>
          <div style={{ fontSize: '11px', color: '#2e7d32' }}>SAP Capital &amp; Retained Surplus</div>
        </div>

        <div className="sr-stat c-blue" style={{ background: '#fff', border: '1.5px solid var(--color-border)', borderRadius: '10px', padding: '15px 18px', borderTop: '3px solid #1565c0' }}>
          <div style={{ fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.4px', color: 'var(--color-muted)' }}>
            RBC Solvency Ratio
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#1565c0', margin: '4px 0 2px' }}>
            412.5%
          </div>
          <div style={{ fontSize: '11px', color: '#1565c0' }}>Well above 200% Company Action Level</div>
        </div>

        <div className="sr-stat c-coral" style={{ background: '#fff', border: '1.5px solid var(--color-border)', borderRadius: '10px', padding: '15px 18px', borderTop: '3px solid #f97316' }}>
          <div style={{ fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.4px', color: 'var(--color-muted)' }}>
            Upcoming Filings
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-ink)', margin: '4px 0 2px' }}>
            3
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-muted)' }}>Texas Q3 Quarterly due in 45 days</div>
        </div>
      </div>

      {/* Tabs Strip matching statutory-reports.html */}
      <div className="sr-tabs" style={{ display: 'flex', background: '#fff', border: '1.5px solid var(--color-border)', borderRadius: '10px', overflow: 'hidden', marginBottom: '20px' }}>
        {[
          { id: 'naic', label: 'NAIC Yellow Book Schedules' },
          { id: 'statements', label: 'Statutory Statements (SAP)' },
          { id: 'tax', label: 'State Tax & Stamping Filings' },
          { id: 'calendar', label: 'Regulatory Filing Calendar' }
        ].map(t => (
          <button
            key={t.id}
            type="button"
            className={`sr-tab ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
            style={{
              flex: 1,
              padding: '11px 14px',
              fontSize: '12.5px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              background: activeTab === t.id ? 'var(--color-brand)' : '#fff',
              color: activeTab === t.id ? '#fff' : 'var(--color-muted)',
              borderRight: '1px solid var(--color-border)'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab 1: NAIC Yellow Book Schedules */}
      {activeTab === 'naic' && (
        <div className="sr-panel" style={{ background: '#fff', border: '1.5px solid var(--color-border)', borderRadius: '10px', overflow: 'hidden' }}>
          <div className="sr-panel-hdr" style={{ padding: '13px 18px', background: '#f8f9fb', borderBottom: '1.5px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="sr-panel-title" style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--color-ink)' }}>
              Official NAIC Annual Statement Filing Packages (P&amp;C Yellow Book)
            </div>
            <span className="v-badge-config">NAIC Standard Co. Code: 89410</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', padding: '18px' }}>
            {NAIC_SCHEDULES.map(sc => (
              <div key={sc.code} className="card" style={{ padding: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-muted)' }}>
                  {sc.code}
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-ink)', margin: '4px 0 6px' }}>
                  {sc.name}
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--color-ink-secondary)', marginBottom: '12px' }}>
                  {sc.lines}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border)', paddingTop: '10px' }}>
                  <span className="badge badge-green">{sc.status}</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => showToast(`Generating ${sc.code} drilldown view...`)}
                    >
                      Inspect
                    </button>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => showToast(`Downloaded ${sc.code} official CSV export.`)}
                    >
                      Download
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: SAP Statutory Statements */}
      {activeTab === 'statements' && (
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 12px', color: 'var(--color-ink)' }}>
            Underwriting &amp; Investment Exhibit (SAP Statement of Income)
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--color-ink-secondary)', lineHeight: 1.6 }}>
            Statutory Accounting Principles (SAP) require direct expensing of acquisition costs, unearned premium reserve calculations under daily pro-rata rules, and strict admissibility tests on receivables over 90 days past due.
          </p>
        </div>
      )}

      {/* Tab 3: State Tax & Stamping Filings */}
      {activeTab === 'tax' && (
        <div className="table-wrap">
          <div className="table-head-row">
            <div className="table-head-title">State Surplus Lines Tax &amp; Stamping Returns</div>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Jurisdiction</th>
                <th>Filing Authority</th>
                <th style={{ textAlign: 'right' }}>Taxable Premium ($)</th>
                <th style={{ textAlign: 'center' }}>Tax Rate</th>
                <th style={{ textAlign: 'right' }}>Tax Amount ($)</th>
                <th style={{ textAlign: 'center' }}>Filing Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Texas (TX)</strong></td>
                <td>Texas Department of Insurance / SLTX</td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>$36,760.00</td>
                <td style={{ textAlign: 'center' }}>4.85% + 0.04%</td>
                <td style={{ textAlign: 'right', fontWeight: 700, color: '#B91C1C' }}>$1,797.56</td>
                <td style={{ textAlign: 'center' }}><span className="badge badge-green">Filed / Remitted</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 4: Calendar */}
      {activeTab === 'calendar' && (
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-ink)', marginBottom: '12px' }}>
            2026 NAIC &amp; State Insurance Commissioner Filing Deadlines
          </div>
          <ul style={{ fontSize: '13px', color: 'var(--color-ink-secondary)', lineHeight: 1.8, paddingLeft: '20px' }}>
            <li><strong>November 15, 2026:</strong> Q3 Statutory Quarterly Statement (Form 10-Q equivalent)</li>
            <li><strong>March 1, 2027:</strong> Annual Statement (Yellow Book - Complete Schedules A-T)</li>
            <li><strong>April 1, 2027:</strong> NAIC Risk-Based Capital (RBC) Report</li>
          </ul>
        </div>
      )}
    </div>
  );
}
