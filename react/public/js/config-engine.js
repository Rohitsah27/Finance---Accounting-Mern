/* ============================================================
   VERIDEX FINANCE SYSTEM - Configuration Engine (mock/static)
   Single source of truth for: business types, module catalogue,
   roles, dimensions, COA templates, and the tenant's live config.
   Everything else in the prototype reads from here so that
   turning a module on/off, switching business type, or adding a
   dimension actually changes what the rest of the app shows.
   ============================================================ */

/* ---------- Business Types (who is running the books) ---------- */
const BUSINESS_TYPES = [
  { id: 'agency',       label: 'Insurance Agency / Broker', group: 'insurance', icon: '🏢', desc: 'Retail agency & insurance broker placing business with Insureds & MGAs, earning commission.' },
  { id: 'broker',       label: 'Insurance Agency / Broker', group: 'insurance', icon: '🏢', desc: 'Retail agency & insurance broker placing business with Insureds & MGAs, earning commission.' },
  { id: 'mga',          label: 'MGA / Program Manager',    group: 'insurance', icon: '🧾', desc: 'Managing General Agent with binding authority, bordereaux, and sub-producer network.' },
  { id: 'carrier',      label: 'Insurance Carrier',         group: 'insurance', icon: '🛡️', desc: 'Risk-bearing insurer - statutory (NAIC SAP) + GAAP books, premium & claims accounting.' },
  { id: 'reinsurer',    label: 'Reinsurer',                 group: 'insurance', icon: '🌐', desc: 'Assumes ceded risk from carriers under treaty/facultative arrangements.' },
  { id: 'insured',      label: 'Insured / Policyholder Org',group: 'insurance', icon: '📄', desc: 'Commercial policyholder tracking premium spend, COIs, and claims as an expense center.' },
  { id: 'manufacturing',label: 'Manufacturer',              group: 'general',   icon: '🏭', desc: 'Makes physical goods - raw materials, WIP, finished goods, BOM-based costing.' },
  { id: 'wholesale',    label: 'Wholesaler / Distributor',  group: 'general',   icon: '📦', desc: 'Buys in bulk, resells to retailers - multi-location inventory, volume pricing.' },
  { id: 'retail',       label: 'Retailer',                  group: 'general',   icon: '🛒', desc: 'Sells to end consumers - POS integration, SKU-level costing, sales tax by jurisdiction.' },
  { id: 'services',     label: 'Professional Services',     group: 'general',   icon: '💼', desc: 'Project/time-based billing - WIP, T&M, retainers, job costing.' },
  { id: 'other',        label: 'Other / General Business',  group: 'general',   icon: '🏷️', desc: 'Any other business type - start from the core financial template and configure freely.' },
];

function getBusinessType(id) {
  if (id === 'broker') return BUSINESS_TYPES.find(b => b.id === 'broker') || BUSINESS_TYPES.find(b => b.id === 'agency');
  return BUSINESS_TYPES.find(b => b.id === id) || BUSINESS_TYPES[5];
}

/* ---------- Platform Module Catalogue (25 modules per Unified Spec) ---------- */
const MODULE_CATALOG = [
  { id: 'gl',            no: '01', label: 'General Ledger',            group: 'Core Financials', desc: 'Chart of Accounts, Journal Entries, Period Close, Multi-Entity, Trial Balance.', industryOnly: false, core: true },
  { id: 'ar',            no: '02', label: 'Accounts Receivable',       group: 'Core Financials', desc: 'Invoicing, collections, receipts, ageing, dunning, statements, disputes.', industryOnly: false, core: true },
  { id: 'billing',       no: '03', label: 'Billing & Invoicing',       group: 'Core Financials', desc: 'Recurring, milestone, retainer billing; credit & debit notes.', industryOnly: false },
  { id: 'ap',            no: '04', label: 'Accounts Payable',          group: 'Core Financials', desc: 'Vendor master, bills, 3-way match, ACH/check/wire payments, 1099/W-9.', industryOnly: false, core: true },
  { id: 'bank',          no: '05', label: 'Bank & Cash Management',    group: 'Treasury',        desc: 'Bank feeds, reconciliation, petty cash, cash position, FX, trust accounts.', industryOnly: false, core: true },
  { id: 'payments',      no: '06', label: 'Payments & Money Movement', group: 'Treasury',        desc: 'Inbound/outbound payments, allocation, refunds, provider integrations.', industryOnly: false },
  { id: 'accounting-engine', no:'07', label: 'Accounting Engine',      group: 'Core Financials', desc: 'Business Event → Accounting Rules Engine. Modules never post to GL directly.', industryOnly: false, core: true, locked: true },
  { id: 'payroll',       no: '08', label: 'Payroll',                   group: 'People',          desc: 'Employee master, pay runs, statutory filings, leave, benefits.', industryOnly: false },
  { id: 'inventory',     no: '09', label: 'Inventory & Costing',       group: 'Operations',      desc: 'Product master, FIFO/WAC/Standard costing, BOM, multi-location stock.', industryOnly: false },
  { id: 'fixed-assets',  no: '10', label: 'Fixed Assets',               group: 'Core Financials', desc: 'Asset register, depreciation (SL/DB/MACRS), disposal, impairment.', industryOnly: false },
  { id: 'projects',      no: '11', label: 'Projects & Job Costing',    group: 'Operations',      desc: 'Phases, tasks, timesheets, T&M/fixed/milestone billing, WIP.', industryOnly: false },
  { id: 'subscriptions', no: '12', label: 'Subscription & Recurring Revenue', group: 'Revenue',   desc: 'Plans, proration, renewals, usage billing, revenue recognition.', industryOnly: false },
  { id: 'commission',    no: '13', label: 'Commission Engine',          group: 'Revenue',         desc: 'Tiered/sliding-scale schedules, multi-level, clawback, statements.', industryOnly: false },
  { id: 'fx',            no: '14', label: 'Multi-Currency & FX',        group: 'Treasury',        desc: 'Rate types & feeds, realized/unrealized gain-loss, revaluation.', industryOnly: false },
  { id: 'tax',           no: '15', label: 'Tax Engine',                 group: 'Compliance',      desc: 'Sales/use tax, VAT/GST, premium tax, 1099 e-filing.', industryOnly: false, core: true },
  { id: 'reconciliation',no: '16', label: 'Reconciliation Engine',      group: 'Treasury',        desc: 'Bank/card/intercompany matching, exceptions, closure.', industryOnly: false },
  { id: 'budgeting',     no: '17', label: 'Budgeting & Forecasting',    group: 'Planning',        desc: 'Annual budget, driver-based planning, AI forecast, scenarios.', industryOnly: false },
  { id: 'reporting',     no: '18', label: 'Reporting & Analytics',      group: 'Planning',        desc: 'Financial statements, management reports, custom report builder.', industryOnly: false, core: true },
  { id: 'workflow',      no: '19', label: 'Workflow & Approval Engine', group: 'Governance',      desc: 'Configurable approval chains, escalation, notification triggers.', industryOnly: false, core: true },
  { id: 'customization', no: '20', label: 'Customization Framework',    group: 'Configuration',   desc: 'Custom fields, views, forms, templates, custom objects.', industryOnly: false, core: true },
  { id: 'identity',      no: '21', label: 'Identity, Roles & Security', group: 'Governance',      desc: 'RBAC, MFA, tenant isolation, session/API security.', industryOnly: false, core: true, locked: true },
  { id: 'documents',     no: '22', label: 'Document Management',        group: 'Governance',      desc: 'Templates, e-signature-ready docs, attachments, numbering.', industryOnly: false },
  { id: 'integration',   no: '23', label: 'API & Integration Platform', group: 'Configuration',   desc: 'REST command APIs, webhooks, async import/export, marketplace.', industryOnly: false, core: true },
  { id: 'admin-config',  no: '24', label: 'Admin Configuration Centre', group: 'Configuration',   desc: 'Field manager, workflow builder, sequences, GL mapping, onboarding.', industryOnly: false, core: true, locked: true },
  { id: 'insurance',     no: '25', label: 'Insurance Extension',        group: 'Industry',        desc: 'Premium accounting, MGA operations, reinsurance, claims, ACORD/NAIC.', industryOnly: true },
];

function modulesForBusinessType(businessTypeId) {
  const bt = getBusinessType(businessTypeId);
  return MODULE_CATALOG.filter(m => !m.industryOnly || bt.group === 'insurance');
}

/* ---------- Dimensions (QuickBooks "Class"/"Location" style + insurance-native) ---------- */
const DIMENSION_LIBRARY = [
  { id: 'class',        label: 'Class',            quickbooksRef: 'QuickBooks "Class"',    appliesTo: ['general'],   desc: 'Free-form categorisation for a line of business, program, or fund - no posting impact.' },
  { id: 'location',     label: 'Location / Department', quickbooksRef: 'QuickBooks "Location"', appliesTo: ['general','insurance'], desc: 'Branch, store, plant, or department.' },
  { id: 'customer-job',  label: 'Customer:Job',     quickbooksRef: 'QuickBooks "Customer:Job"', appliesTo: ['general'], desc: 'Sub-tracks a customer engagement or job for P&L by project.' },
  { id: 'cost-center',   label: 'Cost Centre',      quickbooksRef: null, appliesTo: ['general','insurance'], desc: 'Responsibility-centre tagging for budget ownership.' },
  { id: 'product-line',  label: 'Product / SKU Line', quickbooksRef: null, appliesTo: ['general'], desc: 'Groups revenue/cost by product family.' },
  { id: 'broker',        label: 'Broker / Producer', quickbooksRef: null, appliesTo: ['insurance'], desc: 'Retail Broker or Producer placing the policy.' },
  { id: 'mga',           label: 'MGA',              quickbooksRef: null, appliesTo: ['insurance'], desc: 'Managing General Agent the transaction is written through.' },
  { id: 'state',         label: 'State / Jurisdiction', quickbooksRef: null, appliesTo: ['insurance','general'], desc: 'Statutory / premium-tax jurisdiction.' },
  { id: 'lob',           label: 'Line of Business (LOB)', quickbooksRef: null, appliesTo: ['insurance'], desc: 'ASL / coverage code - e.g. General Liability, Property, Auto.' },
  { id: 'treaty',        label: 'Treaty / Program', quickbooksRef: null, appliesTo: ['insurance'], desc: 'Reinsurance treaty or program the cession applies to.' },
  { id: 'carrier-dim',   label: 'Carrier', quickbooksRef: null, appliesTo: ['insurance'], desc: 'Risk-bearing carrier on a fronted or MGA-written program.' },
  { id: 'reinsurer',     label: 'Reinsurer', quickbooksRef: null, appliesTo: ['insurance'], desc: 'Reinsurer assuming the ceded share on this transaction.' },
];

/* ---------- Dimension Master: pick-list values behind each dimension (QuickBooks-style) ---------- */
const DIMENSION_VALUE_OPTIONS = {
  broker: ['Links Insurance Agency (BROK-01)', 'Apex Risk Brokers', 'Coastal Producer Group'],
  mga: ['FUT - Futuristic', 'NTA', 'ACCL'],
  state: ['TX', 'CA', 'FL', 'NY', 'GA'],
  lob: ['Auto', 'Property', 'Liability', 'General Liability'],
  treaty: ['QS-2026-01 (Starlight Re)', 'XL-2026-02 (Starlight Re)', 'FAC-2026-07 (Everest Re)'],
  'carrier-dim': ['Southlake Insurance Co.', 'Third-Party Fronting Carrier'],
  reinsurer: ['Starlight Re', 'Everest Re (Facultative)'],
  'cost-center': ['00 - Corporate', '10 - Plant A', '20 - Wholesale DC', '30 - Retail Store 1'],
  class: ['Program A', 'Program B', 'Fund 1'],
  location: ['HQ', 'Branch - Dallas', 'Branch - Chicago'],
  'product-line': ['AC-2000 Split Unit', 'AC-3000 Window Unit'],
  'customer-job': ['Acme Corp - Phase 1', 'Acme Corp - Phase 2'],
};

/* ---------- Account Master: which dimensions apply to which account (drives JE dimension UI) ---------- */
const ACCOUNT_MASTER = [
  // 1100 Series: ASSETS
  { code: '1001', name: 'Cash / Bank',                group: 'asset',     dimensions: ['cost-center', 'location'] },
  { code: '1100', name: 'Premium Receivable',        group: 'asset',     dimensions: ['mga', 'broker', 'state', 'lob', 'cost-center'] },
  { code: '1400', name: 'Reinsurance Recoverable',   group: 'asset',     dimensions: ['treaty', 'reinsurer', 'lob'] },
  { code: '1500', name: 'Raw Material Inventory',    group: 'asset',     dimensions: ['cost-center', 'product-line', 'location'] },

  // 2100 Series: LIABILITIES
  { code: '2100', name: 'Unearned Premium',          group: 'liability', dimensions: ['mga', 'broker', 'state', 'lob'] },
  { code: '2200', name: 'Premium Payable',           group: 'liability', dimensions: ['mga', 'broker', 'cost-center'] },
  { code: '2300', name: 'Premium Taxes Payable',     group: 'liability', dimensions: ['state'] },
  { code: '2400', name: 'IBNR Reserve',              group: 'liability', dimensions: ['lob', 'state'] },

  // 3100 Series: EQUITY
  { code: '3100', name: 'Retained Earnings',         group: 'equity',    dimensions: ['cost-center'] },
  { code: '3200', name: 'Common Stock / Capital Surplus', group: 'equity', dimensions: ['cost-center'] },

  // 4100 Series: REVENUE
  { code: '4100', name: 'Net Written Premium',       group: 'revenue',   dimensions: ['mga', 'broker', 'state', 'lob', 'carrier-dim'] },
  { code: '4500', name: 'Sales Revenue',              group: 'revenue',   dimensions: ['class', 'location', 'customer-job', 'product-line'] },

  // 5100 Series: EXPENSES
  { code: '5100', name: 'Commission Expense / Revenue', group: 'expense',   dimensions: ['mga', 'broker', 'cost-center', 'lob'] },
  { code: '5101', name: 'Commission Expense — MGA Override', group: 'expense', dimensions: ['mga', 'cost-center', 'lob'] },
  { code: '5200', name: 'Claims Expense',            group: 'expense',   dimensions: ['lob', 'state', 'carrier-dim'] },
  { code: '5500', name: 'Payroll Expense',           group: 'expense',   dimensions: ['cost-center', 'location'] },
];

function lookupAccount(codeOrName) {
  const q = (codeOrName || '').trim().toLowerCase();
  if (!q) return null;
  // Prefer the real, persisted Chart of Accounts (js/gl-engine.js) when it's loaded on
  // this page, so newly-added accounts resolve correctly, not just the seed list.
  const source = (typeof getGLAccounts === 'function') ? getGLAccounts() : ACCOUNT_MASTER;
  return source.find(a => a.code === q || (q.length >= 2 && a.code.startsWith(q)) || a.name.toLowerCase().includes(q)) || null;
}

/* Dimensions to show for a given account, scoped to what's enabled for the active business type.
   Falls back to every enabled dimension when the account isn't recognized - so a free-typed
   account code never blocks entry, it just shows the tenant's full configured dimension set. */
function applicableDimensionsForAccount(codeOrName) {
  const cfg = getTenantConfig();
  const enabled = dimensionsForBusinessType(cfg.businessType).filter(d => cfg.enabledDimensions[d.id]);
  const acct = lookupAccount(codeOrName);
  if (!acct) return enabled;
  const wanted = new Set(acct.dimensions);
  return enabled.filter(d => wanted.has(d.id));
}

function dimensionsForBusinessType(businessTypeId) {
  const bt = getBusinessType(businessTypeId);
  return DIMENSION_LIBRARY.filter(d => d.appliesTo.includes(bt.group));
}

/* ---------- COA Templates (Section 5.1 library) ---------- */
const COA_TEMPLATES = [
  { id: 'us-gaap-standard', label: 'US GAAP Standard',      businessTypes: ['manufacturing','wholesale','retail','services','other','insured'], accounts: 84 },
  { id: 'manufacturing',    label: 'Manufacturing (Raw Material / WIP / FG)', businessTypes: ['manufacturing'], accounts: 96 },
  { id: 'wholesale-retail', label: 'Wholesale / Retail (Inventory & COGS)', businessTypes: ['wholesale','retail'], accounts: 88 },
  { id: 'naic-statutory',   label: 'NAIC Statutory (SAP)',  businessTypes: ['carrier'], accounts: 142 },
  { id: 'insurance-carrier',label: 'Insurance Carrier (GAAP + Stat)', businessTypes: ['carrier'], accounts: 156 },
  { id: 'mga-template',     label: 'MGA / Program Manager', businessTypes: ['mga','agency','broker'], accounts: 72 },
  { id: 'broker-template',  label: 'Insurance Broker / Agency (Retail)', businessTypes: ['broker','agency'], accounts: 72 },
  { id: 'reinsurer-template', label: 'Reinsurer (Assumed Business)', businessTypes: ['reinsurer'], accounts: 68 },
];

function coaTemplatesForBusinessType(businessTypeId) {
  return COA_TEMPLATES.filter(t => t.businessTypes.includes(businessTypeId));
}

/* ---------- Roles (who is using the system day to day) ---------- */
const ROLE_CATALOG = [
  { id: 'owner',        label: 'Business Owner / Principal', dashboard: 'dashboard-owner.html',      businessTypes: ['agency','broker','manufacturing','wholesale','retail','services','other','insured'] },
  { id: 'cfo',          label: 'CFO / Finance Executive',     dashboard: 'dashboard-cfo.html',        businessTypes: '*' },
  { id: 'controller',   label: 'Controller',                  dashboard: 'dashboard-controller.html', businessTypes: '*' },
  { id: 'accountant',   label: 'Staff Accountant',             dashboard: 'dashboard-accountant.html', businessTypes: '*' },
  { id: 'ap-ar-clerk',  label: 'AP / AR Clerk',                dashboard: 'dashboard-accountant.html', businessTypes: '*' },
  { id: 'payroll-admin',label: 'Payroll Administrator',        dashboard: 'dashboard-accountant.html', businessTypes: '*' },
  { id: 'auditor',      label: 'Internal / External Auditor',  dashboard: 'dashboard-auditor.html',    businessTypes: '*' },
  { id: 'agency-principal', label: 'Agency Principal / Retail Broker', dashboard: 'dashboard-agency.html', businessTypes: ['agency','broker'] },
  { id: 'broker-producer',  label: 'Retail Broker / Producer',         dashboard: 'dashboard-agency.html', businessTypes: ['broker','agency'] },
  { id: 'mga-ops',      label: 'MGA Operations Manager',       dashboard: 'dashboard-mga.html',        businessTypes: ['mga'] },
  { id: 'carrier-controller', label: 'Carrier Controller / Actuary', dashboard: 'dashboard-carrier.html', businessTypes: ['carrier'] },
  { id: 'reinsurance-analyst', label: 'Reinsurance Analyst',   dashboard: 'dashboard-reinsurer.html',  businessTypes: ['reinsurer'] },
  { id: 'admin',        label: 'System Administrator',         dashboard: 'dashboard-admin.html',      businessTypes: '*' },
];

function rolesForBusinessType(businessTypeId) {
  return ROLE_CATALOG.filter(r => r.businessTypes === '*' || r.businessTypes.includes(businessTypeId));
}

/* ---------- Tenant Config: persisted in localStorage, mirrors a real "Configuration" API ---------- */
const V_CONFIG_KEY = 'v_tenant_config';

/* A "fully loaded" config for a business type - every module that isn't industry-gated,
   plus the industry module when relevant, and every dimension that applies to that
   group. Used to seed the demo entities (so exploring them shows the whole picture)
   and as the fallback the first time any entity is switched to. */
function fullConfigForBusinessType(businessTypeId) {
  const bt = getBusinessType(businessTypeId);
  const enabledModules = {};
  MODULE_CATALOG.forEach(m => { enabledModules[m.id] = !m.industryOnly || bt.group === 'insurance'; });
  const enabledDimensions = {};
  DIMENSION_LIBRARY.forEach(d => { enabledDimensions[d.id] = d.appliesTo.includes(bt.group); });
  return { enabledModules, enabledDimensions, coaTemplate: suggestCoaTemplate(businessTypeId) };
}

/* ---------- Guided first-run setup: config -> mapping -> connect -> done ----------
   While setupStage isn't 'done', the sidebar/header nav is guarded (see layout.js) so a
   user can't wander off into the rest of the app before finishing setup - every stray
   click bounces back to the current stage's required page. */
const SETUP_FLOW_PAGES = ['admin-config-center.html', 'setup-wizard.html', 'excel-onboarding.html', 'api-integration-hub.html', 'onboarding.html', 'index.html', 'otp.html', 'insurance-flow-simulator.html'];
const SETUP_STAGE_PAGE = { config: 'admin-config-center.html', mapping: 'excel-onboarding.html', connect: 'api-integration-hub.html' };

function isSetupGuardActive() {
  const cfg = getTenantConfig();
  return !!cfg.onboarded && !!cfg.setupStage && cfg.setupStage !== 'done';
}

function advanceSetupStage(stage) {
  return saveTenantConfig({ setupStage: stage });
}

/* Where "Continue to Mapping" / commit-import / etc. should send the user next, given
   where they currently are in the guided setup flow. Falls back to the stage's home page. */
function setupGuardTarget() {
  const cfg = getTenantConfig();
  return SETUP_STAGE_PAGE[cfg.setupStage] || 'admin-config-center.html';
}

/* Which feature page shows the data after an upload type is imported - this is the
   "navigate to see the result" behavior (e.g. a bordereau import lands on MGA Operations). */
const RESULTS_PAGE_FOR_UPLOAD_TYPE = {
  'journal-lines': 'journal-entry.html',
  'coa': 'chart-of-accounts.html',
  'vendor': 'accounts-payable.html',
  'customer': 'accounts-receivable.html',
  'opening-balances': 'journal-entry.html',
  'bordereau': 'mga-operations.html',
  'budget': 'budgeting-forecasting.html',
  'commission-schedule': 'commission-engine.html',
  'fixed-asset': 'fixed-assets.html',
  'employee': 'payroll.html',
  'broker': 'accounts-receivable.html',
  'carrier': 'accounts-payable.html',
};

/* Every page the guided setup flow is allowed to land on, including the "see your
   imported result" stops - without this, the guard would bounce a user straight off the
   results page it just redirected them to. */
function setupFlowAllowedPages() {
  return SETUP_FLOW_PAGES.concat(Object.values(RESULTS_PAGE_FOR_UPLOAD_TYPE));
}

/* Handoff of "what was just imported" from excel-onboarding.html to the results page,
   so the loop actually closes: upload -> map -> commit -> see it show up for real. */
function stashImportResult(uploadTypeId, payload) {
  try {
    localStorage.setItem('v_last_import', JSON.stringify({ uploadTypeId, payload, at: new Date().toISOString() }));
  } catch (e) {}
}
function consumeImportResult(uploadTypeId) {
  try {
    const raw = localStorage.getItem('v_last_import');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.uploadTypeId !== uploadTypeId) return null;
    localStorage.removeItem('v_last_import');
    return parsed;
  } catch (e) { return null; }
}

function defaultTenantConfig() {
  const entities = [
    { id: 'ENT-MINE',   name: 'My Business',             businessType: 'mga' },
    { id: 'ENT-AGY-01', name: 'Links Insurance Agency', businessType: 'agency' },
    { id: 'ENT-CAR-01', name: 'Southlake Insurance Co.', businessType: 'carrier' },
    { id: 'ENT-INS-01', name: 'Commercial Insured Corp', businessType: 'insured' },
  ];
  const entityConfigs = {};
  entities.forEach(e => { entityConfigs[e.id] = Object.assign({ onboarded: false }, fullConfigForBusinessType(e.businessType)); });
  const activeEntityId = 'ENT-MINE';
  const activeCfg = entityConfigs[activeEntityId];
  return {
    tenantId: 'TEN-1001',
    onboarded: false,
    setupStage: 'welcome',
    ownerName: 'Jordan Blake',
    ownerRoleTitle: 'Business Owner',
    ownerRoleId: 'owner',
    companyName: 'My Business',
    businessLabel: 'MGA / Program Manager',
    businessType: 'mga',
    secondaryEntities: entities,
    entityConfigs: entityConfigs,
    activeEntityId: activeEntityId,
    coaTemplate: activeCfg.coaTemplate,
    enabledModules: activeCfg.enabledModules,
    enabledDimensions: activeCfg.enabledDimensions,
    fiscalYearStart: 'January',
    fiscalPeriods: 12,
    multiCurrency: false,
    functionalCurrency: 'USD',
    configStatus: 'Published',
    configVersion: 7,
    readinessScore: 92,
  };
}

function getTenantConfig() {
  let cfg = null;
  try {
    const raw = localStorage.getItem(V_CONFIG_KEY);
    if (raw) {
      cfg = Object.assign(defaultTenantConfig(), JSON.parse(raw));
    }
  } catch (e) {}
  if (!cfg) {
    cfg = defaultTenantConfig();
    localStorage.setItem(V_CONFIG_KEY, JSON.stringify(cfg));
  }

  // Dynamically patch secondaryEntities so they connect the user-onboarded companies
  if (cfg && cfg.secondaryEntities) {
    cfg.secondaryEntities.forEach(ent => {
      if (ent.id === 'ENT-MINE') {
        if (cfg.companyName) {
          ent.name = cfg.companyName;
        }
      } else if (ent.businessType === 'carrier') {
        try {
          const carrierRaw = localStorage.getItem('carrier_v_tenant_config');
          if (carrierRaw) {
            const carrierCfg = JSON.parse(carrierRaw);
            if (carrierCfg.companyName) {
              ent.name = carrierCfg.companyName;
            }
          }
        } catch (e) {}
      } else if (ent.businessType === 'mga') {
        try {
          const mgaRaw = localStorage.getItem('mga_v_tenant_config');
          if (mgaRaw) {
            const mgaCfg = JSON.parse(mgaRaw);
            if (mgaCfg.companyName) {
              ent.name = mgaCfg.companyName;
            }
          }
        } catch (e) {}
      }
    });
  }
  return cfg;
}

/* Any change to enabledModules/enabledDimensions/coaTemplate is remembered per active
   entity (entityConfigs), so switching entities never leaks one business's configuration
   into another's - the pizza shop you just onboarded keeps its own module set even after
   you go explore what the platform looks like for an insurance carrier. */
function saveTenantConfig(partial) {
  const cfg = Object.assign(getTenantConfig(), partial);
  if (partial && (partial.enabledModules || partial.enabledDimensions || partial.coaTemplate)) {
    cfg.entityConfigs = cfg.entityConfigs || {};
    cfg.entityConfigs[cfg.activeEntityId] = {
      enabledModules: cfg.enabledModules,
      enabledDimensions: cfg.enabledDimensions,
      coaTemplate: cfg.coaTemplate,
    };
  }
  localStorage.setItem(V_CONFIG_KEY, JSON.stringify(cfg));
  return cfg;
}

function getActiveEntity() {
  const cfg = getTenantConfig();
  return cfg.secondaryEntities.find(e => e.id === cfg.activeEntityId) || cfg.secondaryEntities[0];
}

function switchActiveEntity(entityId) {
  const cfg = getTenantConfig();
  const entity = cfg.secondaryEntities.find(e => e.id === entityId);
  if (!entity) return;

  const isCrossDatabaseSwitch = (entity.businessType !== cfg.businessType);

  if (!isCrossDatabaseSwitch) {
    const entityConfigs = cfg.entityConfigs || {};
    entityConfigs[cfg.activeEntityId] = { enabledModules: cfg.enabledModules, enabledDimensions: cfg.enabledDimensions, coaTemplate: cfg.coaTemplate };
    const target = entityConfigs[entityId] || fullConfigForBusinessType(entity.businessType);
    target.onboarded = true;
    entityConfigs[entityId] = target;
    saveTenantConfig({
      activeEntityId: entityId,
      businessType: entity.businessType,
      enabledModules: target.enabledModules,
      enabledDimensions: target.enabledDimensions,
      coaTemplate: target.coaTemplate,
      entityConfigs: entityConfigs,
    });
  } else {
    // If switching to another company database, leave this database centered on ENT-MINE
    saveTenantConfig({
      activeEntityId: 'ENT-MINE'
    });

    // Preset the target database config in localStorage to be onboarded & centered on its own ENT-MINE
    const targetPrefix = entity.businessType + '_';
    const targetConfigKey = targetPrefix + 'v_tenant_config';
    let targetCfgRaw = localStorage.getItem(targetConfigKey);
    if (targetCfgRaw) {
      try {
        const targetCfg = JSON.parse(targetCfgRaw);
        targetCfg.onboarded = true;
        targetCfg.activeEntityId = 'ENT-MINE';
        localStorage.setItem(targetConfigKey, JSON.stringify(targetCfg));
      } catch (e) {
        console.error('Failed to update target config:', e);
      }
    }
  }

  // Dynamic user switching on entity switch!
  let email = '';
  if (entity.businessType === 'carrier') email = 'carrier@gmail.com';
  else if (entity.businessType === 'mga') email = 'mga@gmail.com';
  else if (entity.businessType === 'agency' || entity.businessType === 'broker') email = 'broker@gmail.com';
  else if (entity.businessType === 'insured') email = 'insured@gmail.com';
  
  if (email) {
    const DEMO_USERS_MAP = {
      'carrier': { id:'USR-002', name:'Lena Novak',     role:'carrier-controller', initials:'LN', avatarColor:'#1565c0' },
      'mga':     { id:'USR-003', name:'Diego Alvarez',  role:'mga-ops',            initials:'DA', avatarColor:'#c9791f' },
      'agency':  { id:'USR-004', name:'Priya Menon',    role:'agency-principal',   initials:'PM', avatarColor:'#0f6e63' },
      'broker':  { id:'USR-004', name:'Priya Menon',    role:'agency-principal',   initials:'PM', avatarColor:'#0f6e63' },
      'insured': { id:'USR-001', name:'Jordan Blake',   role:'admin',               initials:'JB', avatarColor:'#0f6e63' },
    };
    const mapped = DEMO_USERS_MAP[entity.businessType] || DEMO_USERS_MAP['broker'];
    if (mapped) {
      // Look up target database's customized owner name, if it exists
      const targetPrefix = entity.businessType + '_';
      const targetConfigKey = targetPrefix + 'v_tenant_config';
      let targetOwnerName = '';
      let targetOwnerRole = '';
      try {
        const targetCfgRaw = localStorage.getItem(targetConfigKey);
        if (targetCfgRaw) {
          const targetCfg = JSON.parse(targetCfgRaw);
          if (targetCfg.onboarded && targetCfg.ownerName) {
            targetOwnerName = targetCfg.ownerName;
            if (targetCfg.ownerRoleId) {
              targetOwnerRole = targetCfg.ownerRoleId;
            }
          }
        }
      } catch (e) {}

      if (targetOwnerName) {
        mapped.name = targetOwnerName;
        mapped.initials = getInitials(targetOwnerName);
        if (targetOwnerRole) {
          mapped.role = targetOwnerRole;
        }
      } else if (cfg && cfg.onboarded && cfg.ownerName && entityId === 'ENT-MINE') {
        mapped.name = cfg.ownerName;
        mapped.initials = getInitials(cfg.ownerName);
        if (cfg.ownerRoleId) {
          mapped.role = cfg.ownerRoleId;
        }
      }
      sessionStorage.setItem('v_current_user', JSON.stringify(Object.assign({ email }, mapped)));
    }
  }

  window.location.reload();
}

function isModuleEnabled(moduleId) {
  const cfg = getTenantConfig();
  const mod = MODULE_CATALOG.find(m => m.id === moduleId);
  if (mod && mod.industryOnly && getBusinessType(cfg.businessType).group !== 'insurance') return false;
  return !!cfg.enabledModules[moduleId];
}

function toggleModule(moduleId, enabled) {
  const cfg = getTenantConfig();
  cfg.enabledModules[moduleId] = enabled;
  saveTenantConfig({ enabledModules: cfg.enabledModules });
}

/* ---------- Confidence helper for the Excel Mapping Wizard ---------- */
function confidenceClass(pct) {
  if (pct >= 85) return 'high';
  if (pct >= 60) return 'med';
  return 'low';
}

/* ============================================================
   ONBOARDING: turn a new user's answers into a real, working
   configuration - no seeded demo data required. This is what
   drives onboarding.html and what a brand-new tenant looks like.
   ============================================================ */

const ONBOARDING_GOALS = [
  { id: 'track-money',    label: 'Track income & expenses',        icon: '💰', modules: ['gl', 'ar', 'ap', 'bank'], dims: [] },
  { id: 'invoice',        label: 'Invoice customers',               icon: '🧾', modules: ['billing'], dims: ['customer-job'] },
  { id: 'inventory',      label: 'Manage inventory or production',  icon: '📦', modules: ['inventory'], dims: ['product-line', 'cost-center'] },
  { id: 'payroll',        label: 'Run payroll',                     icon: '💵', modules: ['payroll'], dims: ['location'] },
  { id: 'assets',         label: 'Track equipment or fixed assets',  icon: '🏗️', modules: ['fixed-assets'], dims: [] },
  { id: 'projects',       label: 'Bill by project or job',          icon: '📋', modules: ['projects'], dims: ['customer-job'] },
  { id: 'commission',     label: 'Pay commissions to agents/reps',   icon: '🤝', modules: ['commission'], dims: ['cost-center'] },
  { id: 'multi-currency', label: 'Deal in more than one currency',   icon: '🌐', modules: ['fx'], dims: [] },
  { id: 'multi-location', label: 'Operate multiple locations or departments', icon: '🏬', modules: [], dims: ['location', 'cost-center'] },
  { id: 'budget',         label: 'Budget and forecast',              icon: '📈', modules: ['budgeting'], dims: [] },
  { id: 'insurance-ops',  label: 'Handle policies, premium, or claims', icon: '🛡️', modules: ['insurance'], dims: ['mga', 'broker', 'state', 'lob'], insuranceOnly: true },
];

function goalsForBusinessType(businessTypeId) {
  const bt = getBusinessType(businessTypeId);
  return ONBOARDING_GOALS.filter(g => !g.insuranceOnly || bt.group === 'insurance');
}

/* Suggest a COA template for a business type; falls back to the general standard template
   when the business type has no dedicated template (e.g. Other / a custom description). */
function suggestCoaTemplate(businessTypeId) {
  const matches = coaTemplatesForBusinessType(businessTypeId);
  return (matches[0] || COA_TEMPLATES[0]).id;
}

/* Build the module + dimension recommendation from the goals a user checked, always
   including every core module (core modules can't be turned off, so they're on by default). */
function recommendConfigFromGoals(businessTypeId, goalIds) {
  const bt = getBusinessType(businessTypeId);
  const enabledModules = {};
  MODULE_CATALOG.forEach(m => {
    if (m.industryOnly && bt.group !== 'insurance') { enabledModules[m.id] = false; return; }
    enabledModules[m.id] = !!m.core; // start from core-only
  });
  const enabledDimensions = { class: false, location: false, 'cost-center': true, broker: false, mga: false, state: false, lob: false, treaty: false, 'carrier-dim': false, reinsurer: false, 'customer-job': false, 'product-line': false };
  (goalIds || []).forEach(goalId => {
    const goal = ONBOARDING_GOALS.find(g => g.id === goalId);
    if (!goal) return;
    goal.modules.forEach(mId => { enabledModules[mId] = true; });
    goal.dims.forEach(dId => { enabledDimensions[dId] = true; });
  });
  if (bt.group === 'insurance') {
    enabledModules.insurance = true;
    enabledDimensions.mga = true;
    enabledDimensions.broker = true;
    enabledDimensions.state = true;
    enabledDimensions.lob = true;
  }
  return { enabledModules, enabledDimensions };
}

/* Commit a completed onboarding wizard into the real tenant config. This REPLACES the
   demo defaults with the user's own business as entity #1 and active - the seeded
   insurance-chain/manufacturing demo entities stay available underneath for anyone who
   wants to explore other industries, but they are no longer what a new user sees first. */
function applyOnboarding(answers, stage) {
  const cfg = getTenantConfig();
  const { enabledModules, enabledDimensions } = recommendConfigFromGoals(answers.businessType, answers.goalIds);
  Object.assign(enabledModules, answers.moduleOverrides || {});
  Object.assign(enabledDimensions, answers.dimensionOverrides || {});
  const myEntity = {
    id: 'ENT-MINE',
    name: answers.companyName || 'My Business',
    businessType: answers.businessType,
  };
  const seedEntities = [
    { id: 'ENT-AGY-01', name: 'Links Insurance Agency', businessType: 'agency' },
    { id: 'ENT-MGA-01', name: 'FUT Program Managers',   businessType: 'mga' },
    { id: 'ENT-CAR-01', name: 'Southlake Insurance Co.', businessType: 'carrier' },
    { id: 'ENT-INS-01', name: 'Commercial Insured Corp', businessType: 'insured' }
  ];
  const others = seedEntities.filter(e => e.businessType !== answers.businessType);
  const updated = saveTenantConfig({
    onboarded: true,
    ownerName: answers.ownerName,
    ownerRoleTitle: answers.ownerRoleTitle,
    ownerRoleId: answers.ownerRoleId || 'owner',
    companyName: answers.companyName || 'My Business',
    businessLabel: answers.businessLabel || getBusinessType(answers.businessType).label,
    businessType: answers.businessType,
    coaTemplate: answers.coaTemplate || suggestCoaTemplate(answers.businessType),
    secondaryEntities: [myEntity, ...others],
    activeEntityId: 'ENT-MINE',
    enabledModules,
    enabledDimensions,
    configVersion: (cfg.configVersion || 1) + 1,
    readinessScore: 78,
    setupStage: stage || 'done', // gates navigation until the guided setup flow finishes - see layout.js
  });
  const user = getCurrentUser();
  user.name = answers.ownerName || user.name;
  user.role = answers.ownerRoleId || 'owner';
  user.initials = getInitials(user.name);
  try { sessionStorage.setItem('v_current_user', JSON.stringify(user)); } catch (e) {}
  return updated;
}

function getInitials(name) {
  if (!name) return 'US';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function isOnboarded() {
  return !!getTenantConfig().onboarded;
}

/* Lives here (not layout.js) because it's needed on pages with no header/sidebar too,
   e.g. onboarding.html, otp.html - every page loads config-engine.js first. */
function getCurrentUser() {
  try {
    const stored = sessionStorage.getItem('v_current_user');
    if (stored) {
      const user = JSON.parse(stored);
      const cfg = getTenantConfig();
      if (cfg && cfg.onboarded && cfg.ownerName) {
        user.name = cfg.ownerName;
        user.initials = getInitials(cfg.ownerName);
        if (cfg.ownerRoleId) {
          user.role = cfg.ownerRoleId;
        }
      }
      return user;
    }
    const remembered = localStorage.getItem('v_remembered_user');
    const until = parseInt(localStorage.getItem('v_remember_until') || '0', 10);
    if (remembered && Date.now() < until) {
      sessionStorage.setItem('v_current_user', remembered);
      const user = JSON.parse(remembered);
      const cfg = getTenantConfig();
      if (cfg && cfg.onboarded && cfg.ownerName) {
        user.name = cfg.ownerName;
        user.initials = getInitials(cfg.ownerName);
        if (cfg.ownerRoleId) {
          user.role = cfg.ownerRoleId;
        }
      }
      return user;
    }
  } catch (e) {}
  return { id: 'USR-001', name: 'Jordan Blake', role: 'admin', initials: 'JB', avatarColor: '#0f6e63', email: 'jordan.blake@veridex.com' };
}
