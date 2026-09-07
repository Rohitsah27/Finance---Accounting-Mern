import React, { useState } from 'react';

const DOC_TEMPLATES = [
  { id: 1, name: 'Invoice', desc: 'Customer-facing invoice with itemized line items and payment terms.', sequence: 'INV-{YYYY}-{00000}' },
  { id: 2, name: 'Statement', desc: 'Monthly customer or vendor statement of account.', sequence: 'STMT-{YYYY}-{0000}' },
  { id: 3, name: '1099 Tax Form', desc: 'Year-end vendor tax form (1099-NEC / 1099-MISC).', sequence: 'N/A (annual filing)' },
  { id: 4, name: 'Policy Declaration', desc: 'Insurance policy declarations page for bound coverage.', sequence: 'POL-{YYYY}-{000000}' },
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

export default function DocumentManagementPage() {
  const [tab, setTab] = useState('templates');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
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
              {DOC_TEMPLATES.map((t) => (
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
                    <button className="btn btn-outline btn-sm" onClick={() => showToast(`Previewing ${t.name} template`)}>Preview</button>
                    <button className="btn btn-outline btn-sm" onClick={() => showToast(`Editing ${t.name} layout`)}>Edit Layout</button>
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
    </div>
  );
}
