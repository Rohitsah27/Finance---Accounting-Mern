import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useConfig } from '../../context/ConfigContext';
import {
  BUSINESS_TYPES,
  ROLE_CATALOG,
  MODULE_CATALOG,
  COA_TEMPLATES,
  coaTemplatesForBusinessType,
  modulesForBusinessType,
  rolesForBusinessType
} from '../../data/navigation';
import './setup-wizard.css';

export default function SetupWizardPage() {
  const navigate = useNavigate();
  const { tenantConfig, updateTenantConfig } = useConfig();
  const [currentStep, setCurrentStep] = useState(0);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const WIZARD_STEPS = [
    'Company', 'Business Type', 'Accounting', 'Tax', 'Masters',
    'Documents', 'Security', 'Workflows', 'Integrations', 'Go Live'
  ];

  /* Step 1: Company */
  const [companyName, setCompanyName] = useState(tenantConfig?.companyName || 'Southlake Insurance Co.');
  const [legalEntity, setLegalEntity] = useState('Southlake Risk Carriers Ltd LLC');
  const [address, setAddress] = useState('800 Brazos Street, Suite 400, Austin, TX 78701');

  /* Step 2: Business Type */
  const [selectedBusinessType, setSelectedBusinessType] = useState(tenantConfig?.businessType || 'carrier');

  /* Step 3: Accounting */
  const activeCoaTemplates = selectedBusinessType ? coaTemplatesForBusinessType(selectedBusinessType) : COA_TEMPLATES;
  const coaList = activeCoaTemplates.length ? activeCoaTemplates : COA_TEMPLATES;
  const [coaTemplate, setCoaTemplate] = useState(coaList[0]?.id || 'insurance-carrier');
  const [fiscalStart, setFiscalStart] = useState('January');

  // When business type changes, auto-select a compatible COA template
  useEffect(() => {
    const valid = coaTemplatesForBusinessType(selectedBusinessType);
    if (valid.length && !valid.some(t => t.id === coaTemplate)) {
      setCoaTemplate(valid[0].id);
    }
  }, [selectedBusinessType]);

  /* Step 4: Tax Regimes */
  const [taxRegimes, setTaxRegimes] = useState({
    sales: true,
    premium: true,
    payroll: true,
    filing1099: true
  });

  const toggleTaxRegime = (key, val) => {
    setTaxRegimes(prev => ({ ...prev, [key]: val }));
    showToast(`${key.toUpperCase()} tax regime ${val ? 'enabled' : 'disabled'}`, 'info');
  };

  /* Step 5: Masters with localStorage sync */
  const DEFAULT_MASTERS = {
    Vendors: [
      { id: 'V-01', name: 'EY Audit & Advisory Services', taxId: '74-1294821', terms: 'Net 30', is1099: true },
      { id: 'V-02', name: 'Amazon Web Services Inc.', taxId: '91-1827461', terms: 'Net 15', is1099: false }
    ],
    'Customer / Insured': [
      { id: 'C-01', name: 'Apex Logistics LLC', type: 'Insured', limit: 50000 },
      { id: 'C-02', name: 'Lone Star Freight Corp', type: 'Insured', limit: 75000 }
    ],
    Brokers: [
      { id: 'B-01', name: 'Links Commercial Agency', license: 'TX-BRK-99201', commPct: 15.0 },
      { id: 'B-02', name: 'Austin Metro Producers', license: 'TX-BRK-44182', commPct: 12.5 }
    ],
    Carriers: [
      { id: 'CR-01', name: 'Southlake Insurance Co.', naic: 'NAIC-29481', treaty: 'QS-2026-01' },
      { id: 'CR-02', name: 'Starlight Re', naic: 'NAIC-90214', treaty: 'XL-2026-02' }
    ],
    Employees: [
      { id: 'E-01', name: 'John Doe', role: 'Financial Controller', email: 'controller@veridex.com' },
      { id: 'E-02', name: 'Jane Smith', role: 'Staff Accountant', email: 'accountant@veridex.com' }
    ]
  };

  const getStorageKey = (category) => {
    switch (category) {
      case 'Vendors': return 'v_master_vendors';
      case 'Customer / Insured': return 'v_master_customers';
      case 'Brokers': return 'v_master_brokers';
      case 'Carriers': return 'v_master_carriers';
      case 'Employees': return 'v_master_employees';
      default: return 'v_master_' + category.toLowerCase().replace(/[^a-z0-9]/g, '_');
    }
  };

  const [masters, setMasters] = useState(() => {
    const initial = {};
    Object.keys(DEFAULT_MASTERS).forEach(cat => {
      const key = getStorageKey(cat);
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          initial[cat] = JSON.parse(saved);
        } catch (e) {
          initial[cat] = DEFAULT_MASTERS[cat];
        }
      } else {
        initial[cat] = DEFAULT_MASTERS[cat];
        localStorage.setItem(key, JSON.stringify(DEFAULT_MASTERS[cat]));
      }
    });
    return initial;
  });

  // Modal state for manual add
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('Vendors');
  const [manualForm, setManualForm] = useState({
    name: '',
    taxId: '',
    terms: 'Net 30',
    is1099: true,
    custType: 'Insured',
    limit: 50000,
    license: '',
    commPct: 15.0,
    naic: '',
    treaty: '',
    role: '',
    email: ''
  });

  const openAddModal = (type) => {
    setModalType(type);
    setManualForm({
      name: '',
      taxId: '',
      terms: 'Net 30',
      is1099: true,
      custType: 'Insured',
      limit: 50000,
      license: '',
      commPct: 15.0,
      naic: '',
      treaty: '',
      role: '',
      email: ''
    });
    setIsModalOpen(true);
  };

  const handleManualAddSubmit = () => {
    if (!manualForm.name.trim()) {
      showToast('Name is required', 'error');
      return;
    }
    const newItem = {
      id: 'MST-' + Date.now(),
      name: manualForm.name.trim(),
      ...manualForm
    };
    const updated = [...(masters[modalType] || []), newItem];
    setMasters(prev => ({ ...prev, [modalType]: updated }));
    localStorage.setItem(getStorageKey(modalType), JSON.stringify(updated));
    setIsModalOpen(false);
    showToast(`Added "${newItem.name}" to ${modalType}`, 'success');
  };

  const deleteMasterItem = (type, itemId) => {
    const updated = (masters[type] || []).filter(item => item.id !== itemId);
    setMasters(prev => ({ ...prev, [type]: updated }));
    localStorage.setItem(getStorageKey(type), JSON.stringify(updated));
    showToast('Item deleted from master records', 'info');
  };

  /* Step 7: Security */
  const activeRoles = selectedBusinessType ? rolesForBusinessType(selectedBusinessType) : ROLE_CATALOG;
  const roleList = activeRoles.length ? activeRoles : ROLE_CATALOG;
  const [selectedRoles, setSelectedRoles] = useState(['owner', 'cfo', 'controller', 'accountant', 'carrier-controller']);
  const [mfa, setMfa] = useState(true);

  const toggleRole = (rId) => {
    if (selectedRoles.includes(rId)) {
      setSelectedRoles(selectedRoles.filter(r => r !== rId));
    } else {
      setSelectedRoles([...selectedRoles, rId]);
    }
  };

  /* Step 8: Workflows */
  const [jeThreshold, setJeThreshold] = useState(50000);
  const [jeApprover, setJeApprover] = useState('CFO');
  const [billThreshold, setBillThreshold] = useState(10000);
  const [billApprover, setBillApprover] = useState('Controller');
  const [cessionThreshold, setCessionThreshold] = useState(250000);
  const [cessionApprover, setCessionApprover] = useState('CFO');

  /* Step 9: Integrations */
  const [connectedIntegrations, setConnectedIntegrations] = useState(['QuickBooks Import', 'Bank Feed / Open Banking']);
  const toggleConnect = (name) => {
    if (connectedIntegrations.includes(name)) {
      setConnectedIntegrations(connectedIntegrations.filter(i => i !== name));
      showToast(`${name} disconnected`, 'info');
    } else {
      setConnectedIntegrations([...connectedIntegrations, name]);
      showToast(`${name} connected (sandbox live)`, 'success');
    }
  };

  /* Step 10: Go Live */
  const [isPublished, setIsPublished] = useState(false);

  const handlePublish = () => {
    updateTenantConfig({
      companyName,
      businessType: selectedBusinessType,
      v_setup_complete: true,
      setupStage: 'done',
      configStatus: 'Published'
    });
    setIsPublished(true);
    showToast('Configuration published to production live!', 'success');
  };

  const handleNext = () => {
    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handlePublish();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  // Calculation for business type summary info
  const activeBtObj = BUSINESS_TYPES.find(b => b.id === selectedBusinessType);
  const enabledModules = modulesForBusinessType(selectedBusinessType);
  const hiddenModules = MODULE_CATALOG.filter(m => !enabledModules.some(em => em.id === m.id));

  return (
    <div className="page-container">
      {toast && (
        <div className={`veridex-toast veridex-toast-${toast.type}`}>
          <span>{toast.type === 'error' ? '✕' : '✓'}</span>
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '16px' }}>
        <div>
          <div className="page-title">Self-Service Setup Wizard</div>
          <div className="page-subtitle">
            Ten stages, no consultant required. Every step below writes straight into the same configuration engine that powers the Configuration Centre.
          </div>
        </div>
        <div className="page-actions">
          <Link to="/admin-config" className="btn btn-outline btn-sm">
            &larr; Return to Configuration Centre
          </Link>
        </div>
      </div>

      {/* Main Wizard Form Card */}
      <div className="wizard-card">
        {/* Stepper Wizard Indicator */}
        <div className="v-wizard-steps">
          {WIZARD_STEPS.map((s, idx) => {
            const isDone = idx < currentStep;
            const isActive = idx === currentStep;
            return (
              <div
                key={s}
                className={`v-wizard-step ${isDone ? 'done' : isActive ? 'active' : ''}`}
                onClick={() => setCurrentStep(idx)}
              >
                <div className="v-wizard-dot">{isDone ? '✓' : idx + 1}</div>
                <div className="v-wizard-label">{s}</div>
              </div>
            );
          })}
        </div>

        {/* STEP 0: COMPANY */}
        {currentStep === 0 && (
          <div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-ink, #0f172a)', marginBottom: '14px' }}>
              Company Details
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', maxWidth: '720px' }}>
              <div>
                <label className="field-label">Company Brand Name *</label>
                <input
                  className="filter-input"
                  style={{ width: '100%' }}
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Southlake Insurance Co."
                />
              </div>
              <div>
                <label className="field-label">Legal Entity Name</label>
                <input
                  className="filter-input"
                  style={{ width: '100%' }}
                  value={legalEntity}
                  onChange={(e) => setLegalEntity(e.target.value)}
                  placeholder="e.g. Veridex Sandbox Co. LLC"
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="field-label">Registered Corporate Address</label>
                <input
                  className="filter-input"
                  style={{ width: '100%' }}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street, City, State, ZIP"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 1: BUSINESS TYPE */}
        {currentStep === 1 && (
          <div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-ink, #0f172a)', marginBottom: '4px' }}>
              What kind of business is this entity?
            </div>
            <p style={{ fontSize: '12px', color: 'var(--gray-500, #64748b)', margin: '0 0 16px 0' }}>
              Selecting your business model automatically provisions domain-specific subledgers, Chart of Accounts, and regulatory workflows.
            </p>

            <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--gray-400, #94a3b8)', margin: '14px 0 8px' }}>
              Insurance Chain
            </div>
            <div className="v-role-grid">
              {BUSINESS_TYPES.filter(b => b.group === 'insurance').map(b => (
                <div
                  key={b.id}
                  onClick={() => setSelectedBusinessType(b.id)}
                  className={`v-role-card ${selectedBusinessType === b.id ? 'selected' : ''}`}
                >
                  <div className="v-role-card-icon">{b.icon}</div>
                  <h4>{b.label}</h4>
                  <p>{b.desc}</p>
                </div>
              ))}
            </div>

            <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--gray-400, #94a3b8)', margin: '18px 0 8px' }}>
              General Business
            </div>
            <div className="v-role-grid">
              {BUSINESS_TYPES.filter(b => b.group === 'general').map(b => (
                <div
                  key={b.id}
                  onClick={() => setSelectedBusinessType(b.id)}
                  className={`v-role-card ${selectedBusinessType === b.id ? 'selected' : ''}`}
                >
                  <div className="v-role-card-icon">{b.icon}</div>
                  <h4>{b.label}</h4>
                  <p>{b.desc}</p>
                </div>
              ))}
            </div>

            {activeBtObj && (
              <div className="v-lock-note" style={{ marginTop: '18px' }}>
                <div>
                  <strong>{activeBtObj.label}</strong> auto-enables <strong>{enabledModules.length}</strong> of 25 platform modules
                  {hiddenModules.length > 0 && ` (hides ${hiddenModules.map(m => m.label).join(', ')})`}.<br />
                  Suggested COA templates: {activeCoaTemplates.length ? activeCoaTemplates.map(t => t.label).join(', ') : 'US GAAP Standard'}.
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: ACCOUNTING */}
        {currentStep === 2 && (
          <div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-ink, #0f172a)', marginBottom: '4px' }}>
              Chart of Accounts &amp; Fiscal Calendar
            </div>
            <p style={{ fontSize: '12px', color: 'var(--gray-500, #64748b)', margin: '0 0 16px 0' }}>
              Select a pre-built chart of accounts template suited to your selected entity type.
            </p>

            <div className="v-module-grid" style={{ marginBottom: '20px' }}>
              {coaList.map(t => (
                <div
                  key={t.id}
                  className="v-module-card"
                  onClick={() => setCoaTemplate(t.id)}
                  style={{
                    cursor: 'pointer',
                    borderColor: coaTemplate === t.id ? '#0d9488' : 'var(--gray-200, #e2e8f0)',
                    borderWidth: coaTemplate === t.id ? '2px' : '1px',
                    boxShadow: coaTemplate === t.id ? '0 0 0 1px #0d9488 inset' : 'none',
                    background: coaTemplate === t.id ? '#f0fdfa' : '#fff'
                  }}
                >
                  <div>
                    <div className="v-module-card-title">{t.label}</div>
                    <div className="v-module-card-desc">{t.accounts} pre-configured accounts</div>
                  </div>
                  {coaTemplate === t.id && (
                    <div style={{ marginTop: '10px' }}>
                      <span className="badge badge-green" style={{ fontSize: '10px' }}>Active Template</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '20px' }}>
              <div>
                <label className="field-label" style={{ display: 'block', marginBottom: '6px' }}>Fiscal Year Start</label>
                <select
                  className="filter-select"
                  value={fiscalStart}
                  onChange={(e) => setFiscalStart(e.target.value)}
                  style={{ minWidth: '180px' }}
                >
                  {['January', 'April', 'July', 'October'].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-ink, #0f172a)', marginBottom: '8px' }}>
              Opening Balances (Optional)
            </div>
            <div
              className="v-map-dropzone"
              onClick={() => showToast('Opening trial balance dropzone ready. (.xlsx, .xls, .csv)', 'info')}
            >
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gray-700, #334155)' }}>
                Drag &amp; drop an opening trial balance, or click to browse
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--gray-400, #94a3b8)', marginTop: '4px' }}>
                Supports .xlsx, .xls or .csv formats
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: TAX REGIMES */}
        {currentStep === 3 && (
          <div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-ink, #0f172a)', marginBottom: '4px' }}>
              Tax Regimes &amp; Statutory Filings
            </div>
            <p style={{ fontSize: '12px', color: 'var(--gray-500, #64748b)', margin: '0 0 16px 0' }}>
              Activate the tax jurisdictions that apply to this operating entity.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '440px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--gray-700, #334155)' }}>
                <input
                  type="checkbox"
                  checked={taxRegimes.premium}
                  onChange={(e) => toggleTaxRegime('premium', e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#0d9488' }}
                />
                <strong>Insurance Premium Tax</strong> (Surplus lines 3-5% + stamping fees)
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--gray-700, #334155)' }}>
                <input
                  type="checkbox"
                  checked={taxRegimes.sales}
                  onChange={(e) => toggleTaxRegime('sales', e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#0d9488' }}
                />
                <strong>Commercial Sales &amp; Use Tax</strong> (State &amp; Municipal)
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--gray-700, #334155)' }}>
                <input
                  type="checkbox"
                  checked={taxRegimes.payroll}
                  onChange={(e) => toggleTaxRegime('payroll', e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#0d9488' }}
                />
                <strong>Payroll Taxes</strong> (FICA, FUTA, SUTA withholding)
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--gray-700, #334155)' }}>
                <input
                  type="checkbox"
                  checked={taxRegimes.filing1099}
                  onChange={(e) => toggleTaxRegime('filing1099', e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#0d9488' }}
                />
                <strong>1099 Filing</strong> (1099-NEC / 1099-MISC vendor reporting)
              </label>
            </div>
          </div>
        )}

        {/* STEP 4: MASTERS */}
        {currentStep === 4 && (
          <div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-ink, #0f172a)', marginBottom: '4px' }}>
              Load Your Master Records
            </div>
            <p style={{ fontSize: '12px', color: 'var(--gray-500, #64748b)', margin: '0 0 16px 0' }}>
              Add counterparty master records manually or bulk import using the Excel data mapping tool.
            </p>

            <div className="v-module-grid">
              {Object.keys(masters).map(category => {
                const list = masters[category] || [];
                return (
                  <div key={category} className="v-module-card" style={{ minHeight: '190px' }}>
                    <div>
                      <div className="v-module-card-title">{category}</div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#0d9488', marginTop: '4px' }}>
                        {list.length} item(s) on file
                      </div>
                      <div style={{ marginTop: '8px', maxHeight: '85px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {list.map(item => (
                          <div
                            key={item.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              fontSize: '11px',
                              background: '#f8fafc',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              border: '1px solid var(--gray-100, #f1f5f9)'
                            }}
                          >
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>
                              {item.name}
                            </span>
                            <span
                              style={{ cursor: 'pointer', color: '#dc2626', fontWeight: 800, fontSize: '14px', marginLeft: '6px' }}
                              onClick={() => deleteMasterItem(category, item.id)}
                              title="Delete Record"
                            >
                              &times;
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="v-module-card-meta" style={{ marginTop: '12px', display: 'flex', gap: '6px', width: '100%' }}>
                      <button
                        className="btn btn-outline btn-sm"
                        style={{ flex: 1, fontSize: '11px', padding: '5px 4px' }}
                        onClick={() => openAddModal(category)}
                      >
                        + Manually Add
                      </button>
                      <Link
                        to="/excel-onboarding"
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: '11px', padding: '5px 6px' }}
                      >
                        Excel &rarr;
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 5: DOCUMENTS */}
        {currentStep === 5 && (
          <div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-ink, #0f172a)', marginBottom: '4px' }}>
              Numbering &amp; Document Branding
            </div>
            <p style={{ fontSize: '12px', color: 'var(--gray-500, #64748b)', margin: '0 0 16px 0' }}>
              Standard system-generated reference prefixes and auto-incrementing token patterns.
            </p>

            <table className="data-table" style={{ maxWidth: '640px', marginBottom: '18px' }}>
              <thead>
                <tr>
                  <th>Document Type</th>
                  <th>Prefix Token</th>
                  <th>Sample Generated Number</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Customer Invoice</strong></td>
                  <td><code>INV-&#123;YYYY&#125;-</code></td>
                  <td><code style={{ color: '#0d9488', fontWeight: 700 }}>INV-2026-01043</code></td>
                </tr>
                <tr>
                  <td><strong>Journal Entry Voucher</strong></td>
                  <td><code>JE-&#123;YYYY&#125;-</code></td>
                  <td><code style={{ color: '#0d9488', fontWeight: 700 }}>JE-2026-008892</code></td>
                </tr>
                <tr>
                  <td><strong>Purchase Order</strong></td>
                  <td><code>PO-&#123;YYYY&#125;-</code></td>
                  <td><code style={{ color: '#0d9488', fontWeight: 700 }}>PO-00318</code></td>
                </tr>
              </tbody>
            </table>

            <div
              className="v-map-dropzone"
              style={{ maxWidth: '640px' }}
              onClick={() => showToast('Company logo & PDF header template uploaded', 'success')}
            >
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gray-700, #334155)' }}>
                Upload company logo &amp; document templates
              </div>
              <div style={{ fontSize: '11px', color: 'var(--gray-400, #94a3b8)', marginTop: '4px' }}>
                PNG, SVG or JPEG (Max 2MB)
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: SECURITY */}
        {currentStep === 6 && (
          <div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-ink, #0f172a)', marginBottom: '4px' }}>
              Roles &amp; Identity Security
            </div>
            <p style={{ fontSize: '12px', color: 'var(--gray-500, #64748b)', margin: '0 0 16px 0' }}>
              Enable which roles are eligible for user assignment in this tenant.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', maxWidth: '680px', marginBottom: '18px' }}>
              {roleList.map(r => (
                <label
                  key={r.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '12.5px',
                    color: 'var(--gray-700, #334155)',
                    padding: '8px 12px',
                    border: '1px solid var(--gray-200, #e2e8f0)',
                    borderRadius: '6px',
                    background: selectedRoles.includes(r.id) ? '#f0fdfa' : '#fff',
                    borderColor: selectedRoles.includes(r.id) ? '#0d9488' : 'var(--gray-200, #e2e8f0)',
                    cursor: 'pointer'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes(r.id)}
                    onChange={() => toggleRole(r.id)}
                    style={{ accentColor: '#0d9488' }}
                  />
                  <span>{r.label}</span>
                </label>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px' }}>
              <label className="v-switch">
                <input
                  type="checkbox"
                  checked={mfa}
                  onChange={(e) => setMfa(e.target.checked)}
                />
                <span className="v-slider" />
              </label>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gray-700, #334155)' }}>
                Require Multi-Factor Authentication (MFA) for all users
              </span>
            </div>
          </div>
        )}

        {/* STEP 7: WORKFLOWS */}
        {currentStep === 7 && (
          <div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-ink, #0f172a)', marginBottom: '4px' }}>
              Approval Thresholds
            </div>
            <p style={{ fontSize: '12px', color: 'var(--gray-500, #64748b)', margin: '0 0 16px 0' }}>
              Configure spending and booking authorization ceilings before postings commit to the general ledger.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '580px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                <span>Journal entries above $</span>
                <input
                  type="number"
                  className="filter-input"
                  style={{ width: '100px' }}
                  value={jeThreshold}
                  onChange={(e) => setJeThreshold(Number(e.target.value))}
                />
                <span>require</span>
                <select className="filter-select" value={jeApprover} onChange={(e) => setJeApprover(e.target.value)}>
                  <option>CFO</option>
                  <option>Controller</option>
                </select>
                <span>approval</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                <span>Vendor bills above $</span>
                <input
                  type="number"
                  className="filter-input"
                  style={{ width: '100px' }}
                  value={billThreshold}
                  onChange={(e) => setBillThreshold(Number(e.target.value))}
                />
                <span>require</span>
                <select className="filter-select" value={billApprover} onChange={(e) => setBillApprover(e.target.value)}>
                  <option>Controller</option>
                  <option>CFO</option>
                </select>
                <span>approval</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                <span>Reinsurance cessions above $</span>
                <input
                  type="number"
                  className="filter-input"
                  style={{ width: '100px' }}
                  value={cessionThreshold}
                  onChange={(e) => setCessionThreshold(Number(e.target.value))}
                />
                <span>require</span>
                <select className="filter-select" value={cessionApprover} onChange={(e) => setCessionApprover(e.target.value)}>
                  <option>CFO</option>
                </select>
                <span>approval</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 8: INTEGRATIONS */}
        {currentStep === 8 && (
          <div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-ink, #0f172a)', marginBottom: '4px' }}>
              Connect Integrations
            </div>
            <p style={{ fontSize: '12px', color: 'var(--gray-500, #64748b)', margin: '0 0 16px 0' }}>
              Connect third-party banking feeds, ERP systems, and notification channels.
            </p>

            <div className="v-module-grid">
              {['QuickBooks Import', 'Bank Feed / Open Banking', 'Payment Gateway', 'Slack / Email Notifications'].map(c => {
                const isConn = connectedIntegrations.includes(c);
                return (
                  <div key={c} className="v-module-card">
                    <div>
                      <div className="v-module-card-title">{c}</div>
                      <div className="v-module-card-desc">
                        {isConn ? 'Connected & ready for live synchronization.' : 'Ready for sandbox or production authorization.'}
                      </div>
                    </div>
                    <div className="v-module-card-meta" style={{ marginTop: '12px' }}>
                      <button
                        className={`btn btn-sm ${isConn ? 'btn-outline' : 'btn-primary'}`}
                        onClick={() => toggleConnect(c)}
                      >
                        {isConn ? 'Connected ✓' : 'Connect'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 9: GO LIVE */}
        {currentStep === 9 && (
          <div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-ink, #0f172a)', marginBottom: '4px' }}>
              Review &amp; Publish
            </div>
            <p style={{ fontSize: '12px', color: 'var(--gray-500, #64748b)', margin: '0 0 16px 0' }}>
              Review pre-flight validation checks before publishing this tenant configuration.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '640px', marginBottom: '20px' }}>
              {[
                { label: 'Company profile complete', pass: !!companyName },
                { label: 'Business type selected', pass: !!selectedBusinessType },
                { label: 'Default payment terms set', pass: false, blocking: true },
                { label: 'COA template applied', pass: !!coaTemplate },
                { label: 'At least one role assigned', pass: selectedRoles.length > 0 },
              ].map((chk, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '9px 14px',
                    border: '1px solid var(--gray-200, #e2e8f0)',
                    borderRadius: '8px',
                    background: '#fff'
                  }}
                >
                  <span style={{ fontSize: '12.5px', color: 'var(--gray-700, #334155)' }}>{chk.label}</span>
                  <span className={`badge ${chk.pass ? 'badge-green' : (chk.blocking ? 'badge-red' : 'badge-amber')}`}>
                    {chk.pass ? 'Pass' : (chk.blocking ? 'Blocking' : 'Warning')}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ fontSize: '11.5px', color: 'var(--gray-500, #64748b)', marginBottom: '16px' }}>
              Example of a real blocking rule: &ldquo;Default payment terms not set, required before invoicing can be enabled.&rdquo; Resolve blocking items in the Configuration Centre before go-live for a production tenant.
            </div>

            {!isPublished ? (
              <button className="btn btn-primary" onClick={handlePublish}>
                Publish Configuration
              </button>
            ) : (
              <div className="v-lock-note" style={{ background: '#ecfdf5', color: '#065f46', borderColor: '#a7f3d0' }}>
                ✓ Configuration v{tenantConfig?.configVersion || 2} is live.{' '}
                <Link to="/" style={{ fontWeight: 700, color: '#047857', marginLeft: '8px', textDecoration: 'underline' }}>
                  Go to Dashboard &rarr;
                </Link>
                <Link to="/workspaces" style={{ fontWeight: 700, color: '#047857', marginLeft: '12px', textDecoration: 'underline' }}>
                  Return to role select &rarr;
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Stepper Navigation Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px', borderTop: '1px solid var(--gray-100, #f1f5f9)', paddingTop: '16px' }}>
          <button
            className="btn btn-outline"
            style={{ visibility: currentStep === 0 ? 'hidden' : 'visible' }}
            onClick={handleBack}
          >
            &larr; Back
          </button>
          <button
            className="btn btn-primary"
            onClick={handleNext}
          >
            {currentStep === WIZARD_STEPS.length - 1 ? (isPublished ? 'Finish' : 'Publish & Finish') : 'Next &rarr;'}
          </button>
        </div>
      </div>

      {/* Manual Add Item Modal */}
      {isModalOpen && (
        <div className="v-modal-overlay">
          <div className="v-modal-card">
            <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-ink, #0f172a)', marginBottom: '16px' }}>
              Add New {modalType.replace('Customer / Insured', 'Customer / Insured')}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <div>
                <label className="field-label" style={{ display: 'block', marginBottom: '4px' }}>Name / Legal Title *</label>
                <input
                  className="filter-input"
                  style={{ width: '100%' }}
                  value={manualForm.name}
                  onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })}
                  placeholder={`e.g. Acme ${modalType}`}
                  autoFocus
                />
              </div>

              {modalType === 'Vendors' && (
                <>
                  <div>
                    <label className="field-label" style={{ display: 'block', marginBottom: '4px' }}>EIN / TIN (Tax ID) *</label>
                    <input
                      className="filter-input"
                      style={{ width: '100%' }}
                      value={manualForm.taxId}
                      onChange={(e) => setManualForm({ ...manualForm, taxId: e.target.value })}
                      placeholder="XX-XXXXXXX"
                    />
                  </div>
                  <div>
                    <label className="field-label" style={{ display: 'block', marginBottom: '4px' }}>Payment Terms</label>
                    <select
                      className="filter-select"
                      style={{ width: '100%' }}
                      value={manualForm.terms}
                      onChange={(e) => setManualForm({ ...manualForm, terms: e.target.value })}
                    >
                      <option>Net 30</option>
                      <option>Net 60</option>
                      <option>Net 15</option>
                      <option>Due on Receipt</option>
                    </select>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', marginTop: '4px' }}>
                    <input
                      type="checkbox"
                      checked={manualForm.is1099}
                      onChange={(e) => setManualForm({ ...manualForm, is1099: e.target.checked })}
                      style={{ accentColor: '#0d9488' }}
                    />
                    1099 Eligible
                  </label>
                </>
              )}

              {modalType === 'Customer / Insured' && (
                <>
                  <div>
                    <label className="field-label" style={{ display: 'block', marginBottom: '4px' }}>Customer Type</label>
                    <select
                      className="filter-select"
                      style={{ width: '100%' }}
                      value={manualForm.custType}
                      onChange={(e) => setManualForm({ ...manualForm, custType: e.target.value })}
                    >
                      <option>Insured</option>
                      <option>Individual</option>
                      <option>Business</option>
                      <option>Broker</option>
                      <option>MGA</option>
                      <option>Reinsurer</option>
                    </select>
                  </div>
                  <div>
                    <label className="field-label" style={{ display: 'block', marginBottom: '4px' }}>Credit Limit ($)</label>
                    <input
                      type="number"
                      className="filter-input"
                      style={{ width: '100%' }}
                      value={manualForm.limit}
                      onChange={(e) => setManualForm({ ...manualForm, limit: Number(e.target.value) })}
                    />
                  </div>
                </>
              )}

              {modalType === 'Brokers' && (
                <>
                  <div>
                    <label className="field-label" style={{ display: 'block', marginBottom: '4px' }}>License Number *</label>
                    <input
                      className="filter-input"
                      style={{ width: '100%' }}
                      value={manualForm.license}
                      onChange={(e) => setManualForm({ ...manualForm, license: e.target.value })}
                      placeholder="e.g. TX-BRK-99001"
                    />
                  </div>
                  <div>
                    <label className="field-label" style={{ display: 'block', marginBottom: '4px' }}>Commission Percentage (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="filter-input"
                      style={{ width: '100%' }}
                      value={manualForm.commPct}
                      onChange={(e) => setManualForm({ ...manualForm, commPct: Number(e.target.value) })}
                    />
                  </div>
                </>
              )}

              {modalType === 'Carriers' && (
                <>
                  <div>
                    <label className="field-label" style={{ display: 'block', marginBottom: '4px' }}>NAIC Code *</label>
                    <input
                      className="filter-input"
                      style={{ width: '100%' }}
                      value={manualForm.naic}
                      onChange={(e) => setManualForm({ ...manualForm, naic: e.target.value })}
                      placeholder="e.g. NAIC-29481"
                    />
                  </div>
                  <div>
                    <label className="field-label" style={{ display: 'block', marginBottom: '4px' }}>Treaty Agreement Reference</label>
                    <input
                      className="filter-input"
                      style={{ width: '100%' }}
                      value={manualForm.treaty}
                      onChange={(e) => setManualForm({ ...manualForm, treaty: e.target.value })}
                      placeholder="e.g. QQS-2026-01"
                    />
                  </div>
                </>
              )}

              {modalType === 'Employees' && (
                <>
                  <div>
                    <label className="field-label" style={{ display: 'block', marginBottom: '4px' }}>Role / Job Title *</label>
                    <input
                      className="filter-input"
                      style={{ width: '100%' }}
                      value={manualForm.role}
                      onChange={(e) => setManualForm({ ...manualForm, role: e.target.value })}
                      placeholder="e.g. Underwriter"
                    />
                  </div>
                  <div>
                    <label className="field-label" style={{ display: 'block', marginBottom: '4px' }}>Email Address *</label>
                    <input
                      type="email"
                      className="filter-input"
                      style={{ width: '100%' }}
                      value={manualForm.email}
                      onChange={(e) => setManualForm({ ...manualForm, email: e.target.value })}
                      placeholder="name@company.com"
                    />
                  </div>
                </>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="btn btn-outline btn-sm" onClick={() => setIsModalOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-primary btn-sm" onClick={handleManualAddSubmit}>
                Add Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
