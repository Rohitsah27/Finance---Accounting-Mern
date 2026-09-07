import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import './commission-engine.css';

// Role-specific framing: the same commission ledger means something
// different depending on which side of the money you're on.
//   - carrier pays MGAs (a distribution expense) — there's no "earning" here.
//   - mga both earns an override from the carrier AND owes producers below it.
//   - agency/broker (and any other role) is a producer being paid — commission is receivable, not payable.
const ROLE_CONFIG = {
  carrier: {
    subtitle: 'Commission expense paid out to appointed MGAs and programs',
    payableLabel: 'Commission Payable (This Period)',
    earnedLabel: 'Commission Expense YTD',
    showHierarchy: false,
    showMgaSummary: true,
    producerColumnLabel: 'MGA / Program'
  },
  mga: {
    subtitle: 'Producer commission schedules, multi-level agent hierarchies, and statement generation',
    payableLabel: 'Commission Payable (To Producers)',
    earnedLabel: 'Commission Earned YTD (Override)',
    showHierarchy: true,
    showMgaSummary: false,
    producerColumnLabel: 'Producer / Agency'
  },
  default: {
    subtitle: 'Your commission schedules, earned transactions, and remittance statements',
    payableLabel: 'Commission Receivable (This Period)',
    earnedLabel: 'Commission Earned YTD',
    showHierarchy: false,
    showMgaSummary: false,
    producerColumnLabel: 'Producer / Agency'
  }
};

export function CommissionEnginePage() {
  const { activeEntity, currentUser } = useAuth();
  const bType = currentUser?.businessType || activeEntity?.businessType || 'mga';
  const roleConfig = ROLE_CONFIG[bType] || ROLE_CONFIG.default;

  const [activeTab, setActiveTab] = useState('schedules');
  const [plans, setPlans] = useState(() => {
    try {
      const saved = localStorage.getItem('v_commission_plans');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const [transactions, setTransactions] = useState(() => {
    try {
      const saved = localStorage.getItem('v_commission_transactions');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const [searchPlan, setSearchPlan] = useState('');
  const [searchTxn, setSearchTxn] = useState('');
  const [isNewPlanOpen, setIsNewPlanOpen] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanType, setNewPlanType] = useState('Tiered');
  const [newPlanDate, setNewPlanDate] = useState('2026-08-20');
  const [tierRules, setTierRules] = useState([
    { rate: 8, desc: 'Commercial Trucking base gross written premium' },
    { rate: 10, desc: 'Excess / Surplus lines tier override' }
  ]);

  const [statementModalProducer, setStatementModalProducer] = useState(null);
  const [expandedMgaNodes, setExpandedMgaNodes] = useState({});

  const [isNewTxnOpen, setIsNewTxnOpen] = useState(false);
  const [newTxnProducer, setNewTxnProducer] = useState('');
  const [newTxnPolicy, setNewTxnPolicy] = useState('');
  const [newTxnInsured, setNewTxnInsured] = useState('');
  const [newTxnLob, setNewTxnLob] = useState('');
  const [newTxnMga, setNewTxnMga] = useState('');
  const [newTxnCarrier, setNewTxnCarrier] = useState('');
  const [newTxnPremium, setNewTxnPremium] = useState('');
  const [newTxnRate, setNewTxnRate] = useState('');
  const [newTxnClawback, setNewTxnClawback] = useState('0');

  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    try {
      localStorage.setItem('v_commission_plans', JSON.stringify(plans));
      localStorage.setItem('v_commission_transactions', JSON.stringify(transactions));
    } catch (e) {}
  }, [plans, transactions]);

  // Dynamic calculations
  const totalPayable = useMemo(() => {
    return transactions.reduce((sum, t) => {
      if (t.status === 'Approved' || t.status === 'Pending') {
        return sum + (parseFloat(t.netPayable) || 0);
      }
      return sum;
    }, 0);
  }, [transactions]);

  const totalEarned = useMemo(() => {
    return transactions.reduce((sum, t) => sum + (parseFloat(t.netPayable) || 0), 0);
  }, [transactions]);

  // Group by producer for statements
  const statementsSummary = useMemo(() => {
    const summary = {};
    transactions.forEach(t => {
      const prod = t.producer || t.producerName || 'Unassigned';
      if (!summary[prod]) {
        summary[prod] = {
          producer: prod,
          producerName: t.producerName || prod,
          period: t.period || '—',
          count: 0,
          total: 0,
          status: 'Ready'
        };
      }
      summary[prod].count += 1;
      summary[prod].total += (parseFloat(t.netPayable) || 0);
    });
    return Object.values(summary);
  }, [transactions]);

  // Grouped by MGA/Program — carrier's view of who it pays.
  const mgaSummary = useMemo(() => {
    const summary = {};
    transactions.forEach(t => {
      const key = t.mga || 'Unassigned';
      if (!summary[key]) summary[key] = { mga: key, count: 0, total: 0, producers: new Set() };
      summary[key].count += 1;
      summary[key].total += (parseFloat(t.netPayable) || 0);
      summary[key].producers.add(t.producerName || t.producer);
    });
    return Object.values(summary).map(s => ({ ...s, producers: Array.from(s.producers) }));
  }, [transactions]);

  // Grouped by MGA -> producer — the MGA's own view of its downstream splits,
  // built from real transactions instead of a fixed decorative tree.
  const producerHierarchy = useMemo(() => {
    const byMga = {};
    transactions.forEach(t => {
      const mgaKey = t.mga || 'Unassigned';
      const prodKey = t.producerName || t.producer || 'Unknown Producer';
      if (!byMga[mgaKey]) byMga[mgaKey] = { mga: mgaKey, total: 0, producers: {} };
      byMga[mgaKey].total += (parseFloat(t.netPayable) || 0);
      if (!byMga[mgaKey].producers[prodKey]) {
        byMga[mgaKey].producers[prodKey] = { producer: prodKey, count: 0, total: 0, carrier: t.carrier || '' };
      }
      byMga[mgaKey].producers[prodKey].count += 1;
      byMga[mgaKey].producers[prodKey].total += (parseFloat(t.netPayable) || 0);
    });
    return Object.values(byMga).map(m => ({ ...m, producers: Object.values(m.producers) }));
  }, [transactions]);

  const toggleMgaNode = (key) => {
    setExpandedMgaNodes(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmitNewTxn = () => {
    if (!newTxnProducer.trim() || !newTxnPolicy.trim() || !newTxnPremium || !newTxnRate) {
      showToast('Producer, policy number, premium and rate are required.', 'warning');
      return;
    }
    const premium = parseFloat(newTxnPremium) || 0;
    const rate = parseFloat(newTxnRate) || 0;
    const clawback = parseFloat(newTxnClawback) || 0;
    const grossCommission = premium * (rate / 100);
    const netPayable = grossCommission - clawback;
    const today = new Date();
    const newTxn = {
      id: `COMM-${Date.now()}`,
      producer: newTxnProducer.trim(),
      producerName: newTxnProducer.trim(),
      policyNumber: newTxnPolicy.trim(),
      invoiceRef: '',
      insured: newTxnInsured.trim(),
      lob: newTxnLob.trim(),
      mga: newTxnMga.trim(),
      carrier: newTxnCarrier.trim(),
      grossPremium: premium,
      ratePct: rate,
      grossCommission,
      clawback,
      netPayable,
      status: 'Pending',
      period: today.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      date: today.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
    };
    setTransactions([newTxn, ...transactions]);
    setIsNewTxnOpen(false);
    setNewTxnProducer(''); setNewTxnPolicy(''); setNewTxnInsured(''); setNewTxnLob('');
    setNewTxnMga(''); setNewTxnCarrier(''); setNewTxnPremium(''); setNewTxnRate(''); setNewTxnClawback('0');
    showToast(`Commission transaction for ${newTxn.producerName} added.`, 'success');
  };

  // Filtered views
  const filteredPlans = useMemo(() => {
    if (!searchPlan) return plans;
    const q = searchPlan.toLowerCase();
    return plans.filter(p => p.name.toLowerCase().includes(q) || p.type.toLowerCase().includes(q) || p.summary.toLowerCase().includes(q));
  }, [plans, searchPlan]);

  const filteredTxns = useMemo(() => {
    if (!searchTxn) return transactions;
    const q = searchTxn.toLowerCase();
    return transactions.filter(t => 
      (t.producerName && t.producerName.toLowerCase().includes(q)) ||
      (t.policyNumber && t.policyNumber.toLowerCase().includes(q)) ||
      (t.insured && t.insured.toLowerCase().includes(q)) ||
      (t.lob && t.lob.toLowerCase().includes(q))
    );
  }, [transactions, searchTxn]);

  const handleAddTierRule = () => {
    setTierRules([...tierRules, { rate: 12, desc: 'Additional tier incentive rule' }]);
  };

  const handleRemoveTierRule = (idx) => {
    setTierRules(tierRules.filter((_, i) => i !== idx));
  };

  const handleTierChange = (idx, field, val) => {
    const updated = [...tierRules];
    updated[idx][field] = val;
    setTierRules(updated);
  };

  const handleSubmitNewPlan = () => {
    if (!newPlanName.trim()) {
      showToast('Please enter a Commission Plan Name', 'warning');
      return;
    }

    const summaryStr = tierRules.map(r => `${r.rate}% (${r.desc})`).join('; ') || 'Standard rate structure';
    const newPlan = {
      id: `plan-${Date.now()}`,
      name: newPlanName.trim(),
      type: newPlanType,
      summary: summaryStr,
      date: newPlanDate,
      status: 'Active'
    };

    setPlans([newPlan, ...plans]);
    setIsNewPlanOpen(false);
    setNewPlanName('');
    showToast(`Commission plan "${newPlan.name}" created successfully!`, 'success');
  };

  const modalTxns = useMemo(() => {
    if (!statementModalProducer) return [];
    return transactions.filter(t => t.producer === statementModalProducer || t.producerName === statementModalProducer);
  }, [transactions, statementModalProducer]);

  const modalTotal = useMemo(() => {
    return modalTxns.reduce((sum, t) => sum + (parseFloat(t.netPayable) || 0), 0);
  }, [modalTxns]);

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
          <div className="page-title">Commission Engine</div>
          <div className="page-subtitle">{roleConfig.subtitle}</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline" onClick={() => showToast('Exporting commission ledger to CSV...', 'info')}>
            Export
          </button>
          <button className="btn btn-primary" onClick={() => setIsNewPlanOpen(!isNewPlanOpen)}>
            + New Plan
          </button>
        </div>
      </div>

      {/* ═══ STATS ROW ═══ */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon si-navy">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="7" stroke="#102a2e" strokeWidth="1.6"/>
              <path d="M10 6v4l3 2" stroke="#102a2e" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="stat-info">
            <div className="stat-value">${Math.round(totalPayable).toLocaleString('en-US')}</div>
            <div className="stat-label">{roleConfig.payableLabel}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon si-green">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 12l4-5 3 3 6-7" stroke="#2e7d32" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="stat-info">
            <div className="stat-value">${Math.round(totalEarned).toLocaleString('en-US')}</div>
            <div className="stat-label">{roleConfig.earnedLabel}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon si-blue">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="3" y="4" width="14" height="12" rx="1.5" stroke="#1565c0" strokeWidth="1.6"/>
              <path d="M3 8h14" stroke="#1565c0" strokeWidth="1.4"/>
            </svg>
          </div>
          <div className="stat-info">
            <div className="stat-value">{plans.length}</div>
            <div className="stat-label">Active Commission Plans</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon si-coral">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 4v7M10 15v1" stroke="#c9791f" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="10" cy="7.5" r="7.5" stroke="#c9791f" strokeWidth="1.4"/>
            </svg>
          </div>
          <div className="stat-info">
            <div className="stat-value">0</div>
            <div className="stat-label">Pending Disputes</div>
          </div>
        </div>
      </div>

      {/* ═══ TABS ═══ */}
      <div className="page-tabs">
        <button
          className={`page-tab ${activeTab === 'schedules' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedules')}
        >
          Schedules &amp; Agreements
        </button>
        <button
          className={`page-tab ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          Transactions
        </button>
        <button
          className={`page-tab ${activeTab === 'statements' ? 'active' : ''}`}
          onClick={() => setActiveTab('statements')}
        >
          Statements &amp; Remittance
        </button>
        <button
          className={`page-tab ${activeTab === 'disputes' ? 'active' : ''}`}
          onClick={() => setActiveTab('disputes')}
        >
          Dispute Workflow
        </button>
      </div>

      {/* ═══ TAB 1: SCHEDULES & AGREEMENTS ═══ */}
      {activeTab === 'schedules' && (
        <>
          <div className="table-wrap" style={{ marginBottom: '24px' }}>
            <div className="table-head-row">
              <div className="table-head-title">Commission Schedules &amp; Rating Agreements</div>
              <div className="table-head-actions">
                <div className="search-wrapper">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                  <input
                    type="text"
                    className="filter-input"
                    placeholder="Search plan name..."
                    value={searchPlan}
                    onChange={(e) => setSearchPlan(e.target.value)}
                    style={{ width: '220px' }}
                  />
                </div>
                <button className="btn btn-primary" onClick={() => setIsNewPlanOpen(!isNewPlanOpen)}>
                  + New Plan
                </button>
              </div>
            </div>

            {/* New Plan Collapsible Form */}
            {isNewPlanOpen && (
              <div style={{ padding: '16px', background: 'var(--color-bg, #f8fafc)', borderBottom: '1px solid var(--color-border, #e2e8f0)' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0d1b4b', marginBottom: '12px' }}>
                  Create Commission Agreement
                </div>
                <div className="form-grid-3">
                  <div>
                    <label className="field-label">Plan Name *</label>
                    <input
                      className="field-input"
                      placeholder="e.g. HIT Commercial Trucking Tiered Plan"
                      value={newPlanName}
                      onChange={(e) => setNewPlanName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="field-label">Plan Type *</label>
                    <select
                      className="field-input"
                      value={newPlanType}
                      onChange={(e) => setNewPlanType(e.target.value)}
                    >
                      <option value="Tiered">Tiered</option>
                      <option value="Flat">Flat</option>
                      <option value="Sliding Scale">Sliding Scale</option>
                      <option value="Volume">Volume</option>
                      <option value="Profit-Sharing">Profit-Sharing</option>
                    </select>
                  </div>
                  <div>
                    <label className="field-label">Effective Date</label>
                    <input
                      className="field-input"
                      type="date"
                      value={newPlanDate}
                      onChange={(e) => setNewPlanDate(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ marginTop: '12px' }}>
                  <label className="field-label">Commission Rate(s) *</label>
                  {tierRules.map((rule, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                      <input
                        className="field-input"
                        type="number"
                        step="0.1"
                        placeholder="Rate %"
                        value={rule.rate}
                        onChange={(e) => handleTierChange(idx, 'rate', e.target.value)}
                        style={{ maxWidth: '120px' }}
                      />
                      <input
                        className="field-input"
                        placeholder="Description / threshold"
                        value={rule.desc}
                        onChange={(e) => handleTierChange(idx, 'desc', e.target.value)}
                      />
                      {tierRules.length > 1 && (
                        <button className="btn btn-ghost btn-sm" onClick={() => handleRemoveTierRule(idx)}>
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button className="btn btn-outline btn-sm" style={{ marginTop: '8px' }} onClick={handleAddTierRule}>
                    + Add Tier Rule
                  </button>
                </div>

                <div style={{ marginTop: '14px', display: 'flex', gap: '8px' }}>
                  <button className="btn btn-primary btn-sm" onClick={handleSubmitNewPlan}>
                    Save Commission Plan
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setIsNewPlanOpen(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '32px' }}><input type="checkbox" className="table-check" /></th>
                  <th>Plan Name</th>
                  <th>Type</th>
                  <th>Rate / Tier Summary</th>
                  <th>Effective Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlans.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '28px 16px', color: 'var(--color-muted, #64748b)', fontSize: '12.5px' }}>
                      No commission plans yet. Use "+ New Plan" to create one.
                    </td>
                  </tr>
                ) : (
                  filteredPlans.map(p => (
                    <tr key={p.id || p.name}>
                      <td><input type="checkbox" className="table-check" /></td>
                      <td className="font-semibold cell-link">{p.name}</td>
                      <td>
                        <span className={`badge ${
                          p.type === 'Tiered' ? 'badge-navy' : p.type === 'Flat' ? 'badge-gray' : 'badge-orange'
                        }`}>
                          {p.type}
                        </span>
                      </td>
                      <td>{p.summary}</td>
                      <td>{p.date}</td>
                      <td><span className="badge badge-green">{p.status || 'Active'}</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Multi-Level Hierarchy / Distribution — shape depends on which side of the
              money this role is on. Carriers see who they pay (MGAs/programs); MGAs see
              their own downstream producer splits; a plain producer/agency has no
              downstream to show, so the block doesn't render at all for that role. */}
          {roleConfig.showMgaSummary && (
            <div className="table-wrap" style={{ padding: '16px', marginBottom: '24px' }}>
              <div className="table-head-row" style={{ padding: '0 0 12px' }}>
                <div className="table-head-title">MGA / Program Distribution — Commission Payable by MGA</div>
              </div>
              {mgaSummary.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '28px 16px', color: 'var(--color-muted, #64748b)', fontSize: '12.5px' }}>
                  No commission transactions posted yet, so there's nothing to distribute by MGA.
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>MGA / Program</th>
                      <th>Downstream Producers</th>
                      <th style={{ textAlign: 'right' }}>Transactions</th>
                      <th style={{ textAlign: 'right' }}>Total Payable</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mgaSummary.map(s => (
                      <tr key={s.mga}>
                        <td className="font-semibold">{s.mga}</td>
                        <td>{s.producers.join(', ')}</td>
                        <td style={{ textAlign: 'right' }}>{s.count}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#0d1b4b' }}>
                          ${Number(s.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {roleConfig.showHierarchy && (
            <div className="table-wrap" style={{ padding: '16px', marginBottom: '24px' }}>
              <div className="table-head-row" style={{ padding: '0 0 12px' }}>
                <div className="table-head-title">Multi-Level Hierarchy — Downstream Producer Splits</div>
              </div>
              {producerHierarchy.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '28px 16px', color: 'var(--color-muted, #64748b)', fontSize: '12.5px' }}>
                  No commission transactions have been recorded yet, so there's no hierarchy to show. Add a transaction under the Transactions tab to build the tree.
                </div>
              ) : (
                <div className="v-tree">
                  {producerHierarchy.map(m => (
                    <div className="v-tree-node" key={m.mga}>
                      <div className="v-tree-row" onClick={() => toggleMgaNode(m.mga)} style={{ cursor: 'pointer' }}>
                        <span className="v-tree-toggle">{expandedMgaNodes[m.mga] ? '▼' : '▶'}</span>
                        <strong>{m.mga}</strong>
                        <span className="v-tree-badge">MGA</span>
                        <span className="v-tree-amount">${Number(m.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                      </div>
                      {expandedMgaNodes[m.mga] && (
                        <div className="v-tree-children" style={{ paddingLeft: '24px' }}>
                          {m.producers.map(p => (
                            <div className="v-tree-node" key={p.producer}>
                              <div className="v-tree-row">
                                <span className="v-tree-toggle" style={{ visibility: 'hidden' }}>▶</span>
                                <strong>{p.producer}</strong>
                                <span className="v-tree-badge" style={{ background: '#e8f5e9', color: '#2e7d32' }}>Producer</span>
                                <span className="v-tree-amount">${Number(p.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                              </div>
                              <div style={{ fontSize: '11.5px', color: 'var(--color-muted, #64748b)', padding: '2px 0 8px 24px', lineHeight: 1.55 }}>
                                {p.count} transaction{p.count === 1 ? '' : 's'}{p.carrier ? ` • Carrier: ${p.carrier}` : ''}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ═══ TAB 2: TRANSACTIONS ═══ */}
      {activeTab === 'transactions' && (
        <div className="table-wrap" style={{ marginBottom: '24px' }}>
          <div className="table-head-row">
            <div className="table-head-title">Commission Transactions</div>
            <div className="table-head-actions">
              <div className="search-wrapper">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input
                  type="text"
                  className="filter-input"
                  placeholder="Search producer, policy..."
                  value={searchTxn}
                  onChange={(e) => setSearchTxn(e.target.value)}
                  style={{ width: '220px' }}
                />
              </div>
              <button className="btn btn-primary" onClick={() => setIsNewTxnOpen(!isNewTxnOpen)}>
                + New Transaction
              </button>
            </div>
          </div>

          {isNewTxnOpen && (
            <div style={{ padding: '16px', background: 'var(--color-bg, #f8fafc)', borderBottom: '1px solid var(--color-border, #e2e8f0)' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0d1b4b', marginBottom: '12px' }}>
                Record Commission Transaction
              </div>
              <div className="form-grid-3">
                <div>
                  <label className="field-label">Producer / Agency *</label>
                  <input className="field-input" placeholder="e.g. HIT Retail Producers Inc." value={newTxnProducer} onChange={(e) => setNewTxnProducer(e.target.value)} />
                </div>
                <div>
                  <label className="field-label">Policy Number *</label>
                  <input className="field-input" placeholder="e.g. POL-12345" value={newTxnPolicy} onChange={(e) => setNewTxnPolicy(e.target.value)} />
                </div>
                <div>
                  <label className="field-label">Insured Name</label>
                  <input className="field-input" value={newTxnInsured} onChange={(e) => setNewTxnInsured(e.target.value)} />
                </div>
                <div>
                  <label className="field-label">Line of Business</label>
                  <input className="field-input" placeholder="e.g. Commercial Trucking" value={newTxnLob} onChange={(e) => setNewTxnLob(e.target.value)} />
                </div>
                <div>
                  <label className="field-label">MGA</label>
                  <input className="field-input" value={newTxnMga} onChange={(e) => setNewTxnMga(e.target.value)} />
                </div>
                <div>
                  <label className="field-label">Carrier</label>
                  <input className="field-input" value={newTxnCarrier} onChange={(e) => setNewTxnCarrier(e.target.value)} />
                </div>
                <div>
                  <label className="field-label">Gross Written Premium *</label>
                  <input className="field-input" type="number" step="0.01" value={newTxnPremium} onChange={(e) => setNewTxnPremium(e.target.value)} />
                </div>
                <div>
                  <label className="field-label">Commission Rate (%) *</label>
                  <input className="field-input" type="number" step="0.1" value={newTxnRate} onChange={(e) => setNewTxnRate(e.target.value)} />
                </div>
                <div>
                  <label className="field-label">Clawback Adjustment</label>
                  <input className="field-input" type="number" step="0.01" value={newTxnClawback} onChange={(e) => setNewTxnClawback(e.target.value)} />
                </div>
              </div>
              <div style={{ marginTop: '14px', display: 'flex', gap: '8px' }}>
                <button className="btn btn-primary btn-sm" onClick={handleSubmitNewTxn}>
                  Save Transaction
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setIsNewTxnOpen(false)}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '32px' }}><input type="checkbox" className="table-check" /></th>
                  <th>{roleConfig.producerColumnLabel}</th>
                  <th>Policy / Invoice Ref</th>
                  <th style={{ textAlign: 'right' }}>Gross Written Premium</th>
                  <th style={{ textAlign: 'right' }}>Commission Rate</th>
                  <th style={{ textAlign: 'right' }}>Gross Commission</th>
                  <th style={{ textAlign: 'right' }}>Clawback Adj.</th>
                  <th style={{ textAlign: 'right' }}>Net Payable</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTxns.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', padding: '28px 16px', color: 'var(--color-muted, #64748b)', fontSize: '12.5px' }}>
                      No commission transactions recorded yet. Use "+ New Transaction" to add one.
                    </td>
                  </tr>
                ) : filteredTxns.map(t => (
                  <tr key={t.id}>
                    <td><input type="checkbox" className="table-check" /></td>
                    <td className="font-semibold">
                      {t.producerName || t.producer}
                      {t.mga && (
                        <>
                          <br />
                          <span style={{ fontSize: '10.5px', color: 'var(--color-muted, #64748b)', fontWeight: 'normal' }}>
                            MGA: {t.mga}
                          </span>
                        </>
                      )}
                    </td>
                    <td className="cell-link" onClick={() => setStatementModalProducer(t.producer)}>
                      {t.policyNumber}
                      {t.invoiceRef && <span style={{ fontSize: '11px', color: 'var(--color-muted, #64748b)' }}> ({t.invoiceRef})</span>}
                      {t.insured && (
                        <>
                          <br />
                          <span style={{ fontSize: '11px', color: '#0d1b4b' }}>{t.insured}</span>
                        </>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      ${Number(t.grossPremium).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ textAlign: 'right' }}>{t.ratePct ? `${t.ratePct}%` : 'Fixed'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>
                      ${Number(t.grossCommission).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--color-muted, #64748b)' }}>
                      ${Number(t.clawback || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#0d1b4b' }}>
                      ${Number(t.netPayable).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      <span className={`badge ${
                        t.status === 'Approved' ? 'badge-green' : t.status === 'Paid' ? 'badge-blue' : 'badge-gray'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-outline btn-xs" onClick={() => setStatementModalProducer(t.producer)}>
                        Statement
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ TAB 3: STATEMENTS & REMITTANCE ═══ */}
      {activeTab === 'statements' && (
        <div className="table-wrap" style={{ marginBottom: '24px' }}>
          <div className="table-head-row">
            <div className="table-head-title">Commission Statements &amp; Remittance Batches</div>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>{roleConfig.producerColumnLabel}</th>
                <th>Period</th>
                <th>Policies Count</th>
                <th style={{ textAlign: 'right' }}>Total Net Commission</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {statementsSummary.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '28px 16px', color: 'var(--color-muted, #64748b)', fontSize: '12.5px' }}>
                    No commission transactions to statement yet. Statements generate automatically once transactions exist.
                  </td>
                </tr>
              ) : statementsSummary.map(s => (
                <tr key={s.producer}>
                  <td className="font-semibold">{s.producerName}</td>
                  <td>{s.period}</td>
                  <td><strong>{s.count}</strong> policies bound</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#0d1b4b', fontSize: '14px' }}>
                    ${Number(s.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td><span className="badge badge-green">Generated</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn btn-outline btn-sm" onClick={() => setStatementModalProducer(s.producer)}>
                        View Statement
                      </button>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => showToast(`Remittance statement sent electronically to ${s.producerName}`, 'success')}
                      >
                        Send Remittance
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══ TAB 4: DISPUTE WORKFLOW ═══ */}
      {activeTab === 'disputes' && (
        <div className="table-wrap" style={{ padding: '24px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>🛡️</div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#0d1b4b', marginBottom: '4px' }}>
            No Pending Disputes
          </div>
          <div style={{ fontSize: '12.5px', color: 'var(--color-muted, #64748b)' }}>
            No commission disputes have been raised for this period. A dispute is opened when a producer or MGA contests a commission amount, and will appear here for review once one is filed.
          </div>
        </div>
      )}

      {/* ═══ STATEMENT MODAL ═══ */}
      {statementModalProducer && (
        <div className="comm-modal open" onClick={() => setStatementModalProducer(null)}>
          <div className="comm-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="comm-modal-header">
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#0d1b4b' }}>
                Commission Remittance Statement: {modalTxns[0]?.producerName || statementModalProducer}
              </div>
              <div className="comm-modal-close" onClick={() => setStatementModalProducer(null)}>&times;</div>
            </div>

            <div style={{ padding: '10px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border, #e2e8f0)', paddingBottom: '12px', marginBottom: '16px' }}>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-muted, #64748b)', textTransform: 'uppercase' }}>
                    Payable To:
                  </span>
                  <br />
                  <strong style={{ fontSize: '16px', color: '#0d1b4b' }}>
                    {modalTxns[0]?.producerName || statementModalProducer}
                  </strong>
                  <br />
                  <span style={{ fontSize: '12px', color: 'var(--color-muted, #64748b)' }}>
                    Carrier: {modalTxns[0]?.carrier || '—'} &bull; Managing General Agent: {modalTxns[0]?.mga || '—'}
                  </span>
                </div>
                <div style={{ textAlign: 'right', fontSize: '13px' }}>
                  <div>Statement Period: <strong>{modalTxns[0]?.period || '—'}</strong></div>
                  <div>Issue Date: <strong>{modalTxns[0]?.date || '—'}</strong></div>
                  <div>Status: <span className="badge badge-green">Approved for Settlement</span></div>
                </div>
              </div>

              <table className="data-table" style={{ marginBottom: '16px' }}>
                <thead>
                  <tr>
                    <th>Policy / Ref</th>
                    <th>Insured Name</th>
                    <th>LOB</th>
                    <th style={{ textAlign: 'right' }}>Gross Premium</th>
                    <th style={{ textAlign: 'right' }}>Commission Due</th>
                  </tr>
                </thead>
                <tbody>
                  {modalTxns.map(t => (
                    <tr key={t.id}>
                      <td className="font-semibold">{t.policyNumber}</td>
                      <td>{t.insured || '—'}</td>
                      <td>{t.lob || '—'}</td>
                      <td style={{ textAlign: 'right' }}>${Number(t.grossPremium).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#0d1b4b' }}>
                        ${Number(t.netPayable).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'right', fontWeight: 700, borderTop: '2px solid var(--color-border, #cbd5e1)', fontSize: '14px' }}>
                      Total Remittance Payable
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 800, borderTop: '2px solid var(--color-border, #cbd5e1)', fontSize: '15px', color: '#0d1b4b' }}>
                      ${Number(modalTotal).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button className="btn btn-outline" onClick={() => window.print()}>
                  🖨️ Print Statement
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setStatementModalProducer(null);
                    showToast(`Settlement disbursement queued for ${modalTxns[0]?.producerName || statementModalProducer}`, 'success');
                  }}
                >
                  Authorize Payment (${Number(modalTotal).toLocaleString('en-US', { minimumFractionDigits: 2 })})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
export default CommissionEnginePage;
