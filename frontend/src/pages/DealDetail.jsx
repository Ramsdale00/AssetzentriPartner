import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import client from '../api/client'
import { StagePill, TierPill } from '../components/Pill'

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

export default function DealDetail({ addToast }) {
  const { dealId } = useParams()
  const navigate = useNavigate()
  const [deal, setDeal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updatingStage, setUpdatingStage] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [addingComment, setAddingComment] = useState(false)

  useEffect(() => {
    client.get(`/deals/${dealId}`)
      .then((res) => setDeal(res.data))
      .catch(() => {
        addToast?.('Deal not found', 'error')
        navigate('/leads')
      })
      .finally(() => setLoading(false))
  }, [dealId])

  const updateStage = async (stage) => {
    if (deal.stage === stage) return
    setUpdatingStage(true)
    try {
      const res = await client.put(`/deals/${dealId}/stage`, { stage })
      setDeal(prev => ({ ...prev, ...res.data }))
      addToast?.(`Stage updated to ${stage}`, 'success')
    } catch (err) {
      addToast?.('Failed to update stage', 'error')
    } finally {
      setUpdatingStage(false)
    }
  }

  const addComment = async (e) => {
    e.preventDefault()
    if (!commentText.trim()) return
    setAddingComment(true)
    try {
      const res = await client.post(`/deals/${dealId}/comments`, { text: commentText })
      setDeal(prev => ({
        ...prev,
        comments: [...(prev.comments || []), res.data]
      }))
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

  return (
    <div style={{ animation: 'fadeUp 0.2s ease' }}>
      {/* Back button */}
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: 16 }} onClick={() => navigate('/leads')}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        Back to Leads
      </button>

      {/* Header */}
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
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: 26, fontWeight: 600 }}>
            {formatCurrency(deal.annual_value)}
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>Annual value</div>
        </div>
      </div>

      <div className="two-col-60-40">
        {/* Left — stage tracker + comments */}
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 className="section-heading">Deal Stage</h3>
            <div className="stage-tracker">
              {STAGES.map(stage => (
                <button
                  key={stage}
                  className={`stage-btn${deal.stage === stage ? ' active' : ''}`}
                  onClick={() => updateStage(stage)}
                  disabled={updatingStage}
                >
                  {stage}
                </button>
              ))}
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>
              Click a stage to update the deal status
            </div>
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
                <textarea
                  className="form-textarea"
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="Add a note or update..."
                  style={{ minHeight: 70 }}
                />
              </div>
              <button
                type="submit"
                className="btn btn-secondary btn-sm"
                disabled={addingComment || !commentText.trim()}
              >
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
            <div className="info-value">
              {deal.email ? (
                <a href={`mailto:${deal.email}`} style={{ color: 'var(--teal)' }}>{deal.email}</a>
              ) : '—'}
            </div>

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
                <div className="info-value" style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--ink-2)' }}>
                  {deal.notes}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
