/* ============================================================
   VERIDEX PLATFORM — Shared Component Library (v3.0)
   Standard component renderers and interaction handlers.
   Single source of truth: README_UI_FRAMEWORK_FINAL.md
   ============================================================ */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.VeriDexComponents = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const ICONS = {
    check: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8.5l3.5 3.5L13 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    info: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.6"/><path d="M8 7v4.5M8 4.5h.01" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
    warning: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 2.5L1.5 13.5h13L8 2.5z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M8 6.5v3.5M8 11.5h.01" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
    danger: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.6"/><path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`,
    close: `<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`,
    brandArrow: `<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    emptyBox: `<svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="24" y="34" width="72" height="54" rx="6" stroke="#6B7280" stroke-width="2" stroke-dasharray="4 3"/>
      <path d="M24 50h72" stroke="#6B7280" stroke-width="1.5"/>
      <circle cx="36" cy="42" r="2.5" fill="#6B7280"/>
      <circle cx="44" cy="42" r="2.5" fill="#6B7280"/>
      <path d="M48 68h24M54 76h12" stroke="#6B7280" stroke-width="1.8" stroke-linecap="round"/>
    </svg>`
  };

  /**
   * Status Badges (§10.1)
   * Fixed 20px height, 0 8px padding, 12px Inter 500 uppercase, 4px radius
   */
  function renderBadge(status, customLabel) {
    const raw = (status || 'draft').toLowerCase().replace(/[\s_]+/g, '-');
    const labelMap = {
      'published': 'PUBLISHED',
      'draft': 'DRAFT',
      'review': 'IN REVIEW',
      'in-review': 'IN REVIEW',
      'approved': 'APPROVED',
      'superseded': 'SUPERSEDED',
      'retired': 'RETIRED',
      'active': 'ACTIVE',
      'locked': 'LOCKED',
      'pending': 'PENDING',
      'closed': 'CLOSED',
      'unreconciled': 'UNRECONCILED',
      'matched': 'MATCHED'
    };
    const label = customLabel || labelMap[raw] || raw.toUpperCase();
    const className = `status-badge status-${raw}`;
    return `<span class="${className}">${escapeHtml(label)}</span>`;
  }

  /**
   * Outcome Badges (§10.2)
   */
  function renderOutcomeBadge(outcome, customLabel) {
    const raw = (outcome || 'refer').toLowerCase();
    const label = customLabel || raw.toUpperCase();
    return `<span class="outcome-badge outcome-${raw}">${escapeHtml(label)}</span>`;
  }

  /**
   * Callout / Alert Banner (§10.8)
   */
  function renderCallout(type, message, options = {}) {
    const t = (type || 'info').toLowerCase();
    const icon = options.icon || (t === 'success' ? ICONS.check : t === 'warning' ? ICONS.warning : t === 'danger' || t === 'error' ? ICONS.danger : t === 'brand' ? ICONS.brandArrow : ICONS.info);
    const dismissible = options.dismissible ? `<button type="button" class="callout-close" aria-label="Dismiss banner" onclick="this.closest('.callout-banner').remove()">${ICONS.close}</button>` : '';
    const titleHtml = options.title ? `<strong class="callout-title">${escapeHtml(options.title)}</strong>` : '';
    return `
      <div class="callout-banner callout-${t}" role="${t === 'danger' || t === 'error' ? 'alert' : 'status'}">
        <span class="callout-icon">${icon}</span>
        <div class="callout-content">
          ${titleHtml}
          <div class="callout-body">${message}</div>
        </div>
        ${dismissible}
      </div>
    `;
  }

  /**
   * Empty State (§10.10)
   */
  function renderEmptyState(options = {}) {
    const title = options.title || 'No records yet';
    const description = options.description || 'Create your first entry to get started.';
    const actionHtml = options.actionText && options.actionHref ?
      `<a href="${options.actionHref}" class="btn btn-primary" style="margin-top:16px;">${escapeHtml(options.actionText)}</a>` :
      options.actionText && options.actionOnClick ?
      `<button type="button" class="btn btn-primary" onclick="${options.actionOnClick}" style="margin-top:16px;">${escapeHtml(options.actionText)}</button>` : '';

    return `
      <div class="empty-state-container">
        <div class="empty-state-icon">${options.customSvg || ICONS.emptyBox}</div>
        <div class="empty-state-title">${escapeHtml(title)}</div>
        <div class="empty-state-desc">${escapeHtml(description)}</div>
        ${actionHtml}
      </div>
    `;
  }

  /**
   * Breadcrumb (§10.11)
   */
  function renderBreadcrumb(crumbs) {
    if (!Array.isArray(crumbs) || crumbs.length === 0) return '';
    let items = crumbs;
    if (crumbs.length > 4) {
      items = [crumbs[0], { label: '…', href: null, title: crumbs.slice(1, -2).map(c => c.label).join(' › ') }, ...crumbs.slice(-2)];
    }
    const html = items.map((crumb, idx) => {
      const isLast = idx === items.length - 1;
      if (isLast || !crumb.href) {
        return `<span class="breadcrumb-item current" ${crumb.title ? `title="${escapeHtml(crumb.title)}"` : ''}>${escapeHtml(crumb.label)}</span>`;
      }
      return `<a href="${crumb.href}" class="breadcrumb-item">${escapeHtml(crumb.label)}</a>`;
    }).join('<span class="breadcrumb-sep" aria-hidden="true">›</span>');

    return `<nav class="breadcrumb-nav" aria-label="Breadcrumb">${html}</nav>`;
  }

  /**
   * Pagination (§10.12)
   */
  function renderPagination(currentPage, totalPages, totalItems, itemsPerPage = 25) {
    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    let pagesHtml = '';
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
        pagesHtml += `<button type="button" class="page-num-btn ${i === currentPage ? 'active' : ''}" onclick="onPageSelect(${i})">${i}</button>`;
      } else if (i === currentPage - 2 || i === currentPage + 2) {
        pagesHtml += `<span class="page-ellipsis">…</span>`;
      }
    }

    return `
      <div class="pagination-bar">
        <div class="pagination-info">Showing ${startItem}–${endItem} of ${totalItems}</div>
        <div class="pagination-controls">
          <button type="button" class="btn btn-secondary btn-sm" ${currentPage <= 1 ? 'disabled' : ''} onclick="onPageSelect(${currentPage - 1})">‹ Prev</button>
          <div class="page-numbers">${pagesHtml}</div>
          <button type="button" class="btn btn-secondary btn-sm" ${currentPage >= totalPages ? 'disabled' : ''} onclick="onPageSelect(${currentPage + 1})">Next ›</button>
        </div>
      </div>
    `;
  }

  /**
   * Toast Notifications (§10.9)
   * 360px wide, auto dismiss after 5s unless error.
   */
  function showToast(message, type = 'info', options = {}) {
    let container = document.getElementById('vd-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'vd-toast-container';
      container.className = 'toast-container';
      container.setAttribute('aria-live', 'polite');
      container.setAttribute('aria-atomic', 'true');
      document.body.appendChild(container);
    }

    const t = type.toLowerCase();
    const isError = t === 'danger' || t === 'error';
    const toast = document.createElement('div');
    toast.className = `toast-card toast-${t}`;
    toast.setAttribute('role', isError ? 'alert' : 'status');

    const icon = t === 'success' ? ICONS.check : isError ? ICONS.danger : t === 'warning' ? ICONS.warning : ICONS.info;

    toast.innerHTML = `
      <span class="toast-icon">${icon}</span>
      <div class="toast-message">${escapeHtml(message)}</div>
      <button type="button" class="toast-close" aria-label="Close notification">&times;</button>
    `;

    toast.querySelector('.toast-close').addEventListener('click', () => {
      toast.classList.add('toast-dismissing');
      setTimeout(() => toast.remove(), 150);
    });

    container.prepend(toast);

    const duration = options.duration !== undefined ? options.duration : (isError ? 0 : 5000);
    if (duration > 0) {
      setTimeout(() => {
        if (toast.parentNode) {
          toast.classList.add('toast-dismissing');
          setTimeout(() => toast.remove(), 150);
        }
      }, duration);
    }
  }

  /**
   * Density & Display Sizing Management (§10.18)
   * Modes: Spacious (54px rows) | Comfortable (default, 48px rows) | Compact (36px rows) | Condensed (28px rows)
   * Scale: 80% - 125% zoom / font scaling
   * Enhancements: Zebra Striping, Column Grid Lines
   */
  const DENSITY_MODES = ['spacious', 'comfortable', 'compact', 'condensed'];

  function initDensity() {
    const savedDensity = localStorage.getItem('v_density') || 'comfortable';
    const savedScale = parseInt(localStorage.getItem('v_ui_scale') || '100', 10);
    const savedZebra = localStorage.getItem('v_table_zebra') === 'true';
    const savedGrid = localStorage.getItem('v_table_grid') === 'true';

    applyDensity(savedDensity, false);
    applyScale(savedScale, false);
    toggleZebraStriping(savedZebra, false);
    toggleGridlines(savedGrid, false);
  }

  function applyDensity(mode, showFeedback = true) {
    if (!DENSITY_MODES.includes(mode)) {
      mode = 'comfortable';
    }
    const root = document.documentElement;
    root.setAttribute('data-density', mode);

    if (document.body) {
      DENSITY_MODES.forEach(m => document.body.classList.remove(`density-${m}`));
      document.body.classList.add(`density-${mode}`);
    }

    localStorage.setItem('v_density', mode);

    // Update Topbar button label & attributes
    const labelEl = document.getElementById('density-current-label');
    if (labelEl) {
      labelEl.textContent = mode.charAt(0).toUpperCase() + mode.slice(1);
    }
    const toggleBtn = document.getElementById('density-toggle-btn');
    if (toggleBtn) {
      toggleBtn.setAttribute('data-current', mode);
      toggleBtn.setAttribute('title', `Display Density: ${mode.charAt(0).toUpperCase() + mode.slice(1)} (Click for settings, Alt+D)`);
      toggleBtn.setAttribute('aria-label', `Display Density: ${mode.charAt(0).toUpperCase() + mode.slice(1)}`);
    }

    // Update Active Option in Density Menu
    const options = document.querySelectorAll('.v-density-option');
    options.forEach(opt => {
      if (opt.getAttribute('data-density-val') === mode) {
        opt.classList.add('active');
      } else {
        opt.classList.remove('active');
      }
    });

    if (showFeedback && typeof showToast === 'function') {
      const titles = {
        spacious: 'Spacious (54px rows)',
        comfortable: 'Comfortable (48px rows)',
        compact: 'Compact (36px rows)',
        condensed: 'Condensed (28px rows)'
      };
      showToast(`Density set to ${titles[mode] || mode}`, 'info');
    }
  }

  function applyScale(scalePercent, showFeedback = true) {
    let scale = parseInt(scalePercent, 10);
    if (isNaN(scale)) scale = 100;
    scale = Math.min(125, Math.max(80, scale));

    const root = document.documentElement;
    root.setAttribute('data-scale', scale);
    root.style.setProperty('--ui-scale', (scale / 100).toString());
    root.style.setProperty('--font-scale', (scale / 100).toString());

    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      mainContent.style.zoom = (scale / 100).toString();
    }

    localStorage.setItem('v_ui_scale', scale.toString());

    // Update scale display in menu
    const displayEl = document.getElementById('v-scale-display');
    if (displayEl) {
      displayEl.textContent = `${scale}%`;
    }

    // Update scale chips
    const chips = document.querySelectorAll('.v-scale-chip');
    chips.forEach(chip => {
      if (parseInt(chip.getAttribute('data-scale-val'), 10) === scale) {
        chip.classList.add('active');
      } else {
        chip.classList.remove('active');
      }
    });

    // Update badge in topbar button
    const badgeEl = document.getElementById('scale-current-badge');
    if (badgeEl) {
      badgeEl.textContent = `${scale}%`;
      badgeEl.style.display = scale !== 100 ? 'inline-block' : 'none';
    }

    if (showFeedback && typeof showToast === 'function') {
      showToast(`UI scale set to ${scale}%`, 'info');
    }
  }

  function stepScale(delta) {
    const current = parseInt(localStorage.getItem('v_ui_scale') || '100', 10);
    applyScale(current + delta, true);
  }

  function toggleZebraStriping(enabled, showFeedback = true) {
    const isChecked = !!enabled;
    document.documentElement.setAttribute('data-table-zebra', isChecked ? 'true' : 'false');
    localStorage.setItem('v_table_zebra', isChecked ? 'true' : 'false');

    const checkbox = document.getElementById('v-toggle-zebra');
    if (checkbox) checkbox.checked = isChecked;

    if (showFeedback && typeof showToast === 'function') {
      showToast(isChecked ? 'Zebra striping enabled' : 'Zebra striping disabled', 'info');
    }
  }

  function toggleGridlines(enabled, showFeedback = true) {
    const isChecked = !!enabled;
    document.documentElement.setAttribute('data-table-grid', isChecked ? 'true' : 'false');
    localStorage.setItem('v_table_grid', isChecked ? 'true' : 'false');

    const checkbox = document.getElementById('v-toggle-gridlines');
    if (checkbox) checkbox.checked = isChecked;

    if (showFeedback && typeof showToast === 'function') {
      showToast(isChecked ? 'Column grid lines enabled' : 'Column grid lines disabled', 'info');
    }
  }

  function resetDensityDefaults() {
    applyDensity('comfortable', false);
    applyScale(100, false);
    toggleZebraStriping(false, false);
    toggleGridlines(false, false);
    if (typeof showToast === 'function') {
      showToast('Display density & sizing reset to defaults', 'info');
    }
  }

  function toggleDensityMenu(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    const menu = document.getElementById('v-density-menu');
    const btn = document.getElementById('density-toggle-btn');
    if (!menu) return;

    // Close other header menus
    const entityMenu = document.getElementById('v-entity-menu');
    if (entityMenu) entityMenu.classList.remove('open');
    const userMenu = document.getElementById('v-user-menu');
    if (userMenu) userMenu.classList.remove('open');

    const isOpen = menu.classList.toggle('open');
    if (btn) {
      btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    }
  }

  function closeDensityMenu() {
    const menu = document.getElementById('v-density-menu');
    if (menu) menu.classList.remove('open');
    const btn = document.getElementById('density-toggle-btn');
    if (btn) btn.setAttribute('aria-expanded', 'false');
  }

  function cycleDensity() {
    const current = localStorage.getItem('v_density') || 'comfortable';
    const idx = DENSITY_MODES.indexOf(current);
    const next = DENSITY_MODES[(idx + 1) % DENSITY_MODES.length];
    applyDensity(next, true);
  }

  function toggleDensity() {
    toggleDensityMenu();
  }

  /**
   * Focus Trap Helper (§13)
   */
  let lastFocusedElement = null;

  function trapFocus(modalElement) {
    lastFocusedElement = document.activeElement;
    const focusableEls = modalElement.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
    if (focusableEls.length > 0) {
      focusableEls[0].focus();
    }

    function handleKey(e) {
      if (e.key === 'Tab') {
        const first = focusableEls[0];
        const last = focusableEls[focusableEls.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      } else if (e.key === 'Escape') {
        closeActiveModal();
      }
    }

    modalElement._focusHandler = handleKey;
    document.addEventListener('keydown', handleKey);
  }

  function releaseFocus(modalElement) {
    if (modalElement && modalElement._focusHandler) {
      document.removeEventListener('keydown', modalElement._focusHandler);
      delete modalElement._focusHandler;
    }
    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
      lastFocusedElement.focus();
      lastFocusedElement = null;
    }
  }

  function closeActiveModal() {
    const modal = document.querySelector('.vd-modal-overlay.open');
    if (modal) {
      modal.classList.remove('open');
      releaseFocus(modal);
    }
    const drawer = document.querySelector('.vd-drawer-panel.open');
    if (drawer) {
      drawer.classList.remove('open');
      const overlay = document.querySelector('.vd-drawer-overlay.open');
      if (overlay) overlay.classList.remove('open');
      releaseFocus(drawer);
    }
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Ensure DOM load hook for density
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initDensity);
    } else {
      initDensity();
    }
  }

  // Bind legacy global showToast for backward compatibility
  if (typeof window !== 'undefined') {
    window.showToast = showToast;
  }

  return {
    renderBadge,
    renderOutcomeBadge,
    renderCallout,
    renderEmptyState,
    renderBreadcrumb,
    renderPagination,
    showToast,
    initDensity,
    applyDensity,
    applyScale,
    stepScale,
    toggleZebraStriping,
    toggleGridlines,
    resetDensityDefaults,
    toggleDensityMenu,
    closeDensityMenu,
    cycleDensity,
    toggleDensity,
    trapFocus,
    releaseFocus,
    closeActiveModal,
    escapeHtml,
    ICONS
  };
}));
