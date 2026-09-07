import React, { useState } from 'react';

const REPORT_CATALOG = [
  { id: 'tb', name: 'Trial Balance', desc: 'Debit/credit balances across all active GL accounts', cat: 'Core Accounting' },
  { id: 'gld', name: 'GL Detail', desc: 'Full transaction-level journal entry posting details', cat: 'Core Accounting' },
  { id: 'prem', name: 'Premium Register', desc: 'Written and invoiced premium by policy, LOB and insured', cat: 'Insurance' },
  { id: 'comm', name: 'Commission Report', desc: 'Broker & producer commissions earned, settled and payable', cat: 'Insurance' },
  { id: 'tax', name: 'Tax Liability Report', desc: 'State surplus lines (4.85%), county surcharges & fees', cat: 'Tax & Compliance' },
  { id: 'ar', name: 'AR Aging', desc: 'Receivables aged into Current, 30, 60, and 90-day buckets', cat: 'Treasury' },
  { id: 'ap', name: 'AP Aging', desc: 'Carrier payables, broker commissions, and vendor liabilities', cat: 'Treasury' },
  { id: 'pnl', name: 'P&L (Income Statement)', desc: 'Gross written premium revenue, commissions, and net margin', cat: 'Financial Statements' },
  { id: 'bs', name: 'Balance Sheet', desc: 'Assets, liabilities (2200/2300/2100) and equity', cat: 'Financial Statements' },
  { id: '1099', name: '1099 Summary', desc: 'Producer commissions & vendor payments subject to 1099-NEC', cat: 'Tax & Compliance' },
  { id: 'lr', name: 'Loss Ratio Report', desc: 'Incurred losses as a % of net earned premium', cat: 'Insurance' },
  { id: 'cr', name: 'Combined Ratio Report', desc: 'Loss ratio plus expense and commission ratio by LOB', cat: 'Insurance' },
  { id: 'rein', name: 'Reinsurance Summary', desc: 'Ceded premium, losses and recoverables by treaty', cat: 'Insurance' },
  { id: 'bank', name: 'Bank Reconciliation Report', desc: 'Operating cash (1001) vs. bank statement reconciliation', cat: 'Treasury' },
  { id: 'cfs', name: 'Cash Flow Statement', desc: 'Operating collections, carrier disbursements & net flow', cat: 'Financial Statements' },
  { id: 'bva', name: 'Budget vs Actual', desc: 'Budgeted vs. actual operating spend with variance %', cat: 'Management' },
  { id: 'exp', name: 'Expense Report', desc: 'Operating and producer commission expense breakdown', cat: 'Core Accounting' },
  { id: 'fa', name: 'Fixed Asset Schedule', desc: 'Asset register with depreciation and net book value', cat: 'Core Accounting' },
  { id: 'inv', name: 'Inventory Costing & Valuation', desc: 'FIFO/WAC valuation schedule and inventory reserves', cat: 'Management' },
  { id: 'proj', name: 'Project Profitability', desc: 'ASC 606 revenue recognition, WIP and labor margin', cat: 'Management' },
];

const AVAILABLE_FIELDS = [
  'Policy Number', 'Effective Date', 'Named Insured', 'Line of Business',
  'Gross Written Premium', 'Carrier Net Payable', 'Agency Commission',
  'Producer Sub-Commission', 'Surplus Lines Tax', 'Stamping Fee',
  'Cash Received', 'Receivable Balance', 'Payment Status'
];

export default function ReportingAnalyticsPage() {
  const [selectedReport, setSelectedReport] = useState(null);
  const [toast, setToast] = useState(null);

  // Custom report builder state
  const [selectedFields, setSelectedFields] = useState(['Policy Number', 'Named Insured', 'Gross Written Premium', 'Agency Commission']);
  const [lobFilter, setLobFilter] = useState('');
  const [groupBy, setGroupBy] = useState('');
  const [customQueryResults, setCustomQueryResults] = useState(null);

  // Dynamic Dashboard Tiles
  const [tiles, setTiles] = useState([
    { id: 1, label: 'Gross Written Premium (MTD)', val: '$3.42M', sub: '+12.4% vs prior month' },
    { id: 2, label: 'Net Commission Retained', val: '$448.2K', sub: '13.1% avg commission' },
    { id: 3, label: 'Loss Ratio (Trailing 12M)', val: '58.4%', sub: 'Target: 62.0%' },
    { id: 4, label: 'Trust Account Balance', val: '$1.86M', sub: 'Fully matched to liabilities' },
  ]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const addField = (f) => {
    if (!selectedFields.includes(f)) {
      setSelectedFields([...selectedFields, f]);
    }
  };

  const removeField = (f) => {
    setSelectedFields(selectedFields.filter(item => item !== f));
  };

  const runCustomReport = () => {
    if (selectedFields.length === 0) {
      showToast('Please select at least one field to run a report');
      return;
    }
    setCustomQueryResults([
      { 'Policy Number': 'POL-TX-2026-001', 'Named Insured': 'Apex Logistics Corp', 'Gross Written Premium': '$24,500', 'Agency Commission': '$3,675', 'Effective Date': '08/01/2026', 'Line of Business': 'Commercial Trucking', 'Cash Received': '$24,500', 'Payment Status': 'Paid' },
      { 'Policy Number': 'POL-TX-2026-002', 'Named Insured': 'Lone Star Hauling', 'Gross Written Premium': '$18,200', 'Agency Commission': '$2,730', 'Effective Date': '08/03/2026', 'Line of Business': 'Commercial Trucking', 'Cash Received': '$9,100', 'Payment Status': 'Partial' },
      { 'Policy Number': 'POL-FL-2026-004', 'Named Insured': 'Gulf Coastal Transport', 'Gross Written Premium': '$32,000', 'Agency Commission': '$4,800', 'Effective Date': '08/07/2026', 'Line of Business': 'Commercial Property', 'Cash Received': '$32,000', 'Payment Status': 'Paid' },
      { 'Policy Number': 'POL-CA-2026-009', 'Named Insured': 'Pacific Freightways', 'Gross Written Premium': '$45,000', 'Agency Commission': '$6,750', 'Effective Date': '08/10/2026', 'Line of Business': 'General Liability', 'Cash Received': '$0', 'Payment Status': 'Unpaid' },
    ]);
    showToast('Custom report generated successfully');
  };

  const removeTile = (id) => {
    setTiles(tiles.filter(t => t.id !== id));
    showToast('Tile removed from executive dashboard');
  };

  const addSampleTile = () => {
    const newId = Date.now();
    setTiles([...tiles, { id: newId, label: 'Unearned Premium Reserve (UPR)', val: '$2.15M', sub: 'Calculated 1/365 daily pro-rata' }]);
    showToast('New metric tile added');
  };

  return (
    <div className="page-container">
      {toast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '10px 16px',
          background: 'var(--navy)',
          color: '#fff',
          borderRadius: '6px',
          zIndex: 9999,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          fontSize: '13px'
        }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Reporting &amp; Analytics</h1>
          <p className="page-subtitle">Report Library &bull; Custom Report Builder &bull; Live Financial &amp; Insurance Analytics</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline" onClick={() => showToast('Scheduled Deliveries: 12 recurring distribution lists active.')}>Scheduled Deliveries</button>
          <button className="btn btn-primary" onClick={() => {
            const el = document.getElementById('report-builder-card');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}>+ New Custom Report</button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon si-navy">📊</div>
          <div className="stat-info">
            <div className="stat-value">20</div>
            <div className="stat-label">Standard &amp; Insurance Reports</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon si-coral">📅</div>
          <div className="stat-info">
            <div className="stat-value">12</div>
            <div className="stat-label">Scheduled Deliveries (Monthly/Qtr)</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon si-green">📁</div>
          <div className="stat-info">
            <div className="stat-value">6</div>
            <div className="stat-label">Saved Custom Templates</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon si-orange">⚡</div>
          <div className="stat-info">
            <div className="stat-value">Excel, CSV, PDF</div>
            <div className="stat-label">Export Formats Supported</div>
          </div>
        </div>
      </div>

      {/* Report Library */}
      <div className="card" style={{ marginBottom: '24px', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>Report Library Catalog</h3>
            <p style={{ fontSize: '12px', color: 'var(--gray-500)', margin: '4px 0 0 0' }}>Click any report to preview live calculated output and export</p>
          </div>
          <span className="badge badge-navy">20 Ready Reports</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
          {REPORT_CATALOG.map((r) => (
            <div
              key={r.id}
              onClick={() => {
                setSelectedReport(r);
                showToast(`Generated preview for ${r.name}`);
              }}
              style={{
                border: '1px solid var(--gray-200)',
                borderRadius: '8px',
                padding: '14px 16px',
                cursor: 'pointer',
                background: selectedReport?.id === r.id ? 'var(--gray-50)' : '#fff',
                borderColor: selectedReport?.id === r.id ? 'var(--navy)' : 'var(--gray-200)',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                <strong style={{ fontSize: '13.5px', color: 'var(--gray-900)' }}>{r.name}</strong>
                <span className="badge badge-gray" style={{ fontSize: '10px' }}>{r.cat}</span>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--gray-500)', margin: 0 }}>{r.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Preview Panel if report selected */}
      {selectedReport && (
        <div className="table-wrap" style={{ marginBottom: '24px' }}>
          <div className="table-head-row">
            <div>
              <div className="table-head-title">Report Preview: {selectedReport.name}</div>
              <div style={{ fontSize: '11.5px', color: 'var(--gray-500)' }}>{selectedReport.desc}</div>
            </div>
            <div className="table-head-actions">
              <button className="btn btn-outline btn-sm" onClick={() => showToast('Exported to CSV.')}>⬇ Export CSV</button>
              <button className="btn btn-primary btn-sm" onClick={() => showToast('Print dialog triggered.')}>🖨️ Print / PDF</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedReport(null)}>✕ Close</button>
            </div>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Account / Item</th>
                <th>Category</th>
                <th className="text-right">Period Balance</th>
                <th className="text-right">YTD Total</th>
                <th>Verification</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-semibold">1001 Operating Checking Account</td>
                <td>Asset - Cash</td>
                <td className="text-right font-mono">$1,842,900.00</td>
                <td className="text-right font-mono">$14,250,000.00</td>
                <td><span className="badge badge-green">Reconciled</span></td>
              </tr>
              <tr>
                <td className="font-semibold">1050 Premium Fiduciary Trust</td>
                <td>Restricted Cash</td>
                <td className="text-right font-mono">$2,410,500.00</td>
                <td className="text-right font-mono">$22,640,000.00</td>
                <td><span className="badge badge-green">Matched</span></td>
              </tr>
              <tr>
                <td className="font-semibold">2200 Carrier Premium Payable</td>
                <td>Insurance Liability</td>
                <td className="text-right font-mono">$1,985,000.00</td>
                <td className="text-right font-mono">$18,400,000.00</td>
                <td><span className="badge badge-blue">Pending Remittance</span></td>
              </tr>
              <tr>
                <td className="font-semibold">4000 Gross Written Premium Revenue</td>
                <td>Operating Revenue</td>
                <td className="text-right font-mono">$3,420,000.00</td>
                <td className="text-right font-mono">$38,900,000.00</td>
                <td><span className="badge badge-navy">Certified</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Custom Report Builder */}
      <div className="card" id="report-builder-card" style={{ marginBottom: '24px', padding: '20px' }}>
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>Custom Report Builder</h3>
          <p style={{ fontSize: '12px', color: 'var(--gray-500)', margin: '4px 0 0 0' }}>
            Select dimensions, metrics, and filter criteria to build bespoke on-demand reports
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gray-500)', marginBottom: '8px' }}>
              Available Fields &amp; Metrics
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '240px', overflowY: 'auto' }}>
              {AVAILABLE_FIELDS.map((f) => {
                const added = selectedFields.includes(f);
                return (
                  <div
                    key={f}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      background: 'var(--gray-50)',
                      border: '1px solid var(--gray-200)',
                      borderRadius: '6px',
                      fontSize: '12.5px',
                      opacity: added ? 0.5 : 1
                    }}
                  >
                    <span>{f}</span>
                    <button
                      className="btn btn-outline btn-sm"
                      disabled={added}
                      onClick={() => addField(f)}
                      style={{ padding: '2px 8px', fontSize: '12px' }}
                    >
                      + Add
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gray-500)', marginBottom: '8px' }}>
              Selected Columns in Output ({selectedFields.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '240px', overflowY: 'auto' }}>
              {selectedFields.map((f) => (
                <div
                  key={f}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    background: 'rgba(16, 42, 46, 0.05)',
                    border: '1px solid var(--navy)',
                    borderRadius: '6px',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    color: 'var(--navy)'
                  }}
                >
                  <span>{f}</span>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => removeField(f)}
                    style={{ color: 'var(--red)', padding: '2px 6px', fontSize: '12px' }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Filter / Group controls */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '220px' }}>
            <label className="field-label">Filter by Line of Business</label>
            <select className="field-input" value={lobFilter} onChange={(e) => setLobFilter(e.target.value)}>
              <option value="">All Lines of Business</option>
              <option value="Commercial Trucking">Commercial Trucking</option>
              <option value="General Liability">General Liability</option>
              <option value="Commercial Property">Commercial Property</option>
            </select>
          </div>
          <div style={{ flex: 1, minWidth: '220px' }}>
            <label className="field-label">Group By Dimension</label>
            <select className="field-input" value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
              <option value="">No Grouping (Flat Detail)</option>
              <option value="Policy Number">Policy Number</option>
              <option value="Named Insured">Named Insured</option>
              <option value="Producer">Producer / Broker</option>
              <option value="Account">General Ledger Account</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-primary" onClick={runCustomReport}>⚡ Run Custom Report</button>
          <button className="btn btn-outline" onClick={() => showToast('Query configuration saved as reusable template.')}>💾 Save as Template</button>
          <button className="btn btn-outline" onClick={() => showToast('Configured automated weekly dispatch.')}>📅 Schedule Delivery</button>
        </div>

        {/* Custom query table output */}
        {customQueryResults && (
          <div className="table-wrap" style={{ marginTop: '20px' }}>
            <div className="table-head-row">
              <div className="table-head-title">Custom Query Output ({customQueryResults.length} records)</div>
              <div className="table-head-actions">
                <button className="btn btn-outline btn-sm" onClick={() => showToast('CSV Exported')}>Export CSV</button>
              </div>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  {selectedFields.map(f => <th key={f}>{f}</th>)}
                </tr>
              </thead>
              <tbody>
                {customQueryResults.map((row, idx) => (
                  <tr key={idx}>
                    {selectedFields.map(f => (
                      <td key={f} className={f.includes('Premium') || f.includes('Commission') || f.includes('Cash') ? 'font-mono text-right' : ''}>
                        {row[f] || '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Executive Dashboard Builder */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>Executive Dashboard KPI Builder</h3>
            <p style={{ fontSize: '12px', color: 'var(--gray-500)', margin: '4px 0 0 0' }}>Dynamic cards calculated live from General Ledger &amp; Subledgers</p>
          </div>
          <button className="btn btn-outline btn-sm" onClick={addSampleTile}>+ Add Metric Tile</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px' }}>
          {tiles.map((t) => (
            <div
              key={t.id}
              style={{
                background: '#fff',
                border: '1px solid var(--gray-200)',
                borderTop: '3px solid var(--navy)',
                borderRadius: '8px',
                padding: '16px',
                position: 'relative'
              }}
            >
              <button
                onClick={() => removeTile(t.id)}
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--gray-400)',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                ✕
              </button>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gray-500)', marginBottom: '6px' }}>
                {t.label}
              </div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--gray-900)', fontFamily: 'var(--font-mono)' }}>
                {t.val}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--gray-500)', marginTop: '4px' }}>
                {t.sub}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
