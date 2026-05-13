import React, { useState, useEffect } from 'react'
import client from '../api/client'
import { StagePill, TierPill } from '../components/Pill'

function formatCurrency(val) {
  if (!val) return '$0'
  if (val >= 1000000) return `$${(val / 1000000).toFixed(2)}M`
  if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`
  return `$${Number(val).toLocaleString()}`
}

export default function AdminDeals({ addToast }) {
  const [deals, setDeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('All')

  useEffect(() => {
    client.get('/admin/deals')
      .then((res) => setDeals(res.data))
      .catch(() => addToast?.('Failed to load deals', 'error'))
      .finally(() => setLoading(false))
  }, [])

  const stages = ['All', 'Qualified', 'Demo', 'Proposal', 'Legal', 'Won', 'Lost']

  const filtered = deals.filter(d => {
    const matchStage = stageFilter === 'All' || d.stage === stageFilter
    const matchSearch = !search ||
      d.company.toLowerCase().includes(search.toLowerCase()) ||
      d.deal_id.toLowerCase().includes(search.toLowerCase()) ||
      (d.partner_name || '').toLowerCase().includes(search.toLowerCase())
    return matchStage && matchSearch
  })

  return (
    <div style={{ animation: 'fadeUp 0.2s ease' }}>
      <div className="page-header">
        <h1 className="page-title">All Deals</h1>
        <p className="page-subtitle">Every registered deal across all partners.</p>
      </div>

      <div className="filter-bar">
        {stages.map(s => (
          <button
            key={s}
            className={`filter-tab${stageFilter === s ? ' active' : ''}`}
            onClick={() => setStageFilter(s)}
          >{s}</button>
        ))}
        <div className="search-bar" style={{ marginLeft: 'auto' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            type="text"
            placeholder="Search by company, deal ID, partner..."
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
                <th>Partner</th>
                <th>Country</th>
                <th>Tier / Devices</th>
                <th>Stage</th>
                <th>Protection</th>
                <th>ARR</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--muted)', padding: 40 }}>No deals found</td></tr>
              ) : filtered.map(deal => (
                <tr key={deal.id}>
                  <td><span className="deal-id">{deal.deal_id}</span></td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{deal.company}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{deal.contact}</div>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--muted)' }}>{deal.partner_name}</td>
                  <td style={{ fontSize: 13 }}>{deal.country}</td>
                  <td>
                    <TierPill tier={deal.tier} />
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{deal.devices?.toLocaleString()} devices</div>
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

      <div style={{ marginTop: 12, fontSize: 12, color: 'var(--muted)' }}>
        Showing {filtered.length} of {deals.length} deals
      </div>
    </div>
  )
}
