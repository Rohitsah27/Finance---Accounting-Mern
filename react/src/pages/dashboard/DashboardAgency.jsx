import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';
import './dashboard.css';

export function DashboardAgency() {
  const { currentUser } = useAuth();
  const [period, setPeriod] = useState('ytd');
  const [partner, setPartner] = useState('all');
  const [bizType, setBizType] = useState('all');
  const [chartType, setChartType] = useState('bar');
  const [renewalWindow, setRenewalWindow] = useState(30);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const BOOK_PARTNERS = [
    { name: 'Southlake Insurance Co.', policies: 184, premium: '$1,240,000', commission: '$186,000', rate: '15.0%' },
    { name: 'FUT Program Managers (MGA)', policies: 142, premium: '$920,000', commission: '$128,800', rate: '14.0%' },
    { name: 'Meridian Insurance Group', policies: 92, premium: '$680,000', commission: '$82,800', rate: '12.2%' },
  ];

  const PRODUCERS = [
    { rank: 1, name: 'Sarah Jenkins', placed: '$890,000', policies: 112, pct: 100 },
    { rank: 2, name: 'Michael Chang', placed: '$740,000', policies: 94, pct: 83 },
    { rank: 3, name: 'Amanda Lewis', placed: '$580,000', policies: 78, pct: 65 },
    { rank: 4, name: 'David Ross', placed: '$420,000', policies: 56, pct: 47 },
    { rank: 5, name: 'Elena Rostova', placed: '$210,000', policies: 32, pct: 24 }
  ];

  const AR_AGEING = [
    { bucket: 'Current (0-30 Days)', amt: '$58,400', pct: '67.6%' },
    { bucket: '31-60 Days', amt: '$18,200', pct: '21.1%' },
    { bucket: '61-90 Days', amt: '$6,800', pct: '7.9%' },
    { bucket: '90+ Days', amt: '$3,000', pct: '3.4%' }
  ];

  const ALL_RENEWALS = [
    { insured: 'Apex Logistics LLC', partner: 'Southlake Insurance Co.', expiry: '2026-09-02', days: 12, premium: '$24,500', status: 'In Review', window: 30 },
    { insured: 'BioHealth Tech Inc.', partner: 'FUT Program Managers', expiry: '2026-09-14', days: 24, premium: '$18,200', status: 'Quote Sent', window: 30 },
    { insured: 'Summit Ridge Resorts', partner: 'Meridian Insurance Group', expiry: '2026-09-28', days: 38, premium: '$42,000', status: 'Awaiting Bind', window: 60 },
    { insured: 'Coastal Marine Charter', partner: 'Southlake Insurance Co.', expiry: '2026-10-10', days: 50, premium: '$31,500', status: 'Upcoming', window: 60 },
    { insured: 'Pinnacle Freight Corp', partner: 'FUT Program Managers', expiry: '2026-11-04', days: 75, premium: '$54,000', status: 'Upcoming', window: 90 },
  ];

  const filteredRenewals = useMemo(() => {
    return ALL_RENEWALS.filter(r => r.days <= renewalWindow);
  }, [renewalWindow]);

  const MONTHLY_TREND = [
    { month: 'Jan', val: 380 },
    { month: 'Feb', val: 420 },
    { month: 'Mar', val: 490 },
    { month: 'Apr', val: 460 },
    { month: 'May', val: 530 },
    { month: 'Jun', val: 560 }
  ];

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
          <div className="page-title">Agency &amp; Broker Dashboard</div>
          <div className="page-subtitle">
            Producer book of business, placement production, commission receivables, and renewal pipeline
          </div>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline btn-sm" onClick={() => showToast('Book of business exported', 'success')}>
            Export Book
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => showToast('Agency metrics refreshed')}>
            Refresh
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar" style={{ marginBottom: '18px' }}>
        <span className="filter-bar-label">Period</span>
        <select className="filter-select" value={period} onChange={(e) => setPeriod(e.target.value)}>
          <option value="ytd">YTD 2026</option>
          <option value="q2">Q2 2026</option>
          <option value="fy2025">FY 2025</option>
        </select>

        <span className="filter-bar-label">Carrier / MGA</span>
        <select className="filter-select" value={partner} onChange={(e) => setPartner(e.target.value)}>
          <option value="all">All Partners</option>
          <option value="Southlake">Southlake Insurance Co.</option>
          <option value="FUT">FUT Program Managers</option>
          <option value="Meridian">Meridian Insurance Group</option>
        </select>

        <span className="filter-bar-label">Business Type</span>
        <select className="filter-select" value={bizType} onChange={(e) => setBizType(e.target.value)}>
          <option value="all">New &amp; Renewal</option>
          <option value="New">New Business</option>
          <option value="Renewal">Renewal</option>
        </select>

        <div className="filter-spacer" />
        <button className="btn btn-outline btn-sm" onClick={() => { setPeriod('ytd'); setPartner('all'); setBizType('all'); }}>
          Clear Filters
        </button>
      </div>

      {/* 6 KPI Cards Row */}
      <div className="kpi-metrics-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="kpi-mc c-placed">
          <div className="kpi-mc-label">Premium Placed YTD</div>
          <div className="kpi-mc-value">$2,840,000</div>
          <div className="kpi-mc-delta up">↑ +12.4% vs Target</div>
          <div className="kpi-mc-sublabel">418 Total Placements</div>
          <span className="kpi-mc-status s-ontrack">On Track</span>
        </div>

        <div className="kpi-mc c-commission">
          <div className="kpi-mc-label">Agency Commission Income</div>
          <div className="kpi-mc-value" style={{ color: '#2e7d32' }}>$397,600</div>
          <div className="kpi-mc-delta up">↑ 14.0% Blended Take Rate</div>
          <div className="kpi-mc-sublabel">$311,200 Collected to Date</div>
          <span className="kpi-mc-status s-strong">Strong</span>
        </div>

        <div className="kpi-mc c-pif">
          <div className="kpi-mc-label">Policies in Force (PIF)</div>
          <div className="kpi-mc-value">418</div>
          <div className="kpi-mc-delta up">↑ +28 Net Growth YTD</div>
          <div className="kpi-mc-sublabel">Avg Policy Size: $6,794</div>
          <span className="kpi-mc-status s-ontrack">Active</span>
        </div>

        <div className="kpi-mc c-retention">
          <div className="kpi-mc-label">Policy Retention Rate</div>
          <div className="kpi-mc-value" style={{ color: '#6a1b9a' }}>91.2%</div>
          <div className="kpi-mc-delta up">↑ +1.8 pts vs Prior Year</div>
          <div className="kpi-mc-sublabel">Target: ≥ 90.0%</div>
          <span className="kpi-mc-status s-strong">Strong</span>
        </div>

        <div className="kpi-mc c-ar">
          <div className="kpi-mc-label">AR Due from Carriers</div>
          <div className="kpi-mc-value" style={{ color: '#e65100' }}>$86,400</div>
          <div className="kpi-mc-delta up">DSO: 19 Days</div>
          <div className="kpi-mc-sublabel">96.6% within &lt;60 Days</div>
          <span className="kpi-mc-status s-ontrack">Healthy</span>
        </div>

        <div className="kpi-mc c-split">
          <div className="kpi-mc-label">New vs Renewal Split</div>
          <div className="kpi-mc-value" style={{ color: '#00838f' }}>38% / 62%</div>
          <div className="kpi-mc-delta up">New: $1.08M · Ren: $1.76M</div>
          <div className="kpi-mc-sublabel">Balanced Book Portfolio</div>
          <span className="kpi-mc-status s-ontrack">Balanced</span>
        </div>
      </div>

      {/* 2 Charts Row */}
      <div className="charts-2col">
        {/* Premium Placed Trend */}
        <div className="chart-card">
          <div className="chart-card-hdr">
            <div>
              <div className="chart-title">Premium Placed Trend</div>
              <div className="chart-sub">Monthly Volume ($K) · Jan–Jun 2026</div>
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => setChartType(chartType === 'bar' ? 'line' : 'bar')}>
              {chartType === 'bar' ? 'Line View' : 'Bar View'}
            </button>
          </div>

          {chartType === 'bar' ? (
            <div style={{ height: '160px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', padding: '10px 10px', borderBottom: '1px solid #e2e8f0' }}>
              {MONTHLY_TREND.map((m, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '40px' }}>
                  <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--navy, #0d1b4b)', marginBottom: '4px' }}>
                    ${m.val}K
                  </div>
                  <div style={{
                    width: '26px',
                    height: `${m.val * 0.22}px`,
                    background: 'linear-gradient(180deg, #0d1b4b 0%, #1565c0 100%)',
                    borderRadius: '4px 4px 0 0',
                    transition: 'height 0.3s ease'
                  }} />
                  <div style={{ fontSize: '10.5px', color: 'var(--gray-500, #64748b)', marginTop: '4px' }}>
                    {m.month}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ height: '160px', position: 'relative', borderBottom: '1px solid #e2e8f0', padding: '10px' }}>
              <svg width="100%" height="100%" viewBox="0 0 400 140" preserveAspectRatio="none">
                <path d="M 20 100 L 85 85 L 150 60 L 215 70 L 280 45 L 350 35" fill="none" stroke="#0d1b4b" strokeWidth="3" />
                {[
                  { cx: 20, cy: 100 },
                  { cx: 85, cy: 85 },
                  { cx: 150, cy: 60 },
                  { cx: 215, cy: 70 },
                  { cx: 280, cy: 45 },
                  { cx: 350, cy: 35 }
                ].map((p, i) => (
                  <circle key={i} cx={p.cx} cy={p.cy} r="4" fill="#1565c0" stroke="#fff" strokeWidth="2" />
                ))}
              </svg>
            </div>
          )}

          <div className="chart-legend">
            <div className="legend-item"><div className="legend-dot" style={{ background: '#0d1b4b' }} />Premium Placed</div>
          </div>
        </div>

        {/* New Business vs Renewal Breakdown */}
        <div className="chart-card">
          <div className="chart-card-hdr">
            <div>
              <div className="chart-title">New Business vs. Renewal</div>
              <div className="chart-sub">Portfolio share of placed premium</div>
            </div>
          </div>
          <div style={{ height: '160px', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 20px', borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, marginBottom: '8px' }}>
              <span style={{ color: '#0d1b4b' }}>New Business: 38% ($1.08M)</span>
              <span style={{ color: '#1565c0' }}>Renewals: 62% ($1.76M)</span>
            </div>
            <div style={{ height: '24px', display: 'flex', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{ width: '38%', background: '#0d1b4b' }} title="New Business 38%" />
              <div style={{ width: '62%', background: '#1565c0' }} title="Renewals 62%" />
            </div>
            <div style={{ fontSize: '11px', color: 'var(--gray-500, #64748b)', marginTop: '12px', textAlign: 'center' }}>
              Renewal persistency exceeds targeted 90% threshold by +1.2 percentage points.
            </div>
          </div>
          <div className="chart-legend">
            <div className="legend-item"><div className="legend-dot" style={{ background: '#0d1b4b' }} />New Business</div>
            <div className="legend-item"><div className="legend-dot" style={{ background: '#1565c0' }} />Renewal</div>
          </div>
        </div>
      </div>

      {/* Book of Business Table */}
      <div className="chart-card" style={{ marginBottom: '18px' }}>
        <div className="chart-card-hdr">
          <div>
            <div className="chart-title">Book of Business by Carrier / MGA</div>
            <div className="chart-sub">Premium placed &amp; commission earnings by carrier partner</div>
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => showToast('Book detail exported', 'success')}>
            Export
          </button>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Carrier / MGA Partner</th>
              <th>Active Policies</th>
              <th>Premium Placed</th>
              <th>Commission Income</th>
              <th>Avg Commission Rate</th>
            </tr>
          </thead>
          <tbody>
            {BOOK_PARTNERS.map((b, idx) => (
              <tr key={idx}>
                <td className="font-semibold">{b.name}</td>
                <td>{b.policies}</td>
                <td className="font-semibold">{b.premium}</td>
                <td className="font-semibold" style={{ color: '#2e7d32' }}>{b.commission}</td>
                <td><span className="badge badge-blue">{b.rate}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 2-Column Split: Producer Leaderboard & AR Ageing */}
      <div className="charts-2col">
        <div className="chart-card">
          <div className="chart-card-hdr">
            <div>
              <div className="chart-title">Producer Leaderboard</div>
              <div className="chart-sub">Top producing agents by written volume YTD</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {PRODUCERS.map(p => (
              <div key={p.rank} style={{ padding: '4px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span className={`lb-rank top${p.rank}`}>{p.rank}</span>
                    <strong style={{ color: 'var(--navy, #0d1b4b)' }}>{p.name}</strong>
                    <span style={{ fontSize: '11px', color: 'var(--gray-400, #94a3b8)', marginLeft: '8px' }}>
                      ({p.policies} policies)
                    </span>
                  </div>
                  <div className="font-semibold">{p.placed}</div>
                </div>
                <div className="lb-bar-bg">
                  <div className="lb-bar-fill" style={{ width: `${p.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-card-hdr">
            <div>
              <div className="chart-title">Accounts Receivable (AR) Ageing</div>
              <div className="chart-sub">Outstanding commissions from carriers</div>
            </div>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Ageing Bracket</th>
                <th>Amount</th>
                <th>Share</th>
              </tr>
            </thead>
            <tbody>
              {AR_AGEING.map((a, idx) => (
                <tr key={idx}>
                  <td className="font-semibold">{a.bucket}</td>
                  <td className="font-semibold">{a.amt}</td>
                  <td><span className="badge badge-orange">{a.pct}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upcoming Renewals Window Panel */}
      <div className="chart-card" style={{ marginBottom: '18px' }}>
        <div className="chart-card-hdr">
          <div>
            <div className="chart-title">Upcoming Policy Renewals</div>
            <div className="chart-sub">Filter policies expiring in the next 30 / 60 / 90 days</div>
          </div>
          <div className="gbn-toggle">
            <button className={`gbn-btn ${renewalWindow === 30 ? 'active' : ''}`} onClick={() => setRenewalWindow(30)}>30 Days</button>
            <button className={`gbn-btn ${renewalWindow === 60 ? 'active' : ''}`} onClick={() => setRenewalWindow(60)}>60 Days</button>
            <button className={`gbn-btn ${renewalWindow === 90 ? 'active' : ''}`} onClick={() => setRenewalWindow(90)}>90 Days</button>
          </div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Insured Client</th>
              <th>Carrier / MGA</th>
              <th>Expiration Date</th>
              <th>Expiring Premium</th>
              <th>Days Out</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredRenewals.map((r, idx) => (
              <tr key={idx}>
                <td className="font-semibold">{r.insured}</td>
                <td>{r.partner}</td>
                <td>{r.expiry}</td>
                <td className="font-semibold">{r.premium}</td>
                <td><span className="badge badge-navy">{r.days}d</span></td>
                <td>
                  <span className={`badge ${r.status === 'Quote Sent' ? 'badge-blue' : r.status === 'Awaiting Bind' ? 'badge-orange' : 'badge-gray'}`}>
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
