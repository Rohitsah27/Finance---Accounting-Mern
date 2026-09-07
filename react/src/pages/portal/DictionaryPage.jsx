import React, { useState, useMemo } from 'react';
import { MODULES, TERMS } from '../../data/dictionaryData';

export function DictionaryPage() {
  const [terms, setTerms] = useState(TERMS);
  const [activeMod, setActiveMod] = useState('all');
  const [activeSrc, setActiveSrc] = useState('all');
  const [searchQ, setSearchQ] = useState('');
  const [expandedTerms, setExpandedTerms] = useState({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Add term form state
  const [newName, setNewName] = useState('');
  const [newModule, setNewModule] = useState('Accounting & Finance');
  const [newSource, setNewSource] = useState('veridex');
  const [newTags, setNewTags] = useState('');
  const [newDef, setNewDef] = useState('');

  const showToast = (msg, type = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const toggleExpand = (name) => {
    setExpandedTerms(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const filteredTerms = useMemo(() => {
    return terms.filter(t => {
      // Source filter
      if (activeSrc !== 'all') {
        if (activeSrc === 'both' && t.source !== 'both') return false;
        if (activeSrc !== 'both' && t.source !== activeSrc && t.source !== 'both') return false;
      }
      // Module filter
      if (activeMod !== 'all' && t.module !== activeMod) return false;
      // Search query
      if (searchQ.trim()) {
        const q = searchQ.toLowerCase();
        const inName = t.name.toLowerCase().includes(q);
        const inDef = t.definition.toLowerCase().includes(q);
        const inTags = t.tags.some(tag => tag.toLowerCase().includes(q));
        if (!inName && !inDef && !inTags) return false;
      }
      return true;
    });
  }, [terms, activeMod, activeSrc, searchQ]);

  const handleSaveTerm = (e) => {
    e.preventDefault();
    if (!newName || !newDef) {
      showToast('Term name and definition are required', 'error');
      return;
    }
    const created = {
      name: newName,
      source: newSource,
      module: newModule,
      tags: newTags.split(',').map(s => s.trim()).filter(Boolean),
      definition: newDef
    };
    setTerms([created, ...terms]);
    setIsAddModalOpen(false);
    setNewName('');
    setNewTags('');
    setNewDef('');
    showToast(`Added "${created.name}" to dictionary.`);
  };

  const naicCount = terms.filter(t => t.source === 'naic').length;
  const slCount = terms.filter(t => t.source === 'veridex').length;

  return (
    <div style={{ paddingBottom: '40px' }}>
      {toastMessage && (
        <div className={`veridex-toast veridex-toast-${toastMessage.type}`}>
          <span>{toastMessage.type === 'error' ? '✕' : '✓'}</span>
          <span>{toastMessage.msg}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '16px' }}>
        <div>
          <h1 className="page-title">Finance &amp; Insurance Dictionary</h1>
          <div className="page-subtitle">
            Enterprise definitions, regulatory frameworks, NAIC standards, and operational accounting glossary.
          </div>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline" onClick={() => setIsExportModalOpen(true)}>
            Export Glossary
          </button>
          <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
            + Add Term
          </button>
        </div>
      </div>

      {/* Top Search & Source Filter Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        flexWrap: 'wrap',
        background: '#fff',
        border: '1px solid var(--color-border)',
        borderRadius: '10px',
        padding: '12px 16px',
        marginBottom: '16px'
      }}>
        {/* Search input */}
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <input
            type="text"
            className="filter-input"
            style={{ width: '100%', paddingLeft: '32px' }}
            placeholder="Search terms, definitions, tags..."
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
          />
          <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }}>
            🔍
          </span>
          {searchQ && (
            <button
              type="button"
              onClick={() => setSearchQ('')}
              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-muted)' }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Source Pills */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-muted)', marginRight: '4px' }}>
            Source:
          </span>
          {['all', 'naic', 'veridex', 'both'].map((src) => (
            <button
              key={src}
              type="button"
              onClick={() => setActiveSrc(src)}
              style={{
                padding: '5px 12px',
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: 600,
                border: '1px solid',
                borderColor: activeSrc === src ? 'var(--color-brand)' : 'var(--color-border)',
                background: activeSrc === src ? 'var(--color-brand)' : '#fff',
                color: activeSrc === src ? '#fff' : 'var(--color-ink)',
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {src === 'veridex' ? 'VeriDex' : src}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="stats-row" style={{ marginBottom: '16px' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#EFF6FF', color: '#1D4ED8' }}>📖</div>
          <div className="stat-info">
            <div className="stat-value">{terms.length}</div>
            <div className="stat-label">Total Terms</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#DCFCE7', color: '#15803D' }}>🏛️</div>
          <div className="stat-info">
            <div className="stat-value">{naicCount}</div>
            <div className="stat-label">NAIC Standard</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#FEF3C7', color: '#B45309' }}>⚡</div>
          <div className="stat-info">
            <div className="stat-value">{slCount}</div>
            <div className="stat-label">VeriDex Specific</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#EDE9FE', color: '#7C3AED' }}>📁</div>
          <div className="stat-info">
            <div className="stat-value">10</div>
            <div className="stat-label">Functional Modules</div>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout: Module Nav & Term Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '16px', alignItems: 'start' }}>
        {/* Left Module Navigation */}
        <div className="card" style={{ padding: '12px', position: 'sticky', top: '70px' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--color-muted)', padding: '6px 8px 10px' }}>
            Browse By Module
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {MODULES.map((m) => {
              const count = m.id === 'all' ? terms.length : terms.filter(t => t.module === m.id).length;
              const isActive = activeMod === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setActiveMod(m.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    background: isActive ? 'rgba(249, 115, 22, 0.12)' : 'transparent',
                    color: isActive ? 'var(--color-brand)' : 'var(--color-ink)',
                    cursor: 'pointer',
                    fontSize: '12.5px',
                    fontWeight: isActive ? 700 : 500,
                    textAlign: 'left',
                    transition: 'all .12s ease'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: m.color }}></span>
                    <span>{m.label}</span>
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontVariantNumeric: 'tabular-nums' }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Term Cards List */}
        <div>
          <div style={{ fontSize: '12px', color: 'var(--color-muted)', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>
              Showing <strong style={{ color: 'var(--color-ink)' }}>{filteredTerms.length}</strong> matching entries
            </span>
            {activeMod !== 'all' && (
              <span className="v-badge-config">Module: {activeMod}</span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredTerms.map((t) => {
              const isOpen = Boolean(expandedTerms[t.name]);
              return (
                <div
                  key={t.name}
                  className="card"
                  style={{
                    padding: 0,
                    overflow: 'hidden',
                    borderColor: isOpen ? 'var(--color-brand)' : undefined,
                    transition: 'border-color .15s ease'
                  }}
                >
                  <div
                    onClick={() => toggleExpand(t.name)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      cursor: 'pointer',
                      background: isOpen ? '#FAFBFD' : '#fff'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '4px',
                        background: 'var(--color-surface)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        color: 'var(--color-muted)'
                      }}>
                        {isOpen ? '▼' : '▶'}
                      </span>
                      <strong style={{ fontSize: '14px', color: 'var(--color-ink)' }}>
                        {t.name}
                      </strong>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span className={`badge ${
                        t.source === 'naic' ? 'badge-blue' :
                        t.source === 'veridex' ? 'badge-amber' : 'badge-green'
                      }`}>
                        {t.source === 'naic' ? 'NAIC' : t.source === 'veridex' ? 'VeriDex' : 'NAIC & VeriDex'}
                      </span>
                      <span className="v-badge-config" style={{ fontSize: '11px' }}>
                        {t.module}
                      </span>
                    </div>
                  </div>

                  {/* Expanded Body */}
                  {isOpen && (
                    <div style={{
                      padding: '14px 20px',
                      borderTop: '1px solid var(--color-border)',
                      background: '#fff'
                    }}>
                      <p style={{ fontSize: '13px', lineHeight: 1.65, color: 'var(--color-ink-secondary)', margin: 0 }}>
                        {t.definition}
                      </p>

                      {t.tags && t.tags.length > 0 && (
                        <div style={{ display: 'flex', gap: '6px', marginTop: '12px', flexWrap: 'wrap' }}>
                          {t.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              style={{
                                fontSize: '11px',
                                background: 'var(--color-surface)',
                                color: 'var(--color-muted)',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                border: '1px solid var(--color-border)'
                              }}
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {filteredTerms.length === 0 && (
              <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔍</div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-ink)' }}>No terms found</h3>
                <p style={{ fontSize: '13px', color: 'var(--color-muted)', marginTop: '4px' }}>
                  No matching dictionary terms match your filters or search query.
                </p>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  style={{ marginTop: '12px' }}
                  onClick={() => { setActiveMod('all'); setActiveSrc('all'); setSearchQ(''); }}
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Term Modal */}
      {isAddModalOpen && (
        <div
          className="sl-modal-overlay"
          style={{ display: 'flex' }}
          onClick={(e) => { if (e.target === e.currentTarget) setIsAddModalOpen(false); }}
        >
          <div className="sl-modal" style={{ maxWidth: '560px', width: '95%' }}>
            <div className="sl-modal-header">
              <h3 className="sl-modal-title">Add New Dictionary Term</h3>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setIsAddModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveTerm}>
              <div className="sl-modal-body" style={{ padding: '20px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <label className="field-label">Term Name *</label>
                  <input
                    className="field-input"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Schedule F Penalty Factor"
                    required
                  />
                </div>
                <div className="form-grid-3" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: '12px' }}>
                  <div>
                    <label className="field-label">Module *</label>
                    <select
                      className="field-input"
                      value={newModule}
                      onChange={(e) => setNewModule(e.target.value)}
                    >
                      {MODULES.filter(m => m.id !== 'all').map(m => (
                        <option key={m.id} value={m.id}>{m.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="field-label">Source *</label>
                    <select
                      className="field-input"
                      value={newSource}
                      onChange={(e) => setNewSource(e.target.value)}
                    >
                      <option value="veridex">VeriDex</option>
                      <option value="naic">NAIC Standard</option>
                      <option value="both">Both</option>
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label className="field-label">Tags (comma-separated)</label>
                  <input
                    className="field-input"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    placeholder="e.g. Reinsurance, Solvency, Reporting"
                  />
                </div>
                <div>
                  <label className="field-label">Authoritative Definition *</label>
                  <textarea
                    className="field-input"
                    rows={4}
                    value={newDef}
                    onChange={(e) => setNewDef(e.target.value)}
                    placeholder="Provide full legal and accounting context..."
                    required
                  />
                </div>
              </div>
              <div className="sl-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', padding: '14px 20px', borderTop: '1px solid var(--color-border)' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Term</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {isExportModalOpen && (
        <div
          className="sl-modal-overlay"
          style={{ display: 'flex' }}
          onClick={(e) => { if (e.target === e.currentTarget) setIsExportModalOpen(false); }}
        >
          <div className="sl-modal" style={{ maxWidth: '600px', width: '95%' }}>
            <div className="sl-modal-header">
              <h3 className="sl-modal-title">Export Dictionary JSON</h3>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setIsExportModalOpen(false)}>✕</button>
            </div>
            <div className="sl-modal-body" style={{ padding: '20px' }}>
              <pre style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '11px',
                maxHeight: '300px',
                overflow: 'auto',
                fontFamily: 'monospace'
              }}>
                {JSON.stringify(terms, null, 2)}
              </pre>
            </div>
            <div className="sl-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', padding: '14px 20px', borderTop: '1px solid var(--color-border)' }}>
              <button type="button" className="btn btn-outline" onClick={() => setIsExportModalOpen(false)}>Close</button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  navigator.clipboard?.writeText(JSON.stringify(terms, null, 2));
                  showToast('Copied JSON payload to clipboard!');
                  setIsExportModalOpen(false);
                }}
              >
                Copy to Clipboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
