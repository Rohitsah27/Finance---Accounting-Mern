/* ============================================================
   VERIDEX FINANCE SYSTEM - Excel/CSV Onboarding & Mapping Engine
   Generalizes the Southlake "workbook" auto-resolve pattern:
   every row always lands somewhere (fallback to a default/manual
   bucket) rather than being rejected - "no business loses a
   chance to get their data in." Used by excel-onboarding.html and
   reused wherever a module offers bulk import (COA, JE, masters).
   ============================================================ */

const UPLOAD_TYPES = [
  { id: 'journal-lines', label: 'Journal Entry Batch', desc: 'Each row becomes one JE line, auto-tagged with dimensions from the Dimension Master.',
    fields: [
      { key: 'account_code', label: 'Account Code', required: true, type: 'text' },
      { key: 'description', label: 'Line Description', required: true, type: 'text' },
      { key: 'mga', label: 'MGA', required: false, type: 'text' },
      { key: 'state', label: 'State', required: false, type: 'text' },
      { key: 'lob', label: 'Line of Business', required: false, type: 'text' },
      { key: 'debit', label: 'Debit', required: false, type: 'number' },
      { key: 'credit', label: 'Credit', required: false, type: 'number' },
    ]},
  { id: 'coa',        label: 'Chart of Accounts',      desc: 'Account Code, Name, Type, Sub-Type, Currency.',
    fields: [
      { key: 'account_code', label: 'Account Code', required: true,  type: 'text' },
      { key: 'account_name', label: 'Account Name', required: true,  type: 'text' },
      { key: 'account_type', label: 'Account Type', required: true,  type: 'picklist', values: ['Asset','Liability','Equity','Revenue','Expense'] },
      { key: 'account_subtype', label: 'Account Sub-Type', required: false, type: 'text' },
      { key: 'currency', label: 'Currency', required: false, type: 'picklist', values: ['USD','GBP','EUR'] },
    ]},
  { id: 'vendor',     label: 'Vendor Master',           desc: 'Vendor ID, name, EIN/TIN, terms, 1099 status, bank details.',
    fields: [
      { key: 'vendor_id', label: 'Vendor ID', required: false, type: 'text' },
      { key: 'legal_name', label: 'Legal Name', required: true, type: 'text' },
      { key: 'tax_id', label: 'EIN / TIN', required: true, type: 'text' },
      { key: 'payment_terms', label: 'Payment Terms', required: false, type: 'text' },
      { key: 'is_1099', label: '1099 Eligible', required: false, type: 'boolean' },
    ]},
  { id: 'customer',   label: 'Customer / Insured Master', desc: 'Customer type, contact, credit limit, insurance-specific fields.',
    fields: [
      { key: 'customer_id', label: 'Customer ID', required: false, type: 'text' },
      { key: 'legal_name', label: 'Legal Name', required: true, type: 'text' },
      { key: 'customer_type', label: 'Customer Type', required: true, type: 'picklist', values: ['Individual','Business','Government','Insured','Broker','MGA','Reinsurer'] },
      { key: 'credit_limit', label: 'Credit Limit', required: false, type: 'number' },
    ]},
  { id: 'broker',     label: 'Broker / Agency Master',  desc: 'Broker / Agency name, license details, commission agreements, contact info.',
    fields: [
      { key: 'broker_id', label: 'Broker ID', required: false, type: 'text' },
      { key: 'legal_name', label: 'Broker / Agent Name', required: true, type: 'text' },
      { key: 'license_no', label: 'License Number', required: true, type: 'text' },
      { key: 'commission_pct', label: 'Commission Percentage', required: false, type: 'number' },
    ]},
  { id: 'carrier',    label: 'Carrier Master',          desc: 'Insurance Carrier name, NAIC codes, treaty details, bank info.',
    fields: [
      { key: 'carrier_id', label: 'Carrier ID', required: false, type: 'text' },
      { key: 'legal_name', label: 'Carrier Name', required: true, type: 'text' },
      { key: 'naic_code', label: 'NAIC Code', required: true, type: 'text' },
      { key: 'treaty_agreement', label: 'Treaty Agreement Ref', required: false, type: 'text' },
    ]},
  { id: 'opening-balances', label: 'Opening Balances', desc: 'Imported as an Opening Balance JE - validates debit = credit.',
    fields: [
      { key: 'account_code', label: 'Account Code', required: true, type: 'text' },
      { key: 'debit', label: 'Debit', required: false, type: 'number' },
      { key: 'credit', label: 'Credit', required: false, type: 'number' },
      { key: 'as_of_date', label: 'As-Of Date', required: true, type: 'date' },
    ]},
  { id: 'bordereau',  label: 'Policy / Bordereau',      desc: 'AI maps policy/premium fields and auto-reconciles to GL (insurance only).',
    fields: [
      { key: 'policy_number', label: 'Policy Number', required: true, type: 'text' },
      { key: 'mga', label: 'MGA', required: false, type: 'text' },
      { key: 'lob', label: 'Line of Business', required: true, type: 'text' },
      { key: 'state', label: 'State', required: true, type: 'text' },
      { key: 'written_premium', label: 'Written Premium', required: true, type: 'number' },
    ]},
  { id: 'budget',     label: 'Budget Upload',           desc: 'Annual or driver-based budget lines by account & dimension.',
    fields: [
      { key: 'account_code', label: 'Account Code', required: true, type: 'text' },
      { key: 'period', label: 'Period', required: true, type: 'text' },
      { key: 'amount', label: 'Budgeted Amount', required: true, type: 'number' },
      { key: 'dimension', label: 'Dimension (Class/Dept)', required: false, type: 'text' },
    ]},
  { id: 'commission-schedule', label: 'Commission Schedules', desc: 'Tiered/sliding-scale commission plans by producer.',
    fields: [
      { key: 'plan_name', label: 'Plan Name', required: true, type: 'text' },
      { key: 'tier_from', label: 'Tier From (%)', required: false, type: 'number' },
      { key: 'tier_to', label: 'Tier To (%)', required: false, type: 'number' },
      { key: 'rate', label: 'Commission Rate (%)', required: true, type: 'number' },
    ]},
  { id: 'fixed-asset', label: 'Fixed Asset Register',  desc: 'Asset cost, category, useful life, depreciation method.',
    fields: [
      { key: 'asset_tag', label: 'Asset Tag', required: true, type: 'text' },
      { key: 'description', label: 'Description', required: true, type: 'text' },
      { key: 'cost', label: 'Acquisition Cost', required: true, type: 'number' },
      { key: 'useful_life_years', label: 'Useful Life (yrs)', required: true, type: 'number' },
      { key: 'depreciation_method', label: 'Depreciation Method', required: false, type: 'picklist', values: ['Straight-Line','Declining Balance','Double Declining','MACRS'] },
    ]},
  { id: 'employee',   label: 'Employee Master (Payroll)', desc: 'Triggers a W-4 / onboarding workflow per employee.',
    fields: [
      { key: 'employee_id', label: 'Employee ID', required: false, type: 'text' },
      { key: 'full_name', label: 'Full Name', required: true, type: 'text' },
      { key: 'ssn', label: 'SSN', required: true, type: 'text' },
      { key: 'annual_salary', label: 'Annual Salary', required: false, type: 'number' },
      { key: 'department', label: 'Department', required: false, type: 'text' },
    ]},
];

function getUploadType(id) { return UPLOAD_TYPES.find(t => t.id === id) || UPLOAD_TYPES[0]; }

/* Simulated "detected columns from the uploaded file" - in the real system this comes from
   parsing row 1 of the workbook (see excel-parser.service.ts pattern in Southlake_service). */
const SIMULATED_SOURCE_COLUMNS = {
  'journal-lines': ['Acct', 'Line Desc', 'MGA', 'St', 'LOB', 'Dr Amt', 'Cr Amt'],
  coa: ['Acct Num', 'Acct Description', 'Type', 'Sub Type', 'Ccy', 'Notes'],
  vendor: ['Vendor No', 'Vendor Legal Name', 'Fed Tax ID', 'Terms', '1099?', 'Extra Col A'],
  customer: ['Cust ID', 'Insured / Customer Name', 'Type', 'Credit Limit ($)', 'Region'],
  'opening-balances': ['GL Acct', 'Dr Amount', 'Cr Amount', 'Balance Date'],
  bordereau: ['Policy No', 'MGA Name', 'Coverage', 'St', 'Written Prem', 'Effective Date'],
  budget: ['Account', 'FY Period', 'Budget $', 'Class/Dept'],
  'commission-schedule': ['Plan', 'From %', 'To %', 'Rate %'],
  'fixed-asset': ['Tag #', 'Asset Description', 'Cost $', 'Life (yrs)', 'Method'],
  employee: ['Emp #', 'Name', 'SSN/TIN', 'Salary $', 'Dept'],
};

/* Very small fuzzy scorer: token overlap between source column name and target field label/key. */
function fuzzyScore(sourceCol, targetField) {
  const norm = s => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(' ').filter(Boolean);
  const a = new Set(norm(sourceCol));
  const b = new Set([...norm(targetField.label), ...norm(targetField.key)]);
  let overlap = 0;
  a.forEach(tok => { if ([...b].some(t => t.includes(tok) || tok.includes(t))) overlap++; });
  const base = Math.round((overlap / Math.max(a.size, 1)) * 70);
  return Math.min(97, base + 28); // keep floor high enough that a fallback suggestion always exists
}

/* Auto-suggest a mapping for every source column against the upload type's target fields,
   always returning a best-guess even at low confidence (never blocks the import). */
function autoSuggestMapping(uploadTypeId) {
  const type = getUploadType(uploadTypeId);
  const columns = SIMULATED_SOURCE_COLUMNS[uploadTypeId] || [];
  const used = new Set();
  return columns.map(col => {
    let best = null, bestScore = -1;
    type.fields.forEach(f => {
      const score = fuzzyScore(col, f);
      if (score > bestScore) { bestScore = score; best = f; }
    });
    const target = used.has(best.key) ? null : best;
    if (target) used.add(target.key);
    return { sourceColumn: col, targetField: target ? target.key : null, targetLabel: target ? target.label : ' - Do not import - ', confidence: target ? bestScore : 0 };
  });
}

/* ---------- Saved mapping templates: "have we mapped this kind of file before?" ----------
   Mirrors config.import_mapping_templates - once a mapping is saved for an upload type,
   the NEXT upload of that type is matched against it automatically instead of re-running
   AI suggestion from scratch. New columns in the file that aren't in the saved template are
   ignored (non-blocking); columns the template expects that are missing from the file are
   surfaced as a validation error, since that's a real data-quality problem, not a guess. */
const MAPPING_TEMPLATE_KEY = 'v_saved_mapping_templates';

function getSavedMappingTemplates() {
  try { return JSON.parse(localStorage.getItem(MAPPING_TEMPLATE_KEY) || '{}'); } catch (e) { return {}; }
}

function getSavedMappingTemplate(uploadTypeId) {
  return getSavedMappingTemplates()[uploadTypeId] || null;
}

function saveMappingTemplate(uploadTypeId, mapping, name) {
  const all = getSavedMappingTemplates();
  all[uploadTypeId] = {
    name: name || (getUploadType(uploadTypeId).label + ' - Saved Mapping'),
    savedAt: new Date().toISOString(),
    columnMapping: mapping.filter(m => m.targetField).map(m => ({ sourceColumn: m.sourceColumn, targetField: m.targetField })),
  };
  localStorage.setItem(MAPPING_TEMPLATE_KEY, JSON.stringify(all));
  return all[uploadTypeId];
}

function clearSavedMappingTemplate(uploadTypeId) {
  const all = getSavedMappingTemplates();
  delete all[uploadTypeId];
  localStorage.setItem(MAPPING_TEMPLATE_KEY, JSON.stringify(all));
}

/* Match a new file's detected columns against a previously saved template.
   Returns null if there is no saved template yet for this upload type. */
function applySavedMappingTemplate(uploadTypeId, detectedColumns) {
  const template = getSavedMappingTemplate(uploadTypeId);
  if (!template) return null;
  const type = getUploadType(uploadTypeId);
  const mapping = detectedColumns.map(col => {
    const known = template.columnMapping.find(m => m.sourceColumn.toLowerCase() === col.toLowerCase());
    if (known) {
      const field = type.fields.find(f => f.key === known.targetField);
      return { sourceColumn: col, targetField: field ? field.key : null, targetLabel: field ? field.label : '(field no longer exists)', confidence: 99, fromTemplate: true };
    }
    return { sourceColumn: col, targetField: null, targetLabel: '(new column, not in saved mapping, ignored)', confidence: 0, extra: true };
  });
  const missingRequired = template.columnMapping
    .filter(m => !detectedColumns.some(c => c.toLowerCase() === m.sourceColumn.toLowerCase()))
    .map(m => type.fields.find(f => f.key === m.targetField) || { key: m.targetField, label: m.sourceColumn, required: false })
    .filter(f => f.required);
  return {
    template,
    mapping,
    extras: mapping.filter(m => m.extra),
    missingRequired,
  };
}

function missingRequiredFields(uploadTypeId, mapping) {
  const type = getUploadType(uploadTypeId);
  const mapped = new Set(mapping.map(m => m.targetField).filter(Boolean));
  return type.fields.filter(f => f.required && !mapped.has(f.key));
}

/* ---------- Dynamic target-field mapping: purchaser-extensible, not a fixed schema ----------
   A tenant's own DB rarely matches our canned upload types field-for-field. This lets a user
   add their own target fields to any upload type at mapping time (e.g. "Reinsurer Ext",
   "Program Code") so a source column can be mapped to it, exactly like the reference
   Southlake pattern where new attributes get added to the resolver rather than rejected. */
function addCustomTargetField(uploadTypeId, fieldDef) {
  const type = getUploadType(uploadTypeId);
  const key = fieldDef.key || fieldDef.label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'custom_field';
  if (type.fields.some(f => f.key === key)) return type.fields.find(f => f.key === key);
  const field = {
    key,
    label: fieldDef.label || key,
    required: !!fieldDef.required,
    type: fieldDef.type || 'text',
    custom: true,
    basis: fieldDef.basis || null,
  };
  type.fields.push(field);
  return field;
}

/* Calculation/transformation rules a user can apply to a mapped column - the same idea as
   the platform spec's "Transformation Rules" (e.g. "Convert 1/0 to Y/N", "Split Full Name").
   Kept as a catalogue rather than hardcoded per-field so new rules can be added the same way
   custom fields are. */
const CALCULATION_OPTIONS = [
  { id: 'none',           label: 'None, direct copy' },
  { id: 'sum',             label: 'Sum across matching rows' },
  { id: 'average',         label: 'Average across matching rows' },
  { id: 'pct-premium',     label: '% of Written Premium' },
  { id: 'convert-sign',    label: 'Convert sign (debit/credit flip)' },
  { id: 'multiply-rate',   label: 'Multiply by a rate field' },
  { id: 'split-text',      label: 'Split text into multiple fields' },
  { id: 'custom',          label: 'Custom formula...' },
];

function addCalculationOption(option) {
  const id = option.id || option.label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  if (CALCULATION_OPTIONS.some(c => c.id === id)) return;
  CALCULATION_OPTIONS.push({ id, label: option.label, custom: true });
}
