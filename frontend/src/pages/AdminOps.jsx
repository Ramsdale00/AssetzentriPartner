import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../api/client'
import StatCard from '../components/StatCard'
import { StagePill, TierPill } from '../components/Pill'

function formatCurrency(val) {
  if (!val) return '$0'
  if (val >= 1000000) return `$${(val / 1000000).toFixed(2)}M`
  if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`
  return `$${Number(val).toLocaleString()}`
}

const STAGE_COLORS = {
  Qualified: '#1D4ED8',
  Demo: '#6D28D9',
  Proposal: '#C2410C',
  Legal: '#92400E',
  Won: '#15803D',
  Lost: '#B91C1C',
}

export default function AdminOps({ addToast }) {
  const [deals, setDeals] = useState([])
  const [partners, setPartners] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([
      client.get('/admin/deals'),
      client.get('/admin/partners')
    ]).then(([dealsRes, partnersRes]) => {
      setDeals(dealsRes.data)
      setPartners(partnersRes.data)
    }).catch(() => addToast?.('Failed to load data', 'error'))
      .finally(() => setLoading(false))
  }, [])

  const activeDeals = deals.filter(d => !['Won', 'Lost'].includes(d.stage))
  const wonDeals = deals.filter(d => d.stage === 'Won')
  const pipelineValue = activeDeals.reduce((sum, d) => sum + (d.annual_value || 0), 0)
  const closedValue = wonDeals.reduce((sum, d) => sum + (d.annual_value || 0), 0)

  const totalOnboarded = partners.filter(p => Number(p.onboarding_done) === Number(p.onboarding_total) && Number(p.onboarding_total) > 0).length

  // Stage distribution
  const stageCount = {}
  activeDeals.forEach(d => { stageCount[d.stage] = (stageCount[d.stage] || 0) + 1 })
  const maxCount = Math.max(...Object.values(stageCount), 1)

  if (loading) return <div className="loading-center"><div className="spinner" /></div>

  return (
    <div style={{ animation: 'fadeUp 0.2s ease' }}>
      <div className="page-header">
        <h1 className="page-title">Operations Overview</h1>
        <p className="page-subtitle">Real-time view across all partner activity.</p>
      </div>

      <div className="stat-grid-4">
        <StatCard label="Active Deals" value={activeDeals.length} sub="Across all partners" accentColor="var(--teal)" />
        <StatCard label="Pipeline Value" value={formatCurrency(pipelineValue)} sub="Active ARR" accentColor="var(--rust)" />
        <StatCard label="Closed Won" value={formatCurrency(closedValue)} sub={`${wonDeals.length} deals`} accentColor="var(--moss)" />
        <StatCard label="Fully Onboarded" value={totalOnboarded} sub={`of ${partners.length} partners`} accentColor="var(--gold)" />
      </div>

      <div className="two-col-60-40">
        {/* All deals table (recent) */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 className="section-heading" style={{ margin: 0 }}>Recent Deals</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/deals')}>View all</button>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Deal</th>
                <th>Partner</th>
                <th>Stage</th>
                <th>ARR</th>
              </tr>
            </thead>
            <tbody>
              {deals.slice(0, 8).map(deal => (
                <tr key={deal.id}>
                  <td>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{deal.company}</div>
                    <div className="deal-id" style={{ fontSize: 11 }}>{deal.deal_id}</div>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--muted)' }}>{deal.partner_name}</td>
                  <td><StagePill stage={deal.stage} /></td>
                  <td style={{ fontWeight: 500 }}>{formatCurrency(deal.annual_value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right: stage chart + partner card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <h3 className="section-heading">Stage Distribution</h3>
            <div className="bar-chart">
              {['Qualified', 'Demo', 'Proposal', 'Legal'].map(stage => (
                <div key={stage} className="bar-row">
                  <div className="bar-label">{stage}</div>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{
                        width: `${((stageCount[stage] || 0) / maxCount) * 100}%`,
                        background: STAGE_COLORS[stage]
                      }}
                    />
                  </div>
                  <div className="bar-count">{stageCount[stage] || 0}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="section-heading">Partner Status</h3>
            {partners.slice(0, 4).map(p => {
              const pct = p.onboarding_total > 0
                ? Math.round((Number(p.onboarding_done) / Number(p.onboarding_total)) * 100)
                : 0
              return (
                <div
                  key={p.id}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--line)', cursor: 'pointer' }}
                  onClick={() => navigate(`/admin/partners/${p.id}`)}
                >
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{p.tier} · {p.active_deals} active deals</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 3 }}>{pct}% onboard</div>
                    <div className="mini-progress">
                      <div className="mini-progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
