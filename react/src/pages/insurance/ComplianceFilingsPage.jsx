import React, { useState, useEffect, useMemo } from 'react';

const TAB_META = {
  calendar: { label: 'Filing Calendar', title: 'Upcoming Statutory Deadlines & Filings', empty: 'No statutory filings are on the calendar yet. Use "+ New Filing" to add one.' },
  state: { label: 'State Surplus Lines', title: 'State Surplus Lines Tax & Stamping Filings', empty: 'No state surplus lines or stamping filings are outstanding.' },
  naic: { label: 'NAIC Schedule P', title: 'NAIC Schedule P Filings', empty: 'No NAIC Schedule P filings are outstanding.' },
  '1099': { label: '1099-NEC Reporting', title: '1099-NEC Producer Tax Filings', empty: 'No 1099-NEC producer filings are outstanding.' }
};
// A plain array of the keys in display order — Object.keys(TAB_META) can't be
// used for the tab strip because JS always sorts integer-like string keys
// (like '1099') to the front of iteration order, ahead of 'calendar' etc.,
// which silently reordered the tabs.
const TAB_ORDER = ['calendar', 'state', 'naic', '1099'];
// Options for the "+ New Filing" category select — same keys as the tabs,
// minus 'calendar' since that's the all-filings view, not a real category.
const CATEGORY_OPTIONS = TAB_ORDER.filter(k => k !== 'calendar');

const STATUS_OPTIONS = ['Draft', 'Pending Filing', 'Accruing', 'Validated', 'Filed'];
const CLOSED_STATUSES = ['Validated', 'Filed'];

export function ComplianceFilingsPage() {
  const [activeTab, setActiveTab] = useState('calendar');
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // No filing exists anywhere else in the app to derive this list from, so
  // it starts empty and persists whatever the user actually enters — same
  // pattern as the Tax Engine's nexus/rate/certificate lists.
  const [filings, setFilings] = useState(() => {
    try {
      const saved = localStorage.getItem('v_compliance_filings');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('v_compliance_filings', JSON.stringify(filings));
    } catch (e) {}
  }, [filings]);

  const [isNewFilingOpen, setIsNewFilingOpen] = useState(false);
  const [newForm, setNewForm] = useState('');
  const [newEntity, setNewEntity] = useState('');
  const [newCategory, setNewCategory] = useState('state');
  const [newDue, setNewDue] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newStatus, setNewStatus] = useState('Draft');

  const filteredFilings = useMemo(() => {
    if (activeTab === 'calendar') return filings;
    return filings.filter(f => f.category === activeTab);
  }, [filings, activeTab]);

  // Real, filing-derived numbers instead of the fixed 97% / 1 / 34 that used
  // to sit here regardless of what was actually on the calendar.
  const currentYear = new Date().getFullYear();
  const filedYtd = useMemo(
    () => filings.filter(f => f.status === 'Filed' && f.due && new Date(f.due).getFullYear() === currentYear).length,
    [filings, currentYear]
  );
  const actionItems = useMemo(
    () => filings.filter(f => f.status === 'Draft' || f.status === 'Pending Filing').length,
    [filings]
  );
  const complianceScore = useMemo(() => {
    if (filings.length === 0) return null;
    const closed = filings.filter(f => CLOSED_STATUSES.includes(f.status)).length;
    return Math.round((closed / filings.length) * 100);
  }, [filings]);

  const handleSubmitNewFiling = () => {
    if (!newForm.trim() || !newEntity.trim() || !newDue) {
      showToast('Filing name, regulatory body, and due date are required.', 'warning');
      return;
    }
    const filing = {
      form: newForm.trim(),
      entity: newEntity.trim(),
      category: newCategory,
      due: newDue,
      amount: newAmount.trim() ? `$${Number(newAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : 'N/A',
      status: newStatus
    };
    setFilings([filing, ...filings]);
    setIsNewFilingOpen(false);
    setNewForm(''); setNewEntity(''); setNewCategory('state'); setNewDue(''); setNewAmount(''); setNewStatus('Draft');
    showToast(`${filing.form} added to the filing calendar.`);
  };

  const handleSubmitFiling = (idx) => {
    setFilings(filings.map((f, i) => (i === idx ? { ...f, status: 'Filed' } : f)));
    showToast(`${filings[idx].form} marked as filed.`);
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
          <div className="page-title">Compliance &amp; Statutory Filings</div>
          <div className="page-subtitle">
            Statutory filing calendar, NAIC Schedule P, surplus lines state stamping, and 1099 producer tax reporting
          </div>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline" onClick={() => showToast('Audit Pack generated')}>
            Generate Audit Pack
          </button>
          <button className="btn btn-primary" onClick={() => setIsNewFilingOpen(!isNewFilingOpen)}>
            + New Filing
          </button>
        </div>
      </div>

      {/* Compliance Score Banner — now computed from the filings below instead of fixed numbers */}
      <div style={{
        background: 'linear-gradient(135deg, #0d1b4b, #1a3a6b)',
        borderRadius: '10px',
        padding: '20px 24px',
        marginBottom: '20px',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>Overall Compliance &amp; Regulatory Score</div>
          <div style={{ fontSize: '12.5px', opacity: 0.8 }}>
            Share of filings Validated or Filed, out of everything on the calendar
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#4caf50' }}>{complianceScore === null ? '—' : `${complianceScore}%`}</div>
            <div style={{ fontSize: '11px', opacity: 0.7 }}>Score</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#ffb74d' }}>{actionItems}</div>
            <div style={{ fontSize: '11px', opacity: 0.7 }}>Action Item{actionItems === 1 ? '' : 's'}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#4caf50' }}>{filedYtd}</div>
            <div style={{ fontSize: '11px', opacity: 0.7 }}>Filed YTD</div>
          </div>
        </div>
      </div>

      {/* Page Tabs */}
      <div className="page-tabs" style={{ marginBottom: '14px' }}>
        {TAB_ORDER.map(key => (
          <button
            key={key}
            className={`page-tab ${activeTab === key ? 'active' : ''}`}
            onClick={() => setActiveTab(key)}
          >
            {TAB_META[key].label}
          </button>
        ))}
      </div>

      {/* New Filing Collapsible Form */}
      {isNewFilingOpen && (
        <div className="table-wrap" style={{ padding: '16px', marginBottom: '14px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#0d1b4b', marginBottom: '12px' }}>
            Add Statutory Filing
          </div>
          <div className="form-grid-3">
            <div>
              <label className="field-label">Filing / Form Name *</label>
              <input className="field-input" placeholder="e.g. NY Surplus Lines Tax Return" value={newForm} onChange={(e) => setNewForm(e.target.value)} />
            </div>
            <div>
              <label className="field-label">Regulatory Body / Jurisdiction *</label>
              <input className="field-input" placeholder="e.g. New York Department of Financial Services" value={newEntity} onChange={(e) => setNewEntity(e.target.value)} />
            </div>
            <div>
              <label className="field-label">Category *</label>
              <select className="field-input" value={newCategory} onChange={(e) => setNewCategory(e.target.value)}>
                {CATEGORY_OPTIONS.map(key => (
                  <option key={key} value={key}>{TAB_META[key].label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">Statutory Due Date *</label>
              <input className="field-input" type="date" value={newDue} onChange={(e) => setNewDue(e.target.value)} />
            </div>
            <div>
              <label className="field-label">Liability / Tax Amount</label>
              <input className="field-input" type="number" step="0.01" placeholder="Leave blank for N/A" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} />
            </div>
            <div>
              <label className="field-label">Filing Status</label>
              <select className="field-input" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginTop: '14px', display: 'flex', gap: '8px' }}>
            <button className="btn btn-primary btn-sm" onClick={handleSubmitNewFiling}>
              Save Filing
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setIsNewFilingOpen(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filings Table — content changes with the active tab, and is real, persisted data */}
      <div className="table-wrap">
        <div className="table-head-row">
          <div className="table-head-title">{TAB_META[activeTab].title}</div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Filing / Form Name</th>
              <th>Regulatory Body / Jurisdiction</th>
              <th>Statutory Due Date</th>
              <th>Liability / Tax Amount</th>
              <th>Filing Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredFilings.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '28px 16px', color: 'var(--color-muted, #64748b)', fontSize: '12.5px' }}>
                  {TAB_META[activeTab].empty}
                </td>
              </tr>
            ) : filteredFilings.map((f) => {
              const filingsIdx = filings.indexOf(f);
              return (
                <tr key={`${f.form}-${f.due}-${filingsIdx}`}>
                  <td style={{ fontWeight: 600 }}>{f.form}</td>
                  <td>{f.entity}</td>
                  <td>{f.due}</td>
                  <td style={{ fontWeight: 700 }}>{f.amount}</td>
                  <td>
                    <span className={`badge ${CLOSED_STATUSES.includes(f.status) ? 'badge-green' : 'badge-orange'}`}>
                      {f.status}
                    </span>
                  </td>
                  <td>
                    {f.status === 'Filed' ? (
                      <span style={{ fontSize: '11px', color: 'var(--color-muted, #64748b)' }}>Filed</span>
                    ) : (
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ height: '26px', fontSize: '11px', padding: '0 8px' }}
                        onClick={() => handleSubmitFiling(filingsIdx)}
                      >
                        Submit Filing
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
