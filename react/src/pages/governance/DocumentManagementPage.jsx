import React, { useState } from 'react';

const DOC_TEMPLATES = [
  {
    id: 1, name: 'Invoice', desc: 'Customer-facing invoice with itemized line items and payment terms.', sequence: 'INV-{YYYY}-{00000}',
    header: 'VeriDex Finance System', footer: 'Payment due upon receipt. Thank you for your business.',
    fields: ['Bill To / Insured', 'Line Items & Amounts', 'Payment Terms', 'Total Due']
  },
  {
    id: 2, name: 'Statement', desc: 'Monthly customer or vendor statement of account.', sequence: 'STMT-{YYYY}-{0000}',
    header: 'VeriDex Finance System', footer: 'Contact accounts@veridex.com with any billing questions.',
    fields: ['Account Summary', 'Opening / Closing Balance', 'Transaction History', 'Aging Buckets']
  },
  {
    id: 3, name: '1099 Tax Form', desc: 'Year-end vendor tax form (1099-NEC / 1099-MISC).', sequence: 'N/A (annual filing)',
    header: 'VeriDex Finance System', footer: 'This is an official tax document required for IRS filing.',
    fields: ['Payer Information', 'Recipient TIN', 'Box 1 / Box 7 Amounts', 'Filing Year']
  },
  {
    id: 4, name: 'Policy Declaration', desc: 'Insurance policy declarations page for bound coverage.', sequence: 'POL-{YYYY}-{000000}',
    header: 'VeriDex Finance System', footer: 'This declarations page is evidence of coverage as of the effective date.',
    fields: ['Named Insured', 'Coverage Period', 'Limits & Deductibles', 'Premium Summary']
  },
];

const ATTACHMENTS = [
  { id: 1, file: 'JE-2026-000481-support.pdf', record: 'JE-2026-000481', by: 'Maria Johnson', size: '412 KB', classification: 'Internal' },
  { id: 2, file: 'vendor-w9-acme-supplies.pdf', record: 'Vendor: Acme Supplies', by: 'Robert Patel', size: '188 KB', classification: 'Confidential-PII' },
  { id: 3, file: 'policy-declaration-POL-2026-000204.pdf', record: 'POL-2026-000204', by: 'System', size: '96 KB', classification: 'Public' },
  { id: 4, file: 'bank-statement-aug-2026.pdf', record: 'Bank Reconciliation: Aug 2026', by: 'James Smith', size: '640 KB', classification: 'Confidential-PII' },
  { id: 5, file: 'invoice-INV-2026-01043.pdf', record: 'INV-2026-01043', by: 'System', size: '74 KB', classification: 'Public' },
  { id: 6, file: 'employee-i9-r-patel.pdf', record: 'Employee: Robert Patel', by: 'Payroll Admin', size: '210 KB', classification: 'Confidential-PII' },
];

const ESIGN_DOCS = [
  { id: 1, doc: 'Policy Declaration', record: 'POL-2026-000204', recipient: 'Southlake Insured Co.', status: 'Sent', sent: '2026-08-18' },
  { id: 2, doc: 'Vendor Agreement', record: 'Vendor: Acme Supplies', recipient: 'Acme Supplies AP Contact', status: 'Viewed', sent: '2026-08-17' },
  { id: 3, doc: 'Commission Statement', record: 'Producer: PROD-1188', recipient: 'PROD-1188 Agent', status: 'Signed', sent: '2026-08-10' },
];

// Renders a sample document number from a sequence pattern like
// "INV-{YYYY}-{00000}" — {YYYY} becomes the current year, and any run of
// zeros becomes that many digits of a sample counter (here, 1).
const sampleNumber = (sequence) => {
  const year = new Date().getFullYear();
  return sequence
    .replace('{YYYY}', String(year))
    .replace(/\{(0+)\}/, (_, zeros) => String(1).padStart(zeros.length, '0'));
};

export default function DocumentManagementPage() {
  const [tab, setTab] = useState('templates');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);
  const [templates, setTemplates] = useState(DOC_TEMPLATES);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [editTemplate, setEditTemplate] = useState(null);
  const [editForm, setEditForm] = useState({ header: '', footer: '', sequence: '' });

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const openEditLayout = (t) => {
    setEditTemplate(t);
    setEditForm({ header: t.header, footer: t.footer, sequence: t.sequence });
  };

  const saveEditLayout = (e) => {
    e.preventDefault();
    setTemplates(prev => prev.map(t => t.id === editTemplate.id ? { ...t, ...editForm } : t));
    showToast(`Layout saved for ${editTemplate.name}`);
    setEditTemplate(null);
  };

  const filteredAttachments = ATTACHMENTS.filter(a =>
    a.file.toLowerCase().includes(search.toLowerCase()) || a.record.toLowerCase().includes(search.toLowerCase())
  );

  const getClassificationBadge = (c) => {
    switch (c) {
      case 'Public': return 'badge-green';
      case 'Internal': return 'badge-blue';
      case 'Confidential-PII': return 'badge-red';
      default: return 'badge-gray';
    }
  };

  const getEsignBadge = (s) => {
    switch (s) {
      case 'Signed': return 'badge-green';
      case 'Viewed': return 'badge-blue';
      default: return 'badge-gray';
    }
  };

  return (
    <div className="page-container">
      {toast && (
        <div className="veridex-toast veridex-toast-success">
          <span>✓</span>
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Document Management</h1>
          <p className="page-subtitle">Templates, attachments, and e-signature workflows across all financial modules</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline" onClick={() => showToast('Opening bulk document scanner...')}>Bulk Scan</button>
          <button className="btn btn-primary" onClick={() => showToast('Upload document dialog opened.')}>+ Upload File</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="table-wrap">
        <div className="page-tabs" style={{ background: 'var(--gray-50)', padding: '6px 12px', borderBottom: '1px solid var(--gray-200)' }}>
          <button className={`page-tab ${tab === 'templates' ? 'active' : ''}`} onClick={() => setTab('templates')}>Document Templates</button>
          <button className={`page-tab ${tab === 'attachments' ? 'active' : ''}`} onClick={() => setTab('attachments')}>Attachments Library ({ATTACHMENTS.length})</button>
          <button className={`page-tab ${tab === 'esign' ? 'active' : ''}`} onClick={() => setTab('esign')}>E-Signature Ready ({ESIGN_DOCS.length})</button>
        </div>

        {tab === 'templates' && (
          <div style={{ padding: '20px' }}>
            <p style={{ fontSize: '12px', color: 'var(--gray-500)', marginTop: 0, marginBottom: '16px' }}>
              Each template is bound to the numbering sequence for that document type. Sequences can be configured in the Administration Hub.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {templates.map((t) => (
                <div
                  key={t.id}
                  style={{
                    border: '1px solid var(--gray-200)',
                    borderRadius: '8px',
                    padding: '16px',
                    background: '#fff',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '14px', color: 'var(--gray-900)' }}>{t.name}</strong>
                    <p style={{ fontSize: '12px', color: 'var(--gray-500)', margin: '6px 0 10px 0' }}>{t.desc}</p>
                    <div style={{ fontSize: '11px', color: 'var(--gray-400)', fontFamily: 'var(--font-mono)' }}>{t.sequence}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                    <button className="btn btn-outline btn-sm" onClick={() => setPreviewTemplate(t)}>Preview</button>
                    <button className="btn btn-outline btn-sm" onClick={() => openEditLayout(t)}>Edit Layout</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'attachments' && (
          <div>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--gray-200)', display: 'flex', justifyContent: 'flex-end' }}>
              <input
                type="text"
                className="filter-input"
                placeholder="Search filename or record..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '250px' }}
              />
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Filename</th>
                  <th>Linked Record</th>
                  <th>Uploaded By</th>
                  <th>Size</th>
                  <th>Classification</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttachments.map((a) => (
                  <tr key={a.id}>
                    <td className="font-semibold cell-link" onClick={() => showToast(`Opening ${a.file}`)}>{a.file}</td>
                    <td>{a.record}</td>
                    <td>{a.by}</td>
                    <td className="font-mono text-sm text-muted">{a.size}</td>
                    <td><span className={`badge ${getClassificationBadge(a.classification)}`}>{a.classification}</span></td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => showToast(`Downloading ${a.file}`)}>⬇ Download</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'esign' && (
          <div style={{ padding: '20px' }}>
            <p style={{ fontSize: '12px', color: 'var(--gray-500)', marginTop: 0, marginBottom: '16px' }}>
              Real-time audit log of documents currently routed to customers, vendors, or agents for digital signatures.
            </p>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Linked Record</th>
                  <th>Recipient</th>
                  <th>Status</th>
                  <th>Sent Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {ESIGN_DOCS.map((d) => (
                  <tr key={d.id}>
                    <td className="font-semibold">{d.doc}</td>
                    <td className="cell-link">{d.record}</td>
                    <td>{d.recipient}</td>
                    <td><span className={`badge ${getEsignBadge(d.status)}`}>{d.status}</span></td>
                    <td className="font-mono text-sm">{d.sent}</td>
                    <td>
                      <button className="btn btn-outline btn-sm" onClick={() => showToast(`Resent signature reminder to ${d.recipient}`)}>Remind</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="v-modal-overlay" onClick={() => setPreviewTemplate(null)}>
          <div className="v-modal-card" style={{ maxWidth: '560px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--navy)' }}>
                Preview: {previewTemplate.name}
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setPreviewTemplate(null)} style={{ fontSize: '16px', padding: '0 6px' }}>&times;</button>
            </div>
            <div style={{ border: '1px solid var(--gray-200)', borderRadius: '6px', padding: '20px', background: '#fafafa' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--gray-200)', paddingBottom: '12px', marginBottom: '12px' }}>
                <strong style={{ fontSize: '13px', color: 'var(--gray-900)' }}>{previewTemplate.header}</strong>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase' }}>{previewTemplate.name}</div>
                  <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--gray-500)' }}>
                    {sampleNumber(previewTemplate.sequence)}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {previewTemplate.fields.map((f) => (
                  <div key={f} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '6px 10px', background: '#fff', border: '1px solid var(--gray-100)', borderRadius: '4px' }}>
                    <span style={{ color: 'var(--gray-500)' }}>{f}</span>
                    <span style={{ color: 'var(--gray-400)', fontStyle: 'italic' }}>sample data</span>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: '10.5px', color: 'var(--gray-400)', borderTop: '1px solid var(--gray-200)', paddingTop: '10px' }}>
                {previewTemplate.footer}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <button className="btn btn-outline btn-sm" onClick={() => setPreviewTemplate(null)}>Close</button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => { openEditLayout(previewTemplate); setPreviewTemplate(null); }}
              >
                Edit Layout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Layout Modal */}
      {editTemplate && (
        <div className="v-modal-overlay" onClick={() => setEditTemplate(null)}>
          <div className="v-modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--navy)', marginBottom: '16px' }}>
              Edit Layout: {editTemplate.name}
            </div>
            <form onSubmit={saveEditLayout}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <label className="form-label" style={{ display: 'block', marginBottom: '4px' }}>Header Text</label>
                  <input
                    className="form-ctrl"
                    style={{ width: '100%' }}
                    value={editForm.header}
                    onChange={(e) => setEditForm({ ...editForm, header: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ display: 'block', marginBottom: '4px' }}>Footer Text</label>
                  <input
                    className="form-ctrl"
                    style={{ width: '100%' }}
                    value={editForm.footer}
                    onChange={(e) => setEditForm({ ...editForm, footer: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ display: 'block', marginBottom: '4px' }}>Numbering Sequence</label>
                  <input
                    className="form-ctrl"
                    style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
                    value={editForm.sequence}
                    onChange={(e) => setEditForm({ ...editForm, sequence: e.target.value })}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditTemplate(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">Save Layout</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
