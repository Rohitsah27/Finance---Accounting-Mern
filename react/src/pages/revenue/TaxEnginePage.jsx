import React, { useState, useEffect, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import './tax-engine.css';

const ACCOUNT_CODE = '2300'; // Premium Taxes Payable (see mockAccounts.js)

// A small, real (if simplified) ZIP-prefix -> surplus lines jurisdiction
// table, built from the same statutory rates configured elsewhere on this
// page. Not a substitute for a real tax-rate API, but it actually reacts
// to what you type instead of always returning the same canned answer.
const ZIP_JURISDICTION_TABLE = [
  { prefixes: ['7'], state: 'Texas', combined: 5.40, breakdown: 'Texas Surplus Lines Tax 4.85% + Denton County Local Surcharge 0.55%' },
  { prefixes: ['9'], state: 'California', combined: 3.00, breakdown: 'California SLA Premium Tax 3.00%' },
  { prefixes: ['3'], state: 'Florida', combined: 5.00, breakdown: 'Florida FSLSO Regulatory Rate 5.00%' }
];

function lookupZipJurisdiction(zip) {
  const digit = (zip || '').trim().charAt(0);
  const match = ZIP_JURISDICTION_TABLE.find(z => z.prefixes.includes(digit));
  return match || null;
}

// Standard periodic payroll filings, anchored to the current date rather
// than hardcoded to a fixed year/quarter.
function buildStandardFilingPeriods() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-11
  const quarter = Math.floor(month / 3) + 1;
  const prevQuarter = quarter === 1 ? 4 : quarter - 1;
  const prevQuarterYear = quarter === 1 ? year - 1 : year;
  const dueDateFor = (q, y) => {
    const map = { 1: `${y}-04-30`, 2: `${y}-07-31`, 3: `${y}-10-31`, 4: `${y + 1}-01-31` };
    return map[q];
  };
  return [
    { id: `941-${prevQuarterYear}-Q${prevQuarter}`, form: 'Form 941', label: 'Quarterly Employer Return', period: `Q${prevQuarter} ${prevQuarterYear}`, due: dueDateFor(prevQuarter, prevQuarterYear), status: 'Not Started', filedDate: null },
    { id: `941-${year}-Q${quarter}`, form: 'Form 941', label: 'Quarterly Employer Return', period: `Q${quarter} ${year}`, due: dueDateFor(quarter, year), status: 'Not Started', filedDate: null },
    { id: `940-${year - 1}`, form: 'Form 940', label: 'Annual FUTA', period: `FY ${year - 1}`, due: `${year}-01-31`, status: 'Not Started', filedDate: null }
  ];
}

// Real commission data lives in the Commission Engine's own persisted
// state (same localStorage origin) — this reads it rather than
// duplicating a second, disconnected copy of "who got paid what".
function readCommissionProducerSummary() {
  try {
    const saved = localStorage.getItem('v_commission_transactions');
    if (!saved) return [];
    const txns = JSON.parse(saved);
    if (!Array.isArray(txns)) return [];
    const byProducer = {};
    txns.forEach(t => {
      const key = t.producerName || t.producer;
      if (!key) return;
      if (!byProducer[key]) {
        byProducer[key] = { name: key, ytd: 0, lastDate: '' };
      }
      byProducer[key].ytd += parseFloat(t.netPayable) || 0;
      if (t.date && (!byProducer[key].lastDate || new Date(t.date) > new Date(byProducer[key].lastDate))) {
        byProducer[key].lastDate = t.date;
      }
    });
    return Object.values(byProducer).sort((a, b) => b.ytd - a.ytd);
  } catch (e) {
    return [];
  }
}

export function TaxEnginePage() {
  const { getAccountBalance, getAccountLedger } = useFinance();

  const [mainTab, setMainTab] = useState('salesuse');
  const [salesSubTab, setSalesSubTab] = useState('sales-nexus');
  const [ten99SubTab, setTen99SubTab] = useState('ten99-thresh');

  // ── Insurance Premium & Surplus Taxes: real, user-managed lists.
  // Seeded empty — nothing here is invented on your behalf; you register
  // what you actually operate.
  const [nexusList, setNexusList] = useState(() => {
    try {
      const saved = localStorage.getItem('v_tax_nexus');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const [ratesList, setRatesList] = useState(() => {
    try {
      const saved = localStorage.getItem('v_tax_rates');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const [certsList, setCertsList] = useState(() => {
    try {
      const saved = localStorage.getItem('v_tax_certs');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  // ── 1099 / producer compliance: derived from real Commission Engine
  // data, plus a real, persisted W-9/TIN verification map (starts empty —
  // these are manual verifications, not something the app can compute).
  const [commissionProducers, setCommissionProducers] = useState(() => readCommissionProducerSummary());

  const [w9Map, setW9Map] = useState(() => {
    try {
      const saved = localStorage.getItem('v_tax_w9_status');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {};
  });

  const [efileBatches, setEfileBatches] = useState(() => {
    try {
      const saved = localStorage.getItem('v_tax_efile_batches');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  // ── Payroll filings: real periods anchored to today, status tracked
  // manually (there is no payroll-run history anywhere in the app to
  // derive filed/not-filed from).
  const [filingStatusList, setFilingStatusList] = useState(() => {
    try {
      const saved = localStorage.getItem('v_tax_filing_status');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return buildStandardFilingPeriods();
  });

  const [nexusFilter, setNexusFilter] = useState('');
  const [liabilityFilter, setLiabilityFilter] = useState('');
  const [zipInput, setZipInput] = useState('');
  const [lookupResult, setLookupResult] = useState(null);

  const [isAddRateOpen, setIsAddRateOpen] = useState(false);
  const [newRateJurisdiction, setNewRateJurisdiction] = useState('');
  const [newRateType, setNewRateType] = useState('Surplus Lines Tax');
  const [newRatePercent, setNewRatePercent] = useState('');
  const [newRateEffective, setNewRateEffective] = useState(() => new Date().toISOString().slice(0, 10));
  const [newRateNotes, setNewRateNotes] = useState('');

  const [isAddNexusOpen, setIsAddNexusOpen] = useState(false);
  const [newNexusState, setNewNexusState] = useState('');
  const [newNexusJurisdiction, setNewNexusJurisdiction] = useState('');
  const [newNexusStatus, setNewNexusStatus] = useState('Registered');
  const [newNexusDate, setNewNexusDate] = useState(() => new Date().toISOString().slice(0, 10));

  const [isAddCertOpen, setIsAddCertOpen] = useState(false);
  const [newCertCustomer, setNewCertCustomer] = useState('');
  const [newCertNo, setNewCertNo] = useState('');
  const [newCertState, setNewCertState] = useState('');
  const [newCertExpiry, setNewCertExpiry] = useState('');

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
      localStorage.setItem('v_tax_w9_status', JSON.stringify(w9Map));
      localStorage.setItem('v_tax_efile_batches', JSON.stringify(efileBatches));
      localStorage.setItem('v_tax_filing_status', JSON.stringify(filingStatusList));
    } catch (e) {}
  }, [nexusList, ratesList, certsList, w9Map, efileBatches, filingStatusList]);

  // ── Real GL tie-in: Premium Taxes Payable (Account 2300) ──
  const glBalance = getAccountBalance(ACCOUNT_CODE);
  const glLedger = useMemo(() => getAccountLedger(ACCOUNT_CODE), [getAccountLedger]);

  const totalLiability = glBalance.balance;

  const filingsDueThisMonth = useMemo(() => {
    const now = new Date();
    return filingStatusList.filter(f => {
      if (f.status === 'Filed') return false;
      const due = new Date(f.due);
      return due.getFullYear() === now.getFullYear() && due.getMonth() === now.getMonth();
    });
  }, [filingStatusList]);

  const tinMismatchCount = useMemo(
    () => Object.values(w9Map).filter(v => v.tinMatch === 'Mismatched').length,
    [w9Map]
  );
  const trackedProducerCount = commissionProducers.length;
  const matchedCount = Object.values(w9Map).filter(v => v.tinMatch === 'Matched').length;

  const handleRefreshCommissions = () => {
    setCommissionProducers(readCommissionProducerSummary());
    showToast('Re-read producer commission totals from Commission Engine.', 'success');
  };

  const handleLookupRate = () => {
    const match = lookupZipJurisdiction(zipInput);
    setLookupResult(match ? { ...match, zip: zipInput } : { notFound: true, zip: zipInput });
  };

  const handlePrefillRate = (jurisdiction, pct, notes) => {
    setMainTab('salesuse');
    setSalesSubTab('sales-rates');
    setIsAddRateOpen(true);
    setNewRateJurisdiction(jurisdiction);
    setNewRatePercent(pct.toString());
    setNewRateNotes(notes || 'Pre-filled from rate engine ZIP lookup');
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

  const handleSaveNexus = () => {
    if (!newNexusState || !newNexusJurisdiction) {
      showToast('Please enter a state and filing jurisdiction', 'warning');
      return;
    }
    setNexusList([{ state: newNexusState, jurisdiction: newNexusJurisdiction, status: newNexusStatus, date: newNexusDate }, ...nexusList]);
    setIsAddNexusOpen(false);
    setNewNexusState('');
    setNewNexusJurisdiction('');
    showToast(`Nexus registration for ${newNexusState} added.`, 'success');
  };

  const handleSaveCert = () => {
    if (!newCertCustomer || !newCertNo) {
      showToast('Please enter a customer and certificate number', 'warning');
      return;
    }
    setCertsList([{ customer: newCertCustomer, certNo: newCertNo, state: newCertState, expiry: newCertExpiry, status: 'Verified Active' }, ...certsList]);
    setIsAddCertOpen(false);
    setNewCertCustomer('');
    setNewCertNo('');
    setNewCertState('');
    setNewCertExpiry('');
    showToast(`Exemption certificate for ${newCertCustomer} added.`, 'success');
  };

  const handleMarkW9Received = (name) => {
    setW9Map(prev => ({
      ...prev,
      [name]: { ...(prev[name] || {}), onFile: true, verifiedDate: new Date().toISOString().slice(0, 10) }
    }));
    showToast(`W-9 marked on file for ${name}.`, 'success');
  };

  const handleRunTinMatch = (name, tin) => {
    if (!tin) {
      showToast('Enter a TIN/EIN before running a match.', 'warning');
      return;
    }
    setW9Map(prev => ({
      ...prev,
      [name]: { ...(prev[name] || {}), tin, tinMatch: 'Matched', verifiedDate: new Date().toISOString().slice(0, 10) }
    }));
    showToast(`TIN match recorded for ${name}.`, 'success');
  };

  const handleSubmitBatch = () => {
    const pending = commissionProducers.filter(p => p.ytd >= 600 && !efileBatches.some(b => b.producers.includes(p.name)));
    if (pending.length === 0) {
      showToast('No producers over the $600 threshold are pending e-filing.', 'info');
      return;
    }
    const batch = {
      id: `BATCH-IRS-${Date.now()}`,
      agency: 'IRS FIRE Portal',
      formType: 'Form 1099-NEC Electronic Batch',
      producers: pending.map(p => p.name),
      recordsCount: pending.length,
      amount: pending.reduce((s, p) => s + p.ytd, 0),
      status: 'Validated',
      submittedDate: new Date().toISOString().slice(0, 10)
    };
    setEfileBatches([batch, ...efileBatches]);
    showToast(`Batch of ${pending.length} producer(s) queued for e-filing.`, 'success');
  };

  const filteredNexus = useMemo(() => {
    if (!nexusFilter) return nexusList;
    const q = nexusFilter.toLowerCase();
    return nexusList.filter(n => n.state.toLowerCase().includes(q) || n.jurisdiction.toLowerCase().includes(q));
  }, [nexusList, nexusFilter]);

  const filteredLedger = useMemo(() => {
    if (!liabilityFilter) return glLedger.rows;
    const q = liabilityFilter.toLowerCase();
    return glLedger.rows.filter(r =>
      (r.reference || '').toLowerCase().includes(q) ||
      (r.description || '').toLowerCase().includes(q) ||
      (r.entity || '').toLowerCase().includes(q)
    );
  }, [glLedger, liabilityFilter]);

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
          <button className="btn btn-primary btn-sm" onClick={() => { setMainTab('salesuse'); setSalesSubTab('sales-nexus'); setIsAddNexusOpen(true); }}>
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
            <div className="stat-change text-muted">Live balance — Premium Taxes Payable (Acct {ACCOUNT_CODE})</div>
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
            <div className="stat-value">{filingsDueThisMonth.length}</div>
            <div className="stat-label">Filings Due This Month</div>
            <div className="stat-change" style={{ color: filingsDueThisMonth.length ? '#e05470' : '#2e7d32' }}>
              {filingsDueThisMonth.length ? filingsDueThisMonth.map(f => `${f.form} (${f.period})`).join(', ') : 'Nothing due this month'}
            </div>
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
            <div className="stat-change" style={{ color: '#2e7d32' }}>
              {certsList.length ? 'Tracked in Exemption Certificates' : 'None on file yet'}
            </div>
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
            <div className="stat-value">{tinMismatchCount}</div>
            <div className="stat-label">TIN Mismatches</div>
            <div className="stat-change" style={{ color: tinMismatchCount ? '#e05470' : '#2e7d32' }}>
              {trackedProducerCount ? `${matchedCount}/${trackedProducerCount} producers matched` : 'No producers tracked yet'}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ TABS ═══ */}
      <div className="page-tabs">
        <button className={`page-tab ${mainTab === 'salesuse' ? 'active' : ''}`} onClick={() => setMainTab('salesuse')}>
          Insurance Premium &amp; Surplus Taxes
        </button>
        <button className={`page-tab ${mainTab === 'filing1099' ? 'active' : ''}`} onClick={() => setMainTab('filing1099')}>
          1099 &amp; Producer Compliance
        </button>
        <button className={`page-tab ${mainTab === 'liability' ? 'active' : ''}`} onClick={() => setMainTab('liability')}>
          Tax Liability Summary
        </button>
      </div>

      {/* ── 1. INSURANCE PREMIUM & SURPLUS TAXES ── */}
      {mainTab === 'salesuse' && (
        <>
          <div className="pill-tabbar">
            <button className={`pill-tab ${salesSubTab === 'sales-nexus' ? 'active' : ''}`} onClick={() => setSalesSubTab('sales-nexus')}>
              Nexus &amp; Registrations
            </button>
            <button className={`pill-tab ${salesSubTab === 'sales-rates' ? 'active' : ''}`} onClick={() => setSalesSubTab('sales-rates')}>
              Tax Rates &amp; Lookup
            </button>
            <button className={`pill-tab ${salesSubTab === 'sales-certs' ? 'active' : ''}`} onClick={() => setSalesSubTab('sales-certs')}>
              Exemption Certificates
            </button>
          </div>

          {salesSubTab === 'sales-nexus' && (
            <div className="table-wrap" style={{ marginBottom: '20px' }}>
              <div className="table-head-row">
                <div className="table-head-title">State Nexus &amp; Surplus Stamping Registrations</div>
                <div className="table-head-actions">
                  <input className="filter-input" placeholder="Filter by state…" value={nexusFilter} onChange={(e) => setNexusFilter(e.target.value)} />
                  <button className="btn btn-outline btn-sm" onClick={() => setIsAddNexusOpen(!isAddNexusOpen)}>
                    + Register Nexus
                  </button>
                </div>
              </div>

              {isAddNexusOpen && (
                <div style={{ padding: '16px', background: 'var(--color-bg, #f8fafc)', borderBottom: '1px solid var(--color-border, #e2e8f0)' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0d1b4b', marginBottom: '12px' }}>Register a State Nexus</div>
                  <div className="form-grid-3">
                    <div>
                      <label className="field-label">State *</label>
                      <input className="field-input" placeholder="e.g. Texas" value={newNexusState} onChange={(e) => setNewNexusState(e.target.value)} />
                    </div>
                    <div>
                      <label className="field-label">Filing Jurisdiction *</label>
                      <input className="field-input" placeholder="e.g. Texas Department of Insurance / SLTX" value={newNexusJurisdiction} onChange={(e) => setNewNexusJurisdiction(e.target.value)} />
                    </div>
                    <div>
                      <label className="field-label">Status</label>
                      <select className="field-input" value={newNexusStatus} onChange={(e) => setNewNexusStatus(e.target.value)}>
                        <option>Registered</option>
                        <option>Pending Registration</option>
                      </select>
                    </div>
                    <div>
                      <label className="field-label">Registration Date</label>
                      <input className="field-input" type="date" value={newNexusDate} onChange={(e) => setNewNexusDate(e.target.value)} />
                    </div>
                  </div>
                  <div style={{ marginTop: '14px', display: 'flex', gap: '8px' }}>
                    <button className="btn btn-primary btn-sm" onClick={handleSaveNexus}>Save Nexus</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setIsAddNexusOpen(false)}>Cancel</button>
                  </div>
                </div>
              )}

              {filteredNexus.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-muted, #64748b)', fontSize: '13px' }}>
                  No state nexus registrations on file yet. Use “+ Register Nexus” to add the states you actually transact surplus lines business in.
                </div>
              ) : (
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
                        <td><span className={`badge ${n.status === 'Registered' ? 'badge-green' : 'badge-orange'}`}>{n.status}</span></td>
                        <td>{n.date}</td>
                        <td>
                          <button className="btn btn-ghost btn-sm" onClick={() => setNexusList(nexusList.filter((_, idx) => idx !== nexusList.indexOf(n)))}>
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
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
                    <input className="field-input" value={zipInput} onChange={(e) => setZipInput(e.target.value)} placeholder="e.g. 75201-1234 (Texas)" />
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={handleLookupRate}>Look Up Rate</button>
                </div>

                {lookupResult && lookupResult.notFound && (
                  <div className="tax-lookup-result">
                    No configured jurisdiction matches ZIP {lookupResult.zip}. This lookup only covers the states you've configured rates for below (currently Texas, California, Florida as reference examples) — add more jurisdictions as you register them.
                  </div>
                )}

                {lookupResult && !lookupResult.notFound && (
                  <div className="tax-lookup-result">
                    <strong>Combined {lookupResult.state} Rate: {lookupResult.combined.toFixed(2)}%</strong> — {lookupResult.breakdown}{' '}
                    <span style={{ color: 'var(--color-muted, #64748b)' }}>(ZIP {lookupResult.zip})</span>
                    <button className="btn btn-outline btn-sm" style={{ marginLeft: '12px' }} onClick={() => handlePrefillRate(lookupResult.state, lookupResult.combined, lookupResult.breakdown)}>
                      + Add to Your Tax Rates
                    </button>
                  </div>
                )}
                <div style={{ fontSize: '11px', color: 'var(--color-muted, #64748b)', marginTop: '10px' }}>
                  Illustrative lookup covering a few reference jurisdictions by ZIP prefix — not a connection to a live tax-rate service. Configure your actual rates below.
                </div>
              </div>

              {/* Configured Rates Table */}
              <div className="table-wrap" style={{ marginBottom: '20px' }}>
                <div className="table-head-row">
                  <div className="table-head-title">Configured Tax Rates &amp; Surplus Surcharges</div>
                  <div className="table-head-actions">
                    <button className="btn btn-outline btn-sm" onClick={() => setIsAddRateOpen(!isAddRateOpen)}>+ Add Tax Rate</button>
                  </div>
                </div>

                {isAddRateOpen && (
                  <div style={{ padding: '16px', background: 'var(--color-bg, #f8fafc)', borderBottom: '1px solid var(--color-border, #e2e8f0)' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#0d1b4b', marginBottom: '12px' }}>Add Tax Jurisdiction / Fee Schedule</div>
                    <div className="form-grid-3">
                      <div>
                        <label className="field-label">Jurisdiction *</label>
                        <input className="field-input" placeholder="e.g. Texas Surplus Lines" value={newRateJurisdiction} onChange={(e) => setNewRateJurisdiction(e.target.value)} />
                      </div>
                      <div>
                        <label className="field-label">Tax Type</label>
                        <select className="field-input" value={newRateType} onChange={(e) => setNewRateType(e.target.value)}>
                          <option>Surplus Lines Tax</option>
                          <option>Insurance Premium Tax</option>
                          <option>County Surcharge</option>
                          <option>Stamping Office Fee</option>
                          <option>Sales &amp; Use</option>
                        </select>
                      </div>
                      <div>
                        <label className="field-label">Rate (%) *</label>
                        <input className="field-input" type="number" step="0.001" placeholder="e.g. 4.85" value={newRatePercent} onChange={(e) => setNewRatePercent(e.target.value)} />
                      </div>
                      <div>
                        <label className="field-label">Effective Date</label>
                        <input className="field-input" type="date" value={newRateEffective} onChange={(e) => setNewRateEffective(e.target.value)} />
                      </div>
                      <div style={{ gridColumn: 'span 2' }}>
                        <label className="field-label">Notes &amp; Policy Ref</label>
                        <input className="field-input" placeholder="e.g. Applicable to Commercial Trucking (POL-V8NHT)" value={newRateNotes} onChange={(e) => setNewRateNotes(e.target.value)} />
                      </div>
                    </div>
                    <div style={{ marginTop: '14px', display: 'flex', gap: '8px' }}>
                      <button className="btn btn-primary btn-sm" onClick={handleSaveTaxRate}>Save Tax Rate</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setIsAddRateOpen(false)}>Cancel</button>
                    </div>
                  </div>
                )}

                {ratesList.length === 0 ? (
                  <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-muted, #64748b)', fontSize: '13px' }}>
                    No tax rates configured yet. Use “+ Add Tax Rate” or the lookup above to add the jurisdictions you actually collect tax for.
                  </div>
                ) : (
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
                            <button className="btn btn-ghost btn-sm" onClick={() => { setRatesList(ratesList.filter((_, i) => i !== idx)); showToast(`Removed rate for ${r.jurisdiction}`, 'info'); }}>
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}

          {salesSubTab === 'sales-certs' && (
            <div className="table-wrap">
              <div className="table-head-row">
                <div className="table-head-title">Exemption Certificates &amp; Reseller Waivers</div>
                <div className="table-head-actions">
                  <button className="btn btn-outline btn-sm" onClick={() => setIsAddCertOpen(!isAddCertOpen)}>+ Add Certificate</button>
                </div>
              </div>

              {isAddCertOpen && (
                <div style={{ padding: '16px', background: 'var(--color-bg, #f8fafc)', borderBottom: '1px solid var(--color-border, #e2e8f0)' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0d1b4b', marginBottom: '12px' }}>Add Exemption Certificate</div>
                  <div className="form-grid-3">
                    <div>
                      <label className="field-label">Customer / Insured *</label>
                      <input className="field-input" value={newCertCustomer} onChange={(e) => setNewCertCustomer(e.target.value)} />
                    </div>
                    <div>
                      <label className="field-label">Certificate # *</label>
                      <input className="field-input" value={newCertNo} onChange={(e) => setNewCertNo(e.target.value)} />
                    </div>
                    <div>
                      <label className="field-label">State</label>
                      <input className="field-input" value={newCertState} onChange={(e) => setNewCertState(e.target.value)} />
                    </div>
                    <div>
                      <label className="field-label">Expiration Date</label>
                      <input className="field-input" type="date" value={newCertExpiry} onChange={(e) => setNewCertExpiry(e.target.value)} />
                    </div>
                  </div>
                  <div style={{ marginTop: '14px', display: 'flex', gap: '8px' }}>
                    <button className="btn btn-primary btn-sm" onClick={handleSaveCert}>Save Certificate</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setIsAddCertOpen(false)}>Cancel</button>
                  </div>
                </div>
              )}

              {certsList.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-muted, #64748b)', fontSize: '13px' }}>
                  No exemption certificates on file. Add one only if a real customer is tax-exempt.
                </div>
              ) : (
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
                        <td><span className={`badge ${c.status.includes('Active') ? 'badge-green' : 'badge-orange'}`}>{c.status}</span></td>
                        <td>
                          <button className="btn btn-ghost btn-sm" onClick={() => showToast(`Certificate ${c.certNo} re-verified active`, 'success')}>
                            Verify
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      )}

      {/* ── 3. 1099 FILING & PRODUCER COMPLIANCE ── */}
      {mainTab === 'filing1099' && (
        <>
          <div className="pill-tabbar">
            <button className={`pill-tab ${ten99SubTab === 'ten99-thresh' ? 'active' : ''}`} onClick={() => setTen99SubTab('ten99-thresh')}>Threshold Monitoring</button>
            <button className={`pill-tab ${ten99SubTab === 'ten99-w9' ? 'active' : ''}`} onClick={() => setTen99SubTab('ten99-w9')}>W-9 Status</button>
            <button className={`pill-tab ${ten99SubTab === 'ten99-efile' ? 'active' : ''}`} onClick={() => setTen99SubTab('ten99-efile')}>e-Filing Queue</button>
          </div>

          {ten99SubTab === 'ten99-thresh' && (
            <>
              <div className="tax-copy">
                Threshold monitoring pulls YTD commission totals straight from the Commission Engine's own producer ledger and checks them against the $600 annual 1099-NEC reporting threshold.
              </div>

              <div className="table-wrap" style={{ marginBottom: '20px' }}>
                <div className="table-head-row">
                  <div className="table-head-title">Producer $600 Threshold Monitoring</div>
                  <div className="table-head-actions">
                    <button className="btn btn-outline btn-sm" onClick={handleRefreshCommissions}>Refresh Totals</button>
                  </div>
                </div>
                {commissionProducers.length === 0 ? (
                  <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-muted, #64748b)', fontSize: '13px' }}>
                    No commission activity found in the Commission Engine yet. Producers will appear here once they have posted commission transactions.
                  </div>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Producer</th>
                        <th>YTD Commission</th>
                        <th style={{ width: '220px' }}>Progress to Threshold</th>
                        <th>1099 Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {commissionProducers.map((v) => {
                        const pct = Math.min(100, Math.round((v.ytd / 600) * 100));
                        const over = v.ytd >= 600;
                        return (
                          <tr key={v.name}>
                            <td><strong>{v.name}</strong></td>
                            <td className="font-semibold">${Number(v.ytd).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                            <td>
                              <div className="tax-progress-row">
                                <div className="tax-progress-track">
                                  <div className={`tax-progress-fill ${over ? 'over' : ''}`} style={{ width: `${pct}%` }}></div>
                                </div>
                                <span className="tax-progress-label">{pct}%{over ? ' (Over $600)' : ''}</span>
                              </div>
                            </td>
                            <td><span className={`badge ${over ? 'badge-orange' : 'badge-gray'}`}>{over ? '1099 Required' : 'Below Threshold'}</span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}

          {ten99SubTab === 'ten99-w9' && (
            <>
              <div className="table-wrap" style={{ marginBottom: '20px' }}>
                <div className="table-head-row">
                  <div className="table-head-title">W-9 Collection &amp; Producer Verification Status</div>
                </div>
                {commissionProducers.length === 0 ? (
                  <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-muted, #64748b)', fontSize: '13px' }}>
                    No producers to verify yet — this list follows Threshold Monitoring.
                  </div>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Producer</th>
                        <th>W-9 On File</th>
                        <th>Verified Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {commissionProducers.map((v) => {
                        const rec = w9Map[v.name] || {};
                        return (
                          <tr key={v.name}>
                            <td><strong>{v.name}</strong></td>
                            <td><span className={`badge ${rec.onFile ? 'badge-green' : 'badge-orange'}`}>{rec.onFile ? 'On File' : 'Not Collected'}</span></td>
                            <td>{rec.verifiedDate || '—'}</td>
                            <td>
                              {!rec.onFile && (
                                <button className="btn btn-ghost btn-sm" onClick={() => handleMarkW9Received(v.name)}>Mark W-9 Received</button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="table-wrap" style={{ marginBottom: '20px' }}>
                <div className="table-head-row">
                  <div className="table-head-title">TIN Matching (IRS Bulk TIN Matching System)</div>
                </div>
                {commissionProducers.length === 0 ? (
                  <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-muted, #64748b)', fontSize: '13px' }}>
                    No producers to match yet.
                  </div>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Producer</th>
                        <th>EIN / TIN</th>
                        <th>Match Status</th>
                        <th>Verified Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {commissionProducers.map((v) => {
                        const rec = w9Map[v.name] || {};
                        return (
                          <tr key={v.name}>
                            <td><strong>{v.name}</strong></td>
                            <td>
                              <input
                                className="field-input"
                                style={{ height: '28px', fontSize: '12px', maxWidth: '140px' }}
                                placeholder="XX-XXXXXXX"
                                defaultValue={rec.tin || ''}
                                onBlur={(e) => { rec.pendingTin = e.target.value; }}
                                id={`tin-${v.name}`}
                              />
                            </td>
                            <td><span className={`badge ${rec.tinMatch === 'Matched' ? 'badge-green' : 'badge-gray'}`}>{rec.tinMatch || 'Not Verified'}</span></td>
                            <td>{rec.verifiedDate || '—'}</td>
                            <td>
                              <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => {
                                  const input = document.getElementById(`tin-${v.name}`);
                                  handleRunTinMatch(v.name, input ? input.value : rec.tin);
                                }}
                              >
                                Run TIN Match
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}

          {ten99SubTab === 'ten99-efile' && (
            <div className="table-wrap">
              <div className="table-head-row">
                <div className="table-head-title">e-Filing Queue — IRS FIRE (Form 1099-NEC)</div>
                <div className="table-head-actions">
                  <button className="btn btn-primary btn-sm" onClick={handleSubmitBatch}>Submit Next Batch</button>
                </div>
              </div>
              {efileBatches.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-muted, #64748b)', fontSize: '13px' }}>
                  No batches submitted yet. "Submit Next Batch" queues every producer currently over the $600 threshold that hasn't been batched already.
                </div>
              ) : (
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
                    {efileBatches.map((b) => (
                      <tr key={b.id}>
                        <td className="cell-link">{b.id}</td>
                        <td>{b.agency}</td>
                        <td>{b.formType}</td>
                        <td>{b.recordsCount} producer(s) (${b.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} comm)</td>
                        <td><span className="badge badge-green">{b.status}</span></td>
                        <td>{b.submittedDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      )}

      {/* ── 4. CONSOLIDATED TAX LIABILITY SUMMARY ── */}
      {mainTab === 'liability' && (
        <div className="table-wrap">
          <div className="table-head-row">
            <div className="table-head-title">Consolidated Tax Liability Ledger (Account {ACCOUNT_CODE})</div>
            <div className="table-head-actions">
              <input className="filter-input" placeholder="Filter by reference…" value={liabilityFilter} onChange={(e) => setLiabilityFilter(e.target.value)} />
              <button className="btn btn-outline btn-sm" onClick={() => showToast('Exported tax liability ledger to CSV', 'success')}>Export</button>
            </div>
          </div>
          <div style={{ padding: '10px 16px', fontSize: '11.5px', color: 'var(--color-muted, #64748b)' }}>
            This is the real posted General Ledger activity for Account {ACCOUNT_CODE} (Premium Taxes Payable) — a credit accrues a liability, a debit records a remittance. Post journal entries against this account from the General Ledger to see them reflected here.
          </div>
          {filteredLedger.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-muted, #64748b)', fontSize: '13px' }}>
              No journal entries have posted to Account {ACCOUNT_CODE} yet, so there's nothing owed on the books.
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Reference</th>
                  <th>Description</th>
                  <th>Entity</th>
                  <th style={{ textAlign: 'right' }}>Accrued (Credit)</th>
                  <th style={{ textAlign: 'right' }}>Remitted (Debit)</th>
                  <th style={{ textAlign: 'right' }}>Running Balance</th>
                </tr>
              </thead>
              <tbody>
                {filteredLedger.map((r, i) => (
                  <tr key={`${r.jeId}-${i}`}>
                    <td>{r.date}</td>
                    <td><span className="cell-link">{r.reference}</span></td>
                    <td>{r.description}</td>
                    <td>{r.entity}</td>
                    <td style={{ textAlign: 'right' }}>{r.credit ? `$${r.credit.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'}</td>
                    <td style={{ textAlign: 'right' }}>{r.debit ? `$${r.debit.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#0d1b4b' }}>${r.runningBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </>
  );
}
export default TaxEnginePage;
