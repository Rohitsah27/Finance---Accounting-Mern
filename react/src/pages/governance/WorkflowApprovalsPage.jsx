import React, { useState } from 'react';

const INITIAL_PENDING = [
  { id: 1, type: 'Journal Entry', ref: 'JE-2026-0089', submitter: 'Jane Smith (Accountant)', amount: 48500, days: 2, note: 'Quarterly accrual adjustments' },
  { id: 2, type: 'AP Invoice', ref: 'INV-CARRIER-8821', submitter: 'Marcus Webb (AP Lead)', amount: 124500, days: 1, note: 'Travelers monthly treaty bordereau' },
  { id: 3, type: 'Commission Run', ref: 'COMM-JULY-BATCH3', submitter: 'Elena Rostova (Rev Ops)', amount: 68200, days: 4, note: 'Surplus lines retail broker commissions' },
  { id: 4, type: 'Manual Disb.', ref: 'DISB-2026-0412', submitter: 'Latoya Simmons (Cash Ops)', amount: 15300, days: 1, note: 'Trust account client overpayment refund' },
  { id: 5, type: 'Purchase Order', ref: 'PO-IT-9018', submitter: 'Devon Ackerman (IT)', amount: 32000, days: 5, note: 'AWS enterprise server capacity uplift' },
];

export default function WorkflowApprovalsPage() {
  const [pendingItems, setPendingItems] = useState(INITIAL_PENDING);
  const [showBuilder, setShowBuilder] = useState(false);
  const [toast, setToast] = useState(null);

  // Builder form state
  const [chainName, setChainName] = useState('');
  const [triggerModule, setTriggerModule] = useState('Journal Entry');
  const [threshold, setThreshold] = useState('25000');
  const [steps, setSteps] = useState(['Manager', 'Controller', 'CFO']);
  const [escHours, setEscHours] = useState('48');
  const [escRole, setEscRole] = useState('CFO');

  // Notification toggles
  const [notifs, setNotifs] = useState([
    { event: 'Approval Requested', email: true, inApp: true, sms: false, enabled: true },
    { event: 'Item Escalated', email: true, inApp: true, sms: true, enabled: true },
    { event: 'Approval Overdue', email: true, inApp: true, sms: false, enabled: true },
    { event: 'Chain Approved (Final)', email: true, inApp: true, sms: false, enabled: true },
    { event: 'Item Rejected', email: true, inApp: false, sms: false, enabled: false },
  ]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleApprove = (id, ref) => {
    setPendingItems(pendingItems.filter(item => item.id !== id));
    showToast(`Approved ${ref}`);
  };

  const handleReject = (id, ref) => {
    setPendingItems(pendingItems.filter(item => item.id !== id));
    showToast(`Rejected and returned ${ref}`);
  };

  const addStep = () => {
    setSteps([...steps, 'VP Finance']);
  };

  const removeStep = (idx) => {
    setSteps(steps.filter((_, i) => i !== idx));
  };

  const updateStepRole = (idx, role) => {
    const updated = [...steps];
    updated[idx] = role;
    setSteps(updated);
  };

  const saveChain = () => {
    if (!chainName) {
      showToast('Please enter an approval chain name');
      return;
    }
    showToast(`Approval Chain "${chainName}" successfully created`);
    setShowBuilder(false);
    setChainName('');
  };

  const toggleNotif = (eventIdx, field) => {
    const updated = [...notifs];
    updated[eventIdx][field] = !updated[eventIdx][field];
    setNotifs(updated);
    showToast('Notification routing updated');
  };

  return (
    <div className="page-container">
      {toast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '10px 16px',
          background: 'var(--navy)',
          color: '#fff',
          borderRadius: '6px',
          zIndex: 9999,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          fontSize: '13px'
        }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Workflow &amp; Approvals</h1>
          <p className="page-subtitle">Approval chains, pending approvals, escalations, and notification routing</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline" onClick={() => showToast('Exporting workflow logs...')}>Export</button>
          <button className="btn btn-primary" onClick={() => setShowBuilder(!showBuilder)}>
            {showBuilder ? '✕ Close Builder' : '+ New Approval Chain'}
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon si-navy">⛓️</div>
          <div className="stat-info">
            <div className="stat-value">5</div>
            <div className="stat-label">Active Approval Chains</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon si-orange">⏳</div>
          <div className="stat-info">
            <div className="stat-value">{pendingItems.length}</div>
            <div className="stat-label">Pending Approvals (Mine)</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon si-coral">⚠️</div>
          <div className="stat-info">
            <div className="stat-value">1</div>
            <div className="stat-label">Escalated Items</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon si-green">⚡</div>
          <div className="stat-info">
            <div className="stat-value">2.5 hrs</div>
            <div className="stat-label">Avg. Approval Time</div>
          </div>
        </div>
      </div>

      {/* Approval Chain Builder Modal / Form */}
      {showBuilder && (
        <div className="card" style={{ marginBottom: '24px', padding: '20px', border: '2px solid var(--navy)' }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Approval Chain Builder</h3>
            <p style={{ fontSize: '12px', color: 'var(--gray-500)', margin: '4px 0 0 0' }}>
              Define trigger conditions and an ordered multi-tier approval sequence
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label className="field-label">Chain Name</label>
              <input
                type="text"
                className="field-input"
                placeholder="e.g. Large Journal Entry Approval"
                value={chainName}
                onChange={(e) => setChainName(e.target.value)}
              />
            </div>
            <div>
              <label className="field-label">Trigger Module</label>
              <select className="field-input" value={triggerModule} onChange={(e) => setTriggerModule(e.target.value)}>
                <option value="Journal Entry">Journal Entry</option>
                <option value="AP Invoice">AP Invoice</option>
                <option value="Purchase Order">Purchase Order</option>
                <option value="Expense Report">Expense Report</option>
                <option value="Wire Transfer">Wire Transfer / Carrier Remittance</option>
              </select>
            </div>
            <div>
              <label className="field-label">Threshold Amount ($)</label>
              <input
                type="number"
                className="field-input"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
              />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gray-500)', marginBottom: '8px' }}>
              Approval Sequence Steps
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {steps.map((step, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--gray-50)', padding: '10px 14px', borderRadius: '6px' }}>
                  <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'var(--navy)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px' }}>
                    {idx + 1}
                  </div>
                  <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--gray-700)' }}>Approver Role:</span>
                  <select
                    className="field-input"
                    value={step}
                    onChange={(e) => updateStepRole(idx, e.target.value)}
                    style={{ maxWidth: '200px' }}
                  >
                    <option value="Manager">Department Manager</option>
                    <option value="Controller">Corporate Controller</option>
                    <option value="CFO">Chief Financial Officer</option>
                    <option value="VP Finance">VP of Finance</option>
                    <option value="Audit Committee">Audit Committee</option>
                  </select>
                  {steps.length > 1 && (
                    <button className="btn btn-ghost btn-sm" onClick={() => removeStep(idx)} style={{ color: 'var(--red)', marginLeft: 'auto' }}>
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button className="btn btn-outline btn-sm" onClick={addStep} style={{ marginTop: '10px' }}>
              + Add Tier Step
            </button>
          </div>

          {/* Escalation Rule */}
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '12px 16px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', marginBottom: '20px' }}>
            <span>If not actioned in</span>
            <input
              type="number"
              className="field-input"
              value={escHours}
              onChange={(e) => setEscHours(e.target.value)}
              style={{ width: '70px', textAlign: 'center' }}
            />
            <span>hours, automatically escalate to</span>
            <select className="field-input" value={escRole} onChange={(e) => setEscRole(e.target.value)} style={{ maxWidth: '160px' }}>
              <option value="Controller">Controller</option>
              <option value="CFO">CFO</option>
              <option value="VP Finance">VP Finance</option>
              <option value="Audit Committee">Audit Committee</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button className="btn btn-outline" onClick={() => setShowBuilder(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={saveChain}>Save Approval Chain</button>
          </div>
        </div>
      )}

      {/* Pending Approvals Table */}
      <div className="table-wrap" style={{ marginBottom: '24px' }}>
        <div className="table-head-row">
          <div className="table-head-title">My Pending Approvals ({pendingItems.length})</div>
          <div className="table-head-actions">
            <span style={{ fontSize: '12px', color: 'var(--gray-500)' }}>Requires your signature or review</span>
          </div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Item Type</th>
              <th>Reference #</th>
              <th>Submitted By</th>
              <th className="text-right">Amount</th>
              <th>Days Pending</th>
              <th>Description / Note</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingItems.map((item) => (
              <tr key={item.id}>
                <td>
                  <span className={`badge ${
                    item.type.includes('Invoice') ? 'badge-navy' : item.type.includes('Commission') ? 'badge-orange' : 'badge-blue'
                  }`}>
                    {item.type}
                  </span>
                </td>
                <td className="font-semibold cell-link">{item.ref}</td>
                <td>{item.submitter}</td>
                <td className="text-right font-mono font-semibold">${item.amount.toLocaleString()}</td>
                <td>
                  <span style={{ color: item.days >= 4 ? 'var(--red)' : 'var(--gray-600)', fontWeight: item.days >= 4 ? 700 : 500 }}>
                    {item.days} day{item.days > 1 ? 's' : ''} {item.days >= 4 ? '(Overdue)' : ''}
                  </span>
                </td>
                <td style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{item.note}</td>
                <td>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button className="btn btn-primary btn-sm" onClick={() => handleApprove(item.id, item.ref)}>Approve</button>
                    <button className="btn btn-outline btn-sm" onClick={() => handleReject(item.id, item.ref)} style={{ color: 'var(--red)' }}>Reject</button>
                  </div>
                </td>
              </tr>
            ))}
            {pendingItems.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--gray-400)' }}>
                  All pending approval items have been reviewed!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Notification Triggers */}
      <div className="table-wrap">
        <div className="table-head-row">
          <div className="table-head-title">Notification Triggers &amp; Channels</div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Event</th>
              <th style={{ textAlign: 'center' }}>Email</th>
              <th style={{ textAlign: 'center' }}>In-App</th>
              <th style={{ textAlign: 'center' }}>SMS</th>
              <th style={{ textAlign: 'center' }}>Enabled</th>
            </tr>
          </thead>
          <tbody>
            {notifs.map((n, idx) => (
              <tr key={n.event}>
                <td className="font-semibold">{n.event}</td>
                <td style={{ textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={n.email}
                    onChange={() => toggleNotif(idx, 'email')}
                  />
                </td>
                <td style={{ textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={n.inApp}
                    onChange={() => toggleNotif(idx, 'inApp')}
                  />
                </td>
                <td style={{ textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={n.sms}
                    onChange={() => toggleNotif(idx, 'sms')}
                  />
                </td>
                <td style={{ textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={n.enabled}
                    onChange={() => toggleNotif(idx, 'enabled')}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
