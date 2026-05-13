import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../api/client'

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  )
}

function FileIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>
  )
}

function HashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/>
      <line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/>
    </svg>
  )
}

export default function SearchModal({ onClose }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState({ deals: [], collaterals: [] })
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!query.trim()) {
      setResults({ deals: [], collaterals: [] })
      return
    }
    const timer = setTimeout(() => {
      setLoading(true)
      client.get(`/search?q=${encodeURIComponent(query)}`)
        .then((res) => setResults(res.data))
        .catch(() => {})
        .finally(() => setLoading(false))
    }, 250)
    return () => clearTimeout(timer)
  }, [query])

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose()
  }

  const goToDeal = (dealId) => {
    navigate(`/leads/${dealId}`)
    onClose()
  }

  const goToCollateral = () => {
    navigate('/collateral')
    onClose()
  }

  const hasResults = results.deals.length > 0 || results.collaterals.length > 0

  return (
    <div className="search-modal-overlay" onClick={onClose}>
      <div className="search-modal" onClick={(e) => e.stopPropagation()} onKeyDown={handleKeyDown}>
        <div className="search-input-wrap">
          <SearchIcon />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search deals and collaterals..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {loading && <div className="spinner" style={{ width: 16, height: 16 }} />}
          <span className="kbd">Esc</span>
        </div>

        <div className="search-results">
          {!query.trim() && (
            <div className="search-empty">
              Start typing to search deals and collaterals...
            </div>
          )}

          {query.trim() && !hasResults && !loading && (
            <div className="search-empty">No results for "{query}"</div>
          )}

          {results.deals.length > 0 && (
            <>
              <div className="search-section-label">Deals</div>
              {results.deals.map((deal) => (
                <div key={deal.id} className="search-item" onClick={() => goToDeal(deal.deal_id)}>
                  <div className="search-item-icon" style={{ background: '#EFF6FF' }}>
                    <HashIcon />
                  </div>
                  <div>
                    <div className="search-item-name">{deal.company}</div>
                    <div className="search-item-sub">{deal.deal_id} · {deal.stage}</div>
                  </div>
                </div>
              ))}
            </>
          )}

          {results.collaterals.length > 0 && (
            <>
              <div className="search-section-label">Collaterals</div>
              {results.collaterals.map((item) => (
                <div key={item.id} className="search-item" onClick={goToCollateral}>
                  <div className="search-item-icon">
                    <FileIcon />
                  </div>
                  <div>
                    <div className="search-item-name">{item.name}</div>
                    <div className="search-item-sub">{item.folder_name} · {item.type} · {item.size}</div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
