import React, { useState, useMemo } from 'react';
import './reinsurance-accounting.css';

const INITIAL_TREATIES = [
  {
    id: 'TRT-2025-001',
    name: 'Property Quota Share 30%',
    type: 'Quota Share',
    reinsurer: 'Swiss Re',
    effective: '2025-01-01',
    expiry: '2025-12-31',
    limit: '$15,000,000',
    retention: 'Ground Up',
    share: '30%',
    cededPremium: '$8,420,000',
    status: 'Active'
  },
  {
    id: 'TRT-2025-002',
    name: 'Casualty Excess of Loss Layer 1',
    type: 'Risk XoL',
    reinsurer: 'Munich Re',
    effective: '2025-01-01',
    expiry: '2025-12-31',
    limit: '$5,000,000',
    retention: '$2,000,000',
    share: '100%',
    cededPremium: '$4,150,000',
    status: 'Active'
  },
  {
    id: 'TRT-2025-003',
    name: 'Property Catastrophe XoL Layer 2',
    type: 'Cat XoL',
    reinsurer: "Lloyd's Synd. 2003",
    effective: '2025-01-01',
    expiry: '2025-12-31',
    limit: '$10,000,000',
    retention: '$5,000,000',
    share: '100%',
    cededPremium: '$6,200,000',
    status: 'Active'
  },
  {
    id: 'TRT-2025-004',
    name: 'Commercial Auto Surplus Treaty',
    type: 'Surplus',
    reinsurer: 'Hannover Re',
    effective: '2025-07-01',
    expiry: '2026-06-30',
    limit: '$8,000,000',
    retention: '$1,000,000',
    share: '20%',
    cededPremium: '$5,820,000',
    status: 'Active'
  },
  {
    id: 'TRT-2024-005',
    name: 'Workers Compensation Quota Share',
    type: 'Quota Share',
    reinsurer: 'Gen Re',
    effective: '2024-06-01',
    expiry: '2025-05-31',
    limit: '$6,000,000',
    retention: 'Ground Up',
    share: '25%',
    cededPremium: '$3,110,000',
    status: 'Expiring'
  }
];

const INITIAL_PIPELINE_LOGS = [
  { time: '09:14:22 AM', ref: 'POL-TX-9901', type: 'Premium', orig: '$540,000', rule: 'QS Premium Ceding 30%', ceded: '$162,000', mode: 'Auto', result: 'POSTED' },
  { time: '09:11:05 AM', ref: 'CLM-2025-014', type: 'Loss', orig: '$38,400', rule: 'QS Loss Ceding 30%', ceded: '$11,520', mode: 'Auto', result: 'POSTED' },
  { time: '08:58:30 AM', ref: 'CLM-2025-011', type: 'Loss', orig: '$2,850,000', rule: 'XoL Layer Trigger', ceded: '$850,000', mode: 'Auto', result: 'POSTED' },
  { time: '08:42:19 AM', ref: 'SYS-BATCH-04', type: 'System', orig: '$1,400,000', rule: 'Stop Loss Trigger', ceded: '$0.00', mode: 'Manual', result: 'BELOW RETENTION' },
  { time: '08:30:10 AM', ref: 'POL-FL-2204', type: 'Premium', orig: '$210,000', rule: 'Surplus Share 20%', ceded: '$42,000', mode: 'Auto', result: 'POSTED' }
];

export function ReinsuranceAccountingPage() {
  const [activeTab, setActiveTab] = useState('treaty-console');
  const [refreshTime, setRefreshTime] = useState('Just now');
  const [treaties, setTreaties] = useState(INITIAL_TREATIES);
  const [pipelineLogs, setPipelineLogs] = useState(INITIAL_PIPELINE_LOGS);
  const [toast, setToast] = useState(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [logFilter, setLogFilter] = useState('');

  // Treaty Builder Form State
  const [tbId, setTbId] = useState('TRT-2025-007');
  const [tbName, setTbName] = useState('');
  const [tbType, setTbType] = useState('Proportional (Quota Share / Surplus)');
  const [tbReinsurer, setTbReinsurer] = useState('Swiss Re');
  const [tbRetention, setTbRetention] = useState('2000000');
  const [tbLimit, setTbLimit] = useState('5000000');
  const [tbShare, setTbShare] = useState('30');
  const [tbComm, setTbComm] = useState('25');
  const [tbAttach, setTbAttach] = useState('2000000');
  const [tbAgg, setTbAgg] = useState('15000000');

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleRefresh = () => {
    setRefreshTime(new Date().toLocaleTimeString());
    showToast('Reinsurance console refreshed with latest ledger cessions.', 'info');
  };

  const handleSaveTreaty = (e) => {
    e.preventDefault();
    if (!tbName.trim()) {
      showToast('Please enter a treaty name', 'error');
      return;
    }
    const newTrt = {
      id: tbId,
      name: tbName,
      type: tbType.includes('Quota Share') ? 'Quota Share' : tbType.includes('Cat') ? 'Cat XoL' : 'Risk XoL',
      reinsurer: tbReinsurer,
      effective: '2025-07-01',
      expiry: '2026-06-30',
      limit: `$${(parseFloat(tbLimit) || 0).toLocaleString()}`,
      retention: `$${(parseFloat(tbRetention) || 0).toLocaleString()}`,
      share: `${tbShare}%`,
      cededPremium: '$0.00',
      status: 'Active'
    };
    setTreaties([newTrt, ...treaties]);
    setTbName('');
    showToast(`Treaty ${tbId} saved successfully!`);
    setActiveTab('treaty-console');
  };

  const handleRunRule = (ruleName, treatyId, eventType, origAmt, cededAmt) => {
    const newLog = {
      time: new Date().toLocaleTimeString(),
      ref: 'TXN-' + Math.floor(1000 + Math.random() * 9000),
      type: eventType,
      orig: origAmt,
      rule: ruleName,
      ceded: cededAmt,
      mode: 'Manual',
      result: 'POSTED'
    };
    setPipelineLogs([newLog, ...pipelineLogs]);
    showToast(`Rule "${ruleName}" executed: ${cededAmt} ceded to ${treatyId}!`);
  };

  const filteredTreaties = useMemo(() => {
    return treaties.filter(t => {
      if (typeFilter && t.type !== typeFilter) return false;
      if (statusFilter && t.status !== statusFilter) return false;
      return true;
    });
  }, [treaties, typeFilter, statusFilter]);

  const filteredLogs = useMemo(() => {
    return pipelineLogs.filter(l => {
      if (logFilter && l.type !== logFilter) return false;
      return true;
    });
  }, [pipelineLogs, logFilter]);

  const getTreatyTypeBadge = (type) => {
    const map = {
      'Quota Share': 'badge-quota',
      'Risk XoL': 'badge-risk',
      'Cat XoL': 'badge-cat',
      'Surplus': 'badge-surplus',
      'Stop Loss': 'badge-stoploss'
    };
    return map[type] || 'badge-quota';
  };

  return (
    <>
      {toast && (
        <div className={`veridex-toast veridex-toast-${toast.type}`}>
          <span>{toast.type === 'error' ? '✕' : toast.type === 'warning' ? '⚠' : '✓'}</span>
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Module Top Nav */}
      <div className="ri-topnav">
        <div className="ri-tab-strip">
          <button
            type="button"
            className={`ri-tab ${activeTab === 'treaty-console' ? 'active' : ''}`}
            onClick={() => setActiveTab('treaty-console')}
            style={{ background: 'none', border: 'none' }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="2" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M5 6h6M5 9h4M5 12h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            Treaty Console
          </button>
          <button
            type="button"
            className={`ri-tab ${activeTab === 'treaty-builder' ? 'active' : ''}`}
            onClick={() => setActiveTab('treaty-builder')}
            style={{ background: 'none', border: 'none' }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M3 14v-1.5a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3V14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="8" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            Treaty Builder
          </button>
          <button
            type="button"
            className={`ri-tab ${activeTab === 'allocation-engine' ? 'active' : ''}`}
            onClick={() => setActiveTab('allocation-engine')}
            style={{ background: 'none', border: 'none' }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 2v1.5M8 12.5V14M2 8h1.5M12.5 8H14M3.5 3.5l1.1 1.1M11.4 11.4l1.1 1.1M3.5 12.5l1.1-1.1M11.4 4.6l1.1-1.1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            Allocation Engine
          </button>
        </div>
        <div className="ri-refresh-area">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 5v3l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span>Refreshed: {refreshTime}</span>
          <button className="ri-refresh-btn" onClick={handleRefresh}>
            Refresh
          </button>
        </div>
      </div>

      {/* TAB 1 - Treaty Console */}
      {activeTab === 'treaty-console' && (
        <div style={{ marginTop: '20px' }}>
          {/* 6 Stats */}
          <div className="stats-row-6">
            <div className="stat-card-ri">
              <div className="ri-stat-label">Active Treaties</div>
              <div className="ri-stat-value" style={{ color: 'var(--navy)' }}>5</div>
              <div className="ri-stat-sub" style={{ color: 'var(--orange, #e65100)' }}>1 expiring</div>
            </div>
            <div className="stat-card-ri">
              <div className="ri-stat-label">Total Ceded Prem.</div>
              <div className="ri-stat-value">$27.7M</div>
              <div className="ri-stat-sub" style={{ color: 'var(--gray-400)' }}>YTD 2026</div>
            </div>
            <div className="stat-card-ri">
              <div className="ri-stat-label">Total Recovered</div>
              <div className="ri-stat-value" style={{ color: 'var(--green)' }}>$7.9M</div>
              <div className="ri-stat-sub" style={{ color: 'var(--gray-400)' }}>Collections YTD</div>
            </div>
            <div className="stat-card-ri">
              <div className="ri-stat-label">Outstanding Recov.</div>
              <div className="ri-stat-value" style={{ color: 'var(--orange, #e65100)' }}>$5.8M</div>
              <div className="ri-stat-sub" style={{ color: 'var(--gray-400)' }}>Pending collection</div>
            </div>
            <div className="stat-card-ri">
              <div className="ri-stat-label">Aged &gt; 60 Days</div>
              <div className="ri-stat-value" style={{ color: 'var(--red, #dc2626)' }}>$1.3M</div>
              <div className="ri-stat-sub" style={{ color: 'var(--red, #dc2626)' }}>Requires follow-up</div>
            </div>
            <div className="stat-card-ri">
              <div className="ri-stat-label">Ceding Commission</div>
              <div className="ri-stat-value">$3.2M</div>
              <div className="ri-stat-sub" style={{ color: 'var(--gray-400)' }}>Earned YTD</div>
            </div>
          </div>

          {/* Treaty Directory */}
          <div className="form-card" style={{ marginBottom: '16px' }}>
            <div className="ri-section-hdr">
              <div className="ri-section-title">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="2" y="2" width="12" height="12" rx="1.5" stroke="#0d1b4b" strokeWidth="1.5" />
                  <path d="M5 6h6M5 9h4M5 12h2" stroke="#0d1b4b" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
                §9.1.1 Treaty Management Directory
              </div>
              <div className="ri-section-actions">
                <select className="filter-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                  <option value="">All Types</option>
                  <option value="Quota Share">Quota Share</option>
                  <option value="Risk XoL">Risk XoL</option>
                  <option value="Cat XoL">Cat XoL</option>
                  <option value="Surplus">Surplus</option>
                </select>
                <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Expiring">Expiring</option>
                </select>
                <button className="btn btn-primary btn-sm" onClick={() => setActiveTab('treaty-builder')}>
                  + New Treaty
                </button>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Treaty #</th>
                    <th>Treaty Name</th>
                    <th>Type</th>
                    <th>Reinsurer</th>
                    <th>Effective</th>
                    <th>Expiry</th>
                    <th className="text-right">Limit</th>
                    <th className="text-right">Retention / Attach.</th>
                    <th className="text-right">Share %</th>
                    <th className="text-right">Ceded Premium</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTreaties.map(t => (
                    <tr key={t.id}>
                      <td className="cell-link font-semibold">{t.id}</td>
                      <td><strong>{t.name}</strong></td>
                      <td><span className={`badge ${getTreatyTypeBadge(t.type)}`}>{t.type}</span></td>
                      <td>{t.reinsurer}</td>
                      <td>{t.effective}</td>
                      <td>{t.expiry}</td>
                      <td className="text-right">{t.limit}</td>
                      <td className="text-right">{t.retention}</td>
                      <td className="text-right font-semibold">{t.share}</td>
                      <td className="text-right font-bold" style={{ color: 'var(--navy)' }}>{t.cededPremium}</td>
                      <td><span className={`badge ${t.status === 'Active' ? 'badge-green' : 'badge-orange'}`}>{t.status}</span></td>
                      <td>
                        <button className="btn btn-ghost btn-sm" onClick={() => showToast(`Inspecting terms for ${t.id}`)}>
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Grid 2: Recoverables & Aging */}
          <div className="grid-2">
            <div className="form-card">
              <div className="ri-section-hdr" style={{ padding: '14px 18px' }}>
                <div className="ri-section-title" style={{ fontSize: '13px' }}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M2 12l4-4 3 3 5-6" stroke="#2e7d32" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  §9.1.2 Recoverable Tracking Matrix
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Treaty</th>
                      <th>Reinsurer</th>
                      <th className="text-right">Total Recov.</th>
                      <th className="text-right">Recovered</th>
                      <th className="text-right">Outstanding</th>
                      <th>Aging Profile</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="cell-link">TRT-2025-001</td>
                      <td>Swiss Re</td>
                      <td className="text-right">$7.2M</td>
                      <td className="text-right" style={{ color: 'var(--green)', fontWeight: 600 }}>$4.1M</td>
                      <td className="text-right" style={{ color: 'var(--orange, #e65100)', fontWeight: 600 }}>$3.1M</td>
                      <td>
                        <div className="aging-bar" style={{ width: '120px' }}>
                          <div className="aging-seg" style={{ width: '48%', background: '#2e7d32' }} title="0-30d" />
                          <div className="aging-seg" style={{ width: '22%', background: '#f57c00' }} title="31-60d" />
                          <div className="aging-seg" style={{ width: '16%', background: '#e65100' }} title="61-90d" />
                          <div className="aging-seg" style={{ width: '14%', background: '#c62828' }} title="90+d" />
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="cell-link">TRT-2025-002</td>
                      <td>Munich Re</td>
                      <td className="text-right">$1.1M</td>
                      <td className="text-right" style={{ color: 'var(--green)', fontWeight: 600 }}>$800,000</td>
                      <td className="text-right" style={{ color: 'var(--orange, #e65100)', fontWeight: 600 }}>$300,000</td>
                      <td>
                        <div className="aging-bar" style={{ width: '120px' }}>
                          <div className="aging-seg" style={{ width: '65%', background: '#2e7d32' }} />
                          <div className="aging-seg" style={{ width: '26%', background: '#f57c00' }} />
                          <div className="aging-seg" style={{ width: '9%', background: '#e65100' }} />
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="cell-link">TRT-2025-004</td>
                      <td>Hannover Re</td>
                      <td className="text-right">$4.8M</td>
                      <td className="text-right" style={{ color: 'var(--green)', fontWeight: 600 }}>$2.6M</td>
                      <td className="text-right" style={{ color: 'var(--orange, #e65100)', fontWeight: 600 }}>$2.2M</td>
                      <td>
                        <div className="aging-bar" style={{ width: '120px' }}>
                          <div className="aging-seg" style={{ width: '42%', background: '#2e7d32' }} />
                          <div className="aging-seg" style={{ width: '24%', background: '#f57c00' }} />
                          <div className="aging-seg" style={{ width: '20%', background: '#e65100' }} />
                          <div className="aging-seg" style={{ width: '14%', background: '#c62828' }} />
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="form-card">
              <div className="ri-section-hdr" style={{ padding: '14px 18px' }}>
                <div className="ri-section-title" style={{ fontSize: '13px' }}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6" stroke="#e65100" strokeWidth="1.5" />
                    <path d="M8 5v3l2 2" stroke="#e65100" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  §9.1.3 Recovery Aging Dashboard
                </div>
              </div>
              <div style={{ padding: '16px 18px' }}>
                <div style={{ fontSize: '11.5px', color: 'var(--gray-500)', marginBottom: '14px' }}>
                  Outstanding recoverables by aging bucket
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '3px' }}>
                      <span>0 - 30 Days (Current)</span>
                      <span className="font-bold" style={{ color: '#2e7d32' }}>$2.4M (41%)</span>
                    </div>
                    <div className="progress-bar" style={{ height: '8px' }}><div className="progress-fill pf-green" style={{ width: '41%' }} /></div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '3px' }}>
                      <span>31 - 60 Days</span>
                      <span className="font-bold" style={{ color: '#f57c00' }}>$1.6M (28%)</span>
                    </div>
                    <div className="progress-bar" style={{ height: '8px' }}><div className="progress-fill pf-orange" style={{ width: '28%' }} /></div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '3px' }}>
                      <span>61 - 90 Days</span>
                      <span className="font-bold" style={{ color: '#e65100' }}>$1.1M (19%)</span>
                    </div>
                    <div className="progress-bar" style={{ height: '8px' }}><div className="progress-fill pf-coral" style={{ width: '19%' }} /></div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '3px' }}>
                      <span>90+ Days (Overdue)</span>
                      <span className="font-bold" style={{ color: '#c62828' }}>$700K (12%)</span>
                    </div>
                    <div className="progress-bar" style={{ height: '8px' }}><div className="progress-fill" style={{ width: '12%', background: '#c62828' }} /></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2 - Treaty Builder */}
      {activeTab === 'treaty-builder' && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--gray-900)' }}>§9.2 Graphical Treaty Builder</div>
              <div style={{ fontSize: '12px', color: 'var(--gray-500)', marginTop: '2px' }}>
                Visual multi-layer program structure with real-time preview
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="btn btn-outline"
                onClick={() => {
                  setTbName('');
                  showToast('Treaty Builder reset', 'info');
                }}
              >
                Reset
              </button>
              <button className="btn btn-primary" onClick={handleSaveTreaty}>
                Save Treaty
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '20px', alignItems: 'start' }}>
            {/* Left: Form */}
            <div>
              <div className="ri-form-section">
                <div className="ri-form-section-hdr">Treaty Identification</div>
                <div className="ri-form-section-body">
                  <div className="ri-form-grid-2">
                    <div className="ri-field">
                      <label>Treaty ID</label>
                      <input type="text" value={tbId} onChange={(e) => setTbId(e.target.value)} />
                    </div>
                    <div className="ri-field">
                      <label>Treaty Name</label>
                      <input type="text" placeholder="e.g. Property QS 35%" value={tbName} onChange={(e) => setTbName(e.target.value)} />
                    </div>
                    <div className="ri-field">
                      <label>Treaty Type</label>
                      <select value={tbType} onChange={(e) => setTbType(e.target.value)}>
                        <option>Proportional (Quota Share / Surplus)</option>
                        <option>Non-Proportional (XoL)</option>
                        <option>Catastrophe XoL</option>
                        <option>Stop Loss</option>
                      </select>
                    </div>
                    <div className="ri-field">
                      <label>Reinsurer</label>
                      <select value={tbReinsurer} onChange={(e) => setTbReinsurer(e.target.value)}>
                        <option>Swiss Re</option>
                        <option>Munich Re</option>
                        <option>Hannover Re</option>
                        <option>Lloyd's Synd. 2003</option>
                        <option>Gen Re</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="ri-form-section">
                <div className="ri-form-section-hdr">Financial Terms &amp; Boundaries</div>
                <div className="ri-form-section-body">
                  <div className="ri-form-grid-2">
                    <div className="ri-field">
                      <label>Retention ($)</label>
                      <input type="number" value={tbRetention} onChange={(e) => setTbRetention(e.target.value)} />
                    </div>
                    <div className="ri-field">
                      <label>Limit ($)</label>
                      <input type="number" value={tbLimit} onChange={(e) => setTbLimit(e.target.value)} />
                    </div>
                    <div className="ri-field">
                      <label>Ceded Share (%)</label>
                      <input type="number" value={tbShare} onChange={(e) => setTbShare(e.target.value)} />
                    </div>
                    <div className="ri-field">
                      <label>Ceding Commission (%)</label>
                      <input type="number" value={tbComm} onChange={(e) => setTbComm(e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="ri-form-section">
                <div className="ri-form-section-hdr">Scope &amp; Exclusions</div>
                <div className="ri-form-section-body">
                  <div className="ri-field">
                    <label>Exclusions</label>
                    <div className="ri-exclusions-box">War, Terrorism, Nuclear, Communicable Disease, Cyber (standalone)</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Program Tower */}
            <div className="form-card" style={{ padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--navy)' }}>Reinsurance Program Tower</div>
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--gray-500)', marginBottom: '14px' }}>
                Visual representation of current treaty layers
              </div>

              <div className="tower-axis-label">↑ HIGHER ATTACHMENT / CATASTROPHE LAYERS</div>

              <div className="program-tower">
                <div className="tower-layer tl-cat">
                  <div className="tower-layer-icon" style={{ background: 'rgba(153,27,27,0.12)' }}>⚡</div>
                  <div className="tower-layer-info">
                    <div className="tower-layer-name">Cat XoL Layer</div>
                    <div className="tower-layer-sub">Lloyd's · Attaches at $5.0M · Limit $10.0M</div>
                  </div>
                  <div className="tower-layer-id">TRT-003</div>
                </div>
                <div className="tower-layer tl-risk">
                  <div className="tower-layer-icon" style={{ background: 'rgba(146,64,14,0.12)' }}>📦</div>
                  <div className="tower-layer-info">
                    <div className="tower-layer-name">Risk XoL Layer</div>
                    <div className="tower-layer-sub">Munich Re · Attaches at $2.0M · Limit $5.0M</div>
                  </div>
                  <div className="tower-layer-id">TRT-002</div>
                </div>
                <div className="tower-layer tl-surplus">
                  <div className="tower-layer-icon" style={{ background: 'rgba(91,33,182,0.12)' }}>%</div>
                  <div className="tower-layer-info">
                    <div className="tower-layer-name">Surplus Share 20%</div>
                    <div className="tower-layer-sub">Hannover Re · Limit $8.0M</div>
                  </div>
                  <div className="tower-layer-id">TRT-004</div>
                </div>
                <div className="tower-layer tl-qs">
                  <div className="tower-layer-icon" style={{ background: 'rgba(30,64,175,0.12)' }}>🏢</div>
                  <div className="tower-layer-info">
                    <div className="tower-layer-name">Property QS 30%</div>
                    <div className="tower-layer-sub">Swiss Re · Limit $15.0M</div>
                  </div>
                  <div className="tower-layer-id">TRT-001</div>
                </div>
                <div className="tower-layer tl-net">
                  <div className="tower-layer-icon" style={{ background: 'rgba(0,0,0,0.06)' }}>🛡</div>
                  <div className="tower-layer-info">
                    <div className="tower-layer-name">Net Retention</div>
                    <div className="tower-layer-sub">Veridex's retained risk after all cessions</div>
                  </div>
                </div>
              </div>

              <div className="tower-axis-label">↓ GROUND-UP / RETAINED RISK</div>

              <div className="prog-summary">
                <div className="prog-summary-title">Program Summary</div>
                <div className="prog-summary-grid">
                  <div className="prog-summary-item">Total Ceded Premium<strong>$27.8M</strong></div>
                  <div className="prog-summary-item">Active Treaties<strong>5</strong></div>
                  <div className="prog-summary-item">Proportional Layers<strong>3</strong></div>
                  <div className="prog-summary-item">XoL / Cat Layers<strong>2</strong></div>
                  <div className="prog-summary-item">Max Limit (Cat)<strong>$10.0M</strong></div>
                  <div className="prog-summary-item">Stop Loss<strong>$20.0M at 90% LR</strong></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3 - Allocation Engine */}
      {activeTab === 'allocation-engine' && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '20px' }}>
            <div className="stat-card-ri">
              <div className="ri-stat-label">Active Rules</div>
              <div className="ri-stat-value" style={{ color: 'var(--navy)' }}>7</div>
              <div className="ri-stat-sub" style={{ color: 'var(--gray-400)' }}>6 auto · 1 manual</div>
            </div>
            <div className="stat-card-ri">
              <div className="ri-stat-label">Allocations Today</div>
              <div className="ri-stat-value" style={{ color: 'var(--green)' }}>12</div>
              <div className="ri-stat-sub" style={{ color: 'var(--gray-400)' }}>All posted successfully</div>
            </div>
            <div className="stat-card-ri">
              <div className="ri-stat-label">Premium Ceded Today</div>
              <div className="ri-stat-value">$654K</div>
              <div className="ri-stat-sub" style={{ color: 'var(--gray-400)' }}>Via auto-ceding rules</div>
            </div>
            <div className="stat-card-ri">
              <div className="ri-stat-label">Losses Apportioned</div>
              <div className="ri-stat-value">$29.4K</div>
              <div className="ri-stat-sub" style={{ color: 'var(--gray-400)' }}>Today's claims cession</div>
            </div>
            <div className="stat-card-ri">
              <div className="ri-stat-label">Pipeline Status</div>
              <div className="ri-stat-value" style={{ fontSize: '16px', marginTop: '4px' }}>
                <span className="pipeline-ok"><span className="pipeline-ok-dot"></span> Healthy</span>
              </div>
              <div className="ri-stat-sub" style={{ color: 'var(--green)' }}>All systems healthy</div>
            </div>
          </div>

          <div className="form-card" style={{ marginBottom: '16px' }}>
            <div className="ri-section-hdr">
              <div className="ri-section-title">§9.3.1 Allocation Rule Base</div>
              <div className="ri-section-actions">
                <button
                  className="btn btn-sm"
                  style={{ background: '#2e7d32', color: 'white' }}
                  onClick={() => showToast('Running all 7 active allocation rules across open cessions...', 'info')}
                >
                  ▶ Run All Rules
                </button>
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Rule Name</th>
                    <th>Treaty</th>
                    <th>Trigger Event</th>
                    <th>LOBs</th>
                    <th>Calculation Formula</th>
                    <th>Mode</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>1</td>
                    <td style={{ fontWeight: 600 }}>QS Premium Ceding 30%</td>
                    <td className="cell-link">TRT-2025-001</td>
                    <td>Policy Written</td>
                    <td>Commercial Property</td>
                    <td><code style={{ background: 'var(--blue-bg, #eff6ff)', color: '#1e40af', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>Written × 30%</code></td>
                    <td><span className="badge badge-auto">⚡ Auto</span></td>
                    <td><span className="badge badge-green">Active</span></td>
                    <td>
                      <button
                        className="btn btn-icon btn-outline btn-xs"
                        onClick={() => handleRunRule('QS Premium Ceding 30%', 'TRT-2025-001', 'Premium', '$540,000', '$162,000')}
                      >
                        Run
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td>2</td>
                    <td style={{ fontWeight: 600 }}>QS Loss Ceding 30%</td>
                    <td className="cell-link">TRT-2025-001</td>
                    <td>Claim Payment</td>
                    <td>Commercial Property</td>
                    <td><code style={{ background: 'var(--blue-bg, #eff6ff)', color: '#1e40af', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>Paid × 30%</code></td>
                    <td><span className="badge badge-auto">⚡ Auto</span></td>
                    <td><span className="badge badge-green">Active</span></td>
                    <td>
                      <button
                        className="btn btn-icon btn-outline btn-xs"
                        onClick={() => handleRunRule('QS Loss Ceding 30%', 'TRT-2025-001', 'Loss', '$38,400', '$11,520')}
                      >
                        Run
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td>3</td>
                    <td style={{ fontWeight: 600 }}>XoL Layer Trigger</td>
                    <td className="cell-link">TRT-2025-002</td>
                    <td>Per-risk loss &gt; $2M</td>
                    <td>All Casualty</td>
                    <td><code style={{ background: 'var(--blue-bg, #eff6ff)', color: '#1e40af', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>Min(Loss−$2M, $5M)</code></td>
                    <td><span className="badge badge-auto">⚡ Auto</span></td>
                    <td><span className="badge badge-green">Active</span></td>
                    <td>
                      <button
                        className="btn btn-icon btn-outline btn-xs"
                        onClick={() => handleRunRule('XoL Layer Trigger', 'TRT-2025-002', 'Loss', '$2,850,000', '$850,000')}
                      >
                        Run
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="form-card">
            <div className="ri-section-hdr">
              <div className="ri-section-title">§9.3.2 Real-Time Allocation Pipeline Log</div>
              <div className="ri-section-actions">
                <select className="filter-select" value={logFilter} onChange={(e) => setLogFilter(e.target.value)}>
                  <option value="">All Events</option>
                  <option value="Premium">Premium</option>
                  <option value="Loss">Loss</option>
                  <option value="System">System</option>
                </select>
                <button className="btn btn-outline btn-sm" onClick={() => showToast('Exporting pipeline log to CSV...', 'info')}>
                  Export
                </button>
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Source Ref</th>
                    <th>Event Type</th>
                    <th className="text-right">Original Amt</th>
                    <th>Rule / Treaty</th>
                    <th className="text-right">Ceded Amt</th>
                    <th>Mode</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((l, idx) => (
                    <tr key={idx}>
                      <td>{l.time}</td>
                      <td className="cell-link font-semibold">{l.ref}</td>
                      <td><span className={`badge ${l.type === 'Premium' ? 'badge-blue' : l.type === 'Loss' ? 'badge-red' : 'badge-gray'}`}>{l.type}</span></td>
                      <td className="text-right font-semibold">{l.orig}</td>
                      <td>{l.rule}</td>
                      <td className="text-right font-bold text-navy">{l.ceded}</td>
                      <td><span className={`badge ${l.mode === 'Auto' ? 'badge-auto' : 'badge-manual'}`}>{l.mode}</span></td>
                      <td><span className={`badge ${l.result === 'POSTED' ? 'badge-posted' : 'badge-below-ret'}`}>{l.result}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
