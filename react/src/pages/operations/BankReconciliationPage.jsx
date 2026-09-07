import React, { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useFinance } from '../../context/FinanceContext';
import './bank-reconciliation.css';

const INITIAL_RECON_TRANSACTIONS = [
  { id: 'TXN-88201', date: '2026-05-20', checkNum: ' - ', payee: 'Ayushi Transport Logistics LLC', deposit: 39260.00, withdrawal: 0, type: 'ACH Wire In', glMatch: 'JE-2026-0001 (AR Subledger)', status: 'Matched' },
  { id: 'TXN-88202', date: '2026-05-19', checkNum: 'CHK-9401', payee: 'Texas Dept of Insurance Stamping Office', deposit: 0, withdrawal: 175.00, type: 'Check', glMatch: 'JE-2026-0002 (Tax Filing)', status: 'Matched' },
  { id: 'TXN-88203', date: '2026-05-18', checkNum: ' - ', payee: 'Retail Broker Retained Commission Wire', deposit: 0, withdrawal: 2500.00, type: 'ACH Wire Out', glMatch: 'JE-2026-0003 (Commission Expense)', status: 'Matched' },
  { id: 'TXN-88204', date: '2026-05-17', checkNum: ' - ', payee: 'RSA Partners Premium In-Transit Wire', deposit: 3440.00, withdrawal: 0, type: 'Deposit', glMatch: 'Unallocated Suspense (Account 1099)', status: 'Pending' },
  { id: 'TXN-88205', date: '2026-05-16', checkNum: ' - ', payee: 'Sedgwick Claims TPA Monthly Admin Overhead', deposit: 0, withdrawal: 12400.00, type: 'ACH Debit', glMatch: 'JE-2026-0004 (AP Subledger)', status: 'Matched' },
  { id: 'TXN-88206', date: '2026-05-15', checkNum: ' - ', payee: 'Baker McKenzie Legal Consultation Retainer', deposit: 0, withdrawal: 4800.00, type: 'Wire Transfer', glMatch: 'JE-2026-0005 (Legal Expense)', status: 'Matched' },
  { id: 'TXN-88207', date: '2026-05-14', checkNum: ' - ', payee: 'AWS Cloud Hosting Monthly Infrastructure', deposit: 0, withdrawal: 1240.00, type: 'ACH Debit', glMatch: 'Account 6200 - Technology', status: 'Matched' }
];

const INITIAL_DETAIL_ROWS = [
  { id: 'DTL-001', date: '2026-05-20', desc: 'Ayushi Transport Logistics Binder Premium Wire In', spent: 0, received: 39260.00, source: 'Wire', fromTo: 'Ayushi Fleet', matchAcct: '1100 - Premium Receivable', status: 'posted' },
  { id: 'DTL-002', date: '2026-05-19', desc: 'Texas DOI Surplus Lines Stamping Fee Filing', spent: 175.00, received: 0, source: 'Check', fromTo: 'TDI Office', matchAcct: '2300 - Stamping Fee Payable', status: 'posted' },
  { id: 'DTL-003', date: '2026-05-18', desc: 'HIT Wholesale Retail Broker Commission ACH', spent: 2500.00, received: 0, source: 'ACH', fromTo: 'Retail Broker', matchAcct: '5100 - Broker Commission', status: 'posted' },
  { id: 'DTL-004', date: '2026-05-17', desc: 'Unidentified Premium Remittance - RSA Partners in-transit', spent: 0, received: 3440.00, source: 'Deposit', fromTo: 'RSA Partners', matchAcct: '1099 - Unallocated Suspense', status: 'pending' },
  { id: 'DTL-005', date: '2026-05-16', desc: 'Sedgwick Monthly Claims Administration Overhead', spent: 12400.00, received: 0, source: 'ACH', fromTo: 'Sedgwick TPA', matchAcct: '5800 - Claims LAE Expense', status: 'posted' },
  { id: 'DTL-006', date: '2026-05-15', desc: 'Baker McKenzie Retainer Legal Services Wire', spent: 4800.00, received: 0, source: 'Wire', fromTo: 'Baker McKenzie', matchAcct: '6400 - Legal & Compliance', status: 'posted' },
  { id: 'DTL-007', date: '2026-05-14', desc: 'JPMorgan Monthly Wire Analysis & Maintenance Fee', spent: 125.00, received: 0, source: 'Fee', fromTo: 'JPMorgan Chase', matchAcct: '6800 - Bank Service Charges', status: 'excluded' }
];

const INITIAL_APPROVAL_QUEUE = [
  { id: 'INV-AP-4821', vendor: 'Sedgwick Claims Management', amount: 84200.00, level: 'L2 - Finance', approver: 'Sarah Chen', date: '05/20/2026', status: 'Pending' },
  { id: 'INV-AP-4822', vendor: 'Baker McKenzie LLP', amount: 48240.00, level: 'L1 - Manager', approver: 'James Smith', date: '05/19/2026', status: 'Pending' },
  { id: 'INV-AP-4823', vendor: 'Westfield Reinsurance Syndicate', amount: 168500.00, level: 'L3 - CFO', approver: 'Sarah Chen', date: '05/18/2026', status: 'Pending' },
  { id: 'INV-AP-4824', vendor: 'Crawford & Co. Claims Loss Adjusters', amount: 32400.00, level: 'L1 - Manager', approver: 'James Smith', date: '05/17/2026', status: 'Pending' },
  { id: 'INV-AP-4825', vendor: 'Amazon Web Services Cloud Infrastructure', amount: 1240.00, level: 'L1 - Manager', approver: 'James Smith', date: '05/16/2026', status: 'Pending' }
];

const RECON_HISTORY = [
  { period: 'May 2026', account: 'Chase Commercial Operating (****4821)', closedBy: 'In Progress', closedDate: 'Open', bankBal: '$4,821,340', glBal: '$4,817,900', diff: '$3,440', status: 'Pending' },
  { period: 'April 2026', account: 'Chase Commercial Operating (****4821)', closedBy: 'David Rodriguez', closedDate: '04/30/2026', bankBal: '$4,112,870', glBal: '$4,112,870', diff: '$0.00', status: 'Balanced' },
  { period: 'March 2026', account: 'Chase Commercial Operating (****4821)', closedBy: 'David Rodriguez', closedDate: '03/31/2026', bankBal: '$3,892,100', glBal: '$3,892,100', diff: '$0.00', status: 'Balanced' },
  { period: 'February 2026', account: 'Chase Commercial Operating (****4821)', closedBy: 'David Rodriguez', closedDate: '02/28/2026', bankBal: '$3,420,500', glBal: '$3,420,500', diff: '$0.00', status: 'Balanced' },
  { period: 'January 2026', account: 'Chase Commercial Operating (****4821)', closedBy: 'David Rodriguez', closedDate: '01/31/2026', bankBal: '$3,150,000', glBal: '$3,150,000', diff: '$0.00', status: 'Balanced' }
];

export function BankReconciliationPage() {
  const { getAccountBalance } = useFinance();
  const location = useLocation();
  const navigate = useNavigate();

  // Top Hub Tab: 'recon' | 'approvals' — derived from the URL hash so the
  // sidebar's /bank-reconciliation#recon-approvals link switches it automatically.
  const hubTab = location.hash.replace('#', '') === 'recon-approvals' ? 'approvals' : 'recon';

  const selectHubTab = (tab) => {
    navigate(tab === 'approvals' ? '/bank-reconciliation#recon-approvals' : '/bank-reconciliation', { replace: true });
  };

  // Sub-tabs under 'recon': 'listing' | 'details' | 'history' | 'closing'
  const [subTab, setSubTab] = useState('listing');

  // Filter & Search states
  const [selectedBank, setSelectedBank] = useState('100101 - Chase Commercial Operating Account');
  const [accountNo, setAccountNo] = useState('****4821');
  const [glAccount, setGlAccount] = useState('1001');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  // Detail view filters
  const [detailFilter, setDetailFilter] = useState('all'); // 'all' | 'posted' | 'pending' | 'excluded'
  const [detailSearch, setDetailSearch] = useState('');

  // Transactions State
  const [transactions, setTransactions] = useState(INITIAL_RECON_TRANSACTIONS);
  const [detailRows, setDetailRows] = useState(INITIAL_DETAIL_ROWS);
  const [approvalQueue, setApprovalQueue] = useState(INITIAL_APPROVAL_QUEUE);

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

  // Live General Ledger Balance for Account 1001
  const glBal = useMemo(() => {
    const b = getAccountBalance('1001');
    return b ? b.net : 36760.00;
  }, [getAccountBalance]);

  // Bank balance calculation
  const bankBalance = 4821340.00;
  const difference = 3440.00;

  // Handle Match Transaction
  const handleMatchTxn = (id) => {
    setTransactions(prev => prev.map(t => {
      if (t.id === id) {
        return { ...t, status: 'Matched', glMatch: 'JE-2026-0006 (Manually Reconciled)' };
      }
      return t;
    }));
    showToast(`Transaction ${id} matched to general ledger`, 'success');
  };

  // Handle Detail Match
  const handleDetailMatch = (id) => {
    setDetailRows(prev => prev.map(r => r.id === id ? { ...r, status: 'posted' } : r));
    showToast(`Transaction ${id} matched & posted to GL`, 'success');
  };

  // Handle Auto-Sync
  const handleAutoSync = () => {
    showToast('Connecting to Chase Commercial banking gateway via BAI2/OFX…', 'info');
    setTimeout(() => {
      showToast('Bank feeds synchronized. 284 transactions processed.', 'success');
    }, 1500);
  };

  // Handle Auto-Match
  const handleRunAutoMatch = () => {
    showToast('Running AI rule matching against General Ledger…', 'info');
    setTimeout(() => {
      setTransactions(prev => prev.map(t => t.status === 'Pending' ? { ...t, status: 'Matched', glMatch: 'Auto-Matched (Rule #4)' } : t));
      setDetailRows(prev => prev.map(r => r.status === 'pending' ? { ...r, status: 'posted' } : r));
      showToast('Auto-matching completed. Match rate: 98.4%', 'success');
    }, 1200);
  };

  // Handle Approvals
  const handleApproveQueueItem = (id) => {
    setApprovalQueue(prev => prev.filter(item => item.id !== id));
    showToast(`Approved disbursement ${id}. Released for payment.`, 'success');
  };

  const handleRejectQueueItem = (id) => {
    setApprovalQueue(prev => prev.filter(item => item.id !== id));
    showToast(`Rejected disbursement ${id}. Returned to submitter.`, 'warning');
  };

  // Filtered detail rows
  const filteredDetails = detailRows.filter(r => {
    if (detailFilter !== 'all' && r.status !== detailFilter) return false;
    if (detailSearch) {
      const term = detailSearch.toLowerCase();
      return r.desc.toLowerCase().includes(term) || r.fromTo.toLowerCase().includes(term) || r.matchAcct.toLowerCase().includes(term);
    }
    return true;
  });

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
                      <option value="1001">1001 - Operating Cash</option>
                      <option value="1099">1099 - Suspense Account</option>
                      <option value="2200">2200 - Premium Payable</option>
                      <option value="5800">5800 - Claims LAE</option>
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
          <div className="page-subtitle">Veridex Finance System · Period: May 2026 YTD</div>
        </div>
        <div className="page-actions">
          <button
            className="btn btn-outline btn-sm"
            onClick={() => {
              const csv = "Date,Check #,Payee,Deposit,Withdrawal,Type,GLMatch,Status\n" +
                transactions.map(t => `${t.date},${t.checkNum},"${t.payee}",${t.deposit},${t.withdrawal},${t.type},"${t.glMatch}",${t.status}`).join("\n");
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
                  <label className="form-label">Bank</label>
                  <select
                    className="form-ctrl"
                    value={selectedBank}
                    onChange={(e) => {
                      setSelectedBank(e.target.value);
                      if (e.target.value.includes('Wells Fargo')) setAccountNo('****5561');
                      else if (e.target.value.includes('SOUTHLAKE')) setAccountNo('****0874');
                      else setAccountNo('****4821');
                      showToast(`Switched account to ${e.target.value}`, 'info');
                    }}
                  >
                    <option>100101 - Chase Commercial Operating Account</option>
                    <option>100102 - Wells Fargo Premium Trust Account</option>
                    <option>100103 - SOUTHLAKE Claims Clearing Account</option>
                  </select>
                </div>
                <div className="form-field">
                  <label className="form-label">Account No</label>
                  <input className="form-ctrl form-ctrl-sm" value={accountNo} readOnly />
                </div>
                <div className="form-field">
                  <label className="form-label">G/L Account</label>
                  <select
                    className="form-ctrl form-ctrl-sm"
                    value={glAccount}
                    onChange={(e) => setGlAccount(e.target.value)}
                  >
                    <option value="1001">1001 - Cash / Bank (Operating)</option>
                    <option value="1010">1010 - Cash &amp; Equivalents</option>
                    <option value="1020">1020 - Premium Trust</option>
                  </select>
                </div>
                <div className="form-field">
                  <label className="form-label">Period Close Date</label>
                  <input type="date" className="form-ctrl form-ctrl-sm" defaultValue="2026-05-31" />
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
                    <option>Pending</option>
                    <option>Exception</option>
                  </select>
                </div>
                <button
                  className="btn btn-primary"
                  style={{ alignSelf: 'flex-end' }}
                  onClick={() => showToast('Fetched live feed transactions for May 2026', 'success')}
                >
                  Get Transactions
                </button>
              </div>

              {/* 4 KPI Strip */}
              <div className="kpi-strip kpi-strip-4">
                <div className="kpi-tile">
                  <div className="kpi-tile-lbl">Bank Balance</div>
                  <div className="kpi-tile-val">{fmtM(bankBalance)}</div>
                  <div className="kpi-tile-sub">As of May 31, 2026</div>
                </div>
                <div className="kpi-tile">
                  <div className="kpi-tile-lbl">GL Balance</div>
                  <div className="kpi-tile-val">{fmtM(glBal || 4817900)}</div>
                  <div className="kpi-tile-sub">Account {glAccount}</div>
                </div>
                <div className="kpi-tile">
                  <div className="kpi-tile-lbl">Difference</div>
                  <div className="kpi-tile-val" style={{ color: '#e65100' }}>{fmtM(difference)}</div>
                  <div className="kpi-tile-sub warn">↑ Needs attention</div>
                </div>
                <div className="kpi-tile">
                  <div className="kpi-tile-lbl">Matched Txns</div>
                  <div className="kpi-tile-val">284</div>
                  <div className="kpi-tile-sub up">↑ 92.5% auto-matched</div>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="tbl-wrap">
                <div className="tbl-hdr">
                  <span className="tbl-hdr-title">Transactions - May 2026</span>
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
                        const csv = "Date,Check,Payee,Deposit,Withdrawal,Type,Match,Status\n" +
                          transactions.map(t => `${t.date},${t.checkNum},"${t.payee}",${t.deposit},${t.withdrawal},${t.type},"${t.glMatch}",${t.status}`).join("\n");
                        downloadCSV('transactions-may-2026.csv', csv);
                        showToast('Exported transactions-may-2026.csv', 'success');
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
                      <th>Check #</th>
                      <th>Payee / Payor</th>
                      <th style={{ textAlign: 'right' }}>Deposit</th>
                      <th style={{ textAlign: 'right' }}>Withdrawal</th>
                      <th>Type</th>
                      <th>GL Match</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions
                      .filter(t => statusFilter === 'All' || t.status === statusFilter)
                      .filter(t => !searchTerm || t.payee.toLowerCase().includes(searchTerm.toLowerCase()) || t.glMatch.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map(t => (
                        <tr key={t.id}>
                          <td><input type="checkbox" /></td>
                          <td>{t.date}</td>
                          <td style={{ fontFamily: 'monospace', fontSize: '11px' }}>{t.checkNum}</td>
                          <td><b>{t.payee}</b></td>
                          <td style={{ textAlign: 'right', color: t.deposit > 0 ? '#2e7d32' : undefined, fontWeight: 600 }}>
                            {t.deposit > 0 ? fmtM(t.deposit) : ' - '}
                          </td>
                          <td style={{ textAlign: 'right', color: t.withdrawal > 0 ? '#c62828' : undefined, fontWeight: 600 }}>
                            {t.withdrawal > 0 ? fmtM(t.withdrawal) : ' - '}
                          </td>
                          <td><span className="chip chip-blue">{t.type}</span></td>
                          <td style={{ fontSize: '12px', color: 'var(--gray-600)' }}>{t.glMatch}</td>
                          <td>
                            <span className={`chip ${t.status === 'Matched' ? 'chip-green' : 'chip-orange'}`}>
                              {t.status}
                            </span>
                          </td>
                          <td>
                            {t.status === 'Pending' ? (
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 0, border: '1.5px solid var(--border)', borderRadius: '9px', overflow: 'hidden', marginBottom: '14px' }}>
                <div style={{ padding: '12px 16px', borderRight: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '9.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--gray-400)' }}>Account</div>
                  <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--navy)', marginTop: '3px' }}>100101 - Chase Commercial (****4821)</div>
                </div>
                <div style={{ padding: '12px 16px', borderRight: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '9.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--gray-400)' }}>Balance</div>
                  <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#2e7d32', marginTop: '3px' }}>$4,821,340.00</div>
                </div>
                <div style={{ padding: '12px 16px', borderRight: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '9.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--gray-400)' }}>Posted Count</div>
                  <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--navy)', marginTop: '3px' }}>{detailRows.filter(r => r.status === 'posted').length}</div>
                </div>
                <div style={{ padding: '12px 16px', borderRight: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '9.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--gray-400)' }}>Pending Count</div>
                  <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#e65100', marginTop: '3px' }}>{detailRows.filter(r => r.status === 'pending').length}</div>
                </div>
                <div style={{ padding: '12px 16px' }}>
                  <div style={{ fontSize: '9.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--gray-400)' }}>Updated On</div>
                  <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--navy)', marginTop: '3px' }}>2026-05-31</div>
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
                  <button
                    className={`dtl-pill dtl-pill-excluded ${detailFilter === 'excluded' ? 'active' : ''}`}
                    onClick={() => setDetailFilter('excluded')}
                  >
                    Excluded <span className="dtl-pill-ct">{detailRows.filter(r => r.status === 'excluded').length}</span>
                  </button>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    className="dtl-search"
                    placeholder="Search transactions…"
                    value={detailSearch}
                    onChange={(e) => setDetailSearch(e.target.value)}
                  />
                  <button className="btn btn-primary btn-sm" onClick={() => showToast('Changes committed to transaction journal', 'success')}>
                    Save
                  </button>
                </div>
              </div>

              {/* Auto-Match Toolbar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', padding: '10px 14px', background: '#f0f4ff', border: '1.5px solid #c7d2fe', borderRadius: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#3730a3' }}>Auto-Match Engine</span>
                <span style={{ fontSize: '12px', color: '#4338ca', marginLeft: '4px' }}>— Real-time ledger matching rules active</span>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                  <button
                    className="btn btn-sm"
                    style={{ background: '#3730a3', color: '#fff', fontSize: '12px' }}
                    onClick={handleRunAutoMatch}
                  >
                    Run Auto-Match
                  </button>
                  <button
                    className="btn btn-outline btn-sm"
                    style={{ fontSize: '12px' }}
                    onClick={() => showToast('Match rules configuration opened', 'info')}
                  >
                    Configure Rules
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
                        setDetailRows(prev => prev.map(r => ({ ...r, status: 'posted' })));
                        showToast('Bulk matched all pending items', 'success');
                      }}
                    >
                      Bulk Match
                    </button>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => {
                        const csv = "ID,Date,Description,Spent,Received,Source,FromTo,MatchAcct,Status\n" +
                          detailRows.map(r => `${r.id},${r.date},"${r.desc}",${r.spent},${r.received},${r.source},"${r.fromTo}","${r.matchAcct}",${r.status}`).join("\n");
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
                      <th>From / To</th>
                      <th>Match / Categorize</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDetails.map(r => (
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
                        <td>{r.fromTo}</td>
                        <td>
                          <span style={{ fontSize: '11.5px', background: 'var(--gray-100)', padding: '2px 8px', borderRadius: '4px' }}>
                            {r.matchAcct}
                          </span>
                        </td>
                        <td>
                          <span className={`chip ${r.status === 'posted' ? 'chip-green' : r.status === 'pending' ? 'chip-orange' : 'chip-purple'}`}>
                            {r.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            {r.status === 'pending' && (
                              <button
                                className="btn btn-primary btn-sm"
                                style={{ padding: '2px 8px', fontSize: '11px' }}
                                onClick={() => handleDetailMatch(r.id)}
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
              <div className="tbl-hdr"><span className="tbl-hdr-title">Reconciliation History</span></div>
              <table>
                <thead>
                  <tr>
                    <th>Period</th>
                    <th>Account</th>
                    <th>Closed By</th>
                    <th>Closed Date</th>
                    <th style={{ textAlign: 'right' }}>Bank Balance</th>
                    <th style={{ textAlign: 'right' }}>GL Balance</th>
                    <th style={{ textAlign: 'right' }}>Difference</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {RECON_HISTORY.map(h => (
                    <tr key={h.period}>
                      <td style={{ fontWeight: 600 }}>{h.period}</td>
                      <td>{h.account}</td>
                      <td>{h.closedBy}</td>
                      <td>{h.closedDate}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{h.bankBal}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{h.glBal}</td>
                      <td style={{ textAlign: 'right', color: h.diff === '$0.00' ? '#2e7d32' : '#e65100', fontWeight: 700 }}>
                        {h.diff}
                      </td>
                      <td>
                        <span className={`chip ${h.status === 'Balanced' ? 'chip-green' : 'chip-orange'}`}>
                          {h.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ─ 4. MONTH CLOSING SUB-TAB ─ */}
          {subTab === 'closing' && (
            <div style={{ maxWidth: '600px', background: '#fff', border: '1.5px solid var(--border)', borderRadius: '9px', padding: '20px' }}>
              <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--navy)', marginBottom: '14px' }}>
                Month-End Close Checklist - May 2026
              </div>
              <div className="close-step">
                <div className="close-icon done">✓</div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--navy)' }}>All deposits matched</div>
                  <div style={{ fontSize: '11px', color: 'var(--gray-400)' }}>Completed · James Smith · May 31</div>
                </div>
              </div>
              <div className="close-step">
                <div className="close-icon done">✓</div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--navy)' }}>Outstanding checks reviewed</div>
                  <div style={{ fontSize: '11px', color: 'var(--gray-400)' }}>Completed · James Smith · May 31</div>
                </div>
              </div>
              <div className="close-step">
                <div className="close-icon pend">⏳</div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#e65100' }}>Difference of $3,440 resolved</div>
                  <div style={{ fontSize: '11px', color: 'var(--gray-400)' }}>Pending - in-transit deposit from RSA Partners</div>
                </div>
              </div>
              <div className="close-step">
                <div className="close-icon pend">⏳</div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#e65100' }}>CFO sign-off</div>
                  <div style={{ fontSize: '11px', color: 'var(--gray-400)' }}>Awaiting Margaret Chen approval</div>
                </div>
              </div>
              <div className="close-step">
                <div className="close-icon done">✓</div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--navy)' }}>Bank fee exceptions coded</div>
                  <div style={{ fontSize: '11px', color: 'var(--gray-400)' }}>Completed · Robert Patel · May 30</div>
                </div>
              </div>
              <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                <button
                  className="btn btn-primary"
                  onClick={() => showToast('Reconciliation package submitted for Controller review', 'success')}
                >
                  Submit for Close
                </button>
                <button
                  className="btn btn-outline"
                  onClick={() => {
                    downloadCSV('closing-checklist-may2026.csv', 'Task,Status,Owner\nAll deposits matched,Completed,James Smith\nOutstanding checks reviewed,Completed,James Smith\nDifference of $3440 resolved,Pending,RSA Partners in-transit\nCFO sign-off,Pending,Margaret Chen\nBank fee exceptions,Completed,Robert Patel\n');
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
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select className="form-ctrl form-ctrl-sm">
                    <option>All Levels</option>
                    <option>L1 - Manager</option>
                    <option>L2 - Finance</option>
                    <option>L3 - CFO</option>
                  </select>
                </div>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Vendor</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                    <th>Level</th>
                    <th>Approver</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {approvalQueue.map(item => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 600 }}>{item.id}</td>
                      <td><b>{item.vendor}</b></td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{fmtM(item.amount)}</td>
                      <td><span className="chip chip-blue">{item.level}</span></td>
                      <td>{item.approver}</td>
                      <td>{item.date}</td>
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

              <div className="chain-level">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="chain-lvl-badge l1">L1</div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--navy)' }}>Manager</div>
                    <div style={{ fontSize: '11px', color: 'var(--gray-400)' }}>Up to $50,000</div>
                  </div>
                </div>
                <span style={{ fontSize: '12px', color: 'var(--gray-600)', fontWeight: 600 }}>James Smith</span>
              </div>

              <div className="chain-level">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="chain-lvl-badge l2">L2</div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--navy)' }}>Finance Director</div>
                    <div style={{ fontSize: '11px', color: 'var(--gray-400)' }}>$50,001 – $150,000</div>
                  </div>
                </div>
                <span style={{ fontSize: '12px', color: 'var(--gray-600)', fontWeight: 600 }}>Sarah Chen</span>
              </div>

              <div className="chain-level">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="chain-lvl-badge l3">L3</div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--navy)' }}>CFO</div>
                    <div style={{ fontSize: '11px', color: 'var(--gray-400)' }}>Above $150,000</div>
                  </div>
                </div>
                <span style={{ fontSize: '12px', color: 'var(--gray-600)', fontWeight: 600 }}>Margaret Chen</span>
              </div>

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
