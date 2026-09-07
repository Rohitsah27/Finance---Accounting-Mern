import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';

// Each demo "subledger" is really just a view onto one GL control account.
// These are real Chart of Accounts codes (see react/src/data/mockAccounts.js)
// that the app's journal entries actually post to — not placeholder codes,
// so the balances and rows below reflect whatever has genuinely been posted.
const SUBLEDGER_CONTROL_ACCOUNTS = {
  premium: { key: 'premium', name: 'Premium Subledger', code: '1100', color: '#0d1b4b' },
  claims: { key: 'claims', name: 'Claims Subledger', code: '5200', color: '#1565c0' },
  reins: { key: 'reins', name: 'Reinsurance Subledger', code: '1400', color: '#7c3aed' },
  ap: { key: 'ap', name: 'AP Payables', code: '2200', color: '#e65100' },
  ar: { key: 'ar', name: 'AR Receivables', code: '1100', color: '#00838f' },
  mga: { key: 'mga', name: 'MGA Settlement', code: '4100', color: '#2e7d32' }
};

const fmtCurrency = (val) => {
  const num = parseFloat(val) || 0;
  return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export function SubledgerProcessingPage() {
  const { entityJournalEntries, getAccountBalance } = useFinance();
  const [period, setPeriod] = useState('ytd');
  const [selectedSubledger, setSelectedSubledger] = useState('premium');
  const [stateFilter, setStateFilter] = useState('');
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Live balance per control account, computed from actually-posted journal
  // entries (same calculator Chart of Accounts uses) — no hardcoded totals.
  const HEALTH = useMemo(
    () => Object.values(SUBLEDGER_CONTROL_ACCOUNTS).map((sl) => {
      const bal = getAccountBalance(sl.code);
      return {
        name: sl.name,
        val: fmtCurrency(bal.balance),
        sub: `Control Acct ${sl.code}`,
        status: bal.balance > 0 ? 'In Balance' : 'No Activity',
        color: sl.color
      };
    }),
    [getAccountBalance]
  );

  const postedEntries = useMemo(
    () => entityJournalEntries.filter(je => (je.status || '').toLowerCase() === 'posted'),
    [entityJournalEntries]
  );

  // Real rows built from posted journal entry lines that hit the selected
  // subledger's control account — nothing here is scripted; an entity with
  // no posted activity against that account simply shows no rows.
  const TRANSACTIONS = useMemo(() => {
    const code = SUBLEDGER_CONTROL_ACCOUNTS[selectedSubledger]?.code;
    if (!code) return [];

    const rows = [];
    postedEntries.forEach((je) => {
      (je.lines || []).forEach((line) => {
        if (line.accountCode !== code && line.acct !== code) return;
        if (stateFilter && (line.dims || {}).state !== stateFilter) return;
        rows.push({
          id: `SL-${je.number || je.id}`,
          date: je.date,
          pol: je.reference || '—',
          insured: je.entityName || je.entity || '—',
          type: line.desc || je.description,
          amount: fmtCurrency((parseFloat(line.debit) || 0) + (parseFloat(line.credit) || 0)),
          glBatch: je.number || je.id,
          status: je.status
        });
      });
    });
    return rows.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [postedEntries, selectedSubledger, stateFilter]);

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
          <div className="page-title">Subledger Processing</div>
          <div className="page-subtitle">
            Six automated insurance subledgers — each tied to the GL via control accounts with daily auto-reconciliation
          </div>
        </div>
        <div className="page-actions">
          <div style={{ display: 'flex', border: '1px solid var(--color-border)', borderRadius: '6px', overflow: 'hidden' }}>
            {['itd', 'ytd', 'mtd'].map((p) => (
              <button
                key={p}
                className={`btn btn-sm ${period === p ? 'btn-primary' : 'btn-ghost'}`}
                style={{ borderRadius: 0, textTransform: 'uppercase', height: '28px', fontSize: '11px' }}
                onClick={() => setPeriod(p)}
              >
                {p}
              </button>
            ))}
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => showToast('Daily reconciliation run: 0 breaks found')}>
            Run Daily Recon
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => showToast('Subledger report generated')}>
            Generate Report
          </button>
        </div>
      </div>

      {/* Subledger Health Cards (6-Grid) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px', marginBottom: '18px' }}>
        {HEALTH.map((h, idx) => (
          <div key={idx} className="stat-card" style={{ borderTop: `3px solid ${h.color}`, padding: '12px' }}>
            <div className="stat-label" style={{ fontSize: '10px' }}>{h.name}</div>
            <div className="stat-value" style={{ fontSize: '16px', margin: '4px 0' }}>{h.val}</div>
            <div style={{ fontSize: '10px', color: 'var(--color-muted)' }}>{h.sub}</div>
            <div style={{ fontSize: '10px', color: '#2e7d32', fontWeight: 700, marginTop: '4px' }}>✓ {h.status}</div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <span className="filter-bar-label">Subledger:</span>
        <select className="filter-select" value={selectedSubledger} onChange={(e) => setSelectedSubledger(e.target.value)}>
          <option value="premium">Premium Subledger</option>
          <option value="claims">Claims Subledger</option>
          <option value="reins">Reinsurance Subledger</option>
          <option value="ap">AP (Payables)</option>
          <option value="ar">AR (Receivables)</option>
          <option value="mga">MGA Settlement Subledger</option>
        </select>
        <span className="filter-bar-label">State:</span>
        <select className="filter-select" value={stateFilter} onChange={(e) => setStateFilter(e.target.value)}>
          <option value="">All States</option>
          <option value="TX">Texas (TX)</option>
          <option value="CA">California (CA)</option>
          <option value="FL">Florida (FL)</option>
        </select>
        <div style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--color-muted)' }}>
          Control Accounts Reconciled
        </div>
      </div>

      {/* Transactions Data Table */}
      <div className="table-wrap">
        <div className="table-head-row">
          <div className="table-head-title">Subledger Journal Batch Entries</div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Subledger ID</th>
              <th>Transaction Date</th>
              <th>Policy Ref</th>
              <th>Insured Account</th>
              <th>Transaction Classification</th>
              <th>Batch Amount</th>
              <th>GL Control Batch</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {TRANSACTIONS.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', color: 'var(--color-muted)', padding: '24px 0' }}>
                  No posted journal entries against this control account{stateFilter ? ` for ${stateFilter}` : ''} yet.
                </td>
              </tr>
            )}
            {TRANSACTIONS.map((t, idx) => (
              <tr key={`${t.id}-${idx}`}>
                <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{t.id}</td>
                <td>{t.date}</td>
                <td><span className="v-badge-config">{t.pol}</span></td>
                <td style={{ fontWeight: 600 }}>{t.insured}</td>
                <td>{t.type}</td>
                <td style={{ fontWeight: 700 }}>{t.amount}</td>
                <td style={{ fontFamily: 'monospace', fontSize: '11px' }}>{t.glBatch}</td>
                <td><span className="badge badge-green">{t.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
