import React, { useState } from 'react';
import { useConfig } from '../../context/ConfigContext';

export default function EntityHierarchyPage() {
  const { tenantConfig, entities } = useConfig();
  const [expandedNodes, setExpandedNodes] = useState({ 0: true, 1: true });
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const toggleNode = (idx) => {
    setExpandedNodes(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
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
          <h1 className="page-title">Entity Hierarchy &amp; Consolidation</h1>
          <p className="page-subtitle">Multi-entity structure, intercompany relationships, and consolidated financial position</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline" onClick={() => showToast('Exporting consolidation workbook...')}>Export</button>
          <button className="btn btn-primary" onClick={() => showToast('New Legal Entity setup wizard...')}>+ New Entity</button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon si-navy">🏢</div>
          <div className="stat-info">
            <div className="stat-value">{entities?.length || 7}</div>
            <div className="stat-label">Legal Entities</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon si-green">💵</div>
          <div className="stat-info">
            <div className="stat-value">$18.42M</div>
            <div className="stat-label">Consolidated Net Assets</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon si-orange">🔄</div>
          <div className="stat-info">
            <div className="stat-value">$2.16M</div>
            <div className="stat-label">Intercompany Balances</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon si-coral">📅</div>
          <div className="stat-info">
            <div className="stat-value">Nov 30, 2026</div>
            <div className="stat-label">Last Consolidation Run</div>
          </div>
        </div>
      </div>

      {/* Chain Explanation Card */}
      <div className="card" style={{ marginBottom: '20px', padding: '18px 20px' }}>
        <div style={{ fontSize: '13px', color: 'var(--gray-700)', lineHeight: '1.6' }}>
          The insurance distribution chain is modeled as four Party roles sharing one core master-data model:{' '}
          <strong style={{ color: 'var(--navy)' }}>Insured</strong> &rarr;{' '}
          <strong style={{ color: 'var(--navy)' }}>Agency</strong> &rarr;{' '}
          <strong style={{ color: 'var(--navy)' }}>MGA</strong> &rarr;{' '}
          <strong style={{ color: 'var(--navy)' }}>Carrier</strong>.
          Each level maintains autonomous books; premium cash and commission flow through fiduciary accounts down the chain.
          Expand a tier to inspect accounting mechanics on a representative $10,000 gross premium placement.
        </div>
      </div>

      {/* Visual Tree Hierarchy */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>Multi-Tier Distribution &amp; Accounting Tree</div>

        {/* Node 1: Insured */}
        <div style={{ border: '1px solid var(--gray-200)', borderRadius: '8px', marginBottom: '12px', background: '#fff' }}>
          <div
            onClick={() => toggleNode(0)}
            style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: 'var(--gray-50)', borderRadius: '8px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '14px' }}>{expandedNodes[0] ? '▼' : '▶'}</span>
              <strong style={{ fontSize: '14px', color: 'var(--gray-900)' }}>Insured (Policyholder / Commercial Client)</strong>
              <span className="badge badge-gray">Customer</span>
            </div>
            <span className="font-mono font-semibold" style={{ color: 'var(--navy)' }}>$10,000 Gross Written Premium</span>
          </div>

          {expandedNodes[0] && (
            <div style={{ padding: '16px 20px', borderTop: '1px solid var(--gray-200)', marginLeft: '24px' }}>
              <div style={{ fontSize: '12px', color: 'var(--gray-600)', marginBottom: '14px' }}>
                Pays $10,000 gross premium for the annual policy period. Binds coverage under commercial transportation lines.
              </div>

              {/* Node 2: Agency */}
              <div style={{ border: '1px solid var(--gray-200)', borderRadius: '8px', marginBottom: '12px' }}>
                <div
                  onClick={() => toggleNode(1)}
                  style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: '#fff' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '12px' }}>{expandedNodes[1] ? '▼' : '▶'}</span>
                    <strong>Apex Commercial Brokerage LLC</strong>
                    <span className="badge badge-blue">Agency</span>
                  </div>
                  <span className="font-mono" style={{ color: 'var(--green)' }}>Retains $1,000 (10% Comm.)</span>
                </div>

                {expandedNodes[1] && (
                  <div style={{ padding: '14px 16px', borderTop: '1px solid var(--gray-200)', marginLeft: '20px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--gray-600)', marginBottom: '12px' }}>
                      Keeps 10% agency commission ($1,000); remits $9,000 net premium to MGA.<br />
                      <em>Journal Entry: Dr Cash/Trust $10,000 | Cr Premium Payable to MGA $9,000 | Cr Commission Income $1,000</em>
                    </div>

                    {/* Node 3: MGA */}
                    <div style={{ border: '1px solid var(--gray-200)', borderRadius: '8px', marginBottom: '12px' }}>
                      <div
                        onClick={() => toggleNode(2)}
                        style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: '#fff' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '12px' }}>{expandedNodes[2] ? '▼' : '▶'}</span>
                          <strong>Veridex Underwriting Managers (MGA)</strong>
                          <span className="badge badge-orange">MGA / DUAA</span>
                        </div>
                        <span className="font-mono" style={{ color: 'var(--green)' }}>Retains $1,350 (15% Comm.)</span>
                      </div>

                      {expandedNodes[2] && (
                        <div style={{ padding: '14px 16px', borderTop: '1px solid var(--gray-200)', marginLeft: '20px' }}>
                          <div style={{ fontSize: '12px', color: 'var(--gray-600)', marginBottom: '12px' }}>
                            Underwriting authority under Program Agreement; retains $1,350 underwriting commission; remits $7,650 carrier net payable via monthly bordereau.<br />
                            <em>Journal Entry: Dr Cash/Trust $9,000 | Cr Carrier Premium Payable $7,650 | Cr MGA Fee Income $1,350</em>
                          </div>

                          {/* Node 4: Carrier */}
                          <div style={{ border: '1px solid var(--gray-200)', borderRadius: '8px', background: 'var(--gray-50)', padding: '12px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <strong>Southlake Insurance Co. / Munich Re Cession</strong>
                                <span className="badge badge-navy">Carrier / Reinsurer</span>
                              </div>
                              <span className="font-mono" style={{ color: 'var(--navy)' }}>Retains $7,650 (Net)</span>
                            </div>
                            <div style={{ fontSize: '11.5px', color: 'var(--gray-500)', marginTop: '8px' }}>
                              Underwrites policy risk. Books Gross Written Premium $10,000; books Acquisition Costs $2,350; sets up Unearned Premium Reserve (UPR) earned 1/365th daily.
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
