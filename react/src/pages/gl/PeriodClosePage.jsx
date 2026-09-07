import React, { useState, useEffect, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import './period-locking.css';

/* ══════════════════════════════════════════════════
   STATIC CONFIG & DATA
   ══════════════════════════════════════════════════ */
const INITIAL_MONTHS = [
  { label: 'Jan 2026', soft: true,  hard: true,  state: 'locked',   changeable: false },
  { label: 'Feb 2026', soft: true,  hard: true,  state: 'locked',   changeable: false },
  { label: 'Mar 2026', soft: true,  hard: true,  state: 'locked',   changeable: false },
  { label: 'Apr 2026', soft: true,  hard: false, state: 'progress', changeable: 'validated' },
  { label: 'May 2026', soft: false, hard: false, state: 'open',     changeable: true },
  { label: 'Jun 2026', soft: false, hard: false, state: 'open',     changeable: true },
  { label: 'Jul 2026', soft: false, hard: false, state: 'open',     changeable: true },
  { label: 'Aug 2026', soft: false, hard: false, state: 'open',     changeable: true },
  { label: 'Sep 2026', soft: false, hard: false, state: 'open',     changeable: true },
  { label: 'Oct 2026', soft: false, hard: false, state: 'open',     changeable: true },
  { label: 'Nov 2026', soft: false, hard: false, state: 'open',     changeable: true },
  { label: 'Dec 2026', soft: false, hard: false, state: 'open',     changeable: true },
];

const INITIAL_BANKS = [
  { id: 'BNK-001', name: 'Huntington National', acct: '****4421', bal: '$1,248,330', recon: 'variance', soft: true,  hard: false },
  { id: 'BNK-002', name: 'Chase Commercial',    acct: '****7782', bal: '$4,112,870', recon: 'balanced', soft: true,  hard: false },
  { id: 'BNK-003', name: 'First Republic Ops',  acct: '****3309', bal: '$892,400',   recon: 'balanced', soft: true,  hard: false },
  { id: 'BNK-004', name: 'Wells Fargo Trust',   acct: '****5561', bal: '$2,670,500', recon: 'balanced', soft: true,  hard: false },
  { id: 'BNK-005', name: 'PNC Disbursements',   acct: '****0874', bal: '$410,220',   recon: 'pending',  soft: false, hard: false },
];

const VCHECK = [
  { key: 'cr',  label: 'Cash Receipt Register',  cat: 'Balance',    result: 'pass',    detail: '14 receipts · $2,412,880 balanced',            fixable: false },
  { key: 'chk', label: 'Check Register',         cat: 'Balance',    result: 'pass',    detail: '23 checks · $1,803,410 balanced',               fixable: false },
  { key: 'je',  label: 'Journal Entry Register', cat: 'Approval',   result: 'blocker', detail: '3 JEs pending CFO authorization - $2.1M',        fixable: true  },
  { key: 'inv', label: 'Invoice Register',       cat: 'Balance',    result: 'pass',    detail: '47 invoices · $890,245 balanced',               fixable: false },
  { key: 'ap',  label: 'AP Aging Balance',       cat: 'Tolerance',  result: 'pass',    detail: '$340,112 outstanding · within $500K limit',      fixable: false },
  { key: 'br',  label: 'Bank Reconciliation',    cat: 'Variance',   result: 'blocker', detail: '$12,450 out-of-balance - Huntington ****4421',   fixable: true  },
  { key: 'ace', label: 'ACE vs Invoice System',  cat: 'Integrity',  result: 'pass',    detail: 'Totals match - $0.01 tolerance',                fixable: false },
  { key: 'pg',  label: 'Premium vs GL Recon',    cat: 'Reconcile',  result: 'warning', detail: 'NTA variance $87,200 - under Controller review', fixable: false },
  { key: 'cl',  label: 'Claims vs TPA Recon',    cat: 'Reconcile',  result: 'warning', detail: '$15,900 discrepancy - documented non-blocking',  fixable: false },
];

const INITIAL_MATRIX = [
  { n: 1,  reg: 'Cash Receipts',       cat: 'Balance',     desc: 'Total receipts vs bank deposits',        exp: '$2,412,880', act: '$2,412,880', v: '$0.00',   r: 'pass' },
  { n: 2,  reg: 'Check Register',      cat: 'Balance',     desc: 'Issued checks vs GL disbursements',      exp: '$1,803,410', act: '$1,803,410', v: '$0.00',   r: 'pass' },
  { n: 3,  reg: 'Journal Entries',     cat: 'Approval',    desc: 'Unapproved JEs pending CFO sign-off',    exp: '0 pending',  act: '3 pending',  v: '3 items', r: 'blocker', fixKey: 'je' },
  { n: 4,  reg: 'Invoice Register',    cat: 'Balance',     desc: 'Invoice totals vs accounts payable',     exp: '$890,245',   act: '$890,245',   v: '$0.00',   r: 'pass' },
  { n: 5,  reg: 'AP Aging',            cat: 'Tolerance',   desc: 'AP balance within close tolerance',      exp: '< $500K',    act: '$340,112',   v: 'Within',  r: 'pass' },
  { n: 6,  reg: 'Bank Reconciliation', cat: 'Variance',    desc: 'Book balance vs bank statement',         exp: '$0.00',      act: '$12,450',    v: '$12,450', r: 'blocker', fixKey: 'br' },
  { n: 7,  reg: 'ACE System',          cat: 'Integrity',   desc: 'ACE total vs invoice system totals',     exp: 'Match',      act: 'Match',      v: '< $0.01', r: 'pass' },
  { n: 8,  reg: 'Premium GL',          cat: 'Reconcile',   desc: 'Written premium vs GL account',         exp: 'Balanced',   act: '$87,200 var',v: '$87,200', r: 'warning' },
  { n: 9,  reg: 'Claims TPA',          cat: 'Reconcile',   desc: 'Claims subledger vs TPA feed',           exp: 'Balanced',   act: '$15,900 var',v: '$15,900', r: 'warning' },
  { n: 10, reg: 'Reinsurance Cession', cat: 'Balance',     desc: 'Ceded premium vs treaty schedule',       exp: '$441,000',   act: '$441,000',   v: '$0.00',   r: 'pass' },
  { n: 11, reg: 'AR Aging',            cat: 'Completeness',desc: 'Receivables aging schedule complete',    exp: 'All posted', act: 'All posted', v: ' - ',       r: 'pass' },
  { n: 12, reg: 'Loss Reserves',       cat: 'Actuarial',   desc: 'Reserve adequacy vs IBNR output',        exp: 'Adequate',   act: 'Adequate',   v: ' - ',       r: 'pass' },
  { n: 13, reg: 'Subledger Feeds',     cat: 'Cutoff',      desc: 'All subledger feeds posted by cutoff',  exp: 'Complete',   act: 'Complete',   v: ' - ',       r: 'pass' },
  { n: 14, reg: 'Trial Balance',       cat: 'Balance',     desc: 'Total debits equal total credits',        exp: 'Balanced',   act: 'Balanced',   v: '$0.00',   r: 'pass' },
];

const INITIAL_LEDGER_REPORTS = [
  { id: 'itd-ace',  title: 'ITD Accounting Cost Engine',  desc: 'Full inception-to-date ACE roll-forward',              status: 'ready',   updated: '2026-04-30', size: '4.2 MB' },
  { id: 'mtd-ace',  title: 'Current Month Claims',           desc: 'April 2026 monthly ACE with line detail',              status: 'ready',   updated: '2026-04-30', size: '1.8 MB' },
  { id: 'tb',       title: 'Trial Balance',                desc: 'Balance sheet trial balance as of 04/30/2026',         status: 'ready',   updated: '2026-04-30', size: '0.9 MB' },
  { id: 'bank-rec', title: 'Bank Reconciliation Summary', desc: 'Multi-bank recon - Huntington variance noted',          status: 'warning', updated: '2026-04-30', size: '0.6 MB' },
  { id: 'prem-sub', title: 'Premium Subledger Extract',   desc: 'Premium register with full policy-level detail',       status: 'ready',   updated: '2026-04-30', size: '3.1 MB' },
  { id: 'ri-cess',  title: 'Reinsurance Cession Summary', desc: 'Ceded premium and loss cession by treaty',             status: 'ready',   updated: '2026-04-30', size: '1.4 MB' },
  { id: 'ap-aging', title: 'AP Aging Report',             desc: 'Accounts payable aging - 30 / 60 / 90 day buckets',   status: 'ready',   updated: '2026-04-30', size: '0.8 MB' },
  { id: 'je-reg',   title: 'Journal Entry Register',      desc: 'Full JE listing - 3 entries pending CFO approval',    status: 'blocked', updated: '2026-04-30', size: '1.2 MB' },
  { id: 'ar-aging', title: 'AR Aging Report',             desc: 'Accounts receivable aging by policy and producer',     status: 'ready',   updated: '2026-04-30', size: '1.1 MB' },
  { id: 'loss-cap', title: 'Loss Cap Report',             desc: 'Loss-capped allocations vs per-occurrence limits',      status: 'ready',   updated: '2026-04-30', size: '0.7 MB' },
];

const STEP1_TASKS = [
  { name: 'Verify fiscal calendar configuration', detail: 'April 2026 period confirmed open' },
  { name: 'Check open intercompany transactions', detail: 'Scanning IC ledger - no unmatched items' },
  { name: 'Confirm subledger feed cutoffs',       detail: 'All feed timestamps validated' },
  { name: 'Validate user roles and permissions',  detail: 'CFO/Controller access grants confirmed' },
  { name: 'System health pre-flight check',       detail: 'GL module availability verified' },
];

const STEP2_TASKS = [
  { name: 'Consolidate Premium Subledger',        detail: '39,412 policy rows processed' },
  { name: 'Consolidate Claims Subledger',         detail: '2,804 claim transactions merged' },
  { name: 'Consolidate AP / AR Subledger',        detail: '$5.1M receivables · $1.8M payables' },
  { name: 'Consolidate Reinsurance Cession',      detail: 'Treaty XL-04, QS-07 applied' },
  { name: 'Flush subledger feed buffers',         detail: 'All batch queues cleared' },
  { name: 'Generate consolidation summary',       detail: 'Ledger feed summary complete' },
];

const DOC_TASKS = [
  { name: 'Compile Trial Balance',                detail: 'Debit/credit verified - balanced' },
  { name: 'Cut off Subledger Feeds',              detail: 'All feeds severed at 23:59:59' },
  { name: 'Extract Reinsurance Cession Package',  detail: '3 treaties · $441,000 ceded' },
  { name: 'Lock Premium Register',                detail: '$12.4M written premium sealed' },
  { name: 'Snapshot Loss Reserves',               detail: 'IBNR $2.1M · Case $3.8M frozen' },
  { name: 'Capture AR / AP Aging',                detail: 'Aging as of 04/30/2026 captured' },
  { name: 'Archive Journal Entry Register',       detail: 'All approved JEs archived' },
  { name: 'Assemble Compliance Package',          detail: 'SOX package ready for sign-off' },
];

export function PeriodClosePage() {
  const { toggleHardLock, toggleSoftClose } = useFinance();

  // Tab & Header State
  const [activeTab, setActiveTab] = useState('lock'); // 'lock' | 'wizard' | 'validation' | 'ledger'
  const [selectedPeriod, setSelectedPeriod] = useState('2026-04');
  const [selectedPeriodLabel, setSelectedPeriodLabel] = useState('April 2026');

  // Core Data State
  const [months, setMonths] = useState(INITIAL_MONTHS);
  const [banks, setBanks] = useState(INITIAL_BANKS);
  const [ledgerReports, setLedgerReports] = useState(INITIAL_LEDGER_REPORTS);
  const [validationErrors, setValidationErrors] = useState({}); // { [monthIdx]: { issues: string[], action: string } }

  // Issues & Approvals State
  const [resolved, setResolved] = useState({ je: false, br: false });
  const [cfoApproved, setCfoApproved] = useState(false);
  const [cfoApprovedTime, setCfoApprovedTime] = useState(null);
  const [ctrlApproved, setCtrlApproved] = useState(false);
  const [ctrlApprovedTime, setCtrlApprovedTime] = useState(null);
  const [wizardDone, setWizardDone] = useState(false);

  // Wizard Stepper State
  const [stepperState, setStepperState] = useState({
    1: 'done',
    2: 'done',
    3: 'active',
    4: 'pending',
    5: 'pending'
  });
  const [wizardStep4Index, setWizardStep4Index] = useState(0);

  // Modals & Notifications
  const [toastMessage, setToastMessage] = useState(null);
  const [fixModalKey, setFixModalKey] = useState(null); // 'je' | 'br' | null
  const [autoRunState, setAutoRunState] = useState({
    open: false,
    title: '',
    sub: '',
    tasks: [],
    activeIndex: 0
  });

  const showToast = (msg, type = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

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

  // Initial Auto-run Step 1 & 2 sequence on mount (as in screenshot 3 and HTML prototype)
  useEffect(() => {
    const timer1 = setTimeout(() => {
      // Step 1
      setAutoRunState({
        open: true,
        title: 'Step 1 - Pre-Start Evaluation',
        sub: 'Running system pre-flight checks for April 2026…',
        tasks: STEP1_TASKS,
        activeIndex: 0
      });

      let s1Idx = 0;
      const s1Interval = setInterval(() => {
        s1Idx++;
        if (s1Idx < STEP1_TASKS.length) {
          setAutoRunState(prev => ({ ...prev, activeIndex: s1Idx }));
        } else {
          clearInterval(s1Interval);
          setTimeout(() => {
            // Step 2
            setAutoRunState({
              open: true,
              title: 'Step 2 - Subledger Consolidation',
              sub: 'Consolidating all subledger feeds into the general ledger…',
              tasks: STEP2_TASKS,
              activeIndex: 0
            });

            let s2Idx = 0;
            const s2Interval = setInterval(() => {
              s2Idx++;
              if (s2Idx < STEP2_TASKS.length) {
                setAutoRunState(prev => ({ ...prev, activeIndex: s2Idx }));
              } else {
                clearInterval(s2Interval);
                setTimeout(() => {
                  setAutoRunState(prev => ({ ...prev, open: false }));
                  showToast('Pre-flight evaluation & subledger consolidation complete.', 'success');
                }, 450);
              }
            }, 450);
          }, 450);
        }
      }, 480);
    }, 600);

    return () => clearTimeout(timer1);
  }, []);

  // Sync Step 4 execution when Step 3 blockers are both cleared
  useEffect(() => {
    if (resolved.je && resolved.br && stepperState[3] === 'active') {
      const timer = setTimeout(() => {
        setStepperState(prev => ({ ...prev, 3: 'done', 4: 'run' }));
        setWizardStep4Index(0);

        let cur = 0;
        const interval = setInterval(() => {
          cur++;
          if (cur < DOC_TASKS.length) {
            setWizardStep4Index(cur);
          } else {
            clearInterval(interval);
            setTimeout(() => {
              setStepperState(prev => ({ ...prev, 4: 'done', 5: 'active' }));
              showToast('All close documents generated. Dual authorization required.', 'success');
            }, 500);
          }
        }, 550);
      }, 1200);

      return () => clearTimeout(timer);
    }
  }, [resolved, stepperState]);

  // Statistics calculation for hero banner
  const lockedCount = useMemo(() => months.filter(m => m.state === 'locked').length, [months]);
  const softCount = useMemo(() => months.filter(m => m.state === 'softonly').length, [months]);
  const progressCount = useMemo(() => months.filter(m => m.state === 'progress').length, [months]);
  const openCount = useMemo(() => months.filter(m => m.state === 'open').length, [months]);

  const blockerCount = (!resolved.je ? 1 : 0) + (!resolved.br ? 1 : 0);

  // Month Card Toggles Validation
  const handleMonthToggle = (idx, type, checked) => {
    const m = months[idx];
    const issues = [];

    // Clear previous validation error for this card
    setValidationErrors(prev => {
      const copy = { ...prev };
      delete copy[idx];
      return copy;
    });

    if (!m.changeable) {
      issues.push('This period is permanently hard-locked and cannot be modified.');
      issues.push('Contact your system administrator if a change is required.');
      setValidationErrors(prev => ({ ...prev, [idx]: { issues, action: null } }));
      return;
    }

    if (type === 'soft') {
      if (!checked) {
        if (m.hard) {
          issues.push('Cannot disable Soft-Close while Hard-Close is active.');
          issues.push('Remove Hard-Close first, then Soft-Close can be reversed.');
          setValidationErrors(prev => ({ ...prev, [idx]: { issues, action: null } }));
          return;
        }
        if (m.changeable === 'validated') {
          if (!window.confirm('Remove Soft-Close from April 2026 and re-open for posting?')) {
            return;
          }
        }
      } else {
        if (m.changeable === 'validated') {
          if (!resolved.je) issues.push('Journal Entry Register has 3 unapproved JEs ($2.1M)');
          if (!resolved.br) issues.push('Bank Reconciliation variance of $12,450 unresolved (Huntington ****4421)');
          if (issues.length) {
            setValidationErrors(prev => ({ ...prev, [idx]: { issues, action: 'wizard' } }));
            return;
          }
        }
      }
    }

    if (type === 'hard') {
      if (checked) {
        if (!m.soft) {
          issues.push('Soft-Close must be applied before Hard-Close can be activated.');
          setValidationErrors(prev => ({ ...prev, [idx]: { issues, action: 'soft-first' } }));
          return;
        }
        if (m.changeable === 'validated') {
          if (!resolved.je) issues.push('Journal Entry Register: 3 JEs pending CFO approval ($2.1M)');
          if (!resolved.br) issues.push('Bank Reconciliation: $12,450 variance on Huntington ****4421');
          if (!cfoApproved)  issues.push('CFO authorization (Margaret Chen) not yet obtained');
          if (!ctrlApproved) issues.push('Controller authorization (David Rodriguez) not yet obtained');
          if (issues.length) {
            setValidationErrors(prev => ({ ...prev, [idx]: { issues, action: 'wizard' } }));
            return;
          }
        } else {
          if (!window.confirm(`Permanently hard-lock ${m.label}? This cannot be undone without Board resolution.`)) {
            return;
          }
        }
      } else {
        issues.push('Hard-Close periods are immutable. This cannot be reversed here.');
        issues.push('A Board resolution and system administrator override are required.');
        setValidationErrors(prev => ({ ...prev, [idx]: { issues, action: null } }));
        return;
      }
    }

    // Apply valid change
    setMonths(prev => prev.map((item, i) => {
      if (i !== idx) return item;
      const updated = { ...item, [type]: checked };
      if (updated.soft && updated.hard) updated.state = 'locked';
      else if (updated.soft && !updated.hard) updated.state = updated.changeable === 'validated' ? 'progress' : 'softonly';
      else updated.state = 'open';
      return updated;
    }));

    showToast(`${m.label} - ${type === 'soft' ? 'Soft-Close' : 'Hard-Close'} ${checked ? 'enabled' : 'disabled'}`);
  };

  // Bank table toggle handler
  const handleBankToggle = (idx, type, checked) => {
    const b = banks[idx];
    if (type === 'hard' && checked) {
      if (b.recon !== 'balanced') {
        const msg = b.recon === 'variance'
          ? `Cannot hard-close ${b.name} (${b.acct}) - bank reconciliation shows a $12,450 variance. Resolve the reconciliation first.`
          : `Cannot hard-close ${b.name} (${b.acct}) - reconciliation is still pending. Wait for completion.`;
        showToast(msg, 'error');
        return;
      }
      if (!b.soft) {
        showToast(`Soft-Close must be applied to ${b.name} before Hard-Close can be activated.`, 'error');
        return;
      }
    }

    if (type === 'soft' && !checked && b.hard) {
      showToast(`Cannot remove Soft-Close from ${b.name} while Hard-Close is active.`, 'error');
      return;
    }

    setBanks(prev => prev.map((item, i) => i === idx ? { ...item, [type]: checked } : item));
    showToast(`${b.name} ${type === 'soft' ? 'Soft-Close' : 'Hard-Close'} ${checked ? 'enabled' : 'disabled'}.`);
  };

  // Approvals & Final Vault Lock Execution
  const handleApproveAs = (role) => {
    const timeStr = new Date().toLocaleTimeString();
    if (role === 'cfo' && !cfoApproved) {
      setCfoApproved(true);
      setCfoApprovedTime(timeStr);
      showToast('CFO approval recorded. Controller authorization required next.', 'success');
    } else if (role === 'ctrl' && !ctrlApproved && cfoApproved) {
      setCtrlApproved(true);
      setCtrlApprovedTime(timeStr);
      showToast('Both approvals received. Vault lock is now authorized - proceed when ready.', 'success');
    }
  };

  const handleExecuteVaultLock = () => {
    if (!window.confirm('Permanently hard-lock April 2026 and seal the compliance vault? This cannot be reversed without Board approval.')) {
      return;
    }

    setWizardDone(true);
    setStepperState(prev => ({ ...prev, 5: 'done' }));

    // Update April 2026 in state
    setMonths(prev => prev.map((m, i) => i === 3 ? { ...m, hard: true, state: 'locked', changeable: false } : m));

    // Also notify FinanceContext
    try {
      toggleHardLock('2026-04');
    } catch (e) {}

    showToast('April 2026 hard-locked and sealed in compliance vault.', 'success');
  };

  // Fix Modal resolution
  const handleConfirmFix = () => {
    if (!fixModalKey) return;
    setResolved(prev => ({ ...prev, [fixModalKey]: true }));
    const key = fixModalKey;
    setFixModalKey(null);
    showToast(`${key === 'je' ? 'Journal Entries' : 'Bank Reconciliation'} marked resolved. Re-validating…`, 'success');
  };

  return (
    <div className="period-close-container">
      {/* Toast popup */}
      {toastMessage && (
        <div className={`veridex-toast veridex-toast-${toastMessage.type}`}>
          <span>{toastMessage.type === 'error' ? '✕' : '✓'}</span>
          <span>{toastMessage.msg}</span>
        </div>
      )}

      {/* Auto-Run Modal (Steps 1 & 2 pre-flight checks) */}
      <div className={`run-overlay ${autoRunState.open ? 'open' : ''}`}>
        <div className="run-box">
          <div className="run-title">{autoRunState.title}</div>
          <div className="run-sub">{autoRunState.sub}</div>
          <div className="run-list">
            {autoRunState.tasks.map((t, i) => {
              const isDone = i < autoRunState.activeIndex;
              const isRun = i === autoRunState.activeIndex;
              return (
                <div
                  key={t.name}
                  className={`run-item ${isDone ? 'ri-done' : isRun ? 'ri-run' : 'ri-pending'}`}
                >
                  <div className="run-icon">{isDone ? '✓' : ''}</div>
                  <div>
                    <div className="run-name">{t.name}</div>
                    <div className="run-detail">{t.detail}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Fix / Resolve Modal */}
      <div className={`m-overlay ${fixModalKey ? 'open' : ''}`}>
        <div className="m-box">
          <div className="m-hdr">
            <div className="m-title">
              {fixModalKey === 'je'
                ? 'Resolve: Journal Entries Pending CFO Approval'
                : 'Resolve: Bank Reconciliation Variance - Huntington ****4421'}
            </div>
            <button className="m-close" onClick={() => setFixModalKey(null)}>✕</button>
          </div>

          <div className="m-body">
            {fixModalKey === 'je' && (
              <div>
                <p style={{ fontSize: '13px', color: 'var(--gray-500)', marginBottom: '14px', lineHeight: 1.5 }}>
                  <b>3 Journal Entries totaling $2,100,000</b> are submitted but awaiting CFO sign-off.
                  All three must be approved or voided before the pre-validation check can pass.
                </p>
                <div className="fix-steps">
                  <div className="fsi done">✓ JE-2026-0441 · Depreciation Accrual · $420,000 - Approved 04/29</div>
                  <div className="fsi act">⟳ JE-2026-0442 · Loss Reserve Adjustment · $1,240,000 - Awaiting CFO</div>
                  <div className="fsi">○ JE-2026-0443 · Interest Income Accrual · $440,000 - Queued</div>
                </div>
                <div className="info-box ib-amber">
                  <b>Action:</b> Contact Margaret Chen (CFO) to review JE-2026-0442 and JE-2026-0443, or click <b>Mark Resolved</b> to clear this blocker for the demonstration.
                </div>
              </div>
            )}

            {fixModalKey === 'br' && (
              <div>
                <p style={{ fontSize: '13px', color: 'var(--gray-500)', marginBottom: '14px', lineHeight: 1.5 }}>
                  Huntington National account <b>****4421</b> shows a <b>$12,450 variance</b> between the GL book balance and the bank statement as of April 30, 2026.
                </p>
                <div className="fix-steps">
                  <div className="fsi done">✓ April bank statement downloaded from Huntington portal</div>
                  <div className="fsi done">✓ Outstanding checks: 4 items totaling $9,120 identified</div>
                  <div className="fsi act">⟳ Deposit-in-transit: $3,330 - awaiting bank confirmation</div>
                </div>
                <div className="fix-field" style={{ marginBottom: '12px' }}>
                  <label>Reconciliation Adjustment Note</label>
                  <textarea rows={2} placeholder="e.g. Deposit-in-transit of $3,330 confirmed by Huntington on 05/01/2026. Wire ref #HTN-482910." defaultValue="Deposit-in-transit of $3,330 confirmed by Huntington on 05/01/2026. Wire ref #HTN-482910." />
                </div>
                <div className="info-box ib-blue">
                  <b>Next step:</b> Once the deposit-in-transit is confirmed by the bank, post a reconciling item and click <b>Mark Resolved</b>.
                </div>
              </div>
            )}
          </div>

          <div className="m-footer">
            <button className="btn-out" onClick={() => setFixModalKey(null)}>Cancel</button>
            <button className="btn-navy" onClick={handleConfirmFix}>Mark Resolved</button>
          </div>
        </div>
      </div>

      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '18px' }}>
        <div>
          <div className="page-title">Period Close</div>
          <div className="page-subtitle">
            Lock Controls · Close Wizard · Validation · Ledger Compilation - {selectedPeriodLabel}
          </div>
        </div>
      </div>

      {/* Topbar matching period-locking.html */}
      <div className="pl-topbar">
        <div className="pl-tabs">
          <button
            className={`pl-tab ${activeTab === 'lock' ? 'active' : ''}`}
            onClick={() => setActiveTab('lock')}
          >
            Lock Controls
          </button>
          <button
            className={`pl-tab ${activeTab === 'wizard' ? 'active' : ''}`}
            onClick={() => setActiveTab('wizard')}
          >
            Close Wizard
          </button>
          <button
            className={`pl-tab ${activeTab === 'validation' ? 'active' : ''}`}
            onClick={() => setActiveTab('validation')}
          >
            Validation Console
            {blockerCount > 0 && <span className="tab-badge">{blockerCount}</span>}
          </button>
          <button
            className={`pl-tab ${activeTab === 'ledger' ? 'active' : ''}`}
            onClick={() => setActiveTab('ledger')}
          >
            Ledger Compilation
          </button>
        </div>

        <div className="pl-period-row">
          <label>Closing Period:</label>
          <select
            value={selectedPeriod}
            onChange={(e) => {
              setSelectedPeriod(e.target.value);
              setSelectedPeriodLabel(e.target.options[e.target.selectedIndex].text);
              showToast(`Switched closing period to ${e.target.options[e.target.selectedIndex].text}`, 'info');
            }}
          >
            <option value="2026-04">April 2026</option>
            <option value="2026-03">March 2026</option>
            <option value="2026-02">February 2026</option>
            <option value="2026-01">January 2026</option>
            <option value="2025-12">December 2025</option>
            <option value="2025-11">November 2025</option>
            <option value="2025-10">October 2025</option>
            <option value="2025-09">September 2025</option>
          </select>
        </div>
      </div>

      {/* ══════════════════════ TAB 1: LOCK CONTROLS ══════════════════════ */}
      {activeTab === 'lock' && (
        <div className="pl-panel active">
          {/* Hero Overview */}
          <div className="lk-hero">
            <div className="lk-hero-left">
              <div className="lk-hero-title">FY 2026 Period Lock Dashboard</div>
              <div className="lk-hero-sub">Real-time lock status across all accounting periods · Validations enforced on every toggle</div>
            </div>
            <div className="lk-hero-stats">
              <div className="lk-hero-stat">
                <div className="lk-hero-stat-val">{lockedCount}</div>
                <div className="lk-hero-stat-lbl">Hard-Locked</div>
              </div>
              <div className="lk-hero-stat">
                <div className="lk-hero-stat-val">{softCount}</div>
                <div className="lk-hero-stat-lbl">Soft-Closed</div>
              </div>
              <div className="lk-hero-stat">
                <div className="lk-hero-stat-val">{progressCount}</div>
                <div className="lk-hero-stat-lbl">In Progress</div>
              </div>
              <div className="lk-hero-stat">
                <div className="lk-hero-stat-val">{openCount}</div>
                <div className="lk-hero-stat-lbl">Open</div>
              </div>
            </div>
          </div>

          {/* FY Timeline Bar */}
          <div className="fy-timeline">
            <div className="fy-timeline-title">FY 2026 - Fiscal Period Progress</div>
            <div className="fy-bar">
              {months.map((m, i) => {
                const cls = m.state === 'locked' ? 'fm-locked'
                          : m.state === 'softonly' ? 'fm-softonly'
                          : m.state === 'progress' ? 'fm-progress'
                          : 'fm-open';
                return (
                  <div key={m.label} className={`fy-month ${cls}`} title={`${m.label} - ${m.state}`}>
                    {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i]}
                  </div>
                );
              })}
            </div>
            <div className="fy-legend">
              <div className="fy-leg-item"><div className="fy-leg-dot" style={{ background: '#2e7d32' }}></div>Hard-Locked</div>
              <div className="fy-leg-item"><div className="fy-leg-dot" style={{ background: '#1565c0' }}></div>Soft-Closed</div>
              <div className="fy-leg-item"><div className="fy-leg-dot" style={{ background: '#e65100' }}></div>In Progress</div>
              <div className="fy-leg-item"><div className="fy-leg-dot" style={{ background: 'var(--gray-300)' }}></div>Open</div>
            </div>
          </div>

          {/* Lock Type Explainers */}
          <div className="lk-type-row">
            <div className="lk-type-card soft">
              <div className="lk-type-icon">🔓</div>
              <div className="lk-type-name">Soft Close</div>
              <div className="lk-type-badge">REVERSIBLE</div>
              <div className="lk-type-desc">
                Restricts standard-user posting while allowing controller adjustments. Subledger feeds remain available. Validates against open items and unresolved reconciliation issues before applying.
              </div>
            </div>
            <div className="lk-type-card hard">
              <div className="lk-type-icon">🔒</div>
              <div className="lk-type-name">Hard Close - Vault Lock</div>
              <div className="lk-type-badge">IMMUTABLE</div>
              <div className="lk-type-desc">
                Permanently seals the period. All subledger feeds are severed and the GL is archived to the compliance vault. No further postings are permitted under any circumstances.
              </div>
              <div className="lk-type-warn">
                ⚠ Requires CFO + Controller dual authorization. Cannot be reversed without Board resolution.
              </div>
            </div>
          </div>

          {/* Period Lock Management Grid */}
          <div className="month-section-title">
            Period Lock Management
            <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--gray-400)' }}>
              {' '}— Validation enforced on every toggle. Locked periods cannot be modified.
            </span>
          </div>

          <div className="month-grid">
            {months.map((m, i) => {
              const cls = m.state === 'locked'   ? 'mc-locked'
                        : m.state === 'softonly' ? 'mc-softonly'
                        : m.state === 'progress' ? 'mc-progress'
                        : 'mc-open';
              const icon = m.state === 'locked' ? '🔒' : m.state === 'softonly' ? '🔓' : m.state === 'progress' ? '⚙' : '○';
              const tag  = m.state === 'locked' ? 'Hard-Locked'
                         : m.state === 'softonly' ? 'Soft-Closed'
                         : m.state === 'progress' ? 'In Progress'
                         : 'Open';
              const isFullyLocked = !m.changeable;
              const err = validationErrors[i];

              return (
                <div key={m.label} className={`month-card ${cls}`}>
                  <div className="mc-header">
                    <div className="mc-label">{m.label}</div>
                    <div className="mc-icon">{icon}</div>
                  </div>
                  <div className="mc-status-badge">{tag}</div>

                  <div className="toggle-row">
                    <span className="tgl-lbl">Soft-Close</span>
                    <label className="tgl">
                      <input
                        type="checkbox"
                        checked={m.soft}
                        disabled={isFullyLocked}
                        onChange={(e) => handleMonthToggle(i, 'soft', e.target.checked)}
                      />
                      <div className="tgl-track"></div>
                    </label>
                  </div>

                  <div className="toggle-row">
                    <span className="tgl-lbl">Hard-Close</span>
                    <label className="tgl">
                      <input
                        type="checkbox"
                        checked={m.hard}
                        disabled={isFullyLocked || (!m.soft && !m.hard)}
                        onChange={(e) => handleMonthToggle(i, 'hard', e.target.checked)}
                      />
                      <div className="tgl-track"></div>
                    </label>
                  </div>

                  {err && (
                    <div className="mc-validation show">
                      <div className="mc-validation-title">Cannot apply - validation failed:</div>
                      <ul>
                        {err.issues.map((iss, j) => (
                          <li key={j}>{iss}</li>
                        ))}
                      </ul>
                      {err.action === 'wizard' && (
                        <button
                          className="mc-validation-btn"
                          onClick={() => {
                            setActiveTab('wizard');
                            setValidationErrors(prev => {
                              const copy = { ...prev };
                              delete copy[i];
                              return copy;
                            });
                          }}
                        >
                          Open Close Wizard to Fix →
                        </button>
                      )}
                      {err.action === 'soft-first' && (
                        <button
                          className="mc-validation-btn"
                          style={{ background: '#1565c0' }}
                          onClick={() => handleMonthToggle(i, 'soft', true)}
                        >
                          Enable Soft-Close First
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bank Ledger State Manager */}
          <div className="s-card">
            <div className="s-card-hdr">
              <div className="s-card-title">Bank Ledger State Manager</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="text-muted" style={{ fontSize: '11.5px', color: 'var(--gray-400)' }}>
                  Recon must be balanced before bank can be hard-closed
                </span>
                <button
                  className="btn-out btn-sm"
                  onClick={() => {
                    const csvContent = "Bank ID,Bank Name,Account #,Closing Balance,Recon Status,Soft-Close,Hard-Close,Last Modified\n" +
                      banks.map(b => `${b.id},"${b.name}",${b.acct},"${b.bal}",${b.recon},${b.soft},${b.hard},2026-04-30`).join("\n");
                    downloadCSV('bank-ledger-state.csv', csvContent);
                    showToast('Exported bank-ledger-state.csv', 'success');
                  }}
                >
                  ⬇ Export
                </button>
              </div>
            </div>
            <div className="s-body p0">
              <table className="bank-tbl">
                <thead>
                  <tr>
                    <th>Bank ID</th>
                    <th>Bank Name</th>
                    <th>Account #</th>
                    <th>Closing Balance</th>
                    <th>Recon Status</th>
                    <th style={{ textAlign: 'center' }}>Soft-Close</th>
                    <th style={{ textAlign: 'center' }}>Hard-Close</th>
                    <th>Last Modified</th>
                  </tr>
                </thead>
                <tbody>
                  {banks.map((b, i) => {
                    const rowCls = b.recon === 'variance' ? 'brow-variance' : '';
                    const hardBlocked = b.recon !== 'balanced';
                    const reconLabel = b.recon === 'balanced' ? '✓ Balanced'
                                     : b.recon === 'variance' ? '⚠ Variance'
                                     : '⟳ Pending';

                    return (
                      <tr key={b.id} className={rowCls}>
                        <td>
                          <code style={{ fontSize: '11px', background: 'var(--gray-100)', padding: '2px 6px', borderRadius: '4px' }}>
                            {b.id}
                          </code>
                        </td>
                        <td><b>{b.name}</b></td>
                        <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{b.acct}</td>
                        <td style={{ fontWeight: 700 }}>{b.bal}</td>
                        <td>
                          <span className={`recon-pill ${b.recon}`}>{reconLabel}</span>
                          {b.recon === 'variance' && (
                            <div className="bank-val-msg">⛔ Must resolve before hard-close</div>
                          )}
                          {b.recon === 'pending' && (
                            <div style={{ fontSize: '11px', color: '#e65100', fontWeight: 600, marginTop: '3px' }}>
                              ⟳ Recon in progress
                            </div>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <label className="tgl" style={{ margin: 'auto' }}>
                            <input
                              type="checkbox"
                              checked={b.soft}
                              onChange={(e) => handleBankToggle(i, 'soft', e.target.checked)}
                            />
                            <div className="tgl-track"></div>
                          </label>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <label className="tgl" style={{ margin: 'auto' }}>
                            <input
                              type="checkbox"
                              checked={b.hard}
                              disabled={hardBlocked}
                              onChange={(e) => handleBankToggle(i, 'hard', e.target.checked)}
                            />
                            <div className="tgl-track"></div>
                          </label>
                        </td>
                        <td style={{ fontSize: '11.5px', color: 'var(--gray-400)' }}>2026-04-30</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════ TAB 2: CLOSE WIZARD ══════════════════════ */}
      {activeTab === 'wizard' && (
        <div className="pl-panel active">
          {/* Stepper */}
          <div className="wz-stepper">
            <div className={`wz-step s-${stepperState[1]}`}>
              <div className="wz-circle">{stepperState[1] === 'done' ? '✓' : '1'}</div>
              <div className="wz-lbl">Pre-Start Evaluation</div>
              <div className="wz-sublbl">{stepperState[1] === 'done' ? 'Completed' : 'Running…'}</div>
            </div>

            <div className={`wz-step s-${stepperState[2]}`}>
              <div className="wz-circle">{stepperState[2] === 'done' ? '✓' : '2'}</div>
              <div className="wz-lbl">Subledger Consolidation</div>
              <div className="wz-sublbl">{stepperState[2] === 'done' ? 'Completed' : 'Running…'}</div>
            </div>

            <div className={`wz-step s-${stepperState[3]}`}>
              <div className="wz-circle">{stepperState[3] === 'done' ? '✓' : '3'}</div>
              <div className="wz-lbl">Pre-Validation</div>
              <div className="wz-sublbl">
                {stepperState[3] === 'done' ? 'Completed' : stepperState[3] === 'active' ? 'In Progress' : 'Pending'}
              </div>
            </div>

            <div className={`wz-step s-${stepperState[4]}`}>
              <div className="wz-circle">{stepperState[4] === 'done' ? '✓' : '4'}</div>
              <div className="wz-lbl">Document Construction</div>
              <div className="wz-sublbl">
                {stepperState[4] === 'done' ? 'Completed' : stepperState[4] === 'run' ? 'Running…' : 'Pending'}
              </div>
            </div>

            <div className={`wz-step s-${stepperState[5]}`}>
              <div className="wz-circle">{wizardDone ? '🔒' : stepperState[5] === 'done' ? '✓' : '5'}</div>
              <div className="wz-lbl">Period Vault Lock</div>
              <div className="wz-sublbl">
                {wizardDone ? 'Locked' : stepperState[5] === 'active' ? 'Action Required' : 'Pending'}
              </div>
            </div>
          </div>

          {/* Step 3: Pre-Validation Checks */}
          {stepperState[3] === 'active' && (
            <div className="wz-card">
              <div className="wz-card-hdr">
                <div>
                  <div className="wz-card-title">Step 3 - Pre-Validation Checks</div>
                  <div className="wz-card-sub">
                    {blockerCount > 0
                      ? `${blockerCount} blocker${blockerCount > 1 ? 's' : ''} must be resolved before proceeding`
                      : 'All blockers resolved - proceeding to document construction…'}
                  </div>
                </div>
              </div>

              <div className="wz-card-body">
                {blockerCount > 0 && (
                  <div className="alert-banner ab-red">
                    <div className="ab-icon">⛔</div>
                    <div className="ab-body">
                      <div className="ab-title">
                        {blockerCount} Blocker{blockerCount > 1 ? 's' : ''} Must Be Resolved
                      </div>
                      <div className="ab-detail">
                        {[
                          !resolved.je && '3 Journal Entries pending CFO approval ($2.1M)',
                          !resolved.br && 'Bank Reconciliation out-of-balance ($12,450)'
                        ].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                  </div>
                )}

                <table className="vt">
                  <thead>
                    <tr>
                      <th>Check Item</th>
                      <th>Result</th>
                      <th>Category</th>
                      <th>Detail</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {VCHECK.map((r) => {
                      const fixed = r.fixable && resolved[r.key];
                      const display = fixed ? 'pass' : r.result;
                      const chip = (
                        <span className={`chip chip-${display}`}>
                          {display === 'pass' ? '✓ Passed' : display === 'blocker' ? '⛔ Blocker' : '⚠ Warning'}
                        </span>
                      );
                      const action = r.fixable ? (
                        fixed ? (
                          <span className="resolved-tag">✓ Fixed</span>
                        ) : (
                          <button className="fix-btn" onClick={() => setFixModalKey(r.key)}>
                            Fix →
                          </button>
                        )
                      ) : (
                        ' - '
                      );
                      const rowCls = display === 'blocker' ? 'vt-blocker' : display === 'warning' ? 'vt-warning' : '';

                      return (
                        <tr key={r.key} className={rowCls}>
                          <td><b>{r.label}</b></td>
                          <td>{chip}</td>
                          <td>
                            <span style={{ fontSize: '10.5px', background: 'var(--gray-100)', padding: '2px 8px', borderRadius: '20px' }}>
                              {r.cat}
                            </span>
                          </td>
                          <td style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{r.detail}</td>
                          <td>{action}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Step 4: Document Construction */}
          {stepperState[4] === 'run' && (
            <div className="wz-card">
              <div className="wz-card-hdr">
                <div>
                  <div className="wz-card-title">Step 4 - Document Construction</div>
                  <div className="wz-card-sub">Automatically compiling all close documents and ledger extracts…</div>
                </div>
              </div>

              <div className="wz-card-body">
                <div className="prog-list">
                  {DOC_TASKS.map((t, i) => {
                    const isDone = i < wizardStep4Index;
                    const isRun = i === wizardStep4Index;
                    return (
                      <div
                        key={t.name}
                        className={`prog-item ${isDone ? 'pi-done' : isRun ? 'pi-run' : 'pi-pending'}`}
                      >
                        <div className="prog-icon">{isDone ? '✓' : ''}</div>
                        <div>
                          <div className="prog-name">{t.name}</div>
                          <div className="prog-detail">{t.detail}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Period Vault Lock */}
          {stepperState[5] === 'active' && !wizardDone && (
            <div className="wz-card">
              <div className="wz-card-hdr">
                <div>
                  <div className="wz-card-title">Step 5 - Period Vault Lock</div>
                  <div className="wz-card-sub">Dual authorization required - CFO must approve first, then Controller</div>
                </div>
              </div>

              <div className="wz-card-body">
                <div className="alert-banner ab-amber" style={{ marginBottom: '22px' }}>
                  <div className="ab-icon">🔐</div>
                  <div className="ab-body">
                    <div className="ab-title">Dual Authorization Required</div>
                    <div className="ab-detail">
                      Both the CFO and Corporate Controller must independently approve before the period is permanently sealed. This action cannot be reversed without a Board resolution.
                    </div>
                  </div>
                </div>

                <div className="appr-grid">
                  {/* CFO Card */}
                  <div className={`appr-card ${cfoApproved ? 'ac-done' : 'ac-awaiting'}`}>
                    <div className="appr-role">CFO - Step 1 of 2</div>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--navy)', marginBottom: '6px' }}>
                      Chief Financial Officer
                    </h4>
                    <div className="appr-name-sub">Assigned to: <b>Margaret Chen, CPA</b></div>
                    <div className="appr-desc">
                      Certifies financial accuracy, completeness, and GAAP/SAP compliance. First in the dual-control sequence.
                    </div>
                    <button
                      className={`appr-btn ${cfoApproved ? 'ab-green' : 'ab-navy'}`}
                      disabled={cfoApproved}
                      onClick={() => handleApproveAs('cfo')}
                    >
                      {cfoApproved ? `✓ Approved - Margaret Chen · ${cfoApprovedTime}` : '✍ Approve as CFO - Margaret Chen'}
                    </button>
                  </div>

                  {/* Controller Card */}
                  <div className={`appr-card ${ctrlApproved ? 'ac-done' : cfoApproved ? 'ac-awaiting' : ''}`}>
                    <div className="appr-role">Controller - Step 2 of 2</div>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--navy)', marginBottom: '6px' }}>
                      Corporate Controller
                    </h4>
                    <div className="appr-name-sub">Assigned to: <b>David Rodriguez, CPA</b></div>
                    <div className="appr-desc">
                      Confirms subledger integrity and GL cutoff accuracy. Activates vault lock upon approval.
                    </div>
                    <button
                      className={`appr-btn ${ctrlApproved ? 'ab-green' : cfoApproved ? 'ab-navy' : 'ab-gray'}`}
                      disabled={!cfoApproved || ctrlApproved}
                      onClick={() => handleApproveAs('ctrl')}
                    >
                      {ctrlApproved
                        ? `✓ Approved - David Rodriguez · ${ctrlApprovedTime}`
                        : cfoApproved
                        ? '✍ Approve as Controller - David Rodriguez'
                        : 'Awaiting CFO Approval First'}
                    </button>
                  </div>
                </div>

                <button
                  className="vault-btn"
                  disabled={!cfoApproved || !ctrlApproved}
                  onClick={handleExecuteVaultLock}
                >
                  🔒 Initiate Hard-Lock - Seal Period Vault
                </button>
              </div>
            </div>
          )}

          {/* Hard-Locked Success State */}
          {wizardDone && (
            <div className="wz-card">
              <div className="wz-card-hdr">
                <div>
                  <div className="wz-card-title">April 2026 - Period Sealed</div>
                  <div className="wz-card-sub">Hard-locked and archived to the compliance vault</div>
                </div>
              </div>
              <div className="wz-card-body" style={{ textAlign: 'center', padding: '50px 20px' }}>
                <div style={{ fontSize: '64px', marginBottom: '18px' }}>🔒</div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#2e7d32', marginBottom: '10px' }}>
                  April 2026 Successfully Locked
                </div>
                <div style={{ fontSize: '13px', color: 'var(--gray-500)', maxWidth: '460px', margin: '0 auto', lineHeight: 1.7 }}>
                  The period has been permanently sealed and archived. No further postings are permitted.
                  Dual authorization recorded by <b>Margaret Chen (CFO)</b> and <b>David Rodriguez (Controller)</b>.
                </div>
                <div style={{ marginTop: '26px', display: 'inline-flex', gap: '12px' }}>
                  <button className="btn-out" onClick={() => setActiveTab('ledger')}>
                    View Ledger Reports
                  </button>
                  <button className="btn-navy" onClick={() => setActiveTab('lock')}>
                    View Lock Status
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════ TAB 3: VALIDATION CONSOLE ══════════════════════ */}
      {activeTab === 'validation' && (
        <div className="pl-panel active">
          {/* Stat Cards */}
          <div className="vc-grid">
            <div className="vc-stat cs-navy">
              <div className="vc-lbl">Rules Checked</div>
              <div className="vc-val">14</div>
              <div className="vc-sub">Total validation rules</div>
            </div>
            <div className="vc-stat cs-green">
              <div className="vc-lbl">Passed</div>
              <div className="vc-val">{10 + (!resolved.je ? 0 : 1) + (!resolved.br ? 0 : 1)}</div>
              <div className="vc-sub">Checks cleared</div>
            </div>
            <div className="vc-stat cs-orange">
              <div className="vc-lbl">Warnings</div>
              <div className="vc-val">2</div>
              <div className="vc-sub">Non-blocking</div>
            </div>
            <div className="vc-stat cs-red">
              <div className="vc-lbl">Blockers</div>
              <div className="vc-val">{blockerCount}</div>
              <div className="vc-sub">Must resolve</div>
            </div>
            <div className="vc-stat cs-blue">
              <div className="vc-lbl">Close Readiness</div>
              <div style={{ marginTop: '10px' }}>
                <span className={`readiness-pill ${blockerCount === 0 ? 'rp-ready' : 'rp-blocked'}`}>
                  {blockerCount === 0 ? 'READY TO CLOSE' : 'BLOCKED'}
                </span>
              </div>
              <div className="vc-sub" style={{ marginTop: '6px' }}>
                {blockerCount === 0 ? 'All checks cleared' : `${blockerCount} blocker${blockerCount > 1 ? 's' : ''} remain`}
              </div>
            </div>
          </div>

          {/* Blocker Alert Banner */}
          {blockerCount > 0 ? (
            <div className="alert-banner ab-red">
              <div className="ab-icon">⛔</div>
              <div className="ab-body">
                <div className="ab-title">
                  {blockerCount} Blocker{blockerCount > 1 ? 's' : ''} must be resolved before period close
                </div>
                <div className="ab-detail">
                  {[
                    !resolved.br && 'Bank Reconciliation out-of-balance ($12,450)',
                    !resolved.je && '3 Journal Entries pending CFO approval ($2.1M)'
                  ].filter(Boolean).join(' · ')}
                </div>
              </div>
              <button className="btn-out btn-sm" onClick={() => setActiveTab('wizard')}>
                Fix in Wizard
              </button>
            </div>
          ) : (
            <div className="alert-banner" style={{ background: '#e8f5e9', border: '1.5px solid #a5d6a7' }}>
              <div className="ab-icon">✓</div>
              <div className="ab-body">
                <div className="ab-title" style={{ color: '#2e7d32' }}>All Validation Rules Passed</div>
                <div className="ab-detail" style={{ color: '#1b5e20' }}>
                  April 2026 meets all compliance checks and is ready for hard-locking.
                </div>
              </div>
              <button className="btn-navy btn-sm" onClick={() => setActiveTab('wizard')}>
                Open Close Wizard
              </button>
            </div>
          )}

          {/* Integrity Check Matrix Table */}
          <div className="s-card">
            <div className="s-card-hdr">
              <div className="s-card-title">Data Integrity Check Matrix</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn-navy btn-sm"
                  onClick={() => {
                    showToast('Re-running all 14 validation checks…', 'info');
                    setTimeout(() => showToast('Validation complete - results updated.', 'success'), 1200);
                  }}
                >
                  ↺ Re-Run All Checks
                </button>
                <button
                  className="btn-out btn-sm"
                  onClick={() => {
                    const csv = "No,Register,Category,Description,Expected,Actual,Variance,Result\n" +
                      INITIAL_MATRIX.map(m => `${m.n},"${m.reg}",${m.cat},"${m.desc}","${m.exp}","${m.act}","${m.v}",${m.r}`).join("\n");
                    downloadCSV('validation-matrix-apr2026.csv', csv);
                    showToast('Exported validation-matrix-apr2026.csv', 'success');
                  }}
                >
                  ⬇ Export CSV
                </button>
              </div>
            </div>

            <div className="s-body p0">
              <table className="matrix-tbl">
                <thead>
                  <tr>
                    <th style={{ width: '28px' }}>#</th>
                    <th>Register / Check</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Expected</th>
                    <th>Actual</th>
                    <th>Variance</th>
                    <th>Result</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {INITIAL_MATRIX.map(r => {
                    let result = r.r;
                    let actual = r.act;
                    let variance = r.v;

                    if (r.n === 3 && resolved.je) {
                      result = 'pass';
                      actual = '0 pending';
                      variance = ' - ';
                    }
                    if (r.n === 6 && resolved.br) {
                      result = 'pass';
                      actual = '$0.00';
                      variance = '$0.00';
                    }

                    const pill = (
                      <span className={`chip chip-${result}`}>
                        {result === 'pass' ? '✓ Passed' : result === 'blocker' ? '⛔ Blocker' : '⚠ Warning'}
                      </span>
                    );

                    const action = r.fixKey ? (
                      resolved[r.fixKey] ? (
                        <span style={{ fontSize: '12px', color: '#2e7d32', fontWeight: 700 }}>✓ Fixed</span>
                      ) : (
                        <button
                          className="fix-btn"
                          style={{ fontSize: '11px', padding: '4px 10px' }}
                          onClick={() => {
                            setFixModalKey(r.fixKey);
                            setActiveTab('wizard');
                          }}
                        >
                          Fix in Wizard
                        </button>
                      )
                    ) : (
                      ' - '
                    );

                    const rowCls = result === 'blocker' ? 'mr-blocker' : result === 'warning' ? 'mr-warning' : '';

                    return (
                      <tr key={r.n} className={rowCls}>
                        <td style={{ color: 'var(--gray-400)', fontSize: '11px' }}>{r.n}</td>
                        <td><b>{r.reg}</b></td>
                        <td>
                          <span style={{ fontSize: '10.5px', background: 'var(--gray-100)', padding: '2px 8px', borderRadius: '20px' }}>
                            {r.cat}
                          </span>
                        </td>
                        <td style={{ fontSize: '11.5px', color: 'var(--gray-500)' }}>{r.desc}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{r.exp}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{actual}</td>
                        <td style={{
                          fontFamily: 'monospace',
                          fontSize: '12px',
                          color: result === 'blocker' ? '#c62828' : undefined,
                          fontWeight: result === 'blocker' ? 700 : undefined
                        }}>
                          {variance}
                        </td>
                        <td>{pill}</td>
                        <td>{action}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════ TAB 4: LEDGER COMPILATION ══════════════════════ */}
      {activeTab === 'ledger' && (
        <div className="pl-panel active">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--navy)' }}>
                Ledger Reports - April 2026
              </div>
              <div className="text-muted" style={{ marginTop: '3px' }}>
                Generate and download compiled accounting reports for the close period
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn-navy"
                onClick={() => {
                  showToast('Generating all ledger reports…', 'info');
                  setTimeout(() => {
                    const today = new Date().toISOString().slice(0, 10);
                    setLedgerReports(prev => prev.map(r => r.status !== 'blocked' ? { ...r, status: 'ready', updated: today } : r));
                    showToast('All reports generated and ready.', 'success');
                  }, 1500);
                }}
              >
                ⚙ Generate All
              </button>
              <button
                className="btn-out"
                onClick={() => {
                  const ready = ledgerReports.filter(r => r.status !== 'blocked');
                  const manifest = ['Title,Description,Status,Updated,Size']
                    .concat(ready.map(r => `"${r.title}","${r.desc}",${r.status},${r.updated},${r.size}`))
                    .join('\n');
                  downloadCSV('ledger-reports-manifest.csv', manifest);
                  showToast(`Packaging ${ready.length} available reports as archive manifest`, 'success');
                }}
              >
                ⬇ Download All
              </button>
            </div>
          </div>

          <div className="lc-grid">
            {ledgerReports.map(r => {
              const statusDisplay = (r.id === 'je-reg' && resolved.je) ? 'ready' : r.status;
              return (
                <div key={r.id} className={`lc-card ls-${statusDisplay}`}>
                  <div className="lc-top">
                    <div>
                      <div className="lc-title">{r.title}</div>
                      <div className="lc-desc">{r.desc}</div>
                    </div>
                    <span className={`lc-status lcs-${statusDisplay}`}>
                      {statusDisplay === 'ready' ? '● Ready' : statusDisplay === 'warning' ? '⚠ Warning' : '⛔ Blocked'}
                    </span>
                  </div>
                  <div className="lc-meta">Updated: {r.updated} &nbsp;·&nbsp; {r.size}</div>
                  <div className="lc-actions">
                    <button
                      className="lc-btn lb-primary"
                      onClick={() => {
                        showToast(`Regenerating ${r.title}…`, 'info');
                        setTimeout(() => {
                          setLedgerReports(prev => prev.map(item => item.id === r.id ? { ...item, updated: new Date().toISOString().slice(0, 10), status: 'ready' } : item));
                          showToast(`${r.title} regenerated.`, 'success');
                        }, 1200);
                      }}
                    >
                      ↺ Regenerate
                    </button>
                    <button
                      className="lc-btn"
                      disabled={statusDisplay === 'blocked'}
                      title={statusDisplay === 'blocked' ? 'Resolve blocker first' : undefined}
                      onClick={() => {
                        const meta = `Report,${r.title}\nDescription,${r.desc}\nStatus,${statusDisplay}\nUpdated,${r.updated}\nSize,${r.size}\n`;
                        downloadCSV(`${r.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.csv`, meta);
                        showToast(`Downloading: ${r.title}`, 'success');
                      }}
                    >
                      ⬇ Download
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
export default PeriodClosePage;
