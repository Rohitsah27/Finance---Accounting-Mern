import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import './premium-claims.css';

const PERIOD_DATA = {
  itd: {
    label: 'ITD (All Time)',
    shortLabel: 'ITD',
    statLabels: { written: 'Written Premium ITD', earned: 'Earned Premium ITD', claims: 'Claims Incurred ITD', ratio: 'Combined Loss Ratio' },
    stats: { written: '$3.82Cr', earned: '$3.71Cr', claims: '$2.26Cr', ratio: '60.9%', writtenChange: '↑ 12.3% CAGR', earnedChange: '↑ 11.8% CAGR', claimsChange: '↑ 5.4%', ratioChange: '↓ 2.1% vs inception' },
    openClaims: '624',
    openClaimsChange: '↑ 12 vs prior yr',
    premChart: { labels: ['FY 2022', 'FY 2023', 'FY 2024', 'FY 2025', 'FY 2026'], written: [52, 68, 89, 105, 68], earned: [49.8, 65.5, 86.0, 101.8, 68.0] },
    lobChart: [
      { name: 'Commercial Trucking', written: '$1.42Cr', earned: '$1.35Cr', pct: 40 },
      { name: 'General Liability', written: '$1.68Cr', earned: '$1.62Cr', pct: 45 },
      { name: 'Inland Marine', written: '$72.0L', earned: '$74.0L', pct: 15 }
    ],
    ratios: { lossRatio: 58.2, lossIncurred: 60.9, expenseRatio: 27.1, combinedRatio: 88.0 },
    lobPerf: [
      { lob: 'Auto / Trucking', lossRatio: '60.1%', expRatio: '29.8%', combined: '89.9%', color: 'text-green' },
      { lob: 'Property', lossRatio: '54.8%', expRatio: '30.6%', combined: '85.4%', color: 'text-green' },
      { lob: 'Liability', lossRatio: '48.2%', expRatio: '31.4%', combined: '79.6%', color: 'text-green' }
    ],
    reserveMovement: { title: 'Reserve Movement - ITD', opening: '$82,40,000', newClaims: '+$2,26,18,400', strengthen: '+$48,24,200', paid: '-$1,74,12,400', releases: '-$24,80,200', closing: '$1,58,90,000' }
  },
  ytd: {
    label: 'Year to Date (2026)',
    shortLabel: 'YTD 2026',
    statLabels: { written: 'Written Premium YTD', earned: 'Earned Premium YTD', claims: 'Claims Incurred YTD', ratio: 'Combined Loss Ratio' },
    stats: { written: '$1.24Cr', earned: '$1.18Cr', claims: '$73.8L', ratio: '62.4%', writtenChange: '↑ 8.1% vs prior yr', earnedChange: '↑ 7.4%', claimsChange: '↑ 3.2%', ratioChange: '↓ 1.2% vs prior yr' },
    openClaims: '142',
    openClaimsChange: '↑ 8 vs prior month',
    premChart: { labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'], written: [220, 245, 280, 265, 230], earned: [210, 230, 265, 252, 223] },
    lobChart: [
      { name: 'Commercial Trucking', written: '$48.2L', earned: '$38.4L', pct: 42 },
      { name: 'General Liability', written: '$1.24Cr', earned: '$48.7L', pct: 38 },
      { name: 'Inland Marine', written: '$82.4L', earned: '$30.9L', pct: 20 }
    ],
    ratios: { lossRatio: 58.3, lossIncurred: 62.1, expenseRatio: 28.4, combinedRatio: 90.5 },
    lobPerf: [
      { lob: 'Auto / Trucking', lossRatio: '62.4%', expRatio: '31.8%', combined: '94.2%', color: '' },
      { lob: 'Property', lossRatio: '55.2%', expRatio: '32.6%', combined: '87.8%', color: 'text-green' },
      { lob: 'Liability', lossRatio: '48.8%', expRatio: '33.6%', combined: '82.4%', color: 'text-green' }
    ],
    reserveMovement: { title: 'Reserve Movement - May 2026', opening: '$1,68,24,200', newClaims: '+$18,42,800', strengthen: '+$4,82,400', paid: '−$12,48,600', releases: '−$4,88,400', closing: '$1,74,12,400' }
  },
  mtd: {
    label: 'Month to Date (May 2026)',
    shortLabel: 'MTD May-26',
    statLabels: { written: 'Written Premium MTD', earned: 'Earned Premium MTD', claims: 'Claims Incurred MTD', ratio: 'Combined Loss Ratio' },
    stats: { written: '$18.4L', earned: '$16.2L', claims: '$8.4L', ratio: '59.1%', writtenChange: '↑ 4.2% vs prior mo', earnedChange: '↑ 3.8%', claimsChange: '↑ 2.1%', ratioChange: '↓ 0.8% vs prior mo' },
    openClaims: '38',
    openClaimsChange: '↓ 2 vs prior week',
    premChart: { labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'], written: [38, 52, 47, 47], earned: [35, 47, 43, 37] },
    lobChart: [
      { name: 'Commercial Trucking', written: '$8.4L', earned: '$7.2L', pct: 45 },
      { name: 'General Liability', written: '$6.2L', earned: '$5.8L', pct: 35 },
      { name: 'Inland Marine', written: '$3.8L', earned: '$3.2L', pct: 20 }
    ],
    ratios: { lossRatio: 55.8, lossIncurred: 59.1, expenseRatio: 26.4, combinedRatio: 85.5 },
    lobPerf: [
      { lob: 'Auto / Trucking', lossRatio: '58.4%', expRatio: '28.8%', combined: '87.2%', color: 'text-green' },
      { lob: 'Property', lossRatio: '52.1%', expRatio: '30.2%', combined: '82.3%', color: 'text-green' },
      { lob: 'Liability', lossRatio: '44.6%', expRatio: '31.8%', combined: '76.4%', color: 'text-green' }
    ],
    reserveMovement: { title: 'Reserve Movement - May 2026', opening: '$1,68,24,200', newClaims: '+$4,82,400', strengthen: '+$1,24,800', paid: '−$1,82,000', releases: '−$36,800', closing: '$1,72,12,600' }
  }
};

const INITIAL_PREMIUMS = [
  { id: 'POL-V8NHT', mga: 'NTA', state: 'TX', lob: 'Commercial Trucking', effectiveDate: '2026-08-20', written: 39260, earned: 19630, unearned: 19630, status: 'Active' },
  { id: 'POL-TX-2026-9102', mga: 'Futuristic', state: 'TX', lob: 'Property', effectiveDate: '2026-05-05', written: 58400, earned: 9733, unearned: 48667, status: 'Active' },
  { id: 'POL-NY-2026-9105', mga: 'ACCL', state: 'NY', lob: 'Liability', effectiveDate: '2026-05-12', written: 42800, earned: 4280, unearned: 38520, status: 'Active' },
  { id: 'POL-TX-2024-8421', mga: 'Futuristic', state: 'TX', lob: 'Auto', effectiveDate: '2026-01-01', written: 48200, earned: 24100, unearned: 24100, status: 'Active' },
  { id: 'POL-TX-2024-8418', mga: 'NTA', state: 'TX', lob: 'Property', effectiveDate: '2026-03-15', written: 124800, earned: 28050, unearned: 96750, status: 'Active' },
  { id: 'POL-CA-2024-7284', mga: 'ACCL', state: 'CA', lob: 'Liability', effectiveDate: '2026-02-01', written: 82400, earned: 34333, unearned: 48067, status: 'Active' }
];

const INITIAL_CLAIMS = [
  { claimNo: 'CLM-2026-2001', policyNo: 'POL-TX-2026-9102', state: 'TX', lossDate: '2026-05-15', lob: 'Property', paid: 48200, reserved: 96400, total: 144600, status: 'Reserved' },
  { claimNo: 'CLM-2024-1847', policyNo: 'POL-TX-2024-8421', state: 'TX', lossDate: '2026-05-12', lob: 'Auto', paid: 18200, reserved: 1240000, total: 1258200, status: 'Reserved' },
  { claimNo: 'CLM-2024-1843', policyNo: 'POL-FL-2025-6192', state: 'FL', lossDate: '2026-04-08', lob: 'Property', paid: 482400, reserved: 248200, total: 730600, status: 'Paid' },
  { claimNo: 'CLM-2024-1836', policyNo: 'POL-CA-2024-7284', state: 'CA', lossDate: '2026-03-22', lob: 'Liability', paid: 82600, reserved: 0, total: 82600, status: 'Closed' },
  { claimNo: 'CLM-2024-1824', policyNo: 'POL-TX-2024-8418', state: 'TX', lossDate: '2026-02-15', lob: 'Property', paid: 2482000, reserved: 824400, total: 3306400, status: 'Paid' }
];

const INITIAL_BOUND_POLICIES = [
  { id: 'POL-V8NHT', policyNumber: 'POL-V8NHT', insured: 'Ayushi', mgaName: 'NTA', lob: 'Commercial Trucking', state: 'TX', premium: 39260, status: 'invoiced', effectiveDate: '2026-08-20' },
  { id: 'POL-40291', policyNumber: 'POL-40291', insured: 'Apex Freight Solutions', mgaName: 'NTA', lob: 'Inland Marine Cargo', state: 'TX', premium: 14850, status: 'paid', effectiveDate: '2026-08-25' }
];

export function PremiumClaimsPage() {
  const [period, setPeriod] = useState('ytd');
  const [viewBasis, setViewBasis] = useState('gross');
  const [activeTab, setActiveTab] = useState('premiums');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // Filters state
  const [filterState, setFilterState] = useState('');
  const [filterMga, setFilterMga] = useState('');
  const [filterLob, setFilterLob] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Bound policies & declarations state
  const [boundPolicies, setBoundPolicies] = useState(INITIAL_BOUND_POLICIES);
  const [viewingPolicyPdf, setViewingPolicyPdf] = useState(null);

  // New Policy Bind Form
  const [bpInsured, setBpInsured] = useState('');
  const [bpMga, setBpMga] = useState('NTA');
  const [bpPremium, setBpPremium] = useState('');
  const [bpLob, setBpLob] = useState('General Liability');
  const [bpState, setBpState] = useState('TX');
  const [bpEffective, setBpEffective] = useState('2026-09-01');

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const currentPeriodData = PERIOD_DATA[period] || PERIOD_DATA.ytd;

  const handleBindPolicy = (e) => {
    e.preventDefault();
    if (!bpInsured.trim() || !bpPremium) {
      showToast('Please enter Insured and Premium', 'error');
      return;
    }
    const newPol = {
      id: 'POL-' + Math.floor(10000 + Math.random() * 90000),
      policyNumber: 'POL-' + Math.floor(10000 + Math.random() * 90000),
      insured: bpInsured,
      mgaName: bpMga,
      lob: bpLob,
      state: bpState,
      premium: parseFloat(bpPremium) || 0,
      status: 'bound',
      effectiveDate: bpEffective
    };
    setBoundPolicies([newPol, ...boundPolicies]);
    setBpInsured('');
    setBpPremium('');
    showToast(`Policy ${newPol.policyNumber} bound for ${newPol.insured}!`, 'success');
  };

  const filteredPremiums = useMemo(() => {
    return INITIAL_PREMIUMS.filter(p => {
      if (filterState && p.state !== filterState) return false;
      if (filterMga && p.mga !== filterMga) return false;
      if (filterLob && p.lob !== filterLob) return false;
      if (filterStatus && p.status !== filterStatus) return false;
      return true;
    });
  }, [filterState, filterMga, filterLob, filterStatus]);

  const filteredClaims = useMemo(() => {
    return INITIAL_CLAIMS.filter(c => {
      if (filterState && c.state !== filterState) return false;
      if (filterLob && c.lob !== filterLob) return false;
      if (filterStatus && c.status !== filterStatus) return false;
      return true;
    });
  }, [filterState, filterLob, filterStatus]);

  return (
    <>
      {toast && (
        <div className={`veridex-toast veridex-toast-${toast.type}`}>
          <span>{toast.type === 'error' ? '✕' : toast.type === 'warning' ? '⚠' : '✓'}</span>
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header">
        <div>
          <div className="page-title">Premium &amp; Claims Accounting</div>
          <div className="page-subtitle">Auto-post premium and claims events · Gross / Ceded / Net toggle</div>
        </div>
        <div className="page-actions">
          {/* Period Toggle */}
          <div className="period-toggle">
            <button
              className={`period-btn ${period === 'itd' ? 'active' : ''}`}
              onClick={() => setPeriod('itd')}
            >
              ITD
            </button>
            <button
              className={`period-btn ${period === 'ytd' ? 'active' : ''}`}
              onClick={() => setPeriod('ytd')}
            >
              YTD
            </button>
            <button
              className={`period-btn ${period === 'mtd' ? 'active' : ''}`}
              onClick={() => setPeriod('mtd')}
            >
              MTD
            </button>
          </div>

          <select
            className="filter-select"
            value={viewBasis}
            onChange={(e) => setViewBasis(e.target.value)}
            style={{ padding: '7px 24px 7px 12px' }}
          >
            <option value="gross">Gross</option>
            <option value="ceded">Ceded</option>
            <option value="net">Net</option>
          </select>

          <button
            className="btn btn-outline"
            onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
          >
            Filters
          </button>
          <button
            className="btn btn-outline"
            onClick={() => showToast('Exporting Premium & Claims data to CSV...', 'info')}
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* 5 KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '18px' }}>
        <div className="stat-card-sm accent-navy">
          <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.4px', color: 'var(--gray-500)' }}>
            {currentPeriodData.statLabels.written}
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--navy)', margin: '4px 0 2px' }}>
            {currentPeriodData.stats.written}
          </div>
          <div style={{ fontSize: '11px', color: '#2e7d32', fontWeight: 600 }}>
            {currentPeriodData.stats.writtenChange}
          </div>
        </div>

        <div className="stat-card-sm accent-green">
          <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.4px', color: 'var(--gray-500)' }}>
            {currentPeriodData.statLabels.earned}
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--navy)', margin: '4px 0 2px' }}>
            {currentPeriodData.stats.earned}
          </div>
          <div style={{ fontSize: '11px', color: '#2e7d32', fontWeight: 600 }}>
            {currentPeriodData.stats.earnedChange}
          </div>
        </div>

        <div className="stat-card-sm accent-coral">
          <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.4px', color: 'var(--gray-500)' }}>
            {currentPeriodData.statLabels.claims}
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--navy)', margin: '4px 0 2px' }}>
            {currentPeriodData.stats.claims}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--red, #dc2626)', fontWeight: 600 }}>
            {currentPeriodData.stats.claimsChange}
          </div>
        </div>

        <div className="stat-card-sm accent-orange">
          <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.4px', color: 'var(--gray-500)' }}>
            Combined Loss Ratio
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--navy)', margin: '4px 0 2px' }}>
            {currentPeriodData.stats.ratio}
          </div>
          <div style={{ fontSize: '11px', color: '#2e7d32', fontWeight: 600 }}>
            {currentPeriodData.stats.ratioChange}
          </div>
        </div>

        <div className="stat-card-sm" style={{ borderTopColor: '#1565c0' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.4px', color: 'var(--gray-500)' }}>
            Open Claims
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--navy)', margin: '4px 0 2px' }}>
            {currentPeriodData.openClaims}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--gray-400)' }}>
            {currentPeriodData.openClaimsChange}
          </div>
        </div>
      </div>

      {/* Global Filter Panel */}
      {isFilterPanelOpen && (
        <div className="form-card" style={{ marginBottom: '16px', padding: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label className="field-label">State</label>
              <select className="field-input" value={filterState} onChange={(e) => setFilterState(e.target.value)}>
                <option value="">All States</option>
                <option value="TX">TX</option>
                <option value="CA">CA</option>
                <option value="FL">FL</option>
                <option value="NY">NY</option>
              </select>
            </div>
            <div>
              <label className="field-label">MGA</label>
              <select className="field-input" value={filterMga} onChange={(e) => setFilterMga(e.target.value)}>
                <option value="">All MGA</option>
                <option value="NTA">NTA</option>
                <option value="Futuristic">Futuristic</option>
                <option value="ACCL">ACCL</option>
              </select>
            </div>
            <div>
              <label className="field-label">Line of Business</label>
              <select className="field-input" value={filterLob} onChange={(e) => setFilterLob(e.target.value)}>
                <option value="">All LOB</option>
                <option value="Commercial Trucking">Commercial Trucking</option>
                <option value="Auto">Auto</option>
                <option value="Property">Property</option>
                <option value="Liability">Liability</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-primary btn-sm" onClick={() => showToast('Filters applied')}>Apply Filters</button>
            <button className="btn btn-ghost btn-sm" onClick={() => { setFilterState(''); setFilterMga(''); setFilterLob(''); setFilterStatus(''); }}>Clear Filters</button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="page-tabs" style={{ borderRadius: '8px 8px 0 0', marginBottom: '16px' }}>
        <button className={`page-tab ${activeTab === 'premiums' ? 'active' : ''}`} onClick={() => setActiveTab('premiums')}>
          Premiums
        </button>
        <button className={`page-tab ${activeTab === 'bindpolicy' ? 'active' : ''}`} onClick={() => setActiveTab('bindpolicy')}>
          Bind Policy <span className="v-badge-config" style={{ marginLeft: '4px' }}>real, per MGA</span>
        </button>
        <button className={`page-tab ${activeTab === 'claims' ? 'active' : ''}`} onClick={() => setActiveTab('claims')}>
          Claims &amp; Losses
        </button>
        <button className={`page-tab ${activeTab === 'reserves' ? 'active' : ''}`} onClick={() => setActiveTab('reserves')}>
          Reserves
        </button>
        <button className={`page-tab ${activeTab === 'ratios' ? 'active' : ''}`} onClick={() => setActiveTab('ratios')}>
          Ratios &amp; Analytics
        </button>
      </div>

      {/* Tab 1: Premiums */}
      {activeTab === 'premiums' && (
        <div>
          <div className="tab-filter-bar" style={{ borderRadius: '6px', marginBottom: '16px' }}>
            <span className="filter-bar-label">Filters:</span>
            <select className="filter-select" value={filterMga} onChange={(e) => setFilterMga(e.target.value)}>
              <option value="">All MGA</option>
              <option value="NTA">NTA</option>
              <option value="Futuristic">Futuristic</option>
              <option value="ACCL">ACCL</option>
            </select>
            <select className="filter-select" value={filterState} onChange={(e) => setFilterState(e.target.value)}>
              <option value="">All States</option>
              <option value="TX">TX</option>
              <option value="CA">CA</option>
              <option value="FL">FL</option>
              <option value="NY">NY</option>
            </select>
            <select className="filter-select" value={filterLob} onChange={(e) => setFilterLob(e.target.value)}>
              <option value="">All LOB</option>
              <option value="Commercial Trucking">Commercial Trucking</option>
              <option value="Auto">Auto</option>
              <option value="Property">Property</option>
              <option value="Liability">Liability</option>
            </select>
            <select className="filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Expired">Expired</option>
            </select>
            <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 600, color: 'var(--gray-500)', background: 'var(--gray-100)', padding: '4px 10px', borderRadius: '4px' }}>
              {currentPeriodData.shortLabel}
            </span>
          </div>

          <div className="charts-grid">
            <div className="chart-card">
              <div className="chart-card-title">
                Written vs Earned Premium
                <span className="chart-period-label">{currentPeriodData.shortLabel}</span>
              </div>
              <div style={{ height: '180px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', paddingBottom: '10px' }}>
                {currentPeriodData.premChart.labels.map((lbl, idx) => {
                  const w = currentPeriodData.premChart.written[idx] || 0;
                  const e = currentPeriodData.premChart.earned[idx] || 0;
                  const maxH = 280;
                  return (
                    <div key={lbl} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '130px' }}>
                        <div style={{ width: '18px', height: `${(w / maxH) * 120}px`, background: 'var(--navy)', borderRadius: '3px 3px 0 0' }} title={`Written: ${w}`} />
                        <div style={{ width: '18px', height: `${(e / maxH) * 120}px`, background: 'rgba(13,27,75,0.5)', borderRadius: '3px 3px 0 0' }} title={`Earned: ${e}`} />
                      </div>
                      <span style={{ fontSize: '10px', color: 'var(--gray-500)' }}>{lbl}</span>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', fontSize: '11px', color: 'var(--gray-600)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '10px', height: '10px', background: 'var(--navy)', borderRadius: '2px' }} />
                  Written Premium
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '10px', height: '10px', background: 'rgba(13,27,75,0.5)', borderRadius: '2px' }} />
                  Earned Premium
                </div>
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-card-title">
                Premium by Line of Business
                <span className="chart-period-label">{currentPeriodData.shortLabel}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '10px' }}>
                {currentPeriodData.lobChart.map(item => (
                  <div key={item.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                      <strong>{item.name}</strong>
                      <span style={{ color: 'var(--navy)', fontWeight: 700 }}>{item.written}</span>
                    </div>
                    <div className="progress-bar" style={{ height: '8px' }}>
                      <div className="progress-fill pf-navy" style={{ width: `${item.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="table-wrap">
            <div className="table-head-row">
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--gray-600)' }}>
                {filteredPremiums.length} rows recorded
              </span>
              <button className="btn btn-outline btn-sm" onClick={() => showToast('Exporting table CSV...')}>
                Export CSV
              </button>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Policy No.</th>
                  <th>MGA</th>
                  <th>State</th>
                  <th>LOB</th>
                  <th>Effective Date</th>
                  <th className="text-right">Written Premium ($)</th>
                  <th className="text-right">Earned Premium ($)</th>
                  <th className="text-right">Unearned ($)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredPremiums.map(r => (
                  <tr key={r.id}>
                    <td className="cell-link font-semibold">{r.id}</td>
                    <td><span className="badge badge-navy">{r.mga}</span></td>
                    <td>{r.state}</td>
                    <td>{r.lob}</td>
                    <td>{r.effectiveDate}</td>
                    <td className="text-right font-semibold">${Number(r.written).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="text-right">${Number(r.earned).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="text-right text-muted">${Number(r.unearned).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td><span className={`badge ${r.status === 'Active' ? 'badge-green' : 'badge-orange'}`}>{r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Bind Policy */}
      {activeTab === 'bindpolicy' && (
        <div>
          <div className="v-lock-note" style={{ margin: '0 0 16px', padding: '12px', background: '#f8fafc', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12.5px' }}>
            Bind a policy for an insured against one of your MGAs. Once bound, invoice the MGA on <strong>Billing &amp; Invoicing</strong>.
          </div>

          <div className="form-card" style={{ marginBottom: '16px', padding: '20px' }}>
            <div className="card-title">Bind New Policy</div>
            <form onSubmit={handleBindPolicy}>
              <div className="form-grid-3" style={{ marginTop: '12px' }}>
                <div>
                  <label className="field-label">Insured *</label>
                  <input
                    className="field-input"
                    placeholder="e.g. Harbor Logistics LLC"
                    value={bpInsured}
                    onChange={(e) => setBpInsured(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="field-label">MGA *</label>
                  <select className="field-input" value={bpMga} onChange={(e) => setBpMga(e.target.value)}>
                    <option value="NTA">NTA (Managing General Agent)</option>
                    <option value="Futuristic">Futuristic Specialty</option>
                  </select>
                </div>
                <div>
                  <label className="field-label">Premium *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="field-input"
                    placeholder="e.g. 3000"
                    value={bpPremium}
                    onChange={(e) => setBpPremium(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="field-label">Line of Business</label>
                  <select className="field-input" value={bpLob} onChange={(e) => setBpLob(e.target.value)}>
                    <option>General Liability</option>
                    <option>Commercial Trucking</option>
                    <option>Property</option>
                    <option>Auto</option>
                  </select>
                </div>
                <div>
                  <label className="field-label">State</label>
                  <select className="field-input" value={bpState} onChange={(e) => setBpState(e.target.value)}>
                    <option>TX</option>
                    <option>CA</option>
                    <option>FL</option>
                    <option>NY</option>
                  </select>
                </div>
                <div>
                  <label className="field-label">Effective Date</label>
                  <input
                    type="date"
                    className="field-input"
                    value={bpEffective}
                    onChange={(e) => setBpEffective(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div style={{ marginTop: '14px' }}>
                <button type="submit" className="btn btn-primary btn-sm">Bind Policy</button>
              </div>
            </form>
          </div>

          <div className="table-wrap">
            <div className="table-head-row">
              <span className="table-head-title">Bound Policies</span>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Policy #</th>
                  <th>Insured</th>
                  <th>MGA</th>
                  <th>LOB / State</th>
                  <th>Premium</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {boundPolicies.map(p => (
                  <tr key={p.id}>
                    <td className="cell-link font-semibold">{p.policyNumber}</td>
                    <td><strong>{p.insured}</strong></td>
                    <td>{p.mgaName}</td>
                    <td>{p.lob} / {p.state}</td>
                    <td className="font-semibold">${Number(p.premium).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td>
                      <span className={`badge ${p.status === 'paid' ? 'badge-green' : p.status === 'invoiced' ? 'badge-orange' : 'badge-gray'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => setViewingPolicyPdf(p)}>
                        View Policy PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Declarations PDF View */}
          {viewingPolicyPdf && (
            <div style={{ marginTop: '20px' }}>
              <div className="pc-pdf-doc">
                <div className="pc-pdf-head">
                  <div className="pc-pdf-brand">
                    <div className="pc-pdf-brand-mark">SL</div>
                    <div>
                      <strong style={{ fontSize: '15px' }}>Southlake Insurance Co.</strong><br />
                      <span style={{ color: 'var(--gray-500)', fontSize: '11px' }}>500 Market Street, Dallas, TX 75201</span>
                    </div>
                  </div>
                  <div className="pc-pdf-doctitle">Policy<br />Declarations</div>
                </div>
                <h2>{viewingPolicyPdf.policyNumber}</h2>
                <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>Effective {viewingPolicyPdf.effectiveDate}</div>

                <div className="pc-pdf-section-label">Named Insured &amp; Coverage</div>
                <table className="data-table">
                  <tbody>
                    <tr><td style={{ fontWeight: 700, width: '35%' }}>Named Insured</td><td>{viewingPolicyPdf.insured}</td></tr>
                    <tr><td style={{ fontWeight: 700 }}>Managing General Agent</td><td>{viewingPolicyPdf.mgaName}</td></tr>
                    <tr><td style={{ fontWeight: 700 }}>Line of Business</td><td>{viewingPolicyPdf.lob}</td></tr>
                    <tr><td style={{ fontWeight: 700 }}>State / Jurisdiction</td><td>{viewingPolicyPdf.state}</td></tr>
                  </tbody>
                </table>

                <div className="pc-pdf-section-label">Premium &amp; Status</div>
                <table className="data-table">
                  <tbody>
                    <tr><td style={{ fontWeight: 700, width: '35%' }}>Written Premium</td><td style={{ fontWeight: 700 }}>${Number(viewingPolicyPdf.premium).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td></tr>
                    <tr><td style={{ fontWeight: 700 }}>Status</td><td>{viewingPolicyPdf.status}</td></tr>
                  </tbody>
                </table>

                <div className="pc-pdf-footer">
                  This declarations page is a summary of coverage bound under the above policy number. Terms and conditions are governed by Southlake Insurance Co.
                </div>
                <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                  <button className="btn btn-outline btn-sm" onClick={() => window.print()}>Print / Save as PDF</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setViewingPolicyPdf(null)}>Close Preview</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Claims & Losses */}
      {activeTab === 'claims' && (
        <div>
          <div className="tab-filter-bar" style={{ borderRadius: '6px', marginBottom: '16px' }}>
            <span className="filter-bar-label">Filters:</span>
            <select className="filter-select" value={filterState} onChange={(e) => setFilterState(e.target.value)}>
              <option value="">All States</option>
              <option value="TX">TX</option>
              <option value="CA">CA</option>
              <option value="FL">FL</option>
            </select>
            <select className="filter-select" value={filterLob} onChange={(e) => setFilterLob(e.target.value)}>
              <option value="">All LOB</option>
              <option value="Property">Property</option>
              <option value="Auto">Auto</option>
              <option value="Liability">Liability</option>
            </select>
            <select className="filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">All Status</option>
              <option value="Reserved">Reserved</option>
              <option value="Paid">Paid</option>
              <option value="Closed">Closed</option>
            </select>
            <button className="btn btn-outline btn-sm" onClick={() => showToast('Exporting full claim history...')}>
              ⬇ Export Full History
            </button>
          </div>

          {/* 10-Year Trend Card */}
          <div className="chart-card" style={{ marginBottom: '16px' }}>
            <div className="chart-card-title">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>10-Year Loss History Trend</span>
                <span style={{ fontSize: '10px', fontWeight: 600, background: '#e3f2fd', color: '#1565c0', padding: '2px 8px', borderRadius: '4px' }}>
                  2016 – 2026
                </span>
              </div>
            </div>
            <div style={{ height: '140px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '10px 20px' }}>
              {[
                { yr: '2016', val: 42 }, { yr: '2017', val: 48 }, { yr: '2018', val: 55 },
                { yr: '2019', val: 51 }, { yr: '2020', val: 62 }, { yr: '2021', val: 71 },
                { yr: '2022', val: 68 }, { yr: '2023', val: 79 }, { yr: '2024', val: 84 },
                { yr: '2025', val: 76 }, { yr: '2026', val: 73.8 }
              ].map(item => (
                <div key={item.yr} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '18px', height: `${(item.val / 90) * 100}px`, background: '#e05470', borderRadius: '3px 3px 0 0' }} title={`$${item.val}L`} />
                  <span style={{ fontSize: '10px', color: 'var(--gray-500)' }}>{item.yr}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="table-wrap">
            <div className="table-head-row">
              <span className="table-head-title">Claims Subledger Records</span>
              <button className="btn btn-outline btn-sm" onClick={() => showToast('Exporting claims CSV...')}>
                Export CSV
              </button>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Claim No.</th>
                  <th>Policy No.</th>
                  <th>State</th>
                  <th>Loss Date</th>
                  <th>LOB</th>
                  <th className="text-right">Paid ($)</th>
                  <th className="text-right">Reserved ($)</th>
                  <th className="text-right">Total Incurred ($)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredClaims.map(c => (
                  <tr key={c.claimNo}>
                    <td className="cell-link font-semibold">{c.claimNo}</td>
                    <td>{c.policyNo}</td>
                    <td>{c.state}</td>
                    <td>{c.lossDate}</td>
                    <td>{c.lob}</td>
                    <td className="text-right font-semibold">${Number(c.paid).toLocaleString('en-US')}</td>
                    <td className="text-right">${Number(c.reserved).toLocaleString('en-US')}</td>
                    <td className="text-right text-coral font-semibold">${Number(c.total).toLocaleString('en-US')}</td>
                    <td><span className={`badge ${c.status === 'Closed' ? 'badge-green' : 'badge-orange'}`}>{c.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Reserves */}
      {activeTab === 'reserves' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-card" style={{ padding: '20px' }}>
            <div className="card-title mb-16">Reserve Summary by LOB</div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>LOB</th>
                  <th className="text-right">Case Reserve ($)</th>
                  <th className="text-right">IBNR ($)</th>
                  <th className="text-right">Total ($)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Auto / Trucking</td>
                  <td className="text-right">48,24,200</td>
                  <td className="text-right">12,48,600</td>
                  <td className="text-right font-semibold">60,72,800</td>
                </tr>
                <tr>
                  <td>Property</td>
                  <td className="text-right">62,48,400</td>
                  <td className="text-right">18,24,200</td>
                  <td className="text-right font-semibold">80,72,600</td>
                </tr>
                <tr>
                  <td>Liability</td>
                  <td className="text-right">24,18,600</td>
                  <td className="text-right">8,48,400</td>
                  <td className="text-right font-semibold">32,67,000</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td className="font-bold">Total</td>
                  <td className="text-right font-bold">1,34,91,200</td>
                  <td className="text-right font-bold">39,21,200</td>
                  <td className="text-right font-bold">1,74,12,400</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="form-card" style={{ padding: '20px' }}>
            <div className="card-title mb-16">{currentPeriodData.reserveMovement.title}</div>
            <div className="recon-status-row"><span className="recon-status-label">Opening Reserve</span><span className="recon-status-value">{currentPeriodData.reserveMovement.opening}</span></div>
            <div className="recon-status-row"><span className="recon-status-label">New Claims Reported</span><span className="recon-status-value text-coral">{currentPeriodData.reserveMovement.newClaims}</span></div>
            <div className="recon-status-row"><span className="recon-status-label">Reserve Strengthening</span><span className="recon-status-value text-coral">{currentPeriodData.reserveMovement.strengthen}</span></div>
            <div className="recon-status-row"><span className="recon-status-label">Claims Paid</span><span className="recon-status-value text-green">{currentPeriodData.reserveMovement.paid}</span></div>
            <div className="recon-status-row"><span className="recon-status-label">Reserve Releases</span><span className="recon-status-value text-green">{currentPeriodData.reserveMovement.releases}</span></div>
            <div className="divider" style={{ margin: '10px 0', borderTop: '1px solid var(--border)' }}></div>
            <div className="recon-status-row"><span className="recon-status-label font-bold">Closing Reserve</span><span className="recon-status-value font-bold" style={{ color: 'var(--navy)' }}>{currentPeriodData.reserveMovement.closing}</span></div>
          </div>
        </div>
      )}

      {/* Tab 5: Ratios */}
      {activeTab === 'ratios' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-card" style={{ padding: '20px' }}>
            <div className="card-title mb-16">Key Ratios - {currentPeriodData.shortLabel}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                  <span>Loss Ratio (Paid)</span>
                  <span className="font-bold" style={{ color: currentPeriodData.ratios.lossRatio < 65 ? 'var(--green)' : 'var(--orange)' }}>
                    {currentPeriodData.ratios.lossRatio}%
                  </span>
                </div>
                <div className="progress-bar" style={{ height: '8px' }}>
                  <div className="progress-fill pf-green" style={{ width: `${currentPeriodData.ratios.lossRatio}%` }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                  <span>Loss Ratio (Incurred)</span>
                  <span className="font-bold" style={{ color: currentPeriodData.ratios.lossIncurred < 65 ? 'var(--green)' : 'var(--orange)' }}>
                    {currentPeriodData.ratios.lossIncurred}%
                  </span>
                </div>
                <div className="progress-bar" style={{ height: '8px' }}>
                  <div className="progress-fill pf-orange" style={{ width: `${currentPeriodData.ratios.lossIncurred}%` }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                  <span>Expense Ratio</span>
                  <span className="font-bold" style={{ color: 'var(--coral)' }}>
                    {currentPeriodData.ratios.expenseRatio}%
                  </span>
                </div>
                <div className="progress-bar" style={{ height: '8px' }}>
                  <div className="progress-fill pf-coral" style={{ width: `${currentPeriodData.ratios.expenseRatio}%` }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                  <span>Combined Ratio</span>
                  <span className="font-bold" style={{ color: 'var(--navy)' }}>
                    {currentPeriodData.ratios.combinedRatio}%
                  </span>
                </div>
                <div className="progress-bar" style={{ height: '8px' }}>
                  <div className="progress-fill pf-navy" style={{ width: `${currentPeriodData.ratios.combinedRatio}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="form-card" style={{ padding: '20px' }}>
            <div className="card-title mb-16">LOB Performance</div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>LOB</th>
                  <th className="text-right">Loss Ratio</th>
                  <th className="text-right">Exp Ratio</th>
                  <th className="text-right">Combined</th>
                </tr>
              </thead>
              <tbody>
                {currentPeriodData.lobPerf.map(r => (
                  <tr key={r.lob}>
                    <td>{r.lob}</td>
                    <td className="text-right">{r.lossRatio}</td>
                    <td className="text-right">{r.expRatio}</td>
                    <td className="text-right font-semibold text-green">{r.combined}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
