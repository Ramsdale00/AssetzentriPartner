import React, { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

// Module-level cache of in-flight / completed verification promises, keyed by
// token. A per-component useRef does NOT survive React StrictMode's
// mount → unmount → remount cycle (a fresh ref is created on each mount), so
// the token gets verified twice: the first call consumes the single-use token
// and logs the user in, while the second comes back "already used" and shows
// an error. Caching the promise at module scope guarantees both invocations
// share the exact same network call and resolve to the same result.
const verificationCache = new Map()

export default function VerifyMagicLink() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { verifyMagicLink } = useAuth()

  const [status, setStatus] = useState('verifying') // 'verifying' | 'error'
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')

    if (!token) {
      setErrorMsg('No sign-in token found in this link.')
      setStatus('error')
      return
    }

    // Reuse the in-flight promise for this token if one already exists, so a
    // StrictMode remount (or any re-render) never triggers a second request.
    let request = verificationCache.get(token)
    if (!request) {
      request = verifyMagicLink(token)
      verificationCache.set(token, request)
    }

    request
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
