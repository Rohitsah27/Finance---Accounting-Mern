import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import './tax-engine.css';

const INITIAL_NEXUS = [
  { state: 'Texas', jurisdiction: 'Texas Department of Insurance / SLTX', status: 'Registered', date: '2021-11-02' },
  { state: 'California', jurisdiction: 'California Surplus Line Association (SLA)', status: 'Registered', date: '2022-04-15' },
  { state: 'Florida', jurisdiction: 'Florida Surplus Lines Service Office (FSLSO)', status: 'Registered', date: '2023-01-10' },
  { state: 'New York', jurisdiction: 'Excess Line Association of New York (ELANY)', status: 'Pending Registration', date: '2026-08-01' }
];

const INITIAL_RATES = [
  { jurisdiction: 'Texas (Statewide)', type: 'Surplus Lines Tax', percent: 4.850, effective: '2026-08-20', notes: 'Policy POL-V8NHT (Ayushi Commercial Trucking · $1,590.00 tax)', status: 'Active' },
  { jurisdiction: 'Texas - Denton County', type: 'County Surcharge', percent: 0.550, effective: '2026-08-20', notes: 'Denton County local transit surcharge ($180.00)', status: 'Active' },
  { jurisdiction: 'Texas (SLTX)', type: 'Stamping Office Fee', percent: 0.075, effective: '2026-08-20', notes: 'Surplus Lines Stamping Office of Texas fee', status: 'Active' },
  { jurisdiction: 'California', type: 'Surplus Lines Tax', percent: 3.000, effective: '2026-01-01', notes: 'California SLA statutory rate', status: 'Active' },
  { jurisdiction: 'Florida', type: 'Surplus Lines Tax', percent: 5.000, effective: '2026-01-01', notes: 'Florida FSLSO regulatory rate', status: 'Active' }
];

const INITIAL_CERTS = [
  { customer: 'Ayushi', certNo: 'EX-TX-84920', state: 'Texas', expiry: '2027-08-20', status: 'Verified Active' },
  { customer: 'Harborview Medical Group', certNo: 'EX-501C3-9912', state: 'Texas', expiry: '2028-12-31', status: 'Verified Active' },
  { customer: 'Meridian Logistics LLC', certNo: 'EX-ICC-44910', state: 'Texas', expiry: '2026-11-15', status: 'Renewal Pending' }
];

const INITIAL_1099 = [
  { name: 'HIT (Insurance Agency / Broker)', type: '1099-NEC (Broker Commission)', ytd: 2500.00, w9: 'Verified On File', tin: 'XX-XXX4910', tinMatch: 'Matched', date: '2026-08-20' },
  { name: 'Coastal Risk Advisors', type: '1099-NEC (Agent Commission)', ytd: 2763.00, w9: 'Verified On File', tin: 'XX-XXX8821', tinMatch: 'Matched', date: '2026-08-03' },
  { name: 'Alvarez Inspection Services', type: '1099-MISC (Vendor Loss Control)', ytd: 1450.00, w9: 'Verified On File', tin: 'XX-XXX2201', tinMatch: 'Matched', date: '2026-07-15' },
  { name: 'Apex Independent Adjusters', type: '1099-MISC (Claims Adjustment)', ytd: 3800.00, w9: 'Verified On File', tin: 'XX-XXX9312', tinMatch: 'Matched', date: '2026-06-28' }
];

const INITIAL_LIABILITIES = [
  { id: 'liab-1', type: 'Texas Surplus Lines Tax (4.85%)', state: 'Texas', ref: 'POL-V8NHT (Ayushi)', taxable: 32257.00, amount: 1590.00, due: '2026-09-20', status: 'Due Soon' },
  { id: 'liab-2', type: 'Denton County Tax (0.55%)', state: 'Texas', ref: 'POL-V8NHT (Ayushi)', taxable: 32257.00, amount: 180.00, due: '2026-09-20', status: 'Due Soon' },
  { id: 'liab-3', type: 'California SLA Premium Tax (3.0%)', state: 'California', ref: 'POL-2026-0428 (Harborview)', taxable: 18420.00, amount: 552.60, due: '2026-09-20', status: 'Ready for Filing' }
];

export function TaxEnginePage() {
  const [mainTab, setMainTab] = useState('salesuse');
  const [salesSubTab, setSalesSubTab] = useState('sales-nexus');
  const [paySubTab, setPaySubTab] = useState('pay-summary');
  const [ten99SubTab, setTen99SubTab] = useState('ten99-thresh');

  const [nexusList, setNexusList] = useState(() => {
    try {
      const saved = localStorage.getItem('v_tax_nexus');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_NEXUS;
  });

  const [ratesList, setRatesList] = useState(() => {
    try {
      const saved = localStorage.getItem('v_tax_rates');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_RATES;
  });

  const [certsList, setCertsList] = useState(() => {
    try {
      const saved = localStorage.getItem('v_tax_certs');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_CERTS;
  });

  const [liabilitiesList, setLiabilitiesList] = useState(() => {
    try {
      const saved = localStorage.getItem('v_tax_liabilities');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_LIABILITIES;
  });

  const [nexusFilter, setNexusFilter] = useState('');
  const [liabilityFilter, setLiabilityFilter] = useState('');
  const [zipInput, setZipInput] = useState('75201-1234');
  const [lookupResult, setLookupResult] = useState(true);

  const [isAddRateOpen, setIsAddRateOpen] = useState(false);
  const [newRateJurisdiction, setNewRateJurisdiction] = useState('');
  const [newRateType, setNewRateType] = useState('Surplus Lines Tax');
  const [newRatePercent, setNewRatePercent] = useState('');
  const [newRateEffective, setNewRateEffective] = useState('2026-08-20');
  const [newRateNotes, setNewRateNotes] = useState('');

  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    try {
      localStorage.setItem('v_tax_nexus', JSON.stringify(nexusList));
      localStorage.setItem('v_tax_rates', JSON.stringify(ratesList));
      localStorage.setItem('v_tax_certs', JSON.stringify(certsList));
      localStorage.setItem('v_tax_liabilities', JSON.stringify(liabilitiesList));
    } catch (e) {}
  }, [nexusList, ratesList, certsList, liabilitiesList]);

  const totalLiability = useMemo(() => {
    return liabilitiesList.reduce((sum, l) => sum + (parseFloat(l.amount) || 0), 0);
  }, [liabilitiesList]);

  const handleLookupRate = () => {
    setLookupResult(true);
    showToast(`Calculated rates for ${zipInput}: 5.40% Combined`, 'success');
  };

  const handlePrefillRate = (jurisdiction, pct) => {
    setIsAddRateOpen(true);
    setNewRateJurisdiction(jurisdiction);
    setNewRatePercent(pct.toString());
    setNewRateNotes('Pre-filled from rate engine ZIP lookup');
  };

  const handleSaveTaxRate = () => {
    if (!newRateJurisdiction || !newRatePercent) {
      showToast('Please enter a jurisdiction and percentage rate', 'warning');
      return;
    }

    const rateObj = {
      jurisdiction: newRateJurisdiction,
      type: newRateType,
      percent: parseFloat(newRatePercent),
      effective: newRateEffective,
      notes: newRateNotes || 'Configured via Tax Engine',
      status: 'Active'
    };

    setRatesList([rateObj, ...ratesList]);
    setIsAddRateOpen(false);
    setNewRateJurisdiction('');
    setNewRatePercent('');
    setNewRateNotes('');
    showToast(`Tax rate for ${rateObj.jurisdiction} added!`, 'success');
  };

  const handleRemitTax = (id, type, amount) => {
    setLiabilitiesList(prev => prev.map(l => l.id === id ? { ...l, status: 'Paid / Remitted' } : l));
    showToast(`Remitted $${amount.toFixed(2)} for ${type}`, 'success');
  };

  const filteredNexus = useMemo(() => {
    if (!nexusFilter) return nexusList;
    const q = nexusFilter.toLowerCase();
    return nexusList.filter(n => n.state.toLowerCase().includes(q) || n.jurisdiction.toLowerCase().includes(q));
  }, [nexusList, nexusFilter]);

  const filteredLiabilities = useMemo(() => {
    if (!liabilityFilter) return liabilitiesList;
    const q = liabilityFilter.toLowerCase();
    return liabilitiesList.filter(l => l.status.toLowerCase().includes(q) || l.state.toLowerCase().includes(q) || l.type.toLowerCase().includes(q));
  }, [liabilitiesList, liabilityFilter]);

  return (
    <>
      {toast && (
        <div className={`veridex-toast veridex-toast-${toast.type}`}>
          <span>{toast.type === 'error' ? '✕' : toast.type === 'warning' ? '⚠️' : '✓'}</span>
          <span>{toast.msg}</span>
        </div>
      )}

      {/* ═══ PAGE HEADER ═══ */}
      <div className="page-header">
        <div>
          <div className="page-title">Tax Engine</div>
          <div className="page-subtitle">
            Insurance premium taxes, state surplus stamping fees, sales &amp; use, 1099 compliance, and consolidated liabilities
          </div>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline btn-sm" onClick={() => showToast('Exported tax workbook to CSV.', 'success')}>
            Export Workbook
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => showToast('Register Jurisdiction workflow opened.', 'info')}>
            + Register Jurisdiction
          </button>
        </div>
      </div>

      {/* ═══ STAT CARDS ═══ */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon si-navy">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="3" y="3" width="14" height="14" rx="2" stroke="#102a2e" strokeWidth="1.8"/>
              <path d="M7 10h6M7 13h4M9 5.5v2" stroke="#102a2e" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="stat-info">
            <div className="stat-value">${totalLiability.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <div className="stat-label">Total Tax Liability (Current Period)</div>
            <div className="stat-change text-muted">Surplus lines, state &amp; county combined</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon si-coral">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="3" y="4" width="14" height="13" rx="1.6" stroke="#c9791f" strokeWidth="1.6"/>
              <path d="M3 8h14M6.5 2.5v3M13.5 2.5v3" stroke="#c9791f" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="stat-info">
            <div className="stat-value">2</div>
            <div className="stat-label">Filings Due This Month</div>
            <div className="stat-change" style={{ color: '#e05470' }}>Texas &amp; California Filings</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon si-orange">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2l6 3v4c0 4-2.6 6.8-6 8-3.4-1.2-6-4-6-8V5l6-3z" stroke="#e65100" strokeWidth="1.6" strokeLinejoin="round"/>
              <path d="M10 6.5v4" stroke="#e65100" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="stat-info">
            <div className="stat-value">{certsList.length}</div>
            <div className="stat-label">Active Exemption Certificates</div>
            <div className="stat-change" style={{ color: '#2e7d32' }}>All certificates verified</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon si-green">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="9" cy="9" r="5.5" stroke="#2e7d32" strokeWidth="1.6"/>
              <path d="M13.2 13.2L17 17" stroke="#2e7d32" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="stat-info">
            <div className="stat-value">0</div>
            <div className="stat-label">TIN Mismatches</div>
            <div className="stat-change" style={{ color: '#2e7d32' }}>100% W-9 Match Rate</div>
          </div>
        </div>
      </div>

      {/* ═══ TABS ═══ */}
      <div className="page-tabs">
        <button
          className={`page-tab ${mainTab === 'salesuse' ? 'active' : ''}`}
          onClick={() => setMainTab('salesuse')}
        >
          Insurance Premium &amp; Surplus Taxes
        </button>
        <button
          className={`page-tab ${mainTab === 'payroll' ? 'active' : ''}`}
          onClick={() => setMainTab('payroll')}
        >
          Payroll Tax
        </button>
        <button
          className={`page-tab ${mainTab === 'filing1099' ? 'active' : ''}`}
          onClick={() => setMainTab('filing1099')}
        >
          1099 &amp; Producer Compliance
        </button>
        <button
          className={`page-tab ${mainTab === 'liability' ? 'active' : ''}`}
          onClick={() => setMainTab('liability')}
        >
          Tax Liability Summary
        </button>
      </div>

      {/* ── 1. INSURANCE PREMIUM & SURPLUS TAXES ── */}
      {mainTab === 'salesuse' && (
        <>
          <div className="pill-tabbar">
            <button
              className={`pill-tab ${salesSubTab === 'sales-nexus' ? 'active' : ''}`}
              onClick={() => setSalesSubTab('sales-nexus')}
            >
              Nexus &amp; Registrations
            </button>
            <button
              className={`pill-tab ${salesSubTab === 'sales-rates' ? 'active' : ''}`}
              onClick={() => setSalesSubTab('sales-rates')}
            >
              Tax Rates &amp; Lookup
            </button>
            <button
              className={`pill-tab ${salesSubTab === 'sales-certs' ? 'active' : ''}`}
              onClick={() => setSalesSubTab('sales-certs')}
            >
              Exemption Certificates
            </button>
          </div>

          {salesSubTab === 'sales-nexus' && (
            <div className="table-wrap" style={{ marginBottom: '20px' }}>
              <div className="table-head-row">
                <div className="table-head-title">State Nexus &amp; Surplus Stamping Registrations</div>
                <div className="table-head-actions">
                  <input
                    className="filter-input"
                    placeholder="Filter by state…"
                    value={nexusFilter}
                    onChange={(e) => setNexusFilter(e.target.value)}
                  />
                  <button className="btn btn-outline btn-sm" onClick={() => showToast('Registering new state nexus...', 'info')}>
                    + Register Nexus
                  </button>
                </div>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>State</th>
                    <th>Filing Jurisdiction</th>
                    <th>Nexus Status</th>
                    <th>Registration Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredNexus.map((n, i) => (
                    <tr key={i}>
                      <td><strong>{n.state}</strong></td>
                      <td>{n.jurisdiction}</td>
                      <td>
                        <span className={`badge ${n.status === 'Registered' ? 'badge-green' : 'badge-orange'}`}>
                          {n.status}
                        </span>
                      </td>
                      <td>{n.date}</td>
                      <td>
                        <button className="btn btn-ghost btn-sm" onClick={() => showToast(`Viewing registration details for ${n.state}`, 'info')}>
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {salesSubTab === 'sales-rates' && (
            <>
              {/* Lookup Card */}
              <div className="card" style={{ marginBottom: '20px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div className="card-title">Rate Engine Lookup (ZIP+4 / Jurisdiction)</div>
                  <span className="badge badge-navy">State + County + Municipal Stamping</span>
                </div>
                <div className="tax-lookup-row">
                  <div className="form-field" style={{ marginBottom: 0 }}>
                    <label className="field-label">ZIP+4 or City Code</label>
                    <input
                      className="field-input"
                      value={zipInput}
                      onChange={(e) => setZipInput(e.target.value)}
                      placeholder="e.g. 75201-1234 (Texas)"
                    />
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={handleLookupRate}>
                    Look Up Rate
                  </button>
                </div>

                {lookupResult && (
                  <div className="tax-lookup-result">
                    <strong>Combined Texas Surplus &amp; Local Tax: 5.40%</strong> — State Surplus Lines Tax 4.85% &bull; Denton County Local Surcharge 0.55%{' '}
                    <span style={{ color: 'var(--color-muted, #64748b)' }}>(ZIP 75201 · Policy POL-V8NHT)</span>
                    <button
                      className="btn btn-outline btn-sm"
                      style={{ marginLeft: '12px' }}
                      onClick={() => handlePrefillRate('Texas - Denton County', 5.40)}
                    >
                      + Add to Your Tax Rates
                    </button>
                  </div>
                )}
                <div style={{ fontSize: '11px', color: 'var(--color-muted, #64748b)', marginTop: '10px' }}>
                  Calculates state surplus lines taxes, county surcharges, and stamping office regulatory fees.
                </div>
              </div>

              {/* Configured Rates Table */}
              <div className="table-wrap" style={{ marginBottom: '20px' }}>
                <div className="table-head-row">
                  <div className="table-head-title">Configured Tax Rates &amp; Surplus Surcharges</div>
                  <div className="table-head-actions">
                    <button className="btn btn-outline btn-sm" onClick={() => setIsAddRateOpen(!isAddRateOpen)}>
                      + Add Tax Rate
                    </button>
                  </div>
                </div>

                {isAddRateOpen && (
                  <div style={{ padding: '16px', background: 'var(--color-bg, #f8fafc)', borderBottom: '1px solid var(--color-border, #e2e8f0)' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#0d1b4b', marginBottom: '12px' }}>
                      Add Tax Jurisdiction / Fee Schedule
                    </div>
                    <div className="form-grid-3">
                      <div>
                        <label className="field-label">Jurisdiction *</label>
                        <input
                          className="field-input"
                          placeholder="e.g. Texas Surplus Lines"
                          value={newRateJurisdiction}
                          onChange={(e) => setNewRateJurisdiction(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="field-label">Tax Type</label>
                        <select
                          className="field-input"
                          value={newRateType}
                          onChange={(e) => setNewRateType(e.target.value)}
                        >
                          <option>Surplus Lines Tax</option>
                          <option>Insurance Premium Tax</option>
                          <option>County Surcharge</option>
                          <option>Stamping Office Fee</option>
                          <option>Sales &amp; Use</option>
                        </select>
                      </div>
                      <div>
                        <label className="field-label">Rate (%) *</label>
                        <input
                          className="field-input"
                          type="number"
                          step="0.001"
                          placeholder="e.g. 4.85"
                          value={newRatePercent}
                          onChange={(e) => setNewRatePercent(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="field-label">Effective Date</label>
                        <input
                          className="field-input"
                          type="date"
                          value={newRateEffective}
                          onChange={(e) => setNewRateEffective(e.target.value)}
                        />
                      </div>
                      <div style={{ gridColumn: 'span 2' }}>
                        <label className="field-label">Notes &amp; Policy Ref</label>
                        <input
                          className="field-input"
                          placeholder="e.g. Applicable to Commercial Trucking (POL-V8NHT)"
                          value={newRateNotes}
                          onChange={(e) => setNewRateNotes(e.target.value)}
                        />
                      </div>
                    </div>
                    <div style={{ marginTop: '14px', display: 'flex', gap: '8px' }}>
                      <button className="btn btn-primary btn-sm" onClick={handleSaveTaxRate}>
                        Save Tax Rate
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setIsAddRateOpen(false)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Jurisdiction</th>
                      <th>Type</th>
                      <th>Rate</th>
                      <th>Effective Date</th>
                      <th>Notes</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ratesList.map((r, idx) => (
                      <tr key={idx}>
                        <td><strong>{r.jurisdiction}</strong></td>
                        <td><span className="badge badge-navy">{r.type}</span></td>
                        <td className="font-semibold">{Number(r.percent).toFixed(3)}%</td>
                        <td>{r.effective}</td>
                        <td style={{ fontSize: '12px', color: 'var(--color-muted, #64748b)' }}>{r.notes || ' - '}</td>
                        <td><span className="badge badge-green">{r.status || 'Active'}</span></td>
                        <td>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => {
                              setRatesList(ratesList.filter((_, i) => i !== idx));
                              showToast(`Removed rate for ${r.jurisdiction}`, 'info');
                            }}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {salesSubTab === 'sales-certs' && (
            <div className="table-wrap">
              <div className="table-head-row">
                <div className="table-head-title">Exemption Certificates &amp; Reseller Waivers</div>
                <div className="table-head-actions">
                  <button className="btn btn-outline btn-sm" onClick={() => showToast('Certificate modal opened', 'info')}>
                    + Add Certificate
                  </button>
                </div>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Customer / Insured</th>
                    <th>Certificate #</th>
                    <th>State</th>
                    <th>Expiration Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {certsList.map((c, i) => (
                    <tr key={i}>
                      <td><strong>{c.customer}</strong></td>
                      <td className="cell-link">{c.certNo}</td>
                      <td>{c.state}</td>
                      <td>{c.expiry}</td>
                      <td>
                        <span className={`badge ${c.status.includes('Active') ? 'badge-green' : 'badge-orange'}`}>
                          {c.status}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => showToast(`Certificate ${c.certNo} re-verified active`, 'success')}
                        >
                          Verify
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ── 2. PAYROLL TAX ── */}
      {mainTab === 'payroll' && (
        <>
          <div className="pill-tabbar">
            <button
              className={`pill-tab ${paySubTab === 'pay-summary' ? 'active' : ''}`}
              onClick={() => setPaySubTab('pay-summary')}
            >
              Tax Summary
            </button>
            <button
              className={`pill-tab ${paySubTab === 'pay-filing' ? 'active' : ''}`}
              onClick={() => setPaySubTab('pay-filing')}
            >
              Filing Status
            </button>
          </div>

          {paySubTab === 'pay-summary' && (
            <div className="table-wrap" style={{ marginBottom: '20px' }}>
              <div className="table-head-row">
                <div className="table-head-title">FICA / FUTA / SUTA Summary</div>
                <div className="table-head-actions">
                  <button className="btn btn-outline btn-sm" onClick={() => showToast('Exported FICA/FUTA summary to CSV', 'success')}>
                    Export
                  </button>
                </div>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Tax Type</th>
                    <th>Rate</th>
                    <th>Wage Base</th>
                    <th>YTD Withheld</th>
                    <th>YTD Employer Match</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Social Security (FICA)</strong></td>
                    <td>6.20%</td>
                    <td>$168,600</td>
                    <td>$24,180.00</td>
                    <td>$24,180.00</td>
                  </tr>
                  <tr>
                    <td><strong>Medicare (FICA)</strong></td>
                    <td>1.45%</td>
                    <td>No cap</td>
                    <td>$5,655.00</td>
                    <td>$5,655.00</td>
                  </tr>
                  <tr>
                    <td><strong>Additional Medicare</strong></td>
                    <td>0.90%</td>
                    <td>Over $200,000</td>
                    <td>$1,220.00</td>
                    <td> - </td>
                  </tr>
                  <tr>
                    <td><strong>FUTA</strong></td>
                    <td>0.60% (post-credit)</td>
                    <td>$7,000</td>
                    <td> - </td>
                    <td>$1,890.00</td>
                  </tr>
                  <tr>
                    <td><strong>SUTA (Texas / Multi-state)</strong></td>
                    <td>2.70%</td>
                    <td>$9,000</td>
                    <td> - </td>
                    <td>$4,120.00</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {paySubTab === 'pay-filing' && (
            <div className="table-wrap">
              <div className="table-head-row">
                <div className="table-head-title">Filing Status — Forms 940 / 941 / 944</div>
                <div className="table-head-actions">
                  <button className="btn btn-outline btn-sm" onClick={() => showToast('Opening quarterly payroll filing calendar…', 'info')}>
                    View Calendar
                  </button>
                </div>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Form</th>
                    <th>Period</th>
                    <th>Status</th>
                    <th>Due Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Form 941</strong> (Quarterly Employer Return)</td>
                    <td>Q2 2026</td>
                    <td><span className="badge badge-green">Filed</span></td>
                    <td>2026-07-31</td>
                    <td><button className="btn btn-ghost btn-sm" onClick={() => showToast('Form 941 Q2 filed with IRS', 'info')}>View</button></td>
                  </tr>
                  <tr>
                    <td><strong>Form 941</strong> (Quarterly Employer Return)</td>
                    <td>Q3 2026</td>
                    <td><span className="badge badge-orange">Pending Review</span></td>
                    <td>2026-10-31</td>
                    <td><button className="btn btn-ghost btn-sm" onClick={() => showToast('Preparing Q3 941 packet...', 'info')}>Prepare</button></td>
                  </tr>
                  <tr>
                    <td><strong>Form 940</strong> (Annual FUTA)</td>
                    <td>FY 2025</td>
                    <td><span className="badge badge-green">Filed</span></td>
                    <td>2026-01-31</td>
                    <td><button className="btn btn-ghost btn-sm" onClick={() => showToast('Form 940 FY 2025 on file', 'info')}>View</button></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ── 3. 1099 FILING & PRODUCER COMPLIANCE ── */}
      {mainTab === 'filing1099' && (
        <>
          <div className="pill-tabbar">
            <button
              className={`pill-tab ${ten99SubTab === 'ten99-thresh' ? 'active' : ''}`}
              onClick={() => setTen99SubTab('ten99-thresh')}
            >
              Threshold Monitoring
            </button>
            <button
              className={`pill-tab ${ten99SubTab === 'ten99-w9' ? 'active' : ''}`}
              onClick={() => setTen99SubTab('ten99-w9')}
            >
              W-9 Status
            </button>
            <button
              className={`pill-tab ${ten99SubTab === 'ten99-efile' ? 'active' : ''}`}
              onClick={() => setTen99SubTab('ten99-efile')}
            >
              e-Filing Queue
            </button>
          </div>

          {ten99SubTab === 'ten99-thresh' && (
            <>
              <div className="tax-copy">
                Threshold monitoring covers 1099-NEC broker commissions (including <strong>HIT</strong>) and 1099-MISC service vendors against the $600 annual reporting threshold. Form 1096 summary is prepared automatically for batch e-filing through the IRS FIRE system.
              </div>

              <div className="table-wrap" style={{ marginBottom: '20px' }}>
                <div className="table-head-row">
                  <div className="table-head-title">Producer &amp; Vendor $600 Threshold Monitoring</div>
                  <div className="table-head-actions">
                    <button className="btn btn-outline btn-sm" onClick={() => showToast('Refreshed 1099 totals.', 'success')}>
                      Refresh Totals
                    </button>
                  </div>
                </div>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Producer / Vendor</th>
                      <th>Type</th>
                      <th>YTD Commission / Paid</th>
                      <th style={{ width: '220px' }}>Progress to Threshold</th>
                      <th>1099 Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {INITIAL_1099.map((v, i) => {
                      const pct = Math.min(100, Math.round((v.ytd / 600) * 100));
                      return (
                        <tr key={i}>
                          <td><strong>{v.name}</strong></td>
                          <td><span className="badge badge-navy">{v.type}</span></td>
                          <td className="font-semibold">${Number(v.ytd).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                          <td>
                            <div className="tax-progress-row">
                              <div className="tax-progress-track">
                                <div className="tax-progress-fill over" style={{ width: '100%' }}></div>
                              </div>
                              <span className="tax-progress-label">{pct}% (Over $600)</span>
                            </div>
                          </td>
                          <td><span className="badge badge-orange">1099 Required</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {ten99SubTab === 'ten99-w9' && (
            <>
              <div className="table-wrap" style={{ marginBottom: '20px' }}>
                <div className="table-head-row">
                  <div className="table-head-title">W-9 Collection &amp; Producer Verification Status</div>
                  <div className="table-head-actions">
                    <button className="btn btn-outline btn-sm" onClick={() => showToast('Electronic requests dispatched for missing W-9s', 'success')}>
                      Request Missing W-9s
                    </button>
                  </div>
                </div>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Producer / Vendor</th>
                      <th>W-9 On File</th>
                      <th>Verified Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {INITIAL_1099.map((v, i) => (
                      <tr key={i}>
                        <td><strong>{v.name}</strong></td>
                        <td><span className="badge badge-green">{v.w9}</span></td>
                        <td>{v.date}</td>
                        <td>
                          <button className="btn btn-ghost btn-sm" onClick={() => showToast(`W-9 downloaded for ${v.name}`, 'success')}>
                            Download W-9
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="table-wrap" style={{ marginBottom: '20px' }}>
                <div className="table-head-row">
                  <div className="table-head-title">TIN Matching (IRS Bulk TIN Matching System)</div>
                  <div className="table-head-actions">
                    <button className="btn btn-outline btn-sm" onClick={() => showToast('IRS TIN matching completed: 100% match', 'success')}>
                      Run TIN Match
                    </button>
                  </div>
                </div>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Producer / Vendor</th>
                      <th>EIN / TIN</th>
                      <th>Match Status</th>
                      <th>Verified Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {INITIAL_1099.map((v, i) => (
                      <tr key={i}>
                        <td><strong>{v.name}</strong></td>
                        <td><code>{v.tin}</code></td>
                        <td><span className="badge badge-green">{v.tinMatch}</span></td>
                        <td>{v.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {ten99SubTab === 'ten99-efile' && (
            <div className="table-wrap">
              <div className="table-head-row">
                <div className="table-head-title">e-Filing Queue — IRS FIRE / Texas Surplus Lines (SLTX)</div>
                <div className="table-head-actions">
                  <button className="btn btn-primary btn-sm" onClick={() => showToast('Batch submitted to IRS FIRE system successfully.', 'success')}>
                    Submit Next Batch
                  </button>
                </div>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Batch #</th>
                    <th>Agency / Portal</th>
                    <th>Form Type</th>
                    <th>Records Count</th>
                    <th>Status</th>
                    <th>Submitted Date</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="cell-link">BATCH-TX-2026-08</td>
                    <td>Texas Stamping Office (SLTX)</td>
                    <td>Surplus Lines Premium Stamping</td>
                    <td>1 policy ($1,770 tax)</td>
                    <td><span className="badge badge-blue">Ready for Transmission</span></td>
                    <td>2026-08-20</td>
                  </tr>
                  <tr>
                    <td className="cell-link">BATCH-IRS-2026-Q3</td>
                    <td>IRS FIRE Portal</td>
                    <td>Form 1099-NEC Electronic Batch</td>
                    <td>4 producers ($10,513 comm)</td>
                    <td><span className="badge badge-green">Validated</span></td>
                    <td>2026-08-20</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ── 4. CONSOLIDATED TAX LIABILITY SUMMARY ── */}
      {mainTab === 'liability' && (
        <div className="table-wrap">
          <div className="table-head-row">
            <div className="table-head-title">Consolidated Tax Liability Ledger (Account 2300)</div>
            <div className="table-head-actions">
              <input
                className="filter-input"
                placeholder="Filter by status…"
                value={liabilityFilter}
                onChange={(e) => setLiabilityFilter(e.target.value)}
              />
              <button className="btn btn-outline btn-sm" onClick={() => showToast('Exported tax liability ledger to CSV', 'success')}>
                Export
              </button>
            </div>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Tax Type</th>
                <th>Jurisdiction / State</th>
                <th>Policy / Invoice Ref</th>
                <th style={{ textAlign: 'right' }}>Taxable Premium</th>
                <th style={{ textAlign: 'right' }}>Amount Due ($)</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLiabilities.map((l) => (
                <tr key={l.id}>
                  <td><strong>{l.type}</strong></td>
                  <td>{l.state}</td>
                  <td><span className="cell-link">{l.ref}</span></td>
                  <td style={{ textAlign: 'right' }}>
                    ${Number(l.taxable).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#0d1b4b', fontSize: '13.5px' }}>
                    ${Number(l.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td>{l.due}</td>
                  <td>
                    <span className={`badge ${l.status === 'Due Soon' ? 'badge-orange' : 'badge-green'}`}>
                      {l.status}
                    </span>
                  </td>
                  <td>
                    {l.status !== 'Paid / Remitted' ? (
                      <button
                        className="btn btn-primary btn-xs"
                        onClick={() => handleRemitTax(l.id, l.type, l.amount)}
                      >
                        Remit Tax
                      </button>
                    ) : (
                      <span className="badge badge-green">Paid ✓</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
export default TaxEnginePage;
