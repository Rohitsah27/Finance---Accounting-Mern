import React, { useState } from 'react';

const BOM_DATA = {
  name: 'Model AC-2000 Split Unit (Finished Good)',
  badge: 'FG',
  qty: '1 EA',
  unitCost: 410.00,
  ext: 410.00,
  children: [
    { name: 'Compressor Assembly (AC-Compressor-04)', badge: 'RM', qty: '1 EA', unitCost: 148.00, ext: 148.00, children: [] },
    { name: 'Condenser Coil - Copper', badge: 'RM', qty: '1 EA', unitCost: 62.50, ext: 62.50, children: [] },
    { name: 'Refrigerant R-32 Charge', badge: 'RM', qty: '2.4 kg', unitCost: 9.75, ext: 23.40, children: [] },
    { name: 'Sheet Metal Cabinet & Housing', badge: 'RM', qty: '1 EA', unitCost: 54.00, ext: 54.00, children: [] },
    { name: 'PCB Control Board', badge: 'RM', qty: '1 EA', unitCost: 38.20, ext: 38.20, children: [] },
    { name: 'Fan Motor Assembly', badge: 'WIP', qty: '2 EA', unitCost: 41.95, ext: 83.90, children: [] },
  ]
};

const COST_MULTIPLIER = { FIFO: 1.00, 'Weighted Average': 1.015, 'Standard Cost': 0.97 };

export function InventoryCostingPage() {
  const [costMethod, setCostMethod] = useState('FIFO');
  const [isBomOpen, setIsBomOpen] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleMethodChange = (m) => {
    setCostMethod(m);
    showToast(`Valuation recalculated under ${m}`, 'info');
  };

  const mult = COST_MULTIPLIER[costMethod] || 1.0;

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
          <div className="page-title">Inventory &amp; Costing</div>
          <div className="page-subtitle">
            AC Manufacturing Inc. - raw material, WIP, and finished-goods costing across the AC Manufacturing Group
          </div>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline" onClick={() => showToast('Exporting inventory valuation...', 'info')}>
            Export
          </button>
          <button className="btn btn-primary" onClick={() => showToast('New production order created', 'success')}>
            + New Production Order
          </button>
        </div>
      </div>

      {/* ═══ STATS ROW ═══ */}
      <div className="stats-row">
        {/* Total Inventory Value with Breakdown Bar */}
        <div className="stat-card" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div className="stat-label">Total Inventory Value</div>
            <div className="stat-value" style={{ fontSize: '18px' }}>$4,286,400</div>
          </div>
          <div style={{ display: 'flex', height: '10px', borderRadius: '4px', overflow: 'hidden', marginTop: '8px' }}>
            <div style={{ width: '34%', background: '#102a2e' }} title="Raw Material $1.46M" />
            <div style={{ width: '22%', background: '#c9791f' }} title="WIP $0.94M" />
            <div style={{ width: '44%', background: '#0f6e63' }} title="Finished Goods $1.89M" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: 'var(--color-muted, #64748b)', marginTop: '6px' }}>
            <span>RM $1.46M</span>
            <span>WIP $0.94M</span>
            <span>FG $1.89M</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon si-navy">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 6l7-3 7 3-7 3-7-3z" stroke="#102a2e" strokeWidth="1.4" strokeLinejoin="round"/>
              <path d="M3 6v7l7 3 7-3V6" stroke="#102a2e" strokeWidth="1.4" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="stat-info">
            <div className="stat-value">1,840</div>
            <div className="stat-label">Units in Production</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon si-orange">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 4v7M10 14v1" stroke="#e65100" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="10" cy="10" r="7.5" stroke="#e65100" strokeWidth="1.4"/>
            </svg>
          </div>
          <div className="stat-info">
            <div className="stat-value">6</div>
            <div className="stat-label">Reorder Alerts</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon si-green">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 10h12M13 6l3 4-3 4" stroke="#2e7d32" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="stat-info">
            <div className="stat-value">7.4x</div>
            <div className="stat-label">Inventory Turnover Ratio</div>
          </div>
        </div>
      </div>

      {/* ═══ BILL OF MATERIALS (BOM) ═══ */}
      <div className="card" style={{ marginBottom: '24px', padding: '18px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#0d1b4b' }}>
            Bill of Materials - Model AC-2000 Split Unit
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--color-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Costing Method:
            </span>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12.5px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="costmethod"
                value="FIFO"
                checked={costMethod === 'FIFO'}
                onChange={() => handleMethodChange('FIFO')}
              /> FIFO
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12.5px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="costmethod"
                value="Weighted Average"
                checked={costMethod === 'Weighted Average'}
                onChange={() => handleMethodChange('Weighted Average')}
              /> Weighted Average
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12.5px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="costmethod"
                value="Standard Cost"
                checked={costMethod === 'Standard Cost'}
                onChange={() => handleMethodChange('Standard Cost')}
              /> Standard Cost
            </label>
          </div>
        </div>

        {/* Tree view */}
        <div className="v-tree">
          <div className="v-tree-node">
            <div
              className="v-tree-row"
              onClick={() => setIsBomOpen(!isBomOpen)}
              style={{ cursor: 'pointer' }}
            >
              <span className="v-tree-toggle">{isBomOpen ? '▼' : '▶'}</span>
              <strong>{BOM_DATA.name}</strong>
              <span className="v-tree-badge">{BOM_DATA.badge}</span>
              <span style={{ fontSize: '11px', color: 'var(--color-muted, #64748b)' }}>Qty: {BOM_DATA.qty}</span>
              <span className="v-tree-amount">
                ${(BOM_DATA.unitCost * mult).toFixed(2)} / unit - Ext: ${(BOM_DATA.ext * mult).toFixed(2)}
              </span>
            </div>

            {isBomOpen && (
              <div className="v-tree-children" style={{ paddingLeft: '24px' }}>
                {BOM_DATA.children.map((child, idx) => (
                  <div key={idx} className="v-tree-node">
                    <div className="v-tree-row">
                      <span className="v-tree-toggle">•</span>
                      <strong>{child.name}</strong>
                      <span className="v-tree-badge">{child.badge}</span>
                      <span style={{ fontSize: '11px', color: 'var(--color-muted, #64748b)' }}>Qty: {child.qty}</span>
                      <span className="v-tree-amount">
                        ${(child.unitCost * mult).toFixed(2)} / unit - Ext: ${(child.ext * mult).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ PRODUCTION ORDERS ═══ */}
      <div className="table-wrap" style={{ marginBottom: '24px' }}>
        <div className="table-head-row">
          <div className="table-head-title">Production Orders</div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Order #</th>
              <th>SKU</th>
              <th style={{ textAlign: 'right' }}>Quantity</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Standard Cost</th>
              <th style={{ textAlign: 'right' }}>Actual Cost</th>
              <th>Variance</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="font-semibold">PO-8841</td>
              <td>AC-2000 Split Unit</td>
              <td style={{ textAlign: 'right' }}>400</td>
              <td><span className="badge badge-blue">In Progress</span></td>
              <td style={{ textAlign: 'right' }}>$164,000</td>
              <td style={{ textAlign: 'right' }}>$168,900</td>
              <td><span className="badge badge-red">+3.0% Unfav</span></td>
            </tr>
            <tr>
              <td className="font-semibold">PO-8836</td>
              <td>AC-1500 Window Unit</td>
              <td style={{ textAlign: 'right' }}>620</td>
              <td><span className="badge badge-green">Complete</span></td>
              <td style={{ textAlign: 'right' }}>$142,600</td>
              <td style={{ textAlign: 'right' }}>$139,280</td>
              <td><span className="badge badge-green">-2.3% Fav</span></td>
            </tr>
            <tr>
              <td className="font-semibold">PO-8829</td>
              <td>AC-2000 Split Unit</td>
              <td style={{ textAlign: 'right' }}>350</td>
              <td><span className="badge badge-green">Complete</span></td>
              <td style={{ textAlign: 'right' }}>$143,500</td>
              <td style={{ textAlign: 'right' }}>$144,020</td>
              <td><span className="badge badge-orange">+0.4% Unfav</span></td>
            </tr>
            <tr>
              <td className="font-semibold">PO-8850</td>
              <td>AC-3000 Commercial Rooftop</td>
              <td style={{ textAlign: 'right' }}>120</td>
              <td><span className="badge badge-gray">Planned</span></td>
              <td style={{ textAlign: 'right' }}>$96,000</td>
              <td style={{ textAlign: 'right' }}> - </td>
              <td> - </td>
            </tr>
            <tr>
              <td className="font-semibold">PO-8842</td>
              <td>AC-1500 Window Unit</td>
              <td style={{ textAlign: 'right' }}>500</td>
              <td><span className="badge badge-blue">In Progress</span></td>
              <td style={{ textAlign: 'right' }}>$115,000</td>
              <td style={{ textAlign: 'right' }}>$112,400</td>
              <td><span className="badge badge-green">-2.3% Fav</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ═══ MULTI-LOCATION STOCK ═══ */}
      <div className="table-wrap">
        <div className="table-head-row">
          <div className="table-head-title">Multi-Location Stock - Manufacturing Group</div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th style={{ textAlign: 'right' }}>AC Manufacturing Inc. (Plant)</th>
              <th style={{ textAlign: 'right' }}>AC Wholesale Distribution (DC)</th>
              <th style={{ textAlign: 'right' }}>AC Retail Stores</th>
              <th style={{ textAlign: 'right' }}>Total On Hand</th>
              <th>Reorder Point</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="font-semibold">AC-2000 Split Unit</td>
              <td style={{ textAlign: 'right' }}>180</td>
              <td style={{ textAlign: 'right' }}>420</td>
              <td style={{ textAlign: 'right' }}>96</td>
              <td style={{ textAlign: 'right', fontWeight: 700 }}>696</td>
              <td><span className="badge badge-green">Above 250</span></td>
            </tr>
            <tr>
              <td className="font-semibold">AC-1500 Window Unit</td>
              <td style={{ textAlign: 'right' }}>64</td>
              <td style={{ textAlign: 'right' }}>210</td>
              <td style={{ textAlign: 'right' }}>58</td>
              <td style={{ textAlign: 'right', fontWeight: 700 }}>332</td>
              <td><span className="badge badge-orange">Near 300</span></td>
            </tr>
            <tr>
              <td className="font-semibold">AC-3000 Commercial Rooftop</td>
              <td style={{ textAlign: 'right' }}>22</td>
              <td style={{ textAlign: 'right' }}>48</td>
              <td style={{ textAlign: 'right' }}>6</td>
              <td style={{ textAlign: 'right', fontWeight: 700 }}>76</td>
              <td><span className="badge badge-red">Below 100 - Reorder</span></td>
            </tr>
            <tr>
              <td className="font-semibold">AC-Compressor-04 (RM)</td>
              <td style={{ textAlign: 'right' }}>640</td>
              <td style={{ textAlign: 'right' }}> - </td>
              <td style={{ textAlign: 'right' }}> - </td>
              <td style={{ textAlign: 'right', fontWeight: 700 }}>640</td>
              <td><span className="badge badge-green">Above 400</span></td>
            </tr>
            <tr>
              <td className="font-semibold">AC-Refrigerant-R32 (RM)</td>
              <td style={{ textAlign: 'right' }}>2,150 kg</td>
              <td style={{ textAlign: 'right' }}> - </td>
              <td style={{ textAlign: 'right' }}> - </td>
              <td style={{ textAlign: 'right', fontWeight: 700 }}>2,150 kg</td>
              <td><span className="badge badge-red">Below 2,500 kg - Reorder</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}
export default InventoryCostingPage;
