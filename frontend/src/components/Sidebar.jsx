import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function GridIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
}
function CheckSquareIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
}
function HashIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>
}
function FolderIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
}
function UsersIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
}
function BarChartIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
}
function LogOutIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
}

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

export default function Sidebar({ checklist, searchOpen, setSearchOpen }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isAdmin = user?.persona === 'admin'
  const remainingSteps = checklist ? checklist.filter(s => !s.done).length : 0

  const tierLabel = isAdmin ? 'Vistrive Ops' : (user?.partner_tier || 'Gold')

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-mark">
          <div className="logo-icon">AZ</div>
          <div>
            <div className="logo-text">AssetZentri</div>
            <div className="logo-sub">Partner Portal</div>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {isAdmin ? (
          <>
            <div className="nav-section-label">Admin</div>
            <NavLink to="/admin" end className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <BarChartIcon /> Operations
            </NavLink>
            <NavLink to="/admin/deals" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <HashIcon /> All Deals
            </NavLink>
            <NavLink to="/admin/partners" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <UsersIcon /> Partners
            </NavLink>
          </>
        ) : (
          <>
            <div className="nav-section-label">Partner</div>
            <NavLink to="/dashboard" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <GridIcon /> Dashboard
            </NavLink>
            <NavLink to="/onboarding" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <CheckSquareIcon /> Onboarding
              {remainingSteps > 0 && <span className="nav-badge">{remainingSteps}</span>}
            </NavLink>
            <NavLink to="/leads" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <HashIcon /> Lead Registration
            </NavLink>
            <NavLink to="/collateral" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <FolderIcon /> Product Collaterals
            </NavLink>
            <NavLink to="/team" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <UsersIcon /> Team
            </NavLink>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">{getInitials(user?.name)}</div>
          <div>
            <div className="user-name">{user?.name}</div>
            <div className="user-role">{user?.role}</div>
          </div>
        </div>

        {isAdmin ? (
          <div className="tier-badge admin" style={{ marginBottom: 8, display: 'inline-flex' }}>
            Vistrive Ops
          </div>
        ) : (
          <div className="tier-badge gold" style={{ marginBottom: 8, display: 'inline-flex' }}>
            Gold Partner
          </div>
        )}

        <button className="btn-signout" onClick={handleLogout}>
          <LogOutIcon /> Sign out
        </button>
      </div>
    </aside>
  )
}
