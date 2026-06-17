import React, { useCallback, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import client from '../api/client'
import Turnstile from '../components/Turnstile'

export default function Signup() {
  const navigate = useNavigate()
  const { signup } = useAuth()

  const [form, setForm] = useState({
    name: '',
    company: '',
    country: '',
    email: '',
    password: '',
  })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState('')

  // Company typeahead — surfaces existing partner names to avoid duplicates.
  const [companySuggestions, setCompanySuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const debounceRef = useRef(null)

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  const handleToken = useCallback((t) => setTurnstileToken(t), [])

  const companyTrimmed = form.company.trim()
  const companyExists = companySuggestions.some(
    (n) => n.toLowerCase() === companyTrimmed.toLowerCase()
  )

  const handleCompanyChange = (e) => {
    const value = e.target.value
    setForm((f) => ({ ...f, company: value }))

    if (debounceRef.current) clearTimeout(debounceRef.current)
    const q = value.trim()
    if (q.length < 2) {
      setCompanySuggestions([])
      setShowSuggestions(false)
      return
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await client.get('/auth/companies', { params: { q } })
        setCompanySuggestions(res.data || [])
        setShowSuggestions(true)
      } catch {
        setCompanySuggestions([])
      }
    }, 250)
  }

  const selectCompany = (name) => {
    setForm((f) => ({ ...f, company: name }))
    setShowSuggestions(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }
    if (companyExists) {
      setError(`"${companyTrimmed}" is already registered. Please choose a unique company name, or sign in if it's yours.`)
      return
    }

    setLoading(true)
    try {
      // Account creation logs the user straight in, then we drop them on the
      // partner dashboard — no second trip through their inbox.
      await signup({
        name: form.name,
        company: form.company,
        country: form.country,
        email: form.email,
        password: form.password,
        turnstileToken,
      })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.')
      setLoading(false)
    }
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
                placeholder="Full name"
                required
                autoComplete="name"
              />
            </div>
            <div className="form-group" style={{ position: 'relative' }}>
              <label className="form-label">Company name</label>
              <input
                className="form-input"
                type="text"
                value={form.company}
                onChange={handleCompanyChange}
                onFocus={() => companySuggestions.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder="Company legal name"
                required
                autoComplete="off"
              />
              {showSuggestions && companySuggestions.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 30,
                  marginTop: 4, background: 'var(--surface, #fff)',
                  border: '1px solid var(--line, #e8e4dc)', borderRadius: 10,
                  overflow: 'hidden', boxShadow: '0 6px 20px rgba(0,0,0,0.10)',
                }}>
                  <div style={{ padding: '8px 14px', fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--line, #f0ece4)' }}>
                    Already registered
                  </div>
                  {companySuggestions.map((name) => (
                    <button
                      type="button"
                      key={name}
                      onMouseDown={(e) => { e.preventDefault(); selectCompany(name) }}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left',
                        padding: '10px 14px', background: 'none', border: 'none',
                        cursor: 'pointer', fontSize: 13, color: 'var(--text, #1a1a1a)',
                      }}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}
              {companyExists && (
                <p style={{ color: '#e5533d', fontSize: 12, margin: '6px 0 0', lineHeight: 1.5 }}>
                  "{companyTrimmed}" is already registered — choose a unique name, or{' '}
                  <Link to="/login" style={{ color: '#e5533d', fontWeight: 600 }}>sign in</Link> if it's yours.
                </p>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Country</label>
              <input
                className="form-input"
                type="text"
                value={form.country}
                onChange={update('country')}
                placeholder="Select country/region"
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
                placeholder="name@company.com"
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
            <Turnstile onToken={handleToken} />
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '11px 20px', fontSize: 14, marginTop: 8 }}
              disabled={loading || companyExists}
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
