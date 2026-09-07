import React, { useState, useMemo } from 'react';
import './multi-currency-fx.css';

const INITIAL_RATES = [
  { pair: 'EUR/USD', type: 'Spot', rate: '1.084500', source: 'OER', date: '2026-08-20' },
  { pair: 'GBP/USD', type: 'Spot', rate: '1.271800', source: 'Fixer.io', date: '2026-08-20' },
  { pair: 'USD/JPY', type: 'Spot', rate: '148.320000', source: 'ECB', date: '2026-08-20' },
  { pair: 'EUR/USD', type: 'Average', rate: '1.079200', source: 'ECB', date: '2026-08-01' },
  { pair: 'GBP/USD', type: 'Average', rate: '1.264900', source: 'OER', date: '2026-08-01' },
  { pair: 'USD/CAD', type: 'Closing', rate: '1.362700', source: 'Fixer.io', date: '2026-07-31' },
  { pair: 'AUD/USD', type: 'Closing', rate: '0.658400', source: 'OER', date: '2026-07-31' },
  { pair: 'USD/CHF', type: 'Spot', rate: '0.879100', source: 'ECB', date: '2026-08-20' },
];

const INITIAL_GL = [
  { ref: 'INV-10042', ccy: 'EUR', orig: '€48,200.00', txnAmt: 52296.24, curAmt: 52299.69, gl: 3.45 },
  { ref: 'INV-10058', ccy: 'GBP', orig: '£31,000.00', txnAmt: 39221.90, curAmt: 39425.80, gl: 203.90 },
  { ref: 'BILL-8821', ccy: 'JPY', orig: '¥6,400,000', txnAmt: 43241.11, curAmt: 43152.87, gl: -88.24 },
  { ref: 'INV-10071', ccy: 'CAD', orig: 'C$18,500.00', txnAmt: 13580.00, curAmt: 13580.00, gl: 0.00 },
  { ref: 'BILL-8834', ccy: 'AUD', orig: 'A$22,100.00', txnAmt: 14550.20, curAmt: 14547.44, gl: -2.76 },
  { ref: 'INV-10083', ccy: 'GBP', orig: '£9,750.00', txnAmt: 12331.05, curAmt: 12400.05, gl: 69.00 },
  { ref: 'BILL-8850', ccy: 'CHF', orig: 'CHF 15,300.00', txnAmt: 17432.10, curAmt: 17406.02, gl: -26.08 },
  { ref: 'INV-10091', ccy: 'EUR', orig: '€61,000.00', txnAmt: 66127.30, curAmt: 66154.73, gl: 27.43 },
];

const RATE_TYPE_BADGE = { Spot: 'badge-blue', Average: 'badge-orange', Closing: 'badge-navy' };

export function MultiCurrencyFxPage() {
  const [rates, setRates] = useState(INITIAL_RATES);
  const [glRows] = useState(INITIAL_GL);
  const [searchRate, setSearchRate] = useState('');
  const [unrealizedGL, setUnrealizedGL] = useState(186.70);
  const [lastRevalDate, setLastRevalDate] = useState('Jul 31, 2026');
  const [multiCurrencyEnabled, setMultiCurrencyEnabled] = useState(true);

  // Add Rate fields
  const [pair, setPair] = useState('EUR/USD');
  const [rateType, setRateType] = useState('Spot');
  const [rateVal, setRateVal] = useState('');
  const [source, setSource] = useState('OER');
  const [effectiveDate, setEffectiveDate] = useState('2026-08-20');

  // Revaluation State
  const [isRevalRunning, setIsRevalRunning] = useState(false);
  const [revalLogs, setRevalLogs] = useState([]);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const filteredRates = useMemo(() => {
    if (!searchRate) return rates;
    const q = searchRate.toLowerCase();
    return rates.filter(r => r.pair.toLowerCase().includes(q) || r.type.toLowerCase().includes(q) || r.source.toLowerCase().includes(q));
  }, [rates, searchRate]);

  const activeCurrenciesCount = useMemo(() => {
    const cSet = new Set(glRows.map(r => r.ccy));
    cSet.add('USD');
    return cSet.size;
  }, [glRows]);

  const handleAddRate = (e) => {
    e.preventDefault();
    const val = parseFloat(rateVal);
    if (!val || val <= 0) {
      showToast('Enter a valid rate value', 'error');
      return;
    }
    const newEntry = {
      pair,
      type: rateType,
      rate: val.toFixed(6),
      source,
      date: effectiveDate
    };
    setRates([newEntry, ...rates]);
    setRateVal('');
    showToast(`Rate added - ${pair} ${rateType} @ ${val.toFixed(6)}`, 'success');
  };

  const handleRunRevaluation = () => {
    setIsRevalRunning(true);
    setRevalLogs([]);

    const steps = [
      { msg: 'Fetching current closing rates…', delay: 400 },
      { msg: 'Recalculating unrealized G/L on open AR/AP balances…', delay: 1200 },
      { msg: 'Posting revaluation journal entry to General Ledger…', delay: 2000 },
      { msg: 'Revaluation complete - Account 7100 posted', delay: 2800, type: 'success' }
    ];

    steps.forEach((step) => {
      setTimeout(() => {
        showToast(step.msg, step.type || 'info');
        setRevalLogs(prev => [...prev, step.msg]);
      }, step.delay);
    });

    setTimeout(() => {
      const delta = Math.round((Math.random() * 400 - 150) * 100) / 100;
      setUnrealizedGL(prev => Math.round((prev + delta) * 100) / 100);
      setLastRevalDate('Aug 20, 2026');
      setIsRevalRunning(false);
    }, 3100);
  };

  const fmtSigned = (n) => {
    const sign = n > 0 ? '+' : n < 0 ? '−' : '';
    return sign + '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
      <div className="page-header">
        <div>
          <div className="page-title">Multi-Currency &amp; FX</div>
          <div className="page-subtitle">
            Rate tables, realized/unrealized gain-loss, and month-end revaluation
          </div>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline btn-sm" onClick={() => showToast('Exporting FX rate history...', 'info')}>
            Export Rate History
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => showToast('Please enter new rate in the form below', 'info')}>
            + Add Rate
          </button>
        </div>
      </div>

      {/* ═══ STAT CARDS ═══ */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon si-navy">🏦</div>
          <div className="stat-info">
            <div className="stat-value">USD</div>
            <div className="stat-label">Functional Currency</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon si-coral">🌐</div>
          <div className="stat-info">
            <div className="stat-value">{activeCurrenciesCount}</div>
            <div className="stat-label">Currencies Active</div>
          </div>
        </div>
        <div className="stat-card">
          <div className={`stat-icon ${unrealizedGL >= 0 ? 'si-green' : 'si-orange'}`}>📈</div>
          <div className="stat-info">
            <div className="stat-value" style={{ color: unrealizedGL >= 0 ? '#2e7d32' : '#c62828' }}>
              {fmtSigned(unrealizedGL)}
            </div>
            <div className="stat-label">Unrealized Gain/Loss (YTD)</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon si-navy">🕓</div>
          <div className="stat-info">
            <div className="stat-value" style={{ fontSize: '16px' }}>{lastRevalDate}</div>
            <div className="stat-label">Last Revaluation Run</div>
          </div>
        </div>
      </div>

      {/* ═══ ADD RATE FORM ═══ */}
      <div className="card" style={{ padding: '18px 20px', marginBottom: '16px' }}>
        <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0d1b4b', marginBottom: '14px' }}>
          Add FX Rate
        </div>
        <form onSubmit={handleAddRate}>
          <div className="fx-add-row">
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label className="field-label">Currency Pair</label>
              <select className="field-input" value={pair} onChange={(e) => setPair(e.target.value)}>
                <option value="EUR/USD">EUR / USD</option>
                <option value="GBP/USD">GBP / USD</option>
                <option value="USD/JPY">USD / JPY</option>
                <option value="USD/CAD">USD / CAD</option>
                <option value="AUD/USD">AUD / USD</option>
                <option value="USD/CHF">USD / CHF</option>
                <option value="USD/MXN">USD / MXN</option>
              </select>
            </div>
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label className="field-label">Rate Type</label>
              <select className="field-input" value={rateType} onChange={(e) => setRateType(e.target.value)}>
                <option value="Spot">Spot</option>
                <option value="Average">Average</option>
                <option value="Closing">Closing</option>
              </select>
            </div>
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label className="field-label">Rate</label>
              <input
                className="field-input"
                type="number"
                step="0.000001"
                placeholder="1.084500"
                value={rateVal}
                onChange={(e) => setRateVal(e.target.value)}
                required
              />
            </div>
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label className="field-label">Source</label>
              <select className="field-input" value={source} onChange={(e) => setSource(e.target.value)}>
                <option value="OER">OER (Open Exchange Rates)</option>
                <option value="Fixer.io">Fixer.io</option>
                <option value="ECB">ECB Reference Rate</option>
                <option value="Manual">Manual Entry</option>
              </select>
            </div>
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label className="field-label">Effective Date</label>
              <input
                className="field-input"
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary btn-sm">
              Add Rate
            </button>
          </div>
        </form>
      </div>

      {/* ═══ REINSURANCE CALLOUT ═══ */}
      <div className="fx-callout">
        <span className="fx-callout-icon">ℹ️</span>
        <span>
          Lloyd's-style reinsurance markets typically settle in both USD and GBP under a single treaty; ceded premium and loss cession entries here are automatically tagged with the treaty's settlement currency so Reinsurance Accounting can reconcile against the correct FX basis.
        </span>
      </div>

      {/* ═══ FX RATE TABLE ═══ */}
      <div className="table-wrap" style={{ marginBottom: '20px' }}>
        <div className="table-head-row">
          <div className="table-head-title">FX Rate Table</div>
          <div className="table-head-actions">
            <input
              className="filter-input"
              placeholder="Search rates…"
              value={searchRate}
              onChange={(e) => setSearchRate(e.target.value)}
            />
          </div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Currency Pair</th>
              <th>Rate Type</th>
              <th>Rate</th>
              <th>Source</th>
              <th>Effective Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredRates.map((r, i) => (
              <tr key={i}>
                <td><strong>{r.pair}</strong></td>
                <td><span className={`badge ${RATE_TYPE_BADGE[r.type] || 'badge-gray'}`}>{r.type}</span></td>
                <td style={{ fontFamily: 'var(--font-mono)' }}>{r.rate}</td>
                <td>{r.source}</td>
                <td>{r.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ═══ REALIZED / UNREALIZED GAIN-LOSS ═══ */}
      <div className="table-wrap" style={{ marginBottom: '20px' }}>
        <div className="table-head-row">
          <div className="table-head-title">Realized &amp; Unrealized Gain / Loss</div>
          <div className="table-head-actions">
            <button className="btn btn-outline btn-sm" onClick={() => showToast('Exporting gain/loss detail...', 'info')}>
              Export CSV
            </button>
          </div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Transaction Ref</th>
              <th>Currency</th>
              <th>Original Amount</th>
              <th style={{ textAlign: 'right' }}>Functional Amount @ Txn Rate</th>
              <th style={{ textAlign: 'right' }}>Functional Amount @ Current Rate</th>
              <th>Gain / Loss</th>
            </tr>
          </thead>
          <tbody>
            {glRows.map((r) => {
              const isGain = r.gl > 0;
              const isFlat = r.gl === 0;
              const badgeCls = isFlat ? 'badge-gray' : isGain ? 'badge-green' : 'badge-red';
              const label = isFlat ? 'Flat' : (isGain ? '+' : '') + '$' + r.gl.toFixed(2);
              return (
                <tr key={r.ref}>
                  <td><strong>{r.ref}</strong></td>
                  <td>{r.ccy}</td>
                  <td>{r.orig}</td>
                  <td style={{ textAlign: 'right' }}>${r.txnAmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td style={{ textAlign: 'right' }}>${r.curAmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td><span className={`badge ${badgeCls}`}>{label}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ═══ REVALUATION RUN ═══ */}
      <div className="card" style={{ marginBottom: '20px', padding: '18px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div className="card-title">Month-End Revaluation</div>
          <span className="badge badge-navy">Period: August 2026</span>
        </div>
        <div className="fx-run-panel">
          <div className="fx-run-desc">
            Recalculates unrealized gain/loss for all open foreign-currency balances against the latest closing rates, then posts the revaluation journal entry to the functional-currency ledger. Run once per close cycle.
          </div>
          <button
            className="btn btn-primary"
            disabled={isRevalRunning}
            onClick={handleRunRevaluation}
          >
            {isRevalRunning ? 'Running…' : 'Run Month-End Revaluation'}
          </button>
        </div>
        {revalLogs.length > 0 && (
          <div className="fx-run-log">
            {revalLogs.map((log, idx) => (
              <div key={idx} className="fx-run-log-item">
                <span className="dot" />
                <span>{log}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══ MULTI-CURRENCY TOGGLE ═══ */}
      <div className="card" style={{ marginBottom: '20px', padding: '18px 20px' }}>
        <div className="fx-toggle-card">
          <div className="fx-toggle-left">
            <div className="fx-toggle-title">Multi-Currency Capability</div>
            <div className="fx-toggle-note">
              Enabling Multi-Currency exposes currency fields across AR, AP, and GL - every invoice, bill, and journal line gains a transaction-currency selector alongside the functional-currency amount.
            </div>
          </div>
          <div className="fx-toggle-right">
            <span className="fx-toggle-state" style={{ color: multiCurrencyEnabled ? '#0f6e63' : '#94a3b8' }}>
              {multiCurrencyEnabled ? 'Enabled' : 'Disabled'}
            </span>
            <button
              className={`btn btn-sm ${multiCurrencyEnabled ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => {
                const next = !multiCurrencyEnabled;
                setMultiCurrencyEnabled(next);
                showToast(next ? 'Multi-Currency enabled across AR, AP and GL' : 'Multi-Currency disabled', next ? 'success' : 'warning');
              }}
            >
              Toggle {multiCurrencyEnabled ? 'Off' : 'On'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
export default MultiCurrencyFxPage;
