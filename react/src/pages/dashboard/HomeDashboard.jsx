import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { HOME_CHECKLIST_ITEMS, visibleModulesForBusinessType } from '../../data/navigation';

export function HomeDashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const visibleModules = visibleModulesForBusinessType(currentUser?.businessType);

  const [checklistState, setChecklistState] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('v_home_checklist') || '{}');
    } catch {
      return { 'review-coa': true, 'import-data': false, 'invite-team': false, 'connect-bank': true };
    }
  });

  const toggleChecklistItem = (id) => {
    setChecklistState(prev => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem('v_home_checklist', JSON.stringify(next));
      return next;
    });
  };

  return (
    <>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title" id="home-greeting">
            Welcome back, {currentUser?.name || 'Jordan Blake'}.
          </h1>
          <div className="page-subtitle" id="home-sub">
            {currentUser?.entityName || 'My Business'} — {currentUser?.businessLabel || 'MGA / Program Manager'}
          </div>
        </div>
        <div className="page-actions">
          <button
            className="btn btn-primary"
            id="home-dashboard-btn"
            onClick={() => navigate('/workspaces')}
          >
            Go to {currentUser?.roleLabel || 'Business Owner'} dashboard →
          </button>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="stats-row" id="home-stats">
        <div className="stat-card">
          <div className="stat-icon">✓</div>
          <div className="stat-info">
            <div className="stat-value">{visibleModules.length}</div>
            <div className="stat-label">Modules active</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">◈</div>
          <div className="stat-info">
            <div className="stat-value">4</div>
            <div className="stat-label">Entities registered</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">%</div>
          <div className="stat-info">
            <div className="stat-value">92%</div>
            <div className="stat-label">Setup readiness</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">★</div>
          <div className="stat-info">
            <div className="stat-value">Published</div>
            <div className="stat-label">System version 7</div>
          </div>
        </div>
      </div>

      {/* Dashboard Two-Column Layout */}
      <div className="v-dashboard-layout">
        {/* Left Column: Platform Modules */}
        <div>
          <div className="table-wrap" style={{ marginBottom: 0 }}>
            <div className="table-head-row">
              <div className="table-head-title">Platform Modules</div>
              <div className="table-head-actions">
                <Link to="/admin-config" className="btn btn-secondary btn-sm">
                  Configure Modules
                </Link>
              </div>
            </div>
            <div className="v-module-grid" id="home-module-grid" style={{ padding: '20px' }}>
              {visibleModules.map((m) => (
                <Link
                  key={m.id}
                  className="v-module-card"
                  to={m.href}
                  style={{ textDecoration: 'none' }}
                >
                  <div className="v-module-card-top">
                    <div className="v-module-card-icon">{m.no}</div>
                  </div>
                  <div className="v-module-card-title">{m.label}</div>
                  <div className="v-module-card-desc">{m.desc}</div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Setup Steps & Entity Configuration */}
        <div>
          {/* Recommended Setup Steps */}
          <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-ink)', marginBottom: '12px' }}>
              Recommended Setup Steps
            </div>
            <div id="home-checklist">
              {HOME_CHECKLIST_ITEMS.map((item) => {
                const isChecked = Boolean(checklistState[item.id]);
                return (
                  <label
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '9px',
                      padding: '8px 0',
                      fontSize: '13px',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--color-surface)'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleChecklistItem(item.id)}
                      style={{ width: '16px', height: '16px', accentColor: 'var(--color-brand)' }}
                    />
                    <Link
                      to={item.href}
                      style={{
                        flex: 1,
                        color: isChecked ? 'var(--color-muted)' : 'var(--color-ink)',
                        textDecoration: isChecked ? 'line-through' : 'none'
                      }}
                    >
                      {item.label}
                    </Link>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Entity Configuration */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-ink)', marginBottom: '10px' }}>
              Entity Configuration
            </div>
            <div style={{ fontSize: '13px', color: 'var(--color-ink-secondary)', lineHeight: 1.6 }}>
              <div>
                <strong style={{ color: 'var(--color-ink)' }}>
                  {currentUser?.entityName || 'My Business'}
                </strong>
              </div>
              <div style={{ marginTop: '2px', color: 'var(--color-muted)' }}>
                {currentUser?.businessLabel || 'MGA / Program Manager'}
              </div>
              <div style={{ marginTop: '10px' }}>
                Chart of Accounts:{' '}
                <strong style={{ color: 'var(--color-ink)' }}>
                  US Insurance MGA Statutory Standard
                </strong>
              </div>
            </div>
            <Link
              to="/admin-config"
              className="btn btn-ghost btn-sm"
              style={{ marginTop: '14px', width: '100%', justifyContent: 'center' }}
            >
              View entity structure →
            </Link>
          </div>

          {/* Switch Workspace Callout */}
          <div className="callout-banner callout-info" style={{ marginTop: '20px' }}>
            <span className="callout-icon">ⓘ</span>
            <div className="callout-content">
              Explore workflows across other insurance business models:
              <Link to="/workspaces" style={{ fontWeight: 600, whiteSpace: 'nowrap', marginLeft: '4px' }}>
                Switch Workspace →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
