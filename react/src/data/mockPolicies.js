export const REFERENCE_POLICY = {
  policyNumber: 'POL-V8NHT',
  lob: 'Commercial Trucking Fleet Primary Auto',
  state: 'Texas (TX)',
  effectiveDate: '2026-08-20',
  expirationDate: '2027-08-20',
  settlementDate: '2026-09-02',
  status: 'Bound & Invoiced', // 'Draft', 'Bound & Invoiced', 'Customer Paid', 'Broker Remitted', 'Bordereau Transmitted', 'Settled'
  insured: {
    id: 'INS-AYUSHI',
    name: 'Ayushi Fleet Logistics Corp',
    contact: 'ayushi@fleetlogistics.com',
    grossPremium: 39260.00
  },
  broker: {
    id: 'ENT-AGY-01',
    name: 'HIT Agency Group',
    commissionRate: '6.37%',
    commissionAmount: 2500.00,
    netRemittanceToMga: 36760.00
  },
  mga: {
    id: 'ENT-MGA-01',
    name: 'NTA Program Administrators',
    overrideRate: '8.91%',
    overrideAmount: 3500.00,
    taxLiability: 3503.00,
    netRemittanceToCarrier: 29757.00
  },
  carrier: {
    id: 'ENT-CAR-01',
    name: 'Southlake Insurance Co.',
    grossWrittenPremium: 33257.00,
    netSettlementExpected: 29757.00,
    bordereauStatus: 'Ready for Ingestion', // 'Pending', 'Ingested to GL', 'Wire Matched'
    wireStatus: 'Pending Wire Match'
  },
  distributionModel: 'DBA' // Direct Bill to Agency (Model 1)
};

export const INITIAL_JOURNAL_ENTRIES = [
  {
    id: 'JE-2026-0006',
    number: 'JE-2026-0006',
    date: '2026-09-03',
    entity: 'ENT-MGA-01',
    entityId: 'ENT-MINE',
    entityName: 'NTA Program Administrators',
    reference: 'POL-V8NHT Carrier Settlement Disburse',
    description: 'Settlement disburse to Carrier: Southlake Insurance Co. for POL-V8NHT',
    status: 'draft',
    lines: [
      { accountCode: '2200', acct: '2200', accountName: 'Clear Net Premium Payable to Southlake Insurance Co.', debit: 29757.00, credit: 0, desc: 'Clear Net Premium Payable to Southlake Insurance Co.', dims: { 'cost-center': '00 - Corporate', lob: 'Commercial Trucking' } },
      { accountCode: '1001', acct: '1001', accountName: 'Carrier settlement cash disburse (ACH)', debit: 0, credit: 29757.00, desc: 'Carrier settlement cash disburse (ACH)', dims: { location: 'HQ' } }
    ]
  },
  {
    id: 'JE-2026-0002',
    number: 'JE-2026-0002',
    date: '2026-08-20',
    entity: 'ENT-MGA-01',
    entityId: 'ENT-MINE',
    entityName: 'NTA Program Administrators',
    reference: 'POL-V8NHT Broker Settlement Receipt',
    description: 'Broker premium settlement payment received from HIT for POL-V8NHT',
    status: 'posted',
    lines: [
      { accountCode: '1001', acct: '1001', accountName: 'Broker premium settlement receipt — HIT', debit: 36760.00, credit: 0, desc: 'Broker premium settlement receipt — HIT', dims: { location: 'HQ' } },
      { accountCode: '1100', acct: '1100', accountName: 'Clear Broker Premium Receivable — HIT', debit: 0, credit: 36760.00, desc: 'Clear Broker Premium Receivable — HIT', dims: { broker: 'HIT', lob: 'Commercial Trucking' } }
    ]
  },
  {
    id: 'JE-2026-0003',
    number: 'JE-2026-0003',
    date: '2026-08-20',
    entity: 'ENT-MGA-01',
    entityId: 'ENT-MINE',
    entityName: 'NTA Program Administrators',
    reference: 'POL-V8NHT Policy Inception & Invoicing',
    description: 'Policy binding and premium invoice issued for POL-V8NHT (Ayushi) · Invoice INV-V8NHT-1',
    status: 'posted',
    lines: [
      { accountCode: '1100', acct: '1100', accountName: 'Premium Receivable — HIT (Broker Net Remittance)', debit: 36760.00, credit: 0, desc: 'Premium Receivable — HIT (Broker Net Remittance)', dims: { broker: 'HIT', lob: 'Commercial Trucking' } },
      { accountCode: '2200', acct: '2200', accountName: 'Net Premium Payable — Southlake Insurance Co.', debit: 0, credit: 29757.00, desc: 'Net Premium Payable — Southlake Insurance Co.', dims: { 'cost-center': '00 - Corporate', lob: 'Commercial Trucking' } },
      { accountCode: '2300', acct: '2300', accountName: 'Surplus Lines Taxes & Regulatory Fees (TX)', debit: 0, credit: 3503.00, desc: 'Surplus Lines Taxes & Regulatory Fees (TX)', dims: { state: 'TX', lob: 'Commercial Trucking' } },
      { accountCode: '4100', acct: '4100', accountName: 'MGA Program Override & Policy Fee Revenue', debit: 0, credit: 3500.00, desc: 'MGA Program Override & Policy Fee Revenue', dims: { mga: 'NTA', lob: 'Commercial Trucking' } }
    ]
  }
];


