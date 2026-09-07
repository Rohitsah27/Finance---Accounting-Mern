import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useFinance } from '../../context/FinanceContext';
import './insurance-flow-simulator.css';

const DEFAULT_PARTIES = [
  { id: 'PRT-CAR-01', name: 'Southlake Insurance Co.', type: 'carrier', code: 'SLIC', status: 'active', entityId: 'ENT-CAR-01' },
  { id: 'PRT-MGA-01', name: 'My Business MGA', type: 'mga', code: 'MYMGA', status: 'active', entityId: 'ENT-MINE' },
  { id: 'PRT-BRK-01', name: 'Links Insurance Agency', type: 'broker', code: 'LINK', status: 'active', entityId: 'ENT-AGY-01' },
  { id: 'PRT-INS-01', name: 'Commercial Insured Corp', type: 'insured', code: 'CIC', status: 'active', entityId: 'ENT-INS-01' },
  { id: 'PRT-INS-02', name: 'Acme Corporation', type: 'insured', code: 'ACME', status: 'active', entityId: 'ENT-INS-02' }
];

export function InsuranceFlowSimulatorPage() {
  const {
    journalEntries = [],
    addJournalEntry,
    activeEntity,
    switchActiveEntity,
    resetAll
  } = useFinance();

  // Load / Persist Simulator State
  const [model, setModel] = useState(() => {
    try {
      const saved = localStorage.getItem('v_insurance_simulation_state');
      if (saved) return JSON.parse(saved).model || 'DBA';
    } catch (e) {}
    return 'DBA';
  });

  const [step, setStep] = useState(() => {
    try {
      const saved = localStorage.getItem('v_insurance_simulation_state');
      if (saved) return JSON.parse(saved).step ?? 0;
    } catch (e) {}
    return 0;
  });

  const [policies, setPolicies] = useState(() => {
    try {
      const saved = localStorage.getItem('v_sim_policies');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const [parties] = useState(() => {
    try {
      const saved = localStorage.getItem('v_sim_parties');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_PARTIES;
  });

  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Sync state to localStorage
  useEffect(() => {
    const totalPremium = policies.reduce((sum, p) => sum + (p.premium || 0), 0) || 50000;
    const brokerComm = Math.round(totalPremium * 0.10);
    const mgaComm = Math.round(totalPremium * 0.05);
    const state = {
      model,
      step,
      carrierId: 'PRT-CAR-01',
      mgaId: 'PRT-MGA-01',
      brokerId: 'PRT-BRK-01',
      policyIds: policies.map(p => p.id),
      totalPremium,
      brokerComm,
      mgaComm,
      netToMGA: totalPremium - brokerComm,
      netToCarrier: totalPremium - brokerComm - mgaComm
    };
    try {
      localStorage.setItem('v_insurance_simulation_state', JSON.stringify(state));
      localStorage.setItem('v_sim_policies', JSON.stringify(policies));
      localStorage.setItem('v_sim_parties', JSON.stringify(parties));
    } catch (e) {}
  }, [model, step, policies, parties]);

  const totalPremium = useMemo(() => {
    return policies.reduce((acc, p) => acc + (p.premium || 0), 0) || 50000;
  }, [policies]);

  const broker = parties.find(p => p.type === 'broker') || parties[2];
  const mga = parties.find(p => p.type === 'mga') || parties[1];
  const carrier = parties.find(p => p.type === 'carrier') || parties[0];

  const brokerComm = Math.round(totalPremium * 0.10);
  const mgaComm = Math.round(totalPremium * 0.05);
  const totalComm = brokerComm + mgaComm;
  const netToMGA = totalPremium - brokerComm;
  const netToCarrier = netToMGA - mgaComm;
  const monthlyAmort = parseFloat((totalPremium / 12).toFixed(2));

  const getMaxSteps = (m) => {
    if (m === 'DBA') return 8;
    if (m === 'DBM') return 5;
    if (m === 'DBC') return 4;
    return 8;
  };

  const maxSteps = getMaxSteps(model);

  const getDoubleEntry = (curModel, curStep) => {
    if (curModel === 'DBA') {
      switch (curStep) {
        case 1:
          return {
            title: `Broker Books: Invoice Insured (${broker.name})`,
            targetEntity: 'ENT-AGY-01',
            roleLabel: 'Agency Principal / Broker',
            desc: `The Broker invoices Insured for $${totalPremium.toLocaleString()} Gross Premium, sets up a $${netToMGA.toLocaleString()} payable to MGA, and recognizes $${brokerComm.toLocaleString()} (10%) commission revenue.`,
            lines: [
              { acct: '1100', name: 'Premium Receivable — Insured', debit: totalPremium, credit: 0, desc: 'Gross Premium Invoiced' },
              { acct: '2200', name: 'Premium Payable — MGA', debit: 0, credit: netToMGA, desc: `Net Premium owed to ${mga.name}` },
              { acct: '6100', name: 'Commission Revenue (Broker 10%)', debit: 0, credit: brokerComm, desc: '10% Retail Commission' }
            ]
          };
        case 2:
          return {
            title: `Broker Books: Cash Receipt from Insured`,
            targetEntity: 'ENT-AGY-01',
            roleLabel: 'Agency Principal / Broker',
            desc: `The Insured pays $${totalPremium.toLocaleString()} in full to the Broker. Broker records cash in trust and clears the receivable.`,
            lines: [
              { acct: '1001', name: 'Cash / Bank (Broker Premium Trust)', debit: totalPremium, credit: 0, desc: 'Cash receipt from Insured' },
              { acct: '1100', name: 'Premium Receivable — Insured', debit: 0, credit: totalPremium, desc: 'Clear Insured Receivable' }
            ]
          };
        case 3:
          return {
            title: `Broker Books: Net Remittance to MGA (${mga.name})`,
            targetEntity: 'ENT-AGY-01',
            roleLabel: 'Agency Principal / Broker',
            desc: `Broker deducts 10% ($${brokerComm.toLocaleString()}) commission and remits $${netToMGA.toLocaleString()} Net Premium to MGA.`,
            lines: [
              { acct: '2200', name: 'Premium Payable — MGA', debit: netToMGA, credit: 0, desc: `Clear Payable to ${mga.name}` },
              { acct: '1001', name: 'Cash / Bank (Broker Premium Trust)', debit: 0, credit: netToMGA, desc: 'Wire transfer Net Premium to MGA' }
            ]
          };
        case 4:
          return {
            title: `MGA Books: Receive Net Premium from Broker (${broker.name})`,
            targetEntity: 'ENT-MINE',
            roleLabel: 'MGA Operations Manager',
            desc: `MGA receives $${netToMGA.toLocaleString()} cash from Broker, sets up $${netToCarrier.toLocaleString()} payable to Carrier, and recognizes $${mgaComm.toLocaleString()} (5%) override revenue.`,
            lines: [
              { acct: '1001', name: 'Cash / Bank (MGA Premium Trust)', debit: netToMGA, credit: 0, desc: 'Net Premium Wire received' },
              { acct: '2200', name: 'Premium Payable — Carrier', debit: 0, credit: netToCarrier, desc: `Net-Net Premium owed to ${carrier.name}` },
              { acct: '6100', name: 'Commission Revenue (MGA 5% Override)', debit: 0, credit: mgaComm, desc: '5% MGA Commission Revenue' }
            ]
          };
        case 5:
          return {
            title: `MGA Books: Net-Net Remittance to Carrier (${carrier.name})`,
            targetEntity: 'ENT-MINE',
            roleLabel: 'MGA Operations Manager',
            desc: `MGA disburses $${netToCarrier.toLocaleString()} Net-Net funds to Carrier, clearing MGA's payable.`,
            lines: [
              { acct: '2200', name: 'Premium Payable — Carrier', debit: netToCarrier, credit: 0, desc: `Clear Payable to ${carrier.name}` },
              { acct: '1001', name: 'Cash / Bank (MGA Premium Trust)', debit: 0, credit: netToCarrier, desc: 'Wire Net-Net funds to Carrier' }
            ]
          };
        case 6:
          return {
            title: `Carrier Books: Ingest Monthly Bordereau from MGA (${mga.name})`,
            targetEntity: 'ENT-CAR-01',
            roleLabel: 'Carrier Controller',
            desc: `Carrier books $${totalPremium.toLocaleString()} Gross Unearned Premium, recognizes $${brokerComm.toLocaleString()} Broker & $${mgaComm.toLocaleString()} MGA acquisition expenses, and sets up $${netToCarrier.toLocaleString()} receivable.`,
            lines: [
              { acct: '1100', name: 'Premium Receivable — MGA', debit: netToCarrier, credit: 0, desc: 'Net-Net Settlement Receivable' },
              { acct: '6100', name: 'Commission Expense — Broker (10%)', debit: brokerComm, credit: 0, desc: 'Retail Broker Acquisition Cost' },
              { acct: '6101', name: 'Commission Expense — MGA Override (5%)', debit: mgaComm, credit: 0, desc: 'MGA Program Administration Cost' },
              { acct: '2100', name: 'Unearned Premium Reserve', debit: 0, credit: totalPremium, desc: 'Gross Written Premium Reserve' }
            ]
          };
        case 7:
          return {
            title: `Carrier Books: Reconcile MGA Cash Settlement Wire ($${netToCarrier.toLocaleString()})`,
            targetEntity: 'ENT-CAR-01',
            roleLabel: 'Carrier Controller',
            desc: `Carrier receives and matches $${netToCarrier.toLocaleString()} wire from MGA, debiting Cash and clearing the MGA Receivable.`,
            lines: [
              { acct: '1001', name: 'Cash / Bank (Operating/Trust)', debit: netToCarrier, credit: 0, desc: 'Net-Net Settlement Wire received' },
              { acct: '1100', name: 'Premium Receivable — MGA', debit: 0, credit: netToCarrier, desc: 'Clear MGA Receivable balance' }
            ]
          };
        case 8:
          return {
            title: `Carrier Books: Monthly Premium Amortization (1/12th)`,
            targetEntity: 'ENT-CAR-01',
            roleLabel: 'Carrier Controller',
            desc: `At month-end, Carrier amortizes 1/12th ($${monthlyAmort.toLocaleString()}) from Unearned Premium Liability into Net Earned Premium Revenue.`,
            lines: [
              { acct: '2100', name: 'Unearned Premium Reserve', debit: monthlyAmort, credit: 0, desc: 'Release 1/12th Unearned Reserve' },
              { acct: '4100', name: 'Net Earned Premium Revenue', debit: 0, credit: monthlyAmort, desc: 'Recognize 1 Month Earned Premium' }
            ]
          };
        default:
          break;
      }
    } else if (curModel === 'DBM') {
      switch (curStep) {
        case 1:
          return {
            title: `MGA Books: Direct Invoice Insured ($${totalPremium.toLocaleString()} Gross)`,
            targetEntity: 'ENT-MINE',
            roleLabel: 'MGA Operations Manager',
            desc: `MGA directly invoices Insured for $${totalPremium.toLocaleString()}, sets up $${netToCarrier.toLocaleString()} payable to Carrier, $${brokerComm.toLocaleString()} commission payable to Broker, and recognizes $${mgaComm.toLocaleString()} override revenue.`,
            lines: [
              { acct: '1100', name: 'Premium Receivable — Insured', debit: totalPremium, credit: 0, desc: 'Direct Invoiced to Insured' },
              { acct: '2200', name: 'Premium Payable — Carrier', debit: 0, credit: netToCarrier, desc: 'Net-Net Settlement owed to Carrier' },
              { acct: '2100', name: 'Commission Payable — Broker', debit: 0, credit: brokerComm, desc: `Commission owed to ${broker.name}` },
              { acct: '6100', name: 'Commission Revenue — MGA Override', debit: 0, credit: mgaComm, desc: '5% MGA Override Revenue' }
            ]
          };
        case 2:
          return {
            title: `MGA Books: Receive Gross Premium Directly from Insured`,
            targetEntity: 'ENT-MINE',
            roleLabel: 'MGA Operations Manager',
            desc: `Insured pays $${totalPremium.toLocaleString()} directly into MGA Premium Trust, clearing Insured Receivable.`,
            lines: [
              { acct: '1001', name: 'Cash / Bank (MGA Premium Trust)', debit: totalPremium, credit: 0, desc: 'Direct payment from Insured' },
              { acct: '1100', name: 'Premium Receivable — Insured', debit: 0, credit: totalPremium, desc: 'Clear Insured Receivable' }
            ]
          };
        case 3:
          return {
            title: `MGA Books: Remit Commission Payout to Broker ($${brokerComm.toLocaleString()})`,
            targetEntity: 'ENT-MINE',
            roleLabel: 'MGA Operations Manager',
            desc: `MGA disburses $${brokerComm.toLocaleString()} (10%) retail commission to Broker (${broker.name}), clearing Commission Payable.`,
            lines: [
              { acct: '2100', name: 'Commission Payable — Broker', debit: brokerComm, credit: 0, desc: `Clear Payable to ${broker.name}` },
              { acct: '1001', name: 'Cash / Bank (MGA Premium Trust)', debit: 0, credit: brokerComm, desc: 'Commission Remittance Wire' }
            ]
          };
        case 4:
          return {
            title: `MGA Books: Remit Net-Net Settlement to Carrier ($${netToCarrier.toLocaleString()})`,
            targetEntity: 'ENT-MINE',
            roleLabel: 'MGA Operations Manager',
            desc: `MGA disburses $${netToCarrier.toLocaleString()} net-net settlement wire to Carrier (${carrier.name}), clearing Carrier Payable.`,
            lines: [
              { acct: '2200', name: 'Premium Payable — Carrier', debit: netToCarrier, credit: 0, desc: 'Clear Carrier Settlement Payable' },
              { acct: '1001', name: 'Cash / Bank (MGA Premium Trust)', debit: 0, credit: netToCarrier, desc: 'Net-Net Wire to Carrier' }
            ]
          };
        case 5:
          return {
            title: `Carrier Books: Ingest Bordereau & Reconcile MGA Wire Settlement`,
            targetEntity: 'ENT-CAR-01',
            roleLabel: 'Carrier Controller',
            desc: `Carrier books $${totalPremium.toLocaleString()} Gross Unearned Premium, $${brokerComm.toLocaleString()} Broker Exp, $${mgaComm.toLocaleString()} MGA Exp, and receives $${netToCarrier.toLocaleString()} cash wire.`,
            lines: [
              { acct: '1001', name: 'Cash / Bank (Carrier Operating)', debit: netToCarrier, credit: 0, desc: 'Net-Net Cash Settlement Wire' },
              { acct: '6100', name: 'Commission Expense — Broker', debit: brokerComm, credit: 0, desc: 'Broker Acquisition Expense' },
              { acct: '6101', name: 'Commission Expense — MGA Override', debit: mgaComm, credit: 0, desc: 'MGA Administration Expense' },
              { acct: '2100', name: 'Unearned Premium Reserve', debit: 0, credit: totalPremium, desc: 'Gross Written Premium Reserve' }
            ]
          };
        default:
          break;
      }
    } else if (curModel === 'DBC') {
      switch (curStep) {
        case 1:
          return {
            title: `Carrier Books: Direct Invoice Insured ($${totalPremium.toLocaleString()} Gross)`,
            targetEntity: 'ENT-CAR-01',
            roleLabel: 'Carrier Controller',
            desc: `Carrier directly invoices Insured for $${totalPremium.toLocaleString()} and establishes the Gross Unearned Premium Reserve.`,
            lines: [
              { acct: '1100', name: 'Premium Receivable — Insured', debit: totalPremium, credit: 0, desc: 'Gross Premium Direct Invoiced' },
              { acct: '2100', name: 'Unearned Premium Reserve', debit: 0, credit: totalPremium, desc: 'Unearned Written Premium Reserve' }
            ]
          };
        case 2:
          return {
            title: `Carrier Books: Receive Gross Cash Payment from Insured`,
            targetEntity: 'ENT-CAR-01',
            roleLabel: 'Carrier Controller',
            desc: `Insured pays $${totalPremium.toLocaleString()} directly to Carrier, debiting Cash and clearing Insured Receivable.`,
            lines: [
              { acct: '1001', name: 'Cash / Bank (Carrier Operating)', debit: totalPremium, credit: 0, desc: 'Direct Premium Receipt' },
              { acct: '1100', name: 'Premium Receivable — Insured', debit: 0, credit: totalPremium, desc: 'Clear Insured Receivable' }
            ]
          };
        case 3:
          return {
            title: `Carrier Books: Disburse Combined Commission Remittance ($${totalComm.toLocaleString()})`,
            targetEntity: 'ENT-CAR-01',
            roleLabel: 'Carrier Controller',
            desc: `Carrier recognizes $${brokerComm.toLocaleString()} Broker & $${mgaComm.toLocaleString()} MGA commission expenses and disburses $${totalComm.toLocaleString()} wire to MGA.`,
            lines: [
              { acct: '6100', name: 'Commission Expense — Broker (10%)', debit: brokerComm, credit: 0, desc: 'Retail Broker Acquisition Expense' },
              { acct: '6101', name: 'Commission Expense — MGA Override (5%)', debit: mgaComm, credit: 0, desc: 'MGA Program Administration Expense' },
              { acct: '1001', name: 'Cash / Bank (Carrier Operating)', debit: 0, credit: totalComm, desc: 'Commission Remittance Wire Payout' }
            ]
          };
        case 4:
          return {
            title: `MGA Books: Receive Commission Wire & Disburse Broker Share`,
            targetEntity: 'ENT-MINE',
            roleLabel: 'MGA Operations Manager',
            desc: `MGA receives $${totalComm.toLocaleString()} from Carrier, retains $${mgaComm.toLocaleString()} override revenue, and remits $${brokerComm.toLocaleString()} to Broker (${broker.name}).`,
            lines: [
              { acct: '1001', name: 'Cash / Bank (MGA Operating)', debit: totalComm, credit: 0, desc: 'Commission Wire received from Carrier' },
              { acct: '6100', name: 'Commission Revenue — MGA Override', debit: 0, credit: mgaComm, desc: '5% MGA Override Revenue' },
              { acct: '2150', name: 'Commission Payable — Broker', debit: 0, credit: brokerComm, desc: 'Retail Commission owed to Broker' }
            ]
          };
        default:
          break;
      }
    }
    return { title: 'No Entry', targetEntity: 'ENT-MINE', roleLabel: '', desc: '', lines: [] };
  };

  const activeDoubleEntry = getDoubleEntry(model, step);

  const STEP_METADATA = {
    DBA: [
      { label: 'Broker Invoice', desc: 'Invoice Insured' },
      { label: 'Insured Pays', desc: 'Collect Cash' },
      { label: 'Broker Remits', desc: 'Remit Net to MGA' },
      { label: 'MGA Receipts', desc: 'Receive from Broker' },
      { label: 'MGA Remits', desc: 'Remit to Carrier' },
      { label: 'Bordereau (BX)', desc: 'Book Gross & Comm' },
      { label: 'Carrier Wire', desc: 'Match Settlement' },
      { label: 'Earn Premium', desc: 'Amortize Monthly' }
    ],
    DBM: [
      { label: 'MGA Invoice', desc: 'Invoice Insured' },
      { label: 'Insured Pays', desc: 'MGA Collects Cash' },
      { label: 'Broker Remit', desc: 'Pay Broker Comm' },
      { label: 'Carrier Remit', desc: 'Pay Carrier Net' },
      { label: 'Carrier Match', desc: 'Ingest & Reconcile' }
    ],
    DBC: [
      { label: 'Carrier Invoice', desc: 'Invoice Insured' },
      { label: 'Insured Pays', desc: 'Carrier Collects Cash' },
      { label: 'Carrier Disburse', desc: 'Wire Commissions' },
      { label: 'MGA Distribute', desc: 'Pass Broker Share' }
    ]
  };

  const currentStepList = STEP_METADATA[model] || STEP_METADATA.DBA;

  const handleSwitchModel = (newModel) => {
    setModel(newModel);
    setStep(policies.length > 0 ? 1 : 0);
    showToast(`Switched to Model: ${newModel}`, 'info');
  };

  const handleResetSimulation = () => {
    if (window.confirm('Reset the active simulation state?')) {
      setStep(0);
      setPolicies([]);
      resetAll && resetAll();
      showToast('Simulation reset successfully.', 'info');
    }
  };

  const handleGeneratePracticePolicies = () => {
    const insureds = parties.filter(p => p.type === 'insured');
    const lobs = ['Property', 'General Liability', 'Commercial Property', 'Inland Marine', 'Liability'];
    const premiums = [12000, 15000, 8000, 9000, 6000]; // Total $50,000

    const newPolicies = premiums.map((prem, i) => {
      const idx = i % insureds.length;
      return {
        id: `POL-SIM-${Date.now()}-${i}`,
        policyNumber: `POL-SIM-2026-${String(i + 1).padStart(5, '0')}`,
        insured: insureds[idx].name,
        brokerId: broker.id,
        brokerName: broker.name,
        mgaId: mga.id,
        mgaName: mga.name,
        carrierId: carrier.id,
        carrierName: carrier.name,
        state: 'TX',
        lob: lobs[i],
        premium: prem,
        effectiveDate: new Date().toISOString().slice(0, 10),
        status: 'bound'
      };
    });

    setPolicies(newPolicies);
    setStep(1);
    showToast(`Bound 5 practice policies ($50,000) under Model ${model}.`, 'success');
  };

  const isContextMatched = () => {
    if (!activeEntity) return true;
    const activeId = activeEntity.id || activeEntity;
    if (model === 'DBA') {
      if (step >= 1 && step <= 3) return activeId === 'ENT-AGY-01';
      if (step === 4 || step === 5) return activeId === 'ENT-MINE' || activeId === 'ENT-MGA-01';
      if (step >= 6 && step <= 8) return activeId === 'ENT-CAR-01';
    } else if (model === 'DBM') {
      if (step >= 1 && step <= 4) return activeId === 'ENT-MINE' || activeId === 'ENT-MGA-01';
      if (step === 5) return activeId === 'ENT-CAR-01';
    } else if (model === 'DBC') {
      if (step >= 1 && step <= 3) return activeId === 'ENT-CAR-01';
      if (step === 4) return activeId === 'ENT-MINE' || activeId === 'ENT-MGA-01';
    }
    return true;
  };

  const handleSwitchRoleClick = () => {
    if (switchActiveEntity && activeDoubleEntry.targetEntity) {
      switchActiveEntity(activeDoubleEntry.targetEntity);
      showToast(`Switched active entity to ${activeDoubleEntry.roleLabel}`, 'info');
    }
  };

  const handleExecuteStep = (bypass = false) => {
    if (!bypass && !isContextMatched()) {
      showToast('Role context mismatch. Please switch role or click "Auto-Execute Step".', 'warning');
      return;
    }

    const doubleEntry = getDoubleEntry(model, step);
    if (!doubleEntry || !doubleEntry.lines || doubleEntry.lines.length === 0) return;

    if (addJournalEntry) {
      addJournalEntry({
        id: `JE-SIM-${model}-${step}-${Date.now().toString().slice(-4)}`,
        date: new Date().toISOString().slice(0, 10),
        reference: `Simulation: ${model} Step ${step}`,
        description: doubleEntry.title,
        entity: doubleEntry.targetEntity,
        entityName: doubleEntry.roleLabel,
        status: 'Posted',
        lines: doubleEntry.lines.map(l => ({
          accountCode: l.acct,
          accountName: l.name,
          debit: l.debit,
          credit: l.credit,
          description: l.desc
        }))
      });
    }

    setStep(prev => prev + 1);
    showToast(`Step ${step} executed: Posted ${doubleEntry.title}`, 'success');
  };

  // Filter simulator journal entries
  const simulatorJEs = useMemo(() => {
    return journalEntries.filter(je => 
      (je.reference && je.reference.includes('Simulation:')) ||
      (je.id && je.id.startsWith('JE-SIM-')) ||
      (je.description && (je.description.includes('Broker Books:') || je.description.includes('MGA Books:') || je.description.includes('Carrier Books:')))
    );
  }, [journalEntries]);

  return (
    <>
      {toast && (
        <div className={`veridex-toast veridex-toast-${toast.type}`}>
          <span>{toast.type === 'error' ? '✕' : toast.type === 'warning' ? '⚠️' : '✓'}</span>
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header">
        <div>
          <div className="page-title">Insurance Accounting Flow Simulator</div>
          <div className="page-subtitle">
            Interactive 3-Model Distribution Simulator: DBA (Agency Bill) · DBM (Direct to MGA) · DBC (Direct to Carrier)
          </div>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline" onClick={handleResetSimulation}>
            ↺ Reset Simulation
          </button>
          <button className="btn btn-primary" onClick={handleGeneratePracticePolicies}>
            ⚡ Setup 5 Policies ($50k)
          </button>
        </div>
      </div>

      {/* Model Selector Bar */}
      <div className="model-selector-bar">
        <button
          className={`model-pill ${model === 'DBA' ? 'active' : ''}`}
          onClick={() => handleSwitchModel('DBA')}
        >
          <span>🏢</span> <strong>Model 1: DBA</strong> (Agency Bill: Insured ➔ Broker ➔ MGA ➔ Carrier)
        </button>
        <button
          className={`model-pill ${model === 'DBM' ? 'active' : ''}`}
          onClick={() => handleSwitchModel('DBM')}
        >
          <span>📑</span> <strong>Model 2: DBM</strong> (Direct to MGA: Insured ➔ MGA ➔ Carrier)
        </button>
        <button
          className={`model-pill ${model === 'DBC' ? 'active' : ''}`}
          onClick={() => handleSwitchModel('DBC')}
        >
          <span>🏛️</span> <strong>Model 3: DBC</strong> (Direct to Carrier: Insured ➔ Carrier)
        </button>
      </div>

      {/* 4-Tier Value Chain Header Banner */}
      <div className="chain-banner">
        {model === 'DBA' && (
          <>
            <div className="chain-node">
              <div className="chain-node-title">1. Policyholder</div>
              <div className="chain-node-name">Insured</div>
              <div className="chain-node-take">Pays ${totalPremium.toLocaleString()} Gross</div>
            </div>
            <div className="chain-arrow">➔</div>
            <div className="chain-node">
              <div className="chain-node-title">2. Retail Producer</div>
              <div className="chain-node-name">{broker.name}</div>
              <div className="chain-node-take">Retains ${brokerComm.toLocaleString()} (10%)</div>
            </div>
            <div className="chain-arrow">➔</div>
            <div className="chain-node">
              <div className="chain-node-title">3. Program Manager</div>
              <div className="chain-node-name">{mga.name}</div>
              <div className="chain-node-take">Retains ${mgaComm.toLocaleString()} (5%)</div>
            </div>
            <div className="chain-arrow">➔</div>
            <div className="chain-node">
              <div className="chain-node-title">4. Risk Bearer</div>
              <div className="chain-node-name">{carrier.name}</div>
              <div className="chain-node-take">Settles ${netToCarrier.toLocaleString()} Net</div>
            </div>
          </>
        )}

        {model === 'DBM' && (
          <>
            <div className="chain-node">
              <div className="chain-node-title">1. Policyholder</div>
              <div className="chain-node-name">Insured</div>
              <div className="chain-node-take">Pays ${totalPremium.toLocaleString()} Gross</div>
            </div>
            <div className="chain-arrow">➔</div>
            <div className="chain-node">
              <div className="chain-node-title">2. Program Manager (MGA)</div>
              <div className="chain-node-name">{mga.name}</div>
              <div className="chain-node-take">Collects ${totalPremium.toLocaleString()} / Retains ${mgaComm.toLocaleString()}</div>
            </div>
            <div className="chain-arrow">➔</div>
            <div className="chain-node">
              <div className="chain-node-title">3. Risk Carrier &amp; Broker</div>
              <div className="chain-node-name">{carrier.name} + {broker.name}</div>
              <div className="chain-node-take">Carrier ${netToCarrier.toLocaleString()} / Broker ${brokerComm.toLocaleString()}</div>
            </div>
          </>
        )}

        {model === 'DBC' && (
          <>
            <div className="chain-node">
              <div className="chain-node-title">1. Policyholder</div>
              <div className="chain-node-name">Insured</div>
              <div className="chain-node-take">Pays ${totalPremium.toLocaleString()} Gross</div>
            </div>
            <div className="chain-arrow">➔</div>
            <div className="chain-node">
              <div className="chain-node-title">2. Risk Carrier</div>
              <div className="chain-node-name">{carrier.name}</div>
              <div className="chain-node-take">Collects ${totalPremium.toLocaleString()} / Disburses ${totalComm.toLocaleString()}</div>
            </div>
            <div className="chain-arrow">➔</div>
            <div className="chain-node">
              <div className="chain-node-title">3. MGA &amp; Broker</div>
              <div className="chain-node-name">{mga.name} &amp; {broker.name}</div>
              <div className="chain-node-take">MGA ${mgaComm.toLocaleString()} / Broker ${brokerComm.toLocaleString()}</div>
            </div>
          </>
        )}
      </div>

      {/* Dynamic Stepper Steps */}
      <div className="sim-stepper">
        {currentStepList.map((s, idx) => {
          const stepNum = idx + 1;
          let cls = 'sim-step';
          if (stepNum < step) cls = 'sim-step completed';
          else if (stepNum === step) cls = 'sim-step active';

          return (
            <div
              key={idx}
              className={cls}
              onClick={() => {
                if (stepNum <= maxSteps + 1) setStep(stepNum);
              }}
            >
              <div className="sim-step-icon">
                {stepNum < step ? '✓' : stepNum}
              </div>
              <div className="sim-step-label">{s.label}</div>
              <div className="sim-step-desc">{s.desc}</div>
            </div>
          );
        })}
      </div>

      <div className="sim-grid">
        {/* Left Column: Active Step Details & Actions */}
        <div>
          {/* Step 0: Welcome / Setup needed */}
          {step === 0 && (
            <div className="card">
              <div className="card-title">Welcome to the Insurance Accounting Simulator</div>
              <p style={{ fontSize: '13px', color: 'var(--color-muted, #64748b)', margin: '12px 0 20px', lineHeight: 1.5 }}>
                This simulator executes the complete double-entry accounting lifecycle across all parties in the insurance supply chain under <strong>DBA</strong>, <strong>DBM</strong>, and <strong>DBC</strong> billing models.
              </p>
              <div style={{ background: 'var(--color-bg, #f8fafc)', border: '1.5px dashed var(--color-border, #cbd5e1)', borderRadius: '8px', padding: '24px', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📋</div>
                <div style={{ fontWeight: 700, color: 'var(--color-ink, #0f172a)', marginBottom: '4px' }}>No Policies Bound Yet</div>
                <div style={{ fontSize: '12px', color: 'var(--color-muted, #64748b)', marginBottom: '16px' }}>
                  Click below to auto-bind 5 practice policies ($50,000 total) and begin the interactive flow.
                </div>
                <button className="btn btn-primary" onClick={handleGeneratePracticePolicies}>
                  Setup 5 Practice Policies ($50k)
                </button>
              </div>
            </div>
          )}

          {/* Active Step Actions */}
          {step >= 1 && step <= maxSteps && (
            <div className="card">
              <div className="card-title">
                Step {step}: {activeDoubleEntry.title}
              </div>
              <p style={{ fontSize: '13px', color: 'var(--color-muted, #64748b)', margin: '8px 0 16px', lineHeight: 1.4 }}>
                {activeDoubleEntry.desc}
              </p>

              {/* Context Warning */}
              {!isContextMatched() && (
                <div className="role-warning">
                  <span>⚠️</span>
                  <div style={{ flexGrow: 1 }}>
                    <strong>Context Switch Recommended:</strong> Step executes on the books of{' '}
                    <span>{activeDoubleEntry.roleLabel}</span>.
                  </div>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={handleSwitchRoleClick}
                    style={{ background: '#fff' }}
                  >
                    Switch Now
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignSelf: 'center', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-muted, #64748b)', textTransform: 'uppercase' }}>
                  Simulation Control
                </div>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => handleExecuteStep(true)}
                >
                  ⚡ Auto-Execute Step
                </button>
              </div>

              {/* Ledger Preview */}
              <div className="ledger-card">
                <div className="ledger-title">{activeDoubleEntry.title}</div>
                <div className="ledger-row header">
                  <span>Account (Code &amp; Name)</span>
                  <span style={{ textAlign: 'right' }}>Debit ($)</span>
                  <span style={{ textAlign: 'right' }}>Credit ($)</span>
                </div>
                {activeDoubleEntry.lines.map((l, lIdx) => (
                  <div key={lIdx} className="ledger-row">
                    <span className={l.credit > 0 ? 'dr-indent' : ''}>
                      <strong style={{ color: '#26a69a' }}>{l.acct}</strong> {l.name}
                      <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                        {l.desc}
                      </div>
                    </span>
                    <span className="dr-val">
                      {l.debit > 0 ? `$${l.debit.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : ''}
                    </span>
                    <span className="cr-val">
                      {l.credit > 0 ? `$${l.credit.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : ''}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
                <button
                  className="btn btn-primary"
                  onClick={() => handleExecuteStep(false)}
                >
                  Post &amp; Execute Step →
                </button>
              </div>
            </div>
          )}

          {/* Finished State */}
          {step > maxSteps && (
            <div className="card">
              <div style={{ textAlign: 'center', padding: '28px 16px' }}>
                <div style={{ fontSize: '44px', marginBottom: '12px' }}>🎉</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#0d1b4b', marginBottom: '8px' }}>
                  Complete {model} Flow Simulated!
                </div>
                <p style={{ fontSize: '13px', color: 'var(--color-muted, #64748b)', maxWidth: '520px', margin: '0 auto 20px', lineHeight: 1.5 }}>
                  All double-entry postings for Model {model} across Broker, MGA, and Carrier ledgers have balanced cleanly.
                </p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button className="btn btn-primary" onClick={handleResetSimulation}>
                    Restart Simulation
                  </button>
                  <Link to="/gl/balance-sheet" className="btn btn-outline">
                    Check Balance Sheets
                  </Link>
                  <Link to="/gl/trial-balance" className="btn btn-outline">
                    Check Trial Balance
                  </Link>
                  <Link to="/gl/journal-entry" className="btn btn-outline">
                    View Journal Entries
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Parties and Policies management */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Party Manager */}
          <div className="card">
            <div className="card-title">Distribution Parties</div>
            <div style={{ marginTop: '10px' }}>
              <table className="mini-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Code</th>
                  </tr>
                </thead>
                <tbody>
                  {parties.map(p => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600, color: '#0d1b4b' }}>{p.name}</td>
                      <td>
                        <span className={`badge ${
                          p.type === 'carrier' ? 'badge-blue' :
                          p.type === 'mga' ? 'badge-orange' :
                          p.type === 'broker' ? 'badge-teal' : 'badge-gray'
                        }`}>
                          {p.type.toUpperCase()}
                        </span>
                      </td>
                      <td><code>{p.code}</code></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Policy Creator */}
          <div className="card">
            <div className="card-title">Simulation Policies</div>
            <div style={{ marginTop: '10px', maxHeight: '220px', overflowY: 'auto', border: '1px solid var(--color-border, #e2e8f0)', borderRadius: '6px' }}>
              <table className="mini-table">
                <thead>
                  <tr>
                    <th>Policy No.</th>
                    <th>Insured</th>
                    <th style={{ textAlign: 'right' }}>Premium ($)</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {policies.length > 0 ? (
                    policies.map(p => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 600, color: '#0d1b4b' }}>{p.policyNumber}</td>
                        <td>{p.insured}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>${p.premium.toLocaleString()}</td>
                        <td><span className="badge badge-green">{p.status}</span></td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', color: 'var(--color-muted, #94a3b8)', padding: '16px' }}>
                        No simulation policies bound yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Real GL Entry Logs */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <div className="card-title">General Ledger Postings Log</div>
            <div style={{ fontSize: '11.5px', color: 'var(--color-muted, #64748b)', marginTop: '2px' }}>
              Showing {simulatorJEs.length} simulation JEs recorded in memory
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link to="/gl/journal-entry" className="btn btn-outline btn-sm">
              View Full Journal
            </Link>
          </div>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>JE Number</th>
                <th>Date</th>
                <th>Description</th>
                <th>Account</th>
                <th style={{ textAlign: 'right' }}>Debit ($)</th>
                <th style={{ textAlign: 'right' }}>Credit ($)</th>
              </tr>
            </thead>
            <tbody>
              {simulatorJEs.length > 0 ? (
                simulatorJEs.map(je => (
                  <React.Fragment key={je.id}>
                    {(je.lines || []).map((l, idx) => (
                      <tr key={`${je.id}-${idx}`}>
                        {idx === 0 && (
                          <td rowSpan={je.lines.length} className="font-semibold cell-link" style={{ verticalAlign: 'top', borderRight: '1px solid var(--color-border, #e2e8f0)' }}>
                            {je.id}
                          </td>
                        )}
                        {idx === 0 && (
                          <td rowSpan={je.lines.length} style={{ verticalAlign: 'top', borderRight: '1px solid var(--color-border, #e2e8f0)' }}>
                            {new Date(je.date || je.createdAt).toLocaleDateString()}
                          </td>
                        )}
                        {idx === 0 && (
                          <td rowSpan={je.lines.length} style={{ verticalAlign: 'top', borderRight: '1px solid var(--color-border, #e2e8f0)' }}>
                            {je.description}
                          </td>
                        )}
                        <td>
                          <strong style={{ color: '#0d1b4b' }}>{l.accountCode || l.acct}</strong> - {l.description || l.accountName || 'Ledger line'}
                        </td>
                        <td style={{ textAlign: 'right', color: '#2e7d32', fontWeight: 600 }}>
                          {l.debit > 0 ? `$${parseFloat(l.debit).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : ''}
                        </td>
                        <td style={{ textAlign: 'right', color: '#e65100', fontWeight: 600 }}>
                          {l.credit > 0 ? `$${parseFloat(l.credit).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : ''}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: 'var(--color-muted, #94a3b8)', padding: '24px' }}>
                    No Journal Entries posted in this simulation session yet. Click "Post &amp; Execute Step" above to post.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
export default InsuranceFlowSimulatorPage;
