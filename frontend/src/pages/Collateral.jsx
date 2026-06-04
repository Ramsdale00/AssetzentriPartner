import React, { useState, useEffect } from 'react'
import client from '../api/client'
import Modal from '../components/Modal'
import { rowActivation } from '../utils/a11y'

function FileTypeBadge({ type }) {
  const cls = { PDF: 'type-pdf', XLSX: 'type-xlsx', ZIP: 'type-zip', MP4: 'type-mp4' }[type] || 'type-pdf'
  return <span className={`file-type-badge ${cls}`}>{type}</span>
}

function FolderIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
}

// Trigger a browser download from a Blob response.
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function safeName(name) {
  return String(name).replace(/[^a-z0-9._-]+/gi, '_').replace(/^_+|_+$/g, '') || 'collateral'
}

function CobrandModal({ onClose, addToast }) {
  const [template, setTemplate] = useState('standard')
  const [generating, setGenerating] = useState(false)
  const [done, setDone] = useState(false)

  const templates = [
    { id: 'standard', name: 'Standard One-Pager', desc: 'Clean layout with your logo + AssetZentri branding' },
    { id: 'enterprise', name: 'Enterprise Template', desc: 'Executive summary style with a bold header' },
    { id: 'technical', name: 'Technical Overview', desc: 'Feature-focused layout for technical buyers' },
  ]

  const generate = async () => {
    setGenerating(true)
    try {
      const res = await client.post('/collaterals/cobrand', { template }, { responseType: 'blob' })
      const name = templates.find((t) => t.id === template)?.name || 'one-pager'
      downloadBlob(res.data, `AssetZentri-${safeName(name)}.pdf`)
      setDone(true)
      addToast?.('Co-branded one-pager downloaded', 'success')
    } catch (err) {
      addToast?.('Failed to generate one-pager', 'error')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Modal
      title={done ? 'One-Pager Ready' : 'Generate Co-Branded One-Pager'}
      onClose={onClose}
      footer={
        done ? (
          <>
            <button className="btn btn-secondary" onClick={onClose}>Close</button>
            <button className="btn btn-primary" onClick={generate} disabled={generating}>{generating ? 'Generating…' : 'Download again'}</button>
          </>
        ) : (
          <>
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={generate} disabled={generating}>{generating ? 'Generating…' : 'Generate One-Pager'}</button>
          </>
        )
      }
    >
      <div className="modal-body">
        {done ? (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#F0FDF4', color: '#15803D', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <p style={{ fontSize: 14, color: 'var(--ink)' }}>Your co-branded PDF has been generated using your company profile.</p>
            <p style={{ fontSize: 12, color: 'var(--muted)' }}>Tip: keep your logo and description up to date in <strong>Settings</strong> for the best results.</p>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
              Select a template. Your company details from your profile are merged with AssetZentri branding into a downloadable PDF.
            </p>
            {templates.map((t) => (
              <div
                key={t.id}
                {...rowActivation(() => setTemplate(t.id), `Select ${t.name}`)}
                style={{
                  padding: '12px 14px',
                  border: `2px solid ${template === t.id ? 'var(--teal)' : 'var(--line)'}`,
                  borderRadius: 8, cursor: 'pointer', marginBottom: 10,
                  background: template === t.id ? 'rgba(15,139,139,0.04)' : 'var(--paper)',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3 }}>{t.name}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{t.desc}</div>
              </div>
            ))}
          </>
        )}
      </div>
    </Modal>
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
  const [downloadingId, setDownloadingId] = useState(null)

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
    if (!search.trim()) { setSearchResults([]); return }
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

  const handleDownload = async (item) => {
    setDownloadingId(item.id)
    try {
      const res = await client.get(`/collaterals/${item.id}/download`, { responseType: 'blob' })
      downloadBlob(res.data, `${safeName(item.name)}.pdf`)
      addToast?.(`Downloaded: ${item.name}`, 'success')
    } catch (err) {
      addToast?.('Download failed', 'error')
    } finally {
      setDownloadingId(null)
    }
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

      <div className="search-bar" style={{ maxWidth: '100%', marginBottom: 20 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input
          type="text"
          placeholder="Search collaterals..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label="Search collaterals"
        />
        {searching && <div className="spinner" style={{ width: 14, height: 14 }} />}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16 }}>
        {!search.trim() && (
          <div className="card" style={{ padding: '12px 10px', alignSelf: 'start' }}>
            <ul className="folder-list">
              {folders.map(folder => (
                <li
                  key={folder.id}
                  className={`folder-item${activeFolder === folder.id ? ' active' : ''}`}
                  {...rowActivation(() => setActiveFolder(folder.id), `Open folder ${folder.name}`)}
                >
                  <FolderIcon />
                  <span>{folder.name}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--muted)' }}>{folder.items?.length || 0}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

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
                  {item.version ? `v${item.version} · ` : ''}{item.size} · {item.updated_label}
                  {search.trim() && item.folder_name && (<span style={{ marginLeft: 6 }}>· {item.folder_name}</span>)}
                </div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => handleDownload(item)} disabled={downloadingId === item.id}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                {downloadingId === item.id ? 'Downloading…' : 'Download'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {showCobrand && <CobrandModal onClose={() => setShowCobrand(false)} addToast={addToast} />}
    </div>
  )
}
