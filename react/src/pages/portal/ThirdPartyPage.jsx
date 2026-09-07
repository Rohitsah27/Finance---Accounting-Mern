import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const PARTNERS = [
  {
    name: 'RSA Partners',
    full: 'RSA Distribution Partners LLC',
    written: 1120000,
    earned: 1010000,
    lossRatio: 54.3,
    share: 41.9,
    status: 'Active',
    icon: '🤝',
    color: '#1565c0',
    bg: '#e3f2fd',
  },
  {
    name: 'LMI Associates',
    full: 'Lloyd Market International Associates',
    written: 980000,
    earned: 890000,
    lossRatio: 59.6,
    share: 36.7,
    status: 'Active',
    icon: '🏦',
    color: '#c62828',
    bg: '#fce4ec',
  },
  {
    name: 'AXIS Direct',
    full: 'AXIS Direct Underwriting Partners',
    written: 570000,
    earned: 510000,
    lossRatio: 61.4,
    share: 21.3,
    status: 'Under Review',
    icon: '🌐',
    color: '#6a1b9a',
    bg: '#f3e5f5',
  },
];

export default function ThirdPartyPage() {
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
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

      {/* Back button */}
      <button
        className="btn btn-outline btn-sm"
        onClick={() => navigate('/dashboard')}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}
      >
        &larr; Back to Dashboard
      </button>

      {/* Header */}
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <div>
          <h1 className="page-title">3rd Party Partners Hub</h1>
          <p className="page-subtitle">Veridex 3rd Party Distribution Partners &bull; Production, Cessions, and Performance</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline btn-sm" onClick={() => showToast('Exporting partner production CSV...')}>Export CSV</button>
        </div>
      </div>

      {/* Summary KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', color: 'var(--gray-500)' }}>
            Total Written Premium
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--navy)', margin: '4px 0', fontFamily: 'var(--font-mono)' }}>
            $2.67M
          </div>
          <div style={{ fontSize: '11px', color: 'var(--green)' }}>&uarr; 8.4% vs prior YTD</div>
        </div>
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', color: 'var(--gray-500)' }}>
            Total Earned Premium
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--navy)', margin: '4px 0', fontFamily: 'var(--font-mono)' }}>
            $2.41M
          </div>
          <div style={{ fontSize: '11px', color: 'var(--green)' }}>&uarr; 7.9% vs prior YTD</div>
        </div>
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', color: 'var(--gray-500)' }}>
            Blended Loss Ratio
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--green)', margin: '4px 0', fontFamily: 'var(--font-mono)' }}>
            57.8%
          </div>
          <div style={{ fontSize: '11px', color: 'var(--gray-400)' }}>Target: &le; 65%</div>
        </div>
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', color: 'var(--gray-500)' }}>
            Active Partners
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--navy)', margin: '4px 0', fontFamily: 'var(--font-mono)' }}>
            3
          </div>
          <div style={{ fontSize: '11px', color: 'var(--gray-400)' }}>Portfolio share: 21.5%</div>
        </div>
      </div>

      {/* Partner cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
        {PARTNERS.map((p) => (
          <div key={p.name} className="card" style={{ padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: p.bg, color: p.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                {p.icon}
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--navy)' }}>{p.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--gray-400)' }}>{p.full}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--gray-500)', textTransform: 'uppercase' }}>Written</div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--navy)', fontFamily: 'var(--font-mono)' }}>
                  ${(p.written / 1e6).toFixed(2)}M
                </div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--gray-500)', textTransform: 'uppercase' }}>Earned</div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--navy)', fontFamily: 'var(--font-mono)' }}>
                  ${(p.earned / 1e6).toFixed(2)}M
                </div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--gray-500)', textTransform: 'uppercase' }}>Loss Ratio</div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: p.lossRatio > 60 ? 'var(--coral)' : 'var(--green)', fontFamily: 'var(--font-mono)' }}>
                  {p.lossRatio}%
                </div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--gray-500)', textTransform: 'uppercase' }}>Share</div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--navy)', fontFamily: 'var(--font-mono)' }}>
                  {p.share}%
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--gray-100)', height: '5px', borderRadius: '4px', overflow: 'hidden', marginBottom: '8px' }}>
              <div style={{ height: '100%', width: `${p.share * 2}%`, background: p.color }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', color: 'var(--gray-400)' }}>{p.share}% of 3rd party book</span>
              <span className={`badge ${p.status === 'Active' ? 'badge-green' : 'badge-orange'}`}>
                {p.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Table Detail */}
      <div className="table-wrap">
        <div className="table-head-row">
          <div className="table-head-title">Third Party Distribution Detail</div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Partner Name</th>
              <th>Contract Type</th>
              <th className="text-right">Written Premium</th>
              <th className="text-right">Earned Premium</th>
              <th className="text-right">Incurred Losses</th>
              <th className="text-right">Loss Ratio</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {PARTNERS.map((p) => {
              const losses = p.earned * (p.lossRatio / 100);
              return (
                <tr key={p.name}>
                  <td className="font-semibold cell-link">{p.full}</td>
                  <td><span className="badge badge-navy">Distribution Agreement</span></td>
                  <td className="font-mono text-right">${p.written.toLocaleString()}</td>
                  <td className="font-mono text-right">${p.earned.toLocaleString()}</td>
                  <td className="font-mono text-right">${Math.round(losses).toLocaleString()}</td>
                  <td className="font-mono text-right" style={{ color: p.lossRatio > 60 ? 'var(--coral)' : 'var(--green)', fontWeight: 700 }}>
                    {p.lossRatio}%
                  </td>
                  <td>
                    <span className={`badge ${p.status === 'Active' ? 'badge-green' : 'badge-orange'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => showToast(`Opening performance detail for ${p.name}`)}>
                      View Statement
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
