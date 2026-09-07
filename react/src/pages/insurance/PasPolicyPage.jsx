import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';
import { highlightJson } from '../../utils/jsonHighlight';
import './pas-policy.css';

// Preset-driven financial defaults, keyed the same as the LOAD EVENT PRESET
// dropdown's option values. Shared by the dropdown's onChange handler and by
// the initial-state derivation below (so a deep link like
// /pas-policy?preset=bordereau_ingested arrives pre-configured without a
// setState-in-effect to sync it after the fact).
const PRESET_DEFAULTS = {
  policy_bound: { evtType: 'POLICY_BINDING_INVOICED', premium: '33257', taxAndFees: '3503', commission: '2500', paymentAmount: '0' },
  payment_received: { evtType: 'PAYMENT_RECEIVED', premium: '33257', taxAndFees: '3503', commission: '2500', paymentAmount: '39260' },
  broker_settlement: { evtType: 'BROKER_SETTLEMENT_COMPLETED', premium: '33257', taxAndFees: '3503', commission: '2500', paymentAmount: '36760' },
  bordereau_ingested: { evtType: 'BORDEREAU_INGESTED', premium: '33257', taxAndFees: '0', commission: '3500', paymentAmount: '0' },
  carrier_payment_completed: { evtType: 'CARRIER_PAYMENT_COMPLETED', premium: '33257', taxAndFees: '0', commission: '3500', paymentAmount: '29757' },
  premium_adjusted: { evtType: 'PREMIUM_ADJUSTED', premium: '1500', taxAndFees: '200', commission: '120', paymentAmount: '0' },
  policy_cancelled: { evtType: 'POLICY_CANCELLED', premium: '-16128', taxAndFees: '-3501', commission: '-1250', paymentAmount: '0' }
};

// Known parties for the injector form's Broker/Carrier/MGA fields, so users
// pick from the same demo entities used across the DBA books (Commission
// Engine, Flow Simulator) instead of free-typing a name that won't match.
const BROKER_OPTIONS = ['HIT', 'Coastal Risk Advisors', 'Pinecrest Insurance Services', 'Links Insurance Agency'];
const CARRIER_OPTIONS = ['SOUTHLAKE', 'Southlake Insurance Co.', 'Granite Peak Insurance Co.'];
const MGA_OPTIONS = ['NTA', 'NTA Program Administrators', 'Meridian Program Managers'];

// Which party dropdown(s) are relevant to each stage, matching who
// generateRulesEngineGroups actually posts JE lines for below — e.g. Stage 2
// only touches the Broker's book (Ayushi pays Broker), Stage 3 only settles
// the Broker -> MGA leg, so there's no reason to show a Carrier picker there.
// Stage 1/PREMIUM_ADJUSTED establish the whole chain up front, so all three
// stay visible.
const PRESET_VISIBLE_PARTIES = {
  policy_bound: ['broker', 'mga', 'carrier'],
  payment_received: ['broker'],
  broker_settlement: ['mga'],
  bordereau_ingested: ['carrier'],
  carrier_payment_completed: ['carrier'],
  premium_adjusted: ['broker', 'mga', 'carrier'],
  policy_cancelled: ['broker']
};

// Which LOAD EVENT PRESET stages apply to each logged-in role — mirrors
// which entity's book generateRulesEngineGroups actually posts to (or
// raises an AP bill against) for that event type. A Broker user never
// touches the Carrier's Bordereau Ingestion, so there's no reason for that
// stage to appear in their picker, and vice versa. Roles without an entry
// here (owner, insured, reinsurance-analyst, etc.) see every stage.
const ROLE_VISIBLE_PRESETS = {
  broker: ['policy_bound', 'payment_received', 'broker_settlement', 'premium_adjusted', 'policy_cancelled'],
  mga: ['policy_bound', 'broker_settlement', 'bordereau_ingested', 'carrier_payment_completed', 'premium_adjusted'],
  carrier: ['bordereau_ingested', 'carrier_payment_completed']
};

// Backs the LOAD EVENT PRESET <select> — order here is the display order.
// ROLE_VISIBLE_PRESETS filters this list per logged-in role; ALL_PRESET_KEYS
// (its key order) is also the fallback for roles with no entry there, and
// picks a replacement when the active role's list drops the current preset.
const PRESET_OPTIONS = [
  { value: 'policy_bound', label: 'Stage 1: POLICY_BINDING_INVOICED (POL-V8NHT · $39,260)' },
  { value: 'payment_received', label: 'Stage 2: PAYMENT_RECEIVED (Ayushi pays Broker · $39,260)' },
  { value: 'broker_settlement', label: 'Stage 3: BROKER_SETTLEMENT_COMPLETED (Broker pays MGA · $36,760)' },
  { value: 'bordereau_ingested', label: 'Stage 4: BORDEREAU_INGESTED (Carrier Ingestion · $33,257 GWP)' },
  { value: 'carrier_payment_completed', label: 'Stage 5: CARRIER_PAYMENT_COMPLETED (MGA pays Carrier · $29,757)' },
  { value: 'premium_adjusted', label: 'Preset: PREMIUM_ADJUSTED (Endorsement Increase)' },
  { value: 'policy_cancelled', label: 'Preset: POLICY_CANCELLED (Pro-Rata Reversal)' }
];
const ALL_PRESET_KEYS = PRESET_OPTIONS.map((opt) => opt.value);

const INITIAL_EVENTS = [
  {
    event_id: 'EVT-108492',
    event_type: 'POLICY_BINDING_INVOICED',
    transaction_id: 'TXN-904128',
    invoice_number: 'INV-V8NHT-1',
    policy: {
      policy_id: 'POL-V8NHT',
      policy_number: 'POL-V8NHT',
      lob: 'Commercial Trucking',
      state: 'TX'
    },
    parties: {
      insured_name: 'Ayushi',
      insured_id: 'INS-AYUSHI',
      carrier_name: 'SOUTHLAKE',
      carrier_id: 'CAR-SOUTHLAKE',
      mga_name: 'NTA',
      mga_id: 'MGA-NTA',
      producer: 'HIT'
    },
    financials: {
      premium: 33257,
      tax_and_fees: 3503,
      total_premium: 39260,
      broker_commission: 2500,
      payment_amount: 0,
      currency: 'USD'
    },
    dates: {
      effective_date: '2026-08-20',
      transaction_date: '2026-08-20'
    },
    source_system: 'PAS',
    status: 'POSTED',
    timestamp: '2026-08-20T11:42:15.000Z',
    errors: [],
    jeNumber: 'JE-2026-089',
    jeLines: [
      { acct: '1100', desc: 'Premium Receivable — Ayushi (INV-V8NHT-1)', debit: 39260, credit: 0 },
      { acct: '2200', desc: 'Net Premium Payable — NTA', debit: 0, credit: 36760 },
      { acct: '5100', desc: 'Producer / Broker Commission Revenue', debit: 0, credit: 2500 }
    ]
  }
];

const INITIAL_POLICIES = [
  {
    number: 'POL-V8NHT',
    name: 'Ayushi',
    date: '2026-08-20',
    premium: 39260,
    commissionPct: 8,
    status: 'BOUND',
    brokerName: 'HIT',
    mgaName: 'NTA',
    carrierName: 'SOUTHLAKE'
  },
  {
    number: 'POL-40291',
    name: 'Apex Freight Solutions',
    date: '2026-08-25',
    premium: 14850,
    commissionPct: 10,
    status: 'BOUND',
    brokerName: 'HIT',
    mgaName: 'NTA',
    carrierName: 'SOUTHLAKE'
  }
];

function generateUUID(prefix = 'EVT') {
  return prefix + '-' + Math.floor(100000 + Math.random() * 900000);
}

export function PasPolicyPage() {
  const { postJournalEntry, addJournalEntry, addApInvoice, addArInvoice, markArInvoicePaid, markApInvoicePaid, accounts } = useFinance();
  const { currentUser } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('injector');
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [policies, setPolicies] = useState(INITIAL_POLICIES);
  const [selectedEventModal, setSelectedEventModal] = useState(null);
  const [toast, setToast] = useState(null);

  // Injector Form Fields — the initial preset is read once from ?preset=
  // (e.g. MGA Operations' "+ Generate & Submit Bordereau" deep-links here
  // with ?preset=bordereau_ingested) so a deep link arrives pre-configured
  // without needing an effect to sync it in after the fact.
  const initialPresetKey = new URLSearchParams(location.search).get('preset') || 'policy_bound';
  const initialPresetValues = PRESET_DEFAULTS[initialPresetKey] || PRESET_DEFAULTS.policy_bound;
  const [preset, setPreset] = useState(initialPresetKey);
  const visibleParties = PRESET_VISIBLE_PARTIES[preset] || ['broker', 'mga', 'carrier'];
  const visiblePresets = ROLE_VISIBLE_PRESETS[currentUser?.role] || ALL_PRESET_KEYS;
  const [evtId, setEvtId] = useState(generateUUID('EVT'));
  const [txnId, setTxnId] = useState(generateUUID('TXN'));
  const [evtType, setEvtType] = useState(initialPresetValues.evtType);
  const [polNum, setPolNum] = useState('POL-V8NHT');
  const [invNum, setInvNum] = useState('INV-V8NHT-1');
  const [lob, setLob] = useState('Commercial Trucking');
  const [stateCode, setStateCode] = useState('TX');
  const [insuredName, setInsuredName] = useState('Ayushi');
  const [brokerName, setBrokerName] = useState('HIT');
  const [carrierName, setCarrierName] = useState('SOUTHLAKE');
  const [mgaName, setMgaName] = useState('NTA');
  const [premium, setPremium] = useState(initialPresetValues.premium);
  const [taxAndFees, setTaxAndFees] = useState(initialPresetValues.taxAndFees);
  const [commission, setCommission] = useState(initialPresetValues.commission);
  const [paymentAmount, setPaymentAmount] = useState(initialPresetValues.paymentAmount);
  const [dateTx, setDateTx] = useState('2026-08-20');
  const [dateEff, setDateEff] = useState('2026-08-20');

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Preset Selection Handler
  const handleApplyPreset = (val) => {
    setPreset(val);
    const todayStr = '2026-08-20';
    setEvtId(generateUUID('EVT'));
    setTxnId(generateUUID('TXN'));
    setDateTx(todayStr);
    setDateEff(todayStr);
    setMgaName('NTA');
    setCarrierName('SOUTHLAKE');
    setInsuredName('Ayushi');
    setBrokerName('HIT');
    setLob('Commercial Trucking');
    setStateCode('TX');
    setPolNum('POL-V8NHT');
    setInvNum('INV-V8NHT-1');

    const defaults = PRESET_DEFAULTS[val] || PRESET_DEFAULTS.policy_bound;
    setEvtType(defaults.evtType);
    setPremium(defaults.premium);
    setTaxAndFees(defaults.taxAndFees);
    setCommission(defaults.commission);
    setPaymentAmount(defaults.paymentAmount);
  };

  // If the active role's picker no longer includes the currently-loaded
  // stage — e.g. switching from Broker to Carrier while Stage 2 is loaded —
  // jump to that role's first relevant stage instead of leaving an event
  // type selected that this role never touches.
  useEffect(() => {
    if (!visiblePresets.includes(preset)) {
      handleApplyPreset(visiblePresets[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.role]);

  // Live computed payload object
  const currentPayload = useMemo(() => {
    const prem = parseFloat(premium) || 0;
    const tax = parseFloat(taxAndFees) || 0;
    const comm = parseFloat(commission) || 0;
    const pay = parseFloat(paymentAmount) || 0;
    const total = prem + tax + comm;

    return {
      event_id: evtId,
      event_type: evtType,
      transaction_id: txnId,
      invoice_number: invNum,
      policy: {
        policy_id: polNum,
        policy_number: polNum,
        lob: lob,
        state: stateCode
      },
      parties: {
        insured_name: insuredName,
        insured_id: 'INS-' + (insuredName || '').toUpperCase(),
        carrier_name: carrierName,
        carrier_id: 'CAR-' + (carrierName || '').toUpperCase(),
        mga_name: mgaName,
        mga_id: 'MGA-' + (mgaName || '').toUpperCase(),
        producer: brokerName
      },
      financials: {
        premium: prem,
        tax_and_fees: tax,
        total_premium: total,
        broker_commission: comm,
        payment_amount: pay,
        currency: 'USD'
      },
      dates: {
        effective_date: dateEff,
        transaction_date: dateTx
      },
      source_system: 'PAS'
    };
  }, [
    evtId,
    evtType,
    txnId,
    invNum,
    polNum,
    lob,
    stateCode,
    insuredName,
    carrierName,
    mgaName,
    brokerName,
    premium,
    taxAndFees,
    commission,
    paymentAmount,
    dateEff,
    dateTx
  ]);

  // Section 10 Validations
  const validateEvent = (evt) => {
    const errors = [];
    if (!evt.event_id) errors.push('Event ID is missing');
    if (!evt.transaction_id) errors.push('Transaction ID is missing');
    if (!evt.policy || !evt.policy.policy_number) errors.push('Policy Number is missing');

    const isDup = events.some(
      e => e.status === 'POSTED' && (e.event_id === evt.event_id || e.transaction_id === evt.transaction_id)
    );
    if (isDup) errors.push('Duplicate check failed: Event/Transaction ID already exists in Posted GL');

    if (evt.event_type !== 'POLICY_CANCELLED' && evt.event_type !== 'PREMIUM_REFUNDED') {
      if (evt.financials.premium < 0) errors.push('Premium amount must be positive');
      if (evt.financials.tax_and_fees < 0) errors.push('Tax & Fees must be positive');
      if (evt.financials.broker_commission < 0) errors.push('Commission must be positive');
    } else {
      if (evt.financials.premium > 0) errors.push('Refund Premium must be negative or zero');
    }

    if (!evt.dates.transaction_date || isNaN(Date.parse(evt.dates.transaction_date))) {
      errors.push('Transaction Date is invalid');
    }

    if (!evt.parties.insured_name) errors.push('Insured party name is missing');
    if (!evt.parties.carrier_name) errors.push('Carrier party name is missing');
    if (!evt.parties.mga_name) errors.push('MGA party name is missing');

    return errors;
  };

  // Canonical entity identities for the three DBA books — matches
  // finance-and-accounting-main/README.md Section 4.1. Declared once here so
  // both the rules engine (single Event Injector) and Quick Simulate use the
  // exact same entity ids/names when splitting a stage across books.
  const DBA_ENTITIES = {
    BROKER: { id: 'ENT-AGY-01', name: 'HIT Retail Producers Inc.' },
    MGA: { id: 'ENT-MGA-01', name: 'NTA Program Administrators' },
    CARRIER: { id: 'ENT-CAR-01', name: 'Southlake Insurance Co.' }
  };

  // Process rules engine and generate journal entry line GROUPS — one group
  // per entity book that must record this event. Several stages in the DBA
  // lifecycle matrix post to two books at once (e.g. Stage 1 Policy Binding
  // hits both the Broker's and the MGA's ledgers), so this returns an array
  // of { entity, lines } rather than a single flat line list.
  //
  // Account codes below match the live Chart of Accounts seeded into MongoDB
  // (server/data/seedData.js SEED_ACCOUNTS) — 1100 Premium Receivable,
  // 2200 Net Premium Payable, 2300 Surplus Lines Taxes & Regulatory Fees,
  // 4001 Gross Written Premium (GWP), 4100 MGA Program Override & Policy Fee
  // Revenue, 4200 Producer / Broker Commission Revenue, 5100 Acquisition
  // Costs & Broker Commissions, 1001 Cash / Bank.
  const generateRulesEngineGroups = (evt) => {
    // Nullish coalescing (not ||) throughout — several presets legitimately
    // zero out a field (e.g. Stage 4's tax_and_fees), and `0 || fallback`
    // would wrongly discard that real zero in favor of the fallback.
    const totalBilled = evt.financials.total_premium ?? 39260;
    const commission = evt.financials.broker_commission ?? 2500;
    const netToMGA = totalBilled - commission;
    const paid = evt.financials.payment_amount ?? 0;
    // MGA's own override/policy-fee revenue is not a field on the event
    // form — mirrors the fixed demo split already used by Quick Simulate.
    const mgaOverride = evt.financials.mga_commission ?? 3500;
    const taxAndFees = evt.financials.tax_and_fees ?? 3503;
    const netToCarrier = netToMGA - mgaOverride - taxAndFees;

    const broker = { id: DBA_ENTITIES.BROKER.id, name: evt.parties.producer || DBA_ENTITIES.BROKER.name };
    const mga = { id: DBA_ENTITIES.MGA.id, name: evt.parties.mga_name || DBA_ENTITIES.MGA.name };
    const carrier = { id: DBA_ENTITIES.CARRIER.id, name: evt.parties.carrier_name || DBA_ENTITIES.CARRIER.name };

    let groups = [];
    let apBill = null;
    let arInvoices = [];
    if (evt.event_type === 'POLICY_BINDING_INVOICED' || evt.event_type === 'PREMIUM_ADJUSTED') {
      // Stage 1 — Broker invoices the insured; MGA simultaneously invoices the Broker.
      groups = [
        {
          entity: broker,
          lines: [
            { acct: '1100', desc: `Premium Receivable — ${evt.parties.insured_name} (${evt.invoice_number || evt.policy.policy_number})`, debit: Math.abs(totalBilled), credit: 0 },
            { acct: '2200', desc: `Net Premium Payable — ${evt.parties.mga_name}`, debit: 0, credit: Math.abs(netToMGA) },
            { acct: '4200', desc: `Producer / Broker Commission Revenue`, debit: 0, credit: Math.abs(commission) }
          ]
        },
        {
          entity: mga,
          lines: [
            { acct: '1100', desc: `Premium Receivable — ${evt.parties.producer}`, debit: Math.abs(netToMGA), credit: 0 },
            { acct: '2200', desc: `Net Premium Payable — ${evt.parties.carrier_name}`, debit: 0, credit: Math.abs(netToCarrier) },
            { acct: '2300', desc: `Surplus Lines Taxes & Regulatory Fees`, debit: 0, credit: Math.abs(taxAndFees) },
            { acct: '4100', desc: `MGA Program Override & Policy Fee Revenue`, debit: 0, credit: Math.abs(mgaOverride) }
          ]
        }
      ];
      // Also raise real Accounts Receivable invoices for BOTH 1100 Premium
      // Receivable lines above — the Broker's from the insured, AND the
      // MGA's from the Broker (the same relationship as the AP bill Stage 2
      // raises later, just the receivable side of it, recognized at binding
      // rather than waiting for cash). Reuses the invoice number as the
      // Broker's id so re-running the default demo preset updates that row
      // instead of stacking duplicates.
      arInvoices = [
        {
          id: evt.invoice_number || `INV-AR-${evt.policy.policy_number}`,
          customer: evt.parties.insured_name,
          policyNumber: evt.policy.policy_number,
          amount: Math.abs(totalBilled),
          dueDate: (() => {
            const base = evt.dates?.transaction_date ? new Date(evt.dates.transaction_date) : new Date();
            base.setDate(base.getDate() + 30);
            return base.toISOString().slice(0, 10);
          })(),
          status: 'Open',
          category: 'Policy Premium — Direct Bill',
          entity: broker.id,
          entityName: broker.name,
          partnerType: 'Insured',
          source: 'PAS',
          description: `Premium Receivable — ${evt.parties.insured_name} on ${evt.policy.policy_number} (Stage 1 binding)`
        },
        {
          id: `INV-AR-MGA-${evt.policy.policy_number}`,
          customer: evt.parties.producer,
          policyNumber: evt.policy.policy_number,
          amount: Math.abs(netToMGA),
          dueDate: (() => {
            const base = evt.dates?.transaction_date ? new Date(evt.dates.transaction_date) : new Date();
            base.setDate(base.getDate() + 10);
            return base.toISOString().slice(0, 10);
          })(),
          status: 'Open',
          category: 'MGA Settlement Receivable',
          entity: mga.id,
          entityName: mga.name,
          partnerType: 'Broker',
          source: 'PAS',
          description: `Premium Receivable — ${evt.parties.producer} on ${evt.policy.policy_number} (Stage 1 binding)`
        }
      ];
    } else if (evt.event_type === 'PAYMENT_RECEIVED') {
      // Stage 2 — Broker book only. Now that the Broker actually holds the
      // customer's cash, also raise a real Accounts Payable bill for the
      // net premium it owes the MGA (Stage 1's 2200 credit becomes a
      // payable Broker can action from the AP module, not just a JE line).
      groups = [{
        entity: broker,
        lines: [
          { acct: '1001', desc: `Customer Premium Receipt — ${evt.parties.insured_name}`, debit: paid || totalBilled, credit: 0 },
          { acct: '1100', desc: `Clear Premium Receivable — ${evt.parties.insured_name}`, debit: 0, credit: paid || totalBilled }
        ]
      }];
      apBill = {
        id: `INV-AP-MGA-${evt.policy.policy_number}`,
        vendor: mga.name,
        policyNumber: evt.policy.policy_number,
        amount: Math.abs(netToMGA),
        dueDate: (() => {
          const base = evt.dates?.transaction_date ? new Date(evt.dates.transaction_date) : new Date();
          base.setDate(base.getDate() + 5);
          return base.toISOString().slice(0, 10);
        })(),
        category: 'MGA Settlement — Net Premium Payable',
        glAcct: '2200',
        method: 'ACH',
        status: 'Approved',
        entity: broker.id,
        entityName: broker.name,
        counterpartyEntity: mga,
        counterpartyReceivableAcct: '1100',
        source: 'PAS',
        description: `Net Premium Payable to ${mga.name} on ${evt.policy.policy_number} (Stage 3 settlement)`
        // Paying this does NOT chain straight to a Carrier bill — the MGA
        // must first send/ingest the Bordereau (Stage 4b) before it owes the
        // Carrier anything. That bill is raised on BORDEREAU_INGESTED below.
      };
    } else if (evt.event_type === 'BROKER_SETTLEMENT_COMPLETED') {
      // Stage 3 — Broker disburses to MGA; MGA simultaneously receives it.
      groups = [
        {
          entity: broker,
          lines: [
            { acct: '2200', desc: `Clear Net Premium Payable to ${evt.parties.mga_name}`, debit: Math.abs(netToMGA), credit: 0 },
            { acct: '1001', desc: `Disburse Net Premium to ${evt.parties.mga_name}`, debit: 0, credit: Math.abs(netToMGA) }
          ]
        },
        {
          entity: mga,
          lines: [
            { acct: '1001', desc: `Cash Receipt from ${evt.parties.producer}`, debit: Math.abs(netToMGA), credit: 0 },
            { acct: '1100', desc: `Clear Premium Receivable — ${evt.parties.producer}`, debit: 0, credit: Math.abs(netToMGA) }
          ]
        }
      ];
    } else if (evt.event_type === 'BORDEREAU_INGESTED') {
      // Stage 4b — Carrier book only.
      groups = [{
        entity: carrier,
        lines: [
          { acct: '1100', desc: `Settlement Receivable — ${evt.parties.mga_name}`, debit: Math.abs(netToCarrier), credit: 0 },
          { acct: '5100', desc: `Acquisition Costs & Broker Commissions — MGA Override`, debit: Math.abs(mgaOverride), credit: 0 },
          { acct: '4001', desc: `Gross Written Premium (GWP)`, debit: 0, credit: Math.abs(netToCarrier + mgaOverride) }
        ]
      }];
      // Only NOW — once the Carrier has actually received and ingested the
      // MGA's bordereau — does the MGA have a real obligation to remit. Raise
      // that bill directly in the MGA's own AP book (Stage 5a); paying it
      // posts the matching Stage 5b receipt straight to the Carrier's book.
      apBill = {
        id: `INV-AP-CARRIER-${evt.policy.policy_number}`,
        vendor: carrier.name,
        policyNumber: evt.policy.policy_number,
        amount: Math.abs(netToCarrier),
        dueDate: (() => {
          const base = evt.dates?.transaction_date ? new Date(evt.dates.transaction_date) : new Date();
          base.setDate(base.getDate() + 10);
          return base.toISOString().slice(0, 10);
        })(),
        category: 'Carrier Settlement — Net Premium Payable',
        glAcct: '2200',
        method: 'ACH',
        status: 'Approved',
        entity: mga.id,
        entityName: mga.name,
        counterpartyEntity: carrier,
        counterpartyReceivableAcct: '1100',
        source: 'PAS',
        description: `Net Premium Payable to ${carrier.name} on ${evt.policy.policy_number} (Stage 5 settlement)`
      };
    } else if (evt.event_type === 'CARRIER_PAYMENT_COMPLETED') {
      // Stage 5a+5b — MGA disburses to Carrier; Carrier simultaneously receives it.
      groups = [
        {
          entity: mga,
          lines: [
            { acct: '2200', desc: `Clear Net Premium Payable to ${evt.parties.carrier_name}`, debit: Math.abs(netToCarrier), credit: 0 },
            { acct: '1001', desc: `ACH Disburse to ${evt.parties.carrier_name}`, debit: 0, credit: Math.abs(netToCarrier) }
          ]
        },
        {
          entity: carrier,
          lines: [
            { acct: '1001', desc: `MGA Premium Settlement Receipt — ${evt.parties.mga_name}`, debit: Math.abs(netToCarrier), credit: 0 },
            { acct: '1100', desc: `Clear Settlement Receivable — ${evt.parties.mga_name}`, debit: 0, credit: Math.abs(netToCarrier) }
          ]
        }
      ];
    } else if (evt.event_type === 'POLICY_CANCELLED') {
      // Reverses the Broker's own Stage 1 entry — same book, same accounts.
      groups = [{
        entity: broker,
        lines: [
          { acct: '2200', desc: `Reverse Net Premium Payable to ${evt.parties.mga_name}`, debit: Math.abs(netToMGA), credit: 0 },
          { acct: '4200', desc: `Reverse Producer / Broker Commission Revenue`, debit: Math.abs(commission), credit: 0 },
          { acct: '1100', desc: `Reverse Premium Receivable`, debit: 0, credit: Math.abs(totalBilled) }
        ]
      }];
    }
    return { groups, apBill, arInvoices };
  };

  // Execution engine — creates one DRAFT journal entry per entity book the
  // event touches (see generateRulesEngineGroups). Entries stay Draft until
  // manually posted on the Journal Entry page, per the "post then COA hit"
  // requirement — injecting an event must not silently move the Chart of
  // Accounts.
  const executeEventInjection = (evt) => {
    const errors = validateEvent(evt);
    if (errors.length > 0) {
      const failedRecord = {
        ...evt,
        status: 'FAILED',
        timestamp: new Date().toISOString(),
        errors: errors,
        jeNumber: null,
        jeLines: []
      };
      setEvents(prev => [failedRecord, ...prev]);
      showToast('Event Validation Failed! Check Exception Queue.', 'error');
      return false;
    }

    const { groups, apBill, arInvoices } = generateRulesEngineGroups(evt);

    // Actually post the event to the General Ledger — one draft JE per book —
    // matching the JE structure documented in the accounting flow guide, so
    // it shows up on Journal Entry / Chart of Accounts / Financial Statements
    // for EVERY entity involved, not just this page's local log.
    const jeGroups = groups.map(group => {
      const glEntry = addJournalEntry({
        date: (evt.dates && evt.dates.transaction_date) || new Date().toISOString().slice(0, 10),
        reference: evt.transaction_id,
        description: `${(evt.event_type || '').replace(/_/g, ' ')} — ${evt.policy.policy_number} (${evt.event_id})`,
        entity: group.entity.id,
        entityName: group.entity.name,
        status: 'Draft',
        lines: group.lines.map(l => ({
          accountCode: l.acct,
          accountName: accounts.find(a => a.code === l.acct)?.name || l.desc,
          debit: l.debit,
          credit: l.credit,
          description: l.desc
        }))
      });
      return { entity: group.entity, jeNumber: glEntry.id, lines: group.lines };
    });

    // Stage 1 (policy bound & invoiced) also raises real Accounts
    // Receivable invoices for BOTH 1100 lines it just posted — the Broker's
    // from the insured, and the MGA's from the Broker — visible and
    // actionable on each entity's own AR Register (Record Pay there fires
    // collectArInvoice's own cash-receipt JE).
    const arInvoiceRecords = (arInvoices || []).map(inv => addArInvoice(inv));

    // Clearing an entity's AR invoice via a settlement event — mark it paid
    // directly rather than routing through collectArInvoice, which would
    // post a second, duplicate cash-receipt JE on top of the one the
    // relevant group above already posted.
    let paidArInvoiceRecords = [];
    if (evt.event_type === 'PAYMENT_RECEIVED') {
      // Stage 2 — customer's payment clears the Broker's own AR invoice.
      const matchingArId = evt.invoice_number || `INV-AR-${evt.policy.policy_number}`;
      const rec = markArInvoicePaid(matchingArId, evt.financials.payment_amount || evt.financials.total_premium);
      if (rec) paidArInvoiceRecords.push(rec);
    } else if (evt.event_type === 'BROKER_SETTLEMENT_COMPLETED') {
      // Stage 3 — Broker's disbursement clears the MGA's AR invoice.
      const rec = markArInvoicePaid(`INV-AR-MGA-${evt.policy.policy_number}`, evt.financials.payment_amount);
      if (rec) paidArInvoiceRecords.push(rec);
    }

    // Same idea on the AP side — injecting the settlement stage directly
    // (instead of clicking Pay Now on the Accounts Payable page) already
    // posts the disbursement/receipt JE above via the groups, so the AP
    // bill Stage 2/4 raised for this policy needs to flip to Paid here too.
    // Without this, that bill would keep showing an active Pay Now button
    // even though the settlement has already been recorded.
    let paidApInvoiceRecords = [];
    if (evt.event_type === 'BROKER_SETTLEMENT_COMPLETED') {
      const rec = markApInvoicePaid(`INV-AP-MGA-${evt.policy.policy_number}`, evt.financials.payment_amount);
      if (rec) paidApInvoiceRecords.push(rec);
    } else if (evt.event_type === 'CARRIER_PAYMENT_COMPLETED') {
      const rec = markApInvoicePaid(`INV-AP-CARRIER-${evt.policy.policy_number}`, evt.financials.payment_amount);
      if (rec) paidApInvoiceRecords.push(rec);
    }

    // Stage 2 (customer paid the Broker) also raises a real, payable AP bill
    // for what the Broker now owes the MGA — visible on the Accounts Payable
    // page, actionable with Pay Now. Paying it (payApInvoice) is what fires
    // the Stage 3 dual JE (Broker disburses + MGA receives) automatically.
    const apBillRecord = apBill ? addApInvoice(apBill) : null;

    const postedRecord = {
      ...evt,
      status: 'POSTED',
      timestamp: new Date().toISOString(),
      errors: [],
      jeNumber: jeGroups.map(g => g.jeNumber).join(', '),
      jeLines: jeGroups.flatMap(g => g.lines.map(l => ({ ...l, desc: jeGroups.length > 1 ? `[${g.entity.name}] ${l.desc}` : l.desc }))),
      jeGroups,
      arInvoiceId: arInvoiceRecords.map(r => r.id).join(', ') || null,
      apInvoiceId: apBillRecord?.id || null
    };

    // Update policies register if bound
    if (evt.event_type === 'POLICY_BINDING_INVOICED') {
      setPolicies(prev => {
        if (!prev.some(p => p.number === evt.policy.policy_number)) {
          return [
            {
              number: evt.policy.policy_number,
              name: evt.parties.insured_name,
              date: evt.dates.effective_date,
              premium: evt.financials.total_premium,
              commissionPct: 8,
              status: 'BOUND',
              brokerName: evt.parties.producer,
              mgaName: evt.parties.mga_name,
              carrierName: evt.parties.carrier_name
            },
            ...prev
          ];
        }
        return prev;
      });
    }

    setEvents(prev => [postedRecord, ...prev]);
    const jeList = jeGroups.map(g => `${g.jeNumber} (${g.entity.name})`).join(' + ');
    const arNote = arInvoiceRecords.length > 0 ? ` AR invoice${arInvoiceRecords.length > 1 ? 's' : ''} ${arInvoiceRecords.map(r => `${r.id} (${r.entityName})`).join(' + ')} raised — visible on each book's Accounts Receivable.` : '';
    const arPaidNote = paidArInvoiceRecords.length > 0 ? ` AR invoice${paidArInvoiceRecords.length > 1 ? 's' : ''} ${paidArInvoiceRecords.map(r => r.id).join(', ')} marked Paid.` : '';
    const apNote = apBillRecord ? ` AP bill ${apBillRecord.id} raised for ${apBillRecord.vendor} — pay it on Accounts Payable to complete the settlement.` : '';
    const apPaidNote = paidApInvoiceRecords.length > 0 ? ` AP bill${paidApInvoiceRecords.length > 1 ? 's' : ''} ${paidApInvoiceRecords.map(r => r.id).join(', ')} marked Paid — no need to also click Pay Now on Accounts Payable.` : '';
    showToast(`Event ${evt.event_id} (${evt.policy.policy_number}) validated — ${jeList} created as draft${jeGroups.length > 1 ? 's' : ''}. Post on Journal Entry to hit the Chart of Accounts.${arNote}${arPaidNote}${apNote}${apPaidNote}`);
    return true;
  };

  const handleSubmitCustomEvent = (e) => {
    e.preventDefault();
    const ok = executeEventInjection(currentPayload);
    if (ok) {
      setEvtId(generateUUID('EVT'));
      setTxnId(generateUUID('TXN'));
    }
  };

  // Deep-link auto-injection — e.g. MGA Operations' "+ Generate & Submit
  // Bordereau" sends the user here with ?preset=bordereau_ingested&autoInject=1
  // so the event actually fires on arrival, instead of pre-filling the form
  // and leaving a second, easy-to-miss "Inject Event into Rules Engine"
  // click as the only thing standing between the button's label and what it
  // actually does. (This mount-time action effect calls setState the same
  // way syncWithBackend's does elsewhere in this app — an accepted, tracked
  // exception to the no-setState-in-effect rule for one-time, real actions
  // triggered by how a page was opened, not for deriving render state.)
  const autoInjectedRef = useRef(false);
  useEffect(() => {
    if (autoInjectedRef.current) return;
    if (new URLSearchParams(location.search).get('autoInject') === '1') {
      autoInjectedRef.current = true;
      executeEventInjection(currentPayload);
    }
    // Intentionally mount-only: acts once on the URL this page was opened
    // with, using the preset-derived initial payload.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Full DBA (Direct Bill to Agency) cross-entity lifecycle — matches
  // finance-and-accounting-main/README.md Section 4.1 exactly. Unlike the
  // custom Event Data Injector (which now also splits a stage's JE across
  // every book it touches, but leaves each as Draft), this posts the
  // *entire* documented chain: 7 journal entries POSTED directly, each
  // tagged to whichever of the three books (Broker HIT / MGA NTA / Carrier
  // SOUTHLAKE) actually owns that entry — regardless of which role is
  // logged in when you click the button.
  const handleQuickSimulation = () => {
    const policyNumber = 'POL-V8NHT';
    const acctName = (code, fallback) => accounts.find(a => a.code === code)?.name || fallback;
    const line = (code, debit, credit, desc) => ({ accountCode: code, accountName: acctName(code, desc), debit, credit, description: desc });

    const postStageJE = (entity, description, lines) => {
      const glEntry = addJournalEntry({
        date: '2026-08-20',
        reference: generateUUID('TXN'),
        description,
        entity: entity.id,
        entityName: entity.name,
        status: 'Posted',
        lines
      });
      setEvents(prev => [{
        event_id: generateUUID('EVT'),
        event_type: description,
        transaction_id: glEntry.reference,
        policy: { policy_id: policyNumber, policy_number: policyNumber, lob: 'Commercial Trucking', state: 'TX' },
        parties: { insured_name: 'Ayushi', insured_id: 'INS-AYUSHI', carrier_name: 'SOUTHLAKE', carrier_id: 'CAR-SOUTHLAKE', mga_name: 'NTA', mga_id: 'MGA-NTA', producer: 'HIT' },
        financials: { premium: 33257, tax_and_fees: 3503, total_premium: 39260, broker_commission: 2500, payment_amount: 0, currency: 'USD' },
        dates: { effective_date: '2026-08-20', transaction_date: '2026-08-20' },
        source_system: 'PAS',
        status: 'POSTED',
        timestamp: new Date().toISOString(),
        errors: [],
        jeNumber: glEntry.id,
        jeLines: lines,
        bookEntity: entity.name
      }, ...prev]);
      return glEntry;
    };

    // Stage 1: Policy Binding & Invoicing — Broker + MGA books
    postStageJE(DBA_ENTITIES.BROKER, `Policy Binding & Invoicing — ${policyNumber} (Stage 1)`, [
      line('1100', 39260.00, 0, 'Premium Receivable — Ayushi'),
      line('2200', 0, 36760.00, 'Net Premium Payable — NTA'),
      line('4200', 0, 2500.00, 'Producer / Broker Commission Revenue')
    ]);
    postStageJE(DBA_ENTITIES.MGA, `Policy Binding & Invoicing — ${policyNumber} (Stage 1)`, [
      line('1100', 36760.00, 0, 'Premium Receivable — HIT'),
      line('2200', 0, 29757.00, 'Net Premium Payable — Southlake'),
      line('2300', 0, 3503.00, 'Surplus Lines Taxes & Regulatory Fees'),
      line('4100', 0, 3500.00, 'MGA Program Override & Policy Fee Revenue')
    ]);

    setTimeout(() => {
      // Stage 2: Customer Premium Collection — Broker book
      postStageJE(DBA_ENTITIES.BROKER, `Customer Premium Collection — ${policyNumber} (Stage 2)`, [
        line('1001', 39260.00, 0, 'Cash Receipt from Ayushi'),
        line('1100', 0, 39260.00, 'Clear Premium Receivable — Ayushi')
      ]);

      setTimeout(() => {
        // Stage 3: Broker Settlement to MGA — Broker + MGA books
        postStageJE(DBA_ENTITIES.BROKER, `Broker Settlement to MGA — ${policyNumber} (Stage 3)`, [
          line('2200', 36760.00, 0, 'Clear Net Premium Payable — NTA'),
          line('1001', 0, 36760.00, 'Disburse Net Premium to NTA')
        ]);
        postStageJE(DBA_ENTITIES.MGA, `Broker Premium Settlement Received — ${policyNumber} (Stage 3)`, [
          line('1001', 36760.00, 0, 'Cash Receipt from HIT'),
          line('1100', 0, 36760.00, 'Clear Premium Receivable — HIT')
        ]);

        setTimeout(() => {
          // Stage 4b: Carrier Bordereau Ingestion — Carrier book
          postStageJE(DBA_ENTITIES.CARRIER, `Bordereau Ingestion — ${policyNumber} (Stage 4b)`, [
            line('1100', 29757.00, 0, 'Settlement Receivable — NTA'),
            line('5100', 3500.00, 0, 'Acquisition Costs & Broker Commissions — MGA Override'),
            line('4001', 0, 33257.00, 'Gross Written Premium (GWP)')
          ]);

          setTimeout(() => {
            // Stage 5a: MGA Net Settlement — MGA book
            postStageJE(DBA_ENTITIES.MGA, `Net-Net Premium Disbursed to Carrier — ${policyNumber} (Stage 5a)`, [
              line('2200', 29757.00, 0, 'Clear Net Premium Payable — Southlake'),
              line('1001', 0, 29757.00, 'ACH Disburse to Southlake')
            ]);

            setTimeout(() => {
              // Stage 5b: Carrier Matches Inbound Wire — Carrier book
              postStageJE(DBA_ENTITIES.CARRIER, `Cash Match — Inbound Wire from NTA — ${policyNumber} (Stage 5b)`, [
                line('1001', 29757.00, 0, 'Cash Receipt from NTA'),
                line('1100', 0, 29757.00, 'Clear Settlement Receivable — NTA')
              ]);

              setPolicies(prev => prev.some(p => p.number === policyNumber) ? prev : [
                {
                  number: policyNumber,
                  name: 'Ayushi',
                  date: '2026-08-20',
                  premium: 39260,
                  commissionPct: 8,
                  status: 'FULLY SETTLED',
                  brokerName: 'HIT',
                  mgaName: 'NTA',
                  carrierName: 'SOUTHLAKE'
                },
                ...prev
              ]);

              setActiveTab('intake');
              showToast('End-to-End DBA Simulation complete — 7 journal entries posted across Broker (HIT), MGA (NTA), and Carrier (SOUTHLAKE) books.', 'success');
            }, 400);
          }, 400);
        }, 400);
      }, 400);
    }, 400);
  };

  // Retry failed event
  const handleRetryFailed = (failedEvt) => {
    setEvtId(failedEvt.event_id);
    setTxnId(failedEvt.transaction_id);
    setEvtType(failedEvt.event_type);
    setPolNum(failedEvt.policy.policy_number);
    setInvNum(failedEvt.invoice_number || 'INV-V8NHT-1');
    setLob(failedEvt.policy.lob);
    setInsuredName(failedEvt.parties.insured_name);
    setCarrierName(failedEvt.parties.carrier_name);
    setMgaName(failedEvt.parties.mga_name);
    setBrokerName(failedEvt.parties.producer || 'Direct');
    setPremium(String(failedEvt.financials.premium));
    setTaxAndFees(String(failedEvt.financials.tax_and_fees));
    setCommission(String(failedEvt.financials.broker_commission));
    setPaymentAmount(String(failedEvt.financials.payment_amount || 0));
    setDateEff(failedEvt.dates.effective_date);
    setDateTx(failedEvt.dates.transaction_date);

    // Remove from exceptions
    setEvents(prev => prev.filter(e => e !== failedEvt));
    setActiveTab('injector');
    showToast('Loaded failed event details. Correct parameters and re-inject.', 'info');
  };

  // Load from Register into Injector
  const handleLoadFromRegister = (policy) => {
    setPolNum(policy.number);
    setInsuredName(policy.name);
    setBrokerName(policy.brokerName || 'HIT');
    setPremium('33257');
    setTaxAndFees('3503');
    setCommission('2500');
    setPreset('payment_received');
    setEvtType('PAYMENT_RECEIVED');
    setPaymentAmount('39260');
    setActiveTab('injector');
    showToast(`Loaded ${policy.number} into Event Data Injector. Ready to inject actions!`, 'info');
  };

  const failedCount = useMemo(() => {
    return events.filter(e => e.status === 'FAILED').length;
  }, [events]);

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
          <div className="page-title">Policy Administration System (PAS) – Event &amp; Data Injection Hub</div>
          <div className="page-subtitle">
            Generate business events and inject them directly into the Accounting Rules Engine
          </div>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={handleQuickSimulation}>
            ⚡ Quick Simulate End-to-End (POL-V8NHT · $39,260)
          </button>
        </div>
      </div>

      {/* Custom Tabbed Menu */}
      <div className="pas-tab-group">
        <button
          className={`pas-tab ${activeTab === 'injector' ? 'active' : ''}`}
          onClick={() => setActiveTab('injector')}
        >
          Event Data Injector
        </button>
        <button
          className={`pas-tab ${activeTab === 'intake' ? 'active' : ''}`}
          onClick={() => setActiveTab('intake')}
        >
          Intake Event Log
        </button>
        <button
          className={`pas-tab ${activeTab === 'exceptions' ? 'active' : ''}`}
          onClick={() => setActiveTab('exceptions')}
        >
          Exception Queue{' '}
          {failedCount > 0 && (
            <span
              style={{
                background: 'var(--red-600, #dc2626)',
                color: '#fff',
                fontSize: '10px',
                padding: '2px 6px',
                borderRadius: '10px',
                marginLeft: '4px'
              }}
            >
              {failedCount}
            </span>
          )}
        </button>
        <button
          className={`pas-tab ${activeTab === 'register' ? 'active' : ''}`}
          onClick={() => setActiveTab('register')}
        >
          Policies Register
        </button>
      </div>

      {/* Tab 1: Event Data Injector Panel */}
      {activeTab === 'injector' && (
        <div className="pas-panel active">
          <div className="injector-layout">
            {/* Left Column: Event Customizer Form */}
            <div className="form-card">
              <div className="panel-title">Configure &amp; Inject Custom Event</div>

              <div style={{ marginBottom: '16px' }}>
                <label className="info-label">Load Event Preset</label>
                <select
                  className="info-input"
                  style={{ width: '100%' }}
                  value={preset}
                  onChange={(e) => handleApplyPreset(e.target.value)}
                >
                  {PRESET_OPTIONS.filter((opt) => visiblePresets.includes(opt.value)).map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                {ROLE_VISIBLE_PRESETS[currentUser?.role] && (
                  <div style={{ fontSize: '12px', color: 'var(--gray-500)', marginTop: '4px' }}>
                    Showing stages for your role: {currentUser.role.toUpperCase()}
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmitCustomEvent}>
                <div style={{ borderTop: '1px solid var(--gray-200)', paddingTop: '16px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--navy)', marginBottom: '12px' }}>
                    Event Header &amp; Metadata
                  </div>
                  <div className="info-grid">
                    <div className="info-item">
                      <label className="info-label">Event ID</label>
                      <input
                        type="text"
                        className="info-input"
                        value={evtId}
                        onChange={(e) => setEvtId(e.target.value)}
                        required
                      />
                    </div>
                    <div className="info-item">
                      <label className="info-label">Transaction ID</label>
                      <input
                        type="text"
                        className="info-input"
                        value={txnId}
                        onChange={(e) => setTxnId(e.target.value)}
                        required
                      />
                    </div>
                    <div className="info-item">
                      <label className="info-label">Event Type</label>
                      <input
                        type="text"
                        className="info-input"
                        value={evtType}
                        onChange={(e) => setEvtType(e.target.value)}
                        required
                      />
                    </div>
                    <div className="info-item">
                      <label className="info-label">Source System</label>
                      <input type="text" className="info-input" value="PAS" disabled />
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--gray-200)', paddingTop: '16px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--navy)', marginBottom: '12px' }}>
                    Policy &amp; Invoice Reference
                  </div>
                  <div className="info-grid">
                    <div className="info-item">
                      <label className="info-label">Policy Number</label>
                      <input
                        type="text"
                        className="info-input"
                        value={polNum}
                        onChange={(e) => setPolNum(e.target.value)}
                        required
                      />
                    </div>
                    <div className="info-item">
                      <label className="info-label">Invoice Number</label>
                      <input
                        type="text"
                        className="info-input"
                        value={invNum}
                        onChange={(e) => setInvNum(e.target.value)}
                        required
                      />
                    </div>
                    <div className="info-item">
                      <label className="info-label">Line of Business (LOB)</label>
                      <select
                        className="info-input"
                        value={lob}
                        onChange={(e) => setLob(e.target.value)}
                      >
                        <option>Commercial Trucking</option>
                        <option>Commercial Auto</option>
                        <option>General Liability</option>
                        <option>Commercial Property</option>
                        <option>Inland Marine</option>
                      </select>
                    </div>
                    <div className="info-item">
                      <label className="info-label">State</label>
                      <input
                        type="text"
                        className="info-input"
                        value={stateCode}
                        onChange={(e) => setStateCode(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--gray-200)', paddingTop: '16px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--navy)', marginBottom: '12px' }}>
                    Parties Information
                  </div>
                  <div className="info-grid">
                    <div className="info-item">
                      <label className="info-label">Named Insured</label>
                      <input
                        type="text"
                        className="info-input"
                        value={insuredName}
                        onChange={(e) => setInsuredName(e.target.value)}
                        required
                      />
                    </div>
                    {visibleParties.includes('broker') && (
                      <div className="info-item">
                        <label className="info-label">Producer / Broker</label>
                        <select
                          className="info-input"
                          value={brokerName}
                          onChange={(e) => setBrokerName(e.target.value)}
                        >
                          {!BROKER_OPTIONS.includes(brokerName) && <option value={brokerName}>{brokerName}</option>}
                          {BROKER_OPTIONS.map((name) => <option key={name} value={name}>{name}</option>)}
                        </select>
                      </div>
                    )}
                    {visibleParties.includes('carrier') && (
                      <div className="info-item">
                        <label className="info-label">Carrier Name</label>
                        <select
                          className="info-input"
                          value={carrierName}
                          onChange={(e) => setCarrierName(e.target.value)}
                        >
                          {!CARRIER_OPTIONS.includes(carrierName) && <option value={carrierName}>{carrierName}</option>}
                          {CARRIER_OPTIONS.map((name) => <option key={name} value={name}>{name}</option>)}
                        </select>
                      </div>
                    )}
                    {visibleParties.includes('mga') && (
                      <div className="info-item">
                        <label className="info-label">MGA Name</label>
                        <select
                          className="info-input"
                          value={mgaName}
                          onChange={(e) => setMgaName(e.target.value)}
                        >
                          {!MGA_OPTIONS.includes(mgaName) && <option value={mgaName}>{mgaName}</option>}
                          {MGA_OPTIONS.map((name) => <option key={name} value={name}>{name}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--gray-200)', paddingTop: '16px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--navy)', marginBottom: '12px' }}>
                    Financial Parameters
                  </div>
                  <div className="info-grid">
                    <div className="info-item">
                      <label className="info-label">Carrier Base Premium ($)</label>
                      <input
                        type="number"
                        className="info-input"
                        value={premium}
                        onChange={(e) => setPremium(e.target.value)}
                        required
                      />
                    </div>
                    <div className="info-item">
                      <label className="info-label">Texas Surplus Tax &amp; Fees ($)</label>
                      <input
                        type="number"
                        className="info-input"
                        value={taxAndFees}
                        onChange={(e) => setTaxAndFees(e.target.value)}
                        required
                      />
                    </div>
                    <div className="info-item">
                      <label className="info-label">Producer / Broker Commission ($)</label>
                      <input
                        type="number"
                        className="info-input"
                        value={commission}
                        onChange={(e) => setCommission(e.target.value)}
                        required
                      />
                    </div>
                    <div className="info-item">
                      <label className="info-label">Payment Amount ($)</label>
                      <input
                        type="number"
                        className="info-input"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--gray-200)', paddingTop: '16px', marginBottom: '20px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--navy)', marginBottom: '12px' }}>
                    Transaction Dates
                  </div>
                  <div className="info-grid">
                    <div className="info-item">
                      <label className="info-label">Transaction / Invoice Date</label>
                      <input
                        type="date"
                        className="info-input"
                        value={dateTx}
                        onChange={(e) => setDateTx(e.target.value)}
                        required
                      />
                    </div>
                    <div className="info-item">
                      <label className="info-label">Effective Date</label>
                      <input
                        type="date"
                        className="info-input"
                        value={dateEff}
                        onChange={(e) => setDateEff(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '12px', fontWeight: 700 }}
                >
                  ⚡ Inject Event into Rules Engine
                </button>
              </form>
            </div>

            {/* Right Column: Live Event JSON Preview */}
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--navy)', marginBottom: '10px' }}>
                Event Payload JSON Preview
              </div>
              <pre
                className="json-preview-container"
                dangerouslySetInnerHTML={{ __html: highlightJson(currentPayload) }}
              />
              <div style={{ fontSize: '11px', color: 'var(--gray-500)', marginTop: '8px' }}>
                * Note: Live changes update the JSON payload above in real-time. Injected events undergo Section 10 validations.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Intake Event Log */}
      {activeTab === 'intake' && (
        <div className="pas-panel active">
          <div className="form-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div className="panel-title" style={{ marginBottom: 0 }}>Intake Event Log &amp; Queue Status</div>
              <button
                className="btn btn-outline btn-xs"
                onClick={() => {
                  if (window.confirm('Clear event logs history?')) {
                    setEvents([]);
                    showToast('Event logs cleared.');
                  }
                }}
              >
                Clear Log History
              </button>
            </div>

            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Event ID</th>
                    <th>Event Type</th>
                    <th>Invoice / TX Date</th>
                    <th>Policy / Invoice Ref</th>
                    <th>Insured</th>
                    <th>Total Amount</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {events.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', color: 'var(--gray-400)', padding: '24px' }}>
                        No events recorded. Set presets and click "Inject Event" to start.
                      </td>
                    </tr>
                  ) : (
                    events.map((e) => {
                      const total = (parseFloat(e.financials?.premium) || 0) + (parseFloat(e.financials?.tax_and_fees) || 0);
                      return (
                        <tr key={e.event_id + (e.timestamp || '')}>
                          <td style={{ fontWeight: 600, color: 'var(--navy)' }}>{e.event_id}</td>
                          <td><strong>{e.event_type}</strong></td>
                          <td>{e.dates?.transaction_date}</td>
                          <td>
                            {e.policy?.policy_number}{' '}
                            <span style={{ fontSize: '11px', color: 'var(--gray-500)' }}>
                              ({e.invoice_number || 'INV-V8NHT-1'})
                            </span>
                          </td>
                          <td>{e.parties?.insured_name}</td>
                          <td>${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                          <td>
                            <span className={`status-badge st-${(e.status || 'received').toLowerCase()}`}>
                              {e.status}
                            </span>
                          </td>
                          <td>
                            <button className="btn btn-outline btn-xs" onClick={() => setSelectedEventModal(e)}>
                              View details
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Exception Queue */}
      {activeTab === 'exceptions' && (
        <div className="pas-panel active">
          <div className="form-card">
            <div className="panel-title">Validation Exceptions &amp; Resolution Queue</div>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Event ID</th>
                    <th>Event Type</th>
                    <th>Policy Number</th>
                    <th>Failed Reason / Error Logs</th>
                    <th>Timestamp</th>
                    <th>Resolution Action</th>
                  </tr>
                </thead>
                <tbody>
                  {events.filter(e => e.status === 'FAILED').length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', color: 'var(--gray-400)', padding: '24px' }}>
                        No validation failures found. Systems are clean.
                      </td>
                    </tr>
                  ) : (
                    events
                      .filter(e => e.status === 'FAILED')
                      .map((e, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 600, color: '#c62828' }}>{e.event_id}</td>
                          <td><strong>{e.event_type}</strong></td>
                          <td>{e.policy?.policy_number}</td>
                          <td style={{ color: '#c62828', fontSize: '12px', fontWeight: 500 }}>
                            {e.errors.map((err, i) => (
                              <div key={i}>&bull; {err}</div>
                            ))}
                          </td>
                          <td>{new Date(e.timestamp).toLocaleTimeString()}</td>
                          <td>
                            <button
                              className="btn btn-primary btn-xs"
                              onClick={() => handleRetryFailed(e)}
                            >
                              Edit &amp; Retry
                            </button>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Policies Register */}
      {activeTab === 'register' && (
        <div className="pas-panel active">
          <div className="form-card">
            <div className="panel-title">Active Policy Contracts</div>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Policy Number</th>
                    <th>Insured Name</th>
                    <th>Effective Date</th>
                    <th>Total Premium</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {policies.map((p) => (
                    <tr key={p.number}>
                      <td style={{ fontWeight: 600, color: 'var(--navy)' }}>{p.number}</td>
                      <td><strong>{p.name}</strong></td>
                      <td>{p.date}</td>
                      <td>${Number(p.premium).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td><span className="status-badge st-posted">{p.status}</span></td>
                      <td>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => handleLoadFromRegister(p)}
                        >
                          Inject Actions
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Event Details Modal */}
      {selectedEventModal && (
        <div
          className="pas-modal open"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedEventModal(null);
          }}
        >
          <div className="pas-modal-content">
            <div className="pas-modal-header">
              <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--navy)' }}>
                Intake Event Details: {selectedEventModal.event_id} ({selectedEventModal.policy?.policy_number})
              </div>
              <button className="pas-modal-close" onClick={() => setSelectedEventModal(null)}>
                &times;
              </button>
            </div>

            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', marginBottom: '8px' }}>
                JSON Payload
              </div>
              <pre
                className="json-preview-container"
                style={{ maxHeight: '260px' }}
                dangerouslySetInnerHTML={{ __html: highlightJson(selectedEventModal) }}
              />

              <div style={{ borderTop: '1px solid var(--gray-200)', paddingTop: '16px', marginTop: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Resulting General Ledger Journal {selectedEventModal.jeGroups?.length > 1 ? 'Entries (one per book)' : 'Entry'}
                </div>
                {selectedEventModal.jeNumber && selectedEventModal.jeLines?.length > 0 ? (
                  (selectedEventModal.jeGroups && selectedEventModal.jeGroups.length > 0
                    ? selectedEventModal.jeGroups
                    : [{ entity: null, jeNumber: selectedEventModal.jeNumber, lines: selectedEventModal.jeLines }]
                  ).map((group, gIdx) => (
                    <div key={gIdx} style={{ marginBottom: gIdx < (selectedEventModal.jeGroups?.length || 1) - 1 ? '16px' : 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12.5px', fontWeight: 700 }}>
                        <span>Journal Entry: {group.jeNumber}{group.entity ? ` — ${group.entity.name}` : ''}</span>
                        <span>Status: <span className={selectedEventModal.jeGroups ? 'badge badge-draft' : 'badge badge-green'} style={{ fontSize: '9.5px' }}>{selectedEventModal.jeGroups ? 'DRAFT' : 'POSTED'}</span></span>
                      </div>
                      <div className="journal-box" style={{ marginTop: 0 }}>
                        <div className="journal-row header">
                          <span>Account Code &amp; Name</span>
                          <span>Debit</span>
                          <span>Credit</span>
                        </div>
                        {group.lines.map((l, idx) => (
                          <div className="journal-row" key={idx}>
                            <span>{l.acct} - {l.desc}</span>
                            {l.debit > 0 ? (
                              <span className="dr">${l.debit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                            ) : (
                              <span></span>
                            )}
                            {l.credit > 0 ? (
                              <span className="cr">${l.credit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                            ) : (
                              <span></span>
                            )}
                          </div>
                        ))}
                        <div className="journal-row" style={{ fontWeight: 700, borderTop: '1px solid var(--gray-300)', marginTop: '6px', paddingTop: '4px' }}>
                          <span>Total Balanced</span>
                          <span>
                            ${group.lines
                              .reduce((s, l) => s + (l.debit || 0), 0)
                              .toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                          <span>
                            ${group.lines
                              .reduce((s, l) => s + (l.credit || 0), 0)
                              .toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: '12.5px', color: 'var(--gray-500)', padding: '10px 0' }}>
                    No Journal Entry posted for this event (State: {selectedEventModal.status}).
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
