/* ============================================================
   VERIDEX FINANCE DOCUMENTATION SYSTEM — SHARED NAVIGATION ENGINE
   ============================================================ */

const DOCS_NAV = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: 'fa-house',
    children: [
      { id: 'index', title: 'System Overview', href: 'index.html', icon: 'fa-circle-info' },
      { id: 'insurance-distribution', title: '3 Billing Models (DBA · DBM · DBC)', href: 'insurance-distribution.html', icon: 'fa-diagram-project' }
    ]
  },
  {
    id: 'dashboard',
    title: 'Platform & Dashboards',
    icon: 'fa-gauge-high',
    children: [
      { id: 'home-dashboard', title: 'Home Dashboard', href: 'home-dashboard.html', icon: 'fa-table-columns' },
      { id: 'my-role-workspace', title: 'My Role Workspace', href: 'my-role-workspace.html', icon: 'fa-briefcase' },
      { id: 'industry-workspaces', title: 'Industry Workspaces', href: 'industry-workspaces.html', icon: 'fa-building' },
      { id: 'entity-hierarchy', title: 'Entity Hierarchy', href: 'entity-hierarchy.html', icon: 'fa-sitemap' }
    ]
  },
  {
    id: 'gl',
    title: 'General Ledger',
    icon: 'fa-book-bookmark',
    children: [
      { id: 'chart-of-accounts', title: 'Chart of Accounts', href: 'chart-of-accounts.html', icon: 'fa-list-ol' },
      { id: 'journal-entry', title: 'Journal Entry', href: 'journal-entry.html', icon: 'fa-pen-to-square' },
      { id: 'financial-statements', title: 'Financial Statements', href: 'financial-statements.html', icon: 'fa-file-invoice-dollar' },
      { id: 'period-close', title: 'Period Close', href: 'period-close.html', icon: 'fa-lock' }
    ]
  },
  {
    id: 'accounts-receivable',
    title: 'Accounts Receivable',
    icon: 'fa-receipt',
    children: [
      { id: 'ar-register', title: 'AR Register', href: 'ar-register.html', icon: 'fa-list' },
      { id: 'ar-aging', title: 'AR Aging', href: 'ar-aging.html', icon: 'fa-chart-column' },
      { id: 'ar-collections', title: 'Collections', href: 'ar-collections.html', icon: 'fa-bullhorn' },
      { id: 'ar-statements', title: 'Statements', href: 'ar-statements.html', icon: 'fa-file-lines' }
    ]
  },
  {
    id: 'billing',
    title: 'Billing & Invoicing',
    icon: 'fa-file-invoice-dollar',
    children: [
      { id: 'invoices-billing-plans', title: 'Invoices & Billing Plans', href: 'invoices-billing-plans.html', icon: 'fa-calendar-days' }
    ]
  },
  {
    id: 'accounts-payable',
    title: 'Accounts Payable',
    icon: 'fa-wallet',
    children: [
      { id: 'ap-all-invoices', title: 'All Invoices', href: 'ap-all-invoices.html', icon: 'fa-list' },
      { id: 'ap-ach-payments', title: 'ACH Payments', href: 'ap-ach-payments.html', icon: 'fa-money-bill-transfer' },
      { id: 'ap-echecks', title: 'E-Checks', href: 'ap-echecks.html', icon: 'fa-money-check-dollar' },
      { id: 'ap-aging', title: 'AP Aging', href: 'ap-aging.html', icon: 'fa-chart-column' }
    ]
  },
  {
    id: 'bank',
    title: 'Bank & Cash Management',
    icon: 'fa-building-columns',
    children: [
      { id: 'bank-reconciliation', title: 'Bank Reconciliation', href: 'bank-reconciliation.html', icon: 'fa-arrows-rotate' },
      { id: 'recon-approvals', title: 'Recon Approvals', href: 'recon-approvals.html', icon: 'fa-signature' }
    ]
  },
  {
    id: 'payroll',
    title: 'Payroll',
    icon: 'fa-users-gear',
    children: [
      { id: 'payroll-employees', title: 'Payroll & Employees', href: 'payroll-employees.html', icon: 'fa-user-group' }
    ]
  },
  {
    id: 'inventory',
    title: 'Inventory & Costing',
    icon: 'fa-boxes-stacked',
    children: [
      { id: 'inventory-costing', title: 'Inventory & Manufacturing', href: 'inventory-costing.html', icon: 'fa-warehouse' }
    ]
  },
  {
    id: 'fixed-assets',
    title: 'Fixed Assets',
    icon: 'fa-landmark',
    children: [
      { id: 'fixed-assets', title: 'Asset Register & Depreciation', href: 'fixed-assets.html', icon: 'fa-calculator' }
    ]
  },
  {
    id: 'projects',
    title: 'Projects & Job Costing',
    icon: 'fa-diagram-project',
    children: [
      { id: 'projects-job-costing', title: 'Projects & WIP', href: 'projects-job-costing.html', icon: 'fa-bars-progress' }
    ]
  },
  {
    id: 'commission',
    title: 'Commission Engine',
    icon: 'fa-percent',
    children: [
      { id: 'commission-schedules', title: 'Schedules & Statements', href: 'commission-schedules.html', icon: 'fa-file-invoice' }
    ]
  },
  {
    id: 'fx',
    title: 'Multi-Currency & FX',
    icon: 'fa-coins',
    children: [
      { id: 'fx-rates-revaluation', title: 'FX Rates & Revaluation', href: 'fx-rates-revaluation.html', icon: 'fa-arrow-right-arrow-left' }
    ]
  },
  {
    id: 'tax',
    title: 'Tax Engine',
    icon: 'fa-scale-balanced',
    children: [
      { id: 'tax-engine', title: 'Tax Engine (SLTX & Nexus)', href: 'tax-engine.html', icon: 'fa-percent' }
    ]
  },
  {
    id: 'budgeting',
    title: 'Budgeting & Forecasting',
    icon: 'fa-chart-line',
    children: [
      { id: 'budgeting-forecasting', title: 'Budgets & Forecasts', href: 'budgeting-forecasting.html', icon: 'fa-scale-unbalanced' }
    ]
  },
  {
    id: 'reporting',
    title: 'Reporting & Analytics',
    icon: 'fa-chart-pie',
    children: [
      { id: 'reporting-analytics', title: 'Report & Dashboard Builder', href: 'reporting-analytics.html', icon: 'fa-table' }
    ]
  },
  {
    id: 'workflow',
    title: 'Workflow & Approvals',
    icon: 'fa-check-double',
    children: [
      { id: 'approval-chains', title: 'Approval Chains', href: 'approval-chains.html', icon: 'fa-check-to-slot' }
    ]
  },
  {
    id: 'pas-policy',
    title: 'Policy Admin (PAS)',
    icon: 'fa-file-contract',
    children: [
      { id: 'pas-policy', title: 'Policy Admin & Lifecycle', href: 'pas-policy.html', icon: 'fa-shield-halved' }
    ]
  },
  {
    id: 'subledger',
    title: 'Subledger Processing',
    icon: 'fa-table-list',
    children: [
      { id: 'subledger-processing', title: 'Subledger & Bordereaux', href: 'subledger-processing.html', icon: 'fa-file-excel' }
    ]
  },
  {
    id: 'reinsurance',
    title: 'Reinsurance',
    icon: 'fa-shield-halved',
    children: [
      { id: 'reinsurance-accounting', title: 'Reinsurance Accounting', href: 'reinsurance-accounting.html', icon: 'fa-handshake' }
    ]
  },
  {
    id: 'statutory-reports',
    title: 'Statutory & Filing',
    icon: 'fa-landmark',
    children: [
      { id: 'statutory-reports', title: 'Statutory Reports (NAIC)', href: 'statutory-reports.html', icon: 'fa-folder-open' }
    ]
  },
  {
    id: 'mga-operations',
    title: 'MGA Operations',
    icon: 'fa-building-user',
    children: [
      { id: 'mga-operations', title: 'MGA Authority & Programs', href: 'mga-operations.html', icon: 'fa-user-tie' }
    ]
  },
  {
    id: 'compliance-filings',
    title: 'Compliance & Filings',
    icon: 'fa-file-shield',
    children: [
      { id: 'compliance-filings', title: 'Compliance Filings', href: 'compliance-filings.html', icon: 'fa-clipboard-check' }
    ]
  },
  {
    id: 'audit-trail',
    title: 'Audit & Controls',
    icon: 'fa-fingerprint',
    children: [
      { id: 'audit-trail', title: 'Audit Trail', href: 'audit-trail.html', icon: 'fa-clock-rotate-left' }
    ]
  },
  {
    id: 'admin-config',
    title: 'Administration',
    icon: 'fa-gear',
    children: [
      { id: 'admin-config-center', title: 'Configuration Centre', href: 'admin-config-center.html', icon: 'fa-sliders' },
      { id: 'setup-wizard', title: 'Setup Wizard', href: 'setup-wizard.html', icon: 'fa-wand-magic-sparkles' },
      { id: 'excel-onboarding', title: 'Excel Onboarding', href: 'excel-onboarding.html', icon: 'fa-file-arrow-up' }
    ]
  },
  {
    id: 'integration',
    title: 'API & Integration',
    icon: 'fa-network-wired',
    children: [
      { id: 'api-integration-hub', title: 'API & Webhook Hub', href: 'api-integration-hub.html', icon: 'fa-plug' }
    ]
  },
  {
    id: 'documents',
    title: 'Document Management',
    icon: 'fa-folder-closed',
    children: [
      { id: 'document-management', title: 'Templates & Attachments', href: 'document-management.html', icon: 'fa-paperclip' }
    ]
  },
  {
    id: 'identity',
    title: 'Identity & Security',
    icon: 'fa-user-shield',
    children: [
      { id: 'user-management', title: 'User Management & RBAC', href: 'user-management.html', icon: 'fa-users-gear' }
    ]
  }
];

function initDocsLayout(activePageId) {
  // 1. Render Topbar with Mobile Hamburger
  const topbar = document.getElementById('docs-topbar');
  if (topbar) {
    topbar.innerHTML = `
      <div class="topbar-left">
        <button class="mobile-menu-toggle" id="docs-mobile-toggle" aria-label="Toggle navigation">
          <i class="fa-solid fa-bars"></i>
        </button>
        <a href="index.html" class="brand-logo">
          <div class="brand-icon"><i class="fa-solid fa-shield-halved"></i></div>
          <span>VeriDex Docs</span>
          <span class="brand-badge">v1.6</span>
        </a>
      </div>

      <!-- Live Search -->
      <div class="search-box">
        <i class="fa-solid fa-magnifying-glass search-icon"></i>
        <input type="text" id="doc-search-input" class="search-input" placeholder="Search modules, GL, DBA / DBM / DBC..." oninput="handleDocSearch(this.value)">
        <span class="search-kbd">Ctrl+K</span>
      </div>

      <div class="topbar-actions">
        <a href="../dictionary/index.html" class="nav-btn nav-btn-secondary" title="Data Dictionary">
          <i class="fa-solid fa-book-bookmark"></i>
          <span>Dictionary</span>
        </a>
        <a href="../insurance-flow-simulator.html" class="nav-btn nav-btn-primary" title="Live Simulator">
          <i class="fa-solid fa-play"></i>
          <span>Live Simulator</span>
        </a>
      </div>
    `;
  }

  // 2. Render Sidebar with Mobile Header & Items
  const sidebar = document.getElementById('docs-sidebar');
  if (sidebar) {
    let html = `
      <div class="sidebar-mobile-header">
        <div class="sidebar-mobile-title">
          <i class="fa-solid fa-book-open" style="color:var(--brand);"></i>
          <span>Documentation Menu</span>
        </div>
        <button class="sidebar-close-btn" id="docs-sidebar-close" aria-label="Close navigation">&times;</button>
      </div>
    `;

    DOCS_NAV.forEach(group => {
      const hasActiveChild = group.children.some(c => c.id === activePageId);
      html += `
        <div class="nav-group ${hasActiveChild ? 'open' : ''}">
          <div class="nav-group-header">
            <i class="fa-solid ${group.icon} nav-group-icon"></i>
            <span class="nav-group-title">${group.title}</span>
          </div>
          <div class="nav-group-children">
      `;
      group.children.forEach(child => {
        const isActive = child.id === activePageId ? 'active' : '';
        html += `
          <a href="${child.href}" class="nav-sub-item ${isActive}">
            <i class="fa-solid ${child.icon}"></i>
            <span>${child.title}</span>
          </a>
        `;
      });
      html += `
          </div>
        </div>
      `;
    });
    sidebar.innerHTML = html;
  }

  // 3. Inject Backdrop for Mobile Drawer
  let backdrop = document.getElementById('docs-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.id = 'docs-backdrop';
    backdrop.className = 'docs-backdrop';
    document.body.appendChild(backdrop);
  }

  // 4. Setup Mobile Drawer Toggle Events
  const mobileToggle = document.getElementById('docs-mobile-toggle');
  const sidebarClose = document.getElementById('docs-sidebar-close');

  function openMobileNav() {
    if (sidebar) sidebar.classList.add('mobile-open');
    if (backdrop) backdrop.classList.add('active');
    document.body.classList.add('no-scroll');
  }

  function closeMobileNav() {
    if (sidebar) sidebar.classList.remove('mobile-open');
    if (backdrop) backdrop.classList.remove('active');
    document.body.classList.remove('no-scroll');
  }

  if (mobileToggle) {
    mobileToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      openMobileNav();
    });
  }

  if (sidebarClose) {
    sidebarClose.addEventListener('click', (e) => {
      e.stopPropagation();
      closeMobileNav();
    });
  }

  if (backdrop) {
    backdrop.addEventListener('click', closeMobileNav);
  }

  // Close drawer when clicking a navigation link on mobile
  if (sidebar) {
    sidebar.querySelectorAll('.nav-sub-item').forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 900) {
          closeMobileNav();
        }
      });
    });
  }

  // 5. Wrap standalone tables with responsive wrappers on mobile
  document.querySelectorAll('table.je-table, table.data-tbl').forEach(tbl => {
    if (!tbl.parentElement.classList.contains('table-responsive')) {
      const wrapper = document.createElement('div');
      wrapper.className = 'table-responsive';
      tbl.parentNode.insertBefore(wrapper, tbl);
      wrapper.appendChild(tbl);
    }
  });

  // 6. Setup Keyboard Shortcut Ctrl+K & Escape
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      const input = document.getElementById('doc-search-input');
      if (input) input.focus();
    } else if (e.key === 'Escape') {
      closeMobileNav();
    }
  });
}

function handleDocSearch(query) {
  const q = query.trim().toLowerCase();
  const cards = document.querySelectorAll('.module-card, .doc-hero, .info-card');
  
  cards.forEach(card => {
    const text = card.innerText.toLowerCase();
    if (!q || text.includes(q)) {
      card.style.display = 'block';
    } else {
      card.style.display = 'none';
    }
  });
}
