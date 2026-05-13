import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../api/client'
import { TierPill } from '../components/Pill'

function formatCurrency(val) {
  if (!val) return '$0'
  if (val >= 1000000) return `$${(val / 1000000).toFixed(2)}M`
  if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`
  return `$${Number(val).toLocaleString()}`
}

function AddPartnerModal({ onClose, onSuccess, addToast }) {
  const [step, setStep] = useState(1)
  const [details, setDetails] = useState({
    name: '', tier: 'Silver', country: '', psm: '',
    contact_name: '', contact_email: '', contact_phone: ''
  })
  const [teamMembers, setTeamMembers] = useState([{ name: '', email: '', role: 'Admin' }])
  const [submitting, setSubmitting] = useState(false)

  const addTeamRow = () => setTeamMembers(prev => [...prev, { name: '', email: '', role: 'Seller' }])
  const removeTeamRow = (i) => setTeamMembers(prev => prev.filter((_, idx) => idx !== i))
  const updateTeam = (i, field, val) => setTeamMembers(prev => prev.map((m, idx) => idx === i ? { ...m, [field]: val } : m))

  const handleSubmit = async () => {
    if (!details.name || !details.tier || !details.country) {
      addToast?.('Partner name, tier, and country are required', 'error')
      return
    }
    setSubmitting(true)
    try {
      const res = await client.post('/admin/partners', {
        ...details,
        team_members: teamMembers.filter(m => m.name && m.email)
      })
      addToast?.(`Partner ${details.name} added!`, 'success')
      onSuccess(res.data)
    } catch (err) {
      addToast?.(err.response?.data?.error || 'Failed to add partner', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Add New Partner</div>
          <button className="btn-close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="modal-body">
          {/* Wizard steps */}
          <div className="wizard-steps">
            <div className="wizard-step">
              <div className={`wizard-step-num ${step >= 1 ? (step > 1 ? 'done' : 'active') : ''}`}>
                {step > 1 ? '✓' : '1'}
              </div>
              <div className={`wizard-step-label ${step === 1 ? 'active' : ''}`}>Partner Details</div>
            </div>
            <div className="wizard-divider" />
            <div className="wizard-step">
              <div className={`wizard-step-num ${step === 2 ? 'active' : ''}`}>2</div>
              <div className={`wizard-step-label ${step === 2 ? 'active' : ''}`}>Team Members</div>
            </div>
          </div>

          {step === 1 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Company Name *</label>
                <input className="form-input" value={details.name} onChange={e => setDetails(d => ({ ...d, name: e.target.value }))} placeholder="Acme Partners Ltd" />
              </div>
              <div className="form-group">
                <label className="form-label">Tier *</label>
                <select className="form-select" value={details.tier} onChange={e => setDetails(d => ({ ...d, tier: e.target.value }))}>
                  <option value="Gold">Gold</option>
                  <option value="Silver">Silver</option>
                  <option value="Bronze">Bronze</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Country *</label>
                <input className="form-input" value={details.country} onChange={e => setDetails(d => ({ ...d, country: e.target.value }))} placeholder="United Kingdom" />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Partner Success Manager</label>
                <input className="form-input" value={details.psm} onChange={e => setDetails(d => ({ ...d, psm: e.target.value }))} placeholder="Riya Chen" />
              </div>
              <div style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--line)', paddingTop: 16, marginBottom: 8 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--ink)', marginBottom: 12 }}>Primary Contact</div>
              </div>
              <div className="form-group">
                <label className="form-label">Contact Name</label>
                <input className="form-input" value={details.contact_name} onChange={e => setDetails(d => ({ ...d, contact_name: e.target.value }))} placeholder="Jane Smith" />
              </div>
              <div className="form-group">
                <label className="form-label">Contact Email</label>
                <input className="form-input" type="email" value={details.contact_email} onChange={e => setDetails(d => ({ ...d, contact_email: e.target.value }))} placeholder="jane@company.com" />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" value={details.contact_phone} onChange={e => setDetails(d => ({ ...d, contact_phone: e.target.value }))} placeholder="+44 20 7946 0000" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
                Add initial team members for this partner. You can skip and add them later.
              </p>
              {teamMembers.map((member, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: 8, marginBottom: 8, alignItems: 'end' }}>
                  <div>
                    {i === 0 && <label className="form-label">Name</label>}
                    <input className="form-input" value={member.name} onChange={e => updateTeam(i, 'name', e.target.value)} placeholder="Jane Smith" />
                  </div>
                  <div>
                    {i === 0 && <label className="form-label">Email</label>}
                    <input className="form-input" type="email" value={member.email} onChange={e => updateTeam(i, 'email', e.target.value)} placeholder="jane@company.com" />
                  </div>
                  <div>
                    {i === 0 && <label className="form-label">Role</label>}
                    <select className="form-select" value={member.role} onChange={e => updateTeam(i, 'role', e.target.value)}>
                      <option value="Admin">Admin</option>
                      <option value="Seller">Seller</option>
                      <option value="Read-Only">Read-Only</option>
                    </select>
                  </div>
                  <div style={{ paddingBottom: 1 }}>
                    {i === 0 && <div style={{ height: 22 }} />}
                    {teamMembers.length > 1 && (
                      <button className="btn btn-ghost btn-sm" onClick={() => removeTeamRow(i)} style={{ color: 'var(--danger)' }}>✕</button>
                    )}
                  </div>
                </div>
              ))}
              <button className="btn btn-ghost btn-sm" onClick={addTeamRow} style={{ marginTop: 4 }}>
                + Add another member
              </button>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          {step === 1 && (
            <button className="btn btn-primary" onClick={() => setStep(2)}>
              Next: Team Members
            </button>
          )}
          {step === 2 && (
            <>
              <button className="btn btn-secondary" onClick={() => setStep(1)}>Back</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Partner'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AdminPartners({ addToast }) {
  const [partners, setPartners] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    client.get('/admin/partners')
      .then((res) => setPartners(res.data))
      .catch(() => addToast?.('Failed to load partners', 'error'))
      .finally(() => setLoading(false))
  }, [])

  const handleAddSuccess = (newPartner) => {
    setPartners(prev => [...prev, { ...newPartner, team_count: 0, active_deals: 0, pipeline_value: 0, onboarding_done: 0, onboarding_total: 8 }])
    setShowAdd(false)
  }

  return (
    <div style={{ animation: 'fadeUp 0.2s ease' }}>
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Partners</h1>
          <p className="page-subtitle">All partners in the AssetZentri programme.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Partner
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Partner</th>
                <th>Tier</th>
                <th>Country</th>
                <th>Team</th>
                <th>Onboarding</th>
                <th>Active Deals</th>
                <th>Pipeline</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {partners.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--muted)', padding: 40 }}>No partners</td></tr>
              ) : partners.map(p => {
                const pct = p.onboarding_total > 0
                  ? Math.round((Number(p.onboarding_done) / Number(p.onboarding_total)) * 100)
                  : 0
                return (
                  <tr key={p.id} className="clickable" onClick={() => navigate(`/admin/partners/${p.id}`)}>
                    <td>
                      <div style={{ fontWeight: 500 }}>
                        {p.name}
                        {p.is_custom && <span className="new-badge">NEW</span>}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>PSM: {p.psm || '—'}</div>
                    </td>
                    <td><TierPill tier={p.tier} /></td>
                    <td style={{ fontSize: 13 }}>{p.country}</td>
                    <td style={{ fontSize: 13 }}>{Number(p.team_count)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div className="mini-progress">
                          <div className="mini-progress-fill" style={{ width: `${pct}%` }} />
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--muted)' }}>{Number(p.onboarding_done)}/{Number(p.onboarding_total)}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: 13 }}>{Number(p.active_deals)}</td>
                    <td style={{ fontWeight: 500, fontSize: 13 }}>{formatCurrency(Number(p.pipeline_value))}</td>
                    <td>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {showAdd && (
        <AddPartnerModal
          onClose={() => setShowAdd(false)}
          onSuccess={handleAddSuccess}
          addToast={addToast}
        />
      )}
    </div>
  )
}
