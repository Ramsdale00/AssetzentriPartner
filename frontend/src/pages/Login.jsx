import React, { useCallback, useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Turnstile from '../components/Turnstile'

const RESEND_SECONDS = 30

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [sent, setSent]         = useState(false)
  const [turnstileToken, setTurnstileToken] = useState('')
  const [resendIn, setResendIn] = useState(0)

  const handleToken = useCallback((t) => setTurnstileToken(t), [])

  // Countdown for the "resend link" control on the confirmation screen.
  useEffect(() => {
    if (resendIn <= 0) return
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [resendIn])

  const submitCredentials = async () => {
    const result = await login(email, password, turnstileToken)
    if (result.loggedIn) {
      navigate(result.user.persona === 'admin' ? '/admin' : '/dashboard', { replace: true })
      return true
    }
    return false
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const direct = await submitCredentials()
      if (!direct) {
        setSent(true)
        setResendIn(RESEND_SECONDS)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (resendIn > 0 || loading) return
    setLoading(true)
    setError('')
    try {
      await submitCredentials()
      setResendIn(RESEND_SECONDS)
    } catch (err) {
      setError(err.response?.data?.error || 'Could not resend the link')
    } finally {
      setLoading(false)
    }
  }

  // ── "Check your email" confirmation screen ────────────────────────────────
  if (sent) {
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
            {/* Mail icon */}
            <div style={{
              width: 56, height: 56, borderRadius: 14,
              background: 'var(--surface-2, #f5f1ea)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 24,
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--accent, #c9a96e)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <polyline points="2,4 12,13 22,4"/>
              </svg>
            </div>

            <h1 className="login-heading" style={{ marginBottom: 8 }}>Check your email</h1>
            <p className="login-sub" style={{ marginBottom: 24 }}>
              We sent a sign-in link to <strong>{email}</strong>.<br />
              Click it within 15 minutes to access your portal.
            </p>

            {error && <div className="login-error" style={{ marginBottom: 16 }}>{error}</div>}

            <div style={{
              background: 'var(--surface-2, #fafaf8)',
              border: '1px solid var(--line, #e8e4dc)',
              borderRadius: 10,
              padding: '14px 16px',
              fontSize: 13,
              color: 'var(--muted)',
              lineHeight: 1.6,
              marginBottom: 28,
            }}>
              Didn't receive it? Check your spam folder, or{' '}
              <button
                onClick={handleResend}
                disabled={resendIn > 0 || loading}
                style={{ background: 'none', border: 'none', padding: 0, color: resendIn > 0 ? 'var(--muted)' : 'var(--accent, #c9a96e)', cursor: resendIn > 0 ? 'default' : 'pointer', fontSize: 13, fontWeight: 500 }}
              >
                {loading ? 'sending…' : resendIn > 0 ? `resend in ${resendIn}s` : 'resend the link'}
              </button>
              {'. '}Or{' '}
              <button
                onClick={() => { setSent(false); setError('') }}
                style={{ background: 'none', border: 'none', padding: 0, color: 'var(--accent, #c9a96e)', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}
              >
                use a different email
              </button>
              .
            </div>

            <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 0 }}>
              The link is single-use and expires after 15 minutes for security.
            </p>
          </div>
        </div>

        {/* Right pane — art */}
        <div className="login-art-pane">
          <div className="art-quote">
            "One portal.<br />Every deal.<br />Zero friction."
          </div>
          <div className="art-attr">AssetZentri Partner Programme</div>
        </div>
      </div>
    )
  }

  // ── Login form ────────────────────────────────────────────────────────────
  return (
    <div className="login-page">
      {/* Left pane — form */}
      <div className="login-form-pane">
        <div className="login-logo">
          <div className="logo-icon" style={{ width: 40, height: 40, fontSize: 16 }}>AZ</div>
          <div>
            <div style={{ fontFamily: 'Fraunces, serif', fontSize: 18, fontWeight: 600 }}>AssetZentri</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Partner Portal</div>
          </div>
        </div>

        <div className="login-form">
          <h1 className="login-heading">Sign in.</h1>
          <p className="login-sub">Verify your password, then we'll email a one-time secure link to finish signing in.</p>

          {error && <div className="login-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input
                className="form-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                autoComplete="email"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>
            <Turnstile onToken={handleToken} />
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '11px 20px', fontSize: 14, marginTop: 8 }}
              disabled={loading}
            >
              {loading ? 'Sending link...' : 'Send sign-in link'}
            </button>
          </form>

          <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 20, textAlign: 'center' }}>
            New to AssetZentri?{' '}
            <Link to="/signup" style={{ color: 'var(--accent, #c9a96e)', fontWeight: 500 }}>Create an account</Link>
          </p>
        </div>
      </div>

      {/* Right pane — art */}
      <div className="login-art-pane">
        <div className="art-quote">
          "One portal.<br />Every deal.<br />Zero friction."
        </div>
        <div className="art-attr">AssetZentri Partner Programme</div>
      </div>
    </div>
  )
}
