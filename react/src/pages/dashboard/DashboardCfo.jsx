import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';
import './dashboard.css';

export function DashboardCfo() {
  const { currentUser } = useAuth();
  const { cashBalances } = useFinance();
  const [period, setPeriod] = useState('ytd');
  const [entity, setEntity] = useState('all');
  const [basis, setBasis] = useState('gross');
  const [toast, setToast] = useState(null);
  const [acknowledgedRisks, setAcknowledgedRisks] = useState([]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const ENTITIES = [
    { id: 'ENT-01', name: 'Southlake Insurance Co.', type: 'Carrier', baseRev: 720, baseExp: 554 },
    { id: 'ENT-02', name: 'NTA Program Administrators', type: 'MGA', baseRev: 290, baseExp: 221 },
    { id: 'ENT-03', name: 'HIT Agency Group', type: 'Agency', baseRev: 180, baseExp: 112 },
    { id: 'ENT-04', name: 'AC Manufacturing Inc.', type: 'Corporate', baseRev: 410, baseExp: 335 },
    { id: 'ENT-05', name: 'AC Wholesale Distribution', type: 'Distribution', baseRev: 340, baseExp: 280 },
    { id: 'ENT-06', name: 'Links Insurance Agency', type: 'Agency', baseRev: 150, baseExp: 98 },
    { id: 'ENT-07', name: 'Starlight Re', type: 'Reinsurer', baseRev: 520, baseExp: 390 },
  ];

  const PERIOD_MULT = { mtd: 1, qtd: 3.05, ytd: 11.4 };

  const filteredEntities = useMemo(() => {
    return ENTITIES.filter(e => entity === 'all' || e.id === entity);
  }, [entity]);

  const consolData = useMemo(() => {
    const m = PERIOD_MULT[period] || 11.4;
    const nb = basis === 'net' ? 0.965 : 1.0;
    return filteredEntities.map(e => {
      const revenue = +(e.baseRev * m * nb).toFixed(1);
      const expense = +(e.baseExp * m * nb).toFixed(1);
      const ni = +(revenue - expense).toFixed(1);
      const margin = revenue > 0 ? +((ni / revenue) * 100).toFixed(1) : 0;
      return { ...e, revenue, expense, ni, margin };
    });
  }, [filteredEntities, period, basis]);

  const totals = useMemo(() => {
    const rev = consolData.reduce((a, r) => a + r.revenue, 0);
    const exp = consolData.reduce((a, r) => a + r.expense, 0);
    const ni = rev - exp;
    const margin = rev > 0 ? +((ni / rev) * 100).toFixed(1) : 0;
    const cash = 4200 * (period === 'mtd' ? 1 : period === 'qtd' ? 1.08 : 1.22) * (entity === 'all' ? 1 : 0.32);
    const ar = rev * 0.42;
    const ap = exp * 0.31;
    const wc = (cash + ar) - ap;
    return { rev, exp, ni, margin, cash, ar, ap, wc };
  }, [consolData, period, entity]);

  const fM = (v) => {
    if (v >= 1000) return '$' + (v / 1000).toFixed(2) + 'M';
    return '$' + Math.round(v) + 'K';
  };

  const initialRisks = [
    { id: 1, title: 'Trust Account Variance', desc: 'Client trust ledger shows a $12.4K unreconciled variance for 3 consecutive days.', level: 'badge-red', label: 'Critical' },
    { id: 2, title: 'Covenant Ratio Approaching Threshold', desc: 'Debt-service coverage ratio at 1.18x vs 1.15x covenant floor — 2.5% headroom remaining.', level: 'badge-orange', label: 'Watch' },
    { id: 3, title: 'Working Capital Concentration', desc: '62% of AR is concentrated in top 3 customers across AC Wholesale Distribution.', level: 'badge-orange', label: 'Watch' },
    { id: 4, title: 'FX Exposure — Starlight Re', desc: 'Unhedged ceded premium exposure in EUR increased 8% month-over-month.', level: 'badge-blue', label: 'Monitor' },
    { id: 5, title: 'Deferred Revenue Recognition Lag', desc: 'Unearned premium roll-forward is 4 days behind close calendar for 2 entities.', level: 'badge-gray', label: 'Monitor' },
  ];

  const handleAcknowledge = (id) => {
    setAcknowledgedRisks(prev => [...prev, id]);
    showToast(`Risk #${id} acknowledged`, 'info');
  };

  const resetFilters = () => {
    setPeriod('ytd');
    setEntity('all');
    setBasis('gross');
    showToast('Filters cleared', 'info');
  };

  const AR_AGING = [
    { bucket: 'Current (0-30 Days)', pct: 0.52 },
    { bucket: '31-60 Days', pct: 0.24 },
    { bucket: '61-90 Days', pct: 0.13 },
    { bucket: '90-120 Days', pct: 0.07 },
    { bucket: '120+ Days (Watchlist)', pct: 0.04 }
  ];

  const AP_AGING = [
    { bucket: 'Current (0-30 Days)', pct: 0.61 },
    { bucket: '31-60 Days', pct: 0.21 },
    { bucket: '61-90 Days', pct: 0.10 },
    { bucket: '90-120 Days', pct: 0.05 },
    { bucket: '120+ Days', pct: 0.03 }
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
          <div className="page-title">CFO Dashboard</div>
          <div className="page-subtitle">
            Executive financial overview · {entity === 'all' ? 'All Consolidated Entities' : ENTITIES.find(e => e.id === entity)?.name} (Veridex Core)
          </div>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline btn-sm" onClick={() => showToast('Dashboard refreshed')}>
            Refresh
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => showToast('Board Pack export queued', 'success')}>
            Export Board Pack
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar" style={{ marginBottom: '18px' }}>
        <span className="filter-bar-label">Period</span>
        <select className="filter-select" value={period} onChange={(e) => setPeriod(e.target.value)}>
          <option value="mtd">MTD (Month to Date)</option>
          <option value="qtd">QTD (Quarter to Date)</option>
          <option value="ytd">YTD (Year to Date 2026)</option>
        </select>

        <span className="filter-bar-label">Entity</span>
        <select className="filter-select" value={entity} onChange={(e) => setEntity(e.target.value)}>
          <option value="all">All Entities (Consolidated)</option>
          {ENTITIES.map(e => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>

        <span className="filter-bar-label">Basis</span>
        <select className="filter-select" value={basis} onChange={(e) => setBasis(e.target.value)}>
          <option value="gross">Gross</option>
          <option value="net">Net of Elims</option>
        </select>

        <div className="filter-spacer" />
        <span style={{ fontSize: '11px', color: 'var(--gray-400, #94a3b8)', marginRight: '8px' }}>
          {filteredEntities.length} entities active
        </span>
        <button className="btn btn-outline btn-sm" onClick={resetFilters}>
          Clear Filters
        </button>
      </div>

      {/* 6 KPI Cards Row */}
      <div className="cfo-kpi-row">
        <div className="cfo-kpi k-cash">
          <div className="cfo-kpi-label">Cash Position</div>
          <div className="cfo-kpi-val">{fM(totals.cash)}</div>
          <div className="cfo-kpi-delta up">↑ +4.2%</div>
          <div className="cfo-kpi-sub">Consolidated bank balances</div>
        </div>

        <div className="cfo-kpi k-wc">
          <div className="cfo-kpi-label">Working Capital</div>
          <div className="cfo-kpi-val">{fM(totals.wc)}</div>
          <div className="cfo-kpi-delta up">↑ +2.1%</div>
          <div className="cfo-kpi-sub">Cash + AR − AP</div>
        </div>

        <div className="cfo-kpi k-rev">
          <div className="cfo-kpi-label">Revenue ({period.toUpperCase()})</div>
          <div className="cfo-kpi-val">{fM(totals.rev)}</div>
          <div className="cfo-kpi-delta up">↑ +6.8%</div>
          <div className="cfo-kpi-sub">vs prior period</div>
        </div>

        <div className="cfo-kpi k-ni">
          <div className="cfo-kpi-label">Net Income ({period.toUpperCase()})</div>
          <div className="cfo-kpi-val" style={{ color: totals.ni >= 0 ? '#2e7d32' : '#c62828' }}>
            {fM(totals.ni)}
          </div>
          <div className={`cfo-kpi-delta ${totals.ni >= 0 ? 'up' : 'down'}`}>
            {totals.ni >= 0 ? '↑ +3.4%' : '↓ -1.9%'}
          </div>
          <div className="cfo-kpi-sub">Margin {totals.margin}%</div>
        </div>

        <div className="cfo-kpi k-ar">
          <div className="cfo-kpi-label">AR Outstanding</div>
          <div className="cfo-kpi-val">{fM(totals.ar)}</div>
          <div className="cfo-kpi-delta down">↓ -1.5%</div>
          <div className="cfo-kpi-sub">42% of revenue</div>
        </div>

        <div className="cfo-kpi k-ap">
          <div className="cfo-kpi-label">AP Outstanding</div>
          <div className="cfo-kpi-val">{fM(totals.ap)}</div>
          <div className="cfo-kpi-delta up">↑ +0.8%</div>
          <div className="cfo-kpi-sub">31% of expense</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="cfo-charts-row">
        {/* Cash Position Projection */}
        <div className="chart-card">
          <div className="chart-card-hdr">
            <div>
              <div className="chart-title">Cash Position Projection</div>
              <div className="chart-sub">7-day / 30-day / 90-day forward cash</div>
            </div>
          </div>
          <div style={{ height: '160px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', padding: '10px 20px', borderBottom: '1px solid #e2e8f0' }}>
            {[
              { label: '7-Day', val: +(totals.cash * 0.98).toFixed(0), height: 75 },
              { label: '30-Day', val: +(totals.cash * 1.06).toFixed(0), height: 95 },
              { label: '90-Day', val: +(totals.cash * 1.19).toFixed(0), height: 125 },
            ].map((bar, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '60px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#1565c0', marginBottom: '6px' }}>
                  {fM(bar.val)}
                </div>
                <div style={{
                  width: '38px',
                  height: `${bar.height}px`,
                  background: 'linear-gradient(180deg, #1565c0 0%, #0d47a1 100%)',
                  borderRadius: '6px 6px 0 0',
                  transition: 'height 0.3s ease'
                }} />
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--gray-600, #475569)', marginTop: '6px' }}>
                  {bar.label}
                </div>
              </div>
            ))}
          </div>
          <div className="chart-legend">
            <div className="legend-item">
              <div className="legend-dot" style={{ background: '#1565c0' }} />
              Projected Cash Balance ($)
            </div>
          </div>
        </div>

        {/* P&L: Budget vs Actual */}
        <div className="chart-card">
          <div className="chart-card-hdr">
            <div>
              <div className="chart-title">P&amp;L: Budget vs Actual</div>
              <div className="chart-sub">Revenue · COGS · Opex · Net Income · {period.toUpperCase()}</div>
            </div>
          </div>
          <div style={{ height: '160px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', padding: '10px 10px', borderBottom: '1px solid #e2e8f0' }}>
            {[
              { label: 'Revenue', budget: totals.rev * 0.94, actual: totals.rev, maxH: 130 },
              { label: 'COGS', budget: totals.exp * 0.58 * 1.04, actual: totals.exp * 0.58, maxH: 80 },
              { label: 'Opex', budget: totals.exp * 0.42 * 0.98, actual: totals.exp * 0.42, maxH: 60 },
              { label: 'Net Inc.', budget: totals.ni * 0.86, actual: totals.ni, maxH: 50 },
            ].map((col, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '70px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px' }}>
                  <div style={{
                    width: '16px',
                    height: `${Math.max(15, Math.min(130, col.maxH * 0.9))}px`,
                    background: '#cbd5e1',
                    borderRadius: '4px 4px 0 0'
                  }} title={`Budget: ${fM(col.budget)}`} />
                  <div style={{
                    width: '16px',
                    height: `${Math.max(15, Math.min(130, col.maxH))}px`,
                    background: '#0d1b4b',
                    borderRadius: '4px 4px 0 0'
                  }} title={`Actual: ${fM(col.actual)}`} />
                </div>
                <div style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--gray-600, #475569)', marginTop: '6px' }}>
                  {col.label}
                </div>
              </div>
            ))}
          </div>
          <div className="chart-legend">
            <div className="legend-item"><div className="legend-dot" style={{ background: '#cbd5e1' }} />Budget</div>
            <div className="legend-item"><div className="legend-dot" style={{ background: '#0d1b4b' }} />Actual</div>
          </div>
        </div>
      </div>

      {/* AR & AP Aging 2-Column Split */}
      <div className="aging-2col">
        <div className="table-wrap">
          <div className="table-head-row">
            <div className="table-head-title">Accounts Receivable (AR) Aging</div>
            <Link to="/accounts-receivable" className="btn btn-outline btn-sm">Open AR</Link>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Bucket</th>
                <th>Amount</th>
                <th>% of Total</th>
              </tr>
            </thead>
            <tbody>
              {AR_AGING.map((a, idx) => (
                <tr key={idx}>
                  <td className="font-semibold">{a.bucket}</td>
                  <td>{fM(totals.ar * a.pct)}</td>
                  <td><span className="badge badge-blue">{(a.pct * 100).toFixed(1)}%</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="table-wrap">
          <div className="table-head-row">
            <div className="table-head-title">Accounts Payable (AP) Aging</div>
            <Link to="/accounts-payable" className="btn btn-outline btn-sm">Open AP</Link>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Bucket</th>
                <th>Amount</th>
                <th>% of Total</th>
              </tr>
            </thead>
            <tbody>
              {AP_AGING.map((a, idx) => (
                <tr key={idx}>
                  <td className="font-semibold">{a.bucket}</td>
                  <td>{fM(totals.ap * a.pct)}</td>
                  <td><span className="badge badge-orange">{(a.pct * 100).toFixed(1)}%</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Financial Risks & Alerts */}
      <div className="section-title" style={{ fontSize: '13.5px', marginBottom: '8px', fontWeight: 700 }}>
        Top Financial Risks &amp; Alerts
      </div>
      <div className="risk-list">
        {initialRisks.map((r, i) => {
          const isAck = acknowledgedRisks.includes(r.id);
          return (
            <div className="risk-row" key={r.id} style={{ opacity: isAck ? 0.6 : 1 }}>
              <div className="risk-rank">{i + 1}</div>
              <div className="risk-body">
                <div className="risk-title" style={{ textDecoration: isAck ? 'line-through' : 'none' }}>
                  {r.title}
                </div>
                <div className="risk-desc">{r.desc}</div>
              </div>
              <span className={`badge ${r.level}`}>{r.label}</span>
              <button
                className={`btn btn-sm ${isAck ? 'btn-ghost' : 'btn-outline'}`}
                onClick={() => handleAcknowledge(r.id)}
                disabled={isAck}
              >
                {isAck ? 'Acknowledged' : 'Acknowledge'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Multi-Entity Consolidation Table */}
      <div className="section-title" style={{ fontSize: '13.5px', marginBottom: '8px', fontWeight: 700, marginTop: '20px' }}>
        Multi-Entity Consolidation{' '}
        <span style={{ fontWeight: 400, color: 'var(--gray-400, #94a3b8)', fontSize: '11px' }}>
          (rendered from tenant configuration)
        </span>
      </div>
      <div className="consol-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Entity</th>
              <th>Business Type</th>
              <th>Revenue</th>
              <th>Expense</th>
              <th>Net Income</th>
              <th>Margin</th>
            </tr>
          </thead>
          <tbody>
            {consolData.map(r => (
              <tr key={r.id}>
                <td className="font-semibold">{r.name}</td>
                <td><span className="badge badge-navy">{r.type}</span></td>
                <td>{fM(r.revenue)}</td>
                <td>{fM(r.expense)}</td>
                <td style={{ color: r.ni >= 0 ? '#2e7d32' : '#c62828', fontWeight: 700 }}>
                  {fM(r.ni)}
                </td>
                <td>{r.margin}%</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: 'var(--gray-50, #f8fafc)', fontWeight: 800 }}>
              <td>Consolidated Total</td>
              <td>{consolData.length} Entities</td>
              <td>{fM(totals.rev)}</td>
              <td>{fM(totals.exp)}</td>
              <td style={{ color: totals.ni >= 0 ? '#2e7d32' : '#c62828' }}>{fM(totals.ni)}</td>
              <td>{totals.margin}%</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </>
  );
}
