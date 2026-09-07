import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConfig } from '../../context/ConfigContext';
import { useAuth } from '../../context/AuthContext';
import { BUSINESS_TYPES, MODULE_CATALOG } from '../../data/navigation';
import {
  goalsForBusinessType,
  dimensionsForBusinessType,
  coaTemplateOptions,
  suggestCoaTemplate,
  recommendConfigFromGoals,
  CORE_MODULE_IDS
} from '../../data/onboardingData';

const OB_STEPS = ['You', 'Business', 'Goals', 'Setup', 'Done'];

const ROLE_TITLE_OPTIONS = [
  { value: 'owner', label: 'Owner / Founder' },
  { value: 'cfo', label: 'CFO / Finance Lead' },
  { value: 'controller', label: 'Controller' },
  { value: 'accountant', label: 'Accountant / Bookkeeper' },
  { value: 'admin', label: 'IT / System Administrator' },
  { value: 'other', label: 'Something else' }
];

function guessRoleId(currentUser) {
  const r = (currentUser?.role || '').toLowerCase();
  if (['owner', 'cfo', 'controller', 'accountant', 'admin'].includes(r)) return r;
  return 'other';
}

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { updateTenantConfig } = useConfig();
  const { currentUser } = useAuth();

  const [step, setStep] = useState(1);
  const [toast, setToast] = useState(null);

  // Step 1 — About you
  const [ownerName, setOwnerName] = useState(currentUser?.name || '');
  const [ownerRoleId, setOwnerRoleId] = useState(guessRoleId(currentUser));
  const [ownerRoleOther, setOwnerRoleOther] = useState(currentUser?.roleLabel || '');

  // Step 2 — The business
  const [companyName, setCompanyName] = useState(currentUser?.entityName || '');
  const [businessLabel, setBusinessLabel] = useState(currentUser?.businessLabel || '');
  const [businessType, setBusinessType] = useState(currentUser?.businessType || 'mga');

  // Step 3 — Goals
  const [goalIds, setGoalIds] = useState(['track-money', 'invoice']);

  // Step 4 — Recommended setup (recomputed fresh each time step 4 is entered)
  const [coaTemplate, setCoaTemplate] = useState(() => suggestCoaTemplate(businessType));
  const [enabledModules, setEnabledModules] = useState({});
  const [enabledDimensions, setEnabledDimensions] = useState({});

  const recomputeStep4 = () => {
    setCoaTemplate(suggestCoaTemplate(businessType));
    const rec = recommendConfigFromGoals(businessType, goalIds);
    setEnabledModules(rec.enabledModules);
    setEnabledDimensions(rec.enabledDimensions);
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const goals = goalsForBusinessType(businessType);
  const enabledDimIds = Object.keys(enabledDimensions).filter(id => enabledDimensions[id]);
  const dims = dimensionsForBusinessType(businessType).filter(d => enabledDimIds.includes(d.id));

  const toggleGoal = (id) => {
    setGoalIds(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]);
  };

  const toggleAllGoals = () => {
    const allIds = goals.map(g => g.id);
    const allSelected = allIds.every(id => goalIds.includes(id));
    setGoalIds(prev => allSelected ? prev.filter(id => !allIds.includes(id)) : [...new Set([...prev, ...allIds])]);
  };

  const allGoalsSelected = goals.length > 0 && goals.every(g => goalIds.includes(g.id));

  const ownerRoleTitle = () => {
    if (ownerRoleId === 'other') return ownerRoleOther.trim();
    return ROLE_TITLE_OPTIONS.find(r => r.value === ownerRoleId)?.label || 'Business Owner';
  };

  const validateStep = () => {
    if (step === 1) {
      if (!ownerName.trim()) { showToast('Enter your name to continue'); return false; }
    }
    if (step === 2) {
      if (!companyName.trim()) { showToast('Enter your business name'); return false; }
      if (!businessLabel.trim()) { showToast('Describe your business in a few words'); return false; }
      if (!businessType) { showToast('Pick the closest category'); return false; }
    }
    return true;
  };

  const applyOnboarding = (stage) => {
    updateTenantConfig({
      onboarded: true,
      v_setup_complete: true,
      ownerName: ownerName.trim(),
      ownerRoleTitle: ownerRoleTitle(),
      ownerRoleId,
      companyName: companyName.trim(),
      businessLabel: businessLabel.trim(),
      businessType,
      coaTemplate,
      enabledModules,
      enabledDimensions,
      setupStage: stage || 'done'
    });
  };

  const obNext = () => {
    if (!validateStep()) return;
    if (step === 5) {
      applyOnboarding('done');
      showToast(`Workspace ready. Let's finish setting up, ${ownerName || ''}.`);
      setTimeout(() => navigate('/'), 700);
      return;
    }
    if (step === 3) recomputeStep4();
    setStep(s => s + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const obBack = () => {
    if (step === 1) return;
    if (step === 5) recomputeStep4();
    setStep(s => s - 1);
  };

  const finishWithDestination = (dest) => {
    if (!validateStep()) return;
    applyOnboarding('config');
    showToast('Redirecting to your setup workspace...');
    setTimeout(() => {
      if (dest === 'config-center') navigate('/admin-config');
      else if (dest === 'setup-wizard') navigate('/setup-wizard');
    }, 700);
  };

  const enabledModuleCount = Object.values(enabledModules).filter(Boolean).length;

  return (
    <div style={{ background: 'var(--color-surface)', minHeight: '100vh', paddingTop: '40px' }}>
      {toast && (
        <div className="veridex-toast veridex-toast-info">
          <span>ⓘ</span>
          <span>{toast}</span>
        </div>
      )}

      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="obVdGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F97316" />
                <stop offset="100%" stopColor="#F59E0B" />
              </linearGradient>
            </defs>
            <rect width="32" height="32" rx="6" fill="#22262E" />
            <path d="M7 10L13 22L17 14" stroke="url(#obVdGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M17 10H21C23.76 10 26 12.24 26 15C26 17.76 23.76 20 21 20H17V10Z" stroke="url(#obVdGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div style={{ display: 'flex', alignItems: 'baseline', lineHeight: 1 }}>
            <span style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-ink)', letterSpacing: '-0.3px' }}>Veri</span>
            <span style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-brand)', letterSpacing: '-0.3px' }}>Dex</span>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-muted)', marginLeft: '10px', letterSpacing: '1px', textTransform: 'uppercase' }}>
              Setup Workspace
            </span>
          </div>
        </div>

        <div className="v-wizard-steps">
          {OB_STEPS.map((label, i) => {
            const n = i + 1;
            const cls = n < step ? 'done' : n === step ? 'active' : '';
            return (
              <div key={label} className={`v-wizard-step ${cls}`}>
                <div className="v-wizard-dot">{n < step ? '✓' : n}</div>
                <div className="v-wizard-label">{label}</div>
              </div>
            );
          })}
        </div>

        <div className="form-card" style={{ padding: '26px 28px' }}>

          {/* Step 1: About you */}
          {step === 1 && (
            <section>
              <div className="ob-step-title">Welcome. Let's set this up for you.</div>
              <div className="ob-step-sub">Two minutes of questions, and we'll build a workspace around your business, not a generic template.</div>
              <div className="form-grid-2" style={{ marginTop: '18px' }}>
                <div>
                  <label className="field-label">Your full name *</label>
                  <input className="field-input" type="text" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="e.g. Maria Chen" />
                </div>
                <div>
                  <label className="field-label">Your role at the business *</label>
                  <select className="field-input" value={ownerRoleId} onChange={(e) => setOwnerRoleId(e.target.value)}>
                    {ROLE_TITLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
              </div>
              {ownerRoleId === 'other' && (
                <div style={{ marginTop: '14px' }}>
                  <label className="field-label">What's your title?</label>
                  <input className="field-input" type="text" value={ownerRoleOther} onChange={(e) => setOwnerRoleOther(e.target.value)} placeholder="e.g. Head Baker & Co-Owner" />
                </div>
              )}
            </section>
          )}

          {/* Step 2: About the business */}
          {step === 2 && (
            <section>
              <div className="ob-step-title">Tell us about your business.</div>
              <div className="ob-step-sub">Pick the closest fit, then describe it in your own words. The category decides which accounting rules apply behind the scenes; your description is what you'll actually see on screen.</div>
              <div style={{ marginTop: '18px' }}>
                <label className="field-label">Business / company name *</label>
                <input className="field-input" type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="e.g. Rossi's Pizza Base Co." />
              </div>
              <div style={{ marginTop: '16px' }}>
                <label className="field-label">Describe your business in a few words *</label>
                <input className="field-input" type="text" value={businessLabel} onChange={(e) => setBusinessLabel(e.target.value)} placeholder="e.g. Pizza base manufacturer, family bakery, regional trucking MGA..." />
              </div>
              <div style={{ marginTop: '18px' }}>
                <label className="field-label">Which category is closest? *</label>
                <div className="v-role-grid" style={{ marginTop: '8px' }}>
                  {BUSINESS_TYPES.map(bt => (
                    <div
                      key={bt.id}
                      className={`v-role-card ob-type-card ${businessType === bt.id ? 'ob-selected' : ''}`}
                      onClick={() => setBusinessType(bt.id)}
                    >
                      <div className="v-role-card-icon" style={{ background: 'var(--color-surface)' }}>{bt.icon}</div>
                      <h4>{bt.label}</h4>
                      <p>{bt.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Step 3: Goals */}
          {step === 3 && (
            <section>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <div className="ob-step-title">What do you need to manage?</div>
                  <div className="ob-step-sub" style={{ marginTop: '4px', marginBottom: 0 }}>Check everything that applies. We'll turn on exactly those modules, nothing more, and you can change this anytime later.</div>
                </div>
                <button type="button" className="btn btn-outline btn-sm" onClick={toggleAllGoals} style={{ flexShrink: 0 }}>
                  {allGoalsSelected ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="v-role-grid">
                {goals.map(g => (
                  <div
                    key={g.id}
                    className={`v-role-card ob-goal-card ${goalIds.includes(g.id) ? 'ob-selected' : ''}`}
                    onClick={() => toggleGoal(g.id)}
                  >
                    <div className="v-role-card-icon" style={{ background: 'var(--color-surface)', fontSize: '20px' }}>{g.icon}</div>
                    <h4>{g.label}</h4>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Step 4: Recommended setup */}
          {step === 4 && (
            <section>
              <div className="ob-step-title">Here's what we've set up for <span>{businessLabel || companyName || 'your business'}</span>.</div>
              <div className="ob-step-sub">Every one of these is a real setting, not a preview. Flip anything off or on right now, or come back later in Admin Configuration Centre.</div>

              <div style={{ margin: '18px 0 8px', fontSize: '12.5px', fontWeight: 800, color: 'var(--color-ink-secondary)' }}>Chart of Accounts template</div>
              <select className="field-input" value={coaTemplate} onChange={(e) => setCoaTemplate(e.target.value)}>
                {coaTemplateOptions(businessType).map(t => (
                  <option key={t.id} value={t.id}>{t.label} ({t.accounts} accounts)</option>
                ))}
              </select>

              <div style={{ margin: '20px 0 8px', fontSize: '12.5px', fontWeight: 800, color: 'var(--color-ink-secondary)' }}>Modules turned on for you</div>
              <div className="v-module-grid">
                {MODULE_CATALOG.filter(m => enabledModules[m.id]).map(m => {
                  const isCore = CORE_MODULE_IDS.includes(m.id);
                  return (
                    <div className="v-module-card" key={m.id}>
                      <div className="v-module-card-top">
                        <div className="v-module-card-icon">{m.no}</div>
                        <label className="v-switch">
                          <input
                            type="checkbox"
                            checked={!!enabledModules[m.id]}
                            disabled={isCore}
                            onChange={(e) => setEnabledModules(prev => ({ ...prev, [m.id]: e.target.checked }))}
                          />
                          <span className="v-slider"></span>
                        </label>
                      </div>
                      <div className="v-module-card-title">{m.label}</div>
                      <div className="v-module-card-desc">{m.desc}</div>
                      <span className="v-badge-config">{isCore ? 'always on' : 'because you told us'}</span>
                    </div>
                  );
                })}
              </div>

              <div style={{ margin: '20px 0 8px', fontSize: '12.5px', fontWeight: 800, color: 'var(--color-ink-secondary)' }}>Dimensions you can tag on every transaction</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {dims.length ? dims.map(d => (
                  <label key={d.id} className="v-badge-config" style={{ cursor: 'pointer', padding: '6px 12px', fontSize: '12px' }}>
                    <input
                      type="checkbox"
                      checked={!!enabledDimensions[d.id]}
                      style={{ marginRight: '6px', verticalAlign: 'middle' }}
                      onChange={(e) => setEnabledDimensions(prev => ({ ...prev, [d.id]: e.target.checked }))}
                    />
                    {d.label}
                  </label>
                )) : (
                  <span style={{ fontSize: '12px', color: 'var(--color-muted)' }}>None yet, add these later in Admin Configuration Centre.</span>
                )}
              </div>
            </section>
          )}

          {/* Step 5: Done */}
          {step === 5 && (
            <section>
              <div className="ob-step-title">You're all set, {ownerName}.</div>
              <div className="ob-step-sub">
                {(companyName || 'Your business')} is configured as a {businessLabel || BUSINESS_TYPES.find(b => b.id === businessType)?.label}, with {enabledModuleCount} module(s) turned on.
              </div>

              <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="ob-choice-card" onClick={() => finishWithDestination('config-center')} style={{ borderRadius: '12px', padding: '20px' }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚙️</div>
                  <div style={{ fontWeight: 700, fontSize: '14.5px', color: 'var(--color-ink)', marginBottom: '6px' }}>Configuration Centre</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-ink-secondary)', lineHeight: 1.45 }}>Refine activated modules, custom dimensions, statutory reports, and core database fields.</div>
                </div>

                <div className="ob-choice-card" onClick={() => finishWithDestination('setup-wizard')} style={{ borderRadius: '12px', padding: '20px' }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>🧙‍♂️</div>
                  <div style={{ fontWeight: 700, fontSize: '14.5px', color: 'var(--color-ink)', marginBottom: '6px' }}>Self-Service Setup Wizard</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-ink-secondary)', lineHeight: 1.45 }}>Start a guided 10-stage checklist to configure tax regimes, security roles, and workflows.</div>
                </div>
              </div>

              <div className="v-lock-note" style={{ marginTop: '20px' }}>
                Nothing here is locked in. Add or remove modules and dimensions anytime from Admin Configuration Centre, or add another business/entity later if you ever need one.
              </div>
            </section>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '28px', paddingTop: '18px', borderTop: '1px solid var(--color-border)' }}>
            <button type="button" className="btn btn-ghost" style={{ visibility: step === 1 ? 'hidden' : 'visible' }} onClick={obBack}>&larr; Back</button>
            <button type="button" className="btn btn-primary" onClick={obNext}>{step === 5 ? 'Go to my dashboard →' : 'Continue →'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
