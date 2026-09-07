import React, { useState, useMemo } from 'react';

const INITIAL_ASSETS = [
  { tag: 'FA-1001', desc: 'CNC Sheet Metal Press', category: 'Machinery & Equipment', acquired: '03/15/2021', cost: 420000, method: 'Straight-Line', methodBadge: 'badge-navy', life: '10 yrs', accumDep: 210000, nbv: 210000, status: 'In Use', statusBadge: 'badge-green' },
  { tag: 'FA-1014', desc: 'Fleet Delivery Truck - Ford F-650', category: 'Vehicles', acquired: '06/01/2023', cost: 86000, method: 'Declining Balance (20%)', methodBadge: 'badge-orange', life: '5 yrs', accumDep: 30960, nbv: 55040, status: 'In Use', statusBadge: 'badge-green' },
  { tag: 'FA-1027', desc: 'Server Rack - ERP Data Center', category: 'IT Equipment', acquired: '01/10/2024', cost: 96500, method: 'Double Declining', methodBadge: 'badge-orange', life: '5 yrs', accumDep: 38600, nbv: 57900, status: 'In Use', statusBadge: 'badge-green' },
  { tag: 'FA-1033', desc: 'Injection Molding Machine', category: 'Machinery & Equipment', acquired: '09/22/2022', cost: 310000, method: 'Sum-of-Years-Digits', methodBadge: 'badge-orange', life: '8 yrs', accumDep: 120972, nbv: 189028, status: 'In Use', statusBadge: 'badge-green' },
  { tag: 'FA-1041', desc: 'Assembly Line Robotics Arm', category: 'Machinery & Equipment', acquired: '02/14/2023', cost: 248000, method: 'Units of Production', methodBadge: 'badge-orange', life: '500,000 units', accumDep: 86800, nbv: 161200, status: 'In Use', statusBadge: 'badge-green' },
  { tag: 'FA-1052', desc: 'Workstation & Laptop Refresh - Finance Dept.', category: 'IT Equipment', acquired: '04/01/2025', cost: 64200, method: 'MACRS 5-Year', methodBadge: 'badge-orange', life: '5 yrs (IRS)', accumDep: 12840, nbv: 51360, status: 'In Use', statusBadge: 'badge-green' },
  { tag: 'FA-1002', desc: 'Plant Warehouse Addition - Bldg C', category: 'Buildings', acquired: '07/01/2019', cost: 1850000, method: 'MACRS 7-Year', methodBadge: 'badge-orange', life: '7 yrs (IRS)', accumDep: 1320714, nbv: 529286, status: 'In Use', statusBadge: 'badge-green' },
  { tag: 'FA-0918', desc: 'Corporate Office Furniture Set', category: 'Furniture & Fixtures', acquired: '05/12/2018', cost: 42000, method: 'Straight-Line', methodBadge: 'badge-navy', life: '7 yrs', accumDep: 42000, nbv: 0, status: 'Disposed', statusBadge: 'badge-gray' },
  { tag: 'FA-0975', desc: 'Legacy Stamping Press (Retired Line)', category: 'Machinery & Equipment', acquired: '11/03/2016', cost: 180000, method: 'Declining Balance (15%)', methodBadge: 'badge-orange', life: '10 yrs', accumDep: 142600, nbv: 37400, status: 'Impaired', statusBadge: 'badge-red' },
];

export function FixedAssetsPage() {
  const [assets, setAssets] = useState(INITIAL_ASSETS);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  
  // Disposal Panel
  const [disposeTarget, setDisposeTarget] = useState(null);
  const [disposeDate, setDisposeDate] = useState('2026-08-20');
  const [disposeMethod, setDisposeMethod] = useState('Sale');
  const [disposeProceeds, setDisposeProceeds] = useState('$0.00');

  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const totalCost = 8642000;
  const accumDep = useMemo(() => {
    return assets.reduce((sum, a) => sum + a.accumDep, 0) + 1212474; // baseline + active
  }, [assets]);

  const nbvTotal = useMemo(() => {
    return totalCost - accumDep;
  }, [accumDep]);

  const filteredAssets = useMemo(() => {
    const q = search.toLowerCase();
    return assets.filter(a => {
      if (categoryFilter && a.category !== categoryFilter) return false;
      if (methodFilter && !a.method.includes(methodFilter)) return false;
      if (statusFilter && a.status !== statusFilter) return false;
      if (q && !a.tag.toLowerCase().includes(q) && !a.desc.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [assets, categoryFilter, methodFilter, statusFilter, search]);

  const handleRunDepreciation = () => {
    showToast('Running scheduled depreciation batch for August 2026...', 'info');
    setTimeout(() => {
      setAssets(prev => prev.map(a => {
        if (a.tag === 'FA-1001' && a.status === 'In Use') {
          const monthlyDep = 3500;
          return {
            ...a,
            accumDep: a.accumDep + monthlyDep,
            nbv: Math.max(0, a.nbv - monthlyDep)
          };
        }
        return a;
      }));
      showToast('Depreciation posted - FA-1001 NBV reduced by $3,500', 'success');
    }, 800);
  };

  const handleConfirmDisposal = () => {
    if (!disposeTarget) return;
    setAssets(prev => prev.map(a => {
      if (a.tag === disposeTarget.tag) {
        return { ...a, status: 'Disposed', statusBadge: 'badge-gray', nbv: 0 };
      }
      return a;
    }));
    showToast(`${disposeTarget.tag} disposed - proceeds ${disposeProceeds} recorded, gain/loss posted to GL`, 'success');
    setDisposeTarget(null);
  };

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
          <div className="page-title">Fixed Assets</div>
          <div className="page-subtitle">
            Asset register, depreciation methods (Straight-Line, Declining Balance, MACRS, and more), and disposals
          </div>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline" onClick={() => showToast('Exporting asset register...', 'info')}>
            Export
          </button>
          <button className="btn btn-primary" onClick={() => showToast('New asset form opened', 'info')}>
            + New Asset
          </button>
        </div>
      </div>

      {/* ═══ STATS ROW ═══ */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon si-navy">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="3" y="6" width="14" height="9" rx="1" stroke="#102a2e" strokeWidth="1.5"/>
              <path d="M6 6V4a4 4 0 0 1 8 0v2" stroke="#102a2e" strokeWidth="1.4"/>
            </svg>
          </div>
          <div className="stat-info">
            <div className="stat-value">${totalCost.toLocaleString()}</div>
            <div className="stat-label">Total Asset Cost</div>
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
            <div className="stat-value">${accumDep.toLocaleString()}</div>
            <div className="stat-label">Accumulated Depreciation</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon si-green">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 12l4-5 3 3 6-7" stroke="#2e7d32" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="stat-info">
            <div className="stat-value">${nbvTotal.toLocaleString()}</div>
            <div className="stat-label">Net Book Value</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon si-coral">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 3v14M3 10h14" stroke="#c9791f" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="stat-info">
            <div className="stat-value">14</div>
            <div className="stat-label">Assets Added This Year</div>
          </div>
        </div>
      </div>

      {/* ═══ FILTERS ═══ */}
      <div className="filter-bar">
        <span className="filter-bar-label">Filters:</span>
        <select
          className="filter-select"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          <option value="Machinery & Equipment">Machinery &amp; Equipment</option>
          <option value="Vehicles">Vehicles</option>
          <option value="Buildings">Buildings</option>
          <option value="Furniture & Fixtures">Furniture &amp; Fixtures</option>
          <option value="IT Equipment">IT Equipment</option>
        </select>
        <select
          className="filter-select"
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
        >
          <option value="">All Depreciation Methods</option>
          <option value="Straight-Line">Straight-Line</option>
          <option value="Declining Balance">Declining Balance</option>
          <option value="Double Declining">Double Declining Balance</option>
          <option value="Sum-of-Years-Digits">Sum-of-Years-Digits</option>
          <option value="Units of Production">Units of Production</option>
          <option value="MACRS">MACRS</option>
        </select>
        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="In Use">In Use</option>
          <option value="Disposed">Disposed</option>
          <option value="Impaired">Impaired</option>
        </select>
        <div className="filter-spacer"></div>
        <input
          type="text"
          className="filter-input"
          placeholder="Search asset tag, description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: '220px' }}
        />
      </div>

      {/* ═══ ASSET REGISTER ═══ */}
      <div className="table-wrap" style={{ marginBottom: '24px' }}>
        <div className="table-head-row">
          <div className="table-head-title">Asset Register</div>
          <div className="table-head-actions">
            <button className="btn btn-primary btn-sm" onClick={handleRunDepreciation}>
              Run Depreciation
            </button>
          </div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Asset Tag</th>
              <th>Description</th>
              <th>Category</th>
              <th>Acquired</th>
              <th style={{ textAlign: 'right' }}>Cost</th>
              <th>Method</th>
              <th>Useful Life</th>
              <th style={{ textAlign: 'right' }}>Accum. Dep.</th>
              <th style={{ textAlign: 'right' }}>Net Book Value</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAssets.map((a) => (
              <tr key={a.tag}>
                <td className="font-semibold">{a.tag}</td>
                <td>{a.desc}</td>
                <td>{a.category}</td>
                <td>{a.acquired}</td>
                <td style={{ textAlign: 'right' }}>${a.cost.toLocaleString()}</td>
                <td>
                  <span className={`badge ${a.methodBadge}`}>{a.method}</span>
                </td>
                <td>{a.life}</td>
                <td style={{ textAlign: 'right' }}>${a.accumDep.toLocaleString()}</td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>${a.nbv.toLocaleString()}</td>
                <td>
                  <span className={`badge ${a.statusBadge}`}>{a.status}</span>
                </td>
                <td>
                  {a.status !== 'Disposed' ? (
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => setDisposeTarget(a)}
                    >
                      Dispose
                    </button>
                  ) : (
                    <button className="btn btn-ghost btn-sm" disabled>
                      Disposed
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ═══ DISPOSE PANEL ═══ */}
      {disposeTarget && (
        <div className="card" style={{ padding: '18px 20px', marginBottom: '24px' }}>
          <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0d1b4b', marginBottom: '12px' }}>
            Dispose Asset - <span>{disposeTarget.tag} ({disposeTarget.desc})</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label className="field-label">Disposal Date</label>
              <input
                type="date"
                className="field-input"
                value={disposeDate}
                onChange={(e) => setDisposeDate(e.target.value)}
              />
            </div>
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label className="field-label">Disposal Method</label>
              <select
                className="field-input"
                value={disposeMethod}
                onChange={(e) => setDisposeMethod(e.target.value)}
              >
                <option value="Sale">Sale</option>
                <option value="Scrap">Scrap</option>
                <option value="Trade-In">Trade-In</option>
                <option value="Write-Off">Write-Off</option>
              </select>
            </div>
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label className="field-label">Disposal Proceeds</label>
              <input
                type="text"
                className="field-input"
                placeholder="$0.00"
                value={disposeProceeds}
                onChange={(e) => setDisposeProceeds(e.target.value)}
              />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button className="btn btn-outline" onClick={() => setDisposeTarget(null)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleConfirmDisposal}>
              Confirm Disposal
            </button>
          </div>
        </div>
      )}
    </>
  );
}
export default FixedAssetsPage;
