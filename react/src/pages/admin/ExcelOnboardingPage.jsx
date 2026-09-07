import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const UPLOAD_TYPES = [
  { id: 'coa', label: 'Chart of Accounts', desc: 'Import custom GL account structure, account numbers, names, and normal balances.' },
  { id: 'vendors', label: 'Vendor Master', desc: 'Import supplier and contractor profiles, tax IDs (W-9), and payment terms.' },
  { id: 'customers', label: 'Customer / Insured Master', desc: 'Import policyholders, corporate clients, billing addresses, and payment profiles.' },
  { id: 'balances', label: 'Opening Balances', desc: 'Import trial balance debits and credits as of the migration cutover date.' },
  { id: 'policies', label: 'Policy / Bordereau Feed', desc: 'Import policy records, gross written premium, effective dates, and line of business.' },
  { id: 'commissions', label: 'Commission Schedules', desc: 'Import broker commission tier matrices, producer splits, and override schedules.' },
];

export default function ExcelOnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0); // 0: Select, 1: Upload, 2: Map, 3: Review
  const [selectedType, setSelectedType] = useState(null);
  const [fileDetected, setFileDetected] = useState(false);
  const [toast, setToast] = useState(null);

  // Column mapping state
  const [mappings, setMappings] = useState([
    { source: 'Account_Num', target: 'account_number', confidence: 98, status: 'Matched' },
    { source: 'Account_Title', target: 'account_name', confidence: 96, status: 'Matched' },
    { source: 'Classification', target: 'account_type', confidence: 92, status: 'Matched' },
    { source: 'DR_CR_Indicator', target: 'normal_balance', confidence: 88, status: 'Matched' },
    { source: 'Notes_Field', target: 'description', confidence: 75, status: 'Uncertain' },
  ]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSelectType = (id) => {
    setSelectedType(id);
    setFileDetected(false);
    setStep(1);
  };

  const handleSimulateFile = () => {
    setFileDetected(true);
    showToast('Spreadsheet detected: "Migration_Master_2026.xlsx" (542 rows, 5 columns)');
  };

  const handleCommit = () => {
    showToast('Import committed successfully! 542 records added to the ledger.');
    setTimeout(() => {
      navigate('/chart-of-accounts');
    }, 1500);
  };

  const currentTypeObj = UPLOAD_TYPES.find(t => t.id === selectedType);

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
          <h1 className="page-title">Bulk Excel &amp; CSV Onboarding Importer</h1>
          <p className="page-subtitle">AI-assisted schema mapping, data validation, and master file ingestion</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline" onClick={() => navigate('/admin-config')}>Back to Admin</button>
        </div>
      </div>

      {/* Stepper */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        {['1. Select Data Type', '2. Upload File', '3. Map Columns', '4. Review & Commit'].map((label, idx) => (
          <div
            key={label}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '6px',
              background: step === idx ? 'var(--navy)' : step > idx ? 'rgba(16, 42, 46, 0.08)' : 'var(--gray-100)',
              color: step === idx ? '#fff' : step > idx ? 'var(--navy)' : 'var(--gray-500)',
              fontWeight: step === idx || step > idx ? 700 : 500,
              fontSize: '13px',
              textAlign: 'center'
            }}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="card" style={{ padding: '28px' }}>
        {step === 0 && (
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 16px 0' }}>What master or transactional data are you importing?</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {UPLOAD_TYPES.map((t) => (
                <div
                  key={t.id}
                  onClick={() => handleSelectType(t.id)}
                  style={{
                    border: '1.5px solid var(--gray-200)',
                    borderRadius: '8px',
                    padding: '18px',
                    cursor: 'pointer',
                    background: '#fff',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '14.5px', color: 'var(--navy)' }}>{t.label}</h4>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--gray-500)' }}>{t.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
                Upload Source File: {currentTypeObj?.label}
              </h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setStep(0)}>&larr; Change Type</button>
            </div>

            <div
              onClick={handleSimulateFile}
              style={{
                border: '2px dashed var(--gray-300)',
                borderRadius: '8px',
                padding: '40px 20px',
                textAlign: 'center',
                background: fileDetected ? 'rgba(34, 197, 94, 0.05)' : 'var(--gray-50)',
                borderColor: fileDetected ? 'var(--green)' : 'var(--gray-300)',
                cursor: 'pointer',
                marginBottom: '20px'
              }}
            >
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>{fileDetected ? '📄' : '📤'}</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--gray-800)' }}>
                {fileDetected ? 'Migration_Master_2026.xlsx Ready' : 'Drag & drop Excel or CSV file here, or click to browse'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--gray-500)', marginTop: '4px' }}>
                Supports .xlsx, .xls, and .csv up to 50MB
              </div>
            </div>

            {fileDetected && (
              <div style={{ background: 'var(--gray-50)', padding: '14px 18px', borderRadius: '6px', marginBottom: '20px', fontSize: '12.5px', color: 'var(--gray-700)' }}>
                <strong>Detected 5 columns:</strong> Account_Num, Account_Title, Classification, DR_CR_Indicator, Notes_Field &bull; <strong>542 total rows detected</strong>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn btn-outline" onClick={() => setStep(0)}>&larr; Back</button>
              <button
                className="btn btn-primary"
                disabled={!fileDetected}
                onClick={() => setStep(2)}
              >
                Continue to Column Mapping &rarr;
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Map File Columns to Veridex Schema</h3>
                <p style={{ fontSize: '12px', color: 'var(--gray-500)', margin: '4px 0 0 0' }}>AI has pre-matched columns based on header semantics and sample row values</p>
              </div>
              <span className="badge badge-green">4 High Confidence Matches</span>
            </div>

            <table className="data-table" style={{ marginBottom: '20px' }}>
              <thead>
                <tr>
                  <th>File Column (Source)</th>
                  <th>Target Field in Veridex</th>
                  <th>AI Confidence</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {mappings.map((m, idx) => (
                  <tr key={idx}>
                    <td className="font-mono font-semibold">{m.source}</td>
                    <td>
                      <select
                        className="field-input"
                        value={m.target}
                        onChange={(e) => {
                          const updated = [...mappings];
                          updated[idx].target = e.target.value;
                          setMappings(updated);
                        }}
                        style={{ maxWidth: '240px' }}
                      >
                        <option value="account_number">account_number (Unique ID)</option>
                        <option value="account_name">account_name (Label)</option>
                        <option value="account_type">account_type (Category)</option>
                        <option value="normal_balance">normal_balance (Debit/Credit)</option>
                        <option value="description">description (Optional Memo)</option>
                        <option value="ignore">-- Skip / Do Not Import --</option>
                      </select>
                    </td>
                    <td>
                      <span className="font-mono" style={{ color: m.confidence >= 90 ? 'var(--green)' : 'var(--orange)' }}>
                        {m.confidence}%
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${m.status === 'Matched' ? 'badge-green' : 'badge-orange'}`}>
                        {m.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button className="btn btn-outline" onClick={() => setStep(1)}>&larr; Back</button>
              <button className="btn btn-primary" onClick={() => setStep(3)}>Proceed to Validation Review &rarr;</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 8px 0' }}>Validation Review &amp; Pre-flight Check</h3>
            <p style={{ fontSize: '12px', color: 'var(--gray-500)', margin: '0 0 20px 0' }}>All 542 rows have been evaluated against database constraints.</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
              <div style={{ padding: '16px', background: 'rgba(34, 197, 94, 0.08)', borderRadius: '8px', border: '1px solid var(--green)' }}>
                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--green)' }}>542</div>
                <div style={{ fontSize: '12px', color: 'var(--gray-700)', fontWeight: 600 }}>Rows Validated</div>
              </div>
              <div style={{ padding: '16px', background: 'rgba(59, 130, 246, 0.08)', borderRadius: '8px', border: '1px solid var(--navy)' }}>
                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--navy)' }}>0</div>
                <div style={{ fontSize: '12px', color: 'var(--gray-700)', fontWeight: 600 }}>Blocking Errors</div>
              </div>
              <div style={{ padding: '16px', background: 'rgba(245, 158, 11, 0.08)', borderRadius: '8px', border: '1px solid #f59e0b' }}>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#f59e0b' }}>2</div>
                <div style={{ fontSize: '12px', color: 'var(--gray-700)', fontWeight: 600 }}>Unmapped Optional Fields</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button className="btn btn-outline" onClick={() => setStep(2)}>&larr; Back to Mapping</button>
              <button className="btn btn-primary" onClick={handleCommit}>Commit 542 Records to Production 🚀</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
