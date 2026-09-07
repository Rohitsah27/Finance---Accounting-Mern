import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';

export function ManualEntryPage() {
  const { accounts, addJournalEntry } = useFinance();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [reference, setReference] = useState('');
  const [description, setDescription] = useState('');
  const [lines, setLines] = useState([
    { accountCode: '1001', description: '', debit: '', credit: '' },
    { accountCode: '4100', description: '', debit: '', credit: '' }
  ]);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleLineChange = (index, field, value) => {
    setLines(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addLine = () => {
    setLines(prev => [...prev, { accountCode: '1001', description: '', debit: '', credit: '' }]);
  };

  const removeLine = (index) => {
    if (lines.length <= 2) return;
    setLines(prev => prev.filter((_, i) => i !== index));
  };

  const totalDebit = lines.reduce((sum, l) => sum + (parseFloat(l.debit) || 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + (parseFloat(l.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.001 && totalDebit > 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isBalanced) {
      showToast('Journal Entry is out of balance. Total Debits must equal Total Credits.', 'error');
      return;
    }
    const je = addJournalEntry({
      date,
      reference: reference || 'Manual Voucher',
      description: description || 'Manual Journal Entry',
      entityName: 'General Ledger',
      lines: lines.map(l => {
        const acc = accounts.find(a => a.code === l.accountCode);
        return {
          accountCode: l.accountCode,
          accountName: acc ? acc.name : 'Account',
          description: l.description || description,
          debit: parseFloat(l.debit) || 0,
          credit: parseFloat(l.credit) || 0
        };
      })
    });
    showToast(`Journal Entry ${je.id} posted successfully`);
    setReference('');
    setDescription('');
    setLines([
      { accountCode: '1001', description: '', debit: '', credit: '' },
      { accountCode: '4100', description: '', debit: '', credit: '' }
    ]);
  };

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
          <div className="page-title">Manual Entry Voucher Pad</div>
          <div className="page-subtitle">
            High-speed manual double-entry voucher entry pad with account lookups and real-time ledger balance validation
          </div>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline" onClick={() => setLines([{ accountCode: '1001', description: '', debit: '', credit: '' }, { accountCode: '4100', description: '', debit: '', credit: '' }])}>
            Clear Lines
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ marginBottom: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
            <div>
              <label className="field-label">Posting Date *</label>
              <input type="date" className="field-input" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div>
              <label className="field-label">Reference Number</label>
              <input className="field-input" placeholder="e.g. VOUCHER-2026-08" value={reference} onChange={(e) => setReference(e.target.value)} />
            </div>
            <div>
              <label className="field-label">Journal Narrative</label>
              <input className="field-input" placeholder="e.g. Month-end payroll accrual" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Voucher Lines Table */}
        <div className="table-wrap" style={{ marginBottom: '16px' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '35%' }}>Account</th>
                <th>Line Memo / Description</th>
                <th style={{ width: '15%' }}>Debit ($)</th>
                <th style={{ width: '15%' }}>Credit ($)</th>
                <th style={{ width: '50px' }}></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, idx) => (
                <tr key={idx}>
                  <td>
                    <select
                      className="field-input"
                      value={line.accountCode}
                      onChange={(e) => handleLineChange(idx, 'accountCode', e.target.value)}
                    >
                      {accounts.map(a => (
                        <option key={a.code} value={a.code}>
                          {a.code} — {a.name} ({a.type})
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      className="field-input"
                      placeholder="Line narrative..."
                      value={line.description}
                      onChange={(e) => handleLineChange(idx, 'description', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.01"
                      className="field-input"
                      placeholder="0.00"
                      value={line.debit}
                      onChange={(e) => handleLineChange(idx, 'debit', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.01"
                      className="field-input"
                      placeholder="0.00"
                      value={line.credit}
                      onChange={(e) => handleLineChange(idx, 'credit', e.target.value)}
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {lines.length > 2 && (
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeLine(idx)} style={{ color: 'var(--red)' }}>
                        ✕
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ fontWeight: 800, background: 'var(--color-surface)' }}>
                <td colSpan={2} style={{ textAlign: 'right' }}>Total:</td>
                <td style={{ color: isBalanced ? '#2e7d32' : 'var(--red)' }}>${totalDebit.toFixed(2)}</td>
                <td style={{ color: isBalanced ? '#2e7d32' : 'var(--red)' }}>${totalCredit.toFixed(2)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button type="button" className="btn btn-outline btn-sm" onClick={addLine}>
            + Add Line Item
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: isBalanced ? '#2e7d32' : 'var(--red)' }}>
              {isBalanced ? '✓ Balanced ($0.00 Difference)' : `Out of Balance: $${Math.abs(totalDebit - totalCredit).toFixed(2)}`}
            </span>
            <button type="submit" className="btn btn-primary" disabled={!isBalanced}>
              Post to General Ledger
            </button>
          </div>
        </div>
      </form>
    </>
  );
}
