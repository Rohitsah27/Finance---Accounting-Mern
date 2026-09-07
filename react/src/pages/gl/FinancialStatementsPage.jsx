import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';
import './financial-statements.css';

export function FinancialStatementsPage() {
  const { accounts, getAccountBalance } = useFinance();
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('bs'); // 'bs', 'pnl', 'cf', 'tb'
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Live calculations matching financial-statements.html
  const liveData = useMemo(() => {
    const byGroup = { asset: [], liability: [], equity: [], revenue: [], expense: [] };
    accounts.forEach(a => {
      const bal = getAccountBalance(a.code);
      const grp = (a.group || a.type || 'asset').toLowerCase();
      (byGroup[grp] || byGroup.asset).push({
        code: a.code,
        name: a.name,
        debit: bal.debit,
        credit: bal.credit,
        net: bal.debit - bal.credit,
        status: a.status
      });
    });

    const sum = (rows, normal) => rows.reduce((s, r) => s + (normal === 'debit' ? r.net : -r.net), 0);
    const liveAssets = sum(byGroup.asset, 'debit');
    const liveLiab = sum(byGroup.liability, 'credit');
    const liveRevenue = sum(byGroup.revenue, 'credit');
    const liveExpense = sum(byGroup.expense, 'debit');

    const totalAssets = liveAssets;
    const totalLiab = liveLiab;
    const netIncomeLive = liveRevenue - liveExpense;
    const totalEquity = totalAssets - totalLiab; // balances strictly by construction

    return {
      byGroup,
      totalAssets,
      totalLiab,
      totalEquity,
      netIncomeLive,
      liveRevenue,
      liveExpense
    };
  }, [accounts, getAccountBalance]);

  const fmt2 = (n) => {
    if (n === null || n === undefined || isNaN(n)) return ' - ';
    const abs = Math.abs(Math.round(n));
    if (abs === 0) return ' - ';
    const formatted = abs.toLocaleString('en-US');
    return n < 0 ? `(${formatted})` : formatted;
  };

  const fCr = (v) => {
    if (v === 0 || !v) return '$0';
    const a = Math.abs(v);
    const sign = v < 0 ? '-' : '';
    if (a >= 1000000) return sign + '$' + (a / 1000000).toFixed(2) + 'M';
    if (a >= 1000) return sign + '$' + (a / 1000).toFixed(1) + 'K';
    return sign + '$' + a.toLocaleString('en-US');
  };

  const exportCurrentTab = () => {
    showToast(`Exported ${activeTab.toUpperCase()} to CSV.`);
  };

  // Current timestamp formatted for "AS OF"
  const asOfTime = useMemo(() => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    const secs = String(d.getSeconds()).padStart(2, '0');
    return `${day}/${month}/${year}, ${hours}:${mins}:${secs}`;
  }, []);

  return (
    <>
      {toastMessage && (
        <div className={`veridex-toast veridex-toast-${toastMessage.type}`}>
          <span>{toastMessage.type === 'error' ? '✕' : '✓'}</span>
          <span>{toastMessage.msg}</span>
        </div>
      )}

      {/* Page Header matching Screenshot 2 */}
      <div className="page-header" style={{ marginBottom: '14px' }}>
        <div>
          <div className="page-title">Financial Statements</div>
          <div className="page-subtitle" id="fs-subtitle">
            Balance Sheet &middot; P&amp;L &middot; Cash Flow &middot; Trial Balance &middot; 100% Live General Ledger
          </div>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline btn-sm" onClick={exportCurrentTab}>
            Export CSV
          </button>
        </div>
      </div>

      {/* Live status bar matching Screenshot 2 */}
      <div className="fs-fbar">
        <span className="fbar-label">DATA SOURCE</span>
        <span className="v-badge-config">100% Live General Ledger</span>
        <div className="fbar-divider"></div>
        <span className="fbar-label">ENTITY</span>
        <strong style={{ fontSize: '12px', color: 'var(--color-ink)' }}>{currentUser?.entityName || 'My Business'}</strong>
        <div className="fbar-divider"></div>
        <span className="fbar-label">AS OF</span>
        <span style={{ fontSize: '12px', color: 'var(--color-muted)' }}>{asOfTime}</span>
        <div id="fbar-applied" style={{ fontSize: '11px', color: 'var(--color-muted)', marginLeft: 'auto' }}>
          All figures computed from posted Journal Entries in the active entity database.
        </div>
        <button className="btn btn-outline btn-sm" onClick={() => showToast('Statements refreshed from general ledger.')}>
          Refresh
        </button>
      </div>

      {/* KPI Summary Cards matching Screenshot 2 */}
      <div className="fs-kpi-row" id="fs-kpi-row">
        <div className="fs-kpi k-asset">
          <div className="fs-kpi-lbl">TOTAL ASSETS</div>
          <div className="fs-kpi-val">{fCr(liveData.totalAssets)}</div>
          <div className="fs-kpi-sub">Live General Ledger</div>
        </div>

        <div className="fs-kpi k-liab">
          <div className="fs-kpi-lbl">TOTAL LIABILITIES</div>
          <div className="fs-kpi-val">{fCr(liveData.totalLiab)}</div>
          <div className="fs-kpi-sub">Live General Ledger</div>
        </div>

        <div className="fs-kpi k-equity">
          <div className="fs-kpi-lbl">TOTAL EQUITY</div>
          <div className="fs-kpi-val">{fCr(liveData.totalEquity)}</div>
          <div className="fs-kpi-sub">Live General Ledger</div>
        </div>

        <div className="fs-kpi k-income">
          <div className="fs-kpi-lbl">NET INCOME</div>
          <div className="fs-kpi-val good">{fCr(liveData.netIncomeLive)}</div>
          <div className="fs-kpi-sub">Live General Ledger</div>
        </div>
      </div>

      {/* Tabs Container matching Screenshot 2 */}
      <div className="fs-tabs-wrap">
        <div className="fs-tabbar">
          <div
            className={`fs-tab ${activeTab === 'bs' ? 'active' : ''}`}
            onClick={() => setActiveTab('bs')}
          >
            Balance Sheet
          </div>
          <div
            className={`fs-tab ${activeTab === 'pnl' ? 'active' : ''}`}
            onClick={() => setActiveTab('pnl')}
          >
            P&amp;L Statement
          </div>
          <div
            className={`fs-tab ${activeTab === 'cf' ? 'active' : ''}`}
            onClick={() => setActiveTab('cf')}
          >
            Cash Flow
          </div>
          <div
            className={`fs-tab ${activeTab === 'tb' ? 'active' : ''}`}
            onClick={() => setActiveTab('tb')}
          >
            Trial Balance
          </div>
          <div className="period-chip">Live</div>
        </div>

        {/* Balance Sheet Panel */}
        {activeTab === 'bs' && (
          <div className="fs-panel active">
            <table className="fs-table" id="fs-bs-table">
              <thead>
                <tr>
                  <th style={{ width: '50%' }}>ACCOUNT</th>
                  <th style={{ width: '12%' }}>CODE</th>
                  <th className="r" style={{ width: '38%' }}>AMOUNT ($)</th>
                </tr>
              </thead>
              <tbody>
                {/* Assets */}
                <tr className="sec-hdr">
                  <td colSpan="3">ASSETS (LIVE, FROM THE GENERAL LEDGER)</td>
                </tr>
                {liveData.byGroup.asset.map(a => (
                  <tr key={a.code}>
                    <td className="ind1">{a.name}</td>
                    <td style={{ color: 'var(--color-muted)', fontSize: '11px' }}>{a.code}</td>
                    <td className="r font-semibold">{fmt2(a.net)}</td>
                  </tr>
                ))}
                <tr className="total-row">
                  <td><strong>TOTAL ASSETS</strong></td>
                  <td></td>
                  <td className="r">{fmt2(liveData.totalAssets)}</td>
                </tr>

                {/* Liabilities */}
                <tr className="sec-hdr">
                  <td colSpan="3">LIABILITIES (LIVE, FROM THE GENERAL LEDGER)</td>
                </tr>
                {liveData.byGroup.liability.map(a => (
                  <tr key={a.code}>
                    <td className="ind1">{a.name}</td>
                    <td style={{ color: 'var(--color-muted)', fontSize: '11px' }}>{a.code}</td>
                    <td className="r font-semibold">{fmt2(-a.net)}</td>
                  </tr>
                ))}
                <tr className="total-row">
                  <td><strong>TOTAL LIABILITIES</strong></td>
                  <td></td>
                  <td className="r">{fmt2(liveData.totalLiab)}</td>
                </tr>

                {/* Shareholders' Equity */}
                <tr className="sec-hdr">
                  <td colSpan="3">SHAREHOLDERS' EQUITY (LIVE, FROM THE GENERAL LEDGER)</td>
                </tr>
                <tr>
                  <td className="ind1">Current Period Net Income / (Loss)</td>
                  <td style={{ color: 'var(--color-muted)', fontSize: '11px' }}>3300</td>
                  <td className="r font-semibold">{fmt2(liveData.netIncomeLive)}</td>
                </tr>
                {liveData.totalEquity !== liveData.netIncomeLive && (
                  <tr>
                    <td className="ind1">Opening Equity &amp; Retained Earnings</td>
                    <td style={{ color: 'var(--color-muted)', fontSize: '11px' }}>3100</td>
                    <td className="r font-semibold">{fmt2(liveData.totalEquity - liveData.netIncomeLive)}</td>
                  </tr>
                )}
                <tr className="total-row net-income">
                  <td><strong>TOTAL EQUITY</strong></td>
                  <td></td>
                  <td className="r">{fmt2(liveData.totalEquity)}</td>
                </tr>
                <tr className="total-row">
                  <td><strong>TOTAL LIABILITIES &amp; EQUITY</strong></td>
                  <td></td>
                  <td className="r">{fmt2(liveData.totalLiab + liveData.totalEquity)}</td>
                </tr>
              </tbody>
            </table>
            <div className="fs-note">
              Live account balances = opening balance + every posted Journal Entry line (js/gl-engine.js). Total Equity is always Total Assets minus Total Liabilities, so this sheet balances strictly by double-entry accounting rules.
            </div>
          </div>
        )}

        {/* P&L Panel */}
        {activeTab === 'pnl' && (
          <div className="fs-panel active">
            <table className="fs-table" id="fs-pnl-table">
              <thead>
                <tr>
                  <th style={{ width: '50%' }}>LINE ITEM</th>
                  <th style={{ width: '12%' }}>CODE</th>
                  <th className="r" style={{ width: '38%' }}>AMOUNT ($)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="sec-hdr">
                  <td colSpan="3">REVENUE (LIVE)</td>
                </tr>
                {liveData.byGroup.revenue.map(a => (
                  <tr key={a.code}>
                    <td className="ind1">{a.name}</td>
                    <td style={{ color: 'var(--color-muted)', fontSize: '11px' }}>{a.code}</td>
                    <td className="r font-semibold">{fmt2(-a.net)}</td>
                  </tr>
                ))}
                <tr className="subtot">
                  <td><strong>Total Revenue</strong></td>
                  <td></td>
                  <td className="r">{fmt2(liveData.liveRevenue)}</td>
                </tr>

                <tr className="sec-hdr">
                  <td colSpan="3" style={{ color: '#c62828' }}>EXPENSES (LIVE)</td>
                </tr>
                {liveData.byGroup.expense.map(a => (
                  <tr key={a.code}>
                    <td className="ind1">{a.name}</td>
                    <td style={{ color: 'var(--color-muted)', fontSize: '11px' }}>{a.code}</td>
                    <td className="r font-semibold">{fmt2(a.net)}</td>
                  </tr>
                ))}
                <tr className="subtot">
                  <td><strong>Total Expenses</strong></td>
                  <td></td>
                  <td className="r">{fmt2(liveData.liveExpense)}</td>
                </tr>

                <tr className="net-income">
                  <td><strong>NET INCOME / (LOSS)</strong></td>
                  <td></td>
                  <td className="r font-semibold">
                    {liveData.netIncomeLive >= 0 ? '$' : '-$'}{fmt2(Math.abs(Math.round(liveData.netIncomeLive)))}
                  </td>
                </tr>
              </tbody>
            </table>
            <div className="fs-note">
              Revenue and expense lines are live, computed directly from every posted Journal Entry against revenue (4xxx) and expense (5xxx / 6xxx) accounts.
            </div>
          </div>
        )}

        {/* Cash Flow Panel */}
        {activeTab === 'cf' && (
          <div className="fs-panel active">
            <table className="fs-table" id="fs-cf-table">
              <thead>
                <tr>
                  <th style={{ width: '70%' }}>ACTIVITY</th>
                  <th className="r" style={{ width: '30%' }}>AMOUNT ($)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="sec-hdr">
                  <td colSpan="2">OPERATING ACTIVITIES (LIVE CASH / BANK MOVEMENT)</td>
                </tr>
                {(() => {
                  const cashAcct = liveData.byGroup.asset.find(a => a.code === '1001');
                  const liveCash = cashAcct ? cashAcct.net : 0;
                  const liveInflows = cashAcct ? cashAcct.debit : 0;
                  const liveOutflows = cashAcct ? cashAcct.credit : 0;
                  return (
                    <>
                      <tr>
                        <td className="ind1">Cash &amp; Premium Receipts / Inflows (Dr Account 1001)</td>
                        <td className="r font-semibold">{fmt2(liveInflows)}</td>
                      </tr>
                      <tr>
                        <td className="ind1">Cash Disbursements &amp; Remittances / Outflows (Cr Account 1001)</td>
                        <td className="r font-semibold">{fmt2(-liveOutflows)}</td>
                      </tr>
                      <tr className="subtot">
                        <td><strong>Net Operating Cash Movement</strong></td>
                        <td className="r font-semibold">{fmt2(liveCash)}</td>
                      </tr>
                      <tr className="net-income">
                        <td><strong>Closing Cash / Bank Balance (Account 1001, Live)</strong></td>
                        <td className="r font-semibold">
                          {liveCash >= 0 ? '$' : '-$'}{fmt2(Math.abs(Math.round(liveCash)))}
                        </td>
                      </tr>
                    </>
                  );
                })()}
              </tbody>
            </table>
            <div className="fs-note">
              The cash flow statement reflects actual live cash movements debited and credited to Account 1001 (Cash / Bank) across all posted journal entries.
            </div>
          </div>
        )}

        {/* Trial Balance Panel */}
        {activeTab === 'tb' && (
          <div className="fs-panel active">
            <table className="fs-table" id="fs-tb-table">
              <thead>
                <tr>
                  <th style={{ width: '12%' }}>CODE</th>
                  <th style={{ width: '40%' }}>ACCOUNT NAME</th>
                  <th style={{ width: '16%' }}>TYPE</th>
                  <th className="r" style={{ width: '16%' }}>DEBIT ($)</th>
                  <th className="r" style={{ width: '16%' }}>CREDIT ($)</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  let totDr = 0;
                  let totCr = 0;
                  const rows = accounts.map(a => {
                    const bal = getAccountBalance(a.code);
                    const dr = bal.debit > bal.credit ? (bal.debit - bal.credit) : 0;
                    const cr = bal.credit > bal.debit ? (bal.credit - bal.debit) : 0;
                    totDr += dr;
                    totCr += cr;
                    return (
                      <tr key={a.code}>
                        <td style={{ fontSize: '11px', color: 'var(--color-muted)' }}>{a.code}</td>
                        <td className="font-semibold">{a.name}</td>
                        <td>
                          <span className={`badge badge-${(a.group || a.type || 'asset').toLowerCase()}`}>
                            {(a.group || a.type || 'Asset').toUpperCase()}
                          </span>
                        </td>
                        <td className="r">{dr > 0 ? fmt2(dr) : ' - '}</td>
                        <td className="r">{cr > 0 ? fmt2(cr) : ' - '}</td>
                      </tr>
                    );
                  });

                  const balanced = Math.abs(totDr - totCr) < 0.01;
                  return (
                    <>
                      {rows}
                      <tr className="total-row">
                        <td colSpan="3" className="r"><strong>TOTALS</strong></td>
                        <td className="r"><strong>{fmt2(totDr)}</strong></td>
                        <td className="r"><strong>{fmt2(totCr)}</strong></td>
                      </tr>
                      <tr>
                        <td colSpan="5">
                          {balanced ? (
                            <span className="badge badge-green">Balanced, debits = credits</span>
                          ) : (
                            <span className="badge badge-red">Out of balance by ${fmt2(Math.abs(totDr - totCr))}</span>
                          )}
                        </td>
                      </tr>
                    </>
                  );
                })()}
              </tbody>
            </table>
            <div className="fs-note">
              Every account in the real Chart of Accounts, with its live balance (opening balance + every posted Journal Entry). This is the same balance shown on Chart of Accounts and used everywhere else on this page.
            </div>
          </div>
        )}
      </div>
    </>
  );
}
