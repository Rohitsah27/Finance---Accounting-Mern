import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function DashboardAdmin() {
  const { allUsers } = useAuth();
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <>
      {toast && (
        <div className={`veridex-toast veridex-toast-${toast.type}`}>
          <span>{toast.type === 'error' ? '✕' : '✓'}</span>
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header">
        <div>
          <div className="page-title">System Administrator Workspace</div>
          <div className="page-subtitle">
            Tenant configuration health, RBAC security, API integration telemetry, and database maintenance
          </div>
        </div>
        <div className="page-actions">
          <Link to="/admin-config" className="btn btn-primary btn-sm">Configuration Centre</Link>
          <Link to="/clear-all" className="btn btn-outline btn-sm" style={{ color: 'var(--red)', borderColor: 'rgba(220, 38, 38, 0.4)' }}>
            Database Reset
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '18px' }}>
        <div className="stat-card" style={{ borderTop: '3px solid #2e7d32' }}>
          <div className="stat-info">
            <div className="stat-label">Platform Readiness Score</div>
            <div className="stat-value" style={{ color: '#2e7d32' }}>92%</div>
            <div style={{ fontSize: '11px', color: '#2e7d32', fontWeight: 600 }}>Production Ready</div>
          </div>
        </div>

        <div className="stat-card" style={{ borderTop: '3px solid #1565c0' }}>
          <div className="stat-info">
            <div className="stat-label">Registered Users</div>
            <div className="stat-value" style={{ color: '#1565c0' }}>{allUsers?.length || 5}</div>
            <div style={{ fontSize: '11px', color: 'var(--color-muted)' }}>MFA Enforced</div>
          </div>
        </div>

        <div className="stat-card" style={{ borderTop: '3px solid #0d1b4b' }}>
          <div className="stat-info">
            <div className="stat-label">Config Version</div>
            <div className="stat-value" style={{ color: 'var(--navy)' }}>v7.0</div>
            <div style={{ fontSize: '11px', color: 'var(--color-muted)' }}>Multi-Tenant Published</div>
          </div>
        </div>

        <div className="stat-card" style={{ borderTop: '3px solid #6a1b9a' }}>
          <div className="stat-info">
            <div className="stat-label">Webhook Deliveries</div>
            <div className="stat-value" style={{ color: '#6a1b9a' }}>99.9%</div>
            <div style={{ fontSize: '11px', color: '#2e7d32', fontWeight: 600 }}>0 Failed Deliveries</div>
          </div>
        </div>
      </div>

      {/* Admin Modules & Settings Quick Navigation */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '18px' }}>
        <div className="card">
          <div style={{ fontSize: '13.5px', fontWeight: 700, marginBottom: '8px' }}>Identity &amp; RBAC Access</div>
          <p style={{ fontSize: '12px', color: 'var(--color-muted)', marginBottom: '14px', lineHeight: 1.5 }}>
            Manage user seats, invite team members, configure role permissions, and view authentication logs.
          </p>
          <Link to="/user-management" className="btn btn-outline btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
            Open User Management →
          </Link>
        </div>

        <div className="card">
          <div style={{ fontSize: '13.5px', fontWeight: 700, marginBottom: '8px' }}>API &amp; Webhook Hub</div>
          <p style={{ fontSize: '12px', color: 'var(--color-muted)', marginBottom: '14px', lineHeight: 1.5 }}>
            Issue API credentials, register webhook endpoints, and inspect inbound/outbound payload payloads.
          </p>
          <Link to="/api-integration-hub" className="btn btn-outline btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
            Open API Hub →
          </Link>
        </div>

        <div className="card">
          <div style={{ fontSize: '13.5px', fontWeight: 700, marginBottom: '8px' }}>Guided Setup Wizard</div>
          <p style={{ fontSize: '12px', color: 'var(--color-muted)', marginBottom: '14px', lineHeight: 1.5 }}>
            Interactive 5-stage setup interview for business profile, chart of accounts, and financial dimensions.
          </p>
          <Link to="/setup-wizard" className="btn btn-outline btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
            Launch Setup Wizard →
          </Link>
        </div>
      </div>
    </>
  );
}
