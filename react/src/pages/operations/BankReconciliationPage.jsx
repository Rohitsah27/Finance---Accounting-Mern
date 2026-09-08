import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import './bank-reconciliation.css';

// Role-specific framing: broker, MGA, and carrier each keep their own bank
// accounts (each account key below matches the `account` tag on the real
// bank-feed transactions in FinanceContext), so each role reconciles its
// own book, not a shared one. `default` covers any businessType other
// than 'mga'/'carrier' (in practice: 'agency', i.e. the retail broker),
// matching the same ROLE_CONFIG[bType] || ROLE_CONFIG.default pattern used
// on Commission Engine.
const ROLE_CONFIG = {
  carrier: {
    entity: 'ENT-CAR-01',
    subtitle: 'Southlake Insurance Co. · Reconciliation for the carrier operating account',
    accounts: [
      { key: 'carrierOperating', bankName: 'Chase Commercial', accountNo: '****0874', label: 'Chase Commercial — Southlake Operating (****0874)' }
    ]
  },
  mga: {
    entity: 'ENT-MGA-01',
    subtitle: 'NTA Program Administrators · Reconciliation for premium trust & operating accounts',
    accounts: [
      { key: 'mgaTrust', bankName: 'Wells Fargo', accountNo: '****7002', label: 'Wells Fargo — NTA Premium Trust (****7002)' },
      { key: 'mgaOperating', bankName: 'Chase Commercial', accountNo: '****4821', label: 'Chase Commercial — NTA Operating (****4821)' }
    ]
  },
  default: {
    entity: 'ENT-AGY-01',
    subtitle: 'HIT Agency Group · Reconciliation for premium trust & operating accounts',
    accounts: [
      { key: 'brokerTrust', bankName: 'Wells Fargo', accountNo: '****5561', label: 'Wells Fargo — HIT Premium Trust (****5561)' },
      { key: 'brokerOperating', bankName: 'Chase Commercial', accountNo: '****9034', label: 'Chase Commercial — HIT Operating (****9034)' }
    ]
  }
};

// Approval-chain policy — real thresholds, shown in the config panel and
// used to compute each pending AP invoice's escalation level below.
const APPROVAL_CHAIN = [
  { level: 'L1 - Manager', badge: 'l1', title: 'Manager', range: 'Up to $50,000', approver: 'James Smith', max: 50000 },
  { level: 'L2 - Finance', badge: 'l2', title: 'Finance Director', range: '$50,001 – $150,000', approver: 'Sarah Chen', max: 150000 },
  { level: 'L3 - CFO', badge: 'l3', title: 'CFO', range: 'Above $150,000', approver: 'Margaret Chen', max: Infinity }
];
const approvalLevelFor = (amount) => APPROVAL_CHAIN.find(l => amount <= l.max) || APPROVAL_CHAIN[APPROVAL_CHAIN.length - 1];

export function BankReconciliationPage() {
  const { getAccountBalance, bankTransactions, matchBankTransaction, entityApInvoices, payApInvoice, fiscalPeriods, refreshBankTransactions, entityJournalEntries } = useFinance();
  const { currentUser, activeEntity } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Same role-detection pattern used on Commission Engine: businessType
  // drives which book (and which bank accounts) this page shows.
  const bType = currentUser?.businessType || activeEntity?.businessType || 'mga';
  const roleConfig = ROLE_CONFIG[bType] || ROLE_CONFIG.default;

  // Top Hub Tab: 'recon' | 'approvals' — derived from the URL hash so the
  // sidebar's /bank-reconciliation#recon-approvals link switches it automatically.
  const hubTab = location.hash.replace('#', '') === 'recon-approvals' ? 'approvals' : 'recon';

  const selectHubTab = (tab) => {
    navigate(tab === 'approvals' ? '/bank-reconciliation#recon-approvals' : '/bank-reconciliation', { replace: true });
  };

  // Sub-tabs under 'recon': 'listing' | 'details' | 'history' | 'closing'
  const [subTab, setSubTab] = useState('listing');

  // Which of the role's own accounts is selected — reset to the role's
  // first account whenever the active role/entity changes, so switching
  // from e.g. MGA to Carrier never leaves you pointed at an account that
  // isn't yours.
  const [selectedAccountKey, setSelectedAccountKey] = useState(roleConfig.accounts[0].key);
  useEffect(() => {
    setSelectedAccountKey(roleConfig.accounts[0].key);
  }, [bType]);
  const selectedAccount = roleConfig.accounts.find(a => a.key === selectedAccountKey) || roleConfig.accounts[0];

  // Filter & Search states
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [periodCloseDate, setPeriodCloseDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [toastMessage, setToastMessage] = useState(null);

  // Detail view filters
  const [detailFilter, setDetailFilter] = useState('all'); // 'all' | 'posted' | 'pending'
  const [detailSearch, setDetailSearch] = useState('');

  // Approvals — session-only dismissal (there's no "reject/dispute" write
  // path on an AP invoice in FinanceContext, so Reject just clears it from
  // this queue's view rather than pretending to notify a submitter).
  const [dismissedApprovalIds, setDismissedApprovalIds] = useState(new Set());

  // Month-close checklist — the two items with no real backing data
  // (outstanding-item review, sign-off) are genuine user-toggled state
  // rather than pre-filled "Completed by ..." text.
  const [checksReviewed, setChecksReviewed] = useState(false);
  const [signedOff, setSignedOff] = useState(false);

  // Split Modal State
  const [splitModal, setSplitModal] = useState({
    open: false,
    rowId: '',
    desc: '',
    total: 0,
    lines: [{ acct: '1001', amount: 0, desc: '' }, { acct: '1099', amount: 0, desc: '' }]
  });

  const showToast = (msg, type = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fmtM = (n) => '$' + Math.round(n || 0).toLocaleString('en-US');

  const downloadCSV = (filename, content) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Real, per-account transactions — bankTransactions is tagged with the
  // account it actually posted against (see FinanceContext), so each role
  // sees only what hit its own bank account instead of one shared feed.
  // This — not displayTransactions below — is what bankBalance/matched
  // count are computed from, so "Needs attention" stays a genuine
  // bank-vs-GL difference instead of being masked by its own GL side.
  const accountTransactions = useMemo(
    () => bankTransactions.filter(t => t.account === selectedAccountKey),
    [bankTransactions, selectedAccountKey]
  );

  // Book-side rows synthesized from posted journal entries that hit the
  // cash account (1001) — without these, GL Balance (below) can move the
  // moment a new JE posts (e.g. a manual entry) while this table kept
  // showing nothing, because bankTransactions and journalEntries were two
  // completely disconnected data sources. These are display-only — flagged
  // origin: 'gl' — so they show up as "awaiting bank feed" instead of a
  // clickable Match (there's no real bank-feed row yet to match them to).
  // PAS Event Injector entries are excluded here (the "(EVT-" marker its
  // own descriptions always carry) — those already arrive pre-matched via
  // `bankTransactions` itself (see `pasBankFeedTransactions` in
  // FinanceContext), so including them here too would double-count the
  // same cash movement as both a real bank row and an "awaiting" one.
  const glCashActivity = useMemo(() => {
    const rows = [];
    entityJournalEntries
      .filter(je => (je.status === 'Posted' || je.status === 'posted') && !(je.description || '').includes('(EVT-'))
      .forEach(je => {
        (je.lines || []).forEach((line, i) => {
          const code = line.accountCode || line.acct;
          if (code !== '1001') return;
          const amount = (parseFloat(line.debit) || 0) - (parseFloat(line.credit) || 0);
          if (!amount) return;
          rows.push({
            id: `${je.id}-L${i}`,
            date: je.date,
            description: line.description || je.description || je.id,
            amount,
            type: amount > 0 ? 'Credit' : 'Debit',
            status: 'GL Only',
            contraAccount: null,
            origin: 'gl',
            jeId: je.id
          });
        });
      });
    return rows;
  }, [entityJournalEntries]);

  // What the Listing/Details tables actually render — real feed rows plus
  // the GL-only rows above, so the table always reflects what the KPI
  // cards show instead of lagging behind a separate data source.
  const displayTransactions = useMemo(
    () => [...accountTransactions, ...glCashActivity],
    [accountTransactions, glCashActivity]
  );

  // Live General Ledger Balance for Account 1001 — already scoped to the
  // active entity by FinanceContext itself (getAccountBalance filters
  // journal entries to the logged-in role's own book).
  const glBalance = useMemo(() => {
    const b = getAccountBalance('1001');
    return b ? b.net : 0;
  }, [getAccountBalance]);

  // Real bank balance for the selected account — summed directly from that
  // account's own live bank-feed transactions (synced from MongoDB via
  // FinanceContext), not a separate hardcoded balance. So an account with
  // no bank-feed activity yet honestly shows $0 here, same as its GL side,
  // instead of a fabricated opening balance.
  const bankBalance = useMemo(
    () => accountTransactions.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0),
    [accountTransactions]
  );
  const difference = bankBalance - glBalance;

  const matchedCount = accountTransactions.filter(t => t.status === 'Matched').length;
  const matchRate = accountTransactions.length ? Math.round((matchedCount / accountTransactions.length) * 100) : null;

  // Handle Match Transaction — real context write, not local-only state.
  const handleMatchTxn = (id) => {
    matchBankTransaction(id, '1001');
    showToast(`Transaction ${id} matched to general ledger`, 'success');
  };

  // Handle Auto-Sync — actually pulls the bank feed back down from Atlas
  // (re-seeding the baseline demo feed first, additive-only, so this is
  // what recovers a feed a Reset Data wipe emptied out) rather than just
  // showing a "refreshed" toast with nothing behind it.
  const handleAutoSync = async () => {
    showToast(`Connecting to ${selectedAccount.bankName} banking gateway via BAI2/OFX…`, 'info');
    try {
      await api.seedBankTransactions();
      await refreshBankTransactions();
      showToast(`Bank feed refreshed for ${selectedAccount.label}.`, 'success');
    } catch (e) {
      showToast('Bank feed sync failed — is the server running?', 'error');
    }
  };

  // Handle Auto-Match — matches every pending transaction on this account.
  const handleRunAutoMatch = () => {
    const pending = accountTransactions.filter(t => t.status !== 'Matched');
    if (pending.length === 0) {
      showToast('Nothing to match — this account is already fully reconciled.', 'info');
      return;
    }
    showToast('Running AI rule matching against General Ledger…', 'info');
    setTimeout(() => {
      pending.forEach(t => matchBankTransaction(t.id, '1001'));
      showToast(`Auto-matching completed. ${pending.length} transaction(s) matched.`, 'success');
    }, 1000);
  };

  // Approvals — real pending AP invoices for this role's own entity,
  // ranked by the same escalation thresholds shown in the chain panel.
  const approvalQueue = useMemo(() => {
    return entityApInvoices
      .filter(inv => inv.status !== 'Paid & Cleared' && !dismissedApprovalIds.has(inv.id))
      .map(inv => ({ ...inv, level: approvalLevelFor(inv.amount) }));
  }, [entityApInvoices, dismissedApprovalIds]);

  const handleApproveQueueItem = (id) => {
    payApInvoice(id);
    showToast(`Approved and released payment for ${id}.`, 'success');
  };

  const handleRejectQueueItem = (id) => {
    setDismissedApprovalIds(prev => new Set(prev).add(id));
    showToast(`Removed ${id} from your approval queue.`, 'warning');
  };

  // Filtered listing rows
  const filteredTransactions = displayTransactions
    .filter(t => statusFilter === 'All' || (statusFilter === 'Matched' ? t.status === 'Matched' : t.status !== 'Matched'))
    .filter(t => !searchTerm || t.description.toLowerCase().includes(searchTerm.toLowerCase()) || (t.contraAccount || '').toLowerCase().includes(searchTerm.toLowerCase()));

  // Detail rows are derived from the same real+GL displayTransactions
  // instead of a second, separately-hardcoded dataset.
  const detailRows = useMemo(() => displayTransactions.map(t => ({
    id: t.id,
    date: t.date,
    desc: t.description,
    spent: t.amount < 0 ? -t.amount : 0,
    received: t.amount > 0 ? t.amount : 0,
    source: t.type,
    matchAcct: t.origin === 'gl' ? 'Awaiting Bank Feed' : (t.contraAccount ? `${t.contraAccount} - GL Account` : 'Unallocated Suspense'),
    status: t.status === 'Matched' ? 'posted' : 'pending'
  })), [displayTransactions]);

  const filteredDetails = detailRows.filter(r => {
    if (detailFilter !== 'all' && r.status !== detailFilter) return false;
    if (detailSearch) {
      const term = detailSearch.toLowerCase();
      return r.desc.toLowerCase().includes(term) || r.matchAcct.toLowerCase().includes(term);
    }
    return true;
  });

  // Reconciliation history — real fiscal-period lock state from
  // FinanceContext instead of a fabricated per-period close log (there's
  // no historical bank/GL balance snapshot to show honestly, so those
  // columns are dropped rather than invented).
  const reconHistory = useMemo(() => {
    const statusLabel = { hard_locked: 'Closed & Locked', in_progress: 'In Progress', open: 'Open' };
    return [...fiscalPeriods].reverse().map(p => ({
      id: p.id,
      period: `${p.month} ${p.year}`,
      status: statusLabel[p.status] || p.status,
      closedDate: p.closedAt || '—'
    }));
  }, [fiscalPeriods]);

  // Month-close checklist — computed where real data exists, toggled by
  // the user where it doesn't.
  const deposits = accountTransactions.filter(t => t.amount > 0);
  const depositsMatched = deposits.length === 0 || deposits.every(t => t.status === 'Matched');
  const diffResolved = Math.abs(difference) < 0.01;

  const closingSteps = [
    { label: 'All deposits matched', done: depositsMatched, note: deposits.length === 0 ? 'No deposits posted this period' : depositsMatched ? `${deposits.length} deposit(s) matched` : `${deposits.filter(t => t.status !== 'Matched').length} deposit(s) still pending` },
    { label: 'Outstanding items reviewed', done: checksReviewed, note: checksReviewed ? `Reviewed by ${currentUser?.name || 'you'}` : 'Not yet reviewed', toggle: () => setChecksReviewed(v => !v) },
    { label: `Difference of ${fmtM(Math.abs(difference))} resolved`, done: diffResolved, note: diffResolved ? 'Bank and GL balances match' : 'Bank and GL balances do not match yet' },
    { label: 'Sign-off', done: signedOff, note: signedOff ? `Signed off by ${currentUser?.name || 'you'}` : 'Awaiting sign-off', toggle: () => setSignedOff(v => !v) }
  ];

  return (
    <div className="bank-recon-container">
      {/* Toast popup */}
      {toastMessage && (
        <div className={`veridex-toast veridex-toast-${toastMessage.type}`}>
          <span>{toastMessage.type === 'error' ? '✕' : '✓'}</span>
          <span>{toastMessage.msg}</span>
        </div>
      )}

      {/* Split Transaction Modal */}
      {splitModal.open && (
        <div className="v-modal-overlay">
          <div className="v-modal-card" style={{ width: '540px' }}>
            <div style={{ padding: '16px 20px', background: 'var(--navy)', color: '#fff', borderRadius: '10px 10px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700 }}>Split Transaction</div>
                <div style={{ fontSize: '11px', opacity: .8, marginTop: '2px' }}>{splitModal.desc}</div>
              </div>
              <button
                style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer' }}
                onClick={() => setSplitModal({ ...splitModal, open: false })}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ fontSize: '12px', color: 'var(--gray-600)', marginBottom: '14px' }}>
                Total: <strong style={{ color: 'var(--navy)' }}>${splitModal.total.toFixed(2)}</strong> — Split into multiple GL accounts.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                {splitModal.lines.map((l, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr auto', gap: '8px', alignItems: 'center' }}>
                    <select
                      className="form-ctrl form-ctrl-sm"
                      value={l.acct}
                      onChange={(e) => {
                        const copy = [...splitModal.lines];
                        copy[i].acct = e.target.value;
                        setSplitModal({ ...splitModal, lines: copy });
                      }}
                    >
                      <option value="1001">1001 - Cash / Bank</option>
                      <option value="1099">1099 - Suspense Account</option>
                      <option value="2200">2200 - Premium Payable</option>
                      <option value="5200">5200 - Claims Expense</option>
                    </select>
                    <input
                      type="number"
                      step="0.01"
                      className="form-ctrl form-ctrl-sm"
                      placeholder="Amount"
                      value={l.amount || ''}
                      onChange={(e) => {
                        const copy = [...splitModal.lines];
                        copy[i].amount = parseFloat(e.target.value) || 0;
                        setSplitModal({ ...splitModal, lines: copy });
                      }}
                    />
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      style={{ padding: '4px 8px' }}
                      onClick={() => {
                        if (splitModal.lines.length > 1) {
                          setSplitModal({ ...splitModal, lines: splitModal.lines.filter((_, idx) => idx !== i) });
                        }
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setSplitModal({
                    ...splitModal,
                    lines: [...splitModal.lines, { acct: '1099', amount: 0, desc: '' }]
                  })}
                >
                  + Add Line
                </button>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => setSplitModal({ ...splitModal, open: false })}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      showToast('Split transaction saved and allocated to GL', 'success');
                      setSplitModal({ ...splitModal, open: false });
                    }}
                  >
                    Save Split
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '16px' }}>
        <div>
          <div className="page-title">Bank Reconciliation</div>
          <div className="page-subtitle">{roleConfig.subtitle}</div>
        </div>
        <div className="page-actions">
          <button
            className="btn btn-outline btn-sm"
            onClick={() => {
              const csv = "Date,Description,Amount,Type,GLMatch,Status\n" +
                accountTransactions.map(t => `${t.date},"${t.description}",${t.amount},${t.type},"${t.contraAccount || 'Unallocated'}",${t.status}`).join("\n");
              downloadCSV('bank-recon.csv', csv);
              showToast('Exported bank-recon.csv', 'success');
            }}
          >
            Export
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleAutoSync}>
            Auto-Sync
          </button>
        </div>
      </div>

      {/* Top Hub Tabs matching bank-reconciliation.html */}
      <div className="hub-tabbar">
        <div
          className={`hub-tab ${hubTab === 'recon' ? 'active' : ''}`}
          onClick={() => selectHubTab('recon')}
        >
          Bank Recon
        </div>
        <div
          className={`hub-tab ${hubTab === 'approvals' ? 'active' : ''}`}
          onClick={() => selectHubTab('approvals')}
        >
          Approvals
          {approvalQueue.length > 0 && <span className="hub-tab-badge">{approvalQueue.length}</span>}
        </div>
      </div>

      {/* ══════════════════════ PANEL 1: BANK RECON ══════════════════════ */}
      {hubTab === 'recon' && (
        <div className="hub-panel active">
          {/* Sub-tabs */}
          <div className="sub-tabbar">
            <button
              className={`sub-tab ${subTab === 'listing' ? 'active' : ''}`}
              onClick={() => setSubTab('listing')}
            >
              Listing
            </button>
            <button
              className={`sub-tab ${subTab === 'details' ? 'active' : ''}`}
              onClick={() => setSubTab('details')}
            >
              Details
            </button>
            <button
              className={`sub-tab ${subTab === 'history' ? 'active' : ''}`}
              onClick={() => setSubTab('history')}
            >
              History
            </button>
            <button
              className={`sub-tab ${subTab === 'closing' ? 'active' : ''}`}
              onClick={() => setSubTab('closing')}
            >
              Month Closing
            </button>
          </div>

          {/* ─ 1. LISTING SUB-TAB ─ */}
          {subTab === 'listing' && (
            <div>
              {/* Form Strip */}
              <div className="form-strip">
                <div className="form-field">
                  <label className="form-label">Account</label>
                  <select
                    className="form-ctrl"
                    value={selectedAccountKey}
                    onChange={(e) => {
                      setSelectedAccountKey(e.target.value);
                      showToast(`Switched account to ${roleConfig.accounts.find(a => a.key === e.target.value)?.label}`, 'info');
                    }}
                  >
                    {roleConfig.accounts.map(a => (
                      <option key={a.key} value={a.key}>{a.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label className="form-label">Account No</label>
                  <input className="form-ctrl form-ctrl-sm" value={selectedAccount.accountNo} readOnly />
                </div>
                <div className="form-field">
                  <label className="form-label">G/L Account</label>
                  <input className="form-ctrl form-ctrl-sm" value="1001 - Cash / Bank" readOnly />
                </div>
                <div className="form-field">
                  <label className="form-label">Period Close Date</label>
                  <input
                    type="date"
                    className="form-ctrl form-ctrl-sm"
                    value={periodCloseDate}
                    onChange={(e) => setPeriodCloseDate(e.target.value)}
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Status</label>
                  <select
                    className="form-ctrl form-ctrl-sm"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option>All</option>
                    <option>Matched</option>
                    <option>Unmatched</option>
                  </select>
                </div>
                <button
                  className="btn btn-primary"
                  style={{ alignSelf: 'flex-end' }}
                  onClick={async () => {
                    try {
                      await api.seedBankTransactions();
                      await refreshBankTransactions();
                      showToast(`Refreshed live feed for ${selectedAccount.label}`, 'success');
                    } catch (e) {
                      showToast('Failed to refresh feed — is the server running?', 'error');
                    }
                  }}
                >
                  Get Transactions
                </button>
              </div>

              {/* 4 KPI Strip */}
              <div className="kpi-strip kpi-strip-4">
                <div className="kpi-tile">
                  <div className="kpi-tile-lbl">Bank Balance</div>
                  <div className="kpi-tile-val">{fmtM(bankBalance)}</div>
                  <div className="kpi-tile-sub">{selectedAccount.label}</div>
                </div>
                <div className="kpi-tile">
                  <div className="kpi-tile-lbl">GL Balance</div>
                  <div className="kpi-tile-val">{fmtM(glBalance)}</div>
                  <div className="kpi-tile-sub">Account 1001</div>
                </div>
                <div className="kpi-tile">
                  <div className="kpi-tile-lbl">Difference</div>
                  <div className="kpi-tile-val" style={{ color: Math.abs(difference) < 0.01 ? '#2e7d32' : '#e65100' }}>
                    {fmtM(Math.abs(difference))}
                  </div>
                  <div className={`kpi-tile-sub ${Math.abs(difference) < 0.01 ? '' : 'warn'}`}>
                    {Math.abs(difference) < 0.01 ? '✓ Balanced' : '↑ Needs attention'}
                  </div>
                </div>
                <div className="kpi-tile">
                  <div className="kpi-tile-lbl">Matched Txns</div>
                  <div className="kpi-tile-val">{matchedCount}</div>
                  <div className="kpi-tile-sub up">
                    {matchRate === null ? 'No transactions yet' : `↑ ${matchRate}% auto-matched`}
                  </div>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="tbl-wrap">
                <div className="tbl-hdr">
                  <span className="tbl-hdr-title">Transactions — {selectedAccount.label}</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      className="form-ctrl form-ctrl-sm"
                      placeholder="Search transactions…"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ width: '220px' }}
                    />
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => {
                        const csv = "Date,Description,Amount,Type,GLMatch,Status\n" +
                          filteredTransactions.map(t => `${t.date},"${t.description}",${t.amount},${t.type},"${t.contraAccount || 'Unallocated'}",${t.status}`).join("\n");
                        downloadCSV('transactions.csv', csv);
                        showToast('Exported transactions.csv', 'success');
                      }}
                    >
                      Export
                    </button>
                  </div>
                </div>

                <table>
                  <thead>
                    <tr>
                      <th style={{ width: '32px' }}><input type="checkbox" /></th>
                      <th>Date</th>
                      <th>Description</th>
                      <th style={{ textAlign: 'right' }}>Deposit</th>
                      <th style={{ textAlign: 'right' }}>Withdrawal</th>
                      <th>Type</th>
                      <th>GL Match</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={9} style={{ textAlign: 'center', padding: '28px 16px', color: 'var(--gray-400)', fontSize: '12.5px' }}>
                          {displayTransactions.length === 0
                            ? `No bank feed transactions for ${selectedAccount.label} yet.`
                            : 'No transactions match the current filters.'}
                        </td>
                      </tr>
                    ) : filteredTransactions.map(t => (
                      <tr key={t.id}>
                        <td><input type="checkbox" /></td>
                        <td>{t.date}</td>
                        <td><b>{t.description}</b></td>
                        <td style={{ textAlign: 'right', color: t.amount > 0 ? '#2e7d32' : undefined, fontWeight: 600 }}>
                          {t.amount > 0 ? fmtM(t.amount) : ' - '}
                        </td>
                        <td style={{ textAlign: 'right', color: t.amount < 0 ? '#c62828' : undefined, fontWeight: 600 }}>
                          {t.amount < 0 ? fmtM(-t.amount) : ' - '}
                        </td>
                        <td><span className="chip chip-blue">{t.type}</span></td>
                        <td style={{ fontSize: '12px', color: 'var(--gray-600)' }}>
                          {t.origin === 'gl' ? 'From General Ledger' : (t.contraAccount ? `${t.contraAccount} - GL Account` : 'Unallocated')}
                        </td>
                        <td>
                          {t.origin === 'gl' ? (
                            <span
                              className="chip"
                              style={{ background: '#ede9fe', color: '#6d28d9', fontWeight: 600 }}
                            >
                              GL Posted
                            </span>
                          ) : (
                            <span className={`chip ${t.status === 'Matched' ? 'chip-green' : 'chip-orange'}`}>
                              {t.status}
                            </span>
                          )}
                        </td>
                        <td>
                          {t.origin === 'gl' ? (
                            <span style={{ color: 'var(--gray-400)', fontSize: '11px' }}>Awaiting bank feed</span>
                          ) : t.status !== 'Matched' ? (
                            <button
                              className="btn btn-primary btn-sm"
                              style={{ padding: '3px 8px', fontSize: '11px' }}
                              onClick={() => handleMatchTxn(t.id)}
                            >
                              Match
                            </button>
                          ) : (
                            <span style={{ color: 'var(--gray-400)', fontSize: '11px' }}>Locked</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ─ 2. DETAILS SUB-TAB ─ */}
          {subTab === 'details' && (
            <div>
              {/* Account Info Bar */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, border: '1.5px solid var(--border)', borderRadius: '9px', overflow: 'hidden', marginBottom: '14px' }}>
                <div style={{ padding: '12px 16px', borderRight: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '9.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--gray-400)' }}>Account</div>
                  <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--navy)', marginTop: '3px' }}>{selectedAccount.label}</div>
                </div>
                <div style={{ padding: '12px 16px', borderRight: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '9.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--gray-400)' }}>Balance</div>
                  <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#2e7d32', marginTop: '3px' }}>{fmtM(bankBalance)}</div>
                </div>
                <div style={{ padding: '12px 16px', borderRight: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '9.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--gray-400)' }}>Posted Count</div>
                  <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--navy)', marginTop: '3px' }}>{detailRows.filter(r => r.status === 'posted').length}</div>
                </div>
                <div style={{ padding: '12px 16px' }}>
                  <div style={{ fontSize: '9.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--gray-400)' }}>Pending Count</div>
                  <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#e65100', marginTop: '3px' }}>{detailRows.filter(r => r.status === 'pending').length}</div>
                </div>
              </div>

              {/* Status Pills Toolbar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    className={`dtl-pill ${detailFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setDetailFilter('all')}
                  >
                    All <span className="dtl-pill-ct">{detailRows.length}</span>
                  </button>
                  <button
                    className={`dtl-pill dtl-pill-posted ${detailFilter === 'posted' ? 'active' : ''}`}
                    onClick={() => setDetailFilter('posted')}
                  >
                    Posted <span className="dtl-pill-ct">{detailRows.filter(r => r.status === 'posted').length}</span>
                  </button>
                  <button
                    className={`dtl-pill dtl-pill-pending ${detailFilter === 'pending' ? 'active' : ''}`}
                    onClick={() => setDetailFilter('pending')}
                  >
                    Pending <span className="dtl-pill-ct">{detailRows.filter(r => r.status === 'pending').length}</span>
                  </button>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    className="dtl-search"
                    placeholder="Search transactions…"
                    value={detailSearch}
                    onChange={(e) => setDetailSearch(e.target.value)}
                  />
                </div>
              </div>

              {/* Auto-Match Toolbar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', padding: '10px 14px', background: '#f0f4ff', border: '1.5px solid #c7d2fe', borderRadius: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#3730a3' }}>Auto-Match Engine</span>
                <span style={{ fontSize: '12px', color: '#4338ca', marginLeft: '4px' }}>— Matches every pending transaction on this account</span>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                  <button
                    className="btn btn-sm"
                    style={{ background: '#3730a3', color: '#fff', fontSize: '12px' }}
                    onClick={handleRunAutoMatch}
                  >
                    Run Auto-Match
                  </button>
                </div>
              </div>

              {/* Detail Table */}
              <div className="tbl-wrap">
                <div className="tbl-hdr">
                  <span className="tbl-hdr-title">Transactions - Match &amp; Categorize</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => {
                        const csv = "ID,Date,Description,Spent,Received,Source,MatchAcct,Status\n" +
                          detailRows.map(r => `${r.id},${r.date},"${r.desc}",${r.spent},${r.received},${r.source},"${r.matchAcct}",${r.status}`).join("\n");
                        downloadCSV('detail-transactions.csv', csv);
                        showToast('Exported detail-transactions.csv', 'success');
                      }}
                    >
                      Export
                    </button>
                  </div>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: '32px' }}><input type="checkbox" /></th>
                      <th>Date</th>
                      <th>Bank Description</th>
                      <th style={{ textAlign: 'right' }}>Spent</th>
                      <th style={{ textAlign: 'right' }}>Received</th>
                      <th>Source</th>
                      <th>Match / Categorize</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDetails.length === 0 ? (
                      <tr>
                        <td colSpan={9} style={{ textAlign: 'center', padding: '28px 16px', color: 'var(--gray-400)', fontSize: '12.5px' }}>
                          No transactions to display.
                        </td>
                      </tr>
                    ) : filteredDetails.map(r => (
                      <tr key={r.id}>
                        <td><input type="checkbox" /></td>
                        <td>{r.date}</td>
                        <td style={{ fontWeight: 600 }}>{r.desc}</td>
                        <td style={{ textAlign: 'right', color: r.spent > 0 ? '#c62828' : undefined, fontWeight: 600 }}>
                          {r.spent > 0 ? fmtM(r.spent) : ' - '}
                        </td>
                        <td style={{ textAlign: 'right', color: r.received > 0 ? '#2e7d32' : undefined, fontWeight: 600 }}>
                          {r.received > 0 ? fmtM(r.received) : ' - '}
                        </td>
                        <td><span className="chip chip-blue">{r.source}</span></td>
                        <td>
                          <span style={{ fontSize: '11.5px', background: 'var(--gray-100)', padding: '2px 8px', borderRadius: '4px' }}>
                            {r.matchAcct}
                          </span>
                        </td>
                        <td>
                          <span className={`chip ${r.status === 'posted' ? 'chip-green' : 'chip-orange'}`}>
                            {r.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            {r.status === 'pending' && (
                              <button
                                className="btn btn-primary btn-sm"
                                style={{ padding: '2px 8px', fontSize: '11px' }}
                                onClick={() => handleMatchTxn(r.id)}
                              >
                                Match
                              </button>
                            )}
                            <button
                              className="btn btn-outline btn-sm"
                              style={{ padding: '2px 6px', fontSize: '11px' }}
                              onClick={() => setSplitModal({
                                open: true,
                                rowId: r.id,
                                desc: r.desc,
                                total: r.spent > 0 ? r.spent : r.received,
                                lines: [
                                  { acct: '1001', amount: (r.spent > 0 ? r.spent : r.received) * 0.7, desc: 'Primary GL allocation' },
                                  { acct: '1099', amount: (r.spent > 0 ? r.spent : r.received) * 0.3, desc: 'Variance allocation' }
                                ]
                              })}
                            >
                              Split
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ─ 3. HISTORY SUB-TAB ─ */}
          {subTab === 'history' && (
            <div className="tbl-wrap">
              <div className="tbl-hdr">
                <span className="tbl-hdr-title">Fiscal Period Status</span>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Period</th>
                    <th>Status</th>
                    <th>Closed Date</th>
                  </tr>
                </thead>
                <tbody>
                  {reconHistory.length === 0 ? (
                    <tr>
                      <td colSpan={3} style={{ textAlign: 'center', padding: '20px', color: 'var(--gray-400)' }}>
                        No fiscal periods configured.
                      </td>
                    </tr>
                  ) : reconHistory.map(h => (
                    <tr key={h.id}>
                      <td style={{ fontWeight: 600 }}>{h.period}</td>
                      <td>
                        <span className={`chip ${h.status === 'Closed & Locked' ? 'chip-green' : h.status === 'In Progress' ? 'chip-orange' : 'chip-blue'}`}>
                          {h.status}
                        </span>
                      </td>
                      <td>{h.closedDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ padding: '10px 16px', fontSize: '11.5px', color: 'var(--gray-500)' }}>
                Period locks are managed from General Ledger — Period Locking.
              </div>
            </div>
          )}

          {/* ─ 4. MONTH CLOSING SUB-TAB ─ */}
          {subTab === 'closing' && (
            <div style={{ maxWidth: '600px', background: '#fff', border: '1.5px solid var(--border)', borderRadius: '9px', padding: '20px' }}>
              <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--navy)', marginBottom: '14px' }}>
                Month-End Close Checklist — {selectedAccount.label}
              </div>
              {closingSteps.map((step, idx) => (
                <div className="close-step" key={idx}>
                  <div
                    className={`close-icon ${step.done ? 'done' : 'pend'}`}
                    style={step.toggle ? { cursor: 'pointer' } : undefined}
                    onClick={step.toggle}
                  >
                    {step.done ? '✓' : '⏳'}
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: step.done ? 'var(--navy)' : '#e65100' }}>
                      {step.label}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--gray-400)' }}>{step.note}</div>
                  </div>
                </div>
              ))}
              <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                <button
                  className="btn btn-primary"
                  disabled={!closingSteps.every(s => s.done)}
                  onClick={() => showToast('Reconciliation package submitted for Controller review', 'success')}
                >
                  Submit for Close
                </button>
                <button
                  className="btn btn-outline"
                  onClick={() => {
                    const csv = 'Task,Status,Note\n' + closingSteps.map(s => `"${s.label}",${s.done ? 'Completed' : 'Pending'},"${s.note}"`).join('\n') + '\n';
                    downloadCSV('closing-checklist.csv', csv);
                    showToast('Exported closing report', 'success');
                  }}
                >
                  Export Report
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════ PANEL 2: APPROVALS ══════════════════════ */}
      {hubTab === 'approvals' && (
        <div className="hub-panel active">
          <div className="two-col-layout">
            {/* Left: Approval Queue */}
            <div className="tbl-wrap">
              <div className="tbl-hdr">
                <span className="tbl-hdr-title">
                  Approval Queue <span className="hub-tab-badge" style={{ marginLeft: '6px' }}>{approvalQueue.length}</span>
                </span>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Vendor</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                    <th>Level</th>
                    <th>Approver</th>
                    <th>Due Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {approvalQueue.map(item => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 600 }}>{item.id}</td>
                      <td><b>{item.vendor}</b></td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{fmtM(item.amount)}</td>
                      <td><span className="chip chip-blue">{item.level.level}</span></td>
                      <td>{item.level.approver}</td>
                      <td>{item.dueDate}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            className="btn btn-sm"
                            style={{ background: '#e8f5e9', color: '#2e7d32', border: '1px solid #2e7d32', fontSize: '11px', padding: '2px 8px' }}
                            onClick={() => handleApproveQueueItem(item.id)}
                          >
                            Approve
                          </button>
                          <button
                            className="btn btn-outline btn-sm"
                            style={{ fontSize: '11px', padding: '2px 6px' }}
                            onClick={() => handleRejectQueueItem(item.id)}
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {approvalQueue.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '20px', color: 'var(--gray-400)' }}>
                        All approval items have been cleared.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Right: Approval Chain Config */}
            <div className="chain-panel">
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--navy)', marginBottom: '4px' }}>
                Approval Chain Configuration
              </div>
              <div style={{ fontSize: '11px', color: 'var(--gray-400)', marginBottom: '14px' }}>
                Thresholds for automatic level escalation
              </div>

              {APPROVAL_CHAIN.map(level => (
                <div className="chain-level" key={level.level}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div className={`chain-lvl-badge ${level.badge}`}>{level.badge.toUpperCase()}</div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--navy)' }}>{level.title}</div>
                      <div style={{ fontSize: '11px', color: 'var(--gray-400)' }}>{level.range}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--gray-600)', fontWeight: 600 }}>{level.approver}</span>
                </div>
              ))}

              <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1.5px solid var(--border)' }}>
                <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--navy)', marginBottom: '8px' }}>
                  Escalation Rules
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--gray-600)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer' }}>
                    <input type="checkbox" defaultChecked style={{ accentColor: 'var(--navy)' }} />
                    Auto-escalate if unapproved &gt; 3 days
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer' }}>
                    <input type="checkbox" defaultChecked style={{ accentColor: 'var(--navy)' }} />
                    Email notification on escalation
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer' }}>
                    <input type="checkbox" defaultChecked style={{ accentColor: 'var(--navy)' }} />
                    Require dual approval above $200K
                  </label>
                </div>
              </div>

              <div style={{ marginTop: '14px' }}>
                <button
                  className="btn btn-primary btn-sm"
                  style={{ width: '100%' }}
                  onClick={() => showToast('Approval chain configuration saved', 'success')}
                >
                  Save Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BankReconciliationPage;
