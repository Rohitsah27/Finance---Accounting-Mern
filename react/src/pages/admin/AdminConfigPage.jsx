import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './admin-config.css';

export function AdminConfigPage() {
  const [activeTab, setActiveTab] = useState('modules');
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  /* ---------------- TAB 1: MODULE CATALOGUE ---------------- */
  const GROUP_ORDER = [
    'Core Financials',
    'Treasury',
    'People',
    'Operations',
    'Revenue',
    'Compliance',
    'Planning',
    'Governance',
    'Configuration',
    'Industry'
  ];

  const INITIAL_MODULES = [
    { id: 'gl', no: '01', label: 'General Ledger', group: 'Core Financials', desc: 'Chart of Accounts, Journal Entries, Period Close, Multi-Entity, Trial Balance.', core: true, locked: true, enabled: true },
    { id: 'ar', no: '02', label: 'Accounts Receivable', group: 'Core Financials', desc: 'Invoicing, collections, receipts, ageing, dunning, statements, disputes.', core: false, locked: false, enabled: true },
    { id: 'billing', no: '03', label: 'Billing & Invoicing', group: 'Core Financials', desc: 'Recurring, milestone, retainer billing; credit & debit notes.', core: false, locked: false, enabled: true },
    { id: 'ap', no: '04', label: 'Accounts Payable', group: 'Core Financials', desc: 'Vendor master, bills, 3-way match, ACH/check/wire payments, 1099/W-9.', core: false, locked: false, enabled: true },
    { id: 'bank', no: '05', label: 'Bank & Cash Management', group: 'Treasury', desc: 'Bank feeds, reconciliation, petty cash, cash position, FX, trust accounts.', core: false, locked: false, enabled: true },
    { id: 'payments', no: '06', label: 'Payments & Money Movement', group: 'Treasury', desc: 'Inbound/outbound payments, allocation, refunds, provider integrations.', core: false, locked: false, enabled: true },
    { id: 'fx', no: '12', label: 'Multi-Currency & FX', group: 'Treasury', desc: 'Real-time rates, unrealised/realised gain-loss, revaluation.', core: false, locked: false, enabled: true },
    { id: 'payroll', no: '07', label: 'Payroll & People', group: 'People', desc: 'Salary, hourly, commission payroll, tax withholding, payslips, benefits.', core: false, locked: false, enabled: true },
    { id: 'inventory', no: '08', label: 'Inventory & Costing', group: 'Operations', desc: 'FIFO/LIFO/weighted avg, stock takes, reorder levels, landed cost.', core: false, locked: false, enabled: true },
    { id: 'fixed-assets', no: '09', label: 'Fixed Assets', group: 'Operations', desc: 'Asset register, straight-line/declining depreciation, disposal.', core: false, locked: false, enabled: true },
    { id: 'projects', no: '10', label: 'Projects & Job Costing', group: 'Operations', desc: 'Project P&L, WIP, time & material billing, cost centers.', core: false, locked: false, enabled: true },
    { id: 'commission', no: '11', label: 'Commission Engine', group: 'Revenue', desc: 'Tiered, split, clawback, carrier/broker schedules, statements.', core: false, locked: false, enabled: true },
    { id: 'tax', no: '13', label: 'Tax Engine', group: 'Compliance', desc: 'Sales tax, VAT, GST, surplus lines, withholding, tax reports.', core: false, locked: false, enabled: true },
    { id: 'budgeting', no: '14', label: 'Budgeting & Forecasting', group: 'Planning', desc: 'Annual budgets, variance analysis, rolling forecasts, what-if.', core: false, locked: false, enabled: true },
    { id: 'reporting', no: '15', label: 'Reporting & Analytics', group: 'Governance', desc: 'P&L, Balance Sheet, Cash Flow, aging reports, KPI builder.', core: false, locked: false, enabled: true },
    { id: 'workflow', no: '16', label: 'Workflow & Approvals', group: 'Governance', desc: 'Multi-tier approval chains, threshold rules, audit sign-off.', core: false, locked: false, enabled: true },
    { id: 'audit-trail', no: '23', label: 'Audit Trail & Controls', group: 'Governance', desc: 'Immutable activity log, field-level changes, login tracking, SOC compliance.', core: false, locked: false, enabled: true },
    { id: 'documents', no: '24', label: 'Document Management', group: 'Governance', desc: 'Templates, attachments library, e-signature tracking.', core: false, locked: false, enabled: true },
    { id: 'admin-config', no: '21', label: 'Configuration Centre', group: 'Configuration', desc: 'Tenant setup, custom dimensions, COA templates, industry workspaces.', core: true, locked: true, enabled: true },
    { id: 'identity', no: '22', label: 'User Management', group: 'Configuration', desc: 'RBAC security, user invitations, role definitions, access logs.', core: true, locked: true, enabled: true },
    { id: 'integration', no: '25', label: 'API & Integration Hub', group: 'Configuration', desc: 'REST keys, webhooks, event catalogue, async import/export jobs.', core: false, locked: false, enabled: true },
    { id: 'pas-policy', no: '17', label: 'Policy Admin (PAS)', group: 'Industry', industryOnly: true, desc: 'Policy binding, endorsements, cancellations, premium schedules.', core: false, locked: false, enabled: true },
    { id: 'premium-claims', no: '18', label: 'Premium & Claims Subledger', group: 'Industry', industryOnly: true, desc: 'Unearned premium reserve (UPR), case reserves, IBNR, loss development.', core: false, locked: false, enabled: true },
    { id: 'statutory-reports', no: '19', label: 'Statutory Reports', group: 'Industry', industryOnly: true, desc: 'NAIC Schedule P, Surplus Lines State Stamping, Yellow Book filings.', core: false, locked: false, enabled: true },
    { id: 'mga-operations', no: '20', label: 'MGA Operations', group: 'Industry', industryOnly: true, desc: 'Delegated authority (DUAA), bordereaux submission, carrier settlement.', core: false, locked: false, enabled: true },
    { id: 'reinsurance', no: '26', label: 'Reinsurance Accounting', group: 'Industry', industryOnly: true, desc: 'Treaty master, quota share / excess of loss cessions, settlement statements.', core: false, locked: false, enabled: true },
  ];

  const [modules, setModules] = useState(INITIAL_MODULES);

  const toggleModule = (id, label) => {
    setModules(prev => prev.map(m => {
      if (m.id === id) {
        if (m.locked) {
          showToast(`${label} is core to the accounting engine and cannot be disabled`, 'error');
          return m;
        }
        const next = !m.enabled;
        showToast(`${label} ${next ? 'enabled' : 'disabled'}`, next ? 'success' : 'info');
        return { ...m, enabled: next };
      }
      return m;
    }));
  };

  /* ---------------- TAB 2: DIMENSION MANAGER ---------------- */
  const INITIAL_DIMENSIONS = [
    { id: 'mga', label: 'MGA / Program Entity', ref: 'Class', appliesTo: ['All Transactions'], desc: 'Partition financials by writing program or delegated partner', enabled: true },
    { id: 'state', label: 'Jurisdiction / Risk State', ref: 'Location', appliesTo: ['All Transactions'], desc: 'Tracks state tax liabilities, stamping fees, and NAIC Schedule T', enabled: true },
    { id: 'lob', label: 'Line of Business (LOB)', ref: 'Native to Veridex', appliesTo: ['Premiums', 'Claims'], desc: 'Commercial Auto Liability, Physical Damage, Cargo 50 Series', enabled: true },
    { id: 'producer', label: 'Retail Producer / Broker', ref: 'Customer / Job', appliesTo: ['Invoicing', 'AR'], desc: 'Identifies originating agency for commission calculations', enabled: true },
    { id: 'dept', label: 'Department / Cost Center', ref: 'Department', appliesTo: ['Opex', 'Payroll'], desc: 'Corporate cost allocation across underwriting, claims, IT and finance', enabled: true },
    { id: 'curr', label: 'Currency Code', ref: 'Currency', appliesTo: ['All Transactions'], desc: 'Multi-currency tracking for foreign reinsurance cessions', enabled: true },
  ];

  const [dimensions, setDimensions] = useState(INITIAL_DIMENSIONS);

  const toggleDimension = (id, label) => {
    setDimensions(prev => prev.map(d => {
      if (d.id === id) {
        const next = !d.enabled;
        showToast(`Dimension "${label}" ${next ? 'enabled' : 'disabled'} across all modules`, next ? 'success' : 'info');
        return { ...d, enabled: next };
      }
      return d;
    }));
  };

  /* ---------------- TAB 3: COA TEMPLATE LIBRARY ---------------- */
  const COA_TEMPLATES = [
    { id: 'trucking', label: 'Specialty Commercial Auto & Trucking Carrier', accounts: 96, businessTypes: ['Carrier', 'MGA'], applied: true, desc: 'Pre-configured with 20/40/50 coverage codes, fiduciary escrow accounts, reinsurance quota share contra-ledgers, and Texas surplus lines tax liabilities.' },
    { id: 'pc-carrier', label: 'General P&C Insurance Carrier (Standard NAIC)', accounts: 142, businessTypes: ['Carrier'], applied: false, desc: 'Full NAIC Annual Statement chart of accounts covering multi-peril property, workers comp, and casualty.' },
    { id: 'mga-program', label: 'Commercial Property & Casualty MGA', accounts: 78, businessTypes: ['MGA', 'Program Manager'], applied: false, desc: 'DUAA & bordereaux compliant, trust cash holding, commission splitting, and carrier net payable accounts.' },
    { id: 'commercial', label: 'General Business & Commercial Trade', accounts: 64, businessTypes: ['General Business', 'Insured'], applied: false, desc: 'Standard GAAP accrual chart of accounts with AP, AR, fixed assets, and operating expense cost centers.' },
  ];

  const [coaTemplates, setCoaTemplates] = useState(COA_TEMPLATES);

  const applyCoaTemplate = (id, label) => {
    setCoaTemplates(prev => prev.map(t => ({
      ...t,
      applied: t.id === id
    })));
    showToast(`"${label}" applied to active entity`, 'success');
  };

  /* ---------------- TAB 4: FIELD MANAGER ---------------- */
  const INITIAL_FIELDS = [
    { field: 'Account Code', module: 'General Ledger', show: true, required: true, readonly: false },
    { field: 'Account Name', module: 'General Ledger', show: true, required: true, readonly: false },
    { field: 'Vendor Tax ID', module: 'Accounts Payable', show: true, required: true, readonly: false },
    { field: 'Customer Credit Limit', module: 'Accounts Receivable', show: true, required: false, readonly: false },
    { field: 'Policy Number', module: 'Insurance Extension', show: true, required: true, readonly: true },
  ];

  const [fields, setFields] = useState(INITIAL_FIELDS);

  const addField = () => {
    setFields(prev => [...prev, { field: 'New Custom Field', module: 'General Ledger', show: true, required: false, readonly: false }]);
    showToast('Custom field added, rename it below', 'success');
  };

  const removeField = (idx) => {
    const item = fields[idx];
    setFields(prev => prev.filter((_, i) => i !== idx));
    showToast(`Field "${item.field}" removed`, 'info');
  };

  const updateField = (idx, prop, val) => {
    setFields(prev => prev.map((f, i) => i === idx ? { ...f, [prop]: val } : f));
  };

  /* ---------------- TAB 5: SEQUENCE MANAGER ---------------- */
  const INITIAL_SEQUENCES = [
    { doc: 'Invoice', prefix: 'INV-', yearToken: 'YYYY', next: 1042, digits: 5 },
    { doc: 'Journal Entry', prefix: 'JE-', yearToken: 'YYYY', next: 8891, digits: 6 },
    { doc: 'Policy', prefix: 'POL-', yearToken: 'YYYY', next: 204, digits: 6 },
    { doc: 'Purchase Order', prefix: 'PO-', yearToken: '', next: 317, digits: 5 },
  ];

  const [sequences, setSequences] = useState(INITIAL_SEQUENCES);

  const sequencePreview = (s) => {
    const year = s.yearToken ? new Date().getFullYear() + '-' : '';
    return s.prefix + year + String(s.next).padStart(s.digits, '0');
  };

  const addSequence = () => {
    setSequences(prev => [...prev, { doc: 'New Document Type', prefix: 'DOC-', yearToken: 'YYYY', next: 1, digits: 5 }]);
    showToast('Sequence added, configure prefix and numbering below', 'success');
  };

  const removeSequence = (idx) => {
    const item = sequences[idx];
    setSequences(prev => prev.filter((_, i) => i !== idx));
    showToast(`"${item.doc}" sequence removed`, 'info');
  };

  const updateSequence = (idx, field, val) => {
    setSequences(prev => prev.map((s, i) => {
      if (i === idx) {
        const nextVal = (field === 'next' || field === 'digits') ? parseInt(val, 10) || 0 : val;
        return { ...s, [field]: nextVal };
      }
      return s;
    }));
  };

  /* ---------------- TAB 6: GL MAPPING RULES ---------------- */
  const INITIAL_GL_RULES = [
    { event: 'A customer invoice is issued', posting: 'Dr Accounts Receivable, Cr Sales Revenue' },
    { event: 'Premium received from an MGA', posting: 'Dr Premium Trust, Cr Gross Premium Written' },
    { event: 'A vendor bill is approved for payment', posting: 'Dr Expense / Inventory, Cr Accounts Payable' },
    { event: 'A claim reserve is established', posting: 'Dr Loss & LAE Expense, Cr Claim Reserves' },
    { event: 'Payroll is run', posting: 'Dr Payroll Expense, Cr Cash / Payroll Liabilities' },
    { event: 'A fixed asset depreciation run completes', posting: 'Dr Depreciation Expense, Cr Accumulated Depreciation' },
  ];

  const [glRules, setGlRules] = useState(INITIAL_GL_RULES);
  const [glEditingIndex, setGlEditingIndex] = useState(null);
  const [editEvent, setEditEvent] = useState('');
  const [editPosting, setEditPosting] = useState('');

  const startEditGl = (idx) => {
    setGlEditingIndex(idx);
    setEditEvent(glRules[idx].event);
    setEditPosting(glRules[idx].posting);
  };

  const saveGlRule = (idx) => {
    setGlRules(prev => prev.map((r, i) => i === idx ? { event: editEvent, posting: editPosting } : r));
    setGlEditingIndex(null);
    showToast('Posting rule updated', 'success');
  };

  const addGlRule = () => {
    const newRule = { event: 'A new business event occurs', posting: 'Dr [Account], Cr [Account]' };
    setGlRules(prev => [...prev, newRule]);
    setGlEditingIndex(glRules.length);
    setEditEvent(newRule.event);
    setEditPosting(newRule.posting);
    showToast('New posting rule added, edit it below', 'success');
  };

  const removeGlRule = (idx) => {
    setGlRules(prev => prev.filter((_, i) => i !== idx));
    if (glEditingIndex === idx) setGlEditingIndex(null);
    showToast('Posting rule removed', 'info');
  };

  /* ---------------- TAB 7: FISCAL YEAR & NOTIFICATIONS ---------------- */
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const [fiscalStart, setFiscalStart] = useState('January');
  const [fiscalPeriods, setFiscalPeriods] = useState('12');

  const [periodsList, setPeriodsList] = useState([
    { label: 'Jan 2026', status: 'closed' },
    { label: 'Feb 2026', status: 'closed' },
    { label: 'Mar 2026', status: 'closed' },
    { label: 'Apr 2026', status: 'closed' },
    { label: 'May 2026', status: 'closed' },
    { label: 'Jun 2026', status: 'closed' },
    { label: 'Jul 2026', status: 'closed' },
    { label: 'Aug 2026', status: 'open' },
    { label: 'Sep 2026', status: 'future' },
    { label: 'Oct 2026', status: 'future' },
    { label: 'Nov 2026', status: 'future' },
    { label: 'Dec 2026', status: 'future' },
  ]);

  const togglePeriodStatus = (label) => {
    setPeriodsList(prev => prev.map(p => {
      if (p.label === label) {
        const nextStatus = p.status === 'closed' ? 'open' : 'closed';
        showToast(`${label} marked ${nextStatus}. Journal Entry checks this before posting.`, nextStatus === 'closed' ? 'warning' : 'success');
        return { ...p, status: nextStatus };
      }
      return p;
    }));
  };

  const [notifications, setNotifications] = useState([
    { rule: 'Invoice overdue', trigger: 'AR invoice passes due date', channels: { email: true, inapp: true, sms: false } },
    { rule: 'Credit limit 80% reached', trigger: 'Customer balance vs credit limit', channels: { email: true, inapp: true, sms: false } },
    { rule: '1099 threshold reached', trigger: 'Vendor YTD payments cross $600', channels: { email: true, inapp: false, sms: false } },
    { rule: 'Period ready to close', trigger: 'All close checklist items pass', channels: { email: true, inapp: true, sms: true } },
  ]);

  const toggleNotifChannel = (idx, channel) => {
    setNotifications(prev => prev.map((n, i) => {
      if (i === idx) {
        const updated = { ...n.channels, [channel]: !n.channels[channel] };
        showToast(`${n.rule}: ${channel} ${updated[channel] ? 'enabled' : 'disabled'}`, 'info');
        return { ...n, channels: updated };
      }
      return n;
    }));
  };

  return (
    <div className="admin-config-wrap">
      {toast && (
        <div className={`veridex-toast veridex-toast-${toast.type}`}>
          <span>{toast.type === 'error' ? '✕' : '✓'}</span>
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Header */}
      <div className="page-header" style={{ marginBottom: '16px' }}>
        <div>
          <div className="page-title">Configuration Centre</div>
          <div className="page-subtitle">
            Every module, field, sequence, dimension and posting rule in the platform is configurable from here, no code, no support ticket.
          </div>
        </div>
        <div className="page-actions" style={{ alignItems: 'center' }}>
          <div className="readiness-badge">
            <span className="readiness-label">Configuration Readiness</span>
            <span className="readiness-score">100%</span>
          </div>
          <Link to="/setup-wizard" className="btn btn-outline btn-sm">
            Open Setup Wizard
          </Link>
          <Link to="/excel-onboarding" className="btn btn-primary btn-sm">
            Data Mapping &rarr;
          </Link>
        </div>
      </div>

      {/* 7 Tabs matching admin-config-center.html */}
      <div className="page-tabs" style={{ marginBottom: '16px' }}>
        {[
          { id: 'modules', label: 'Module Catalogue' },
          { id: 'dimensions', label: 'Dimension Manager' },
          { id: 'coa', label: 'COA Template Library' },
          { id: 'fields', label: 'Field Manager' },
          { id: 'sequences', label: 'Sequence Manager' },
          { id: 'glmapping', label: 'GL Mapping Rules' },
          { id: 'fiscal', label: 'Fiscal Year & Notifications' },
        ].map(t => (
          <button
            key={t.id}
            className={`page-tab ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: MODULE CATALOGUE */}
      {activeTab === 'modules' && (
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-ink)', marginBottom: '4px' }}>
            Module Catalogue
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-muted)', marginBottom: '20px' }}>
            25 platform modules. Toggle any non-core module on or off for the active entity's business type. Locked modules underpin the accounting engine and cannot be disabled.
          </div>

          {GROUP_ORDER.map(group => {
            const groupMods = modules.filter(m => m.group === group);
            if (!groupMods.length) return null;
            return (
              <div key={group} style={{ marginBottom: '22px' }}>
                <div style={{ fontSize: '11.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--gray-400)', marginBottom: '10px' }}>
                  {group}
                </div>
                <div className="v-module-grid">
                  {groupMods.map(m => (
                    <div key={m.id} className={`v-module-card ${!m.enabled ? 'disabled' : ''}`}>
                      <div className="v-module-card-top">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div className="v-module-card-icon">{m.no}</div>
                          <div className="v-module-card-title">{m.label}</div>
                        </div>
                        <label className="v-switch">
                          <input
                            type="checkbox"
                            checked={m.enabled}
                            disabled={m.locked}
                            onChange={() => toggleModule(m.id, m.label)}
                          />
                          <span className="v-slider" />
                        </label>
                      </div>
                      <div className="v-module-card-desc">{m.desc}</div>
                      <div className="v-module-card-meta">
                        {m.industryOnly && <span className="v-badge-industry-only">Industry Only</span>}
                        {m.core && <span className="v-badge-config">Core</span>}
                      </div>
                      {m.locked && (
                        <div className="v-lock-note">
                          🔒 Core to the accounting engine, cannot be disabled.
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: DIMENSION MANAGER */}
      {activeTab === 'dimensions' && (
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-ink)', marginBottom: '4px' }}>
            Dimension Manager
          </div>
          <p style={{ fontSize: '12.5px', color: 'var(--gray-600)', lineHeight: 1.6, margin: '4px 0 16px', maxWidth: '820px' }}>
            Dimensions post alongside every transaction across every module, echoing the standard QuickBooks "Class" and "Location" model that most finance teams already know. Enable a dimension here and it immediately becomes available in the filter bar of every ledger, AR, AP, billing and reporting screen, no per-module setup required.
          </p>

          <div style={{ border: '1px solid var(--gray-200)', borderRadius: '8px', overflow: 'hidden', background: '#fff' }}>
            <div className="v-config-row head">
              <div>Dimension</div>
              <div>Reference Code</div>
              <div>Applies To</div>
              <div>Description</div>
              <div style={{ textAlign: 'center' }}>Enabled</div>
            </div>
            {dimensions.map(d => (
              <div key={d.id} className="v-config-row">
                <div>
                  <strong>{d.label}</strong>
                  <div style={{ fontSize: '11.5px', color: 'var(--gray-500)', marginTop: '2px' }}>{d.desc}</div>
                </div>
                <div style={{ fontSize: '12px' }}>
                  <em>{d.ref}</em>
                </div>
                <div>
                  {d.appliesTo.map((a, i) => (
                    <span key={i} className="badge badge-gray" style={{ marginRight: '3px' }}>{a}</span>
                  ))}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>Filterable everywhere</div>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <label className="v-switch">
                    <input
                      type="checkbox"
                      checked={d.enabled}
                      onChange={() => toggleDimension(d.id, d.label)}
                    />
                    <span className="v-slider" />
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: COA TEMPLATE LIBRARY */}
      {activeTab === 'coa' && (
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-ink)', marginBottom: '4px' }}>
            Chart of Accounts Template Library
          </div>
          <div style={{ fontSize: '12px', color: 'var(--gray-500)', margin: '2px 0 16px' }}>
            Apply a pre-built COA template to the active entity. Applying a template records a new configuration version; existing account balances are preserved.
          </div>

          <div className="v-module-grid">
            {coaTemplates.map(t => (
              <div
                key={t.id}
                className="v-module-card"
                style={t.applied ? { borderColor: 'var(--navy, #0d1b4b)', borderWidth: '2px', background: '#f8fafc' } : {}}
              >
                <div className="v-module-card-top">
                  <div className="v-module-card-title">{t.label}</div>
                  {t.applied && <span className="v-badge-config">Applied</span>}
                </div>
                <div className="v-module-card-desc">{t.accounts} pre-built accounts. Business types: {t.businessTypes.join(', ')}.<br />{t.desc}</div>
                <div className="v-module-card-meta">
                  <button
                    className={`btn btn-sm ${t.applied ? 'btn-outline' : 'btn-primary'}`}
                    disabled={t.applied}
                    onClick={() => applyCoaTemplate(t.id, t.label)}
                  >
                    {t.applied ? 'Currently Applied' : 'Apply to Active Entity'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: FIELD MANAGER */}
      {activeTab === 'fields' && (
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-ink)' }}>Field Manager</span>
            <button className="btn btn-primary btn-sm" onClick={addField}>+ Add Field</button>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--gray-500)', margin: '2px 0 16px' }}>
            Rename, show/hide, require or lock any field across the platform, generic accounting fields and industry-specific fields side by side.
          </div>

          <div style={{ border: '1px solid var(--gray-200)', borderRadius: '8px', overflow: 'hidden', background: '#fff' }}>
            <div className="v-config-row head" style={{ gridTemplateColumns: '2.2fr 1.3fr 90px 90px 90px 50px' }}>
              <div>Field Label</div>
              <div>Module</div>
              <div style={{ textAlign: 'center' }}>Show</div>
              <div style={{ textAlign: 'center' }}>Required</div>
              <div style={{ textAlign: 'center' }}>Read-only</div>
              <div />
            </div>
            {fields.map((f, i) => (
              <div key={i} className="v-config-row" style={{ gridTemplateColumns: '2.2fr 1.3fr 90px 90px 90px 50px' }}>
                <div>
                  <input
                    className="filter-input"
                    style={{ width: '100%', fontWeight: 600 }}
                    value={f.field}
                    onChange={(e) => updateField(i, 'field', e.target.value)}
                  />
                </div>
                <div><span className="badge badge-gray">{f.module}</span></div>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <label className="v-switch">
                    <input
                      type="checkbox"
                      checked={f.show}
                      onChange={(e) => updateField(i, 'show', e.target.checked)}
                    />
                    <span className="v-slider" />
                  </label>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <label className="v-switch">
                    <input
                      type="checkbox"
                      checked={f.required}
                      onChange={(e) => updateField(i, 'required', e.target.checked)}
                    />
                    <span className="v-slider" />
                  </label>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <label className="v-switch">
                    <input
                      type="checkbox"
                      checked={f.readonly}
                      onChange={(e) => updateField(i, 'readonly', e.target.checked)}
                    />
                    <span className="v-slider" />
                  </label>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ color: '#d32f2f', padding: '4px 8px', fontSize: '14px' }}
                    title="Remove field"
                    onClick={() => removeField(i)}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: SEQUENCE MANAGER */}
      {activeTab === 'sequences' && (
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-ink)' }}>Document Numbering Sequences</span>
            <button className="btn btn-primary btn-sm" onClick={addSequence}>+ Add Sequence</button>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--gray-500)', margin: '2px 0 16px' }}>
            Every document type in the platform numbers itself off a configurable sequence. Edit the prefix, the zero-padded width and the next number, then watch the live preview update.
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Document Type</th>
                <th>Prefix</th>
                <th>Year Token</th>
                <th>Next Number</th>
                <th>Digits</th>
                <th>Live Preview</th>
                <th style={{ width: '40px' }} />
              </tr>
            </thead>
            <tbody>
              {sequences.map((s, i) => (
                <tr key={i}>
                  <td className="font-semibold">
                    <input
                      className="filter-input"
                      style={{ width: '140px' }}
                      value={s.doc}
                      onChange={(e) => updateSequence(i, 'doc', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      className="filter-input"
                      style={{ width: '80px' }}
                      value={s.prefix}
                      onChange={(e) => updateSequence(i, 'prefix', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      className="filter-input"
                      style={{ width: '70px' }}
                      value={s.yearToken}
                      onChange={(e) => updateSequence(i, 'yearToken', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      className="filter-input"
                      type="number"
                      style={{ width: '90px' }}
                      value={s.next}
                      onChange={(e) => updateSequence(i, 'next', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      className="filter-input"
                      type="number"
                      style={{ width: '60px' }}
                      value={s.digits}
                      onChange={(e) => updateSequence(i, 'digits', e.target.value)}
                    />
                  </td>
                  <td>
                    <code style={{ fontWeight: 700, color: '#0d9488', fontSize: '13px' }}>
                      {sequencePreview(s)}
                    </code>
                  </td>
                  <td>
                    <button
                      className="btn btn-outline btn-sm"
                      title="Remove sequence"
                      onClick={() => removeSequence(i)}
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 6: GL MAPPING RULES */}
      {activeTab === 'glmapping' && (
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-ink)' }}>Business Event &rarr; Posting Rules</span>
            <button className="btn btn-primary btn-sm" onClick={addGlRule}>+ Add Rule</button>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--gray-500)', margin: '2px 0 16px' }}>
            The Accounting Engine never lets a module post to the GL directly. Every business event is routed through an automated posting rule; edit any rule to change how it books.
          </div>

          <div style={{ border: '1px solid var(--gray-200)', borderRadius: '8px', overflow: 'hidden', background: '#fff' }}>
            <div className="v-config-row head" style={{ gridTemplateColumns: '1.8fr 2.5fr 110px' }}>
              <div>Business Event Trigger</div>
              <div>GL Accounting Rule / Posting Impact</div>
              <div style={{ textAlign: 'right' }}>Actions</div>
            </div>
            {glRules.map((r, i) => {
              if (glEditingIndex === i) {
                return (
                  <div key={i} className="v-config-row" style={{ gridTemplateColumns: '1.8fr 2.5fr 110px', background: '#fff7ed', borderLeft: '3px solid #f97316' }}>
                    <div>
                      <input
                        className="filter-input"
                        style={{ width: '100%', fontWeight: 600 }}
                        value={editEvent}
                        onChange={(e) => setEditEvent(e.target.value)}
                      />
                    </div>
                    <div>
                      <input
                        className="filter-input"
                        style={{ width: '100%', fontFamily: 'monospace', fontSize: '12px' }}
                        value={editPosting}
                        onChange={(e) => setEditPosting(e.target.value)}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <button className="btn btn-primary btn-sm" onClick={() => saveGlRule(i)}>Save</button>
                      <button className="btn btn-outline btn-sm" onClick={() => setGlEditingIndex(null)}>Cancel</button>
                    </div>
                  </div>
                );
              }
              return (
                <div key={i} className="v-config-row" style={{ gridTemplateColumns: '1.8fr 2.5fr 110px' }}>
                  <div>
                    <span className="badge badge-blue" style={{ fontSize: '10px', fontWeight: 700, marginRight: '8px', textTransform: 'uppercase' }}>
                      TRIGGER
                    </span>
                    <strong>{r.event}</strong>
                  </div>
                  <div>
                    <code style={{ fontFamily: 'monospace', fontSize: '12px', color: '#0f766e', background: '#f0fdfa', padding: '4px 10px', borderRadius: '4px', border: '1px solid #ccfbf1', fontWeight: 600, display: 'inline-block' }}>
                      &rarr; {r.posting}
                    </code>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                    <button className="btn btn-outline btn-sm" onClick={() => startEditGl(i)}>Edit</button>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ color: '#d32f2f', padding: '4px 8px' }}
                      title="Remove rule"
                      onClick={() => removeGlRule(i)}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 7: FISCAL YEAR & NOTIFICATIONS */}
      {activeTab === 'fiscal' && (
        <div>
          {/* Fiscal Calendar Controls */}
          <div className="card" style={{ padding: '20px', marginBottom: '16px' }}>
            <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-ink)', marginBottom: '4px' }}>Fiscal Year</div>
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginTop: '14px' }}>
              <div>
                <label className="filter-bar-label" style={{ display: 'block', marginBottom: '6px' }}>Fiscal Year Start Month</label>
                <select
                  className="filter-select"
                  value={fiscalStart}
                  onChange={(e) => { setFiscalStart(e.target.value); showToast(`Fiscal year now starts in ${e.target.value}`, 'success'); }}
                  style={{ minWidth: '180px' }}
                >
                  {MONTHS.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="filter-bar-label" style={{ display: 'block', marginBottom: '6px' }}>Fiscal Periods</label>
                <select
                  className="filter-select"
                  value={fiscalPeriods}
                  onChange={(e) => { setFiscalPeriods(e.target.value); showToast(`Fiscal calendar set to ${e.target.value} periods`, 'success'); }}
                  style={{ minWidth: '220px' }}
                >
                  <option value="12">12 periods (calendar months)</option>
                  <option value="13">13 periods (4-4-5 / retail calendar)</option>
                </select>
              </div>
            </div>

            <div className="v-lock-note" style={{ marginTop: '14px' }}>
              Changing these settings above only affects new fiscal periods.{' '}
              <button
                className="btn btn-outline btn-sm"
                onClick={() => showToast('Fiscal periods regenerated from current settings', 'success')}
                style={{ marginLeft: '6px' }}
              >
                Regenerate periods from current settings
              </button>
            </div>
          </div>

          {/* Fiscal Periods Table */}
          <div className="table-wrap" style={{ marginBottom: '16px' }}>
            <div className="table-head-row">
              <div className="table-head-title">
                Fiscal Periods <span className="v-badge-config" style={{ marginLeft: '8px' }}>Journal Entry checks this before posting</span>
              </div>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Status</th>
                  <th style={{ width: '100px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {periodsList.map((p) => (
                  <tr key={p.label}>
                    <td className="font-semibold">{p.label}</td>
                    <td>
                      <span className={`badge ${p.status === 'open' ? 'badge-green' : p.status === 'closed' ? 'badge-gray' : 'badge-blue'}`}>
                        {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => togglePeriodStatus(p.label)}
                      >
                        {p.status === 'closed' ? 'Reopen' : 'Close'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Notification Engine */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-ink)', marginBottom: '4px' }}>Notification Engine</div>
            <div style={{ fontSize: '12px', color: 'var(--gray-500)', margin: '2px 0 16px' }}>
              Configure which channel fires for each system notification rule.
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th>Notification Rule</th>
                  <th>Trigger Condition</th>
                  <th style={{ textAlign: 'center' }}>Email</th>
                  <th style={{ textAlign: 'center' }}>In-App</th>
                  <th style={{ textAlign: 'center' }}>SMS</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((n, i) => (
                  <tr key={i}>
                    <td className="font-semibold">{n.rule}</td>
                    <td style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{n.trigger}</td>
                    <td style={{ textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={n.channels.email}
                        onChange={() => toggleNotifChannel(i, 'email')}
                        style={{ accentColor: 'var(--navy, #0d1b4b)', cursor: 'pointer' }}
                      />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={n.channels.inapp}
                        onChange={() => toggleNotifChannel(i, 'inapp')}
                        style={{ accentColor: 'var(--navy, #0d1b4b)', cursor: 'pointer' }}
                      />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={n.channels.sms}
                        onChange={() => toggleNotifChannel(i, 'sms')}
                        style={{ accentColor: 'var(--navy, #0d1b4b)', cursor: 'pointer' }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
