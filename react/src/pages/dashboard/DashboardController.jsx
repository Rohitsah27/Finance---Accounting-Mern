import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';
import './dashboard.css';

export function DashboardController() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [period, setPeriod] = useState('current');
  const [entity, setEntity] = useState('all');
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const ENTITIES = [
    { id: 'all', name: 'All Entities' },
    { id: 'ENT-01', name: 'Southlake Insurance Co.' },
    { id: 'ENT-02', name: 'NTA Program Administrators' },
    { id: 'ENT-03', name: 'HIT Agency Group' },
    { id: 'ENT-04', name: 'AC Manufacturing Inc.' },
    { id: 'ENT-05', name: 'AC Wholesale Distribution' },
    { id: 'ENT-06', name: 'Links Insurance Agency' },
    { id: 'ENT-07', name: 'Starlight Re' }
  ];

  const CLOSE_STEPS = [
    { label: 'Sub-Ledgers Closed', state: 'done' },
    { label: 'JEs Posted', state: 'done' },
    { label: 'Reconciliations', state: 'active' },
    { label: 'Intercompany Elim', state: 'pending' },
    { label: 'Trial Balance', state: 'pending' },
    { label: 'Locked / Published', state: 'pending' },
  ];

  const [jes, setJes] = useState([
    { je: 'JE-2026-0301', entity: 'Southlake Insurance Co.', date: '2026-08-18', memo: 'Accrued commission expense', amount: 184250, by: 'M. Alvarez', status: 'pending' },
    { je: 'JE-2026-0302', entity: 'AC Manufacturing Inc.', date: '2026-08-19', memo: 'WIP-to-finished-goods transfer', amount: 96400, by: 'D. Kessler', status: 'draft' },
    { je: 'JE-2026-0303', entity: 'AC Wholesale Distribution', date: '2026-08-19', memo: 'Volume rebate accrual — Q3', amount: 41200, by: 'R. Osei', status: 'draft' },
    { je: 'JE-2026-0304', entity: 'Links Insurance Agency', date: '2026-08-17', memo: 'Reclass — prepaid E&O premium', amount: 12800, by: 'J. Fontaine', status: 'pending' },
    { je: 'JE-2026-0305', entity: 'Southlake Insurance Co.', date: '2026-08-20', memo: 'Sales tax liability true-up', amount: 8350, by: 'P. Nazari', status: 'draft' },
    { je: 'JE-2026-0306', entity: 'Starlight Re', date: '2026-08-16', memo: 'Ceded reserve adjustment', amount: 275900, by: 'M. Alvarez', status: 'pending' },
  ]);

  const [reconExceptions, setReconExceptions] = useState([
    { acct: 'Operating — Chase 4021', exc: 'Unmatched deposit', amt: 12480, age: '3d' },
    { acct: 'Trust Escrow — HDFC 9910', exc: 'Timing difference', amt: 3120, age: '1d' },
    { acct: 'Payroll — Chase 4022', exc: 'Duplicate withdrawal (pending)', amt: 5600, age: '6d' },
  ]);

  const [elimPairs, setElimPairs] = useState([
    { pair: 'AC Manufacturing → AC Wholesale Distribution', amt: 184300, status: 'ok' },
    { pair: 'AC Wholesale Distribution → AC Retail Stores', amt: 96750, status: 'ok' },
    { pair: 'Links Insurance Agency → Southlake Insurance Co.', amt: 41200, status: 'pending' },
    { pair: 'Southlake Insurance Co. → Starlight Re', amt: 275900, status: 'exception' },
  ]);

  const filteredJEs = useMemo(() => {
    return jes.filter(j => {
      if (entity !== 'all') {
        const entObj = ENTITIES.find(e => e.id === entity);
        if (entObj && j.entity !== entObj.name) return false;
      }
      if (status !== 'all' && j.status !== status) return false;
      if (search) {
        const q = search.toLowerCase();
        return (j.je + j.memo + j.entity + j.by).toLowerCase().includes(q);
      }
      return true;
    });
  }, [jes, entity, status, search]);

  const postJE = (id) => {
    setJes(prev => prev.map(j => j.je === id ? { ...j, status: 'posted' } : j));
    showToast(`Journal entry ${id} successfully posted to General Ledger`, 'success');
  };

  const handleRunEliminations = () => {
    setElimPairs(prev => prev.map(p => ({ ...p, status: 'ok' })));
    showToast('Intercompany elimination batch completed successfully', 'success');
  };

  const fUSD = (v) => '$' + Number(v).toLocaleString('en-US');

  const openJEs = jes.filter(j => j.status !== 'posted');
  const totalOpenAmt = openJEs.reduce((a, b) => a + b.amount, 0);

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
          <div className="page-title">Controller Dashboard</div>
          <div className="page-subtitle">
            Books management overview · Southlake Insurance Co. &amp; Consolidated Affiliates
          </div>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline btn-sm" onClick={() => showToast('Dashboard refreshed')}>
            Refresh
          </button>
          <Link to="/period-locking" className="btn btn-primary btn-sm">
            Go to Period Close
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar" style={{ marginBottom: '18px' }}>
        <span className="filter-bar-label">Period</span>
        <select className="filter-select" value={period} onChange={(e) => setPeriod(e.target.value)}>
          <option value="current">Current Period (Aug 2026)</option>
          <option value="prior">Prior Period (Jul 2026)</option>
        </select>

        <span className="filter-bar-label">Entity</span>
        <select className="filter-select" value={entity} onChange={(e) => setEntity(e.target.value)}>
          {ENTITIES.map(e => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>

        <span className="filter-bar-label">JE Status</span>
        <select className="filter-select" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="pending">Pending Approval</option>
        </select>

        <div className="filter-spacer" />
        <button className="btn btn-outline btn-sm" onClick={() => { setPeriod('current'); setEntity('all'); setStatus('all'); setSearch(''); }}>
          Clear Filters
        </button>
      </div>

      {/* 4 Stat Cards */}
      <div className="ctl-stats">
        <div className="stat-card">
          <div className="stat-icon si-navy" style={{ fontSize: '18px' }}>📝</div>
          <div className="stat-info">
            <div className="stat-value">{openJEs.length}</div>
            <div className="stat-label">Unposted / Draft JEs</div>
            <div className="stat-change" style={{ color: 'var(--gray-400, #94a3b8)' }}>{fUSD(totalOpenAmt)} total value</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon si-navy" style={{ fontSize: '18px' }}>🏦</div>
          <div className="stat-info">
            <div className="stat-value">{reconExceptions.length}</div>
            <div className="stat-label">Bank Recon Exceptions</div>
            <div className="stat-change" style={{ color: 'var(--gray-400, #94a3b8)' }}>Oldest: 6d (Needs Match)</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon si-coral" style={{ fontSize: '18px' }}>⚠️</div>
          <div className="stat-info">
            <div className="stat-value" style={{ color: '#d32f2f' }}>$18,450.00</div>
            <div className="stat-label">Trial Balance Variance</div>
            <div className="stat-change" style={{ color: '#d32f2f' }}>Out of balance — needs review</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon si-green" style={{ fontSize: '18px' }}>🔗</div>
          <div className="stat-info">
            <div className="stat-value">{elimPairs.filter(p => p.status !== 'ok').length}</div>
            <div className="stat-label">Intercompany Elims Open</div>
            <div className="stat-change" style={{ color: 'var(--gray-400, #94a3b8)' }}>{elimPairs.length} pairs configured</div>
          </div>
        </div>
      </div>

      {/* Period Close Stepper Box */}
      <div className="close-wrap">
        <div className="close-hdr">
          <div className="close-title">
            Period Close Status — {period === 'current' ? 'August 2026' : 'July 2026'}
          </div>
          <div className="close-meta">Target close: 5 business days · Step 3 of 6 In Progress</div>
        </div>
        <div className="v-wizard-steps">
          {CLOSE_STEPS.map((s, idx) => (
            <div key={idx} className={`v-wizard-step ${s.state}`}>
              <div className="v-wizard-dot">{s.state === 'done' ? '✓' : idx + 1}</div>
              <div className="v-wizard-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Trial Balance Alert */}
      <div className="tb-alert">
        <div className="tb-alert-icon">!</div>
        <div style={{ flex: 1 }}>
          <div className="tb-alert-title">Trial Balance Out of Balance — $18,450.00</div>
          <div className="tb-alert-desc">
            Southlake Insurance Co. trial balance does not tie to the GL control account as of 08/20/2026. Review suspense entries before closing the period.
          </div>
        </div>
        <button className="btn btn-coral btn-sm" onClick={() => navigate('/gl/general-ledger')}>
          Investigate Control Account
        </button>
      </div>

      {/* Unposted / Draft JEs Table */}
      <div className="table-wrap" style={{ marginBottom: '18px' }}>
        <div className="table-head-row">
          <div className="table-head-title">
            Unposted / Draft Journal Entries{' '}
            <span className="badge badge-orange" style={{ marginLeft: '8px' }}>
              {filteredJEs.filter(j => j.status !== 'posted').length} open
            </span>
          </div>
          <div className="table-head-actions" style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              className="filter-input"
              placeholder="Search JEs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '180px' }}
            />
            <Link to="/gl/journal-entry" className="btn btn-outline btn-sm">
              Open Journal Entry
            </Link>
          </div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>JE #</th>
              <th>Entity</th>
              <th>Date</th>
              <th>Memo</th>
              <th>Amount</th>
              <th>Prepared By</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredJEs.length ? (
              filteredJEs.map((j) => (
                <tr key={j.je}>
                  <td className="font-semibold">{j.je}</td>
                  <td>{j.entity}</td>
                  <td>{j.date}</td>
                  <td>{j.memo}</td>
                  <td className="font-semibold">{fUSD(j.amount)}</td>
                  <td>{j.by}</td>
                  <td>
                    <span className={`badge ${j.status === 'posted' ? 'badge-green' : j.status === 'pending' ? 'badge-orange' : 'badge-gray'}`}>
                      {j.status === 'posted' ? 'Posted' : j.status === 'pending' ? 'Pending Approval' : 'Draft'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <Link to="/gl/journal-entry" className="btn btn-outline btn-sm">
                        Review
                      </Link>
                      {j.status !== 'posted' && (
                        <button className="btn btn-outline btn-sm" onClick={() => postJE(j.je)}>
                          Post
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '18px', color: 'var(--gray-400, #94a3b8)' }}>
                  No journal entries match current filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 2-Column Split: Bank Recon Exceptions & Intercompany Elims */}
      <div className="ctl-2col">
        <div className="table-wrap">
          <div className="table-head-row">
            <div className="table-head-title">Bank Reconciliation Exceptions</div>
            <Link to="/bank-reconciliation" className="btn btn-outline btn-sm">
              Open Bank Recon
            </Link>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Account</th>
                <th>Exception</th>
                <th>Amount</th>
                <th>Age</th>
              </tr>
            </thead>
            <tbody>
              {reconExceptions.map((r, idx) => (
                <tr key={idx}>
                  <td className="font-semibold">{r.acct}</td>
                  <td><span className="badge badge-red">{r.exc}</span></td>
                  <td className="font-semibold">{fUSD(r.amt)}</td>
                  <td><span className="badge badge-gray">{r.age}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="table-wrap">
          <div className="table-head-row">
            <div className="table-head-title">Intercompany Elimination Status</div>
            <button className="btn btn-outline btn-sm" onClick={handleRunEliminations}>
              Run Eliminations
            </button>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Entity Pair</th>
                <th>Elim. Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {elimPairs.map((p, idx) => (
                <tr key={idx}>
                  <td className="font-semibold" style={{ fontSize: '11.5px' }}>{p.pair}</td>
                  <td>{fUSD(p.amt)}</td>
                  <td>
                    <span className={`badge ${p.status === 'ok' ? 'badge-green' : p.status === 'pending' ? 'badge-orange' : 'badge-red'}`}>
                      {p.status === 'ok' ? 'Balanced' : p.status === 'pending' ? 'Pending Close' : 'Variance Exc'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
