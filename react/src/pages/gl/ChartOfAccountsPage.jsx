import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { DIMENSION_MAP } from '../../data/mockAccounts';

const GROUP_BADGE = {
  asset: 'badge-asset',
  liability: 'badge-liability',
  equity: 'badge-equity',
  revenue: 'badge-revenue',
  expense: 'badge-expense'
};

const ALL_DIMENSIONS = [
  { id: 'cost-center', label: 'Cost Centre' },
  { id: 'location', label: 'Location / Department' },
  { id: 'mga', label: 'MGA' },
  { id: 'broker', label: 'Broker / Producer' },
  { id: 'state', label: 'State / Jurisdiction' },
  { id: 'lob', label: 'Line of Business (LOB)' },
  { id: 'treaty', label: 'Treaty / Program' },
  { id: 'reinsurer', label: 'Reinsurer' },
  { id: 'product-line', label: 'Product / SKU Line' },
  { id: 'carrier-dim', label: 'Carrier' },
  { id: 'class', label: 'Class' },
  { id: 'customer-job', label: 'Customer:Job' }
];

export function ChartOfAccountsPage() {
  const {
    accounts,
    addAccount,
    toggleAccountStatus: contextToggleStatus,
    setOpeningBalance: contextSetOpeningBalance,
    getAccountBalance,
    getAccountLedger
  } = useFinance();

  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Add Account Form State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newGroup, setNewGroup] = useState('asset');
  const [selectedDims, setSelectedDims] = useState(['cost-center', 'location']);

  // Opening Balance Form State
  const [obTarget, setObTarget] = useState(null);
  const [obDebit, setObDebit] = useState('');
  const [obCredit, setObCredit] = useState('');

  // Ledger Detail Modal State
  const [ledgerModalCode, setLedgerModalCode] = useState(null);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fmtCurrency = (val) => {
    const num = parseFloat(val) || 0;
    return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleSaveAccount = (e) => {
    e.preventDefault();
    const code = newCode.trim();
    const name = newName.trim();
    if (!code || !name) {
      showToast('Enter an account code and name', 'error');
      return;
    }
    try {
      addAccount({
        code,
        name,
        group: newGroup,
        type: newGroup.charAt(0).toUpperCase() + newGroup.slice(1),
        dimensions: selectedDims,
        status: 'active'
      });
      setIsAddOpen(false);
      setNewCode('');
      setNewName('');
      setSelectedDims(['cost-center', 'location']);
      showToast(`Account ${code} - ${name} created`, 'success');
    } catch (err) {
      showToast(err.message || 'Error creating account', 'error');
    }
  };

  const toggleOpeningBalanceForm = (acc) => {
    if (obTarget && obTarget.code === acc.code) {
      setObTarget(null);
      return;
    }
    setObTarget(acc);
    const bal = getAccountBalance(acc.code);
    setObDebit(bal.debit > 0 ? String(bal.debit) : '');
    setObCredit(bal.credit > 0 ? String(bal.credit) : '');
  };

  const handleSaveOpeningBalance = () => {
    if (!obTarget) return;
    const dr = parseFloat(obDebit) || 0;
    const cr = parseFloat(obCredit) || 0;
    contextSetOpeningBalance(obTarget.code, dr, cr);
    showToast(`Opening balance set for ${obTarget.code}`, 'success');
    setObTarget(null);
  };

  const handleToggleStatus = (code, currentStatus) => {
    contextToggleStatus(code);
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
    showToast(`${code} marked ${nextStatus}`, 'info');
  };

  // Filtered and strictly sorted accounts
  const sortedAccounts = useMemo(() => {
    const list = [...accounts];
    list.sort((a, b) => (parseInt(a.code, 10) || 0) - (parseInt(b.code, 10) || 0));
    return list;
  }, [accounts]);

  const filtered = useMemo(() => {
    return sortedAccounts.filter(a => {
      const grp = (a.group || a.type || '').toLowerCase();
      if (filterType && grp !== filterType.toLowerCase()) return false;
      if (filterStatus && a.status !== filterStatus) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const mCode = a.code.toLowerCase().includes(q);
        const mName = a.name.toLowerCase().includes(q);
        if (!mCode && !mName) return false;
      }
      return true;
    });
  }, [sortedAccounts, filterType, filterStatus, searchTerm]);

  const activeCount = accounts.filter(a => a.status === 'active').length;
  const inactiveCount = accounts.length - activeCount;

  const exportCoaCsv = () => {
    const headers = ['Account Code', 'Account Name', 'Type', 'Dimensions', 'Debit (DR)', 'Credit (CR)', 'Status'];
    const rows = filtered.map(a => {
      const bal = getAccountBalance(a.code);
      const dims = (a.dimensions || []).map(id => DIMENSION_MAP[id] || id).join(', ');
      return [
        a.code,
        `"${a.name}"`,
        (a.group || a.type || '').toUpperCase(),
        `"${dims}"`,
        bal.debit.toFixed(2),
        bal.credit.toFixed(2),
        (a.status || 'active').toUpperCase()
      ];
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = 'chart-of-accounts.csv';
    link.click();
    showToast('Chart of accounts exported', 'success');
  };

  const selectedLedgerData = useMemo(() => {
    if (!ledgerModalCode) return null;
    const acct = accounts.find(a => a.code === ledgerModalCode);
    const ledger = getAccountLedger(ledgerModalCode);
    return { acct, ledger };
  }, [ledgerModalCode, accounts, getAccountLedger]);

  return (
    <>
      {toastMessage && (
        <div className={`veridex-toast veridex-toast-${toastMessage.type}`}>
          <span>{toastMessage.type === 'error' ? '✕' : '✓'}</span>
          <span>{toastMessage.msg}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header">
        <div>
          <div className="page-title">Chart of Accounts</div>
          <div className="page-subtitle">
            Real, persisted accounts. Add one, set its dimensions and opening balance, and it drives Journal Entry, balances, and every report that reads the ledger.
          </div>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline" onClick={exportCoaCsv}>
            Export
          </button>
          <button className="btn btn-primary" onClick={() => setIsAddOpen(!isAddOpen)}>
            + New Account
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="stats-row" id="coa-stats">
        <div className="stat-card">
          <div className="stat-icon si-navy">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="3" y="3" width="14" height="14" rx="2" stroke="#102a2e" strokeWidth="1.8" />
              <path d="M7 10h6M7 7h6M7 13h3" stroke="#102a2e" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <div className="stat-info">
            <div className="stat-value">{accounts.length}</div>
            <div className="stat-label">Total Accounts</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon si-green">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 10l3.5 3.5L15 6" stroke="#2e7d32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="stat-info">
            <div className="stat-value">{activeCount}</div>
            <div className="stat-label">Active Accounts</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon si-orange">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 5v6M10 14v1" stroke="#e65100" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div className="stat-info">
            <div className="stat-value">{inactiveCount}</div>
            <div className="stat-label">Inactive Accounts</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon si-coral">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="7" stroke="#c9791f" strokeWidth="1.8" />
              <path d="M10 7v3l2 2" stroke="#c9791f" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </div>
          <div className="stat-info">
            <div className="stat-value">4</div>
            <div className="stat-label">New This Month</div>
          </div>
        </div>
      </div>

      {/* New account form */}
      {isAddOpen && (
        <div className="form-card" id="add-account-form-wrap" style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '12.5px', fontWeight: 800, color: 'var(--gray-600, #4B5563)', marginBottom: '10px' }}>
            New Account
          </div>
          <form onSubmit={handleSaveAccount}>
            <div className="form-grid-3">
              <div>
                <label className="field-label">Account code *</label>
                <input
                  className="field-input"
                  id="na-code"
                  placeholder="e.g. 1200"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="field-label">Account name *</label>
                <input
                  className="field-input"
                  id="na-name"
                  placeholder="e.g. Prepaid Expenses"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="field-label">Type *</label>
                <select
                  className="field-input"
                  id="na-group"
                  value={newGroup}
                  onChange={(e) => setNewGroup(e.target.value)}
                >
                  <option value="asset">Asset</option>
                  <option value="liability">Liability</option>
                  <option value="equity">Equity</option>
                  <option value="revenue">Revenue</option>
                  <option value="expense">Expense</option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: '12px' }}>
              <label className="field-label">
                Applicable dimensions <span className="v-badge-config">shown on Journal Entry lines for this account</span>
              </label>
              <div id="na-dims" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '6px' }}>
                {ALL_DIMENSIONS.map((dim) => (
                  <label key={dim.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      value={dim.id}
                      checked={selectedDims.includes(dim.id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedDims([...selectedDims, dim.id]);
                        else setSelectedDims(selectedDims.filter(d => d !== dim.id));
                      }}
                    />
                    {dim.label}
                  </label>
                ))}
              </div>
            </div>

            <div style={{ marginTop: '14px', display: 'flex', gap: '8px' }}>
              <button type="submit" className="btn btn-primary btn-sm">
                Save Account
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setIsAddOpen(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Opening balance form */}
      {obTarget && (
        <div className="form-card" id="opening-balance-form-wrap" style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '12.5px', fontWeight: 800, color: 'var(--gray-600, #4B5563)', marginBottom: '10px' }}>
            Set Opening Balance: <span id="ob-account-label">{obTarget.code} - {obTarget.name}</span>
          </div>
          <div className="form-grid-3">
            <div>
              <label className="field-label">Debit</label>
              <input
                className="field-input"
                type="number"
                step="0.01"
                id="ob-debit"
                placeholder="0.00"
                value={obDebit}
                onChange={(e) => setObDebit(e.target.value)}
              />
            </div>
            <div>
              <label className="field-label">Credit</label>
              <input
                className="field-input"
                type="number"
                step="0.01"
                id="ob-credit"
                placeholder="0.00"
                value={obCredit}
                onChange={(e) => setObCredit(e.target.value)}
              />
            </div>
            <div>
              <label className="field-label">As of</label>
              <input
                className="field-input"
                type="text"
                id="ob-asof"
                value={new Date().toISOString().slice(0, 10)}
                disabled
              />
            </div>
          </div>
          <div style={{ marginTop: '14px', display: 'flex', gap: '8px' }}>
            <button className="btn btn-primary btn-sm" onClick={handleSaveOpeningBalance}>
              Save Opening Balance
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setObTarget(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filter-bar">
        <span className="filter-bar-label">Filters:</span>
        <select
          className="filter-select"
          id="coa-filter-type"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="">All Types</option>
          <option value="asset">Asset</option>
          <option value="liability">Liability</option>
          <option value="equity">Equity</option>
          <option value="revenue">Revenue</option>
          <option value="expense">Expense</option>
        </select>
        <select
          className="filter-select"
          id="coa-filter-status"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <div className="filter-spacer"></div>
        <div className="search-wrapper">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="filter-input"
            placeholder="Search accounts..."
            id="coa-search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '200px' }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="table-wrap">
        <div className="table-head-row">
          <div className="table-head-title">All Accounts</div>
          <div className="table-head-actions">
            <button
              className="btn btn-outline btn-sm"
              onClick={() => showToast('Opening import modal...', 'info')}
            >
              Import
            </button>
          </div>
        </div>
        <table className="data-table" id="coa-table">
          <thead>
            <tr>
              <th style={{ width: '36px' }}><input type="checkbox" className="table-check" /></th>
              <th>Account Code</th>
              <th>Account Name</th>
              <th>Type</th>
              <th>Dimensions</th>
              <th style={{ textAlign: 'right' }}>Debit (DR)</th>
              <th style={{ textAlign: 'right' }}>Credit (CR)</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="coa-tbody">
            {filtered.length > 0 ? (
              filtered.map((a) => {
                const bal = getAccountBalance(a.code);
                const grp = (a.group || a.type || 'asset').toLowerCase();
                const dimsList = a.dimensions || [];

                return (
                  <tr key={a.code}>
                    <td><input type="checkbox" className="table-check" /></td>
                    <td className="cell-link">{a.code}</td>
                    <td>{a.name}</td>
                    <td>
                      <span className={`badge ${GROUP_BADGE[grp] || 'badge-gray'}`}>
                        {grp.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      {dimsList.length > 0 ? (
                        dimsList.map((id, idx) => (
                          <React.Fragment key={id}>
                            <span className="v-tree-badge">{DIMENSION_MAP[id] || id}</span>
                            {idx < dimsList.length - 1 ? ' ' : ''}
                          </React.Fragment>
                        ))
                      ) : (
                        <span style={{ color: 'var(--gray-400, #9CA3AF)' }}>none</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <a
                        href="javascript:void(0)"
                        onClick={() => setLedgerModalCode(a.code)}
                        style={{
                          color: bal.debit > 0 ? 'var(--green, #15803D)' : 'var(--gray-400, #9CA3AF)',
                          fontWeight: 700,
                          cursor: 'pointer',
                          textDecoration: 'none'
                        }}
                        title="Click to view ledger detail"
                      >
                        {fmtCurrency(bal.debit)}
                      </a>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <a
                        href="javascript:void(0)"
                        onClick={() => setLedgerModalCode(a.code)}
                        style={{
                          color: bal.credit > 0 ? 'var(--coral, #F97316)' : 'var(--gray-400, #9CA3AF)',
                          fontWeight: 700,
                          cursor: 'pointer',
                          textDecoration: 'none'
                        }}
                        title="Click to view ledger detail"
                      >
                        {fmtCurrency(bal.credit)}
                      </a>
                    </td>
                    <td>
                      <span className={`badge ${a.status === 'active' ? 'badge-green' : 'badge-gray'}`}>
                        {a.status === 'active' ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => toggleOpeningBalanceForm(a)}
                      >
                        Opening Bal.
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleToggleStatus(a.code, a.status)}
                      >
                        {a.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', color: 'var(--gray-400, #9CA3AF)', padding: '20px' }}>
                  No accounts match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Account Ledger Detail Modal */}
      {selectedLedgerData && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setLedgerModalCode(null)}
        >
          <div
            style={{
              backgroundColor: 'var(--color-panel, #FFFFFF)',
              borderRadius: '8px',
              width: '100%',
              maxWidth: '820px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--color-border, #E2E5EA)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-ink, #0D1117)' }}>
                {selectedLedgerData.acct?.code} - {selectedLedgerData.acct?.name}
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setLedgerModalCode(null)}
                style={{ fontSize: '18px', padding: '0 8px', lineHeight: 1 }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
              <div
                style={{
                  background: 'var(--color-brand-light, #FFF7ED)',
                  border: '1px solid rgba(249, 115, 22, 0.2)',
                  borderRadius: '6px',
                  padding: '10px 14px',
                  marginBottom: '14px',
                  fontSize: '12.5px',
                  color: 'var(--color-ink, #0D1117)'
                }}
              >
                <strong>Opening balance:</strong> Dr {fmtCurrency(selectedLedgerData.ledger?.openingNet > 0 ? selectedLedgerData.ledger.openingNet : 0)} / Cr {fmtCurrency(selectedLedgerData.ledger?.openingNet < 0 ? Math.abs(selectedLedgerData.ledger.openingNet) : 0)} (net {fmtCurrency(selectedLedgerData.ledger?.openingNet || 0)}), set on Chart of Accounts.
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>JE #</th>
                      <th>Date</th>
                      <th>Description</th>
                      <th style={{ textAlign: 'right' }}>Debit</th>
                      <th style={{ textAlign: 'right' }}>Credit</th>
                      <th style={{ textAlign: 'right' }}>Running Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedLedgerData.ledger?.rows && selectedLedgerData.ledger.rows.length > 0 ? (
                      selectedLedgerData.ledger.rows.map((r, i) => (
                        <tr key={i}>
                          <td className="cell-link" style={{ color: 'var(--color-link, #C2410C)', fontWeight: 600 }}>
                            {r.jeId || `JE-${i + 1}`}
                          </td>
                          <td>{r.date}</td>
                          <td>{r.description}</td>
                          <td style={{ textAlign: 'right' }}>
                            {r.debit > 0 ? fmtCurrency(r.debit) : ' - '}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {r.credit > 0 ? fmtCurrency(r.credit) : ' - '}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>
                            {fmtCurrency(r.runningBalance)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', color: 'var(--gray-400, #9CA3AF)', padding: '16px' }}>
                          No posted activity yet, this account is still at its opening balance.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr style={{ fontWeight: 700, borderTop: '2px solid var(--color-border, #E2E5EA)' }}>
                      <td colSpan="5" style={{ textAlign: 'right', padding: '10px 12px' }}>
                        Closing balance
                      </td>
                      <td style={{ textAlign: 'right', padding: '10px 12px', color: 'var(--color-ink, #0D1117)' }}>
                        {fmtCurrency(selectedLedgerData.ledger?.closingNet || 0)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div style={{ fontSize: '11px', color: 'var(--gray-400, #9CA3AF)', marginTop: '10px' }}>
                This is the same math used everywhere else this account's balance shows up (Chart of Accounts, Trial Balance, Balance Sheet).
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '12px 20px',
                borderTop: '1px solid var(--color-border, #E2E5EA)',
                background: 'var(--color-surface, #F7F8FA)',
                display: 'flex',
                justifyContent: 'flex-end'
              }}
            >
              <button className="btn btn-outline btn-sm" onClick={() => setLedgerModalCode(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
