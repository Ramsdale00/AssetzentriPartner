import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import client from '../api/client'

export default function Signup() {
  const [form, setForm] = useState({
    name: '',
    company: '',
    country: '',
    email: '',
    password: '',
  })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]     = useState(false)

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    setLoading(true)
    try {
      await client.post('/auth/signup', {
        name: form.name,
        company: form.company,
        country: form.country,
        email: form.email,
        password: form.password,
      })
      setSent(true)
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.')
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

            <h1 className="login-heading" style={{ marginBottom: 8 }}>Welcome aboard</h1>
            <p className="login-sub" style={{ marginBottom: 24 }}>
              Your account for <strong>{form.company}</strong> is ready. We sent a sign-in link to{' '}
              <strong>{form.email}</strong> — click it within 15 minutes to access your portal.
            </p>

            <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
              Already clicked it?{' '}
              <Link to="/login" style={{ color: 'var(--accent, #c9a96e)', fontWeight: 500 }}>Go to sign in</Link>.
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

  // ── Sign-up form ──────────────────────────────────────────────────────────
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
          <h1 className="login-heading">Become a partner.</h1>
          <p className="login-sub">Create your account to register deals, access collateral, and grow with AssetZentri.</p>

          {error && <div className="login-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Your name</label>
              <input
                className="form-input"
                type="text"
                value={form.name}
                onChange={update('name')}
                placeholder="Alex Morgan"
                required
                autoComplete="name"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Company name</label>
              <input
                className="form-input"
                type="text"
                value={form.company}
                onChange={update('company')}
                placeholder="Northwave Technologies"
                required
                autoComplete="organization"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Country</label>
              <input
                className="form-input"
                type="text"
                value={form.country}
                onChange={update('country')}
                placeholder="United Kingdom"
                required
                autoComplete="country-name"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Work email</label>
              <input
                className="form-input"
                type="email"
                value={form.email}
                onChange={update('email')}
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
                value={form.password}
                onChange={update('password')}
                placeholder="At least 8 characters"
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '11px 20px', fontSize: 14, marginTop: 8 }}
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 20, textAlign: 'center' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--accent, #c9a96e)', fontWeight: 500 }}>Sign in</Link>
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
