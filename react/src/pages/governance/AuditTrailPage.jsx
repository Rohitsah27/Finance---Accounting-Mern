import React, { useState } from 'react';

const ACTIVITY_LOG = [
  { time: '21/05/2026 14:32:18', user: 'John Doe', role: 'Controller', action: 'Approve', module: 'Journal Entry', record: 'JE-2026-0048', before: 'Status: Submitted', after: 'Status: Posted', ip: '192.168.1.42' },
  { time: '21/05/2026 13:18:44', user: 'Jane Smith', role: 'Accountant', action: 'Create', module: 'Journal Entry', record: 'JE-2026-0049', before: 'None (New)', after: 'Debit/Credit $12,400', ip: '192.168.1.55' },
  { time: '21/05/2026 11:05:22', user: 'Elena Rostova', role: 'Producer', action: 'Post', module: 'Commission Engine', record: 'COMM-2026-081', before: 'Draft', after: 'Released to AP', ip: '10.0.4.12' },
  { time: '20/05/2026 17:45:10', user: 'Marcus Webb', role: 'CFO', action: 'Override', module: 'Period Locking', record: 'APR-2026-CLOSE', before: 'Hard Locked', after: 'Emergency Unlocked', ip: '192.168.1.10' },
  { time: '20/05/2026 15:30:00', user: 'Jane Smith', role: 'Accountant', action: 'Edit', module: 'Bank Reconciliation', record: 'REC-CITI-0520', before: 'Unmatched', after: 'Matched to JE-0033', ip: '192.168.1.55' },
  { time: '20/05/2026 09:12:33', user: 'John Doe', role: 'Controller', action: 'Export', module: 'Reporting', record: 'Trial Balance Q2', before: 'In-Memory', after: 'Excel Download', ip: '192.168.1.42' },
];

const OVERRIDES_LOG = [
  { time: '20/05/2026 17:45:10', user: 'Marcus Webb (CFO)', reason: 'Post-close prior period audit adjustment requested by EY', approvedBy: 'Audit Committee', module: 'Period Locking' },
  { time: '14/05/2026 10:20:00', user: 'John Doe (Controller)', reason: 'Subledger out-of-balance threshold bypass for carrier bordereau', approvedBy: 'Marcus Webb', module: 'Subledger Integrity' },
];

const LOGINS_LOG = [
  { time: '21/05/2026 14:10:02', user: 'John Doe', email: 'controller@veridex.com', status: 'Success', method: 'SAML SSO / MFA', ip: '192.168.1.42' },
  { time: '21/05/2026 12:45:18', user: 'Jane Smith', email: 'accountant@veridex.com', status: 'Success', method: 'SAML SSO / MFA', ip: '192.168.1.55' },
  { time: '21/05/2026 08:30:11', user: 'Unknown', email: 'admin@veridex.com', status: 'Failed (Wrong Pass)', method: 'Password', ip: '45.33.32.156' },
  { time: '21/05/2026 08:31:04', user: 'Unknown', email: 'admin@veridex.com', status: 'Blocked (Rate Limit)', method: 'Password', ip: '45.33.32.156' },
];

const CONFIG_LOG = [
  { time: '19/05/2026 16:00:00', user: 'Marcus Webb', param: 'Approval Threshold (Large JE)', oldVal: '$10,000', newVal: '$25,000' },
  { time: '15/05/2026 11:20:00', user: 'System Admin', param: 'Surplus Lines Tax Rate (Texas)', oldVal: '4.85%', newVal: '4.85% (Re-certified)' },
];

export default function AuditTrailPage() {
  const [tab, setTab] = useState('activity-log');
  const [actionFilter, setActionFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const filteredActivity = ACTIVITY_LOG.filter(item => {
    const matchAction = actionFilter === 'All' || item.action === actionFilter;
    const matchSearch = !search || item.user.toLowerCase().includes(search.toLowerCase()) || item.record.toLowerCase().includes(search.toLowerCase()) || item.module.toLowerCase().includes(search.toLowerCase());
    return matchAction && matchSearch;
  });

  const getActionBadge = (a) => {
    switch (a) {
      case 'Approve': return 'badge-blue';
      case 'Create': return 'badge-navy';
      case 'Post': return 'badge-green';
      case 'Override': return 'badge-red';
      default: return 'badge-gray';
    }
  };

  return (
    <div className="page-container">
      {toast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '10px 16px',
          background: 'var(--navy)',
          color: '#fff',
          borderRadius: '6px',
          zIndex: 9999,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          fontSize: '13px'
        }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Audit Trail &amp; Compliance</h1>
          <p className="page-subtitle">Immutable chronological log of all ledger modifications, logins, and overrides</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline" onClick={() => showToast('Exporting cryptographically signed audit package...')}>Export Signed Package</button>
          <button className="btn btn-primary" onClick={() => showToast('Running automated SOC 1 / SOC 2 integrity check...')}>Run Compliance Check</button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon si-navy">🛡️</div>
          <div className="stat-info">
            <div className="stat-value">1,420</div>
            <div className="stat-label">Events Logged (This Month)</div>
            <div className="stat-change text-green">100% immutable SHA-256</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon si-coral">⚠️</div>
          <div className="stat-info">
            <div className="stat-value">2</div>
            <div className="stat-label">Override Events</div>
            <div className="stat-change" style={{ color: 'var(--orange)' }}>All dual-authorized</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon si-orange">👥</div>
          <div className="stat-info">
            <div className="stat-value">6</div>
            <div className="stat-label">Active Users (Today)</div>
            <div className="stat-change text-muted">2 concurrent sessions</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon si-green">✅</div>
          <div className="stat-info">
            <div className="stat-value">100%</div>
            <div className="stat-label">Audit Coverage</div>
            <div className="stat-change text-green">All financial modules</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <span className="filter-bar-label">Filters:</span>
        <select className="filter-select" value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
          <option value="All">All Actions</option>
          <option value="Create">Create</option>
          <option value="Edit">Edit</option>
          <option value="Approve">Approve</option>
          <option value="Post">Post</option>
          <option value="Override">Override</option>
          <option value="Export">Export</option>
        </select>
        <div className="filter-spacer"></div>
        <input
          type="text"
          className="filter-input"
          placeholder="Search audit trail..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: '220px' }}
        />
      </div>

      {/* Tabs */}
      <div className="table-wrap">
        <div className="page-tabs" style={{ background: 'var(--gray-50)', padding: '6px 12px', borderBottom: '1px solid var(--gray-200)' }}>
          <button className={`page-tab ${tab === 'activity-log' ? 'active' : ''}`} onClick={() => setTab('activity-log')}>Activity Log</button>
          <button className={`page-tab ${tab === 'overrides' ? 'active' : ''}`} onClick={() => setTab('overrides')}>Overrides &amp; Escalations</button>
          <button className={`page-tab ${tab === 'logins' ? 'active' : ''}`} onClick={() => setTab('logins')}>Login Events</button>
          <button className={`page-tab ${tab === 'config' ? 'active' : ''}`} onClick={() => setTab('config')}>Config Changes</button>
        </div>

        {tab === 'activity-log' && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Role</th>
                <th>Action</th>
                <th>Module</th>
                <th>Record #</th>
                <th>Before State</th>
                <th>After State</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {filteredActivity.map((r, i) => (
                <tr key={i}>
                  <td className="font-mono text-sm">{r.time}</td>
                  <td className="font-semibold">{r.user}</td>
                  <td><span className="badge badge-navy">{r.role}</span></td>
                  <td><span className={`badge ${getActionBadge(r.action)}`}>{r.action}</span></td>
                  <td>{r.module}</td>
                  <td className="font-mono cell-link">{r.record}</td>
                  <td style={{ fontSize: '11.5px', color: 'var(--gray-500)' }}>{r.before}</td>
                  <td style={{ fontSize: '11.5px', color: 'var(--green)', fontWeight: 600 }}>{r.after}</td>
                  <td className="font-mono text-sm text-muted">{r.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === 'overrides' && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Authorizing User</th>
                <th>Module</th>
                <th>Business Justification</th>
                <th>Approved By</th>
              </tr>
            </thead>
            <tbody>
              {OVERRIDES_LOG.map((o, i) => (
                <tr key={i}>
                  <td className="font-mono text-sm">{o.time}</td>
                  <td className="font-semibold">{o.user}</td>
                  <td><span className="badge badge-red">{o.module}</span></td>
                  <td>{o.reason}</td>
                  <td><span className="badge badge-green">{o.approvedBy}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === 'logins' && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User Name</th>
                <th>Email</th>
                <th>Result</th>
                <th>Auth Protocol</th>
                <th>Client IP</th>
              </tr>
            </thead>
            <tbody>
              {LOGINS_LOG.map((l, i) => (
                <tr key={i}>
                  <td className="font-mono text-sm">{l.time}</td>
                  <td className="font-semibold">{l.user}</td>
                  <td>{l.email}</td>
                  <td>
                    <span className={`badge ${l.status.includes('Success') ? 'badge-green' : 'badge-red'}`}>
                      {l.status}
                    </span>
                  </td>
                  <td>{l.method}</td>
                  <td className="font-mono text-sm text-muted">{l.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === 'config' && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Modified By</th>
                <th>System Parameter</th>
                <th>Previous Value</th>
                <th>Updated Value</th>
              </tr>
            </thead>
            <tbody>
              {CONFIG_LOG.map((c, i) => (
                <tr key={i}>
                  <td className="font-mono text-sm">{c.time}</td>
                  <td className="font-semibold">{c.user}</td>
                  <td>{c.param}</td>
                  <td className="font-mono text-muted">{c.oldVal}</td>
                  <td className="font-mono font-semibold" style={{ color: 'var(--navy)' }}>{c.newVal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
