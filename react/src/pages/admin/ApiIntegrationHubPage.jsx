import React, { useState } from 'react';

const INITIAL_KEYS = [
  { id: 1, name: 'Production ERP Sync', env: 'live', key: 'vdx_live_99f2b84c71a399d821', scopes: ['read:ledger', 'write:ledger', 'read:reports'], created: '2026-05-10', lastUsed: '2 mins ago' },
  { id: 2, name: 'Sandbox Policy Admin Webhook', env: 'sandbox', key: 'vdx_test_18ca53027b1f55819d', scopes: ['read:ar-ap', 'write:ar-ap'], created: '2026-06-22', lastUsed: '1 hour ago' },
];

const INITIAL_WEBHOOKS = [
  { id: 1, url: 'https://api.veridexpartner.com/v1/webhooks', secret: 'whsec_99af281048b', events: ['invoice.created', 'payment.applied'], status: 'Active' },
  { id: 2, url: 'https://claims.starlightre.com/events', secret: 'whsec_110c44a721d', events: ['claim.reserved', 'bordereau.imported'], status: 'Active' },
];

const EVENT_CATALOG = [
  { name: 'invoice.created', desc: 'Dispatched when a commercial premium or direct billing invoice is finalized and posted to AR.', sample: '{\n  "event": "invoice.created",\n  "invoice_id": "INV-2026-00412",\n  "amount": 24500.00,\n  "currency": "USD",\n  "entity_id": "ENT-001"\n}' },
  { name: 'payment.applied', desc: 'Dispatched when fiduciary or operating cash is matched and settled against outstanding receivables.', sample: '{\n  "event": "payment.applied",\n  "receipt_id": "RCP-2026-0811",\n  "applied_amount": 12400.00,\n  "cleared_at": "2026-09-04T10:14:00Z"\n}' },
  { name: 'journalEntry.posted', desc: 'Dispatched on successful dual-approval and commitment of double-entry ledger vouchers.', sample: '{\n  "event": "journalEntry.posted",\n  "voucher_id": "JE-2026-0092",\n  "total_debit": 48500.00,\n  "balanced": true\n}' },
  { name: 'claim.reserved', desc: 'Dispatched when loss adjusters post an initial or revised case reserve against a policy loss.', sample: '{\n  "event": "claim.reserved",\n  "claim_id": "CLM-2026-0024",\n  "case_reserve": 85000.00,\n  "incurred": 85000.00\n}' },
  { name: 'commission.calculated', desc: 'Dispatched upon settlement of gross premium and tier allocation across agency and brokers.', sample: '{\n  "event": "commission.calculated",\n  "policy_id": "POL-2026-0891",\n  "retained_commission": 3675.00\n}' },
];

const JOBS = [
  { id: 1, type: 'GL Transactions Export (CSV)', status: 'Completed', rows: 18450, started: '2026-09-04 08:30', completed: '2026-09-04 08:31' },
  { id: 2, type: 'Bordereau Schedule Import (JSON)', status: 'Completed', rows: 420, started: '2026-09-03 16:12', completed: '2026-09-03 16:13' },
  { id: 3, type: 'Chart of Accounts Full Backup', status: 'Completed', rows: 154, started: '2026-09-01 00:00', completed: '2026-09-01 00:00' },
];

export default function ApiIntegrationHubPage() {
  const [tab, setTab] = useState('keys');
  const [keys, setKeys] = useState(INITIAL_KEYS);
  const [webhooks, setWebhooks] = useState(INITIAL_WEBHOOKS);
  const [toast, setToast] = useState(null);

  // New key form
  const [showKeyForm, setShowKeyForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyEnv, setNewKeyEnv] = useState('live');

  // Selected event for payload inspection
  const [inspectEvent, setInspectEvent] = useState(EVENT_CATALOG[0]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleCreateKey = () => {
    if (!newKeyName) {
      showToast('Please provide a key name');
      return;
    }
    const newKey = {
      id: Date.now(),
      name: newKeyName,
      env: newKeyEnv,
      key: `vdx_${newKeyEnv}_${Math.random().toString(36).slice(2, 18)}`,
      scopes: ['read:ledger', 'write:ledger'],
      created: 'Just now',
      lastUsed: 'Never',
    };
    setKeys([...keys, newKey]);
    setShowKeyForm(false);
    setNewKeyName('');
    showToast('API Key generated securely');
  };

  const copyToClipboard = (text) => {
    navigator.clipboard?.writeText(text);
    showToast('Copied to clipboard!');
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
          <h1 className="page-title">API &amp; Integration Hub</h1>
          <p className="page-subtitle">REST APIs, webhook dispatchers, event streams, and batch synchronization</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline" onClick={() => showToast('Opening Swagger / OpenAPI 3.1 documentation...')}>API Docs</button>
          <button className="btn btn-primary" onClick={() => { setTab('keys'); setShowKeyForm(true); }}>+ Generate API Key</button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon si-navy">🔑</div>
          <div className="stat-info">
            <div className="stat-value">{keys.length}</div>
            <div className="stat-label">Active API Keys</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon si-green">🌐</div>
          <div className="stat-info">
            <div className="stat-value">99.98%</div>
            <div className="stat-label">Webhook Uptime (30d)</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon si-coral">⚡</div>
          <div className="stat-info">
            <div className="stat-value">148.2k</div>
            <div className="stat-label">API Requests (MTD)</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon si-orange">⏱️</div>
          <div className="stat-info">
            <div className="stat-value">42 ms</div>
            <div className="stat-label">Avg Response Latency</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="table-wrap">
        <div className="page-tabs" style={{ background: 'var(--gray-50)', padding: '6px 12px', borderBottom: '1px solid var(--gray-200)' }}>
          <button className={`page-tab ${tab === 'keys' ? 'active' : ''}`} onClick={() => setTab('keys')}>API Keys ({keys.length})</button>
          <button className={`page-tab ${tab === 'webhooks' ? 'active' : ''}`} onClick={() => setTab('webhooks')}>Webhooks &amp; Subscriptions</button>
          <button className={`page-tab ${tab === 'events' ? 'active' : ''}`} onClick={() => setTab('events')}>Event Catalog ({EVENT_CATALOG.length})</button>
          <button className={`page-tab ${tab === 'jobs' ? 'active' : ''}`} onClick={() => setTab('jobs')}>Async Jobs ({JOBS.length})</button>
        </div>

        {tab === 'keys' && (
          <div style={{ padding: '20px' }}>
            {showKeyForm && (
              <div className="card" style={{ marginBottom: '20px', padding: '16px', background: 'var(--gray-50)' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px' }}>Generate New API Key</h4>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '14px' }}>
                  <div>
                    <label className="field-label">Environment</label>
                    <select className="field-input" value={newKeyEnv} onChange={(e) => setNewKeyEnv(e.target.value)}>
                      <option value="live">Live Production</option>
                      <option value="sandbox">Sandbox Test</option>
                    </select>
                  </div>
                  <div style={{ flex: 1, minWidth: '240px' }}>
                    <label className="field-label">Key Name / Consumer</label>
                    <input
                      type="text"
                      className="field-input"
                      placeholder="e.g. Data Warehouse ETL Pipeline"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn btn-primary btn-sm" onClick={handleCreateKey}>Confirm &amp; Generate</button>
                  <button className="btn btn-outline btn-sm" onClick={() => setShowKeyForm(false)}>Cancel</button>
                </div>
              </div>
            )}

            <table className="data-table">
              <thead>
                <tr>
                  <th>Key Name</th>
                  <th>Environment</th>
                  <th>API Token</th>
                  <th>Assigned Scopes</th>
                  <th>Last Used</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {keys.map((k) => (
                  <tr key={k.id}>
                    <td className="font-semibold">{k.name}</td>
                    <td>
                      <span className={`badge ${k.env === 'live' ? 'badge-green' : 'badge-navy'}`}>
                        {k.env.toUpperCase()}
                      </span>
                    </td>
                    <td className="font-mono text-sm" style={{ color: 'var(--gray-700)' }}>
                      {k.key}
                      <button
                        onClick={() => copyToClipboard(k.key)}
                        style={{ marginLeft: '8px', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--navy)' }}
                        title="Copy Key"
                      >
                        📋
                      </button>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {k.scopes.map(s => <span key={s} className="badge badge-gray" style={{ fontSize: '10px' }}>{s}</span>)}
                      </div>
                    </td>
                    <td className="font-mono text-sm text-muted">{k.lastUsed}</td>
                    <td>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--red)' }}
                        onClick={() => {
                          setKeys(keys.filter(item => item.id !== k.id));
                          showToast(`Revoked key: ${k.name}`);
                        }}
                      >
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'webhooks' && (
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '14px' }}>Registered Webhook Endpoints</h4>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--gray-500)' }}>Event delivery signed with HMAC-SHA256 headers</p>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => showToast('New webhook registration modal')}>+ Add Endpoint</button>
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th>Endpoint Target URL</th>
                  <th>Signing Secret</th>
                  <th>Subscribed Events</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {webhooks.map((w) => (
                  <tr key={w.id}>
                    <td className="font-mono font-medium">{w.url}</td>
                    <td className="font-mono text-muted">{w.secret}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {w.events.map(ev => <span key={ev} className="badge badge-blue" style={{ fontSize: '10px' }}>{ev}</span>)}
                      </div>
                    </td>
                    <td><span className="badge badge-green">{w.status}</span></td>
                    <td>
                      <button className="btn btn-outline btn-sm" onClick={() => showToast(`Sent test ping to ${w.url}`)}>Test Ping</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'events' && (
          <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
            <div>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '14px' }}>Financial Event Stream Catalog</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {EVENT_CATALOG.map((ev) => (
                  <div
                    key={ev.name}
                    onClick={() => setInspectEvent(ev)}
                    style={{
                      border: '1px solid var(--gray-200)',
                      borderRadius: '6px',
                      padding: '12px 14px',
                      cursor: 'pointer',
                      background: inspectEvent.name === ev.name ? 'var(--gray-50)' : '#fff',
                      borderColor: inspectEvent.name === ev.name ? 'var(--navy)' : 'var(--gray-200)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <strong className="font-mono" style={{ color: 'var(--navy)', fontSize: '13px' }}>{ev.name}</strong>
                      <span className="badge badge-gray" style={{ fontSize: '10px' }}>JSON</span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--gray-600)', margin: 0 }}>{ev.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '14px' }}>Sample JSON Payload: {inspectEvent.name}</h4>
              <pre
                style={{
                  background: 'var(--gray-900)',
                  color: '#a7f3d0',
                  padding: '16px',
                  borderRadius: '8px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  overflowX: 'auto',
                  margin: 0
                }}
              >
                {inspectEvent.sample}
              </pre>
            </div>
          </div>
        )}

        {tab === 'jobs' && (
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '14px' }}>Async Synchronization Jobs</h4>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--gray-500)' }}>Large batch imports, exports, and scheduled ledger backups</p>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => showToast('New export scheduled.')}>+ New Export</button>
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th>Job Name</th>
                  <th>Status</th>
                  <th className="text-right">Processed Records</th>
                  <th>Started At</th>
                  <th>Completed At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {JOBS.map((j) => (
                  <tr key={j.id}>
                    <td className="font-semibold">{j.type}</td>
                    <td><span className="badge badge-green">{j.status}</span></td>
                    <td className="font-mono text-right">{j.rows.toLocaleString()}</td>
                    <td className="font-mono text-sm text-muted">{j.started}</td>
                    <td className="font-mono text-sm text-muted">{j.completed}</td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => showToast(`Downloaded artifacts for ${j.type}`)}>⬇ Download</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
