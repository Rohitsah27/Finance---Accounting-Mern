import React, { useState, useMemo } from 'react';

const INITIAL_PROJECTS = [
  {
    name: 'Meridian Warehouse Automation',
    customer: 'Meridian Logistics LLC',
    billing: 'Fixed-Price',
    budget: 685000,
    cost: 712400,
    pct: 88,
    wip: 96200,
    status: 'Over Budget',
  },
  {
    name: 'Crestpoint Facilities Retrofit',
    customer: 'Crestpoint Property Management',
    billing: 'T&M',
    budget: 240000,
    cost: 168200,
    pct: 70,
    wip: 41800,
    status: 'Active',
  },
  {
    name: 'Harborview EMR Integration',
    customer: 'Harborview Medical Group',
    billing: 'Milestone',
    budget: 420000,
    cost: 289400,
    pct: 62,
    wip: 58600,
    status: 'Active',
  },
  {
    name: 'Crestpoint Ongoing Advisory',
    customer: 'Crestpoint Property Management',
    billing: 'Retainer',
    budget: 96000,
    cost: 52000,
    pct: 54,
    wip: 14400,
    status: 'Active',
  },
  {
    name: 'AC Wholesale WMS Rollout',
    customer: 'AC Wholesale Distribution',
    billing: 'Fixed-Price',
    budget: 310000,
    cost: 336800,
    pct: 97,
    wip: 18900,
    status: 'Over Budget',
  },
  {
    name: 'Harborview Billing Systems Phase 1',
    customer: 'Harborview Medical Group',
    billing: 'Milestone',
    budget: 180000,
    cost: 176200,
    pct: 100,
    wip: 0,
    status: 'Complete',
  },
];

const TIMESHEETS = [
  { employee: 'Renata Osei', project: 'Meridian Warehouse Automation', hours: 8.0, billable: true, date: '08/18/2026' },
  { employee: 'Devon Ackerman', project: 'Crestpoint Facilities Retrofit', hours: 6.5, billable: true, date: '08/18/2026' },
  { employee: 'Simone Vasquez', project: 'Harborview EMR Integration', hours: 7.0, billable: true, date: '08/19/2026' },
  { employee: 'Tobias Klein', project: 'AC Wholesale WMS Rollout', hours: 4.0, billable: false, date: '08/19/2026' },
  { employee: 'Latoya Simmons', project: 'Crestpoint Ongoing Advisory', hours: 3.0, billable: true, date: '08/19/2026' },
];

export function ProjectsJobCostingPage() {
  const [projects] = useState(INITIAL_PROJECTS);
  const [statusFilter, setStatusFilter] = useState('');
  const [billingFilter, setBillingFilter] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [search, setSearch] = useState('');

  const [selectedProject, setSelectedProject] = useState({
    name: 'Meridian Warehouse Automation',
    customer: 'Meridian Logistics LLC',
    budget: 685000,
    cost: 712400,
    billing: 'Fixed-Price',
  });

  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const filteredProjects = useMemo(() => {
    const q = search.toLowerCase();
    return projects.filter((p) => {
      const matchStatus = !statusFilter || p.status === statusFilter;
      const matchBilling = !billingFilter || p.billing === billingFilter;
      const matchCust = !customerFilter || p.customer === customerFilter;
      const matchSearch = !q || p.name.toLowerCase().includes(q) || p.customer.toLowerCase().includes(q);
      return matchStatus && matchBilling && matchCust && matchSearch;
    });
  }, [projects, statusFilter, billingFilter, customerFilter, search]);

  const getBillingBadge = (b) => {
    switch (b) {
      case 'Fixed-Price': return 'badge-navy';
      case 'T&M': return 'badge-blue';
      case 'Milestone': return 'badge-orange';
      default: return 'badge-gray';
    }
  };

  const getStatusBadge = (s) => {
    switch (s) {
      case 'Active': return 'badge-green';
      case 'Over Budget': return 'badge-red';
      case 'Complete': return 'badge-gray';
      default: return 'badge-orange';
    }
  };

  const getProgressFill = (status, pct) => {
    if (status === 'Over Budget') return 'pf-orange';
    if (pct >= 100) return 'pf-green';
    return 'pf-navy';
  };

  // Selected project calculations
  const costRatio = selectedProject.cost / selectedProject.budget;
  const recognizedRev = Math.round(selectedProject.budget * (costRatio > 1 ? 0.94 : costRatio));
  const margin = recognizedRev - selectedProject.cost;
  const marginPct = ((margin / recognizedRev) * 100).toFixed(1);

  return (
    <>
      {toast && (
        <div className={`veridex-toast veridex-toast-${toast.type}`}>
          <span>{toast.type === 'error' ? '✕' : toast.type === 'warning' ? '⚠️' : '✓'}</span>
          <span>{toast.msg}</span>
        </div>
      )}

      {/* ═══ PAGE HEADER ═══ */}
      <div className="page-header">
        <div>
          <div className="page-title">Projects &amp; Job Costing</div>
          <div className="page-subtitle">
            Project WIP, timesheets, and revenue recognition under ASC 606 for over-time performance obligations
          </div>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline" onClick={() => showToast('Exporting project ledger...', 'info')}>
            Export
          </button>
          <button className="btn btn-primary" onClick={() => showToast('New project setup wizard opened', 'info')}>
            + New Project
          </button>
        </div>
      </div>

      {/* ═══ STATS ROW ═══ */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon si-navy">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="3" y="3" width="14" height="14" rx="1.5" stroke="#102a2e" strokeWidth="1.4"/>
              <path d="M3 7.5h14" stroke="#102a2e" strokeWidth="1.3"/>
            </svg>
          </div>
          <div className="stat-info">
            <div className="stat-value">18</div>
            <div className="stat-label">Active Projects</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon si-orange">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 5v6M10 14v1" stroke="#e65100" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="10" cy="10" r="7.5" stroke="#e65100" strokeWidth="1.4"/>
            </svg>
          </div>
          <div className="stat-info">
            <div className="stat-value">$1,842,600</div>
            <div className="stat-label">Total WIP Value</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon si-coral">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="7" stroke="#c9791f" strokeWidth="1.6"/>
              <path d="M10 6v4l3 2" stroke="#c9791f" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="stat-info">
            <div className="stat-value">$326,400</div>
            <div className="stat-label">Unbilled Time &amp; Expenses</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon si-navy">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 10l4-6 3 4 3-3 4 5" stroke="#c62828" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="stat-info">
            <div className="stat-value">3</div>
            <div className="stat-label">Projects Over Budget</div>
          </div>
        </div>
      </div>

      {/* ═══ FILTERS ═══ */}
      <div className="filter-bar">
        <span className="filter-bar-label">Filters:</span>
        <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="Active">Active</option>
          <option value="On Hold">On Hold</option>
          <option value="Complete">Complete</option>
          <option value="Over Budget">Over Budget</option>
        </select>
        <select className="filter-select" value={billingFilter} onChange={(e) => setBillingFilter(e.target.value)}>
          <option value="">All Billing Types</option>
          <option value="T&M">T&amp;M</option>
          <option value="Fixed-Price">Fixed-Price</option>
          <option value="Milestone">Milestone</option>
          <option value="Retainer">Retainer</option>
        </select>
        <select className="filter-select" value={customerFilter} onChange={(e) => setCustomerFilter(e.target.value)}>
          <option value="">All Customers</option>
          <option value="Meridian Logistics LLC">Meridian Logistics LLC</option>
          <option value="Crestpoint Property Management">Crestpoint Property Management</option>
          <option value="Harborview Medical Group">Harborview Medical Group</option>
          <option value="AC Wholesale Distribution">AC Wholesale Distribution</option>
        </select>
        <div className="filter-spacer"></div>
        <input
          type="text"
          className="filter-input"
          placeholder="Search project..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: '200px' }}
        />
      </div>

      {/* ═══ PROJECTS TABLE ═══ */}
      <div className="table-wrap" style={{ marginBottom: '24px' }}>
        <div className="table-head-row">
          <div className="table-head-title">Projects</div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Project Name</th>
              <th>Customer</th>
              <th>Billing Type</th>
              <th style={{ textAlign: 'right' }}>Budget</th>
              <th style={{ textAlign: 'right' }}>Actual Cost</th>
              <th style={{ width: '140px' }}>% Complete</th>
              <th style={{ textAlign: 'right' }}>WIP Balance</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredProjects.map((p) => {
              const isSelected = selectedProject.name === p.name;
              return (
                <tr
                  key={p.name}
                  onClick={() => {
                    setSelectedProject(p);
                    showToast(`Project P&L updated for ${p.name}`, 'info');
                  }}
                  style={{ cursor: 'pointer', background: isSelected ? 'var(--gray-50, #f8fafc)' : 'transparent' }}
                >
                  <td className="font-semibold cell-link">{p.name}</td>
                  <td>{p.customer}</td>
                  <td><span className={`badge ${getBillingBadge(p.billing)}`}>{p.billing}</span></td>
                  <td style={{ textAlign: 'right' }}>${p.budget.toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }}>${p.cost.toLocaleString()}</td>
                  <td>
                    <div className="progress-bar">
                      <div className={`progress-fill ${getProgressFill(p.status, p.pct)}`} style={{ width: `${Math.min(p.pct, 100)}%` }} />
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--color-muted, #64748b)' }}>{p.pct}%</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>${p.wip.toLocaleString()}</td>
                  <td><span className={`badge ${getStatusBadge(p.status)}`}>{p.status}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ═══ TIMESHEETS SUB-TABLE ═══ */}
      <div className="table-wrap" style={{ marginBottom: '24px' }}>
        <div className="table-head-row">
          <div className="table-head-title">Timesheets</div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Project</th>
              <th style={{ textAlign: 'right' }}>Hours</th>
              <th>Billable</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {TIMESHEETS.map((t, idx) => (
              <tr key={idx}>
                <td>{t.employee}</td>
                <td>{t.project}</td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>{t.hours.toFixed(1)}</td>
                <td>
                  <span className={`badge ${t.billable ? 'badge-green' : 'badge-gray'}`}>
                    {t.billable ? 'Y' : 'N - Internal'}
                  </span>
                </td>
                <td>{t.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ═══ PROJECT P&L PANEL ═══ */}
      <div className="card" style={{ padding: '18px 20px', marginBottom: '24px' }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: '#0d1b4b', marginBottom: '4px' }}>
          Project P&amp;L - <span>{selectedProject.name}</span>
        </div>
        <div style={{ fontSize: '11.5px', color: 'var(--color-muted, #64748b)', marginBottom: '16px' }}>
          Revenue is recognized over time using a cost-to-cost input method per ASC 606, matching revenue to costs incurred as the performance obligation is satisfied.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <div className="card" style={{ padding: '16px', borderTop: '3px solid #0d1b4b', background: 'var(--gray-50, #f8fafc)' }}>
            <div style={{ fontSize: '11px', color: 'var(--color-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px', fontWeight: 700 }}>
              Revenue Recognized
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#0d1b4b' }}>
              ${recognizedRev.toLocaleString()}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-muted, #64748b)', marginTop: '4px' }}>
              {Math.round((recognizedRev / selectedProject.budget) * 100)}% of contract value
            </div>
          </div>

          <div className="card" style={{ padding: '16px', borderTop: '3px solid #e05470', background: 'var(--gray-50, #f8fafc)' }}>
            <div style={{ fontSize: '11px', color: 'var(--color-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px', fontWeight: 700 }}>
              Cost Incurred
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#0d1b4b' }}>
              ${selectedProject.cost.toLocaleString()}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-muted, #64748b)', marginTop: '4px' }}>
              {selectedProject.customer}
            </div>
          </div>

          <div className="card" style={{ padding: '16px', borderTop: `3px solid ${margin < 0 ? '#c62828' : '#2e7d32'}`, background: 'var(--gray-50, #f8fafc)' }}>
            <div style={{ fontSize: '11px', color: 'var(--color-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px', fontWeight: 700 }}>
              Margin
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: margin < 0 ? '#c62828' : '#2e7d32' }}>
              {margin < 0 ? `-$${Math.abs(margin).toLocaleString()}` : `$${margin.toLocaleString()}`}
            </div>
            <div style={{ fontSize: '11px', color: margin < 0 ? '#c62828' : '#2e7d32', marginTop: '4px' }}>
              {marginPct}% margin
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
export default ProjectsJobCostingPage;
