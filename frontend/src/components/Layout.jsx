import React, { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import Toast from './Toast'
import SearchModal from './SearchModal'
import { useToast } from '../hooks/useToast'
import { useAuth } from '../contexts/AuthContext'
import client from '../api/client'

// Global toast context
import { createContext, useContext } from 'react'
export const ToastContext = createContext(null)
export function useToastContext() { return useContext(ToastContext) }

function SearchIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
}

export default function Layout({ children }) {
  const { toasts, addToast, removeToast } = useToast()
  const { user } = useAuth()
  const [checklist, setChecklist] = useState([])
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    if (user?.persona === 'partner') {
      client.get('/checklist').then((res) => setChecklist(res.data)).catch(() => {})
    }
  }, [user])

  // Global keyboard shortcut for search
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
      if (e.key === 'Escape') {
        setSearchOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <ToastContext.Provider value={{ addToast }}>
      <div className="app-layout">
        <Sidebar checklist={checklist} searchOpen={searchOpen} setSearchOpen={setSearchOpen} />

        <div className="main-content">
          {/* Top bar with search trigger */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            padding: '12px 32px',
            borderBottom: '1px solid var(--line)',
            background: 'var(--paper)',
            position: 'sticky',
            top: 0,
            zIndex: 100
          }}>
            <button
              className="search-trigger"
              onClick={() => setSearchOpen(true)}
            >
              <SearchIcon />
              Search...
              <span className="kbd">⌘K</span>
            </button>
          </div>

          <div className="page-inner">
            {React.cloneElement(children, { addToast, checklist, setChecklist })}
          </div>
        </div>

        {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
        <Toast toasts={toasts} removeToast={removeToast} />
      </div>
    </ToastContext.Provider>
  )
}
