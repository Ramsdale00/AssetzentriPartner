import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../api/client'
import StatCard from '../components/StatCard'
import { StagePill } from '../components/Pill'

function formatCurrency(val) {
  if (val >= 1000000) return `$${(val / 1000000).toFixed(2)}M`
  if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`
  return `$${val.toLocaleString()}`
}

function ProtectionCell({ days }) {
  if (days === 0) return <span className="protection-days protection-expired">Expired</span>
  if (days < 30) return <span className="protection-days protection-warn">{days}d</span>
  return <span className="protection-days protection-ok">{days}d</span>
}

export default function Dashboard({ addToast, checklist }) {
  const [deals, setDeals] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    client.get('/deals')
      .then((res) => setDeals(res.data))
      .catch(() => addToast?.('Failed to load deals', 'error'))
      .finally(() => setLoading(false))
  }, [])

  const activeDeals = deals.filter(d => !['Won', 'Lost'].includes(d.stage))
  const wonDeals = deals.filter(d => d.stage === 'Won')
  const pipelineValue = activeDeals.reduce((sum, d) => sum + (d.annual_value || 0), 0)
  const closedWonValue = wonDeals.reduce((sum, d) => sum + (d.annual_value || 0), 0)

  const doneSteps = checklist ? checklist.filter(s => s.done).length : 0
  const totalSteps = checklist ? checklist.length : 8
  const onboardingComplete = doneSteps === totalSteps && totalSteps > 0

  return (
    <div style={{ animation: 'fadeUp 0.2s ease' }}>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Welcome back. Here's your partner activity summary.</p>
      </div>

      <div className="stat-grid-4">
        <StatCard
          label="Onboarding Progress"
          value={`${doneSteps}/${totalSteps}`}
          sub={onboardingComplete ? 'Fully onboarded' : `${totalSteps - doneSteps} steps remaining`}
          accentColor="var(--teal)"
        />
        <StatCard
          label="Active Deals"
          value={activeDeals.length}
          sub="In pipeline"
          accentColor="var(--rust)"
        />
        <StatCard
          label="Pipeline Value"
          value={formatCurrency(pipelineValue)}
          sub="Annual recurring revenue"
          accentColor="var(--gold)"
        />
        <StatCard
          label="Closed Won"
          value={formatCurrency(closedWonValue)}
          sub={`${wonDeals.length} deal${wonDeals.length !== 1 ? 's' : ''}`}
          accentColor="var(--moss)"
        />
      </div>

      <div className="two-col-60-40">
        {/* Pipeline table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 className="section-heading" style={{ margin: 0 }}>Active Pipeline</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/leads')}>View all</button>
          </div>
          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Stage</th>
                  <th>Devices</th>
                  <th>Protection</th>
                  <th>ARR</th>
                </tr>
              </thead>
              <tbody>
                {activeDeals.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--muted)', padding: 32 }}>No active deals</td></tr>
                ) : activeDeals.map(deal => (
                  <tr
                    key={deal.id}
                    className="clickable"
                    onClick={() => navigate(`/leads/${deal.deal_id}`)}
                  >
                    <td>
                      <div style={{ fontWeight: 500 }}>{deal.company}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace' }}>{deal.deal_id}</div>
                    </td>
                    <td><StagePill stage={deal.stage} /></td>
                    <td>{deal.devices?.toLocaleString()}</td>
                    <td><ProtectionCell days={deal.protection_days} /></td>
                    <td style={{ fontWeight: 500 }}>{formatCurrency(deal.annual_value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Onboarding progress card */}
          {!onboardingComplete && checklist && checklist.length > 0 && (
            <div className="onboarding-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div className="onboarding-card-title">Onboarding Checklist</div>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate('/onboarding')}>View all</button>
              </div>
              <div className="progress-bar" style={{ marginBottom: 12 }}>
                <div className="progress-fill" style={{ width: `${(doneSteps / totalSteps) * 100}%` }} />
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>{doneSteps} of {totalSteps} complete</div>
              {checklist.filter(s => !s.done).slice(0, 3).map(step => (
                <div key={step.id} className="onboarding-step-row">
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%',
                    background: 'var(--cream-2)', border: '2px solid var(--line)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, color: 'var(--muted)', fontWeight: 600, flexShrink: 0
                  }}>{step.step_number}</div>
                  <span>{step.title}</span>
                </div>
              ))}
            </div>
          )}

          {/* Announcement card */}
          <div className="announcement-card">
            <div className="announcement-tag">Announcement</div>
            <div style={{ fontFamily: 'Fraunces, serif', fontSize: 16, fontWeight: 500, marginBottom: 8 }}>
              Q3 Pricing Refresh — New One-Pager Available
            </div>
            <p style={{ fontSize: 13, opacity: 0.9, lineHeight: 1.5, marginBottom: 12 }}>
              Updated pricing tiers are now live. Download the refreshed one-pager from Product Collaterals before your next customer call.
            </p>
            <button
              className="btn btn-sm"
              style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}
              onClick={() => navigate('/collateral')}
            >
              View Collaterals
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
