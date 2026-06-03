import React, { useEffect, useRef, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function VerifyMagicLink() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { verifyMagicLink } = useAuth()

  const [status, setStatus] = useState('verifying') // 'verifying' | 'error'
  const [errorMsg, setErrorMsg] = useState('')

  // Single-use tokens must only be verified once. StrictMode (dev) and any
  // re-render would otherwise fire a second request that fails as "already used".
  const hasVerified = useRef(false)

  useEffect(() => {
    if (hasVerified.current) return
    hasVerified.current = true

    const token = searchParams.get('token')

    if (!token) {
      setErrorMsg('No sign-in token found in this link.')
      setStatus('error')
      return
    }

    verifyMagicLink(token)
      .then((user) => {
        // Redirect based on persona — same as the original login flow
        if (user.persona === 'admin') {
          navigate('/admin', { replace: true })
        } else {
          navigate('/dashboard', { replace: true })
        }
      })
      .catch((err) => {
        setErrorMsg(
          err.response?.data?.error ||
          'This link is invalid or has expired. Please sign in again.'
        )
        setStatus('error')
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Verifying spinner ─────────────────────────────────────────────────────
  if (status === 'verifying') {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        height: '100vh', gap: 16,
        background: 'var(--bg, #fafaf8)',
        color: 'var(--muted)',
        fontSize: 14,
      }}>
        <div className="spinner" />
        <span>Verifying your sign-in link…</span>
      </div>
    )
  }

  // ── Error state ───────────────────────────────────────────────────────────
  return (
    <div className="login-page">
      <div className="login-form-pane">
        <div className="login-logo">
          <div className="logo-icon" style={{ width: 40, height: 40, fontSize: 16 }}>AZ</div>
          <div>
            <div style={{ fontFamily: 'Fraunces, serif', fontSize: 18, fontWeight: 600 }}>AssetZentri</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Partner Portal</div>
          </div>
        </div>

        <div className="login-form">
          {/* Error icon */}
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: '#fff1f0',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 24,
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#e5533d" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>

          <h1 className="login-heading" style={{ marginBottom: 8 }}>Link invalid</h1>
          <p className="login-sub" style={{ marginBottom: 24 }}>{errorMsg}</p>

          <button
            onClick={() => navigate('/login', { replace: true })}
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '11px 20px', fontSize: 14 }}
          >
            Back to sign in
          </button>
        </div>
      </div>

      <div className="login-art-pane">
        <div className="art-quote">
          "One portal.<br />Every deal.<br />Zero friction."
        </div>
        <div className="art-attr">AssetZentri Partner Programme</div>
      </div>
    </div>
  )
}
