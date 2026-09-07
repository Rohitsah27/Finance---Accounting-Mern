/* Custom permissions - access sections & JSON template assignment */

let customPermCatalog = null;
let selectedTemplateId = null;

const ACTION_LABELS = {
  view: 'View', create: 'Create', edit: 'Edit', approve: 'Approve',
  export: 'Export', post: 'Post', file: 'File', lock: 'Lock', override: 'Override'
};

async function loadCustomPermCatalog() {
  try {
    const res = await fetch('data/custom-permissions.json');
    customPermCatalog = await res.json();
  } catch (e) {
    customPermCatalog = { accessSections: [], permissionTemplates: [] };
    console.warn('Load data/custom-permissions.json via HTTP server');
  }
}

function isCurrentUserAdmin() {
  try {
    const u = JSON.parse(sessionStorage.getItem('sl_current_user') || '{}');
    return u.role === 'admin' || u.roleLabel === 'Administrator';
  } catch (e) {
    return true;
  }
}

function getAdminName() {
  try {
    const u = JSON.parse(sessionStorage.getItem('sl_current_user') || '{}');
    return u.name || u.email || 'Administrator';
  } catch (e) {
    return 'Administrator';
  }
}

function renderAccessSections(userId) {
  const container = document.getElementById('access-sections-container');
  if (!container || !customPermCatalog) return;

  const u = db.users.find(x => x.id === userId);
  if (!u) return;
  const role = db.roles.find(r => r.id === u.role);

  container.innerHTML = customPermCatalog.accessSections.map(section => {
    const mods = section.moduleIds.map(mid => {
      const mod = db.modules.find(m => m.id === mid);
      if (!mod) return null;
      const hasCustom = u.customPermissions && u.customPermissions[mid] !== undefined;
      const rolePerms = (role && role.permissions[mid]) ? role.permissions[mid] : [];
      const effective = hasCustom ? u.customPermissions[mid] : rolePerms;
      const actions = effective.length ? effective.map(a => ACTION_LABELS[a] || a).join(', ') : ' - ';
      const src = hasCustom ? 'custom' : 'role';
      return { mod, actions, src, hasCustom };
    }).filter(Boolean);

    const customCount = mods.filter(m => m.hasCustom).length;
    return `
      <div class="access-section-card">
        <div class="access-section-head" onclick="this.parentElement.classList.toggle('collapsed')">
          <span class="access-section-icon">${section.icon || '▸'}</span>
          <div class="access-section-meta">
            <div class="access-section-title">${section.label}</div>
            <div class="access-section-desc">${section.description}</div>
          </div>
          <span class="badge ${customCount ? 'badge-orange' : 'badge-gray'}">${customCount} custom</span>
          <span class="access-chevron">▾</span>
        </div>
        <div class="access-section-body">
          ${mods.map(m => `
            <div class="access-mod-row ${m.src === 'custom' ? 'is-custom' : ''}">
              <span class="access-mod-name">${m.mod.label}</span>
              <span class="access-mod-actions">${m.actions}</span>
              <span class="access-mod-src badge ${m.src === 'custom' ? 'badge-orange' : 'badge-gray'}" style="font-size:10px;">${m.src === 'custom' ? 'Custom' : 'Role'}</span>
            </div>
          `).join('')}
        </div>
      </div>`;
  }).join('');
}

function renderAssignmentHistory(userId) {
  const el = document.getElementById('custom-assign-history');
  if (!el) return;
  const u = db.users.find(x => x.id === userId);
  const history = u?.customAccessAssignments || [];
  if (!history.length) {
    el.innerHTML = '<p class="text-muted" style="font-size:12px;margin:0;">No template assignments yet. Use <strong>Assign Custom Access</strong> to apply a preset from JSON.</p>';
    return;
  }
  el.innerHTML = history.map(h => {
    const tpl = customPermCatalog?.permissionTemplates?.find(t => t.id === h.templateId);
    return `<div class="assign-history-item">
      <div><strong>${tpl ? tpl.label : h.templateId}</strong></div>
      <div class="text-muted" style="font-size:11px;">By ${h.assignedBy} · ${h.assignedAt}</div>
    </div>`;
  }).join('');
}

function openCustomAccessModal() {
  if (!isCurrentUserAdmin()) {
    showToast('Only administrators can assign custom access templates', 'warning');
    return;
  }
  const userId = currentMatrixUserId || document.getElementById('matrix-user-select')?.value;
  if (!userId) {
    showToast('Select a user first', 'warning');
    return;
  }
  const u = db.users.find(x => x.id === userId);
  if (!u) return;

  selectedTemplateId = null;
  document.getElementById('ca-modal-user').textContent = u.name + ' · ' + u.email;
  document.getElementById('ca-template-preview').innerHTML = '<p class="text-muted" style="font-size:12px;">Select a template to preview permissions.</p>';
  document.getElementById('ca-assign-btn').disabled = true;

  const templates = (customPermCatalog?.permissionTemplates || []).filter(t => !t.adminOnly || isCurrentUserAdmin());

  document.getElementById('ca-template-list').innerHTML = templates.map(t => {
    const section = customPermCatalog.accessSections.find(s => s.id === t.section);
    const modCount = Object.keys(t.permissions || {}).length;
    return `<div class="ca-template-card" data-id="${t.id}" onclick="selectCustomTemplate('${t.id}')">
      <div class="ca-template-head">
        <span class="ca-template-label">${t.label}</span>
        ${t.adminOnly ? '<span class="badge badge-red" style="font-size:10px;">Admin</span>' : ''}
      </div>
      <div class="ca-template-desc">${t.description}</div>
      <div class="ca-template-meta">${section ? section.label : 'General'} · ${modCount} module(s)</div>
    </div>`;
  }).join('');

  document.getElementById('custom-access-modal').classList.add('show');
}

function closeCustomAccessModal() {
  document.getElementById('custom-access-modal')?.classList.remove('show');
  selectedTemplateId = null;
}

function selectCustomTemplate(templateId) {
  selectedTemplateId = templateId;
  document.querySelectorAll('.ca-template-card').forEach(c => {
    c.classList.toggle('selected', c.dataset.id === templateId);
  });
  const tpl = customPermCatalog.permissionTemplates.find(t => t.id === templateId);
  const preview = document.getElementById('ca-template-preview');
  const btn = document.getElementById('ca-assign-btn');
  if (!tpl || !preview) return;

  let html = `<div style="font-weight:600;margin-bottom:8px;color:var(--navy);">${tpl.label}</div>
    <p style="font-size:12px;color:var(--gray-600);margin:0 0 12px;">${tpl.description}</p>
    <table class="perm-table" style="font-size:12px;"><thead><tr><th class="mod-col">Module</th><th>Permissions</th></tr></thead><tbody>`;
  Object.entries(tpl.permissions).forEach(([modId, actions]) => {
    const mod = db.modules.find(m => m.id === modId);
    html += `<tr><td class="mod-col">${mod ? mod.label : modId}</td><td style="text-align:left;">${actions.map(a => ACTION_LABELS[a] || a).join(', ')}</td></tr>`;
  });
  html += '</tbody></table>';
  preview.innerHTML = html;
  if (btn) btn.disabled = false;
}

function assignCustomTemplate() {
  if (!selectedTemplateId || !currentMatrixUserId) return;
  const tpl = customPermCatalog.permissionTemplates.find(t => t.id === selectedTemplateId);
  const u = db.users.find(x => x.id === currentMatrixUserId);
  if (!tpl || !u) return;

  if (tpl.adminOnly && !isCurrentUserAdmin()) {
    showToast('This template requires administrator privileges', 'error');
    return;
  }

  if (!confirm(`Assign "${tpl.label}" to ${u.name}? This will merge permissions into their custom overrides.`)) return;

  if (!u.customPermissions) u.customPermissions = {};
  Object.entries(tpl.permissions).forEach(([modId, actions]) => {
    u.customPermissions[modId] = [...actions];
  });

  if (!u.customAccessAssignments) u.customAccessAssignments = [];
  u.customAccessAssignments.unshift({
    templateId: tpl.id,
    templateLabel: tpl.label,
    assignedBy: getAdminName(),
    assignedAt: new Date().toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  });

  pendingPerms = {};
  saveDB();
  closeCustomAccessModal();
  renderPermMatrix(currentMatrixUserId);
  renderAccessSections(currentMatrixUserId);
  renderAssignmentHistory(currentMatrixUserId);
  renderUsersTable();
  showToast(`"${tpl.label}" assigned to ${u.name}`, 'success');
}

function patchMatrixTabUI() {
  const assignBtn = document.getElementById('btn-assign-custom-access');
  if (assignBtn) assignBtn.style.display = isCurrentUserAdmin() ? 'inline-flex' : 'none';
}

async function initCustomPermsUI() {
  await loadCustomPermCatalog();
  patchMatrixTabUI();
  const id = (typeof currentMatrixUserId !== 'undefined' && currentMatrixUserId)
    ? currentMatrixUserId
    : document.getElementById('matrix-user-select')?.value;
  if (id && typeof db !== 'undefined') {
    renderAccessSections(id);
    renderAssignmentHistory(id);
  }
}
