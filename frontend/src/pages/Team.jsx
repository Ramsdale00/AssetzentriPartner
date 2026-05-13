import React, { useState, useEffect } from 'react'
import client from '../api/client'
import { RolePill } from '../components/Pill'

function InviteModal({ onClose, onSuccess, addToast }) {
  const [form, setForm] = useState({ name: '', email: '', role: 'Seller' })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.email) {
      addToast?.('Name and email are required', 'error')
      return
    }
    setSubmitting(true)
    try {
      const res = await client.post('/team', form)
      addToast?.(`Invite sent to ${form.name}`, 'success')
      onSuccess(res.data)
    } catch (err) {
      addToast?.(err.response?.data?.error || 'Failed to send invite', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Invite Team Member</div>
          <button className="btn-close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                className="form-input"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Jane Smith"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input
                className="form-input"
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="jane@company.com"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select
                className="form-select"
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              >
                <option value="Seller">Seller</option>
                <option value="Read-Only">Read-Only</option>
              </select>
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
              An invitation email will be sent to this address.
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Sending...' : 'Send Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

export default function Team({ addToast }) {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [removing, setRemoving] = useState(null)

  useEffect(() => {
    client.get('/team')
      .then((res) => setMembers(res.data))
      .catch(() => addToast?.('Failed to load team', 'error'))
      .finally(() => setLoading(false))
  }, [])

  const handleInviteSuccess = (newMember) => {
    setMembers(prev => [...prev, newMember])
    setShowInvite(false)
  }

  const handleRemove = async (member) => {
    if (!window.confirm(`Remove ${member.name} from the team?`)) return
    setRemoving(member.id)
    try {
      await client.delete(`/team/${member.id}`)
      setMembers(prev => prev.filter(m => m.id !== member.id))
      addToast?.(`${member.name} removed from team`, 'success')
    } catch (err) {
      addToast?.(err.response?.data?.error || 'Failed to remove member', 'error')
    } finally {
      setRemoving(null)
    }
  }

  return (
    <div style={{ animation: 'fadeUp 0.2s ease' }}>
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Team</h1>
          <p className="page-subtitle">Manage your partner portal users.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowInvite(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Invite Team Member
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--muted)', padding: 40 }}>No team members</td></tr>
              ) : members.map(member => (
                <tr key={member.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: 'var(--teal)', color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 600, flexShrink: 0
                      }}>
                        {getInitials(member.name)}
                      </div>
                      <span style={{ fontWeight: 500 }}>{member.name}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--muted)', fontSize: 13 }}>{member.email}</td>
                  <td><RolePill role={member.role} /></td>
                  <td>
                    <div className="status-dot">
                      <div className={`dot dot-${member.status.toLowerCase()}${member.status === 'Invited' ? ' dot-pulse' : ''}`} />
                      <span>{member.status}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {member.role !== 'Admin' && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleRemove(member)}
                        disabled={removing === member.id}
                      >
                        {removing === member.id ? '...' : 'Remove'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showInvite && (
        <InviteModal
          onClose={() => setShowInvite(false)}
          onSuccess={handleInviteSuccess}
          addToast={addToast}
        />
      )}
    </div>
  )
}
