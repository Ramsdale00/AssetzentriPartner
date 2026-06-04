import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../api/client'

function BellIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.round(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return new Date(iso).toLocaleDateString()
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [unread, setUnread] = useState(0)
  const ref = useRef(null)
  const navigate = useNavigate()

  const load = () =>
    client.get('/notifications')
      .then((r) => { setItems(r.data.items || []); setUnread(r.data.unread || 0) })
      .catch(() => {})

  useEffect(() => {
    load()
    const t = setInterval(load, 60000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const markAll = () => {
    client.put('/notifications/read-all').catch(() => {})
    setItems((prev) => prev.map((i) => ({ ...i, read: true })))
    setUnread(0)
  }

  const openItem = (n) => {
    if (!n.read) client.put(`/notifications/${n.id}/read`).catch(() => {})
    setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, read: true } : i)))
    setUnread((u) => Math.max(0, u - (n.read ? 0 : 1)))
    setOpen(false)
    if (n.link) navigate(n.link)
  }

  return (
    <div className="notif-wrap" ref={ref}>
      <button
        className="notif-btn"
        aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <BellIcon />
        {unread > 0 && <span className="notif-badge" aria-hidden="true">{unread > 9 ? '9+' : unread}</span>}
      </button>

      {open && (
        <div className="notif-panel" role="menu" aria-label="Notifications">
          <div className="notif-head">
            <span>Notifications</span>
            {items.some((i) => !i.read) && (
              <button className="btn btn-ghost btn-sm" onClick={markAll}>Mark all read</button>
            )}
          </div>
          {items.length === 0 ? (
            <div className="notif-empty">You're all caught up.</div>
          ) : (
            items.map((n) => (
              <button
                key={n.id}
                className={`notif-item${n.read ? '' : ' unread'}`}
                onClick={() => openItem(n)}
                role="menuitem"
              >
                <div className="notif-item-title">{n.title}</div>
                {n.body && <div className="notif-item-body">{n.body}</div>}
                <div className="notif-item-time">{timeAgo(n.created_at)}</div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
