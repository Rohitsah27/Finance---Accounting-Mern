import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';
import './mga-operations.css';

const CARRIER_SETTLEMENT_CATEGORY = 'Carrier Settlement — Net Premium Payable';

export function MgaOperationsPage() {
  const { apInvoices, journalEntries } = useFinance();
  const { activeEntity } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('bordereau');
  const [toast, setToast] = useState(null);
  // Which side of this page you see is the real logged-in entity, not a
  // free-floating toggle — a manual "Role View" dropdown here used to be
  // completely disconnected from who was actually logged in, so switching
  // your real workspace (Broker/MGA/Carrier) changed nothing on this page:
  // both perspectives silently showed the same "MGA View" content.
  const viewRole = activeEntity?.id === 'ENT-CAR-01' ? 'carrier' : 'mga';

  // The real MGA→Carrier settlement bill, if the PAS Event Injector's Stage 4
  // (BORDEREAU_INGESTED) has actually been fired for this policy — that's
  // the one true signal that a bordereau was sent and the Carrier now knows
  // what it's owed. Newest first since addApInvoice prepends.
  const realCarrierBill = useMemo(
    () => (apInvoices || []).find(b => b.category === CARRIER_SETTLEMENT_CATEGORY),
    [apInvoices]
  );

  // Real GL-derived totals instead of hardcoded stat-card numbers — read
  // straight off POSTED journal entries (same bar the Chart of Accounts
  // itself uses), per book:
  //   Broker's (ENT-AGY-01) Dr 1100 = total premium actually invoiced
  //   MGA's (ENT-MGA-01) Dr 1001    = cash actually collected from Broker
  //   MGA's (ENT-MGA-01) Cr 4100    = override/policy-fee revenue recognized
  //   Carrier's (ENT-CAR-01) Dr 1100 = settlement receivable booked at bordereau ingestion
  //   Carrier's (ENT-CAR-01) Dr 1001 = cash actually received from MGA (fully settled)
  // Tracked directly off the ledger (not just the AP bill) because Quick
  // Simulate posts the whole DBA chain straight to the GL without ever
  // raising an AP bill — gating purely on that bill would wrongly show
  // "nothing sent yet" even after Quick Simulate fully settles everything.
  const ledgerTotals = useMemo(() => {
    let brokerTotalBilled = 0;
    let mgaCollected = 0;
    let mgaRevenue = 0;
    let brokerCommission = 0;
    let surplusTax = 0;
    let carrierReceivable = 0;
    let carrierCashReceived = 0;
    (journalEntries || []).forEach(je => {
      const posted = je.status === 'Posted' || je.status === 'posted';
      if (!posted) return;
      (je.lines || []).forEach(l => {
        if (je.entity === 'ENT-AGY-01' && l.accountCode === '1100') brokerTotalBilled += Number(l.debit) || 0;
        if (je.entity === 'ENT-AGY-01' && l.accountCode === '4200') brokerCommission += Number(l.credit) || 0;
        if (je.entity === 'ENT-MGA-01' && l.accountCode === '1001') mgaCollected += Number(l.debit) || 0;
        if (je.entity === 'ENT-MGA-01' && l.accountCode === '4100') mgaRevenue += Number(l.credit) || 0;
        if (je.entity === 'ENT-MGA-01' && l.accountCode === '2300') surplusTax += Number(l.credit) || 0;
        if (je.entity === 'ENT-CAR-01' && l.accountCode === '1100' && Number(l.debit) > 0) carrierReceivable += Number(l.debit) || 0;
        if (je.entity === 'ENT-CAR-01' && l.accountCode === '1001' && Number(l.debit) > 0) carrierCashReceived += Number(l.debit) || 0;
      });
    });
    return { brokerTotalBilled, mgaCollected, mgaRevenue, brokerCommission, surplusTax, carrierReceivable, carrierCashReceived };
  }, [journalEntries]);

  // The single source of truth for "has a bordereau actually gone to the
  // Carrier" — true whether it happened via the AP bill (PAS Event
  // Injector's Stage 4) or straight to the ledger (Quick Simulate).
  const hasBordereau = !!realCarrierBill || ledgerTotals.carrierReceivable > 0;
  const isSettled = realCarrierBill ? realCarrierBill.status === 'Paid & Cleared' : ledgerTotals.carrierCashReceived > 0;
  const isSubmitted = hasBordereau;

  // A display-shaped bill for the JSX below — the real AP bill when one
  // exists, otherwise a ledger-derived stand-in so the same rendering code
  // works for both paths. Only realCarrierBill can actually be paid — use
  // it (not displayBill) to gate any "Pay Now" / "Remit" action, since
  // there's nothing left to action once Quick Simulate has settled it
  // directly on the ledger.
  const displayBill = realCarrierBill || (hasBordereau ? {
    id: 'GL-' + (journalEntries.find(je => je.entity === 'ENT-CAR-01' && (je.lines || []).some(l => l.accountCode === '1100'))?.id || 'SETTLEMENT'),
    vendor: 'SOUTHLAKE',
    entityName: 'NTA Program Administrators',
    amount: ledgerTotals.carrierReceivable,
    dueDate: journalEntries.find(je => je.entity === 'ENT-CAR-01' && (je.lines || []).some(l => l.accountCode === '1100'))?.date || '',
    status: isSettled ? 'Paid & Cleared' : 'Approved',
    glAcct: '2200'
  } : null);

  // Expanded views
  const [expandedAuditId, setExpandedAuditId] = useState(null);
  const [expandedSplitId, setExpandedSplitId] = useState(null);
  const [expandedSettlementId, setExpandedSettlementId] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Generating/ingesting a bordereau is a real accounting event (it posts a
  // JE to the Carrier's book and raises the Carrier settlement bill), so it
  // lives in one place — the PAS Event Injector's Stage 4 preset — rather
  // than being duplicated here as a second source of truth. autoInject=1
  // fires that event immediately on arrival rather than just pre-filling
  // the form, so this button is a real one-click action, not a detour that
  // still needs a second "Inject" click on another page to do anything.
  const goGenerateBordereau = () => {
    if (isSubmitted) {
      showToast(`Bordereau already sent — ${displayBill.id} ${realCarrierBill ? 'is live on Accounts Payable' : 'was posted directly (e.g. via Quick Simulate)'}.`, 'info');
      return;
    }
    navigate('/pas-policy?preset=bordereau_ingested&autoInject=1');
  };

  const handleAuthorizeDisbursement = () => {
    if (!realCarrierBill) {
      showToast(
        hasBordereau
          ? 'This settlement was posted directly to the ledger (e.g. via Quick Simulate) — there is no AP bill left to action.'
          : 'No bordereau has been sent yet — nothing to remit.',
        hasBordereau ? 'info' : 'error'
      );
      return;
    }
    if (isSettled) {
      showToast(`Already remitted — ${realCarrierBill.id} is Paid & Cleared.`, 'info');
      return;
    }
    navigate('/accounts-payable');
  };

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
          <div className="page-title">
            {viewRole === 'carrier' ? 'MGA Operations & Program Oversight' : 'MGA Operations & Carrier Reporting'}
          </div>
          <div className="page-subtitle">
            {viewRole === 'carrier'
              ? 'Inbound Bordereaux Ingestion · MGA Commission Audit · Net Wire Reconciliation · Program Surveillance'
              : 'Monthly Bordereaux Reporting · Carrier Remittance · Commission Override Ledger · Broker Network'}
          </div>
        </div>
        <div className="page-actions">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginRight: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-muted)' }}>Viewing as:</span>
            <span className="badge badge-navy" style={{ fontSize: '12px', padding: '4px 8px' }}>
              {viewRole === 'carrier' ? 'Carrier (Southlake)' : `MGA (${activeEntity?.name || 'NTA'})`}
            </span>
          </div>
          <button className="btn btn-outline" onClick={() => setActiveTab('settlement')}>
            {viewRole === 'carrier' ? 'Audit Settlement' : 'Remittance Statement'}
          </button>
          <button
            className="btn btn-primary"
            onClick={goGenerateBordereau}
          >
            {viewRole === 'carrier' ? '+ Ingest Bordereaux' : '+ Generate & Submit Bordereau'}
          </button>
        </div>
      </div>

      {/* Dynamic 4 Stats Cards */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon si-navy">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 5h14M3 10h14M3 15h8" stroke="#0d1b4b" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </div>
          <div className="stat-info">
            <div className="stat-value">{viewRole === 'carrier' ? '1' : 'Southlake'}</div>
            <div className="stat-label">{viewRole === 'carrier' ? 'Active MGAs' : 'Underwriting Carrier'}</div>
            <div className="stat-change text-muted">
              {viewRole === 'carrier' ? 'NTA · Program Manager' : 'Southlake Specialty · DUAA Partner'}
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon si-green">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 3v14M5 8l5-5 5 5" stroke="#2e7d32" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="stat-info">
            <div className="stat-value">
              {viewRole === 'carrier'
                ? `$${(displayBill?.amount ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                : `$${ledgerTotals.mgaCollected.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            </div>
            <div className="stat-label">
              {viewRole === 'carrier' ? 'Reported GWP MTD' : 'Broker Premium Collected'}
            </div>
            <div className="stat-change trend-up">
              {viewRole === 'carrier'
                ? (displayBill ? '1 policy ingested into GL' : 'No policy ingested yet')
                : `From HIT (Broker) · $${ledgerTotals.brokerTotalBilled.toLocaleString('en-US', { minimumFractionDigits: 2 })} total billed`}
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon si-coral">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 3v14M5 12l5 5 5-5" stroke="#e05470" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="stat-info">
            <div className="stat-value">${ledgerTotals.mgaRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <div className="stat-label">
              {viewRole === 'carrier' ? 'MGA Commission Expense' : 'MGA Revenue & Fees'}
            </div>
            <div className="stat-change text-muted">
              {viewRole === 'carrier' ? 'DUAA Program Override' : 'Retained Override & Policy Fee'}
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon si-orange">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="7" stroke="#e65100" strokeWidth="1.8" />
              <path d="M10 7v3l2 2" stroke="#e65100" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </div>
          <div className="stat-info">
            <div className="stat-value">{displayBill && !isSettled ? '1' : '0'}</div>
            <div className="stat-label">
              {viewRole === 'carrier' ? 'Net Receivable from MGA' : 'Net Payable to Carrier'}
            </div>
            <div className="stat-change" style={{ color: 'var(--orange, #e65100)' }}>
              {!displayBill
                ? 'No bordereau sent yet'
                : isSettled
                ? '$0.00 outstanding'
                : viewRole === 'carrier'
                ? `$${displayBill.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} awaiting cash wire match`
                : `$${displayBill.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} remittance due to ${displayBill.vendor}`}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="page-tabs" style={{ borderRadius: '8px 8px 0 0', marginBottom: '16px' }}>
        <button
          className={`page-tab ${activeTab === 'bordereau' ? 'active' : ''}`}
          onClick={() => setActiveTab('bordereau')}
        >
          Bordereaux
        </button>
        <button
          className={`page-tab ${activeTab === 'commission' ? 'active' : ''}`}
          onClick={() => setActiveTab('commission')}
        >
          Commissions
        </button>
        <button
          className={`page-tab ${activeTab === 'settlement' ? 'active' : ''}`}
          onClick={() => setActiveTab('settlement')}
        >
          Settlement
        </button>
        <button
          className={`page-tab ${activeTab === 'performance' ? 'active' : ''}`}
          onClick={() => setActiveTab('performance')}
        >
          MGA Performance
        </button>
      </div>

      {/* Bordereaux Tab */}
      {activeTab === 'bordereau' && (
        <div className="form-card" style={{ padding: '20px' }}>
          <div className="table-head-row">
            <div className="table-head-title">
              {viewRole === 'carrier' ? 'Inbound MGA Bordereaux Submissions' : 'Bordereaux Register — Reporting to Carrier'}
            </div>
            <div className="table-head-actions">
              <button className="btn btn-outline btn-sm" onClick={() => showToast('Downloading NTA_August2026_Bordereau.xlsx...', 'info')}>
                Download Template
              </button>
              <button className="btn btn-outline btn-sm" onClick={() => showToast('Exporting Bordereau register to CSV...', 'info')}>
                Export
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="data-table" style={{ minWidth: '960px' }}>
              <thead>
                {viewRole === 'carrier' ? (
                  <tr>
                    <th>Upload ID</th>
                    <th>Reporting MGA</th>
                    <th>File Name</th>
                    <th>Period</th>
                    <th>Policies</th>
                    <th className="text-right">Reported GWP ($)</th>
                    <th className="text-right">MGA Comm ($)</th>
                    <th className="text-right">Net Due to Carrier ($)</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                ) : (
                  <tr>
                    <th>Report ID</th>
                    <th>Carrier Partner</th>
                    <th>File Name</th>
                    <th>Period</th>
                    <th>Policies</th>
                    <th className="text-right">Broker Net ($)</th>
                    <th className="text-right">MGA Override ($)</th>
                    <th className="text-right">Carrier Remittance ($)</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                )}
              </thead>
              <tbody>
                {!displayBill ? (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', color: 'var(--gray-500)', padding: '24px' }}>
                      No bordereau has been sent to the Carrier yet. Inject a Stage 4 BORDEREAU_INGESTED event
                      on the PAS Event Injector (or click "+ Generate &amp; Submit Bordereau" above) to raise one.
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td className="cell-link font-semibold">{displayBill.id}</td>
                    <td><span className="badge badge-navy">{viewRole === 'carrier' ? displayBill.entityName || 'NTA' : displayBill.vendor}</span></td>
                    <td>{(displayBill.entityName || 'NTA').replace(/\s+/g, '')}_{(displayBill.policyNumber || '').replace(/\s+/g, '')}_Bordereau.xlsx</td>
                    <td>{new Date(displayBill.dueDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</td>
                    <td>1</td>
                    <td className="text-right font-semibold">
                      {viewRole === 'carrier'
                        ? `$${(displayBill.amount + 3500).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                        : `$${displayBill.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                    </td>
                    <td className="text-right text-coral">$3,500.00</td>
                    <td className="text-right text-green font-semibold">${displayBill.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td>
                      <span className={`badge ${isSettled ? 'badge-green' : 'badge-orange'}`}>
                        {isSettled ? 'Settled & Paid' : viewRole === 'carrier' ? 'Ingested to Ledger' : 'Sent — Awaiting Remittance'}
                      </span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => setExpandedAuditId(expandedAuditId ? null : displayBill.id)}
                        >
                          {expandedAuditId ? 'Close' : 'Audit'}
                        </button>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => setExpandedSplitId(expandedSplitId ? null : displayBill.id)}
                        >
                          {expandedSplitId ? 'Hide Splits' : 'Financial Splits'}
                        </button>
                        {!isSettled && realCarrierBill && (
                          <button className="btn btn-primary btn-sm" onClick={handleAuthorizeDisbursement}>
                            {viewRole === 'carrier' ? 'Match Wire' : 'Remit on Accounts Payable'}
                          </button>
                        )}
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => showToast(`Downloading ${displayBill.id} bordereau...`, 'info')}
                        >
                          Download XLSX
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Expanded Inline Audit Details Box */}
          {expandedAuditId && (
            <div className="detail-expand-box">
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '20px' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    File Details
                  </div>
                  <div style={{ marginBottom: '4px' }}><strong>File Name:</strong> NTA_August2026_Bordereau.xlsx</div>
                  <div style={{ marginBottom: '4px' }}><strong>Upload ID:</strong> BX-2026-0010</div>
                  <div><strong>Uploaded By:</strong> Diego Alvarez (Operations Manager)</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Volume &amp; Date
                  </div>
                  <div style={{ marginBottom: '4px' }}><strong>Reporting Period:</strong> August 2026</div>
                  <div style={{ marginBottom: '4px' }}><strong>Policies Bound:</strong> 1 policy (POL-V8NHT)</div>
                  <div><strong>Total Premium:</strong> $33,257.00 GWP</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Status Tracker
                  </div>
                  <div style={{ marginBottom: '4px' }}>
                    <strong>System Status:</strong> <span className="badge badge-green">Processed</span>
                  </div>
                  <div style={{ marginBottom: '4px' }}><strong>GL Journal:</strong> Posted (JE-CAR-BIND-V8NHT)</div>
                  <div><strong>Audit Verification:</strong> Verified ✓</div>
                </div>
              </div>
            </div>
          )}

          {/* Expanded Financial Splits Section */}
          {expandedSplitId && (
            <div className="form-card" style={{ padding: '20px', borderTop: '1.5px solid var(--border)', marginTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div className="card-title">Summary Engine - BX-2026-0010 (NTA)</div>
                <button className="btn btn-ghost btn-sm" onClick={() => setExpandedSplitId(null)}>
                  Close Detail
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                    Split Rules Applied
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ padding: '10px 14px', background: 'var(--green-bg, #f0fdf4)', borderRadius: '6px', fontSize: '12.5px', color: 'var(--green, #15803d)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>✓ Net of Commission (10.52%)</span>
                      <span className="font-bold">$29,757.00</span>
                    </div>
                    <div style={{ padding: '10px 14px', background: 'var(--green-bg, #f0fdf4)', borderRadius: '6px', fontSize: '12.5px', color: 'var(--green, #15803d)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>✓ MGA Commission Accrued</span>
                      <span className="font-bold">$3,500.00</span>
                    </div>
                    <div style={{ padding: '10px 14px', background: 'var(--green-bg, #f0fdf4)', borderRadius: '6px', fontSize: '12.5px', color: 'var(--green, #15803d)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>✓ Reinsurance Quota Share (25%)</span>
                      <span className="font-bold">$8,314.25</span>
                    </div>
                    <div style={{ padding: '10px 14px', background: 'var(--green-bg, #f0fdf4)', borderRadius: '6px', fontSize: '12.5px', color: 'var(--green, #15803d)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>✓ Premium Tax (2.35%)</span>
                      <span className="font-bold">$781.54</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                    Split Summary
                  </div>
                  <div style={{ background: 'var(--bg, #f8fafc)', borderRadius: '8px', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                      <span>Gross Bordereaux Premium</span>
                      <span className="font-bold">$33,257.00</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: '#e05470' }}>
                      <span>Less: MGA Commission</span>
                      <span>− $3,500.00</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: '#e05470' }}>
                      <span>Less: Premium Tax (2.35%)</span>
                      <span>− $781.54</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: '#e05470' }}>
                      <span>Less: RI Cession (25%)</span>
                      <span>− $8,314.25</span>
                    </div>
                    <div style={{ borderTop: '1px solid var(--gray-300)', marginTop: '8px', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 700 }}>
                      <span>Net to Veridex / Southlake</span>
                      <span style={{ color: '#2e7d32' }}>$20,661.21</span>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
                Bordereau Policy Details
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Policy No.</th>
                      <th>Effective Date</th>
                      <th>LOB</th>
                      <th className="text-right">Written Prem ($)</th>
                      <th className="text-right">MGA Comm ($)</th>
                      <th className="text-right">RI Cession ($)</th>
                      <th className="text-right">Tax ($)</th>
                      <th className="text-right">Net ($)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="cell-link">POL-V8NHT</td>
                      <td>2026-08-20</td>
                      <td>Commercial Trucking</td>
                      <td className="text-right font-semibold">$33,257.00</td>
                      <td className="text-right text-coral">$3,500.00</td>
                      <td className="text-right text-coral">$8,314.25</td>
                      <td className="text-right text-coral">$781.54</td>
                      <td className="text-right text-green font-semibold">$20,661.21</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Commissions Tab */}
      {activeTab === 'commission' && (
        <div className="form-card" style={{ padding: '20px' }}>
          <div className="card-title mb-16">
            {viewRole === 'carrier'
              ? 'MGA Program Commission Schedules & Accruals — May 2026'
              : 'MGA Program Override Revenue & Intermediary Split Schedules — May 2026'}
          </div>

          <div className="table-responsive">
            <table className="data-table" style={{ minWidth: '900px' }}>
              <thead>
                {viewRole === 'carrier' ? (
                  <tr>
                    <th>Reporting MGA</th>
                    <th>Line of Business</th>
                    <th>Program Agreement</th>
                    <th className="text-right">Override Rate</th>
                    <th className="text-right">Reported GWP ($)</th>
                    <th className="text-right">Commission Expense ($)</th>
                    <th className="text-right">Paid ($)</th>
                    <th className="text-right">Accrued ($)</th>
                    <th>Status</th>
                  </tr>
                ) : (
                  <tr>
                    <th>Carrier Partner</th>
                    <th>Program / LOB</th>
                    <th>Broker / Producer</th>
                    <th className="text-right">Billed Premium ($)</th>
                    <th className="text-right">Broker Comm ($)</th>
                    <th className="text-right">MGA Fee/Override ($)</th>
                    <th className="text-right">Surplus Tax ($)</th>
                    <th className="text-right">Net Remittance ($)</th>
                  </tr>
                )}
              </thead>
              <tbody>
                {!displayBill ? (
                  <tr>
                    <td colSpan={viewRole === 'carrier' ? 9 : 8} style={{ textAlign: 'center', color: 'var(--gray-500)', padding: '24px' }}>
                      No commission activity yet — nothing accrues here until a bordereau has been sent to the Carrier.
                    </td>
                  </tr>
                ) : viewRole === 'carrier' ? (
                  <tr>
                    <td><span className="badge badge-navy">NTA</span></td>
                    <td>Commercial Trucking</td>
                    <td>DUAA Program Override</td>
                    <td className="text-right">10.52%</td>
                    <td className="text-right font-semibold">${(displayBill.amount + ledgerTotals.mgaRevenue).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="text-right text-coral font-semibold">${ledgerTotals.mgaRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="text-right text-green">${isSettled ? ledgerTotals.mgaRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}</td>
                    <td className="text-right text-coral">${isSettled ? '0.00' : ledgerTotals.mgaRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td><span className={`badge ${isSettled ? 'badge-green' : 'badge-orange'}`}>{isSettled ? 'Settled' : 'Accrued'}</span></td>
                  </tr>
                ) : (
                  <tr>
                    <td><span className="badge badge-navy">{displayBill.vendor}</span></td>
                    <td>Commercial Trucking</td>
                    <td>HIT (Broker)</td>
                    <td className="text-right font-semibold">${ledgerTotals.brokerTotalBilled.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="text-right text-coral">${ledgerTotals.brokerCommission.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="text-right text-green font-semibold">${ledgerTotals.mgaRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="text-right">${ledgerTotals.surplusTax.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="text-right font-bold text-navy">${displayBill.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="comm-metrics-grid">
            <div style={{ background: 'var(--bg, #f8fafc)', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', marginBottom: '6px' }}>
                {viewRole === 'carrier' ? 'Total Commission Expense' : 'MGA Revenue Earned'}
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--gray-900)' }}>${ledgerTotals.mgaRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
              <div style={{ fontSize: '11.5px', color: 'var(--gray-500)', marginTop: '4px' }}>
                {viewRole === 'carrier' ? 'MTD MGA Incurred' : 'Program Override & Policy Fee'}
              </div>
            </div>

            <div style={{ background: 'var(--green-bg, #f0fdf4)', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--green, #15803d)', textTransform: 'uppercase', marginBottom: '6px' }}>
                {viewRole === 'carrier' ? 'Paid Out' : 'Broker Commission Retained'}
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--green, #15803d)' }}>
                ${viewRole === 'carrier' ? (isSettled ? ledgerTotals.mgaRevenue : 0).toLocaleString('en-US', { minimumFractionDigits: 2 }) : ledgerTotals.brokerCommission.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--green, #15803d)', marginTop: '4px' }}>
                {viewRole === 'carrier' ? 'Net Settled' : 'Producer Commission (HIT)'}
              </div>
            </div>

            <div style={{ background: '#fff8f0', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--orange, #e65100)', textTransform: 'uppercase', marginBottom: '6px' }}>
                {viewRole === 'carrier' ? 'Accrued Liability' : 'Texas Surplus Tax Escrow'}
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--orange, #e65100)' }}>
                ${viewRole === 'carrier' ? (isSettled ? 0 : ledgerTotals.mgaRevenue).toLocaleString('en-US', { minimumFractionDigits: 2 }) : ledgerTotals.surplusTax.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--orange, #e65100)', marginTop: '4px' }}>
                {viewRole === 'carrier' ? 'Open Bordereau Offset' : 'State Tax Liability Due'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settlement Tab */}
      {activeTab === 'settlement' && (
        <div className="form-card" style={{ padding: '20px' }}>
          <div className="card-title mb-16">
            {viewRole === 'carrier'
              ? 'Carrier Inbound Net Wire Settlement — Pending MGA Remittances'
              : 'Carrier Remittance Settlement Workflow — Outbound Net Premium Wire'}
          </div>

          {!displayBill ? (
            <div style={{ textAlign: 'center', color: 'var(--gray-500)', padding: '40px 20px', border: '1px solid var(--border, #e2e8f0)', borderRadius: '8px' }}>
              No settlement to work yet — send a bordereau to the Carrier first.
            </div>
          ) : (
          <div style={{ border: '1px solid var(--border, #e2e8f0)', borderRadius: '8px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <div className="font-semibold" style={{ fontSize: '14px' }}>
                  {viewRole === 'carrier' ? `${displayBill.entityName || 'NTA'} - Inbound Settlement` : `${displayBill.vendor} - DUAA Remittance`}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{displayBill.id} · Due: {displayBill.dueDate}</div>
              </div>
              <span className={`badge ${isSettled ? 'badge-green' : 'badge-orange'}`}>
                {isSettled
                  ? viewRole === 'carrier' ? 'Settled & Wire Matched' : 'Remitted & Paid'
                  : viewRole === 'carrier' ? 'Awaiting Inbound Wire' : 'Remittance Due'}
              </span>
            </div>

            <div className="settlement-card-grid">
              {viewRole === 'carrier' ? (
                <>
                  <div style={{ fontSize: '12px' }}><div style={{ color: 'var(--gray-500)', marginBottom: '2px' }}>Reported GWP</div><div className="font-bold">${(displayBill.amount + ledgerTotals.mgaRevenue).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div></div>
                  <div style={{ fontSize: '12px' }}><div style={{ color: 'var(--gray-500)', marginBottom: '2px' }}>MGA Commission Offset</div><div className="font-bold text-coral">-${ledgerTotals.mgaRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div></div>
                  <div style={{ fontSize: '12px' }}><div style={{ color: 'var(--gray-500)', marginBottom: '2px' }}>Claims Paid via MGA</div><div className="font-bold">$0.00</div></div>
                  <div style={{ fontSize: '12px' }}><div style={{ color: 'var(--gray-500)', marginBottom: '2px' }}>Net Wire Expected</div><div className="font-bold text-green font-semibold">${displayBill.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div></div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '12px' }}><div style={{ color: 'var(--gray-500)', marginBottom: '2px' }}>Broker Remittance Collected</div><div className="font-bold">${ledgerTotals.mgaCollected.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div></div>
                  <div style={{ fontSize: '12px' }}><div style={{ color: 'var(--gray-500)', marginBottom: '2px' }}>Retained MGA Revenue</div><div className="font-bold text-green">-${ledgerTotals.mgaRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div></div>
                  <div style={{ fontSize: '12px' }}><div style={{ color: 'var(--gray-500)', marginBottom: '2px' }}>Texas Tax Escrow</div><div className="font-bold text-coral">-${ledgerTotals.surplusTax.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div></div>
                  <div style={{ fontSize: '12px' }}><div style={{ color: 'var(--gray-500)', marginBottom: '2px' }}>Carrier Net Remittance</div><div className="font-bold text-navy font-semibold">${displayBill.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div></div>
                </>
              )}
            </div>

            <div className="workflow-steps-wrap">
              <div className="workflow-steps mb-12" style={{ minWidth: '460px' }}>
                <span className="wf-step done">{viewRole === 'carrier' ? 'Bordereau Ingested' : 'Broker Collected'}</span>
                <span className="wf-arrow">›</span>
                <span className="wf-step done">{viewRole === 'carrier' ? 'AR Established' : 'Revenue Retained'}</span>
                <span className="wf-arrow">›</span>
                <span className={`wf-step ${isSettled ? 'done' : 'active'}`}>
                  {viewRole === 'carrier' ? 'Wire Verification' : 'Remittance Authorization'}
                </span>
                <span className="wf-arrow">›</span>
                <span className={`wf-step ${isSettled ? 'active' : ''}`}>
                  {viewRole === 'carrier' ? 'Cash Reconciled' : 'Carrier Wire Paid'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              {isSettled ? (
                <button className="btn btn-ghost btn-sm" disabled>
                  ✓ {viewRole === 'carrier' ? 'Wire Matched & Reconciled' : 'Remitted to Southlake'} (${displayBill.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })})
                </button>
              ) : (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleAuthorizeDisbursement}
                >
                  {viewRole === 'carrier' ? 'Match Wire' : 'Authorize & Disburse Wire'}{displayBill ? ` ($${displayBill.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })})` : ''}
                </button>
              )}
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setExpandedSettlementId(expandedSettlementId ? null : displayBill.id)}
              >
                {expandedSettlementId ? 'Hide Statement' : 'View Statement'}
              </button>
            </div>

            {expandedSettlementId && (
              <div style={{ marginTop: '12px', padding: '12px 14px', background: 'var(--bg, #f8fafc)', borderRadius: '8px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                  <span>Bordereau Reference</span>
                  <span className="font-semibold">{displayBill.id}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                  <span>Carrier Partner</span>
                  <span className="font-semibold">{displayBill.vendor}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                  <span>Remittance GL Account</span>
                  <span className="font-semibold">{displayBill.glAcct || '2200'} - Premium Payable ({displayBill.vendor})</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                  <span>Wire Settlement Amount</span>
                  <span className="font-semibold">${displayBill.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            )}
          </div>
          )}
        </div>
      )}

      {/* MGA Performance Tab */}
      {activeTab === 'performance' && (
        <div className="form-card" style={{ padding: '20px' }}>
          <div className="card-title mb-16">
            {viewRole === 'carrier'
              ? 'MGA Program Performance Surveillance — YTD 2026'
              : 'Carrier & Program Distribution Performance — YTD 2026'}
          </div>

          <div className="table-responsive">
            <table className="data-table" style={{ minWidth: '880px' }}>
              <thead>
                {viewRole === 'carrier' ? (
                  <tr>
                    <th>MGA</th>
                    <th className="text-right">Policies</th>
                    <th className="text-right">Gross Written Prem ($)</th>
                    <th className="text-right">Net Premium ($)</th>
                    <th className="text-right">Claims Ratio</th>
                    <th className="text-right">Commission Ratio</th>
                    <th className="text-right">Combined Ratio</th>
                    <th>Score</th>
                    <th>Trend</th>
                  </tr>
                ) : (
                  <tr>
                    <th>Program / Carrier</th>
                    <th>Primary Broker</th>
                    <th className="text-right">Policies</th>
                    <th className="text-right">Invoiced Premium ($)</th>
                    <th className="text-right">MGA Revenue ($)</th>
                    <th className="text-right">Loss Ratio</th>
                    <th>Remittance Status</th>
                    <th>Program Score</th>
                    <th>Trend</th>
                  </tr>
                )}
              </thead>
              <tbody>
                {!displayBill ? (
                  <tr>
                    <td colSpan={viewRole === 'carrier' ? 9 : 9} style={{ textAlign: 'center', color: 'var(--gray-500)', padding: '24px' }}>
                      No program activity yet — send a bordereau to the Carrier first.
                    </td>
                  </tr>
                ) : viewRole === 'carrier' ? (
                  <tr>
                    <td><span className="badge badge-navy">NTA</span></td>
                    <td className="text-right">1</td>
                    <td className="text-right font-semibold">${(displayBill.amount + ledgerTotals.mgaRevenue).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="text-right">${displayBill.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="text-right">0.0%</td>
                    <td className="text-right">10.52%</td>
                    <td className="text-right text-green font-semibold">10.52%</td>
                    <td><span className="badge badge-green">98 (A+)</span></td>
                    <td><span className="trend-up">↑ 5%</span></td>
                  </tr>
                ) : (
                  <tr>
                    <td><span className="badge badge-navy">{displayBill.vendor} Commercial Trucking</span></td>
                    <td>HIT (Insurance Broker)</td>
                    <td className="text-right">1</td>
                    <td className="text-right font-semibold">${ledgerTotals.brokerTotalBilled.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="text-right text-green font-semibold">${ledgerTotals.mgaRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="text-right">0.0%</td>
                    <td><span className={`badge ${isSettled ? 'badge-green' : 'badge-orange'}`}>{isSettled ? 'Fully Reconciled' : 'Pending'}</span></td>
                    <td><span className="badge badge-green">98 (A+)</span></td>
                    <td><span className="trend-up">↑ 5%</span></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
