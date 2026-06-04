import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import client from '../api/client'
import { StagePill, TierPill } from '../components/Pill'
import Breadcrumbs from '../components/Breadcrumbs'
import Modal from '../components/Modal'

const STAGES = ['Qualified', 'Demo', 'Proposal', 'Legal', 'Won', 'Lost']

function formatCurrency(val) {
  if (!val) return '$0'
  if (val >= 1000000) return `$${(val / 1000000).toFixed(2)}M`
  if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`
  return `$${val.toLocaleString()}`
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatDateTime(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

function CommentAvatar({ author }) {
  const isVistrive = author.toLowerCase().includes('vistrive') || author.toLowerCase().includes('ae')
  return (
    <div className="comment-avatar" style={{ background: isVistrive ? 'var(--teal)' : 'var(--ink-2)' }}>
      {getInitials(author)}
    </div>
  )
}

// ── Edit deal modal ───────────────────────────────────────────────────────────
function EditDealModal({ deal, onClose, onSaved, addToast }) {
  const [form, setForm] = useState({
    company: deal.company || '', country: deal.country || '', contact: deal.contact || '',
    email: deal.email || '', phone: deal.phone || '', devices: deal.devices || '',
    tier: deal.tier || 'Standard', close_date: deal.close_date ? deal.close_date.slice(0, 10) : '',
    source: deal.source || 'Direct', notes: deal.notes || '',
  })
  const [saving, setSaving] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    if (!form.company || !form.devices) { addToast?.('Company and devices are required', 'error'); return }
    setSaving(true)
    try {
      const res = await client.put(`/deals/${deal.deal_id}`, form)
      addToast?.('Deal updated', 'success')
      onSaved(res.data)
    } catch (err) {
      addToast?.(err.response?.data?.error || 'Failed to update deal', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title="Edit Deal"
      size="lg"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" form="edit-deal-form" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
        </>
      }
    >
      <form id="edit-deal-form" onSubmit={submit}>
        <div className="modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Company Name *</label>
              <input className="form-input" value={form.company} onChange={set('company')} required />
            </div>
            <div className="form-group"><label className="form-label">Country</label><input className="form-input" value={form.country} onChange={set('country')} /></div>
            <div className="form-group"><label className="form-label">Contact Name</label><input className="form-input" value={form.contact} onChange={set('contact')} /></div>
            <div className="form-group"><label className="form-label">Contact Email</label><input className="form-input" type="email" value={form.email} onChange={set('email')} /></div>
            <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={form.phone} onChange={set('phone')} /></div>
            <div className="form-group"><label className="form-label">Number of Devices *</label><input className="form-input" type="number" min="1" value={form.devices} onChange={set('devices')} required /></div>
            <div className="form-group">
              <label className="form-label">Subscription Tier</label>
              <select className="form-select" value={form.tier} onChange={set('tier')}>
                <option value="Standard">Standard</option>
                <option value="Premium">Premium</option>
              </select>
            </div>
            <div className="form-group"><label className="form-label">Expected Close Date</label><input className="form-input" type="date" value={form.close_date} onChange={set('close_date')} /></div>
            <div className="form-group">
              <label className="form-label">Lead Source</label>
              <select className="form-select" value={form.source} onChange={set('source')}>
                {['Direct', 'Referral', 'Event', 'Inbound'].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Notes</label>
              <textarea className="form-textarea" value={form.notes} onChange={set('notes')} />
            </div>
          </div>
        </div>
      </form>
    </Modal>
  )
}

// ── Win/Loss reason modal ─────────────────────────────────────────────────────
function CloseReasonModal({ stage, onClose, onConfirm }) {
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const confirm = async () => {
    setBusy(true)
    await onConfirm(reason)
    setBusy(false)
  }
  return (
    <Modal
      title={`Mark deal as ${stage}`}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={confirm} disabled={busy}>{busy ? 'Saving…' : `Confirm ${stage}`}</button>
        </>
      }
    >
      <div className="modal-body">
        <div className="form-group">
          <label className="form-label">{stage === 'Won' ? 'What made this deal successful?' : 'Why was this deal lost?'}</label>
          <textarea className="form-textarea" value={reason} onChange={(e) => setReason(e.target.value)} placeholder={stage === 'Won' ? 'e.g. Strong fit, annual prepay discount' : 'e.g. Lost to competitor on price'} style={{ minHeight: 90 }} />
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>This reason is recorded on the deal timeline.</div>
        </div>
      </div>
    </Modal>
  )
}

export default function DealDetail({ addToast }) {
  const { dealId } = useParams()
  const navigate = useNavigate()
  const [deal, setDeal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updatingStage, setUpdatingStage] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [addingComment, setAddingComment] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [closeTarget, setCloseTarget] = useState(null)

  const loadDeal = () =>
    client.get(`/deals/${dealId}`)
      .then((res) => setDeal(res.data))
      .catch(() => { addToast?.('Deal not found', 'error'); navigate('/leads') })

  useEffect(() => {
    loadDeal().finally(() => setLoading(false))
  }, [dealId])

  const applyStage = async (stage, reason) => {
    setUpdatingStage(true)
    try {
      await client.put(`/deals/${dealId}/stage`, { stage, reason })
      await loadDeal()
      addToast?.(`Stage updated to ${stage}`, 'success')
    } catch (err) {
      addToast?.(err.response?.data?.error || 'Failed to update stage', 'error')
    } finally {
      setUpdatingStage(false)
      setCloseTarget(null)
    }
  }

  const onStageClick = (stage) => {
    if (deal.stage === stage) return
    if (stage === 'Won' || stage === 'Lost') { setCloseTarget(stage); return }
    applyStage(stage)
  }

  const addComment = async (e) => {
    e.preventDefault()
    if (!commentText.trim()) return
    setAddingComment(true)
    try {
      const res = await client.post(`/deals/${dealId}/comments`, { text: commentText })
      setDeal(prev => ({ ...prev, comments: [...(prev.comments || []), res.data] }))
      setCommentText('')
      addToast?.('Note added', 'success')
    } catch (err) {
      addToast?.('Failed to add note', 'error')
    } finally {
      setAddingComment(false)
    }
  }

  if (loading) return <div className="loading-center"><div className="spinner" /><span>Loading deal...</span></div>
  if (!deal) return null

  const protDays = deal.protection_days
  const protClass = protDays === 0 ? 'protection-expired' : protDays < 30 ? 'protection-warn' : 'protection-ok'
  const isPending = deal.stage === 'Registered'

  return (
    <div style={{ animation: 'fadeUp 0.2s ease' }}>
      <Breadcrumbs items={[{ label: 'Lead Registration', to: '/leads' }, { label: deal.deal_id }]} />

      <button className="btn btn-ghost btn-sm" style={{ marginBottom: 16 }} onClick={() => navigate('/leads')}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        Back to Leads
      </button>

      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <span className="deal-id" style={{ fontSize: 14 }}>{deal.deal_id}</span>
            <StagePill stage={deal.stage} />
            <TierPill tier={deal.tier} />
          </div>
          <h1 className="page-title" style={{ marginBottom: 4 }}>{deal.company}</h1>
          <p className="page-subtitle">{deal.country} · Registered {formatDate(deal.registered_date)}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: 26, fontWeight: 600 }}>{formatCurrency(deal.annual_value)}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>Annual value</div>
          <button className="btn btn-secondary btn-sm" style={{ marginTop: 10 }} onClick={() => setShowEdit(true)}>Edit deal</button>
        </div>
      </div>

      <div className="two-col-60-40">
        {/* Left — stage tracker + timeline + comments */}
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 className="section-heading">Deal Stage</h3>
            {isPending ? (
              <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 8, padding: '12px 14px', fontSize: 13, color: '#C2410C' }}>
                This deal is <strong>pending approval</strong> by AssetZentri partner operations. You'll be notified once it's approved, after which you can advance it through the pipeline.
              </div>
            ) : (
              <>
                <div className="stage-tracker">
                  {STAGES.map(stage => (
                    <button
                      key={stage}
                      className={`stage-btn${deal.stage === stage ? ' active' : ''}`}
                      onClick={() => onStageClick(stage)}
                      disabled={updatingStage}
                    >
                      {stage}
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>Click a stage to update the deal status</div>
                {deal.close_reason && (
                  <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 10 }}>
                    <strong>{deal.stage} reason:</strong> {deal.close_reason}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Stage timeline */}
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 className="section-heading">Stage Timeline</h3>
            {(!deal.stage_history || deal.stage_history.length === 0) ? (
              <div style={{ color: 'var(--muted)', fontSize: 13, padding: '8px 0' }}>No stage changes recorded yet.</div>
            ) : (
              <ol className="timeline">
                {deal.stage_history.map((h) => (
                  <li key={h.id} className="timeline-item">
                    <span className="timeline-dot" aria-hidden="true" />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>
                        {h.from_stage ? `${h.from_stage} → ${h.to_stage}` : h.to_stage}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                        {formatDateTime(h.created_at)}{h.actor ? ` · ${h.actor}` : ''}
                      </div>
                      {(h.reason || h.note) && (
                        <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 2 }}>{h.reason || h.note}</div>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div className="card">
            <h3 className="section-heading">Comments & Notes</h3>
            <div style={{ marginBottom: 16 }}>
              {(!deal.comments || deal.comments.length === 0) ? (
                <div style={{ color: 'var(--muted)', fontSize: 13, padding: '12px 0' }}>No comments yet</div>
              ) : deal.comments.map(c => (
                <div key={c.id} className="comment">
                  <div className="comment-header">
                    <CommentAvatar author={c.author} />
                    <span className="comment-author">{c.author}</span>
                    <span className="comment-time">{formatDate(c.created_at)}</span>
                  </div>
                  <div className="comment-text">{c.text}</div>
                </div>
              ))}
            </div>

            <form onSubmit={addComment}>
              <div className="form-group" style={{ marginBottom: 8 }}>
                <label className="form-label" htmlFor="deal-note">Add a note</label>
                <textarea
                  id="deal-note"
                  className="form-textarea"
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="Add a note or update..."
                  style={{ minHeight: 70 }}
                />
              </div>
              <button type="submit" className="btn btn-secondary btn-sm" disabled={addingComment || !commentText.trim()}>
                {addingComment ? 'Adding...' : 'Add Note'}
              </button>
            </form>
          </div>
        </div>

        {/* Right — deal info */}
        <div>
          <div className="card">
            <h3 className="section-heading">Deal Details</h3>
            <div className="info-label">Contact</div>
            <div className="info-value">{deal.contact || '—'}</div>
            <div className="info-label">Email</div>
            <div className="info-value">{deal.email ? <a href={`mailto:${deal.email}`} style={{ color: 'var(--teal)' }}>{deal.email}</a> : '—'}</div>
            <div className="info-label">Phone</div>
            <div className="info-value">{deal.phone || '—'}</div>
            <div className="info-label">Country</div>
            <div className="info-value">{deal.country || '—'}</div>
            <div className="info-label">Devices</div>
            <div className="info-value">{deal.devices?.toLocaleString()} devices</div>
            <div className="info-label">Subscription Tier</div>
            <div className="info-value"><TierPill tier={deal.tier} /></div>
            <div className="info-label">Expected Close</div>
            <div className="info-value">{formatDate(deal.close_date)}</div>
            <div className="info-label">Lead Source</div>
            <div className="info-value">{deal.source || '—'}</div>
            <div className="info-label">Protection Expires</div>
            <div className="info-value">
              <span className={`protection-days ${protClass}`} style={{ fontSize: 13 }}>
                {protDays === 0 ? 'Expired' : `${protDays} days remaining`}
              </span>
            </div>
            {deal.notes && (
              <>
                <div className="info-label">Notes</div>
                <div className="info-value" style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--ink-2)' }}>{deal.notes}</div>
              </>
            )}
          </div>
        </div>
      </div>

      {showEdit && (
        <EditDealModal
          deal={deal}
          onClose={() => setShowEdit(false)}
          onSaved={(updated) => { setDeal((prev) => ({ ...prev, ...updated })); setShowEdit(false) }}
          addToast={addToast}
        />
      )}
      {closeTarget && (
        <CloseReasonModal
          stage={closeTarget}
          onClose={() => setCloseTarget(null)}
          onConfirm={(reason) => applyStage(closeTarget, reason)}
        />
      )}
    </div>
  )
}
