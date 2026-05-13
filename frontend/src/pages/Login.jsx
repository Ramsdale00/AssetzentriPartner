import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(email, password)
      if (user.persona === 'admin') {
        navigate('/admin')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  const fillCreds = (e, pw) => {
    setEmail(e)
    setPassword(pw)
  }

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
          <p className="login-sub">Access your partner dashboard, deals, and resources.</p>

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
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '11px 20px', fontSize: 14, marginTop: 8 }}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="demo-creds">
            <div className="demo-creds-title">Demo credentials — click to fill</div>
            <div
              className="demo-cred-item"
              onClick={() => fillCreds('alex@northwave-tech.com', 'password')}
            >
              <div>
                <div className="demo-cred-email">alex@northwave-tech.com</div>
                <div className="demo-cred-role">Partner Admin — Northwave Technologies (Gold)</div>
              </div>
            </div>
            <div style={{ height: 1, background: 'var(--line)', margin: '4px 0' }} />
            <div
              className="demo-cred-item"
              onClick={() => fillCreds('ops@vistrive.com', 'password')}
            >
              <div>
                <div className="demo-cred-email">ops@vistrive.com</div>
                <div className="demo-cred-role">Admin — Vistrive Partner Ops</div>
              </div>
            </div>
            <div style={{ marginTop: 8, fontSize: 11, color: 'var(--muted)' }}>Password: <code style={{ fontFamily: 'JetBrains Mono, monospace' }}>password</code></div>
          </div>
        </div>
      </div>

      {/* Right pane — art */}
      <div className="login-art-pane">
        <div>
          <div className="art-quote">
            "One portal.<br />Every deal.<br />Zero friction."
          </div>
          <div className="art-attr">AssetZentri Partner Programme</div>
        </div>

        <div className="art-stats">
          <div style={{ display: 'flex', gap: 32, marginBottom: 16 }}>
            <div className="art-stat">
              <div className="art-stat-value">20</div>
              <div className="art-stat-label">Active partners</div>
            </div>
            <div className="art-stat">
              <div className="art-stat-value">$4.23M</div>
              <div className="art-stat-label">Pipeline value</div>
            </div>
          </div>
          <div className="art-stat">
            <div className="art-stat-value">84</div>
            <div className="art-stat-label">Customers onboarded</div>
          </div>
        </div>
      </div>
    </div>
  )
}
