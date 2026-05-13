import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../api/client'
import { StagePill, TierPill } from '../components/Pill'

function formatCurrency(val) {
  if (val >= 1000000) return `$${(val / 1000000).toFixed(2)}M`
  if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`
  return `$${val?.toLocaleString() || 0}`
}

function ProtectionCell({ days }) {
  if (days === 0) return <span className="protection-days protection-expired">Expired</span>
  if (days < 30) return <span className="protection-days protection-warn">{days}d</span>
  return <span className="protection-days protection-ok">{days}d</span>
}

function RegisterLeadModal({ onClose, onSuccess, addToast, existingDeals }) {
  const [form, setForm] = useState({
    company: '', country: '', contact: '', email: '', phone: '',
    devices: '', tier: 'Standard', close_date: '', source: 'Direct', notes: ''
  })
  const [conflict, setConflict] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (field, value) => {
    const updated = { ...form, [field]: value }
    setForm(updated)

    // Conflict detection
    if (field === 'company' && value.trim()) {
      const match = existingDeals.find(d =>
        d.company.toLowerCase() === value.trim().toLowerCase()
      )
      setConflict(match || null)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.company || !form.devices || !form.tier) {
      addToast?.('Please fill in required fields', 'error')
      return
    }
    setSubmitting(true)
    try {
      const deal = await client.post('/deals', form)
      addToast?.(`Deal ${deal.data.deal_id} registered!`, 'success')
      onSuccess(deal.data)
    } catch (err) {
      addToast?.(err.response?.data?.error || 'Failed to register deal', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Register New Lead</div>
          <button className="btn-close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {conflict && (
              <div className="conflict-alert">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span>
                  Potential duplicate: <strong>{conflict.deal_id}</strong> already exists for {conflict.company} ({conflict.stage} stage).
                  You may still proceed.
                </span>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Company Name *</label>
                <input className="form-input" value={form.company} onChange={e => handleChange('company', e.target.value)} placeholder="Acme Corp" required />
              </div>
              <div className="form-group">
                <label className="form-label">Country</label>
                <input className="form-input" value={form.country} onChange={e => handleChange('country', e.target.value)} placeholder="United Kingdom" />
              </div>
              <div className="form-group">
                <label className="form-label">Contact Name</label>
                <input className="form-input" value={form.contact} onChange={e => handleChange('contact', e.target.value)} placeholder="Jane Smith" />
              </div>
              <div className="form-group">
                <label className="form-label">Contact Email</label>
                <input className="form-input" type="email" value={form.email} onChange={e => handleChange('email', e.target.value)} placeholder="jane@acme.com" />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" value={form.phone} onChange={e => handleChange('phone', e.target.value)} placeholder="+44 20 7946 0000" />
              </div>
              <div className="form-group">
                <label className="form-label">Number of Devices *</label>
                <input className="form-input" type="number" min="1" value={form.devices} onChange={e => handleChange('devices', e.target.value)} placeholder="250" required />
              </div>
              <div className="form-group">
                <label className="form-label">Subscription Tier *</label>
                <select className="form-select" value={form.tier} onChange={e => handleChange('tier', e.target.value)}>
                  <option value="Standard">Standard</option>
                  <option value="Premium">Premium</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Expected Close Date</label>
                <input className="form-input" type="date" value={form.close_date} onChange={e => handleChange('close_date', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Lead Source</label>
                <select className="form-select" value={form.source} onChange={e => handleChange('source', e.target.value)}>
                  <option value="Direct">Direct</option>
                  <option value="Referral">Referral</option>
                  <option value="Event">Event</option>
                  <option value="Inbound">Inbound</option>
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Notes</label>
                <textarea className="form-textarea" value={form.notes} onChange={e => handleChange('notes', e.target.value)} placeholder="Any relevant context about this deal..." />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Registering...' : 'Register Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Leads({ addToast, checklist }) {
  const [deals, setDeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const navigate = useNavigate()

  const onboardingComplete = checklist && checklist.length > 0
    ? checklist.every(s => s.done)
    : false

  useEffect(() => {
    client.get('/deals')
      .then((res) => setDeals(res.data))
      .catch(() => addToast?.('Failed to load deals', 'error'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = deals.filter(d => {
    const matchFilter = filter === 'All' ? true :
      filter === 'Active' ? !['Won', 'Lost'].includes(d.stage) :
      filter === 'Won' ? d.stage === 'Won' : true
    const matchSearch = !search ||
      d.company.toLowerCase().includes(search.toLowerCase()) ||
      d.deal_id.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  const handleRegisterSuccess = (newDeal) => {
    setDeals(prev => [newDeal, ...prev])
    setShowModal(false)
  }

  return (
    <div style={{ animation: 'fadeUp 0.2s ease' }}>
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Lead Registration</h1>
          <p className="page-subtitle">Manage and track your registered deals.</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowModal(true)}
          disabled={!onboardingComplete}
          title={!onboardingComplete ? 'Complete onboarding to register leads' : ''}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Register Lead
        </button>
      </div>

      {!onboardingComplete && (
        <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#C2410C', marginBottom: 16 }}>
          Complete your onboarding checklist to unlock lead registration.
        </div>
      )}

      <div className="filter-bar">
        {['All', 'Active', 'Won'].map(f => (
          <button
            key={f}
            className={`filter-tab${filter === f ? ' active' : ''}`}
            onClick={() => setFilter(f)}
          >{f}</button>
        ))}
        <div className="search-bar" style={{ marginLeft: 'auto' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            type="text"
            placeholder="Search deals..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Deal ID</th>
                <th>Company</th>
                <th>Country</th>
                <th>Tier / Devices</th>
                <th>Stage</th>
                <th>Protection</th>
                <th>ARR</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--muted)', padding: 40 }}>No deals found</td></tr>
              ) : filtered.map(deal => (
                <tr
                  key={deal.id}
                  className="clickable"
                  onClick={() => navigate(`/leads/${deal.deal_id}`)}
                >
                  <td><span className="deal-id">{deal.deal_id}</span></td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{deal.company}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{deal.contact}</div>
                  </td>
                  <td>{deal.country}</td>
                  <td>
                    <TierPill tier={deal.tier} />
                    <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 6 }}>{deal.devices?.toLocaleString()} devices</span>
                  </td>
                  <td><StagePill stage={deal.stage} /></td>
                  <td>
                    {deal.protection_days === 0
                      ? <span className="protection-days protection-expired">Expired</span>
                      : deal.protection_days < 30
                        ? <span className="protection-days protection-warn">{deal.protection_days}d</span>
                        : <span className="protection-days protection-ok">{deal.protection_days}d</span>
                    }
                  </td>
                  <td style={{ fontWeight: 500 }}>{formatCurrency(deal.annual_value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <RegisterLeadModal
          onClose={() => setShowModal(false)}
          onSuccess={handleRegisterSuccess}
          addToast={addToast}
          existingDeals={deals}
        />
      )}
    </div>
  )
}
