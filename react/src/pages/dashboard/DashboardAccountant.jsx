import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFinance } from '../../context/FinanceContext';

export function DashboardAccountant() {
  const { journalEntries, bankTransactions } = useFinance();
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const pendingEntries = journalEntries.filter(j => j.status === 'Draft' || j.status === 'Pending Approval');
  const unmatchedBank = bankTransactions.filter(t => t.status !== 'Matched');

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
          <div className="page-title">Staff Accountant Workspace</div>
          <div className="page-subtitle">
            Daily journal vouchers, subledger batch processing, cash matching, and accounts reconciliation
          </div>
        </div>
        <div className="page-actions">
          <Link to="/journal-entry" className="btn btn-primary btn-sm">+ New Journal Entry</Link>
          <Link to="/bank-reconciliation" className="btn btn-outline btn-sm">Bank Feeds</Link>
        </div>
      </div>

      {/* Stats Row */}
      <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '18px' }}>
        <div className="stat-card" style={{ borderTop: '3px solid #1565c0' }}>
          <div className="stat-info">
            <div className="stat-label">Total Journal Entries</div>
            <div className="stat-value" style={{ color: '#1565c0' }}>{journalEntries.length}</div>
            <div style={{ fontSize: '11px', color: '#2e7d32', fontWeight: 600 }}>All Balanced &amp; Posted</div>
          </div>
        </div>

        <div className="stat-card" style={{ borderTop: '3px solid #2e7d32' }}>
          <div className="stat-info">
            <div className="stat-label">Unmatched Cash Items</div>
            <div className="stat-value" style={{ color: '#2e7d32' }}>{unmatchedBank.length}</div>
            <div style={{ fontSize: '11px', color: 'var(--color-muted)' }}>Bank Feed Exception</div>
          </div>
        </div>

        <div className="stat-card" style={{ borderTop: '3px solid #e65100' }}>
          <div className="stat-info">
            <div className="stat-label">Pending Approval</div>
            <div className="stat-value" style={{ color: '#e65100' }}>{pendingEntries.length}</div>
            <div style={{ fontSize: '11px', color: '#2e7d32', fontWeight: 600 }}>0 Queue Backlog</div>
          </div>
        </div>

        <div className="stat-card" style={{ borderTop: '3px solid #0d1b4b' }}>
          <div className="stat-info">
            <div className="stat-label">Daily Out-of-Balance</div>
            <div className="stat-value" style={{ color: 'var(--navy)' }}>$0.00</div>
            <div style={{ fontSize: '11px', color: '#2e7d32', fontWeight: 600 }}>Ledger in Balance</div>
          </div>
        </div>
      </div>

      {/* Quick Access Task Panels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '18px' }}>
        <div className="card">
          <div style={{ fontSize: '13.5px', fontWeight: 700, marginBottom: '8px' }}>Journal Entries</div>
          <p style={{ fontSize: '12px', color: 'var(--color-muted)', marginBottom: '14px', lineHeight: 1.5 }}>
            Create and edit double-entry journal vouchers with custom dimensions (MGA, LOB, State).
          </p>
          <Link to="/journal-entry" className="btn btn-outline btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
            Open Journal Entry →
          </Link>
        </div>

        <div className="card">
          <div style={{ fontSize: '13.5px', fontWeight: 700, marginBottom: '8px' }}>Manual Entry Voucher Pad</div>
          <p style={{ fontSize: '12px', color: 'var(--color-muted)', marginBottom: '14px', lineHeight: 1.5 }}>
            High-speed keyboard-driven entry pad for bulk GL adjustments, payroll, and accruals.
          </p>
          <Link to="/manual-entry" className="btn btn-outline btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
            Open Voucher Pad →
          </Link>
        </div>

        <div className="card">
          <div style={{ fontSize: '13.5px', fontWeight: 700, marginBottom: '8px' }}>Chart of Accounts</div>
          <p style={{ fontSize: '12px', color: 'var(--color-muted)', marginBottom: '14px', lineHeight: 1.5 }}>
            View real-time account balances, debit/credit totals, and drill down to account ledgers.
          </p>
          <Link to="/chart-of-accounts" className="btn btn-outline btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
            Open Accounts →
          </Link>
        </div>
      </div>
    </>
  );
}
