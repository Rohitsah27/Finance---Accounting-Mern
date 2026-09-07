import { MODULE_CATALOG, COA_TEMPLATES, coaTemplatesForBusinessType, BUSINESS_TYPES } from './navigation';

/* Ported 1:1 from the legacy finance-and-accounting-main/js/config-engine.js
   ONBOARDING_GOALS + DIMENSION_LIBRARY, remapped onto this app's MODULE_CATALOG ids. */

export const DIMENSION_LIBRARY = [
  { id: 'class', label: 'Class', appliesTo: ['general'], desc: 'Free-form categorisation for a line of business, program, or fund — no posting impact.' },
  { id: 'location', label: 'Location / Department', appliesTo: ['general', 'insurance'], desc: 'Branch, store, plant, or department.' },
  { id: 'customer-job', label: 'Customer:Job', appliesTo: ['general'], desc: 'Sub-tracks a customer engagement or job for P&L by project.' },
  { id: 'cost-center', label: 'Cost Centre', appliesTo: ['general', 'insurance'], desc: 'Responsibility-centre tagging for budget ownership.' },
  { id: 'product-line', label: 'Product / SKU Line', appliesTo: ['general'], desc: 'Groups revenue/cost by product family.' },
  { id: 'broker', label: 'Broker / Producer', appliesTo: ['insurance'], desc: 'Retail Broker or Producer placing the policy.' },
  { id: 'mga', label: 'MGA', appliesTo: ['insurance'], desc: 'Managing General Agent the transaction is written through.' },
  { id: 'state', label: 'State / Jurisdiction', appliesTo: ['insurance', 'general'], desc: 'Statutory / premium-tax jurisdiction.' },
  { id: 'lob', label: 'Line of Business (LOB)', appliesTo: ['insurance'], desc: 'ASL / coverage code — e.g. General Liability, Property, Auto.' },
  { id: 'treaty', label: 'Treaty / Program', appliesTo: ['insurance'], desc: 'Reinsurance treaty or program the cession applies to.' },
  { id: 'carrier-dim', label: 'Carrier', appliesTo: ['insurance'], desc: 'Risk-bearing carrier on a fronted or MGA-written program.' },
  { id: 'reinsurer', label: 'Reinsurer', appliesTo: ['insurance'], desc: 'Reinsurer assuming the ceded share on this transaction.' }
];

export const ONBOARDING_GOALS = [
  { id: 'track-money', label: 'Track income & expenses', icon: '💰', modules: ['gl', 'ar', 'ap', 'bank'], dims: [] },
  { id: 'invoice', label: 'Invoice customers', icon: '🧾', modules: ['billing'], dims: ['customer-job'] },
  { id: 'inventory', label: 'Manage inventory or production', icon: '📦', modules: ['inventory'], dims: ['product-line', 'cost-center'] },
  { id: 'payroll', label: 'Run payroll', icon: '💵', modules: ['payroll'], dims: ['location'] },
  { id: 'assets', label: 'Track equipment or fixed assets', icon: '🏗️', modules: ['fixed-assets'], dims: [] },
  { id: 'projects', label: 'Bill by project or job', icon: '📋', modules: ['projects'], dims: ['customer-job'] },
  { id: 'commission', label: 'Pay commissions to agents/reps', icon: '🤝', modules: ['commission'], dims: ['cost-center'] },
  { id: 'multi-currency', label: 'Deal in more than one currency', icon: '🌐', modules: ['fx'], dims: [] },
  { id: 'multi-location', label: 'Operate multiple locations or departments', icon: '🏬', modules: [], dims: ['location', 'cost-center'] },
  { id: 'budget', label: 'Budget and forecast', icon: '📈', modules: ['budgeting'], dims: [] },
  { id: 'insurance-ops', label: 'Handle policies, premium, or claims', icon: '🛡️', modules: ['pas-policy', 'statutory-reports', 'mga-operations', 'reinsurance'], dims: ['mga', 'broker', 'state', 'lob'], insuranceOnly: true }
];

/* Modules that can never be switched off — the platform's non-negotiable core. */
export const CORE_MODULE_IDS = ['gl', 'ar', 'ap', 'bank', 'tax', 'reporting', 'workflow', 'admin-config', 'identity'];

/* Modules that only make sense for an insurance-side business (agency/broker/mga/carrier/reinsurer). */
export const INSURANCE_ONLY_MODULE_IDS = ['pas-policy', 'statutory-reports', 'mga-operations', 'reinsurance'];

export function getBusinessType(id) {
  return BUSINESS_TYPES.find(b => b.id === id) || BUSINESS_TYPES[BUSINESS_TYPES.length - 1];
}

export function goalsForBusinessType(businessTypeId) {
  const bt = getBusinessType(businessTypeId);
  return ONBOARDING_GOALS.filter(g => !g.insuranceOnly || bt.group === 'insurance');
}

export function dimensionsForBusinessType(businessTypeId) {
  const bt = getBusinessType(businessTypeId);
  return DIMENSION_LIBRARY.filter(d => d.appliesTo.includes(bt.group));
}

/* Suggest a COA template for a business type; falls back to the general standard
   template when the type has no dedicated template of its own. */
export function suggestCoaTemplate(businessTypeId) {
  const matches = coaTemplatesForBusinessType(businessTypeId);
  return (matches[0] || COA_TEMPLATES[0]).id;
}

export function coaTemplateOptions(businessTypeId) {
  const matches = coaTemplatesForBusinessType(businessTypeId);
  return matches.length ? matches : COA_TEMPLATES;
}

/* Build the module + dimension recommendation from the goals a user checked, always
   including every core module (core modules can't be turned off). */
export function recommendConfigFromGoals(businessTypeId, goalIds) {
  const bt = getBusinessType(businessTypeId);
  const enabledModules = {};
  MODULE_CATALOG.forEach(m => {
    if (INSURANCE_ONLY_MODULE_IDS.includes(m.id) && bt.group !== 'insurance') {
      enabledModules[m.id] = false;
      return;
    }
    enabledModules[m.id] = CORE_MODULE_IDS.includes(m.id);
  });
  const enabledDimensions = {
    class: false, location: false, 'cost-center': true, broker: false, mga: false,
    state: false, lob: false, treaty: false, 'carrier-dim': false, reinsurer: false,
    'customer-job': false, 'product-line': false
  };
  (goalIds || []).forEach(goalId => {
    const goal = ONBOARDING_GOALS.find(g => g.id === goalId);
    if (!goal) return;
    goal.modules.forEach(mId => { enabledModules[mId] = true; });
    goal.dims.forEach(dId => { enabledDimensions[dId] = true; });
  });
  if (bt.group === 'insurance') {
    INSURANCE_ONLY_MODULE_IDS.forEach(mId => { enabledModules[mId] = true; });
    enabledDimensions.mga = true;
    enabledDimensions.broker = true;
    enabledDimensions.state = true;
    enabledDimensions.lob = true;
  }
  return { enabledModules, enabledDimensions };
}
