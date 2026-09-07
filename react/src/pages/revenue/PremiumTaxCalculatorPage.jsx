import React, { useState, useMemo } from 'react';
import './premium-tax-calculator.css';

const STATE_RATES = {
  TX: { name: 'Texas', rate: 0.016, surcharge: 0.001, assessment: 0.0007, municipal: 0, filing: 'Jun 30, 2026' },
  FL: { name: 'Florida', rate: 0.0175, surcharge: 0.0015, assessment: 0.0005, municipal: 0.005, filing: 'Apr 30, 2026' },
  CA: { name: 'California', rate: 0.0235, surcharge: 0.002, assessment: 0.001, municipal: 0, filing: 'Jun 30, 2026' },
  NY: { name: 'New York', rate: 0.02, surcharge: 0.0025, assessment: 0.0008, municipal: 0.003, filing: 'Jun 30, 2026' },
  IL: { name: 'Illinois', rate: 0.005, surcharge: 0.001, assessment: 0.0005, municipal: 0, filing: 'Mar 31, 2026' },
  OH: { name: 'Ohio', rate: 0.014, surcharge: 0.0005, assessment: 0.0006, municipal: 0.002, filing: 'Jun 30, 2026' },
  GA: { name: 'Georgia', rate: 0.0225, surcharge: 0.002, assessment: 0.001, municipal: 0, filing: 'Jun 30, 2026' },
  PA: { name: 'Pennsylvania', rate: 0.02, surcharge: 0.001, assessment: 0.0007, municipal: 0.001, filing: 'Jun 30, 2026' }
};

const JURIS_DATA = [
  { state: 'Texas', abbr: 'TX', lob: 'Property', premYTD: 4820000, premMTD: 1240000, premITD: 12400000, dateYM: '2026-05', status: 'Accrued' },
  { state: 'Florida', abbr: 'FL', lob: 'Auto', premYTD: 3610000, premMTD: 890000, premITD: 9300000, dateYM: '2026-05', status: 'Filed' },
  { state: 'California', abbr: 'CA', lob: 'Property', premYTD: 5240000, premMTD: 1380000, premITD: 13800000, dateYM: '2026-05', status: 'Accrued' },
  { state: 'New York', abbr: 'NY', lob: 'GL', premYTD: 2980000, premMTD: 760000, premITD: 7600000, dateYM: '2026-05', status: 'Pending' },
  { state: 'Illinois', abbr: 'IL', lob: 'Auto', premYTD: 1850000, premMTD: 490000, premITD: 4900000, dateYM: '2026-05', status: 'Accrued' },
  { state: 'Ohio', abbr: 'OH', lob: 'Property', premYTD: 1420000, premMTD: 360000, premITD: 3600000, dateYM: '2026-05', status: 'Accrued' },
  { state: 'Georgia', abbr: 'GA', lob: 'GL', premYTD: 2100000, premMTD: 540000, premITD: 5400000, dateYM: '2026-05', status: 'Pending' },
  { state: 'Pennsylvania', abbr: 'PA', lob: 'Marine', premYTD: 980000, premMTD: 260000, premITD: 2600000, dateYM: '2026-05', status: 'Filed' },
  { state: 'Texas', abbr: 'TX', lob: 'Auto', premYTD: 2340000, premMTD: 610000, premITD: 6200000, dateYM: '2026-04', status: 'Filed' },
  { state: 'Florida', abbr: 'FL', lob: 'Property', premYTD: 1760000, premMTD: 440000, premITD: 4400000, dateYM: '2026-04', status: 'Filed' },
  { state: 'California', abbr: 'CA', lob: 'Marine', premYTD: 870000, premMTD: 220000, premITD: 2200000, dateYM: '2026-03', status: 'Filed' },
  { state: 'New York', abbr: 'NY', lob: 'Auto', premYTD: 3120000, premMTD: 780000, premITD: 7800000, dateYM: '2026-03', status: 'Filed' },
  { state: 'Ohio', abbr: 'OH', lob: 'GL', premYTD: 620000, premMTD: 155000, premITD: 1550000, dateYM: '2025-12', status: 'Filed' },
  { state: 'Georgia', abbr: 'GA', lob: 'Property', premYTD: 1480000, premMTD: 370000, premITD: 3700000, dateYM: '2025-11', status: 'Overdue' },
  { state: 'Illinois', abbr: 'IL', lob: 'GL', premYTD: 740000, premMTD: 185000, premITD: 1850000, dateYM: '2025-10', status: 'Overdue' }
];

const PERIOD_STATS = {
  itd: { totalTax: '$1,842,500', jurisdictions: '8', avgRate: '1.94%', upcoming: '4 filings', taxTrend: '+12.4%', jTrend: '+1', rateTrend: '+0.1%', upTrend: 'Q2-Q4' },
  ytd: { totalTax: '$892,300', jurisdictions: '8', avgRate: '1.94%', upcoming: '2 filings', taxTrend: '+8.2%', jTrend: '0', rateTrend: '0.0%', upTrend: 'Q2-Q3' },
  mtd: { totalTax: '$224,100', jurisdictions: '6', avgRate: '1.91%', upcoming: '1 filing', taxTrend: '+5.1%', jTrend: '-1', rateTrend: '-0.2%', upTrend: 'Q2' }
};

export function PremiumTaxCalculatorPage() {
  const [period, setPeriod] = useState('ytd');
  const [filterLob, setFilterLob] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchState, setSearchState] = useState('');
  const [selectedRowIndex, setSelectedRowIndex] = useState(null);

  // Estimator fields
  const [estState, setEstState] = useState('TX');
  const [estLob, setEstLob] = useState('Property');
  const [estPremium, setEstPremium] = useState(1250000);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const getPremField = (row) => {
    if (period === 'mtd') return row.premMTD;
    if (period === 'ytd') return row.premYTD;
    return row.premITD;
  };

  const periodFilter = (row) => {
    if (period === 'mtd') return row.dateYM === '2026-05';
    if (period === 'ytd') return row.dateYM && row.dateYM.startsWith('2026');
    return true;
  };

  const calcTaxRow = (row) => {
    const sr = STATE_RATES[row.abbr] || { rate: 0.02, surcharge: 0.001, assessment: 0.0007, municipal: 0 };
    const prem = getPremField(row);
    const base = prem * sr.rate;
    const sur = prem * sr.surcharge;
    const asmnt = prem * sr.assessment;
    const muni = prem * sr.municipal;
    const total = base + sur + asmnt + muni;
    return { base, sur, asmnt, muni, total, prem, sr };
  };

  const filteredRows = useMemo(() => {
    const q = searchState.toLowerCase();
    return JURIS_DATA.filter(r => {
      if (!periodFilter(r)) return false;
      if (filterLob && r.lob !== filterLob) return false;
      if (filterStatus && r.status !== filterStatus) return false;
      if (q && !r.state.toLowerCase().includes(q) && !r.abbr.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [period, filterLob, filterStatus, searchState]);

  const { totalPrem, totalTax } = useMemo(() => {
    let pSum = 0;
    let tSum = 0;
    filteredRows.forEach(r => {
      const calc = calcTaxRow(r);
      pSum += calc.prem;
      tSum += calc.total;
    });
    return { totalPrem: pSum, totalTax: tSum };
  }, [filteredRows, period]);

  // Estimator Calculations
  const estCalc = useMemo(() => {
    const sr = STATE_RATES[estState] || { rate: 0.02, surcharge: 0.001, assessment: 0.0007, municipal: 0, filing: 'Jun 30, 2026' };
    const prem = parseFloat(estPremium) || 0;
    const base = prem * sr.rate;
    const fireSur = prem * sr.surcharge;
    const assess = prem * sr.assessment;
    const muni = prem * sr.municipal;
    const total = base + fireSur + assess + muni;
    const effRate = prem > 0 ? (total / prem * 100).toFixed(2) : '0.00';
    return { sr, base, fireSur, assess, muni, total, effRate };
  }, [estState, estPremium]);

  // Selected row for scenario comparison
  const selectedRowData = useMemo(() => {
    if (selectedRowIndex === null || !filteredRows[selectedRowIndex]) return null;
    const r = filteredRows[selectedRowIndex];
    const calc = calcTaxRow(r);
    const diff = estCalc.total - calc.total;
    return { ...r, calc, diff };
  }, [selectedRowIndex, filteredRows, estCalc.total]);

  // Rate comparison bars
  const rateCompareList = useMemo(() => {
    const seen = {};
    const unique = filteredRows.filter(r => {
      if (seen[r.abbr]) return false;
      seen[r.abbr] = true;
      return true;
    });
    const maxRate = Math.max(...unique.map(r => STATE_RATES[r.abbr]?.rate || 0.02));
    return unique.slice(0, 8).map(r => {
      const rate = STATE_RATES[r.abbr]?.rate || 0.02;
      const pct = (rate / maxRate * 100).toFixed(0);
      return { abbr: r.abbr, lob: r.lob, rate, pct };
    });
  }, [filteredRows]);

  const pStats = PERIOD_STATS[period];
  const periodLabel = period === 'mtd' ? 'MTD' : period === 'ytd' ? 'YTD' : 'All-time';

  const handleExportCSV = () => {
    const headers = ['State', 'Line', 'Tax Rate', 'Written Premium', 'Surcharges', 'Est. Tax', 'Status', 'Due Date'];
    const rows = filteredRows.map(r => {
      const c = calcTaxRow(r);
      return [
        r.state,
        r.lob,
        `${((STATE_RATES[r.abbr]?.rate || 0.02) * 100).toFixed(2)}%`,
        `$${Math.round(c.prem).toLocaleString()}`,
        `$${Math.round(c.sur + c.asmnt).toLocaleString()}`,
        `$${Math.round(c.total).toLocaleString()}`,
        r.status,
        STATE_RATES[r.abbr]?.filing || 'Jun 30, 2026'
      ];
    });
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `tax-allocations-${period}.csv`;
    link.click();
    showToast('Exported tax allocations CSV', 'success');
  };

  const handleExportEstimator = () => {
    showToast(`Exported calculation for ${estState}`, 'success');
  };

  const handleBookAccrual = () => {
    showToast(`Tax accrual of $${Math.round(estCalc.total).toLocaleString()} booked for ${estState} - Journal entry created`, 'success');
  };

  return (
    <>
      {toast && (
        <div className={`veridex-toast veridex-toast-${toast.type}`}>
          <span>{toast.type === 'error' ? '✕' : toast.type === 'warning' ? '⚠️' : '✓'}</span>
          <span>{toast.msg}</span>
        </div>
      )}

      {/* ═══ PAGE HEADER ═══ */}
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <div>
          <div className="page-title">Premium Tax Calculator</div>
          <div className="page-subtitle">Multi-state tax computation · Jurisdiction Allocations · Filing Calendar</div>
        </div>
        <div className="page-actions">
          <div className="period-toggle">
            <button
              className={`period-btn ${period === 'itd' ? 'active' : ''}`}
              onClick={() => setPeriod('itd')}
            >
              ITD
            </button>
            <button
              className={`period-btn ${period === 'ytd' ? 'active' : ''}`}
              onClick={() => setPeriod('ytd')}
            >
              YTD
            </button>
            <button
              className={`period-btn ${period === 'mtd' ? 'active' : ''}`}
              onClick={() => setPeriod('mtd')}
            >
              MTD
            </button>
          </div>
          <button className="btn btn-outline btn-sm" onClick={handleExportCSV}>
            Export CSV
          </button>
        </div>
      </div>

      {/* ═══ STAT CARDS ═══ */}
      <div className="ptc-stats">
        <div className="ptc-stat s-navy">
          <div className="ptc-stat-lbl">Total Tax Accrued ({periodLabel})</div>
          <div className="ptc-stat-val">{pStats.totalTax}</div>
          <div className="ptc-stat-sub">Across all jurisdictions</div>
          <span className="ptc-stat-badge up">{pStats.taxTrend} vs prior</span>
        </div>
        <div className="ptc-stat s-blue">
          <div className="ptc-stat-lbl">Jurisdictions Active</div>
          <div className="ptc-stat-val">{pStats.jurisdictions}</div>
          <div className="ptc-stat-sub">States with written premium</div>
          <span className={`ptc-stat-badge ${pStats.jTrend.startsWith('+') ? 'up' : 'down'}`}>
            {pStats.jTrend === '0' ? 'No change' : `${pStats.jTrend} vs prior`}
          </span>
        </div>
        <div className="ptc-stat s-green">
          <div className="ptc-stat-lbl">Avg Effective Rate</div>
          <div className="ptc-stat-val">{pStats.avgRate}</div>
          <div className="ptc-stat-sub">Blended across all states</div>
          <span className={`ptc-stat-badge ${pStats.rateTrend.startsWith('+') ? 'up' : 'down'}`}>
            {pStats.rateTrend} vs prior
          </span>
        </div>
        <div className="ptc-stat s-coral">
          <div className="ptc-stat-lbl">Upcoming Filings</div>
          <div className="ptc-stat-val">{pStats.upcoming}</div>
          <div className="ptc-stat-sub">{pStats.upTrend} due dates</div>
          <span className="ptc-stat-badge down">Action required</span>
        </div>
      </div>

      {/* ═══ MAIN 2-COL ═══ */}
      <div className="ptc-main">
        {/* LEFT: Tax Allocations by Jurisdiction */}
        <div className="ptc-panel">
          <div className="ptc-panel-hdr">
            <div className="ptc-panel-title">Tax Allocations by Jurisdiction</div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <select
                className="ptc-search"
                value={filterLob}
                onChange={(e) => setFilterLob(e.target.value)}
                style={{ width: '130px' }}
              >
                <option value="">All Lines</option>
                <option value="Auto">Auto</option>
                <option value="Property">Property</option>
                <option value="GL">General Liability</option>
                <option value="Marine">Marine</option>
              </select>
              <select
                className="ptc-search"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{ width: '120px' }}
              >
                <option value="">All Status</option>
                <option value="Accrued">Accrued</option>
                <option value="Pending">Pending</option>
                <option value="Filed">Filed</option>
                <option value="Overdue">Overdue</option>
              </select>
              <input
                className="ptc-search"
                placeholder="Search state..."
                value={searchState}
                onChange={(e) => setSearchState(e.target.value)}
              />
            </div>
          </div>
          <table className="ptc-table">
            <thead>
              <tr>
                <th>State</th>
                <th>Line</th>
                <th className="r">Tax Rate</th>
                <th className="r">Written Premium {periodLabel}</th>
                <th className="r">Surcharges</th>
                <th className="r">Estimated Tax Accrued</th>
                <th>Status</th>
                <th className="r">Due Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length > 0 ? (
                filteredRows.map((r, i) => {
                  const calc = calcTaxRow(r);
                  const isSelected = selectedRowIndex === i;
                  return (
                    <tr
                      key={i}
                      className={isSelected ? 'selected' : ''}
                      onClick={() => setSelectedRowIndex(i)}
                    >
                      <td>
                        <strong>{r.state}</strong>{' '}
                        <span style={{ fontSize: '10.5px', color: 'var(--color-muted, #94a3b8)' }}>{r.abbr}</span>
                      </td>
                      <td>{r.lob}</td>
                      <td className="r">{((STATE_RATES[r.abbr]?.rate || 0.02) * 100).toFixed(2)}%</td>
                      <td className="r">${Math.round(calc.prem).toLocaleString()}</td>
                      <td className="r">${Math.round(calc.sur + calc.asmnt).toLocaleString()}</td>
                      <td className="r" style={{ fontWeight: 600, color: '#0d1b4b' }}>
                        ${Math.round(calc.total).toLocaleString()}
                      </td>
                      <td>
                        <span className={`ptc-status ${r.status.toLowerCase()}`}>
                          {r.status === 'Accrued' ? 'Accrued & Reconciled' : r.status}
                        </span>
                      </td>
                      <td className="r" style={{ fontSize: '11.5px' }}>
                        {STATE_RATES[r.abbr]?.filing || 'Jun 30, 2026'}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: 'var(--color-muted, #94a3b8)' }}>
                    No results for current filters
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="3">
                  <strong>Total ({filteredRows.length} jurisdictions)</strong>
                </td>
                <td className="r">
                  <strong>${Math.round(totalPrem).toLocaleString()}</strong>
                </td>
                <td className="r"> - </td>
                <td className="r">
                  <strong>${Math.round(totalTax).toLocaleString()}</strong>
                </td>
                <td colSpan="2"></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* RIGHT: Premium Tax Estimator */}
        <div className="ptc-estimator">
          <div className="ptc-est-hdr">
            <div className="ptc-est-title">Premium Tax Estimator</div>
            <div className="ptc-est-sub">Real-time single-state calculation</div>
          </div>
          <div className="ptc-est-body">
            <div className="ptc-field">
              <div className="ptc-lbl">State Jurisdiction</div>
              <select
                className="ptc-select"
                value={estState}
                onChange={(e) => setEstState(e.target.value)}
              >
                <option value="TX">Texas (TX)</option>
                <option value="FL">Florida (FL)</option>
                <option value="CA">California (CA)</option>
                <option value="NY">New York (NY)</option>
                <option value="IL">Illinois (IL)</option>
                <option value="OH">Ohio (OH)</option>
                <option value="GA">Georgia (GA)</option>
                <option value="PA">Pennsylvania (PA)</option>
              </select>
            </div>

            <div className="ptc-field">
              <div className="ptc-lbl">Line of Business</div>
              <select
                className="ptc-select"
                value={estLob}
                onChange={(e) => setEstLob(e.target.value)}
              >
                <option value="Auto">Auto (Private Passenger)</option>
                <option value="Property">Property</option>
                <option value="GL">General Liability</option>
                <option value="Marine">Marine</option>
              </select>
            </div>

            <div className="ptc-field">
              <div className="ptc-lbl">Direct Written Premium ($)</div>
              <input
                className="ptc-input"
                type="number"
                value={estPremium}
                onChange={(e) => setEstPremium(Number(e.target.value))}
              />
            </div>

            <div className="ptc-rate-display">
              <div className="ptc-rate-lbl">Statutory Tax Rate</div>
              <div className="ptc-rate-val">{(estCalc.sr.rate * 100).toFixed(2)}%</div>
            </div>

            <div className="ptc-section-lbl">Liability Breakdown</div>

            <div className="ptc-result-box">
              <div className="ptc-result-row">
                <span className="ptc-result-lbl">Base Premium Tax</span>
                <span className="ptc-result-val">${Math.round(estCalc.base).toLocaleString()}</span>
              </div>
              <div className="ptc-result-row">
                <span className="ptc-result-lbl">Fire Marshal Surcharge</span>
                <span className="ptc-result-val">${Math.round(estCalc.fireSur).toLocaleString()}</span>
              </div>
              <div className="ptc-result-row">
                <span className="ptc-result-lbl">State Assessment</span>
                <span className="ptc-result-val">${Math.round(estCalc.assess).toLocaleString()}</span>
              </div>
              <div className="ptc-result-row">
                <span className="ptc-result-lbl">Municipal Tax</span>
                <span className="ptc-result-val">${Math.round(estCalc.muni).toLocaleString()}</span>
              </div>
              <div className="ptc-result-row total">
                <span className="ptc-result-lbl">Estimated Tax Liability</span>
                <span className="ptc-result-val">${Math.round(estCalc.total).toLocaleString()}</span>
              </div>
            </div>

            <div style={{ fontSize: '11px', color: 'var(--color-muted, #94a3b8)', marginBottom: '12px' }}>
              Effective rate: <strong style={{ color: '#0d1b4b' }}>{estCalc.effRate}%</strong> &nbsp;·&nbsp; Next filing:{' '}
              <strong style={{ color: '#e05470' }}>{estCalc.sr.filing}</strong>
            </div>

            <button className="ptc-book-btn" onClick={handleBookAccrual}>
              Book Tax Accrual
            </button>
            <button className="ptc-export-btn" onClick={handleExportEstimator}>
              Export Calculation
            </button>

            <div className="ptc-section-lbl" style={{ marginTop: '16px' }}>
              Scenario Comparison
            </div>
            {selectedRowData ? (
              <div>
                <div className="ptc-result-row" style={{ fontSize: '12px' }}>
                  <span className="ptc-result-lbl">{selectedRowData.state} ({selectedRowData.abbr}) - {selectedRowData.lob}</span>
                  <span className="ptc-result-val">${Math.round(selectedRowData.calc.total).toLocaleString()}</span>
                </div>
                <div className="ptc-result-row" style={{ fontSize: '12px' }}>
                  <span className="ptc-result-lbl">Current (Estimator: {estState})</span>
                  <span className="ptc-result-val">${Math.round(estCalc.total).toLocaleString()}</span>
                </div>
                <div className="ptc-result-row" style={{ fontSize: '12px', color: 'var(--color-muted, #64748b)' }}>
                  <span>Difference</span>
                  <span style={{ fontWeight: 700, color: selectedRowData.diff >= 0 ? '#c62828' : '#2e7d32' }}>
                    {selectedRowData.diff >= 0 ? '+' : ''}${Math.round(selectedRowData.diff).toLocaleString()}
                  </span>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '12px', color: 'var(--color-muted, #64748b)', textAlign: 'center', padding: '10px 0' }}>
                Select a row in the table to compare jurisdictions
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ BOTTOM DETAIL ROW ═══ */}
      <div className="ptc-detail">
        {/* State Tax Rate Comparison bars */}
        <div className="ptc-detail-card">
          <div className="ptc-detail-hdr">
            State Rate Comparison
            <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--color-muted, #94a3b8)' }}>
              Top active jurisdictions
            </span>
          </div>
          <div className="ptc-detail-body">
            {rateCompareList.map((item, idx) => (
              <div key={idx} className="ptc-bar-row">
                <div className="ptc-bar-state">{item.abbr} - {item.lob.substring(0, 4)}</div>
                <div className="ptc-bar-track">
                  <div
                    className="ptc-bar-fill"
                    style={{
                      width: `${item.pct}%`,
                      background: item.rate > 0.02 ? '#e05470' : '#0d1b4b'
                    }}
                  />
                </div>
                <div className="ptc-bar-pct">{(item.rate * 100).toFixed(2)}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* Filing Calendar */}
        <div className="ptc-detail-card">
          <div className="ptc-detail-hdr">
            Filing Calendar 2026
            <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--color-muted, #94a3b8)' }}>
              Quarterly due dates
            </span>
          </div>
          <div className="ptc-detail-body">
            <div className="ptc-cal-grid">
              <div className="ptc-cal-item paid">
                <div className="ptc-cal-q">Q1 2026</div>
                <div className="ptc-cal-due">Due: Mar 31, 2026</div>
                <div className="ptc-cal-amt">$284,150</div>
                <span className="ptc-cal-badge paid">Filed</span>
              </div>
              <div className="ptc-cal-item due">
                <div className="ptc-cal-q">Q2 2026</div>
                <div className="ptc-cal-due">Due: Jun 30, 2026</div>
                <div className="ptc-cal-amt">${Math.round(totalTax).toLocaleString()}</div>
                <span className="ptc-cal-badge due">Due Soon</span>
              </div>
              <div className="ptc-cal-item upcoming">
                <div className="ptc-cal-q">Q3 2026</div>
                <div className="ptc-cal-due">Due: Sep 30, 2026</div>
                <div className="ptc-cal-amt">$310,000 (Est)</div>
                <span className="ptc-cal-badge upcoming">Upcoming</span>
              </div>
              <div className="ptc-cal-item upcoming">
                <div className="ptc-cal-q">Q4 2026</div>
                <div className="ptc-cal-due">Due: Dec 31, 2026</div>
                <div className="ptc-cal-amt">$335,000 (Est)</div>
                <span className="ptc-cal-badge upcoming">Upcoming</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
export default PremiumTaxCalculatorPage;
