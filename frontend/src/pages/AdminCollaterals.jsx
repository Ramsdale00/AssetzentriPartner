import React, { useState, useEffect } from 'react'
import client from '../api/client'
import Modal from '../components/Modal'

function FileTypeBadge({ type }) {
  const cls = { PDF: 'type-pdf', XLSX: 'type-xlsx', ZIP: 'type-zip', MP4: 'type-mp4' }[type] || 'type-pdf'
  return <span className={`file-type-badge ${cls}`}>{type}</span>
}

function AddItemModal({ folders, onClose, onSuccess, addToast }) {
  const [form, setForm] = useState({
    folder_id: folders[0]?.id || '', name: '', type: 'PDF', size: '', version: '1.0',
    description: '', must_read: false, must_read_note: '',
  })
  const [saving, setSaving] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    if (!form.folder_id || !form.name.trim()) { addToast?.('Folder and name are required', 'error'); return }
    setSaving(true)
    try {
      const res = await client.post('/admin/collaterals/items', form)
      addToast?.('Collateral added', 'success')
      onSuccess(res.data)
    } catch (err) {
      addToast?.(err.response?.data?.error || 'Failed to add', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title="Add Collateral"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" form="add-collateral-form" disabled={saving}>{saving ? 'Saving…' : 'Add'}</button>
        </>
      }
    >
      <form id="add-collateral-form" onSubmit={submit}>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Folder *</label>
            <select className="form-select" value={form.folder_id} onChange={set('folder_id')}>
              {folders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Name *</label>
            <input className="form-input" value={form.name} onChange={set('name')} placeholder="Q3 Pricing Guide" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Type</label>
              <select className="form-select" value={form.type} onChange={set('type')}>
                {['PDF', 'XLSX', 'ZIP', 'MP4'].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Size</label>
              <input className="form-input" value={form.size} onChange={set('size')} placeholder="2.4 MB" />
            </div>
            <div className="form-group">
              <label className="form-label">Version</label>
              <input className="form-input" value={form.version} onChange={set('version')} placeholder="1.0" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" rows={2} value={form.description} onChange={set('description')} />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.must_read} onChange={set('must_read')} /> Mark as must-read
          </label>
          {form.must_read && (
            <div className="form-group" style={{ marginTop: 8 }}>
              <label className="form-label">Must-read note</label>
              <input className="form-input" value={form.must_read_note} onChange={set('must_read_note')} placeholder="Review before customer calls" />
            </div>
          )}
        </div>
      </form>
    </Modal>
  )
}

export default function AdminCollaterals({ addToast }) {
  const [folders, setFolders] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newFolder, setNewFolder] = useState('')

  const load = () => client.get('/collaterals').then((res) => setFolders(res.data)).catch(() => addToast?.('Failed to load', 'error')).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const addFolder = async () => {
    if (!newFolder.trim()) return
    try {
      await client.post('/admin/collaterals/folders', { name: newFolder.trim(), sort_order: folders.length })
      setNewFolder('')
      addToast?.('Folder added', 'success')
      load()
    } catch (err) {
      addToast?.(err.response?.data?.error || 'Failed to add folder', 'error')
    }
  }

  const deleteItem = async (item) => {
    if (!window.confirm(`Delete "${item.name}"?`)) return
    try {
      await client.delete(`/admin/collaterals/items/${item.id}`)
      addToast?.('Collateral removed', 'success')
      load()
    } catch (err) {
      addToast?.('Failed to remove', 'error')
    }
  }

  const deleteFolder = async (folder) => {
    if (!window.confirm(`Delete folder "${folder.name}" and all its files?`)) return
    try {
      await client.delete(`/admin/collaterals/folders/${folder.id}`)
      addToast?.('Folder removed', 'success')
      load()
    } catch (err) {
      addToast?.('Failed to remove folder', 'error')
    }
  }

  if (loading) return <div className="loading-center"><div className="spinner" /></div>

  return (
    <div style={{ animation: 'fadeUp 0.2s ease' }}>
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Manage Collaterals</h1>
          <p className="page-subtitle">Add, organise, and remove sales enablement materials for all partners.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)} disabled={folders.length === 0}>+ Add Collateral</button>
      </div>

      <div className="card" style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
        <input className="form-input" style={{ maxWidth: 320 }} value={newFolder} onChange={(e) => setNewFolder(e.target.value)} placeholder="New folder name" aria-label="New folder name" />
        <button className="btn btn-secondary" onClick={addFolder}>Add folder</button>
      </div>

      {folders.length === 0 ? (
        <div className="card empty-state">
          <p>No folders yet. Create your first folder to start adding collaterals.</p>
        </div>
      ) : folders.map((folder) => (
        <div className="card" key={folder.id} style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 className="section-heading" style={{ margin: 0 }}>{folder.name} <span style={{ color: 'var(--muted)', fontWeight: 400 }}>({folder.items?.length || 0})</span></h3>
            <button className="btn btn-danger btn-sm" onClick={() => deleteFolder(folder)}>Delete folder</button>
          </div>
          {(folder.items || []).length === 0 ? (
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>No files in this folder.</div>
          ) : folder.items.map((item) => (
            <div key={item.id} className="file-item">
              <FileTypeBadge type={item.type} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: 14 }}>{item.name}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>v{item.version || '1.0'} · {item.size} · {item.updated_label}</div>
              </div>
              <button className="btn btn-danger btn-sm" onClick={() => deleteItem(item)}>Remove</button>
            </div>
          ))}
        </div>
      ))}

      {showAdd && (
        <AddItemModal
          folders={folders}
          onClose={() => setShowAdd(false)}
          onSuccess={() => { setShowAdd(false); load() }}
          addToast={addToast}
        />
      )}
    </div>
  )
}
