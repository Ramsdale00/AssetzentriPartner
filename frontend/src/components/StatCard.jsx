import React from 'react'

export default function StatCard({ label, value, sub, accentColor }) {
  return (
    <div className="stat-card">
      {accentColor && (
        <div className="stat-card-accent" style={{ background: accentColor }} />
      )}
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  )
}
