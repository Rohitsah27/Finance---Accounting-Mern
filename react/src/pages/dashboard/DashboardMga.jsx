import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';
import './dashboard.css';

export function DashboardMga() {
  const { currentUser } = useAuth();
  const [period, setPeriod] = useState('mtd');
  const [carrier, setCarrier] = useState('all');
  const [lob, setLob] = useState('all');
  const [chartView, setChartView] = useState('bar');
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const CARRIERS = [
    {
      id: 'Southlake',
      name: 'Southlake Insurance Co.',
      program: 'Commercial Property & Inland Marine',
      icon: '🏛️',
      color: '#0d1b4b',
      limit: 8.0,
      used: 5.4,
      structure: 'Flat 18%',
      trigger: 'Loss ratio ≤ 55%',
      commission: '$328,000'
    },
    {
      id: 'Meridian',
      name: 'Meridian Insurance Group',
      program: 'General Casualty & Excess Liability',
      icon: '⚖️',
      color: '#6a1b9a',
      limit: 5.0,
      used: 3.8,
      structure: 'Sliding Scale 15–22%',
      trigger: 'Loss ratio 45–60% band',
      commission: '$244,400'
    },
    {
      id: 'Atlas',
      name: 'Atlas Specialty Underwriters',
      program: 'Commercial Auto Fleet & Cargo',
      icon: '🚗',
      color: '#2e7d32',
      limit: 3.5,
      used: 2.1,
      structure: 'Flat 16%',
      trigger: 'Loss ratio ≤ 58%',
      commission: '$120,000'
    }
  ];

  const [bdxList, setBdxList] = useState([
    { carrier: 'Southlake Insurance Co.', type: 'Premium Bordereau', period: 'July 2026', due: '2026-08-15', status: 'Submitted' },
    { carrier: 'Southlake Insurance Co.', type: 'Claims Bordereau', period: 'July 2026', due: '2026-08-15', status: 'Reconciled' },
    { carrier: 'Meridian Insurance Group', type: 'Premium Bordereau', period: 'July 2026', due: '2026-08-20', status: 'Pending Review' },
    { carrier: 'Atlas Specialty Underwriters', type: 'Combined Bordereau', period: 'July 2026', due: '2026-08-25', status: 'Drafting' },
  ]);

  const TREND_DATA = [
    { label: 'Wk 1', val: 0.85 },
    { label: 'Wk 2', val: 0.98 },
    { label: 'Wk 3', val: 1.05 },
    { label: 'Wk 4', val: 0.97 },
  ];

  const submitBdx = (idx) => {
    setBdxList(prev => prev.map((b, i) => i === idx ? { ...b, status: 'Submitted' } : b));
    showToast('Bordereau package transmitted to carrier SFTP', 'success');
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
          <div className="page-title">MGA Operations Dashboard</div>
          <div className="page-subtitle">
            Program administration, binding authority limits, carrier settlements, and bordereau surveillance
          </div>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline btn-sm" onClick={() => showToast('Commission statement exported', 'success')}>
            Export Statement
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => showToast('MGA metrics refreshed')}>
            Refresh
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar" style={{ marginBottom: '18px' }}>
        <span className="filter-bar-label">Period</span>
        <select className="filter-select" value={period} onChange={(e) => setPeriod(e.target.value)}>
          <option value="mtd">MTD Aug 2026</option>
          <option value="ytd">YTD 2026</option>
          <option value="q2">Q2 2026</option>
        </select>

        <span className="filter-bar-label">Carrier Program</span>
        <select className="filter-select" value={carrier} onChange={(e) => setCarrier(e.target.value)}>
          <option value="all">All Carrier Programs</option>
          <option value="Southlake">Southlake Insurance Co.</option>
          <option value="Meridian">Meridian Insurance Group</option>
          <option value="Atlas">Atlas Specialty Underwriters</option>
        </select>

        <span className="filter-bar-label">LOB</span>
        <select className="filter-select" value={lob} onChange={(e) => setLob(e.target.value)}>
          <option value="all">All Lines of Business</option>
          <option value="Property">Commercial Property</option>
          <option value="Casualty">General Casualty</option>
          <option value="Auto">Commercial Auto</option>
        </select>

        <div className="filter-spacer" />
        <button className="btn btn-outline btn-sm" onClick={() => { setPeriod('mtd'); setCarrier('all'); setLob('all'); }}>
          Clear Filters
        </button>
      </div>

      {/* 6 KPI Cards Row */}
      <div className="kpi-metrics-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="kpi-mc c-bound">
          <div className="kpi-mc-label">Bound Written Premium</div>
          <div className="kpi-mc-value">$3,850,000</div>
          <div className="kpi-mc-delta up">↑ +10.2% vs Budget</div>
          <div className="kpi-mc-sublabel">214 Bound Policies MTD</div>
          <span className="kpi-mc-status s-ontrack">On Track</span>
        </div>

        <div className="kpi-mc c-bdx">
          <div className="kpi-mc-label">Bordereau Transmission Status</div>
          <div className="kpi-mc-value" style={{ color: '#2e7d32' }}>Current</div>
          <div className="kpi-mc-delta up">3 of 3 Carriers on Schedule</div>
          <div className="kpi-mc-sublabel">Next Due: 25 Aug (Atlas)</div>
          <span className="kpi-mc-status s-ontrack">Compliant</span>
        </div>

        <div className="kpi-mc c-comm">
          <div className="kpi-mc-label">MGA Commission Earned</div>
          <div className="kpi-mc-value" style={{ color: '#2e7d32' }}>$692,400</div>
          <div className="kpi-mc-delta up">Avg Rate: 18.0%</div>
          <div className="kpi-mc-sublabel">Net Producer Payables Cleared</div>
          <span className="kpi-mc-status s-strong">Strong</span>
        </div>

        <div className="kpi-mc c-credit">
          <div className="kpi-mc-label">Aggregate Credit Line Utilization</div>
          <div className="kpi-mc-value" style={{ color: '#e65100' }}>68.4%</div>
          <div className="kpi-mc-delta warn">$11.3M of $16.5M Limit</div>
          <div className="kpi-mc-sublabel">Headroom: $5.2M Remaining</div>
          <span className="kpi-mc-status s-watch">Watch</span>
        </div>

        <div className="kpi-mc c-sub">
          <div className="kpi-mc-label">Active Sub-Producers</div>
          <div className="kpi-mc-value">48</div>
          <div className="kpi-mc-delta up">↑ +3 New Onboarded</div>
          <div className="kpi-mc-sublabel">6 On Performance Watch</div>
          <span className="kpi-mc-status s-ontrack">Active</span>
        </div>

        <div className="kpi-mc c-loss">
          <div className="kpi-mc-label">Incurred Loss Ratio</div>
          <div className="kpi-mc-value" style={{ color: '#2e7d32' }}>53.2%</div>
          <div className="kpi-mc-delta up">Threshold: 58.0%</div>
          <div className="kpi-mc-sublabel">Contingent Bonus Tier Met</div>
          <span className="kpi-mc-status s-strong">Bonus Qualified</span>
        </div>
      </div>

      {/* Bound Premium Trend Chart */}
      <div className="chart-card" style={{ marginBottom: '18px' }}>
        <div className="chart-card-hdr">
          <div>
            <div className="chart-title">Bound Premium Trend</div>
            <div className="chart-sub">Weekly Production Volume · {period.toUpperCase()}</div>
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => setChartView(chartView === 'bar' ? 'line' : 'bar')}>
            {chartView === 'bar' ? 'Line View' : 'Bar View'}
          </button>
        </div>
        
        {chartView === 'bar' ? (
          <div style={{ height: '160px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', padding: '10px 20px', borderBottom: '1px solid #e2e8f0' }}>
            {TREND_DATA.map((t, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '60px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--navy, #0d1b4b)', marginBottom: '6px' }}>
                  ${t.val}M
                </div>
                <div style={{
                  width: '38px',
                  height: `${t.val * 110}px`,
                  background: 'linear-gradient(180deg, #0d1b4b 0%, #1a237e 100%)',
                  borderRadius: '6px 6px 0 0',
                  transition: 'height 0.3s ease'
                }} />
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--gray-600, #475569)', marginTop: '6px' }}>
                  {t.label}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ height: '160px', position: 'relative', borderBottom: '1px solid #e2e8f0', padding: '10px' }}>
            <svg width="100%" height="100%" viewBox="0 0 400 140" preserveAspectRatio="none">
              <path d="M 40 100 L 140 70 L 250 40 L 360 60" fill="none" stroke="#0d1b4b" strokeWidth="3" />
              {[
                { cx: 40, cy: 100 },
                { cx: 140, cy: 70 },
                { cx: 250, cy: 40 },
                { cx: 360, cy: 60 }
              ].map((p, i) => (
                <circle key={i} cx={p.cx} cy={p.cy} r="4" fill="#1565c0" stroke="#fff" strokeWidth="2" />
              ))}
            </svg>
          </div>
        )}

        <div className="chart-legend">
          <div className="legend-item"><div className="legend-dot" style={{ background: '#0d1b4b' }} />Bound Premium</div>
        </div>
      </div>

      {/* Carrier Program Directory Cards */}
      <div className="chart-card" style={{ marginBottom: '18px' }}>
        <div className="chart-card-hdr">
          <div>
            <div className="chart-title">Carrier Program Directory &amp; Binding Authority</div>
            <div className="chart-sub">Underwriting capacity and credit limit utilization per carrier agreement</div>
          </div>
        </div>
        <div className="mga-cards-row">
          {CARRIERS.map(c => {
            const pct = Math.round((c.used / c.limit) * 100);
            return (
              <div className="mga-card" key={c.id}>
                <div className="mga-card-hd">
                  <div className="mga-icon" style={{ background: '#f1f5f9' }}>{c.icon}</div>
                  <div>
                    <div className="mga-name">{c.name}</div>
                    <div className="mga-full">{c.program}</div>
                  </div>
                </div>
                <div className="mga-stats">
                  <div>
                    <div className="mga-stat-lbl">Capacity Bound</div>
                    <div className="mga-stat-val">${c.used}M</div>
                  </div>
                  <div>
                    <div className="mga-stat-lbl">Program Limit</div>
                    <div className="mga-stat-val">${c.limit}M</div>
                  </div>
                </div>
                <div className="mga-bar-bg">
                  <div
                    className="mga-bar-fill"
                    style={{
                      width: `${pct}%`,
                      background: pct > 75 ? '#e65100' : '#0d1b4b'
                    }}
                  />
                </div>
                <div className="mga-bar-lbl" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                  <span>{pct}% Utilized</span>
                  <span>${(c.limit - c.used).toFixed(1)}M Headroom</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bordereau Submission Status Table */}
      <div className="chart-card" style={{ marginBottom: '18px' }}>
        <div className="chart-card-hdr">
          <div>
            <div className="chart-title">Bordereau Submission Status</div>
            <div className="chart-sub">Monthly automated bordereaux reporting to carrier partners</div>
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => showToast('Bordereau calendar exported', 'success')}>
            Export Schedule
          </button>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Carrier</th>
              <th>Bordereau Type</th>
              <th>Period</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {bdxList.map((b, idx) => (
              <tr key={idx}>
                <td className="font-semibold">{b.carrier}</td>
                <td><span className="badge badge-navy">{b.type}</span></td>
                <td>{b.period}</td>
                <td>{b.due}</td>
                <td>
                  <span className={`badge ${b.status === 'Submitted' || b.status === 'Reconciled' ? 'badge-green' : b.status === 'Pending Review' ? 'badge-orange' : 'badge-gray'}`}>
                    {b.status}
                  </span>
                </td>
                <td>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => submitBdx(idx)}
                    disabled={b.status === 'Submitted' || b.status === 'Reconciled'}
                  >
                    {b.status === 'Submitted' || b.status === 'Reconciled' ? 'Transmitted' : 'Submit BDX'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Commission Statement Summary */}
      <div className="chart-card" style={{ marginBottom: '18px' }}>
        <div className="chart-card-hdr">
          <div>
            <div className="chart-title">Commission Statement Summary</div>
            <div className="chart-sub">Contracted fee schedules and contingent profit share triggers</div>
          </div>
          <Link to="/commission-engine" className="btn btn-outline btn-sm">
            Open Commission Engine
          </Link>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Carrier</th>
              <th>Commission Structure</th>
              <th>Trigger Condition</th>
              <th>Commission Earned MTD</th>
            </tr>
          </thead>
          <tbody>
            {CARRIERS.map(c => (
              <tr key={c.id}>
                <td className="font-semibold">{c.name}</td>
                <td><span className="badge badge-blue">{c.structure}</span></td>
                <td style={{ fontSize: '11.5px', color: 'var(--gray-600, #475569)' }}>{c.trigger}</td>
                <td className="font-semibold" style={{ color: '#2e7d32' }}>{c.commission}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
