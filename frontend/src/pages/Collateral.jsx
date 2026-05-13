import React, { useState, useEffect } from 'react'
import client from '../api/client'

function FileTypeBadge({ type }) {
  const cls = { PDF: 'type-pdf', XLSX: 'type-xlsx', ZIP: 'type-zip', MP4: 'type-mp4' }[type] || 'type-pdf'
  return <span className={`file-type-badge ${cls}`}>{type}</span>
}

function FolderIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
}

function CobrандModal({ onClose, addToast }) {
  const [step, setStep] = useState(1)
  const [template, setTemplate] = useState('standard')
  const [generating, setGenerating] = useState(false)

  const templates = [
    { id: 'standard', name: 'Standard One-Pager', desc: 'Clean two-column layout with your logo + AssetZentri branding' },
    { id: 'enterprise', name: 'Enterprise Template', desc: 'Full-page executive summary style with dark header' },
    { id: 'technical', name: 'Technical Overview', desc: 'Feature-focused layout with spec table and integration diagram' },
  ]

  const generate = () => {
    setGenerating(true)
    setTimeout(() => {
      setGenerating(false)
      setStep(2)
    }, 1500)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            {step === 1 ? 'Generate Co-Branded One-Pager' : 'One-Pager Ready!'}
          </div>
          <button className="btn-close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="modal-body">
          {step === 1 ? (
            <>
              <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
                Select a template. Your company logo will be automatically added alongside AssetZentri branding.
              </p>
              {templates.map(t => (
                <div
                  key={t.id}
                  onClick={() => setTemplate(t.id)}
                  style={{
                    padding: '12px 14px',
                    border: `2px solid ${template === t.id ? 'var(--teal)' : 'var(--line)'}`,
                    borderRadius: 8,
                    cursor: 'pointer',
                    marginBottom: 10,
                    background: template === t.id ? 'rgba(15,139,139,0.04)' : 'var(--paper)',
                    transition: 'all 0.12s'
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3 }}>{t.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{t.desc}</div>
                </div>
              ))}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{
                width: 60, height: 60, borderRadius: '50%',
                background: '#F0FDF4', color: '#15803D',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px', fontSize: 28
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Your one-pager is ready!</div>
              <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>
                The co-branded PDF has been generated using the <strong>{templates.find(t => t.id === template)?.name}</strong> template.
              </p>
              <button
                className="btn btn-primary"
                onClick={() => { addToast?.('Downloading co-branded one-pager...', 'info'); onClose() }}
              >
                Download PDF
              </button>
            </div>
          )}
        </div>

        {step === 1 && (
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={generate} disabled={generating}>
              {generating ? 'Generating...' : 'Generate One-Pager'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Collateral({ addToast }) {
  const [folders, setFolders] = useState([])
  const [activeFolder, setActiveFolder] = useState(null)
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showCobrand, setShowCobrand] = useState(false)

  useEffect(() => {
    client.get('/collaterals')
      .then((res) => {
        setFolders(res.data)
        if (res.data.length > 0) setActiveFolder(res.data[0].id)
      })
      .catch(() => addToast?.('Failed to load collaterals', 'error'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!search.trim()) {
      setSearchResults([])
      return
    }
    const timer = setTimeout(() => {
      setSearching(true)
      client.get(`/collaterals/search?q=${encodeURIComponent(search)}`)
        .then((res) => setSearchResults(res.data))
        .catch(() => {})
        .finally(() => setSearching(false))
    }, 250)
    return () => clearTimeout(timer)
  }, [search])

  const currentFolder = folders.find(f => f.id === activeFolder)
  const displayItems = search.trim() ? searchResults : currentFolder?.items || []

  const handleDownload = (item) => {
    addToast?.(`Downloading: ${item.name}`, 'info')
  }

  if (loading) return <div className="loading-center"><div className="spinner" /></div>

  return (
    <div style={{ animation: 'fadeUp 0.2s ease' }}>
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Product Collaterals</h1>
          <p className="page-subtitle">Sales resources, battle cards, and documentation.</p>
        </div>
        <button className="btn btn-secondary" onClick={() => setShowCobrand(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
          Generate Co-Branded One-Pager
        </button>
      </div>

      {/* Search */}
      <div className="search-bar" style={{ maxWidth: '100%', marginBottom: 20 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input
          type="text"
          placeholder="Search collaterals..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {searching && <div className="spinner" style={{ width: 14, height: 14 }} />}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16 }}>
        {/* Folder sidebar */}
        {!search.trim() && (
          <div className="card" style={{ padding: '12px 10px', alignSelf: 'start' }}>
            <ul className="folder-list">
              {folders.map(folder => (
                <li
                  key={folder.id}
                  className={`folder-item${activeFolder === folder.id ? ' active' : ''}`}
                  onClick={() => setActiveFolder(folder.id)}
                >
                  <FolderIcon />
                  <span>{folder.name}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--muted)' }}>{folder.items?.length || 0}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* File list */}
        <div className="card" style={{ gridColumn: search.trim() ? '1 / -1' : 'auto' }}>
          <h3 className="section-heading" style={{ marginBottom: 16 }}>
            {search.trim() ? `Results for "${search}"` : currentFolder?.name}
          </h3>

          {displayItems.length === 0 ? (
            <div style={{ color: 'var(--muted)', fontSize: 13, padding: '20px 0' }}>
              {search.trim() ? 'No collaterals found' : 'No files in this folder'}
            </div>
          ) : displayItems.map(item => (
            <div key={item.id} className="file-item">
              <FileTypeBadge type={item.type} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: 14 }}>
                  {item.name}
                  {item.must_read && (
                    <span className="must-read-badge">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                      Must Read{item.must_read_note ? ` · ${item.must_read_note}` : ''}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                  {item.size} · {item.updated_label}
                  {search.trim() && item.folder_name && (
                    <span style={{ marginLeft: 6 }}>· {item.folder_name}</span>
                  )}
                </div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => handleDownload(item)}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download
              </button>
            </div>
          ))}
        </div>
      </div>

      {showCobrand && (
        <CobrандModal onClose={() => setShowCobrand(false)} addToast={addToast} />
      )}
    </div>
  )
}
