import React from 'react'

const stageClasses = {
  Qualified: 'pill-qualified',
  Demo: 'pill-demo',
  Proposal: 'pill-proposal',
  Legal: 'pill-legal',
  Won: 'pill-won',
  Lost: 'pill-lost',
}

const tierClasses = {
  Gold: 'pill-gold',
  Silver: 'pill-silver',
  Bronze: 'pill-bronze',
}

const roleClasses = {
  Admin: 'pill-admin',
  Seller: 'pill-seller',
  'Read-Only': 'pill-readonly',
}

export function StagePill({ stage }) {
  const cls = stageClasses[stage] || ''
  return <span className={`pill ${cls}`}>{stage}</span>
}

export function TierPill({ tier }) {
  const cls = tierClasses[tier] || ''
  return <span className={`pill ${cls}`}>{tier}</span>
}

export function RolePill({ role }) {
  const cls = roleClasses[role] || ''
  return <span className={`pill ${cls}`}>{role}</span>
}
