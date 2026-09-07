/* ============================================================
   VERIDEX PLATFORM — Shared Layout & Shell Engine (v3.0)
   Complies strictly with README_UI_FRAMEWORK_FINAL.md
   ============================================================ */

window.THEMES = {
  default: {
    '--color-brand': '#F97316',
    '--color-brand-dark': '#EA6A08',
    '--color-brand-light': '#FFF7ED',
    '--color-brand-gradient': 'linear-gradient(135deg, #F97316, #F59E0B)'
  },
  blue: {
    '--color-brand': '#2563EB',
    '--color-brand-dark': '#1D4ED8',
    '--color-brand-light': '#EFF6FF',
    '--color-brand-gradient': 'linear-gradient(135deg, #2563EB, #3B82F6)'
  },
  emerald: {
    '--color-brand': '#059669',
    '--color-brand-dark': '#047857',
    '--color-brand-light': '#ECFDF5',
    '--color-brand-gradient': 'linear-gradient(135deg, #059669, #10B981)'
  },
  purple: {
    '--color-brand': '#7C3AED',
    '--color-brand-dark': '#6D28D9',
    '--color-brand-light': '#F5F3FF',
    '--color-brand-gradient': 'linear-gradient(135deg, #7C3AED, #8B5CF6)'
  }
};

window.applyTheme = function(themeKey) {
  const theme = window.THEMES[themeKey] || window.THEMES['default'];
  const root = document.documentElement;
  for (const [key, value] of Object.entries(theme)) {
    root.style.setProperty(key, value);
  }
};

window.changeTheme = function(themeKey) {
  if (typeof getTenantConfig === 'function' && typeof saveTenantConfig === 'function') {
    const cfg = getTenantConfig();
    cfg.themeColor = themeKey;
    saveTenantConfig(cfg);
  } else {
    localStorage.setItem('v_theme_color', themeKey);
  }
  window.applyTheme(themeKey);
};

// Immediately apply theme on load if present
(function() {
  try {
    let pfx = '';
    const remUser = localStorage.getItem('v_remembered_user');
    const sessUser = sessionStorage.getItem('v_current_user');
    const u = sessUser || remUser;
    if (u) {
      const parsed = JSON.parse(u);
      pfx = (parsed.role === 'broker' ? 'broker' : parsed.role) + '_';
    }
    const raw = localStorage.getItem(pfx + 'v_tenant_config');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.themeColor) {
        window.applyTheme(parsed.themeColor);
        return;
      }
    }
    const fallbackTheme = localStorage.getItem('v_theme_color');
    if (fallbackTheme) window.applyTheme(fallbackTheme);
  } catch(e) {}
})();

const VD_MONOGRAM_SVG = `
<svg class="logo-vd-mark" width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="vdMonogramGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F97316"/>
      <stop offset="100%" stop-color="#F59E0B"/>
    </linearGradient>
  </defs>
  <rect width="32" height="32" rx="6" fill="#22262E"/>
  <path d="M7 10L13 22L17 14" stroke="url(#vdMonogramGrad)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M17 10H21C23.76 10 26 12.24 26 15C26 17.76 23.76 20 21 20H17V10Z" stroke="url(#vdMonogramGrad)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const NAV_ICONS = {
  'dashboard': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><path d="M218.83 103.77l-80-75.48a16 16 0 00-21.66 0l-80 75.48A16 16 0 0032 115.55V208a16 16 0 0016 16h48a8 8 0 008-8v-48a8 8 0 018-8h32a8 8 0 018 8v48a8 8 0 008 8h48a16 16 0 0016-16v-92.45a16 16 0 00-5.17-11.78z" stroke="currentColor" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  'home': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><path d="M218.83 103.77l-80-75.48a16 16 0 00-21.66 0l-80 75.48A16 16 0 0032 115.55V208a16 16 0 0016 16h160a16 16 0 0016-16v-92.45a16 16 0 00-5.17-11.78z" stroke="currentColor" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  'my-dashboard': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><rect x="32" y="48" width="80" height="64" rx="8" stroke="currentColor" stroke-width="18"/><rect x="144" y="48" width="80" height="96" rx="8" stroke="currentColor" stroke-width="18"/><rect x="32" y="144" width="80" height="64" rx="8" stroke="currentColor" stroke-width="18"/><rect x="144" y="176" width="80" height="32" rx="8" stroke="currentColor" stroke-width="18"/></svg>`,
  'explore-industries': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><circle cx="128" cy="128" r="96" stroke="currentColor" stroke-width="18"/><path d="M32 128h192M128 32a134 134 0 00-40 96 134 134 0 0040 96M128 32a134 134 0 0140 96 134 134 0 01-40 96" stroke="currentColor" stroke-width="18"/></svg>`,
  'gl': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><path d="M48 40h160a16 16 0 0116 16v144a16 16 0 01-16 16H48a16 16 0 01-16-16V56a16 16 0 0116-16z" stroke="currentColor" stroke-width="18"/><path d="M80 88h96M80 128h64M80 168h96" stroke="currentColor" stroke-width="18" stroke-linecap="round"/></svg>`,
  'chart-of-accounts': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><path d="M40 64h176M40 128h112M40 192h144" stroke="currentColor" stroke-width="18" stroke-linecap="round"/></svg>`,
  'journal-entry': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><path d="M160 32H56a16 16 0 00-16 16v160a16 16 0 0016 16h144a16 16 0 0016-16V88z" stroke="currentColor" stroke-width="18" stroke-linejoin="round"/><path d="M160 32v56h56M80 128h96M80 168h64" stroke="currentColor" stroke-width="18" stroke-linecap="round"/></svg>`,
  'financial-statements': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><path d="M40 208l64-64 48 48 64-80" stroke="currentColor" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/><path d="M176 112h40v40" stroke="currentColor" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  'period-locking': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><rect x="40" y="88" width="176" height="128" rx="16" stroke="currentColor" stroke-width="18"/><path d="M80 88V64a48 48 0 0196 0v24" stroke="currentColor" stroke-width="18" stroke-linecap="round"/></svg>`,
  'gl-simulation': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><circle cx="64" cy="64" r="24" stroke="currentColor" stroke-width="18"/><circle cx="192" cy="64" r="24" stroke="currentColor" stroke-width="18"/><circle cx="128" cy="192" r="24" stroke="currentColor" stroke-width="18"/><path d="M84 76l32 92M172 76l-32 92" stroke="currentColor" stroke-width="18"/></svg>`,
  'entity-hierarchy': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><circle cx="128" cy="48" r="24" stroke="currentColor" stroke-width="18"/><circle cx="48" cy="192" r="24" stroke="currentColor" stroke-width="18"/><circle cx="208" cy="192" r="24" stroke="currentColor" stroke-width="18"/><path d="M128 72v48M48 168v-24a24 24 0 0124-24h112a24 24 0 0124 24v24" stroke="currentColor" stroke-width="18" stroke-linecap="round"/></svg>`,
  'accounts-receivable': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><rect x="32" y="48" width="192" height="160" rx="16" stroke="currentColor" stroke-width="18"/><path d="M80 104h96M80 152h64M168 24l24 24-24 24" stroke="currentColor" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  'ar-aging': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><circle cx="128" cy="128" r="96" stroke="currentColor" stroke-width="18"/><path d="M128 72v56l40 40" stroke="currentColor" stroke-width="18" stroke-linecap="round"/></svg>`,
  'ar-collections': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><path d="M64 216v-80l64-96 64 96v80H64z" stroke="currentColor" stroke-width="18" stroke-linejoin="round"/></svg>`,
  'ar-statements': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><rect x="48" y="32" width="160" height="192" rx="16" stroke="currentColor" stroke-width="18"/><path d="M88 88h80M88 128h80M88 168h48" stroke="currentColor" stroke-width="18" stroke-linecap="round"/></svg>`,
  'billing': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><rect x="48" y="24" width="160" height="208" rx="16" stroke="currentColor" stroke-width="18"/><path d="M88 80h80M88 120h80M88 160h48" stroke="currentColor" stroke-width="18" stroke-linecap="round"/></svg>`,
  'accounts-payable': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><rect x="32" y="48" width="192" height="160" rx="16" stroke="currentColor" stroke-width="18"/><path d="M80 104h96M80 152h64M128 24v24" stroke="currentColor" stroke-width="18" stroke-linecap="round"/></svg>`,
  'ap-aging': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><circle cx="128" cy="128" r="96" stroke="currentColor" stroke-width="18"/><path d="M128 72v56l36 36" stroke="currentColor" stroke-width="18" stroke-linecap="round"/></svg>`,
  'bank': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><path d="M24 96L128 32l104 64H24z" stroke="currentColor" stroke-width="18" stroke-linejoin="round"/><path d="M48 96v80M96 96v80M160 96v80M208 96v80M24 176h208v32H24z" stroke="currentColor" stroke-width="18" stroke-linejoin="round"/></svg>`,
  'bank-reconciliation': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><path d="M24 96L128 32l104 64H24z" stroke="currentColor" stroke-width="18" stroke-linejoin="round"/><path d="M40 96v80M96 96v80M160 96v80M216 96v80M24 176h208v32H24z" stroke="currentColor" stroke-width="18" stroke-linejoin="round"/></svg>`,
  'recon-approvals': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><path d="M64 128l40 40 88-88" stroke="currentColor" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/><rect x="32" y="32" width="192" height="192" rx="24" stroke="currentColor" stroke-width="18"/></svg>`,
  'payroll': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><circle cx="96" cy="80" r="36" stroke="currentColor" stroke-width="18"/><path d="M24 200c0-40 32-64 72-64s72 24 72 64" stroke="currentColor" stroke-width="18" stroke-linecap="round"/><path d="M168 56h56M168 96h56M168 136h36" stroke="currentColor" stroke-width="18" stroke-linecap="round"/></svg>`,
  'inventory': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><path d="M32 80l96-48 96 48-96 48-96-48z" stroke="currentColor" stroke-width="18" stroke-linejoin="round"/><path d="M32 80v96l96 48 96-48V80" stroke="currentColor" stroke-width="18" stroke-linejoin="round"/><path d="M128 128v96" stroke="currentColor" stroke-width="18"/></svg>`,
  'fixed-assets': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><rect x="32" y="96" width="192" height="128" rx="16" stroke="currentColor" stroke-width="18"/><path d="M80 96V64a32 32 0 0164 0v32M128 144v48" stroke="currentColor" stroke-width="18" stroke-linecap="round"/></svg>`,
  'projects': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><rect x="32" y="48" width="192" height="160" rx="16" stroke="currentColor" stroke-width="18"/><path d="M32 96h192M80 144h48M80 176h80" stroke="currentColor" stroke-width="18" stroke-linecap="round"/></svg>`,
  'commission': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><circle cx="128" cy="128" r="96" stroke="currentColor" stroke-width="18"/><path d="M96 160l64-64M104 104a8 8 0 100-16 8 8 0 000 16zM152 168a8 8 0 100-16 8 8 0 000 16z" stroke="currentColor" stroke-width="18" stroke-linecap="round"/></svg>`,
  'fx': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><circle cx="128" cy="128" r="96" stroke="currentColor" stroke-width="18"/><path d="M32 128h192M128 32a134 134 0 00-40 96 134 134 0 0040 96M128 32a134 134 0 0140 96 134 134 0 01-40 96" stroke="currentColor" stroke-width="18"/></svg>`,
  'tax': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><rect x="32" y="48" width="192" height="160" rx="16" stroke="currentColor" stroke-width="18"/><path d="M80 96h24M152 96h24M80 144h32M152 144h24M120 96v64" stroke="currentColor" stroke-width="18" stroke-linecap="round"/></svg>`,
  'budgeting': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><path d="M32 208l56-64 48 40 48-80 40 32M32 48h192" stroke="currentColor" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  'reporting': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><rect x="48" y="24" width="160" height="208" rx="16" stroke="currentColor" stroke-width="18"/><path d="M96 80h64M96 128h64M96 176h32" stroke="currentColor" stroke-width="18" stroke-linecap="round"/></svg>`,
  'workflow': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><rect x="36" y="40" width="64" height="48" rx="8" stroke="currentColor" stroke-width="18"/><rect x="156" y="104" width="64" height="48" rx="8" stroke="currentColor" stroke-width="18"/><rect x="36" y="168" width="64" height="48" rx="8" stroke="currentColor" stroke-width="18"/><path d="M100 64h24a20 20 0 0120 20v44M100 192h24a20 20 0 0020-20v-44" stroke="currentColor" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  'approval-chains': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><path d="M84 132l28 28 60-60" stroke="currentColor" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/><rect x="40" y="40" width="176" height="176" rx="20" stroke="currentColor" stroke-width="18"/><path d="M96 40V24M160 40V24" stroke="currentColor" stroke-width="18" stroke-linecap="round"/></svg>`,
  'insurance': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><path d="M128 24L32 64v64c0 52 40 100 96 112 56-12 96-60 96-112V64L128 24z" stroke="currentColor" stroke-width="18" stroke-linejoin="round"/><path d="M88 128l28 28 52-52" stroke="currentColor" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  'subledger': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><rect x="32" y="160" width="192" height="48" rx="8" stroke="currentColor" stroke-width="18"/><rect x="32" y="104" width="192" height="48" rx="8" stroke="currentColor" stroke-width="18"/><rect x="32" y="48" width="192" height="48" rx="8" stroke="currentColor" stroke-width="18"/></svg>`,
  'reinsurance': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><path d="M224 128a96 96 0 01-192 0" stroke="currentColor" stroke-width="18" stroke-linecap="round"/><path d="M32 128a96 96 0 01192 0" stroke="currentColor" stroke-width="18" stroke-linecap="round"/><path d="M176 88l48 40-48 40M80 88L32 128l48 40" stroke="currentColor" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  'statutory-reports': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><rect x="48" y="24" width="160" height="208" rx="16" stroke="currentColor" stroke-width="18"/><path d="M96 80h64M96 128h64M96 176h32" stroke="currentColor" stroke-width="18" stroke-linecap="round"/></svg>`,
  'mga-operations': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><path d="M32 224V96l96-72 96 72v128H32z" stroke="currentColor" stroke-width="18" stroke-linejoin="round"/><rect x="96" y="136" width="64" height="88" rx="8" stroke="currentColor" stroke-width="18"/></svg>`,
  'compliance-filings': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><circle cx="128" cy="128" r="96" stroke="currentColor" stroke-width="18"/><path d="M88 128l28 28 52-52" stroke="currentColor" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  'premium-tax': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><rect x="32" y="48" width="192" height="160" rx="16" stroke="currentColor" stroke-width="18"/><path d="M80 96h24M152 96h24M80 144h32M152 144h24M120 96v64" stroke="currentColor" stroke-width="18" stroke-linecap="round"/></svg>`,
  'audit-trail': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><path d="M128 32a96 96 0 1096 96 96 96 0 00-96-96zm0 48v48l36 36" stroke="currentColor" stroke-width="18" stroke-linecap="round"/></svg>`,
  'admin-config': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><circle cx="128" cy="128" r="40" stroke="currentColor" stroke-width="18"/><path d="M128 24v24M128 208v24M24 128h24M208 128h24M54.34 54.34l17 17M184.66 184.66l17 17M54.34 201.66l17-17M184.66 71.34l17-17" stroke="currentColor" stroke-width="18" stroke-linecap="round"/></svg>`,
  'integration': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><circle cx="64" cy="64" r="32" stroke="currentColor" stroke-width="18"/><circle cx="192" cy="64" r="32" stroke="currentColor" stroke-width="18"/><circle cx="128" cy="192" r="32" stroke="currentColor" stroke-width="18"/><path d="M88 88l28 72M168 88l-28 72" stroke="currentColor" stroke-width="18"/></svg>`,
  'documents': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><path d="M64 24h96l56 56v152a16 16 0 01-16 16H64a16 16 0 01-16-16V40a16 16 0 0116-16z" stroke="currentColor" stroke-width="18" stroke-linejoin="round"/><path d="M160 24v56h56" stroke="currentColor" stroke-width="18" stroke-linejoin="round"/></svg>`,
  'identity': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><circle cx="96" cy="80" r="40" stroke="currentColor" stroke-width="18"/><path d="M24 208c0-44 36-72 80-72s80 28 80 72" stroke="currentColor" stroke-width="18" stroke-linecap="round"/><path d="M176 120l24 24 48-48" stroke="currentColor" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  'pas-dashboard': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><rect x="32" y="48" width="80" height="64" rx="8" stroke="currentColor" stroke-width="18"/><rect x="144" y="48" width="80" height="96" rx="8" stroke="currentColor" stroke-width="18"/><rect x="32" y="144" width="80" height="64" rx="8" stroke="currentColor" stroke-width="18"/><rect x="144" y="176" width="80" height="32" rx="8" stroke="currentColor" stroke-width="18"/></svg>`,
  'pas-policy': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><path d="M160 32H56a16 16 0 00-16 16v160a16 16 0 0016 16h144a16 16 0 0016-16V88z" stroke="currentColor" stroke-width="18" stroke-linejoin="round"/><path d="M160 32v56h56M96 144l20 20 44-44" stroke="currentColor" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  'insurance-flow-simulator': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><rect x="24" y="48" width="208" height="160" rx="16" stroke="currentColor" stroke-width="18"/><path d="M64 128h128M64 96l32 32-32 32" stroke="currentColor" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  'premium-claims': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><path d="M128 24L32 64v64c0 52 40 100 96 112 56-12 96-60 96-112V64L128 24z" stroke="currentColor" stroke-width="18" stroke-linejoin="round"/><path d="M88 128l28 28 52-52" stroke="currentColor" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  'docs': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><path d="M48 40h120a16 16 0 0116 16v160a16 16 0 01-16 16H48a16 16 0 01-16-16V56a16 16 0 0116-16z" stroke="currentColor" stroke-width="18"/><path d="M184 80h24a16 16 0 0116 16v120a16 16 0 01-16 16h-40" stroke="currentColor" stroke-width="18" stroke-linecap="round"/><path d="M80 96h64M80 136h64M80 176h40" stroke="currentColor" stroke-width="18" stroke-linecap="round"/></svg>`,
  'docs-portal': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><path d="M48 40h120a16 16 0 0116 16v160a16 16 0 01-16 16H48a16 16 0 01-16-16V56a16 16 0 0116-16z" stroke="currentColor" stroke-width="18"/><path d="M80 96h64M80 136h64M80 176h40" stroke="currentColor" stroke-width="18" stroke-linecap="round"/></svg>`,
  'dictionary': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><path d="M32 64a24 24 0 0124-24h152a16 16 0 0116 16v160H56a24 24 0 00-24 24z" stroke="currentColor" stroke-width="18" stroke-linejoin="round"/><path d="M32 192a24 24 0 0124-24h168" stroke="currentColor" stroke-width="18"/></svg>`,
};

const BELL_SVG = `<svg width="16" height="16" viewBox="0 0 256 256" fill="none"><path d="M128 24a64 64 0 00-64 64v44.8L44.8 160h166.4L192 132.8V88a64 64 0 00-64-64z" stroke="currentColor" stroke-width="20" stroke-linejoin="round"/><path d="M104 200a24 24 0 0048 0" stroke="currentColor" stroke-width="20"/></svg>`;
const SEARCH_SVG = `<svg width="14" height="14" viewBox="0 0 256 256" fill="none"><circle cx="112" cy="112" r="80" stroke="currentColor" stroke-width="22"/><path d="M168.5 168.5L224 224" stroke="currentColor" stroke-width="22" stroke-linecap="round"/></svg>`;
const CHEVRON_SVG = `<svg class="nav-chevron" width="12" height="12" viewBox="0 0 256 256" fill="none"><path d="M208 96l-80 80-80-80" stroke="currentColor" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const DENSITY_ICON_SVG = `<svg width="14" height="14" viewBox="0 0 256 256" fill="none"><path d="M40 80h176M40 128h176M40 176h176" stroke="currentColor" stroke-width="22" stroke-linecap="round"/></svg>`;
const COLLAPSE_ICON_SVG = `<svg width="16" height="16" viewBox="0 0 256 256" fill="none"><path d="M160 208l-80-80 80-80" stroke="currentColor" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const NAV_CONFIG = [
  { id: 'dashboard', label: 'Platform & Dashboards', moduleId: null, children: [
    { id: 'home',             label: 'Home Dashboard',    href: 'home.html' },
    { id: 'my-dashboard',     label: 'My Role Workspace', href: 'home.html#mydash' },
    { id: 'explore-industries', label: 'Industry Workspaces', href: 'role-select.html' },
    { id: 'entity-hierarchy', label: 'Entity Hierarchy',  href: 'entity-hierarchy.html' },
  ]},
  { id: 'gl', label: 'General Ledger', moduleId: 'gl', children: [
    { id: 'chart-of-accounts',    label: 'Chart of Accounts',    href: 'chart-of-accounts.html' },
    { id: 'journal-entry',        label: 'Journal Entry',        href: 'journal-entry.html' },
    { id: 'financial-statements', label: 'Financial Statements', href: 'financial-statements.html' },
    { id: 'period-locking',       label: 'Period Close',         href: 'period-locking.html' },
  ]},
  { id: 'accounts-receivable', label: 'Accounts Receivable', moduleId: 'ar', children: [
    { id: 'accounts-receivable', label: 'AR Register',   href: 'accounts-receivable.html' },
    { id: 'ar-aging',            label: 'AR Aging',       href: 'accounts-receivable.html#ar-aging' },
    { id: 'ar-collections',      label: 'Collections',    href: 'accounts-receivable.html#ar-collections' },
    { id: 'ar-statements',       label: 'Statements',     href: 'accounts-receivable.html#ar-statements' },
  ]},
  { id: 'billing', label: 'Billing & Invoicing', moduleId: 'billing', children: [
    { id: 'billing', label: 'Invoices & Billing Plans', href: 'billing-invoicing.html' },
  ]},
  { id: 'accounts-payable', label: 'Accounts Payable', moduleId: 'ap', children: [
    { id: 'accounts-payable', label: 'All Invoices',  href: 'accounts-payable.html' },
    { id: 'ap-ach',           label: 'ACH Payments',  href: 'accounts-payable.html#ap-ach' },
    { id: 'ap-echecks',       label: 'E-Checks',      href: 'accounts-payable.html#ap-echecks' },
    { id: 'ap-aging',         label: 'AP Aging',      href: 'accounts-payable.html#ap-aging' },
  ]},
  { id: 'bank', label: 'Bank & Cash Management', moduleId: 'bank', children: [
    { id: 'bank-reconciliation', label: 'Bank Reconciliation', href: 'bank-reconciliation.html' },
    { id: 'recon-approvals',     label: 'Recon Approvals',     href: 'bank-reconciliation.html#approvals' },
  ]},
  { id: 'payroll', label: 'Payroll', moduleId: 'payroll', children: [
    { id: 'payroll', label: 'Payroll & Employees', href: 'payroll.html' },
  ]},
  { id: 'inventory', label: 'Inventory & Costing', moduleId: 'inventory', children: [
    { id: 'inventory', label: 'Inventory & Manufacturing', href: 'inventory-costing.html' },
  ]},
  { id: 'fixed-assets', label: 'Fixed Assets', moduleId: 'fixed-assets', children: [
    { id: 'fixed-assets', label: 'Asset Register & Depreciation', href: 'fixed-assets.html' },
  ]},
  { id: 'projects', label: 'Projects & Job Costing', moduleId: 'projects', children: [
    { id: 'projects', label: 'Projects & WIP', href: 'projects-job-costing.html' },
  ]},
  { id: 'commission', label: 'Commission Engine', moduleId: 'commission', children: [
    { id: 'commission', label: 'Commission Schedules & Statements', href: 'commission-engine.html' },
  ]},
  { id: 'fx', label: 'Multi-Currency & FX', moduleId: 'fx', children: [
    { id: 'fx', label: 'FX Rates & Revaluation', href: 'multi-currency-fx.html' },
  ]},
  { id: 'tax', label: 'Tax Engine', moduleId: 'tax', children: [
    { id: 'tax', label: 'Tax Engine', href: 'tax-engine.html' },
  ]},
  { id: 'budgeting', label: 'Budgeting & Forecasting', moduleId: 'budgeting', children: [
    { id: 'budgeting', label: 'Budgets & Forecasts', href: 'budgeting-forecasting.html' },
  ]},
  { id: 'reporting', label: 'Reporting & Analytics', moduleId: 'reporting', children: [
    { id: 'reporting', label: 'Report & Dashboard Builder', href: 'reporting-analytics.html' },
  ]},
  { id: 'workflow', label: 'Workflow & Approvals', moduleId: 'workflow', children: [
    { id: 'approval-chains', label: 'Approval Chains', href: 'workflow-approvals.html' },
  ]},
  { id: 'pas-policy', label: 'Policy Admin (PAS)', moduleId: 'insurance', children: [
    { id: 'pas-policy', label: 'Policy Admin & Lifecycle', href: 'pas-policy.html' }
  ]},
  { id: 'subledger', label: 'Subledger Processing', moduleId: 'insurance', children: [
    { id: 'subledger', label: 'Subledger Processing', href: 'subledger-processing.html' }
  ]},
  { id: 'reinsurance', label: 'Reinsurance', moduleId: 'insurance', children: [
    { id: 'reinsurance', label: 'Reinsurance Accounting', href: 'reinsurance-accounting.html' }
  ]},
  { id: 'statutory-reports', label: 'Statutory & Filing', moduleId: 'insurance', children: [
    { id: 'statutory-reports', label: 'Statutory Reports', href: 'statutory-reports.html' }
  ]},
  { id: 'mga-operations', label: 'MGA Operations', moduleId: 'insurance', children: [
    { id: 'mga-operations', label: 'MGA Operations', href: 'mga-operations.html' }
  ]},
  { id: 'compliance-filings', label: 'Compliance & Filings', moduleId: 'insurance', children: [
    { id: 'compliance-filings', label: 'Compliance Filings', href: 'compliance-filings.html' }
  ]},
  { id: 'audit-trail', label: 'Audit & Controls', moduleId: null, children: [
    { id: 'audit-trail', label: 'Audit Trail', href: 'audit-trail.html' },
  ]},
  { id: 'admin-config', label: 'Administration', moduleId: 'admin-config', children: [
    { id: 'admin-config', label: 'Configuration Centre', href: 'admin-config-center.html' },
    { id: 'admin-config', label: 'Setup Wizard',          href: 'setup-wizard.html' },
    { id: 'admin-config', label: 'Excel Onboarding',      href: 'excel-onboarding.html' },
  ]},
  { id: 'integration', label: 'API & Integration', moduleId: 'integration', children: [
    { id: 'integration', label: 'API & Webhook Hub', href: 'api-integration-hub.html' },
  ]},
  { id: 'documents', label: 'Document Management', moduleId: 'documents', children: [
    { id: 'documents', label: 'Templates & Attachments', href: 'document-management.html' },
  ]},
  { id: 'identity', label: 'Identity & Security', moduleId: 'identity', children: [
    { id: 'identity', label: 'User Management', href: 'user-management.html' },
  ]},
  { id: 'docs', label: 'Documentation & Help', moduleId: null, children: [
    { id: 'docs-portal', label: 'System Documentation', href: 'docs/index.html' },
    { id: 'dictionary', label: 'Insurance Dictionary', href: 'dictionary/index.html' },
  ]},
];

function navIcon(id) {
  const svg = NAV_ICONS[id] || NAV_ICONS['dashboard'] || '';
  return svg ? `<span class="nav-icon">${svg}</span>` : '';
}

function isGroupVisibleForType(groupId, businessType) {
  if (groupId === 'budgeting') return false;
  if (groupId === 'docs') return true;
  const insuranceGroups = ['pas-policy', 'premium-claims', 'subledger', 'reinsurance', 'statutory-reports', 'mga-operations', 'compliance-filings'];
  
  if (businessType === 'agency' || businessType === 'broker') {
    const allowed = [
      'dashboard', 'pas-policy', 'commission',
      'gl', 'accounts-receivable', 'billing', 'accounts-payable', 'bank', 
      'tax', 'reporting', 'workflow', 
      'audit-trail', 'documents', 'identity', 'admin-config', 'integration', 'docs'
    ];
    return allowed.includes(groupId);
  }
  if (businessType === 'mga') {
    const allowed = [
      'dashboard', 'pas-policy', 'premium-claims', 'subledger', 'mga-operations',
      'gl', 'accounts-receivable', 'billing', 'accounts-payable', 'bank', 
      'commission', 'tax', 'reporting', 'workflow', 
      'audit-trail', 'documents', 'identity', 'admin-config', 'integration', 'docs'
    ];
    return allowed.includes(groupId);
  }
  if (businessType === 'carrier') {
    const allowed = [
      'dashboard', 'pas-policy', 'premium-claims', 'subledger', 
      'reinsurance', 'statutory-reports', 'mga-operations', 'compliance-filings',
      'gl', 'accounts-receivable', 'billing', 'accounts-payable', 'bank', 
      'commission', 'tax', 'reporting', 'workflow', 
      'audit-trail', 'documents', 'identity', 'admin-config', 'integration', 'docs'
    ];
    return allowed.includes(groupId);
  }
  if (businessType === 'reinsurer') {
    const allowed = [
      'dashboard', 'reinsurance', 'statutory-reports', 'compliance-filings',
      'gl', 'accounts-receivable', 'billing', 'accounts-payable', 'bank', 
      'tax', 'reporting', 'workflow', 
      'audit-trail', 'documents', 'identity', 'admin-config', 'integration', 'docs'
    ];
    return allowed.includes(groupId);
  }
  if (insuranceGroups.includes(groupId)) return false;
  return true;
}

function isChildVisibleForType(childId, businessType) {
  if (childId === 'explore-industries' || childId === 'entity-hierarchy') {
    return false;
  }
  return true;
}

function visibleNavGroups() {
  const cfg = typeof getTenantConfig === 'function' ? getTenantConfig() : null;
  if (!cfg) return NAV_CONFIG;
  const active = typeof getActiveEntity === 'function' ? getActiveEntity() : null;
  const bType = active ? active.businessType : cfg.businessType;
  return NAV_CONFIG.filter(g => {
    if (g.moduleId !== null && typeof isModuleEnabled === 'function' && !isModuleEnabled(g.moduleId)) return false;
    return isGroupVisibleForType(g.id, bType);
  });
}

function visibleChildren(children) {
  const cfg = typeof getTenantConfig === 'function' ? getTenantConfig() : null;
  const active = typeof getActiveEntity === 'function' ? getActiveEntity() : null;
  const bType = active ? active.businessType : (cfg ? cfg.businessType : 'mga');
  const isInsurance = typeof getBusinessType === 'function' && getBusinessType(bType).group === 'insurance';
  return children.filter(c => {
    if (c.industryOnly && !isInsurance) return false;
    return isChildVisibleForType(c.id, bType);
  });
}

function buildChildrenNav(children, activeId, currentPage, currentHash) {
  const anyHashMatch = currentHash && children.some(function(c) {
    var parts = c.href.split('#');
    return parts[1] && parts[0] === currentPage && parts[1] === currentHash;
  });
  return children.map(function(child) {
    var href = child.href;
    if (child.id === 'my-dashboard' && typeof getCurrentUser === 'function') {
      var user = getCurrentUser();
      if (typeof ROLE_CATALOG !== 'undefined') {
        var roleInfo = ROLE_CATALOG.find(function(r) { return r.id === user.role; });
        if (roleInfo) href = roleInfo.dashboard;
      }
    }
    var parts = href.split('#');
    var cPage = parts[0], cHash = parts[1];
    var hashMatch = cPage === currentPage && ((!cHash && !currentHash) || cHash === currentHash);
    var isActive = (child.id === activeId && !anyHashMatch) || hashMatch;
    return '<a class="nav-item' + (isActive ? ' active' : '') + '" href="' + href + '" data-label="' + child.label + '" title="' + child.label + '" onclick="event.stopPropagation();">'
      + navIcon(child.id)
      + '<span class="nav-label">' + child.label + '</span>'
      + '</a>';
  }).join('');
}

function buildSidebarNav(activeId) {
  const currentPage = window.location.pathname.split('/').pop();
  const currentHash = window.location.hash.replace('#', '');
  let html = '';
  visibleNavGroups().forEach(item => {
    const children = visibleChildren(item.children);
    if (!children.length) return;
    const isExpanded = children.some(c => c.id === activeId) || item.id === activeId ||
      children.some(c => {
        const [cPage, cHash] = c.href.split('#');
        return cPage === currentPage && ((!cHash && !currentHash) || cHash === currentHash);
      });
    html += `
      <div class="nav-group">
        <div class="nav-item parent ${isExpanded ? 'expanded' : ''}" data-label="${item.label}" title="${item.label}" onclick="toggleNav(event, 'sub-${item.id}', this)">
          ${navIcon(item.id)}
          <span class="nav-label">${item.label}</span>
          ${CHEVRON_SVG}
        </div>
        <div class="nav-sub ${isExpanded ? 'open' : ''}" id="sub-${item.id}">
          ${buildChildrenNav(children, activeId, currentPage, currentHash)}
        </div>
      </div>`;
  });
  return html;
}

function getRoleLabel(roleId) {
  if (typeof ROLE_CATALOG !== 'undefined') {
    const found = ROLE_CATALOG.find(r => r.id === roleId);
    if (found) return found.label;
  }
  return roleId ? (roleId.charAt(0).toUpperCase() + roleId.slice(1)) : 'User';
}

function buildBreadcrumb(activeId) {
  const pageName = document.title ? document.title.split('—')[0].split('|')[0].trim() : 'Overview';
  let groupName = 'Finance';
  visibleNavGroups().forEach(g => {
    if (g.children && g.children.some(c => c.id === activeId || c.href.includes(window.location.pathname.split('/').pop()))) {
      groupName = g.label;
    }
  });
  return `
    <nav class="breadcrumb-nav" aria-label="Breadcrumb">
      <a href="home.html" class="breadcrumb-item">VeriDex</a>
      <span class="breadcrumb-sep">›</span>
      <span class="breadcrumb-item">${groupName}</span>
      <span class="breadcrumb-sep">›</span>
      <span class="breadcrumb-item current">${pageName}</span>
    </nav>
  `;
}

function buildEntitySwitcher() {
  const cfg = typeof getTenantConfig === 'function' ? getTenantConfig() : { companyName: 'My Business', businessType: 'mga', secondaryEntities: [] };
  const active = typeof getActiveEntity === 'function' ? getActiveEntity() : { id: 'ENT-MINE', name: cfg.companyName, businessType: cfg.businessType };
  const bt = typeof getBusinessType === 'function' ? getBusinessType(active.businessType) : { icon: '🏢', label: 'Company' };
  const groups = { insurance: 'Insurance Operations', general: 'General Business' };
  let menu = '';
  ['insurance', 'general'].forEach(g => {
    let ents = (cfg.secondaryEntities || []).filter(e => {
      if (typeof getBusinessType !== 'function') return false;
      if (getBusinessType(e.businessType).group !== g) return false;
      
      let isOnboarded = false;
      let actualName = e.name;
      
      if (e.id === active.id || e.id === 'ENT-MINE') {
        isOnboarded = true;
        if (e.id === 'ENT-MINE') actualName = cfg.companyName;
      }
      
      const pfx = e.businessType === 'agency' ? 'broker_' : (e.businessType + '_');
      const raw = localStorage.getItem(pfx + 'v_tenant_config');
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed.onboarded) {
            isOnboarded = true;
            if (parsed.companyName) actualName = parsed.companyName;
          }
        } catch (ex) {}
      }
      
      e.displayName = actualName;
      return isOnboarded;
    });

    if (!ents.length) return;
    menu += `<div class="v-entity-menu-group-label">${groups[g]}</div>`;
    ents.forEach(e => {
      const ebt = typeof getBusinessType === 'function' ? getBusinessType(e.businessType) : { icon: '🏢', label: 'Entity' };
      menu += `<div class="v-entity-menu-item ${e.id === active.id ? 'active' : ''}" onclick="switchActiveEntity('${e.id}')">
        <div class="v-entity-avatar">${ebt.icon}</div>
        <div>
          <div style="font-size:12px;font-weight:600;color:var(--color-ink);">${e.displayName || e.name}</div>
          <div style="font-size:11px;color:var(--color-muted);">${ebt.label}</div>
        </div>
      </div>`;
    });
  });

  return `
    <div class="v-entity-switcher-wrap" style="position:relative;">
      <div class="v-entity-switch" onclick="document.getElementById('v-entity-menu').classList.toggle('open')" title="Switch entity workspace">
        <div class="v-entity-avatar">${bt.icon}</div>
        <div>
          <div class="v-entity-label">${active.name}</div>
          <div class="v-entity-sub">${bt.label}</div>
        </div>
        ${CHEVRON_SVG}
      </div>
      <div class="v-entity-menu" id="v-entity-menu">${menu}</div>
    </div>`;
}

function buildDensityControl() {
  const currentDensity = localStorage.getItem('v_density') || 'comfortable';
  const currentScale = parseInt(localStorage.getItem('v_ui_scale') || '100', 10);
  const isZebra = localStorage.getItem('v_table_zebra') === 'true';
  const isGrid = localStorage.getItem('v_table_grid') === 'true';

  return `
    <div class="v-density-wrap" style="position:relative;">
      <button type="button" class="density-toggle-btn" id="density-toggle-btn" onclick="VeriDexComponents.toggleDensityMenu(event)" title="Display Density & Size Settings (Alt+D)" aria-label="Display Density & Size Settings" aria-haspopup="true" aria-expanded="false">
        ${DENSITY_ICON_SVG}
        <span id="density-current-label" style="font-size:12px;font-weight:600;text-transform:capitalize;">${currentDensity}</span>
        <span id="scale-current-badge" class="density-scale-badge" style="${currentScale !== 100 ? '' : 'display:none;'}">${currentScale}%</span>
        ${CHEVRON_SVG}
      </button>

      <div class="v-density-menu" id="v-density-menu" role="menu" aria-label="Display Density and UI Sizing">
        <div class="v-density-menu-header">
          <div class="v-density-header-left">
            <svg width="15" height="15" viewBox="0 0 256 256" fill="none"><path d="M40 80h176M40 128h176M40 176h176" stroke="currentColor" stroke-width="22" stroke-linecap="round"/></svg>
            <span>Density &amp; Sizing</span>
          </div>
          <button type="button" class="v-density-reset-btn" onclick="VeriDexComponents.resetDensityDefaults()" title="Reset all display adjustments to default">Reset</button>
        </div>

        <div class="v-density-section-title">Display Density Preset</div>
        <div class="v-density-options-list">
          <div class="v-density-option ${currentDensity === 'spacious' ? 'active' : ''}" data-density-val="spacious" onclick="VeriDexComponents.applyDensity('spacious')">
            <div class="v-density-opt-radio"></div>
            <div class="v-density-opt-body">
              <div class="v-density-opt-title">Spacious</div>
              <div class="v-density-opt-desc">54px rows · Generous air &amp; touch friendly</div>
            </div>
            <div class="v-density-opt-preview preview-spacious">
              <span></span><span></span><span></span>
            </div>
          </div>

          <div class="v-density-option ${currentDensity === 'comfortable' ? 'active' : ''}" data-density-val="comfortable" onclick="VeriDexComponents.applyDensity('comfortable')">
            <div class="v-density-opt-radio"></div>
            <div class="v-density-opt-body">
              <div class="v-density-opt-title">Comfortable <span class="v-density-badge-default">Default</span></div>
              <div class="v-density-opt-desc">48px rows · Standard view &amp; spacing</div>
            </div>
            <div class="v-density-opt-preview preview-comfortable">
              <span></span><span></span><span></span>
            </div>
          </div>

          <div class="v-density-option ${currentDensity === 'compact' ? 'active' : ''}" data-density-val="compact" onclick="VeriDexComponents.applyDensity('compact')">
            <div class="v-density-opt-radio"></div>
            <div class="v-density-opt-body">
              <div class="v-density-opt-title">Compact</div>
              <div class="v-density-opt-desc">36px rows · High data density</div>
            </div>
            <div class="v-density-opt-preview preview-compact">
              <span></span><span></span><span></span><span></span>
            </div>
          </div>

          <div class="v-density-option ${currentDensity === 'condensed' ? 'active' : ''}" data-density-val="condensed" onclick="VeriDexComponents.applyDensity('condensed')">
            <div class="v-density-opt-radio"></div>
            <div class="v-density-opt-body">
              <div class="v-density-opt-title">Condensed <span class="v-density-badge-max">Max Fit</span></div>
              <div class="v-density-opt-desc">28px rows · Heavy finance &amp; ledgers</div>
            </div>
            <div class="v-density-opt-preview preview-condensed">
              <span></span><span></span><span></span><span></span><span></span>
            </div>
          </div>
        </div>

        <div class="v-density-divider"></div>

        <div class="v-density-section-title">Interface &amp; Font Zoom</div>
        <div class="v-density-scale-row">
          <div class="v-scale-stepper">
            <button type="button" class="v-scale-btn" onclick="VeriDexComponents.stepScale(-5)" title="Decrease Size (A-)">A−</button>
            <span class="v-scale-val" id="v-scale-display">${currentScale}%</span>
            <button type="button" class="v-scale-btn" onclick="VeriDexComponents.stepScale(5)" title="Increase Size (A+)">A+</button>
          </div>
          <div class="v-scale-presets">
            <button type="button" class="v-scale-chip ${currentScale === 85 ? 'active' : ''}" data-scale-val="85" onclick="VeriDexComponents.applyScale(85)">85%</button>
            <button type="button" class="v-scale-chip ${currentScale === 90 ? 'active' : ''}" data-scale-val="90" onclick="VeriDexComponents.applyScale(90)">90%</button>
            <button type="button" class="v-scale-chip ${currentScale === 100 ? 'active' : ''}" data-scale-val="100" onclick="VeriDexComponents.applyScale(100)">100%</button>
            <button type="button" class="v-scale-chip ${currentScale === 110 ? 'active' : ''}" data-scale-val="110" onclick="VeriDexComponents.applyScale(110)">110%</button>
            <button type="button" class="v-scale-chip ${currentScale === 120 ? 'active' : ''}" data-scale-val="120" onclick="VeriDexComponents.applyScale(120)">120%</button>
          </div>
        </div>

        <div class="v-density-divider"></div>

        <div class="v-density-section-title">Data Grid View Enhancements</div>
        <div class="v-density-toggles-group">
          <label class="v-density-toggle-item">
            <div class="v-density-toggle-info">
              <div class="v-toggle-title">Zebra Row Striping</div>
              <div class="v-toggle-desc">Subtle alternating background for wide rows</div>
            </div>
            <input type="checkbox" id="v-toggle-zebra" class="v-density-checkbox" ${isZebra ? 'checked' : ''} onchange="VeriDexComponents.toggleZebraStriping(this.checked)">
            <span class="v-density-switch"></span>
          </label>

          <label class="v-density-toggle-item">
            <div class="v-density-toggle-info">
              <div class="v-toggle-title">Column Grid Lines</div>
              <div class="v-toggle-desc">Vertical borders between table columns</div>
            </div>
            <input type="checkbox" id="v-toggle-gridlines" class="v-density-checkbox" ${isGrid ? 'checked' : ''} onchange="VeriDexComponents.toggleGridlines(this.checked)">
            <span class="v-density-switch"></span>
          </label>
        </div>

        <div class="v-density-footer">
          <span>Shortcut: <kbd>Alt</kbd> + <kbd>D</kbd></span>
          <span>Saved per device</span>
        </div>
      </div>
    </div>
  `;
}

function initLayout(activeId) {
  if (typeof enforceSetupGuard === 'function' && enforceSetupGuard()) return;
  const user = typeof getCurrentUser === 'function' ? getCurrentUser() : { name: 'Admin', role: 'admin', initials: 'AD', avatarColor: '#F97316' };
  const cfg = typeof getTenantConfig === 'function' ? getTenantConfig() : { companyName: 'VeriDex' };

  // 1. Accessibility Skip Link
  const skipLink = `<a href="#main-content" class="skip-link">Skip to main content</a>`;

  // 2. Sidebar (240px dark shell)
  const sidebar = `
    <aside class="sidebar" aria-label="Primary Navigation">
      <div class="sidebar-logo">
        <a href="home.html" class="sidebar-logo-link" title="VeriDex Home">
          ${VD_MONOGRAM_SVG}
          <div class="logo-wordmark">
            <span class="logo-wordmark-veri">Veri</span><span class="logo-wordmark-dex">Dex</span>
          </div>
        </a>
      </div>
      <nav class="sidebar-nav">${buildSidebarNav(activeId)}</nav>
      <button type="button" class="nav-collapse-btn" onclick="toggleSidebar()" aria-label="Collapse navigation sidebar">
        ${COLLAPSE_ICON_SVG}
        <span class="nav-collapse-text">Collapse sidebar</span>
      </button>
    </aside>`;

  // 3. Topbar (56px fixed dark shell)
  const header = `
    <header class="app-header" role="banner">
      <div class="header-left-zone">
        ${buildBreadcrumb(activeId)}
      </div>
      <div class="header-search">
        ${SEARCH_SVG}
        <input type="text" placeholder="Global search (Ctrl+K)" id="global-search" aria-label="Search platform data">
      </div>
      <div class="header-actions">
        ${buildDensityControl()}
        ${buildEntitySwitcher()}
        <button type="button" class="header-icon-btn" title="Platform notifications" onclick="VeriDexComponents.showToast('All services operational. No new alerts.','info')" aria-label="Notifications">
          ${BELL_SVG}
        </button>
        <div class="v-user-profile-wrap" style="position:relative;">
          <button type="button" class="header-avatar-btn" id="header-user-btn" onclick="document.getElementById('v-user-menu').classList.toggle('open')" title="${user.name || 'Account'} (${getRoleLabel(user.role)}) — Account &amp; Logout" aria-label="User Account Menu" style="background:${user.avatarColor || 'var(--color-brand)'};">
            ${user.initials || 'U'}
          </button>
          <div class="v-user-menu" id="v-user-menu">
            <div class="v-user-menu-header">
              <div class="v-user-menu-avatar" style="background:${user.avatarColor || 'var(--color-brand)'};">${user.initials || 'U'}</div>
              <div class="v-user-menu-info">
                <div class="v-user-menu-name">${user.name || 'User'}</div>
                <div class="v-user-menu-email">${user.email || 'user@company.com'}</div>
                <div class="v-user-menu-role">${getRoleLabel(user.role)}</div>
              </div>
            </div>
            <div class="v-user-menu-divider"></div>
            <a href="role-select.html" class="v-user-menu-item">
              <svg width="15" height="15" viewBox="0 0 256 256" fill="none"><circle cx="128" cy="128" r="96" stroke="currentColor" stroke-width="18"/><path d="M32 128h192M128 32a134 134 0 00-40 96 134 134 0 0040 96M128 32a134 134 0 0140 96 134 134 0 01-40 96" stroke="currentColor" stroke-width="18"/></svg>
              <span>Switch Workspace</span>
            </a>
            <a href="user-management.html" class="v-user-menu-item">
              <svg width="15" height="15" viewBox="0 0 256 256" fill="none"><circle cx="96" cy="80" r="40" stroke="currentColor" stroke-width="18"/><path d="M24 208c0-44 36-72 80-72s80 28 80 72" stroke="currentColor" stroke-width="18" stroke-linecap="round"/><path d="M176 120l24 24 48-48" stroke="currentColor" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/></svg>
              <span>Security &amp; Users</span>
            </a>
            <a href="admin-config-center.html" class="v-user-menu-item">
              <svg width="15" height="15" viewBox="0 0 256 256" fill="none"><circle cx="128" cy="128" r="40" stroke="currentColor" stroke-width="18"/><path d="M128 24v24M128 208v24M24 128h24M208 128h24" stroke="currentColor" stroke-width="18" stroke-linecap="round"/></svg>
              <span>Configuration Centre</span>
            </a>
            <div class="v-user-menu-divider"></div>
            <div style="padding: 12px 16px;">
              <div style="font-size:11px;font-weight:600;color:var(--color-ink-secondary);margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px;">Company Theme</div>
              <div style="display:flex;gap:8px;">
                <button type="button" class="theme-swatch" style="width:24px;height:24px;border-radius:50%;border:none;cursor:pointer;background:#F97316;box-shadow:inset 0 0 0 1px rgba(0,0,0,0.1);" onclick="window.changeTheme('default'); event.stopPropagation();" title="Default Orange"></button>
                <button type="button" class="theme-swatch" style="width:24px;height:24px;border-radius:50%;border:none;cursor:pointer;background:#2563EB;box-shadow:inset 0 0 0 1px rgba(0,0,0,0.1);" onclick="window.changeTheme('blue'); event.stopPropagation();" title="Ocean Blue"></button>
                <button type="button" class="theme-swatch" style="width:24px;height:24px;border-radius:50%;border:none;cursor:pointer;background:#059669;box-shadow:inset 0 0 0 1px rgba(0,0,0,0.1);" onclick="window.changeTheme('emerald'); event.stopPropagation();" title="Emerald Green"></button>
                <button type="button" class="theme-swatch" style="width:24px;height:24px;border-radius:50%;border:none;cursor:pointer;background:#7C3AED;box-shadow:inset 0 0 0 1px rgba(0,0,0,0.1);" onclick="window.changeTheme('purple'); event.stopPropagation();" title="Amethyst Purple"></button>
              </div>
            </div>
            <div class="v-user-menu-divider"></div>
            <button type="button" class="v-user-menu-item v-user-menu-logout" onclick="handleLogout()">
              <svg width="15" height="15" viewBox="0 0 256 256" fill="none"><path d="M112 40H48a16 16 0 00-16 16v144a16 16 0 0016 16h64" stroke="currentColor" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/><path d="M168 88l40 40-40 40M208 128H96" stroke="currentColor" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/></svg>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </header>`;

  // Insert into DOM
  document.body.insertAdjacentHTML('afterbegin', header);
  document.body.insertAdjacentHTML('afterbegin', sidebar);
  document.body.insertAdjacentHTML('afterbegin', skipLink);

  // Set main landmark id
  const mainEl = document.querySelector('.main-content');
  if (mainEl && !mainEl.id) {
    mainEl.id = 'main-content';
  }

  // Restore sidebar state
  if (localStorage.getItem('v_sb_collapsed') === '1') {
    document.body.classList.add('sb-collapsed');
  }

  // Restore density mode
  if (typeof VeriDexComponents !== 'undefined' && VeriDexComponents.initDensity) {
    VeriDexComponents.initDensity();
  }

  if (typeof startInactivityTimer === 'function') {
    startInactivityTimer();
  }

  document.addEventListener('click', (e) => {
    const densityMenu = document.getElementById('v-density-menu');
    if (densityMenu && !e.target.closest('.v-density-wrap') && !e.target.closest('.v-density-menu')) {
      densityMenu.classList.remove('open');
      const btn = document.getElementById('density-toggle-btn');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    }
    const entityMenu = document.getElementById('v-entity-menu');
    if (entityMenu && !e.target.closest('.v-entity-switch') && !e.target.closest('.v-entity-menu')) {
      entityMenu.classList.remove('open');
    }
    const userMenu = document.getElementById('v-user-menu');
    if (userMenu && !e.target.closest('#header-user-btn') && !e.target.closest('.v-user-menu')) {
      userMenu.classList.remove('open');
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.altKey && (e.key === 'd' || e.key === 'D')) {
      e.preventDefault();
      if (typeof VeriDexComponents !== 'undefined' && VeriDexComponents.cycleDensity) {
        VeriDexComponents.cycleDensity();
      }
    } else if (e.key === 'Escape') {
      if (typeof VeriDexComponents !== 'undefined' && VeriDexComponents.closeDensityMenu) {
        VeriDexComponents.closeDensityMenu();
      }
    }
  });

  window.addEventListener('hashchange', () => {
    const sidebarNav = document.querySelector('.sidebar-nav');
    if (sidebarNav) sidebarNav.innerHTML = buildSidebarNav(activeId);
  });

  if (cfg.activeEntityId === 'ENT-MINE' && typeof clearDummyDataForPage === 'function') {
    clearDummyDataForPage();
  }
}

function toggleNav(event, submenuId, parentEl) {
  if (event.target.closest('a')) return;
  const sub = document.getElementById(submenuId);
  if (!sub) return;
  const isOpen = sub.classList.contains('open');
  if (isOpen) {
    sub.classList.remove('open');
    parentEl.classList.remove('expanded');
  } else {
    sub.classList.add('open');
    parentEl.classList.add('expanded');
  }
}

function toggleSidebar() {
  const collapsed = document.body.classList.toggle('sb-collapsed');
  localStorage.setItem('v_sb_collapsed', collapsed ? '1' : '0');
}

function handleLogout() {
  sessionStorage.clear();
  localStorage.removeItem('v_current_user');
  localStorage.removeItem('v_remembered_user');
  localStorage.removeItem('v_remember_until');
  if (typeof VeriDexComponents !== 'undefined' && VeriDexComponents.showToast) {
    VeriDexComponents.showToast('You have been signed out.', 'info');
  }
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 100);
}
