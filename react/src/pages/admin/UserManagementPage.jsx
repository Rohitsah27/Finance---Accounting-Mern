import React, { useState, useEffect, useRef } from 'react';
import { useConfig } from '../../context/ConfigContext';
import './user-management.css';

/* ================================================================
   DATA DEFINITION (exact match to user-management.html v5)
================================================================ */
const DEFAULT_DB = {
  modules: [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'chart-of-accounts', label: 'Chart of Accounts' },
    { id: 'journal-entry', label: 'Journal Entry', extraActions: ['post'] },
    { id: 'financial-statements', label: 'Financial Statements' },
    { id: 'bank-reconciliation', label: 'Bank Reconciliation' },
    { id: 'accounts-payable', label: 'Bank & AP/AR Hub' },
    { id: 'premium-claims', label: 'Premium & Claims' },
    { id: 'subledger', label: 'Subledger Processing' },
    { id: 'reinsurance', label: 'Reinsurance' },
    { id: 'statutory-reports', label: 'Statutory Reports', extraActions: ['file'] },
    { id: 'mga-operations', label: 'MGA Operations' },
    { id: 'compliance-filings', label: 'Compliance & Filings', extraActions: ['file'] },
    { id: 'period-locking', label: 'Period Locking', extraActions: ['lock', 'override'] },
    { id: 'audit-trail', label: 'Audit Trail' },
    { id: 'user-management', label: 'User Management' }
  ],
  stdActions: ['view', 'create', 'edit', 'approve', 'export'],
  roles: [
    {
      id: 'admin',
      label: 'Administrator',
      color: '#0d1b4b',
      description: 'Full system access - all modules and all actions including break-glass override and user management.',
      permissions: {
        dashboard: ['view', 'export'],
        'chart-of-accounts': ['view', 'create', 'edit', 'approve', 'export'],
        'journal-entry': ['view', 'create', 'edit', 'approve', 'export', 'post'],
        'financial-statements': ['view', 'export'],
        'bank-reconciliation': ['view', 'create', 'edit', 'approve', 'export'],
        'accounts-payable': ['view', 'create', 'edit', 'approve', 'export'],
        'premium-claims': ['view', 'create', 'edit', 'approve', 'export'],
        subledger: ['view', 'create', 'edit', 'approve', 'export'],
        reinsurance: ['view', 'create', 'edit', 'approve', 'export'],
        'statutory-reports': ['view', 'create', 'edit', 'approve', 'export', 'file'],
        'mga-operations': ['view', 'create', 'edit', 'approve', 'export'],
        'compliance-filings': ['view', 'create', 'edit', 'approve', 'export', 'file'],
        'period-locking': ['view', 'approve', 'export', 'lock', 'override'],
        'audit-trail': ['view', 'export'],
        'user-management': ['view', 'create', 'edit', 'approve', 'export']
      }
    },
    {
      id: 'cfo',
      label: 'CFO',
      color: '#1a237e',
      description: 'Strategic oversight - approve and export across all modules, break-glass on period locking.',
      permissions: {
        dashboard: ['view', 'export'],
        'chart-of-accounts': ['view', 'export'],
        'journal-entry': ['view', 'approve', 'export'],
        'financial-statements': ['view', 'export'],
        'bank-reconciliation': ['view', 'export'],
        'accounts-payable': ['view', 'approve', 'export'],
        'premium-claims': ['view', 'export'],
        subledger: ['view', 'export'],
        reinsurance: ['view', 'approve', 'export'],
        'statutory-reports': ['view', 'approve', 'export', 'file'],
        'mga-operations': ['view', 'approve', 'export'],
        'compliance-filings': ['view', 'approve', 'export', 'file'],
        'period-locking': ['view', 'approve', 'lock', 'override'],
        'audit-trail': ['view', 'export'],
        'user-management': ['view', 'export']
      }
    },
    {
      id: 'controller',
      label: 'Controller',
      color: '#1565c0',
      description: 'Day-to-day accounting control - create, edit, approve and post transactions; soft & hard period locks.',
      permissions: {
        dashboard: ['view', 'export'],
        'chart-of-accounts': ['view', 'create', 'edit', 'approve', 'export'],
        'journal-entry': ['view', 'create', 'edit', 'approve', 'export', 'post'],
        'financial-statements': ['view', 'export'],
        'bank-reconciliation': ['view', 'create', 'edit', 'approve', 'export'],
        'accounts-payable': ['view', 'create', 'edit', 'approve', 'export'],
        'premium-claims': ['view', 'create', 'edit', 'export'],
        subledger: ['view', 'create', 'edit', 'approve', 'export'],
        reinsurance: ['view', 'create', 'edit', 'export'],
        'statutory-reports': ['view', 'create', 'edit', 'approve', 'export', 'file'],
        'mga-operations': ['view', 'create', 'edit', 'approve', 'export'],
        'compliance-filings': ['view', 'create', 'edit', 'approve', 'export', 'file'],
        'period-locking': ['view', 'approve', 'lock'],
        'audit-trail': ['view', 'export'],
        'user-management': ['view']
      }
    },
    {
      id: 'accountant',
      label: 'Accountant',
      color: '#2e7d32',
      description: 'Create and edit transactions - submit for approval but cannot approve, post, or lock periods.',
      permissions: {
        dashboard: ['view'],
        'chart-of-accounts': ['view'],
        'journal-entry': ['view', 'create', 'edit', 'export'],
        'financial-statements': ['view'],
        'bank-reconciliation': ['view', 'create', 'edit'],
        'accounts-payable': ['view', 'create', 'edit', 'export'],
        'premium-claims': ['view'],
        subledger: ['view', 'create', 'edit'],
        reinsurance: ['view'],
        'statutory-reports': ['view'],
        'mga-operations': ['view', 'create', 'edit'],
        'compliance-filings': ['view'],
        'period-locking': ['view'],
        'audit-trail': ['view'],
        'user-management': []
      }
    },
    {
      id: 'auditor',
      label: 'Auditor',
      color: '#e65100',
      description: 'Read-only across all modules with full export rights - no data entry or approval authority.',
      permissions: {
        dashboard: ['view', 'export'],
        'chart-of-accounts': ['view', 'export'],
        'journal-entry': ['view', 'export'],
        'financial-statements': ['view', 'export'],
        'bank-reconciliation': ['view', 'export'],
        'accounts-payable': ['view', 'export'],
        'premium-claims': ['view', 'export'],
        subledger: ['view', 'export'],
        reinsurance: ['view', 'export'],
        'statutory-reports': ['view', 'export'],
        'mga-operations': ['view', 'export'],
        'compliance-filings': ['view', 'export'],
        'period-locking': ['view'],
        'audit-trail': ['view', 'export'],
        'user-management': ['view']
      }
    },
    {
      id: 'actuary',
      label: 'Actuary',
      color: '#6a1b9a',
      description: 'Specialist access - full control of premium, claims and reinsurance data; read-only elsewhere.',
      permissions: {
        dashboard: ['view'],
        'chart-of-accounts': [],
        'journal-entry': [],
        'financial-statements': ['view'],
        'bank-reconciliation': [],
        'accounts-payable': [],
        'premium-claims': ['view', 'create', 'edit', 'approve', 'export'],
        subledger: ['view', 'export'],
        reinsurance: ['view', 'create', 'edit', 'export'],
        'statutory-reports': ['view', 'export'],
        'mga-operations': ['view'],
        'compliance-filings': [],
        'period-locking': [],
        'audit-trail': ['view'],
        'user-management': []
      }
    }
  ],
  users: [
    {
      id: 'USR-001',
      name: 'John Doe',
      email: 'john.doe@southlake.com',
      initials: 'JD',
      avatarColor: '#0d1b4b',
      role: 'admin',
      department: 'IT',
      title: 'System Administrator',
      status: 'active',
      mfa: true,
      lastLogin: '21/05/2026 09:14',
      joinedDate: '01/01/2024',
      customPermissions: {}
    },
    {
      id: 'USR-002',
      name: 'Sarah Chen',
      email: 'sarah.chen@southlake.com',
      initials: 'SC',
      avatarColor: '#e05470',
      role: 'cfo',
      department: 'Finance',
      title: 'Chief Financial Officer',
      status: 'active',
      mfa: true,
      lastLogin: '21/05/2026 08:30',
      joinedDate: '15/03/2022',
      customPermissions: {}
    },
    {
      id: 'USR-003',
      name: 'James Smith',
      email: 'j.smith@southlake.com',
      initials: 'JS',
      avatarColor: '#1565c0',
      role: 'controller',
      department: 'Finance',
      title: 'Controller',
      status: 'active',
      mfa: true,
      lastLogin: '20/05/2026 17:42',
      joinedDate: '01/06/2022',
      customPermissions: {}
    },
    {
      id: 'USR-004',
      name: 'Maria Johnson',
      email: 'm.johnson@southlake.com',
      initials: 'MJ',
      avatarColor: '#2e7d32',
      role: 'controller',
      department: 'Finance',
      title: 'Assistant Controller',
      status: 'active',
      mfa: true,
      lastLogin: '21/05/2026 08:55',
      joinedDate: '12/08/2023',
      customPermissions: {}
    },
    {
      id: 'USR-005',
      name: 'Robert Patel',
      email: 'r.patel@southlake.com',
      initials: 'RP',
      avatarColor: '#e65100',
      role: 'accountant',
      department: 'Finance',
      title: 'Senior Accountant',
      status: 'active',
      mfa: false,
      lastLogin: '21/05/2026 09:02',
      joinedDate: '05/02/2024',
      customPermissions: { 'bank-reconciliation': ['view', 'create', 'edit', 'approve'] }
    },
    {
      id: 'USR-006',
      name: 'Emily Davis',
      email: 'e.davis@southlake.com',
      initials: 'ED',
      avatarColor: '#e65100',
      role: 'auditor',
      department: 'Compliance',
      title: 'Internal Auditor',
      status: 'active',
      mfa: true,
      lastLogin: '19/05/2026 14:20',
      joinedDate: '20/11/2023',
      customPermissions: {}
    },
    {
      id: 'USR-007',
      name: 'Michael Brown',
      email: 'm.brown@southlake.com',
      initials: 'MB',
      avatarColor: '#6a1b9a',
      role: 'actuary',
      department: 'Actuarial',
      title: 'Chief Actuary',
      status: 'active',
      mfa: true,
      lastLogin: '18/05/2026 11:05',
      joinedDate: '01/09/2021',
      customPermissions: {}
    },
    {
      id: 'USR-008',
      name: 'Lisa Wang',
      email: 'l.wang@southlake.com',
      initials: 'LW',
      avatarColor: '#0d1b4b',
      role: 'accountant',
      department: 'Operations',
      title: 'MGA Accounts Manager',
      status: 'inactive',
      mfa: false,
      lastLogin: '10/04/2026 09:30',
      joinedDate: '15/07/2024',
      customPermissions: {}
    }
  ],
  pendingInvites: [
    {
      id: 'INV-001',
      name: 'Alice Kumar',
      email: 'alice.kumar@southlake.com',
      role: 'accountant',
      department: 'Finance',
      invitedBy: 'John Doe',
      invitedDate: '20/05/2026',
      expiresDate: '27/05/2026',
      status: 'pending'
    },
    {
      id: 'INV-002',
      name: 'Tom Harris',
      email: 'tom.harris@southlake.com',
      role: 'auditor',
      department: 'Compliance',
      invitedBy: 'Sarah Chen',
      invitedDate: '19/05/2026',
      expiresDate: '26/05/2026',
      status: 'pending'
    }
  ]
};

const ALL_ACTIONS = ['view', 'create', 'edit', 'approve', 'export', 'post', 'file', 'lock', 'override'];
const ACTION_LABELS = {
  view: 'View', create: 'Create', edit: 'Edit', approve: 'Approve', export: 'Export',
  post: 'Post', file: 'File', lock: 'Lock', override: 'Override'
};
const LEVEL_LABELS = { full: 'Full Access', custom: 'Custom', read: 'Read Only', none: 'No Access' };
const LEVEL_ICONS = { full: '●', custom: '◑', read: '◔', none: '○' };
const ACTION_ICONS = {
  view: '👁', create: '➕', edit: '✏️', approve: '✅', export: '📤',
  post: '📋', file: '📁', lock: '🔒', override: '⚡'
};

const EXTRA_ACT_CATALOGUE = [
  { id: 'post', label: 'Post', icon: '📋', desc: 'Post entries to ledger' },
  { id: 'file', label: 'File', icon: '📁', desc: 'File statutory documents' },
  { id: 'lock', label: 'Lock', icon: '🔒', desc: 'Lock accounting periods' },
  { id: 'override', label: 'Override', icon: '⚡', desc: 'Break-glass period override' },
  { id: 'reconcile', label: 'Reconcile', icon: '🔄', desc: 'Reconcile account balances' },
  { id: 'void', label: 'Void', icon: '🚫', desc: 'Void posted transactions' },
  { id: 'reverse', label: 'Reverse', icon: '↩️', desc: 'Reverse journal entries' },
  { id: 'archive', label: 'Archive', icon: '🗄️', desc: 'Archive records' },
  { id: 'print', label: 'Print', icon: '🖨️', desc: 'Print reports and documents' },
  { id: 'download', label: 'Download', icon: '⬇️', desc: 'Download files and attachments' },
  { id: 'bulk-edit', label: 'Bulk Edit', icon: '📝', desc: 'Edit multiple records at once' },
  { id: 'restore', label: 'Restore', icon: '♻️', desc: 'Restore archived records' },
  { id: 'notify', label: 'Notify', icon: '🔔', desc: 'Send system notifications' },
  { id: 'schedule', label: 'Schedule', icon: '📅', desc: 'Schedule automated tasks' },
  { id: 'sign-off', label: 'Sign Off', icon: '✍️', desc: 'Sign off on reviews' },
  { id: 'submit', label: 'Submit', icon: '📨', desc: 'Submit for regulatory filing' },
  { id: 'review', label: 'Review', icon: '🔍', desc: 'Perform formal review' },
  { id: 'reopen', label: 'Reopen', icon: '🔓', desc: 'Reopen closed periods or records' },
  { id: 'flag', label: 'Flag', icon: '🚩', desc: 'Flag records for attention' },
  { id: 'delegate', label: 'Delegate', icon: '👥', desc: 'Delegate tasks to other users' },
];

export function UserManagementPage() {
  const [activeTab, setActiveTab] = useState('users');
  const [toast, setToast] = useState(null);
  const fileInputRef = useRef(null);

  // Toast notification
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Database State with LocalStorage synchronization
  const [db, setDb] = useState(() => {
    try {
      const saved = localStorage.getItem('sl_users_db');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_DB));
  });

  const saveDB = (newDb) => {
    setDb(newDb);
    localStorage.setItem('sl_users_db', JSON.stringify(newDb));
  };

  const hardReset = () => {
    localStorage.removeItem('sl_users_db');
    setDb(JSON.parse(JSON.stringify(DEFAULT_DB)));
    showToast('Database reset to defaults', 'info');
  };

  /* Users Tab Filters & Selection */
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  const filteredUsers = db.users.filter(u => {
    if (userSearch && !u.name.toLowerCase().includes(userSearch.toLowerCase()) && !u.email.toLowerCase().includes(userSearch.toLowerCase())) return false;
    if (roleFilter && u.role !== roleFilter) return false;
    if (statusFilter && u.status !== statusFilter) return false;
    return true;
  });

  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedUserIds(filteredUsers.map(u => u.id));
    } else {
      setSelectedUserIds([]);
    }
  };

  const toggleSelectUser = (id) => {
    if (selectedUserIds.includes(id)) {
      setSelectedUserIds(selectedUserIds.filter(i => i !== id));
    } else {
      setSelectedUserIds([...selectedUserIds, id]);
    }
  };

  const bulkDeactivate = () => {
    if (!selectedUserIds.length) return;
    const updatedUsers = db.users.map(u => selectedUserIds.includes(u.id) ? { ...u, status: 'inactive' } : u);
    saveDB({ ...db, users: updatedUsers });
    setSelectedUserIds([]);
    showToast(`${selectedUserIds.length} user(s) deactivated`, 'success');
  };

  const toggleUserStatus = (userId) => {
    const updatedUsers = db.users.map(u => {
      if (u.id === userId) {
        const nextStatus = u.status === 'active' ? 'inactive' : 'active';
        showToast(`${u.name} ${nextStatus === 'active' ? 'reactivated' : 'deactivated'}`, 'info');
        return { ...u, status: nextStatus };
      }
      return u;
    });
    saveDB({ ...db, users: updatedUsers });
  };

  /* Pending Invites Actions */
  const resendInvite = (id) => {
    const inv = db.pendingInvites.find(i => i.id === id);
    if (!inv) return;
    const today = new Date().toLocaleDateString('en-GB');
    const expires = new Date(Date.now() + 7 * 86400000).toLocaleDateString('en-GB');
    const updatedInvites = db.pendingInvites.map(i => i.id === id ? { ...i, invitedDate: today, expiresDate: expires } : i);
    saveDB({ ...db, pendingInvites: updatedInvites });
    showToast(`Invite resent to ${inv.email} - expiry extended to ${expires}`, 'success');
  };

  const revokeInvite = (id) => {
    const updatedInvites = db.pendingInvites.filter(i => i.id !== id);
    saveDB({ ...db, pendingInvites: updatedInvites });
    showToast('Invite revoked', 'info');
  };

  /* Slide Panel (Drawer) State */
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [panelMode, setPanelMode] = useState('invite'); // 'invite' | 'edit'
  const [panelUserId, setPanelUserId] = useState(null);
  const [panelTab, setPanelTab] = useState('profile'); // 'profile' | 'perms'

  // Panel Profile Form
  const [panelForm, setPanelForm] = useState({
    name: '', email: '', role: 'accountant', department: 'Finance', title: 'Staff Accountant',
    status: 'active', mfa: false, sendWelcome: true
  });
  const [panelPendingPerms, setPanelPendingPerms] = useState({});

  const openInvitePanel = () => {
    setPanelMode('invite');
    setPanelUserId(null);
    setPanelTab('profile');
    setPanelForm({
      name: '', email: '', role: 'accountant', department: 'Finance', title: 'Staff Accountant',
      status: 'active', mfa: false, sendWelcome: true
    });
    setPanelPendingPerms({});
    setIsPanelOpen(true);
  };

  const openEditPanel = (userId) => {
    const u = db.users.find(u => u.id === userId);
    if (!u) return;
    setPanelMode('edit');
    setPanelUserId(userId);
    setPanelTab('profile');
    setPanelForm({
      name: u.name,
      email: u.email,
      role: u.role,
      department: u.department,
      title: u.title,
      status: u.status,
      mfa: u.mfa,
      sendWelcome: false
    });
    setPanelPendingPerms({});
    setIsPanelOpen(true);
  };

  const closePanel = () => {
    setIsPanelOpen(false);
  };

  const handlePanelSave = () => {
    if (!panelForm.name.trim()) {
      showToast('Name is required', 'error');
      return;
    }
    if (panelMode === 'invite') {
      if (!panelForm.email.trim() || !panelForm.email.includes('@')) {
        showToast('Valid email is required', 'error');
        return;
      }
      const newInv = {
        id: 'INV-' + String(db.pendingInvites.length + 1).padStart(3, '0'),
        name: panelForm.name.trim(),
        email: panelForm.email.trim(),
        role: panelForm.role,
        department: panelForm.department || 'General',
        invitedBy: 'System Administrator',
        invitedDate: new Date().toLocaleDateString('en-GB'),
        expiresDate: new Date(Date.now() + 7 * 86400000).toLocaleDateString('en-GB'),
        status: 'pending'
      };
      saveDB({ ...db, pendingInvites: [...db.pendingInvites, newInv] });
      showToast(`Invite sent to ${newInv.email}`, 'success');
      closePanel();
    } else {
      // Edit User
      const updatedUsers = db.users.map(u => {
        if (u.id === panelUserId) {
          const initials = panelForm.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
          return {
            ...u,
            name: panelForm.name.trim(),
            role: panelForm.role,
            department: panelForm.department,
            title: panelForm.title,
            status: panelForm.status,
            mfa: panelForm.mfa,
            initials
          };
        }
        return u;
      });
      saveDB({ ...db, users: updatedUsers });
      showToast('User profile updated successfully', 'success');
      closePanel();
    }
  };

  const togglePanelPerm = (modId, action) => {
    const u = db.users.find(u => u.id === panelUserId);
    if (!u) return;
    const role = db.roles.find(r => r.id === u.role);
    const rolePerms = (role && role.permissions[modId]) ? role.permissions[modId] : [];
    const currentModPerms = panelPendingPerms[modId] !== undefined
      ? panelPendingPerms[modId]
      : ((u.customPermissions && u.customPermissions[modId] !== undefined) ? u.customPermissions[modId] : rolePerms);

    let nextPerms = [];
    if (currentModPerms.includes(action)) {
      nextPerms = currentModPerms.filter(a => a !== action);
    } else {
      nextPerms = [...currentModPerms, action];
    }

    setPanelPendingPerms(prev => ({ ...prev, [modId]: nextPerms }));
  };

  const savePanelPerms = () => {
    const u = db.users.find(u => u.id === panelUserId);
    if (!u) return;
    const nextCustom = { ...(u.customPermissions || {}), ...panelPendingPerms };
    const updatedUsers = db.users.map(user => user.id === panelUserId ? { ...user, customPermissions: nextCustom } : user);
    saveDB({ ...db, users: updatedUsers });
    setPanelPendingPerms({});
    showToast('Custom permissions saved', 'success');
  };

  const resetAllPanelPerms = () => {
    const updatedUsers = db.users.map(user => user.id === panelUserId ? { ...user, customPermissions: {} } : user);
    saveDB({ ...db, users: updatedUsers });
    setPanelPendingPerms({});
    showToast('Permissions reset to role defaults', 'info');
  };

  /* Matrix Tab State */
  const [matrixUserId, setMatrixUserId] = useState(db.users[0]?.id || 'USR-001');
  const [matrixPendingPerms, setMatrixPendingPerms] = useState({});

  const matrixUser = db.users.find(u => u.id === matrixUserId) || db.users[0];
  const matrixUserRole = db.roles.find(r => r.id === matrixUser?.role);

  const handleMatrixCbChange = (modId, action, checked) => {
    const rolePerms = matrixUserRole?.permissions[modId] || [];
    const current = matrixPendingPerms[modId] !== undefined
      ? matrixPendingPerms[modId]
      : (matrixUser.customPermissions?.[modId] !== undefined ? matrixUser.customPermissions[modId] : rolePerms);

    let next = [];
    if (checked) {
      if (!current.includes(action)) next = [...current, action];
      else next = [...current];
    } else {
      next = current.filter(a => a !== action);
    }
    setMatrixPendingPerms(prev => ({ ...prev, [modId]: next }));
  };

  const resetMatrixModulePerms = (modId) => {
    const nextCustom = { ...(matrixUser.customPermissions || {}) };
    delete nextCustom[modId];
    const updatedUsers = db.users.map(u => u.id === matrixUserId ? { ...u, customPermissions: nextCustom } : u);
    saveDB({ ...db, users: updatedUsers });
    const nextPending = { ...matrixPendingPerms };
    delete nextPending[modId];
    setMatrixPendingPerms(nextPending);
    showToast(`Reset ${modId} permissions to role default`, 'info');
  };

  const saveMatrixPerms = () => {
    const nextCustom = { ...(matrixUser.customPermissions || {}), ...matrixPendingPerms };
    const updatedUsers = db.users.map(u => u.id === matrixUserId ? { ...u, customPermissions: nextCustom } : u);
    saveDB({ ...db, users: updatedUsers });
    setMatrixPendingPerms({});
    showToast('Custom matrix permissions saved', 'success');
  };

  const resetAllMatrixPerms = () => {
    const updatedUsers = db.users.map(u => u.id === matrixUserId ? { ...u, customPermissions: {} } : u);
    saveDB({ ...db, users: updatedUsers });
    setMatrixPendingPerms({});
    showToast('All permissions reset to role defaults', 'info');
  };

  /* Role Modal (IAM Style) */
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [roleModalId, setRoleModalId] = useState(null);
  const [roleFormName, setRoleFormName] = useState('');
  const [roleFormDesc, setRoleFormDesc] = useState('');
  const [iamPerms, setIamPerms] = useState({});
  const [iamSearch, setIamSearch] = useState('');
  const [iamActiveFilter, setIamActiveFilter] = useState(null); // null | 'full' | 'custom' | 'read' | 'none'
  const [expandedRows, setExpandedRows] = useState({});

  const getAccessLevel = (modPerms = [], applicable = []) => {
    if (!modPerms || modPerms.length === 0) return 'none';
    if (modPerms.length === 1 && modPerms.includes('view')) return 'read';
    if (applicable.every(a => modPerms.includes(a))) return 'full';
    return 'custom';
  };

  const openRoleModal = (roleId) => {
    setRoleModalId(roleId);
    setIamSearch('');
    setIamActiveFilter(null);
    setExpandedRows({});
    if (roleId) {
      const r = db.roles.find(role => role.id === roleId);
      setRoleFormName(r?.label || '');
      setRoleFormDesc(r?.description || '');
      const perms = {};
      db.modules.forEach(m => {
        perms[m.id] = [...(r?.permissions[m.id] || [])];
      });
      setIamPerms(perms);
    } else {
      setRoleFormName('');
      setRoleFormDesc('');
      const perms = {};
      db.modules.forEach(m => {
        perms[m.id] = [];
      });
      setIamPerms(perms);
    }
    setIsRoleModalOpen(true);
  };

  const toggleIamDetail = (modId) => {
    setExpandedRows(prev => ({ ...prev, [modId]: !prev[modId] }));
  };

  const toggleIamAction = (modId, action) => {
    const current = iamPerms[modId] || [];
    let next = [];
    if (current.includes(action)) next = current.filter(a => a !== action);
    else next = [...current, action];
    setIamPerms(prev => ({ ...prev, [modId]: next }));
  };

  const setIamPreset = (modId, preset) => {
    const mod = db.modules.find(m => m.id === modId);
    const applicable = [...(db.stdActions || []), ...(mod?.extraActions || [])];
    let next = [];
    if (preset === 'full') next = [...applicable];
    else if (preset === 'read') next = ['view'];
    else next = [];
    setIamPerms(prev => ({ ...prev, [modId]: next }));
  };

  const setIamAll = (preset) => {
    const next = {};
    db.modules.forEach(m => {
      const applicable = [...(db.stdActions || []), ...(m.extraActions || [])];
      if (preset === 'full') next[m.id] = [...applicable];
      else if (preset === 'read') next[m.id] = ['view'];
      else next[m.id] = [];
    });
    setIamPerms(next);
  };

  const saveRoleModal = () => {
    if (!roleFormName.trim()) {
      showToast('Role name is required', 'error');
      return;
    }
    if (roleModalId) {
      const updatedRoles = db.roles.map(r => r.id === roleModalId ? {
        ...r,
        label: roleFormName.trim(),
        description: roleFormDesc.trim(),
        permissions: iamPerms
      } : r);
      saveDB({ ...db, roles: updatedRoles });
      showToast(`Role "${roleFormName}" updated`, 'success');
    } else {
      const newId = roleFormName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
      if (db.roles.some(r => r.id === newId)) {
        showToast('A role with this name already exists', 'error');
        return;
      }
      const newRole = {
        id: newId,
        label: roleFormName.trim(),
        color: '#607d8b',
        description: roleFormDesc.trim() || roleFormName.trim(),
        permissions: iamPerms
      };
      saveDB({ ...db, roles: [...db.roles, newRole] });
      showToast(`Role "${newRole.label}" created`, 'success');
    }
    setIsRoleModalOpen(false);
  };

  const deleteRole = () => {
    if (!roleModalId || roleModalId === 'admin') return;
    const inUse = db.users.filter(u => u.role === roleModalId).length;
    if (inUse > 0) {
      showToast(`Cannot delete: ${inUse} user(s) currently assigned this role`, 'error');
      return;
    }
    const r = db.roles.find(role => role.id === roleModalId);
    const updatedRoles = db.roles.filter(role => role.id !== roleModalId);
    saveDB({ ...db, roles: updatedRoles });
    setIsRoleModalOpen(false);
    showToast(`Role "${r?.label}" deleted`, 'info');
  };

  // Counts for IAM summary cards
  const calcSummaryCounts = () => {
    const counts = { full: 0, custom: 0, read: 0, none: 0 };
    db.modules.forEach(mod => {
      const applicable = [...(db.stdActions || []), ...(mod.extraActions || [])];
      const lvl = getAccessLevel(iamPerms[mod.id] || [], applicable);
      counts[lvl]++;
    });
    return counts;
  };
  const iamCounts = calcSummaryCounts();

  /* JSON Export & Import */
  const exportDataJSON = () => {
    const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `veridex-users-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    showToast('Database exported as JSON file', 'success');
  };

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (!parsed.users || !parsed.roles || !parsed.modules) {
          throw new Error('Invalid schema');
        }
        saveDB(parsed);
        showToast(`Imported ${parsed.users.length} users and ${parsed.roles.length} roles`, 'success');
      } catch (err) {
        showToast('Import failed: invalid JSON schema', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Stat counts
  const totalUsers = db.users.length;
  const activeCount = db.users.filter(u => u.status === 'active').length;
  const roleCount = db.roles.length;
  const inviteCount = db.pendingInvites.length;

  return (
    <div className="page-container">
      {/* Toast Alert */}
      {toast && (
        <div className={`veridex-toast veridex-toast-${toast.type}`}>
          <span>{toast.type === 'error' ? '✕' : '✓'}</span>
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Header */}
      <div className="page-header" style={{ marginBottom: '16px' }}>
        <div>
          <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            User Management
            <span style={{ fontSize: '10.5px', fontWeight: 700, background: '#0d1b4b', color: '#fff', borderRadius: '4px', padding: '2px 7px', letterSpacing: '.5px' }}>v5</span>
          </div>
          <div className="page-subtitle">
            Invite users · Manage roles · Custom per-user permissions · Data stored in localStorage
          </div>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline btn-sm" onClick={hardReset} style={{ color: '#ef4444', borderColor: '#fca5a5' }}>
            Reset Cache
          </button>
          <button className="btn btn-outline" onClick={exportDataJSON}>
            Export JSON
          </button>
          <button className="btn btn-outline" onClick={() => fileInputRef.current?.click()}>
            Import JSON
          </button>
          <input
            type="file"
            ref={fileInputRef}
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleImportFile}
          />
          <button className="btn btn-primary" onClick={openInvitePanel}>
            + Invite User
          </button>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
        <div className="stat-card">
          <div className="stat-icon si-navy">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="8" cy="7" r="3" stroke="#0d1b4b" strokeWidth="1.8" />
              <path d="M2 17c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="#0d1b4b" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M15 9a3 3 0 0 1 0 6" stroke="#0d1b4b" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </div>
          <div className="stat-info">
            <div className="stat-value">{totalUsers}</div>
            <div className="stat-label">Total Users</div>
            <div className="stat-change text-muted">{totalUsers} registered</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon si-green">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 10l3.5 3.5L15 6" stroke="#2e7d32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="stat-info">
            <div className="stat-value">{activeCount}</div>
            <div className="stat-label">Active Users</div>
            <div className="stat-change text-muted">{totalUsers - activeCount} inactive</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon si-coral">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="3" y="5" width="14" height="12" rx="2" stroke="#e05470" strokeWidth="1.8" />
              <path d="M7 5V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" stroke="#e05470" strokeWidth="1.8" />
            </svg>
          </div>
          <div className="stat-info">
            <div className="stat-value">{roleCount}</div>
            <div className="stat-label">Roles Defined</div>
            <div className="stat-change text-muted">Manage below</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon si-orange">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="7" stroke="#e65100" strokeWidth="1.8" />
              <path d="M10 7v3l2 2" stroke="#e65100" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </div>
          <div className="stat-info">
            <div className="stat-value">{inviteCount}</div>
            <div className="stat-label">Pending Invites</div>
            <div className="stat-change text-muted">Awaiting signup</div>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="page-tabs" style={{ marginBottom: 0, borderRadius: '8px 8px 0 0' }}>
        <button
          className={`page-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Users
        </button>
        <button
          className={`page-tab ${activeTab === 'roles' ? 'active' : ''}`}
          onClick={() => setActiveTab('roles')}
        >
          Roles &amp; Permissions
        </button>
        <button
          className={`page-tab ${activeTab === 'matrix' ? 'active' : ''}`}
          onClick={() => setActiveTab('matrix')}
        >
          Custom Permissions
        </button>
      </div>

      {/* TAB 1: USERS */}
      {activeTab === 'users' && (
        <div className="card" style={{ borderRadius: '0 0 8px 8px', padding: '20px' }}>
          {/* Filters Bar */}
          <div className="filter-bar" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="text"
              className="filter-input"
              placeholder="Search name or email…"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              style={{ width: '240px' }}
            />
            <select
              className="filter-select"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">All Roles</option>
              {db.roles.map(r => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </select>
            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <div style={{ flex: 1 }} />

            {selectedUserIds.length > 0 && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={bulkDeactivate}
                style={{ color: '#dc2626' }}
              >
                Deactivate Selected ({selectedUserIds.length})
              </button>
            )}
          </div>

          {/* Users Table */}
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '32px' }}>
                  <input
                    type="checkbox"
                    checked={selectedUserIds.length === filteredUsers.length && filteredUsers.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th>User</th>
                <th>Role</th>
                <th>Department</th>
                <th>Title</th>
                <th>Status</th>
                <th>MFA</th>
                <th>Last Login</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => {
                const role = db.roles.find(r => r.id === u.role);
                const rc = role?.color || '#666';
                const hasCustom = Object.keys(u.customPermissions || {}).length > 0;
                return (
                  <tr key={u.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedUserIds.includes(u.id)}
                        onChange={() => toggleSelectUser(u.id)}
                      />
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="u-avatar" style={{ background: u.avatarColor }}>
                          {u.initials}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '13px' }}>{u.name}</div>
                          <div style={{ fontSize: '11.5px', color: 'var(--gray-500)' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background: `${rc}18`,
                          color: rc,
                          border: `1px solid ${rc}35`
                        }}
                      >
                        {role ? role.label : u.role}
                      </span>
                      {hasCustom && (
                        <span className="badge badge-amber" style={{ fontSize: '10px', marginLeft: '4px' }}>
                          Custom
                        </span>
                      )}
                    </td>
                    <td>{u.department}</td>
                    <td style={{ fontSize: '12.5px', color: 'var(--gray-600)' }}>{u.title}</td>
                    <td>
                      <span className={`badge ${u.status === 'active' ? 'badge-green' : 'badge-gray'}`}>
                        {u.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      {u.mfa ? (
                        <span className="badge badge-green" style={{ fontSize: '10px' }}>✓ MFA</span>
                      ) : (
                        <span className="badge badge-orange" style={{ fontSize: '10px' }}>No MFA</span>
                      )}
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{u.lastLogin}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-outline btn-sm"
                        style={{ marginRight: '6px' }}
                        onClick={() => openEditPanel(u.id)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => toggleUserStatus(u.id)}
                      >
                        {u.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pending Invites Section */}
          {db.pendingInvites.length > 0 && (
            <div style={{ marginTop: '28px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-ink, #0f172a)', marginBottom: '12px' }}>
                Pending Invites ({db.pendingInvites.length})
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Dept</th>
                    <th>Invited By</th>
                    <th>Sent</th>
                    <th>Expires</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {db.pendingInvites.map(inv => {
                    const role = db.roles.find(r => r.id === inv.role);
                    return (
                      <tr key={inv.id}>
                        <td style={{ fontWeight: 600 }}>{inv.name}</td>
                        <td style={{ fontSize: '12.5px', color: 'var(--gray-600)' }}>{inv.email}</td>
                        <td>
                          <span className="badge badge-gray">{role ? role.label : inv.role}</span>
                        </td>
                        <td>{inv.department}</td>
                        <td>{inv.invitedBy}</td>
                        <td style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{inv.invitedDate}</td>
                        <td style={{ fontSize: '12px', color: '#e05470' }}>{inv.expiresDate}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="btn btn-outline btn-sm"
                            style={{ marginRight: '6px' }}
                            onClick={() => resendInvite(inv.id)}
                          >
                            Resend
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => revokeInvite(inv.id)}
                          >
                            Revoke
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ROLES & PERMISSIONS */}
      {activeTab === 'roles' && (
        <div className="card" style={{ borderRadius: '0 0 8px 8px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-ink, #0f172a)' }}>
                Roles &amp; Permission Sets
              </div>
              <div style={{ fontSize: '12px', color: 'var(--gray-500)', marginTop: '2px' }}>
                Click &ldquo;Edit Permissions&rdquo; on any role to configure the full IAM-style permission matrix.
              </div>
            </div>
          </div>

          <div className="roles-grid">
            {db.roles.map(role => {
              const count = db.users.filter(u => u.role === role.id).length;
              const permTot = Object.values(role.permissions).reduce((s, a) => s + a.length, 0);
              const modCount = Object.values(role.permissions).filter(a => a.length > 0).length;
              const topMods = Object.entries(role.permissions)
                .filter(([, a]) => a.length > 0).slice(0, 3)
                .map(([id]) => {
                  const m = db.modules.find(mod => mod.id === id);
                  return m ? m.label : id;
                });

              return (
                <div key={role.id} className="role-card" style={{ borderTop: `3px solid ${role.color}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                    <span className="role-dot" style={{ background: role.color }} />
                    <span style={{ fontSize: '14px', fontWeight: 700, flex: 1, color: 'var(--gray-900)' }}>
                      {role.label}
                    </span>
                    <span className="badge badge-gray">{count} user{count !== 1 ? 's' : ''}</span>
                  </div>

                  <div style={{ fontSize: '12px', color: 'var(--gray-500)', marginBottom: '10px', lineHeight: 1.55 }}>
                    {role.description}
                  </div>

                  <div style={{ fontSize: '11px', color: 'var(--gray-400)', marginBottom: '6px' }}>
                    {modCount} modules · {permTot} permissions
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '14px' }}>
                    {topMods.map(m => (
                      <span
                        key={m}
                        style={{ fontSize: '10px', background: '#f0f4ff', color: '#0d1b4b', borderRadius: '4px', padding: '2px 7px' }}
                      >
                        {m}
                      </span>
                    ))}
                    {modCount > 3 && (
                      <span style={{ fontSize: '10px', color: 'var(--gray-400)' }}>
                        +{modCount - 3} more
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => openRoleModal(role.id)}
                    >
                      Edit Permissions
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        setRoleFilter(role.id);
                        setActiveTab('users');
                      }}
                    >
                      View Users
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Create New Role Card */}
            <div className="role-card-new" onClick={() => openRoleModal(null)}>
              <div style={{ fontSize: '28px', color: 'var(--gray-300)', marginBottom: '8px', lineHeight: 1 }}>+</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gray-400)' }}>Create New Role</div>
              <div style={{ fontSize: '11.5px', color: 'var(--gray-300)', marginTop: '4px' }}>Define custom permissions</div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CUSTOM PERMISSIONS MATRIX */}
      {activeTab === 'matrix' && (
        <div className="card" style={{ borderRadius: '0 0 8px 8px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '14px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gray-700)' }}>
              Viewing permissions for:
            </span>
            <select
              className="filter-select"
              value={matrixUserId}
              onChange={(e) => {
                setMatrixUserId(e.target.value);
                setMatrixPendingPerms({});
              }}
              style={{ minWidth: '240px' }}
            >
              {db.users.map(u => {
                const r = db.roles.find(role => role.id === u.role);
                return (
                  <option key={u.id} value={u.id}>
                    {u.name} ({r ? r.label : u.role})
                  </option>
                );
              })}
            </select>

            {matrixUserRole && (
              <span className="badge" style={{ background: matrixUserRole.color, color: '#fff' }}>
                {matrixUserRole.label}
              </span>
            )}

            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '14px', fontSize: '11.5px', color: 'var(--gray-500)' }}>
              <span>
                <span className="legend-dot" style={{ background: '#e3f0ff', border: '1px solid #90caf9' }} />
                From role
              </span>
              <span>
                <span className="legend-dot" style={{ background: '#fffde7', border: '1px solid #f9a825' }} />
                Custom override
              </span>
            </div>
          </div>

          <table className="perm-table">
            <thead>
              <tr>
                <th className="mod-col">Module</th>
                {ALL_ACTIONS.map(a => (
                  <th key={a}>{ACTION_LABELS[a]}</th>
                ))}
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {db.modules.map(mod => {
                const applicable = [...(db.stdActions || []), ...(mod.extraActions || [])];
                const rolePerms = matrixUserRole?.permissions[mod.id] || [];
                const hasSavedCustom = matrixUser.customPermissions && matrixUser.customPermissions[mod.id] !== undefined;
                const isPendingOverride = matrixPendingPerms[mod.id] !== undefined;
                const isCustom = hasSavedCustom || isPendingOverride;

                const effective = isPendingOverride
                  ? matrixPendingPerms[mod.id]
                  : (hasSavedCustom ? matrixUser.customPermissions[mod.id] : rolePerms);

                return (
                  <tr key={mod.id} className={isCustom ? 'custom-row' : ''}>
                    <td className="mod-col">{mod.label}</td>
                    {ALL_ACTIONS.map(action => {
                      if (!applicable.includes(action)) {
                        return (
                          <td key={action}>
                            <span style={{ color: 'var(--gray-300)', fontSize: '12px' }}>-</span>
                          </td>
                        );
                      }
                      return (
                        <td key={action}>
                          <input
                            type="checkbox"
                            className="perm-cb"
                            checked={effective.includes(action)}
                            onChange={(e) => handleMatrixCbChange(mod.id, action, e.target.checked)}
                          />
                        </td>
                      );
                    })}
                    <td>
                      {isCustom ? (
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ fontSize: '10.5px', padding: '3px 8px' }}
                          onClick={() => resetMatrixModulePerms(mod.id)}
                        >
                          Reset
                        </button>
                      ) : (
                        <span style={{ fontSize: '11px', color: 'var(--gray-400)' }}>Role</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
            <button className="btn btn-primary" onClick={saveMatrixPerms}>
              Save Custom Permissions
            </button>
            <button className="btn btn-outline" onClick={resetAllMatrixPerms}>
              Reset All to Role Defaults
            </button>
          </div>
        </div>
      )}

      {/* SLIDE-OUT PANEL (Invite & Edit Drawer) */}
      <div className={`panel-overlay ${isPanelOpen ? 'show' : ''}`} onClick={closePanel} />
      <div className={`slide-panel ${isPanelOpen ? 'open' : ''}`}>
        <div className="panel-head">
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--gray-900)' }}>
              {panelMode === 'invite' ? 'Invite New User' : `Edit User: ${panelForm.name}`}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--gray-500)', marginTop: '2px' }}>
              {panelMode === 'invite' ? 'Send email invite with login instructions' : panelForm.email}
            </div>
          </div>
          <button className="x-btn" onClick={closePanel}>×</button>
        </div>

        {panelMode === 'edit' && (
          <div className="ptabs-bar">
            <button
              className={`ptab ${panelTab === 'profile' ? 'active' : ''}`}
              onClick={() => setPanelTab('profile')}
            >
              Profile
            </button>
            <button
              className={`ptab ${panelTab === 'perms' ? 'active' : ''}`}
              onClick={() => setPanelTab('perms')}
            >
              Permissions
            </button>
          </div>
        )}

        <div className="panel-body">
          {panelTab === 'profile' ? (
            <div className="ptab-body">
              <label className="f-label">Full Name *</label>
              <input
                className="f-input"
                value={panelForm.name}
                onChange={(e) => setPanelForm({ ...panelForm, name: e.target.value })}
                placeholder="e.g. Alice Kumar"
              />

              <label className="f-label">Email Address *</label>
              <input
                className="f-input"
                type="email"
                value={panelForm.email}
                disabled={panelMode === 'edit'}
                onChange={(e) => setPanelForm({ ...panelForm, email: e.target.value })}
                placeholder="alice@southlake.com"
              />

              <label className="f-label">Role *</label>
              <select
                className="f-select"
                value={panelForm.role}
                onChange={(e) => setPanelForm({ ...panelForm, role: e.target.value })}
              >
                {db.roles.map(r => (
                  <option key={r.id} value={r.id}>{r.label}</option>
                ))}
              </select>

              <label className="f-label">Department</label>
              <input
                className="f-input"
                value={panelForm.department}
                onChange={(e) => setPanelForm({ ...panelForm, department: e.target.value })}
                placeholder="e.g. Finance"
              />

              <label className="f-label">Job Title</label>
              <input
                className="f-input"
                value={panelForm.title}
                onChange={(e) => setPanelForm({ ...panelForm, title: e.target.value })}
                placeholder="e.g. Staff Accountant"
              />

              {panelMode === 'invite' ? (
                <>
                  <div className="tog-wrap" style={{ marginTop: '18px' }}>
                    <label className="tog">
                      <input
                        type="checkbox"
                        checked={panelForm.sendWelcome}
                        onChange={(e) => setPanelForm({ ...panelForm, sendWelcome: e.target.checked })}
                      />
                      <span className="tog-sl" />
                    </label>
                    <span style={{ fontSize: '13px', color: 'var(--gray-700)' }}>
                      Send welcome email with login link
                    </span>
                  </div>
                  <div className="tog-wrap">
                    <label className="tog">
                      <input
                        type="checkbox"
                        checked={panelForm.mfa}
                        onChange={(e) => setPanelForm({ ...panelForm, mfa: e.target.checked })}
                      />
                      <span className="tog-sl" />
                    </label>
                    <span style={{ fontSize: '13px', color: 'var(--gray-700)' }}>
                      Require MFA on first login
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <hr className="f-divider" />
                  <div className="tog-wrap" style={{ marginTop: 0 }}>
                    <label className="tog">
                      <input
                        type="checkbox"
                        checked={panelForm.status === 'active'}
                        onChange={(e) => setPanelForm({ ...panelForm, status: e.target.checked ? 'active' : 'inactive' })}
                      />
                      <span className="tog-sl" />
                    </label>
                    <span style={{ fontSize: '13px', color: 'var(--gray-700)' }}>
                      Account Active
                    </span>
                  </div>
                  <div className="tog-wrap">
                    <label className="tog">
                      <input
                        type="checkbox"
                        checked={panelForm.mfa}
                        onChange={(e) => setPanelForm({ ...panelForm, mfa: e.target.checked })}
                      />
                      <span className="tog-sl" />
                    </label>
                    <span style={{ fontSize: '13px', color: 'var(--gray-700)' }}>
                      Require MFA
                    </span>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="ptab-body" style={{ padding: '14px' }}>
              <div style={{ fontSize: '11.5px', color: 'var(--gray-500)', marginBottom: '10px', lineHeight: 1.5 }}>
                Click chips to toggle permissions for <strong>{panelForm.name}</strong>. Yellow rows indicate custom overrides.
              </div>

              {db.modules.map(mod => {
                const applicable = [...(db.stdActions || []), ...(mod.extraActions || [])];
                const editingUser = db.users.find(u => u.id === panelUserId);
                const roleObj = db.roles.find(r => r.id === editingUser?.role);
                const rolePerms = roleObj?.permissions[mod.id] || [];
                const hasCustom = (editingUser?.customPermissions && editingUser.customPermissions[mod.id] !== undefined) || panelPendingPerms[mod.id] !== undefined;

                const effective = panelPendingPerms[mod.id] !== undefined
                  ? panelPendingPerms[mod.id]
                  : (editingUser?.customPermissions?.[mod.id] !== undefined ? editingUser.customPermissions[mod.id] : rolePerms);

                return (
                  <div key={mod.id} className={`panel-perm-row ${hasCustom ? 'custom' : ''}`}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--gray-800)' }}>{mod.label}</div>
                      {hasCustom && (
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ fontSize: '10px', padding: '2px 6px' }}
                          onClick={() => {
                            const nextPending = { ...panelPendingPerms, [mod.id]: [...rolePerms] };
                            setPanelPendingPerms(nextPending);
                          }}
                        >
                          Reset
                        </button>
                      )}
                    </div>
                    <div>
                      {applicable.map(a => (
                        <span
                          key={a}
                          className={`perm-chip ${effective.includes(a) ? 'on' : ''}`}
                          onClick={() => togglePanelPerm(mod.id, a)}
                        >
                          {ACTION_ICONS[a] || ''} {ACTION_LABELS[a] || a}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="panel-foot">
          {panelTab === 'profile' ? (
            <>
              <button className="btn btn-primary" onClick={handlePanelSave}>
                {panelMode === 'invite' ? 'Send Invite' : 'Save Changes'}
              </button>
              <button className="btn btn-outline" onClick={closePanel}>
                Cancel
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-primary" onClick={savePanelPerms}>
                Save Permissions
              </button>
              <button className="btn btn-outline" onClick={resetAllPanelPerms}>
                Reset All to Role
              </button>
              <button className="btn btn-outline" onClick={closePanel}>
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {/* ROLE MODAL (IAM Matrix Editor) */}
      {isRoleModalOpen && (
        <div className="modal-overlay show">
          <div className="modal-box" style={{ width: '960px', maxWidth: '97vw', maxHeight: '92vh' }}>
            <div className="modal-head">
              <div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--gray-900)' }}>
                  {roleModalId ? `Edit Role: ${roleFormName}` : 'New Role'}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--gray-500)', marginTop: '2px' }}>
                  {roleModalId ? roleFormDesc : 'Set role details and configure IAM permissions below.'}
                </div>
              </div>
              <button className="x-btn" onClick={() => setIsRoleModalOpen(false)}>×</button>
            </div>

            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px', marginBottom: '18px' }}>
                <div>
                  <label className="f-label" style={{ marginTop: 0 }}>Role Name *</label>
                  <input
                    className="f-input"
                    value={roleFormName}
                    onChange={(e) => setRoleFormName(e.target.value)}
                    placeholder="e.g. Compliance Officer"
                  />
                </div>
                <div>
                  <label className="f-label" style={{ marginTop: 0 }}>Description</label>
                  <input
                    className="f-input"
                    value={roleFormDesc}
                    onChange={(e) => setRoleFormDesc(e.target.value)}
                    placeholder="Brief description of responsibilities"
                  />
                </div>
              </div>

              {/* Summary Cards */}
              <div className="iam-summary">
                {['full', 'custom', 'read', 'none'].map(lvl => (
                  <div
                    key={lvl}
                    className={`iam-sum-card ${lvl} ${iamActiveFilter === lvl ? 'active-filter' : ''}`}
                    onClick={() => setIamActiveFilter(iamActiveFilter === lvl ? null : lvl)}
                  >
                    <div style={{ fontSize: '26px', fontWeight: 800, lineHeight: 1 }}>{iamCounts[lvl]}</div>
                    <div style={{ fontSize: '11px', fontWeight: 600, opacity: 0.8, marginTop: '3px' }}>{LEVEL_LABELS[lvl]}</div>
                  </div>
                ))}
              </div>

              {/* IAM Action Bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="Filter modules…"
                  value={iamSearch}
                  onChange={(e) => setIamSearch(e.target.value)}
                  style={{
                    padding: '6px 10px',
                    border: '1.5px solid var(--color-border, #e2e8f0)',
                    borderRadius: '6px',
                    fontSize: '12.5px',
                    flex: 1,
                    minWidth: '140px',
                    outline: 'none'
                  }}
                />
                <button className="btn btn-ghost btn-sm" onClick={() => setIamAll('full')}>All Full</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setIamAll('read')}>All Read</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setIamAll('none')}>All None</button>
                {(iamSearch || iamActiveFilter) && (
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ color: '#ef4444' }}
                    onClick={() => {
                      setIamSearch('');
                      setIamActiveFilter(null);
                    }}
                  >
                    ✕ Clear Filter
                  </button>
                )}
              </div>

              {/* Modules IAM Table */}
              <div style={{ border: '1.5px solid var(--color-border, #e2e8f0)', borderRadius: '9px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ background: '#f8f9fb' }}>
                    <tr>
                      <th style={{ width: '36px', padding: '8px 12px' }} />
                      <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: '10.5px', fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase' }}>Module</th>
                      <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: '10.5px', fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase' }}>Access Level</th>
                      <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: '10.5px', fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase' }}>Granted Actions</th>
                      <th style={{ textAlign: 'center', padding: '8px 12px', fontSize: '10.5px', fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase' }}>Quick Set</th>
                    </tr>
                  </thead>
                  <tbody>
                    {db.modules.filter(m => {
                      if (iamSearch && !m.label.toLowerCase().includes(iamSearch.toLowerCase())) return false;
                      const applicable = [...(db.stdActions || []), ...(m.extraActions || [])];
                      const level = getAccessLevel(iamPerms[m.id] || [], applicable);
                      if (iamActiveFilter && level !== iamActiveFilter) return false;
                      return true;
                    }).map(mod => {
                      const applicable = [...(db.stdActions || []), ...(mod.extraActions || [])];
                      const modPerms = iamPerms[mod.id] || [];
                      const level = getAccessLevel(modPerms, applicable);
                      const isExpanded = !!expandedRows[mod.id];

                      return (
                        <React.Fragment key={mod.id}>
                          <tr className="iam-mod-row">
                            <td style={{ padding: '8px 12px' }}>
                              <button
                                className={`iam-expand-btn ${isExpanded ? 'open' : ''}`}
                                onClick={() => toggleIamDetail(mod.id)}
                              >
                                ▶
                              </button>
                            </td>
                            <td style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gray-800)', padding: '8px 12px' }}>
                              {mod.label}
                            </td>
                            <td style={{ padding: '8px 12px' }}>
                              <span className={`iam-level-badge ${level}`}>
                                {LEVEL_ICONS[level]} {LEVEL_LABELS[level]}
                              </span>
                            </td>
                            <td style={{ padding: '8px 12px' }}>
                              {modPerms.length > 0 ? (
                                modPerms.map(a => (
                                  <span
                                    key={a}
                                    style={{
                                      fontSize: '10px',
                                      background: '#e3f2fd',
                                      color: '#1565c0',
                                      borderRadius: '4px',
                                      padding: '1px 7px',
                                      margin: '1px',
                                      display: 'inline-block'
                                    }}
                                  >
                                    {ACTION_ICONS[a] || ''} {ACTION_LABELS[a] || a}
                                  </span>
                                ))
                              ) : (
                                <span style={{ fontSize: '11px', color: 'var(--gray-400)' }}>No access</span>
                              )}
                            </td>
                            <td style={{ textAlign: 'center', padding: '8px 12px' }}>
                              <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                <button className="iam-preset full" onClick={() => setIamPreset(mod.id, 'full')}>Full</button>
                                <button className="iam-preset read" onClick={() => setIamPreset(mod.id, 'read')}>Read</button>
                                <button className="iam-preset none" onClick={() => setIamPreset(mod.id, 'none')}>None</button>
                              </div>
                            </td>
                          </tr>

                          {/* Expanded detail row with action tiles */}
                          {isExpanded && (
                            <tr className="iam-detail-row open">
                              <td colSpan={5} style={{ padding: 0, borderBottom: '1px solid var(--color-border, #e2e8f0)', background: '#fafbff' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '6px', padding: '12px 16px' }}>
                                  {applicable.map(a => (
                                    <div
                                      key={a}
                                      className={`iam-action-item ${modPerms.includes(a) ? 'on' : ''}`}
                                      onClick={() => toggleIamAction(mod.id, a)}
                                    >
                                      <span style={{ fontSize: '18px', lineHeight: 1 }}>{ACTION_ICONS[a] || '●'}</span>
                                      <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--gray-800)' }}>
                                          {ACTION_LABELS[a] || a}
                                        </div>
                                      </div>
                                      <span style={{ fontSize: '13px', color: '#1565c0', fontWeight: 700, opacity: modPerms.includes(a) ? 1 : 0 }}>
                                        ✓
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="modal-foot">
              {roleModalId && roleModalId !== 'admin' && (
                <button className="btn btn-ghost" onClick={deleteRole} style={{ marginRight: 'auto', color: '#ef4444' }}>
                  Delete Role
                </button>
              )}
              <button className="btn btn-outline" onClick={() => setIsRoleModalOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={saveRoleModal}>
                Save Role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagementPage;
