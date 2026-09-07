import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function RoleSelectPage() {
  const navigate = useNavigate();
  const { currentUser, switchRole, allUsers } = useAuth();

  const ENTITIES = [
    {
      id: 'ENT-MINE',
      name: 'My Business',
      businessType: 'mga',
      typeLabel: 'MGA / Program Manager',
      desc: 'Delegated underwriting authority, binder invoicing, bordereau cash settlement.',
      icon: '📙',
      email: 'admin@veridex.com',
      isMine: true
    },
    {
      id: 'ENT-CAR-01',
      name: 'Southlake Insurance Co.',
      businessType: 'carrier',
      typeLabel: 'Insurance Carrier',
      desc: 'Risk-bearing underwriter, NAIC Schedule P, bordereau receivable match.',
      icon: '🛡️',
      email: 'carrier@gmail.com',
      isMine: false
    },
    {
      id: 'ENT-MGA-01',
      name: 'NTA Program Administrators',
      businessType: 'mga',
      typeLabel: 'Managing General Agent',
      desc: 'Program management override fee revenue, retail broker settlement.',
      icon: '🏢',
      email: 'mga@gmail.com',
      isMine: false
    },
    {
      id: 'ENT-AGY-01',
      name: 'HIT Agency Group',
      businessType: 'agency',
      typeLabel: 'Retail Broker / Producer',
      desc: 'Direct customer premium collection, earned retail brokerage commission.',
      icon: '💼',
      email: 'broker@gmail.com',
      isMine: false
    },
    {
      id: 'ENT-REIN-01',
      name: 'Starlight Re / Treaty Pool',
      businessType: 'reinsurer',
      typeLabel: 'Reinsurance Carrier',
      desc: 'Assumed quota-share cessions, treaty retrocession, catastrophe reserve modeling.',
      icon: '🌐',
      email: 'reinsurer@gmail.com',
      isMine: false
    }
  ];

  const ROLES = [
    { id: 'owner', label: 'Business Owner / Principal', icon: '👤', bg: '#e6f4f1', email: 'admin@veridex.com', path: '/dashboard-owner' },
    { id: 'cfo', label: 'Chief Financial Officer (CFO)', icon: '📊', bg: '#fbf0e2', email: 'carrier@gmail.com', path: '/dashboard-cfo' },
    { id: 'controller', label: 'Financial Controller', icon: '📚', bg: '#e3f2fd', email: 'carrier@gmail.com', path: '/dashboard-controller' },
    { id: 'accountant', label: 'Senior Accountant', icon: '🧮', bg: '#eeebf6', email: 'admin@veridex.com', path: '/dashboard-accountant' },
    { id: 'ap-ar-clerk', label: 'AP / AR Settlement Specialist', icon: '🧾', bg: '#eeebf6', email: 'mga@gmail.com', path: '/dashboard-accountant' },
    { id: 'auditor', label: 'Internal & NAIC Auditor', icon: '🔍', bg: '#fce4ec', email: 'carrier@gmail.com', path: '/dashboard-auditor' },
    { id: 'agency-principal', label: 'Retail Agency Principal', icon: '🏢', bg: '#e6f4f1', email: 'broker@gmail.com', path: '/dashboard-agency' },
    { id: 'mga-ops', label: 'MGA Underwriting Operations', icon: '⚡', bg: '#fbf0e2', email: 'mga@gmail.com', path: '/dashboard-mga' },
    { id: 'carrier-controller', label: 'Risk Carrier Controller', icon: '🛡️', bg: '#e3f2fd', email: 'carrier@gmail.com', path: '/dashboard-carrier' },
    { id: 'reinsurance-analyst', label: 'Reinsurance Analyst', icon: '🌐', bg: '#eeebf6', email: 'reinsurer@gmail.com', path: '/dashboard-reinsurer' },
    { id: 'admin', label: 'System Administrator', icon: '⚙️', bg: '#e6f4f1', email: 'admin@veridex.com', path: '/dashboard-admin' }
  ];

  const handleSelectEntity = (ent) => {
    switchRole(ent.email);
  };

  const handleSelectRole = (r) => {
    switchRole(r.email);
    navigate(r.path || '/');
  };

  return (
    <div style={{ maxWidth: '1180px', margin: '0 auto', padding: '10px 0 40px' }}>
      <div style={{ marginBottom: '20px' }}>
        <Link to="/" className="btn btn-ghost btn-sm">
          ← Back to my business
        </Link>
      </div>

      <div style={{ marginBottom: '28px' }}>
        <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-ink)' }}>
          Explore other business types
        </div>
        <div style={{ fontSize: '13px', color: 'var(--color-muted)', marginTop: '4px', maxWidth: '680px', lineHeight: 1.6 }}>
          This is a demo area, not your day-to-day workspace. Your own business stays exactly as you set it up during onboarding.
          Use this to see how the same platform reconfigures itself for an insurance agency, MGA, carrier, or reinsurer, or for a different
          kind of general business, each with its own modules, dimensions, and dashboards driven entirely by configuration.
        </div>
      </div>

      {/* 1. Entity / Business Card */}
      <div className="form-card" style={{ marginBottom: '24px' }}>
        <div style={{
          fontSize: '12.5px',
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '.04em',
          color: 'var(--color-muted)',
          marginBottom: '12px'
        }}>
          1 · Entity / Business
        </div>
        <div className="v-role-grid" id="entity-grid">
          {ENTITIES.map((e) => {
            const active = e.email === currentUser?.email || e.id === currentUser?.entityId;
            return (
              <div
                key={e.id}
                className="v-role-card"
                style={{
                  cursor: 'pointer',
                  borderColor: active ? 'var(--color-brand)' : undefined,
                  boxShadow: active ? 'var(--shadow)' : undefined
                }}
                onClick={() => handleSelectEntity(e)}
              >
                <div className="v-role-card-icon" style={{ background: 'var(--color-brand-light)' }}>
                  {e.icon}
                </div>
                <h4>{e.name}</h4>
                <p>{e.typeLabel} — {e.desc}</p>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                  {e.isMine ? (
                    <span className="v-badge-config">Your business</span>
                  ) : (
                    <span className="v-badge-industry-only">Demo entity</span>
                  )}
                  {active && (
                    <span className="badge badge-green">Active</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Your Role in Active Entity */}
      <div className="form-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{
            fontSize: '12.5px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '.04em',
            color: 'var(--color-muted)'
          }}>
            2 · Your Role in <span style={{ color: 'var(--color-brand)' }}>{currentUser?.entityName}</span>
          </div>
          <span className="v-badge-config">Config-driven</span>
        </div>

        <div className="v-role-grid" id="role-grid">
          {ROLES.map((r) => (
            <div
              key={r.id}
              className="v-role-card"
              style={{ cursor: 'pointer' }}
              onClick={() => handleSelectRole(r)}
            >
              <div className="v-role-card-icon" style={{ background: r.bg }}>
                {r.icon}
              </div>
              <h4>{r.label}</h4>
              <p>Opens the {r.label.toLowerCase()} dashboard, pre-filtered to {currentUser?.entityName}.</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
