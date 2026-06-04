import React, { useState, useEffect, useRef } from 'react'
import client from '../api/client'
import { fileToLogoDataUrl } from '../utils/logo'

function Field({ label, children, hint }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      {children}
      {hint && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{hint}</div>}
    </div>
  )
}

function LogoField({ value, onChange, addToast }) {
  const [busy, setBusy] = useState(false)
  const inputRef = useRef(null)

  const handleFile = async (e) => {
    const file = e.target.files && e.target.files[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    try {
      onChange(await fileToLogoDataUrl(file))
    } catch (err) {
      addToast?.(err.message || 'Could not load that image.', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      {value && (
        <div style={{ marginBottom: 10, padding: 16, border: '1px solid var(--line)', borderRadius: 10, background: 'var(--surface-2, #fafaf8)', textAlign: 'center' }}>
          <img src={value} alt="Company logo preview" style={{ maxHeight: 80, maxWidth: '100%' }} onError={(e) => { e.target.style.display = 'none' }} />
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} aria-label="Upload company logo" />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => inputRef.current?.click()} disabled={busy}>
          {busy ? 'Processing…' : value ? 'Replace logo' : 'Upload logo'}
        </button>
        {value && (
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => onChange('')} disabled={busy}>Remove</button>
        )}
      </div>
    </div>
  )
}

export default function Settings({ addToast }) {
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  useEffect(() => {
    client.get('/profile')
      .then((res) => {
        setProfile(res.data)
        setForm({
          name: res.data.name || '', website: res.data.website || '', country: res.data.country || '',
          contact_name: res.data.contact_name || '', contact_email: res.data.contact_email || '',
          contact_phone: res.data.contact_phone || '', description: res.data.description || '',
          logo_url: res.data.logo_url || '',
        })
      })
      .catch(() => addToast?.('Failed to load profile', 'error'))
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await client.put('/profile', form)
      setProfile(res.data)
      addToast?.('Profile saved', 'success')
    } catch (err) {
      addToast?.(err.response?.data?.error || 'Failed to save', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (!form) return <div className="loading-center"><div className="spinner" /></div>

  return (
    <div style={{ animation: 'fadeUp 0.2s ease', maxWidth: 720 }}>
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your company profile used across the portal and co-branded materials.</p>
      </div>

      <form onSubmit={submit} className="card">
        <Field label="Company name"><input className="form-input" value={form.name} onChange={set('name')} required /></Field>
        <Field label="Website"><input className="form-input" value={form.website} onChange={set('website')} placeholder="https://example.com" /></Field>
        <Field label="Country"><input className="form-input" value={form.country} onChange={set('country')} /></Field>
        <Field label="Primary contact name"><input className="form-input" value={form.contact_name} onChange={set('contact_name')} /></Field>
        <Field label="Contact email"><input className="form-input" type="email" value={form.contact_email} onChange={set('contact_email')} /></Field>
        <Field label="Contact phone"><input className="form-input" value={form.contact_phone} onChange={set('contact_phone')} /></Field>
        <Field label="Company logo" hint="Used on co-branded one-pagers (PNG or SVG, transparent background recommended).">
          <LogoField value={form.logo_url} onChange={(v) => setForm((f) => ({ ...f, logo_url: v }))} addToast={addToast} />
        </Field>
        <Field label="Company description" hint="A short blurb used on co-branded materials.">
          <textarea className="form-textarea" rows={3} value={form.description} onChange={set('description')} />
        </Field>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8 }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
          {profile?.tier && <span style={{ fontSize: 12, color: 'var(--muted)' }}>Partner tier: <strong>{profile.tier}</strong> · Tier and PSM are managed by AssetZentri.</span>}
        </div>
      </form>
    </div>
  )
}
