import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import client from '../api/client'
import { StagePill, TierPill, RolePill } from '../components/Pill'

function formatCurrency(val) {
  if (!val) return '$0'
  if (val >= 1000000) return `$${(val / 1000000).toFixed(2)}M`
  if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`
  return `$${Number(val).toLocaleString()}`
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function CheckIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
}

export default function AdminPartnerDetail({ addToast }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    client.get(`/admin/partners/${id}`)
      .then((res) => setData(res.data))
      .catch(() => {
        addToast?.('Partner not found', 'error')
        navigate('/admin/partners')
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="loading-center"><div className="spinner" /><span>Loading partner...</span></div>
  if (!data) return null

  const { deals = [], team = [], checklist = [], stats = {} } = data
  const activeDeals = deals.filter(d => !['Won', 'Lost'].includes(d.stage))
  const onboardPct = checklist.length > 0
    ? Math.round((checklist.filter(s => s.done).length / checklist.length) * 100)
    : 0

  return (
    <div style={{ animation: 'fadeUp 0.2s ease' }}>
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: 16 }} onClick={() => navigate('/admin/partners')}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        Back to Partners
      </button>

      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <TierPill tier={data.tier} />
            {data.is_custom && <span className="new-badge">NEW</span>}
          </div>
          <h1 className="page-title" style={{ marginBottom: 4 }}>{data.name}</h1>
          <p className="page-subtitle">{data.country} · PSM: {data.psm || '—'}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: 26, fontWeight: 600 }}>
            {formatCurrency(stats.pipeline_value)}
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>Pipeline value</div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Active Deals', value: stats.active_deals || 0 },
          { label: 'Closed Won', value: formatCurrency(stats.closed_value) },
          { label: 'Team Members', value: stats.team_count || 0 },
          { label: 'Onboarding', value: `${checklist.filter(s => s.done).length}/${checklist.length}` }
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '14px 16px' }}>
            <div className="stat-label">{s.label}</div>
            <div style={{ fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 600 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="two-col-60-40">
        {/* Left: deals */}
        <div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
              <h3 className="section-heading" style={{ margin: 0 }}>Deals</h3>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Deal</th>
                  <th>Stage</th>
                  <th>Devices</th>
                  <th>ARR</th>
                  <th>Registered</th>
                </tr>
              </thead>
              <tbody>
                {deals.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--muted)', padding: 32 }}>No deals</td></tr>
                ) : deals.map(deal => (
                  <tr key={deal.id}>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{deal.company}</div>
                      <div className="deal-id" style={{ fontSize: 11 }}>{deal.deal_id}</div>
                    </td>
                    <td><StagePill stage={deal.stage} /></td>
                    <td style={{ fontSize: 13 }}>{deal.devices?.toLocaleString()}</td>
                    <td style={{ fontWeight: 500, fontSize: 13 }}>{formatCurrency(deal.annual_value)}</td>
                    <td style={{ fontSize: 12, color: 'var(--muted)' }}>{formatDate(deal.registered_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: team + onboarding */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Team */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
              <h3 className="section-heading" style={{ margin: 0 }}>Team</h3>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {team.length === 0 ? (
                  <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--muted)', padding: 20 }}>No team members</td></tr>
                ) : team.map(member => (
                  <tr key={member.id}>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{member.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{member.email}</div>
                    </td>
                    <td><RolePill role={member.role} /></td>
                    <td>
                      <div className="status-dot">
                        <div className={`dot dot-${member.status.toLowerCase()}`} />
                        <span style={{ fontSize: 12 }}>{member.status}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Onboarding checklist */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 className="section-heading" style={{ margin: 0 }}>Onboarding</h3>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>{onboardPct}% complete</span>
            </div>
            <div className="progress-bar" style={{ marginBottom: 14 }}>
              <div className="progress-fill" style={{ width: `${onboardPct}%` }} />
            </div>
            {checklist.map(step => (
              <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--line)', fontSize: 13 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: step.done ? 'var(--teal)' : 'var(--cream-2)',
                  border: step.done ? 'none' : '2px solid var(--line)',
                  color: step.done ? 'white' : 'var(--muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 600, flexShrink: 0
                }}>
                  {step.done ? <CheckIcon /> : step.step_number}
                </div>
                <span style={{ color: step.done ? 'var(--muted)' : 'var(--ink)', textDecoration: step.done ? 'line-through' : 'none' }}>
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
