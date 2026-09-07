import React, { useState } from 'react';
import './statutory-reports.css';

const NAIC_SCHEDULES = [
  { code: 'Schedule P (Parts 1-4)', name: 'Loss & LAE Development Triangles', lines: 'Commercial Auto Liability, Physical Damage, Cargo', status: 'Generated (100%)', due: '2027-03-01' },
  { code: 'Schedule F (Parts 1-8)', name: 'Reinsurance Ceded & Recoverables Aging', lines: 'Quota Share, XOL Layers, Authorized Reinsurers', status: 'Generated (100%)', due: '2027-03-01' },
  { code: 'Schedule T', name: 'Premiums Written & Allocated by State', lines: 'Texas, Florida, California, Georgia', status: 'Ready for Review', due: '2027-03-01' },
  { code: 'Schedule D', name: 'Invested Assets & High-Grade Bonds', lines: 'US Treasuries, Investment Grade Municipal Bonds', status: 'Audited', due: '2027-03-01' }
];

// The SAP/GAAP toggle used to just re-color the active button — nothing on
// the page actually changed when you clicked it. SAP and GAAP genuinely
// report different things here (admitted-asset/RBC solvency measures only
// exist under SAP), and this app doesn't maintain a separate GAAP-basis
// ledger, so GAAP mode says so honestly instead of inventing GAAP figures.
const STAT_CARDS = {
  SAP: [
    { key: 'assets', color: 'c-navy', label: 'Net Admitted Assets', value: '$1,870,600.00', note: 'Excludes non-admitted furniture & fixtures' },
    { key: 'surplus', color: 'c-green', label: "Policyholders' Surplus", value: '$1,833,840.00', note: 'SAP Capital & Retained Surplus' },
    { key: 'rbc', color: 'c-blue', label: 'RBC Solvency Ratio', value: '412.5%', note: 'Well above 200% Company Action Level' },
    { key: 'filings', color: 'c-coral', label: 'Upcoming Filings', value: '3', note: 'Texas Q3 Quarterly due in 45 days' }
  ],
  GAAP: [
    { key: 'assets', color: 'c-navy', label: 'Total Assets (GAAP)', value: '—', note: 'GAAP-basis total assets are not tracked separately from the SAP ledger yet' },
    { key: 'surplus', color: 'c-green', label: "Total Stockholders' Equity (GAAP)", value: '—', note: 'GAAP-basis equity is not tracked separately from SAP surplus yet' },
    { key: 'rbc', color: 'c-blue', label: 'RBC Solvency Ratio', value: 'N/A', note: 'Risk-Based Capital is a statutory (SAP) measure — no GAAP equivalent applies' },
    { key: 'filings', color: 'c-coral', label: 'Upcoming Filings', value: '3', note: 'Texas Q3 Quarterly due in 45 days' }
  ]
};

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
          <div className="sr-std-toggle">
            {['SAP', 'GAAP'].map(std => (
              <button
                key={std}
                type="button"
                className={`sr-std-btn ${accountingStd === std ? 'active' : ''}`}
                onClick={() => setAccountingStd(std)}
              >
                {std} Standard
              </button>
            ))}
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => showToast(`Exporting Statutory Yellow Book Pack (${accountingStd} basis)...`)}>
            Export NAIC Pack
          </button>
        </div>
      </div>

      {/* Stats Row matching statutory-reports.html — content swaps with the SAP/GAAP toggle above */}
      <div className="sr-stats">
        {STAT_CARDS[accountingStd].map(stat => (
          <div key={stat.key} className={`sr-stat ${stat.color}`}>
            <div className="sr-stat-label">{stat.label}</div>
            <div className="sr-stat-value">{stat.value}</div>
            <div className="sr-stat-note">{stat.note}</div>
          </div>
        ))}
      </div>

      {/* Tabs Strip matching statutory-reports.html */}
      <div className="sr-tabs">
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
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab 1: NAIC Yellow Book Schedules */}
      {activeTab === 'naic' && (
        <div className="sr-panel">
          <div className="sr-panel-hdr">
            <div className="sr-panel-title">
              Official NAIC Annual Statement Filing Packages (P&amp;C Yellow Book)
            </div>
            <span className="v-badge-config">NAIC Standard Co. Code: 89410</span>
          </div>

          <div className="sr-schedule-grid">
            {NAIC_SCHEDULES.map(sc => (
              <div key={sc.code} className="card sr-schedule-card">
                <div className="sr-sched-code">{sc.code}</div>
                <div className="sr-sched-name">{sc.name}</div>
                <div className="sr-sched-lines">{sc.lines}</div>
                <div className="sr-schedule-actions">
                  <span className="badge badge-green">{sc.status}</span>
                  <div className="sr-sched-btns">
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
