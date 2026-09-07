import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import './billing-invoicing.css';

export function BillingInvoicingPage() {
  const { postJournalEntry } = useFinance();

  // Invoices & Plans state
  const [invoices, setInvoices] = useState([]);
  const [plans, setPlans] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Modals & form toggles
  const [isNewInvoiceOpen, setIsNewInvoiceOpen] = useState(false);
  const [isNewPlanOpen, setIsNewPlanOpen] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [toast, setToast] = useState(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // New Invoice Form State
  const [newInvCustomer, setNewInvCustomer] = useState('Ayushi');
  const [newInvType, setNewInvType] = useState('Premium Invoice');
  const [newInvDueDate, setNewInvDueDate] = useState('2026-09-19');
  const [newInvLines, setNewInvLines] = useState([
    { desc: 'Commercial Trucking Policy Premium (POL-V8NHT)', qty: 1, price: 32257.00 },
    { desc: 'State Taxes & Surplus Fees (TX & Denton County)', qty: 1, price: 7003.00 }
  ]);

  // New Recurring Plan Form State
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanCustomer, setNewPlanCustomer] = useState('Ayushi');
  const [newPlanFreq, setNewPlanFreq] = useState('Monthly');
  const [newPlanAmount, setNewPlanAmount] = useState('3271.67');
  const [newPlanNextRun, setNewPlanNextRun] = useState('2026-09-20');
  const [newPlanAutoPost, setNewPlanAutoPost] = useState(true);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Badge Class Helpers
  const getBadgeClass = (type) => {
    const map = {
      'Standard': 'badge-navy',
      'Pro-Forma': 'badge-gray',
      'Recurring': 'badge-blue',
      'Progress Billing': 'badge-orange',
      'Milestone': 'badge-navy',
      'Retainer': 'badge-gray',
      'Premium Invoice': 'badge-red',
      'Debit Note': 'badge-orange',
      'Credit Note': 'badge-green',
      'Intercompany': 'badge-navy'
    };
    return map[type] || 'badge-navy';
  };

  const getStatusBadgeClass = (status) => {
    const map = {
      'Paid': 'badge-green',
      'Sent': 'badge-blue',
      'Draft': 'badge-gray',
      'Partially Paid': 'badge-orange',
      'Overdue': 'badge-red',
      'Collections': 'badge-red',
      'Issued': 'badge-orange',
      'Posted': 'badge-green'
    };
    return map[status] || 'badge-gray';
  };

  // Dynamic KPIs calculations
  const totalInvoiced = useMemo(() => {
    return invoices.reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);
  }, [invoices]);

  const totalOutstanding = useMemo(() => {
    return invoices
      .filter(inv => inv.status !== 'Paid')
      .reduce((sum, inv) => sum + ((parseFloat(inv.amount) || 0) - (parseFloat(inv.paidAmount) || 0)), 0);
  }, [invoices]);

  const totalOverdue = useMemo(() => {
    return invoices
      .filter(inv => inv.status === 'Overdue' || inv.status === 'Collections')
      .reduce((sum, inv) => sum + ((parseFloat(inv.amount) || 0) - (parseFloat(inv.paidAmount) || 0)), 0);
  }, [invoices]);

  const recurringMrr = useMemo(() => {
    return plans.reduce((sum, p) => {
      const amt = parseFloat(p.amount) || 0;
      if (p.freq === 'Monthly') return sum + amt;
      if (p.freq === 'Quarterly') return sum + (amt / 3);
      if (p.freq === 'Annual') return sum + (amt / 12);
      if (p.freq === 'Weekly') return sum + (amt * 4.33);
      return sum;
    }, 0);
  }, [plans]);

  // Distinct customers for filter
  const customerList = useMemo(() => {
    return Array.from(new Set(invoices.map(i => i.customer).filter(Boolean)));
  }, [invoices]);

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      if (typeFilter && inv.type !== typeFilter) return false;
      if (statusFilter && inv.status !== statusFilter) return false;
      if (customerFilter && inv.customer !== customerFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const mInv = (inv.invoiceNumber || '').toLowerCase().includes(q);
        const mCust = (inv.customer || '').toLowerCase().includes(q);
        const mPol = (inv.policyNumber || '').toLowerCase().includes(q);
        if (!mInv && !mCust && !mPol) return false;
      }
      return true;
    });
  }, [invoices, typeFilter, statusFilter, customerFilter, searchQuery]);

  // Handlers for New Invoice Line Items
  const handleAddLine = () => {
    setNewInvLines([...newInvLines, { desc: '', qty: 1, price: 0 }]);
  };

  const handleRemoveLine = (idx) => {
    if (newInvLines.length <= 1) {
      showToast('An invoice needs at least one line item', 'warning');
      return;
    }
    setNewInvLines(newInvLines.filter((_, i) => i !== idx));
  };

  const handleLineChange = (idx, field, value) => {
    const updated = [...newInvLines];
    updated[idx] = { ...updated[idx], [field]: value };
    setNewInvLines(updated);
  };

  const newInvTotal = useMemo(() => {
    return newInvLines.reduce((sum, line) => {
      const qty = parseFloat(line.qty) || 0;
      const price = parseFloat(line.price) || 0;
      return sum + (qty * price);
    }, 0);
  }, [newInvLines]);

  const handleSubmitNewInvoice = (e) => {
    e.preventDefault();
    if (newInvTotal <= 0) {
      showToast('Invoice total must be greater than zero', 'error');
      return;
    }
    const invNo = 'INV-' + Math.floor(10000 + Math.random() * 90000);
    const newInvoice = {
      id: invNo,
      invoiceNumber: invNo,
      policyNumber: 'POL-' + Math.floor(1000 + Math.random() * 9000),
      customer: newInvCustomer.trim() || 'Ayushi',
      type: newInvType,
      issueDate: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
      dueDate: new Date(newInvDueDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
      amount: newInvTotal,
      paidAmount: 0,
      status: 'Sent',
      producer: 'HIT',
      mga: 'NTA',
      carrier: 'SOUTHLAKE',
      lines: newInvLines.map(l => ({
        desc: l.desc || 'Invoice item',
        qty: parseFloat(l.qty) || 1,
        price: parseFloat(l.price) || 0,
        amt: (parseFloat(l.qty) || 1) * (parseFloat(l.price) || 0)
      }))
    };

    setInvoices([newInvoice, ...invoices]);
    setIsNewInvoiceOpen(false);
    showToast(`Invoice ${invNo} successfully generated & saved!`, 'success');
  };

  // Mark invoice paid
  const handleMarkPaid = (invId) => {
    setInvoices(prev => prev.map(i => {
      if (i.id === invId) {
        return { ...i, status: 'Paid', paidAmount: i.amount };
      }
      return i;
    }));
    showToast(`Invoice ${invId} marked as Paid! Cash recorded in AR.`);
  };

  // Convert Pro-Forma
  const handleConvertProForma = (invId) => {
    setInvoices(prev => prev.map(i => {
      if (i.id === invId) {
        const newNo = i.invoiceNumber.replace('PF-', 'INV-');
        return { ...i, invoiceNumber: newNo, type: 'Standard', status: 'Sent' };
      }
      return i;
    }));
    showToast(`Pro-forma converted to Standard Invoice!`);
  };

  // Recurring Plan Submit
  const handleSubmitNewPlan = (e) => {
    e.preventDefault();
    const plan = {
      name: newPlanName.trim() || 'Commercial Trucking Monthly Installment',
      customer: newPlanCustomer.trim() || 'Ayushi',
      freq: newPlanFreq,
      amount: parseFloat(newPlanAmount) || 0,
      nextRun: newPlanNextRun || '2026-09-20',
      autoPost: newPlanAutoPost
    };
    setPlans([plan, ...plans]);
    setIsNewPlanOpen(false);
    showToast(`Recurring billing plan "${plan.name}" created successfully!`);
  };

  const handleToggleAutoPost = (index) => {
    setPlans(prev => prev.map((p, i) => i === index ? { ...p, autoPost: !p.autoPost } : p));
  };

  // Select all checkbox handler
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(new Set(filteredInvoices.map(i => i.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRow = (id) => {
    const updated = new Set(selectedIds);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setSelectedIds(updated);
  };

  return (
    <>
      {toast && (
        <div className={`veridex-toast veridex-toast-${toast.type}`}>
          <span>{toast.type === 'error' ? '✕' : toast.type === 'warning' ? '⚠' : '✓'}</span>
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header">
        <div>
          <div className="page-title">Billing &amp; Invoicing</div>
          <div className="page-subtitle">
            Customer invoicing across every billing model — premium invoices, agency billing, milestone, and recurring contracts
          </div>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline" onClick={() => showToast('Exporting invoice register to CSV...')}>
            Export
          </button>
          <button className="btn btn-primary" onClick={() => setIsNewInvoiceOpen(!isNewInvoiceOpen)}>
            + New Invoice
          </button>
        </div>
      </div>

      {/* Dynamic Stats Row */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon si-navy">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="3" y="2" width="14" height="16" rx="1.5" stroke="#102a2e" strokeWidth="1.6" />
              <path d="M6.5 6.5h7M6.5 10h7M6.5 13.5h4" stroke="#102a2e" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </div>
          <div className="stat-info">
            <div className="stat-value">${totalInvoiced.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <div className="stat-label">Total Invoiced (MTD)</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon si-orange">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="7" stroke="#e65100" strokeWidth="1.6" />
              <path d="M10 6v4l3 2" stroke="#e65100" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </div>
          <div className="stat-info">
            <div className="stat-value">${totalOutstanding.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <div className="stat-label">Outstanding Balance</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon si-coral">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 4v7M10 15v1" stroke="#c9791f" strokeWidth="2" strokeLinecap="round" />
              <circle cx="10" cy="10" r="7.5" stroke="#c9791f" strokeWidth="1.4" />
            </svg>
          </div>
          <div className="stat-info">
            <div className="stat-value">${totalOverdue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <div className="stat-label">Overdue</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon si-green">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 12l4-5 3 3 6-7" stroke="#2e7d32" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="stat-info">
            <div className="stat-value">
              ${Math.round(recurringMrr).toLocaleString('en-US')}{' '}
              <span style={{ fontSize: '12px', color: 'var(--gray-400)', fontWeight: 600 }}>/mo</span>
            </div>
            <div className="stat-label">Recurring Revenue (MRR)</div>
          </div>
        </div>
      </div>

      {/* New Invoice Inline Form */}
      {isNewInvoiceOpen && (
        <div className="form-card" style={{ marginBottom: '20px', padding: '20px' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--gray-900)', marginBottom: '16px' }}>
            Create New Invoice
          </div>
          <form onSubmit={handleSubmitNewInvoice}>
            <div className="form-grid-3">
              <div className="form-field">
                <label className="field-label">Customer / Insured</label>
                <input
                  type="text"
                  className="field-input"
                  placeholder="e.g. Ayushi, Apex Freight, Meridian Logistics"
                  value={newInvCustomer}
                  onChange={(e) => setNewInvCustomer(e.target.value)}
                  required
                />
              </div>
              <div className="form-field">
                <label className="field-label">Invoice Type</label>
                <select
                  className="field-input field-select"
                  value={newInvType}
                  onChange={(e) => setNewInvType(e.target.value)}
                >
                  <option>Premium Invoice</option>
                  <option>Standard</option>
                  <option>Pro-Forma</option>
                  <option>Recurring</option>
                  <option>Progress Billing</option>
                  <option>Milestone</option>
                  <option>Retainer</option>
                  <option>Debit Note</option>
                  <option>Credit Note</option>
                  <option>Intercompany</option>
                </select>
              </div>
              <div className="form-field">
                <label className="field-label">Due Date</label>
                <input
                  type="date"
                  className="field-input"
                  value={newInvDueDate}
                  onChange={(e) => setNewInvDueDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '.4px', margin: '12px 0 8px' }}>
              Line Items
            </div>
            <table className="data-table" style={{ marginBottom: '12px' }}>
              <thead>
                <tr>
                  <th>Description</th>
                  <th style={{ width: '90px' }}>Qty</th>
                  <th style={{ width: '140px' }}>Unit Price ($)</th>
                  <th style={{ width: '130px' }} className="text-right">Amount ($)</th>
                  <th style={{ width: '36px' }}></th>
                </tr>
              </thead>
              <tbody>
                {newInvLines.map((line, idx) => (
                  <tr key={idx}>
                    <td>
                      <input
                        type="text"
                        className="field-input"
                        value={line.desc}
                        placeholder="Service / Fee Description"
                        style={{ background: '#fff' }}
                        onChange={(e) => handleLineChange(idx, 'desc', e.target.value)}
                        required
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="1"
                        className="field-input"
                        value={line.qty}
                        style={{ background: '#fff' }}
                        onChange={(e) => handleLineChange(idx, 'qty', e.target.value)}
                        required
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        className="field-input"
                        value={line.price}
                        style={{ background: '#fff' }}
                        onChange={(e) => handleLineChange(idx, 'price', e.target.value)}
                        required
                      />
                    </td>
                    <td className="text-right font-semibold">
                      ${((parseFloat(line.qty) || 0) * (parseFloat(line.price) || 0)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleRemoveLine(idx)}
                        title="Remove line"
                      >
                        &times;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="3" className="text-right font-semibold" style={{ borderTop: '1px solid var(--gray-200)' }}>
                    Total Amount
                  </td>
                  <td className="text-right font-semibold" style={{ borderTop: '1px solid var(--gray-200)', fontSize: '14px', color: 'var(--navy)' }}>
                    ${newInvTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ borderTop: '1px solid var(--gray-200)' }}></td>
                </tr>
              </tfoot>
            </table>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={handleAddLine}>
                + Add Line
              </button>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsNewInvoiceOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save &amp; Generate Invoice
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Filters Bar */}
      <div className="filter-bar">
        <span className="filter-bar-label">Filters:</span>
        <select
          className="filter-select"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="">All Invoice Types</option>
          <option>Premium Invoice</option>
          <option>Standard</option>
          <option>Pro-Forma</option>
          <option>Recurring</option>
          <option>Progress Billing</option>
          <option>Milestone</option>
          <option>Retainer</option>
          <option>Debit Note</option>
          <option>Credit Note</option>
        </select>
        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option>Draft</option>
          <option>Sent</option>
          <option>Partially Paid</option>
          <option>Paid</option>
          <option>Overdue</option>
          <option>Collections</option>
        </select>
        <select
          className="filter-select"
          value={customerFilter}
          onChange={(e) => setCustomerFilter(e.target.value)}
        >
          <option value="">All Customers</option>
          {customerList.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <div className="filter-spacer"></div>
        <input
          type="text"
          className="filter-input"
          placeholder="Search invoice, customer..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: '220px' }}
        />
      </div>

      {/* Invoice Register Table */}
      <div className="table-wrap" style={{ marginBottom: '24px' }}>
        <div className="table-head-row">
          <div className="table-head-title">Invoice Register</div>
          <div className="table-head-actions">
            <button className="btn btn-outline btn-sm" onClick={() => showToast('Automated email reminders queued for all active & overdue invoices', 'info')}>
              Send Reminders
            </button>
          </div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '38px' }}>
                <input
                  type="checkbox"
                  className="table-check"
                  checked={selectedIds.size > 0 && selectedIds.size === filteredInvoices.length}
                  onChange={handleSelectAll}
                />
              </th>
              <th>Invoice No.</th>
              <th>Customer / Insured</th>
              <th>Type</th>
              <th>Issue Date</th>
              <th>Due Date</th>
              <th className="text-right">Total Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '28px 16px', color: 'var(--gray-400)', fontSize: '12.5px' }}>
                  {invoices.length === 0
                    ? 'No invoices to display yet. Use "+ New Invoice" or generate an MGA settlement invoice below.'
                    : 'No invoices match the current filters.'}
                </td>
              </tr>
            ) : filteredInvoices.map((inv) => {
              const amt = parseFloat(inv.amount) || 0;
              return (
                <tr key={inv.id}>
                  <td>
                    <input
                      type="checkbox"
                      className="table-check"
                      checked={selectedIds.has(inv.id)}
                      onChange={() => handleSelectRow(inv.id)}
                    />
                  </td>
                  <td
                    className="cell-link"
                    style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--navy)' }}
                    onClick={() => setViewingInvoice(inv)}
                  >
                    {inv.invoiceNumber}
                  </td>
                  <td>
                    <strong>{inv.customer}</strong>{' '}
                    {inv.policyNumber && (
                      <span style={{ fontSize: '11px', color: 'var(--gray-500)' }}>
                        ({inv.policyNumber})
                      </span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${getBadgeClass(inv.type)}`}>
                      {inv.type}
                    </span>
                  </td>
                  <td>{inv.issueDate}</td>
                  <td>{inv.dueDate || ' - '}</td>
                  <td className="text-right font-semibold">
                    ${amt.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td>
                    <span className={`badge ${getStatusBadgeClass(inv.status)}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setViewingInvoice(inv)}
                      >
                        View
                      </button>
                      {inv.status !== 'Paid' && (
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--green-600)' }}
                          onClick={() => handleMarkPaid(inv.id)}
                        >
                          Pay
                        </button>
                      )}
                      {inv.type === 'Pro-Forma' && inv.status === 'Draft' && (
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleConvertProForma(inv.id)}
                        >
                          Convert
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Recurring Invoice Schedules & Payment Plans */}
      {false && (
      <div className="table-wrap">
        <div className="table-head-row">
          <div className="table-head-title">Recurring Invoice Schedules &amp; Payment Plans</div>
          <div className="table-head-actions">
            <button className="btn btn-outline btn-sm" onClick={() => setIsNewPlanOpen(!isNewPlanOpen)}>
              + New Plan
            </button>
          </div>
        </div>

        {/* New Recurring Billing Plan Inline Form */}
        {isNewPlanOpen && (
          <div className="form-card" style={{ margin: '0 16px 16px', padding: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--gray-900)', marginBottom: '12px' }}>
              New Recurring Billing Plan
            </div>
            <form onSubmit={handleSubmitNewPlan}>
              <div className="form-grid-3">
                <div className="form-field">
                  <label className="field-label">Plan Name</label>
                  <input
                    type="text"
                    className="field-input"
                    placeholder="e.g. Commercial Trucking Monthly Installment"
                    value={newPlanName}
                    onChange={(e) => setNewPlanName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-field">
                  <label className="field-label">Customer</label>
                  <input
                    type="text"
                    className="field-input"
                    placeholder="e.g. Ayushi"
                    value={newPlanCustomer}
                    onChange={(e) => setNewPlanCustomer(e.target.value)}
                    required
                  />
                </div>
                <div className="form-field">
                  <label className="field-label">Frequency</label>
                  <select
                    className="field-input field-select"
                    value={newPlanFreq}
                    onChange={(e) => setNewPlanFreq(e.target.value)}
                  >
                    <option>Monthly</option>
                    <option>Quarterly</option>
                    <option>Weekly</option>
                    <option>Annual</option>
                  </select>
                </div>
              </div>
              <div className="form-grid-3" style={{ marginTop: '10px' }}>
                <div className="form-field">
                  <label className="field-label">Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="field-input"
                    value={newPlanAmount}
                    onChange={(e) => setNewPlanAmount(e.target.value)}
                    required
                  />
                </div>
                <div className="form-field">
                  <label className="field-label">Next Run Date</label>
                  <input
                    type="date"
                    className="field-input"
                    value={newPlanNextRun}
                    onChange={(e) => setNewPlanNextRun(e.target.value)}
                    required
                  />
                </div>
                <div className="form-field">
                  <label className="field-label">Auto-Post to GL</label>
                  <label className="v-switch" style={{ marginTop: '6px' }}>
                    <input
                      type="checkbox"
                      checked={newPlanAutoPost}
                      onChange={(e) => setNewPlanAutoPost(e.target.checked)}
                    />
                    <span className="v-slider"></span>
                  </label>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsNewPlanOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Plan
                </button>
              </div>
            </form>
          </div>
        )}

        <table className="data-table">
          <thead>
            <tr>
              <th>Plan Name</th>
              <th>Customer</th>
              <th>Frequency</th>
              <th className="text-right">Amount</th>
              <th>Next Run Date</th>
              <th>Auto-Post</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((p, idx) => (
              <tr key={idx}>
                <td className="font-semibold">{p.name}</td>
                <td>{p.customer}</td>
                <td><span className="badge badge-blue">{p.freq}</span></td>
                <td className="text-right font-semibold">
                  ${(parseFloat(p.amount) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td>{p.nextRun}</td>
                <td>
                  <label className="v-switch">
                    <input
                      type="checkbox"
                      checked={p.autoPost}
                      onChange={() => handleToggleAutoPost(idx)}
                    />
                    <span className="v-slider"></span>
                  </label>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}

      {/* Invoice Document PDF View Modal */}
      {viewingInvoice && (
        <div className="bi-modal open" onClick={(e) => { if (e.target === e.currentTarget) setViewingInvoice(null); }}>
          <div className="bi-modal-content">
            <div className="bi-modal-header">
              <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--navy)' }}>
                Invoice Document: {viewingInvoice.invoiceNumber}
              </div>
              <button className="bi-modal-close" onClick={() => setViewingInvoice(null)}>&times;</button>
            </div>

            <div className="bi-pdf-doc" style={{ boxShadow: 'none', border: 'none', padding: '12px 0' }}>
              <div className="bi-pdf-head">
                <div className="bi-pdf-brand">
                  <div className="bi-pdf-brand-mark">
                    {(viewingInvoice.carrier || 'SOUTHLAKE').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <strong style={{ fontSize: '15px' }}>{viewingInvoice.carrier || 'SOUTHLAKE Insurance Co.'}</strong><br />
                    <span style={{ color: 'var(--gray-500)', fontSize: '11px' }}>
                      MGA: {viewingInvoice.mga || 'NTA'} &bull; Broker: {viewingInvoice.producer || 'HIT'}
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="bi-pdf-doctitle">{(viewingInvoice.type || 'INVOICE').toUpperCase()}</div>
                  <span className={`badge ${getStatusBadgeClass(viewingInvoice.status)}`} style={{ marginTop: '4px' }}>
                    {viewingInvoice.status}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '18px 0', fontSize: '13px' }}>
                <div>
                  <span style={{ color: 'var(--gray-500)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>
                    Bill To:
                  </span><br />
                  <strong style={{ fontSize: '15px', color: 'var(--navy)' }}>{viewingInvoice.customer}</strong><br />
                  <span>State: TX {viewingInvoice.lob ? <>&bull; LOB: <strong>{viewingInvoice.lob}</strong></> : ''}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div>Invoice #: <strong>{viewingInvoice.invoiceNumber}</strong></div>
                  {viewingInvoice.policyNumber && <div>Policy #: <strong>{viewingInvoice.policyNumber}</strong></div>}
                  <div>Issue Date: <strong>{viewingInvoice.issueDate}</strong></div>
                  <div>Due Date: <strong>{viewingInvoice.dueDate || 'Upon Receipt'}</strong></div>
                </div>
              </div>

              <table className="data-table" style={{ marginTop: '12px' }}>
                <thead>
                  <tr>
                    <th>Description</th>
                    <th style={{ width: '70px', textAlign: 'center' }}>Qty</th>
                    <th style={{ width: '130px', textAlign: 'right' }}>Unit Price</th>
                    <th style={{ width: '130px', textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(viewingInvoice.lines || [
                    { desc: `${viewingInvoice.type} for ${viewingInvoice.customer}`, qty: 1, price: viewingInvoice.amount, amt: viewingInvoice.amount }
                  ]).map((l, idx) => (
                    <tr key={idx}>
                      <td><strong>{l.desc}</strong></td>
                      <td style={{ textAlign: 'center' }}>{l.qty}</td>
                      <td style={{ textAlign: 'right' }}>
                        ${Number(l.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>
                        ${Number(l.amt).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'right', fontWeight: 700, borderTop: '2px solid var(--gray-300)' }}>
                      Total Due
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 800, fontSize: '15px', color: 'var(--navy)', borderTop: '2px solid var(--gray-300)' }}>
                      ${Number(viewingInvoice.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>

              <div className="bi-pdf-footer">
                Payment due upon receipt. Remit to SOUTHLAKE / NTA referencing invoice number {viewingInvoice.invoiceNumber}.
              </div>

              <div style={{ marginTop: '18px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }} className="no-print">
                <button className="btn btn-outline" onClick={() => window.print()}>
                  🖨️ Print / Save as PDF
                </button>
                {viewingInvoice.status !== 'Paid' && (
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      handleMarkPaid(viewingInvoice.id);
                      setViewingInvoice(null);
                    }}
                  >
                    Record Full Payment (${Number(viewingInvoice.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })})
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
