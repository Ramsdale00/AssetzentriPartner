import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../api/client'

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )
}

function Field({ label, children, hint }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      {children}
      {hint && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{hint}</div>}
    </div>
  )
}

// Read an image file and downscale it to a reasonable size, returning a PNG
// data URL we can store directly in logo_url (keeps the payload small).
function fileToLogoDataUrl(file, maxDim = 320) {
  return new Promise((resolve, reject) => {
    if (!file.type || !file.type.startsWith('image/')) {
      reject(new Error('Please choose an image file (PNG, JPG, or SVG).'))
      return
    }
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read that file.'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('That file is not a valid image.'))
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
        const w = Math.max(1, Math.round(img.width * scale))
        const h = Math.max(1, Math.round(img.height * scale))
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/png'))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

// Logo picker: shows the current logo (if any) and lets the partner upload a
// new image file. `value`/`onChange` carry the logo as a URL or data URL.
function LogoField({ value, onChange, addToast }) {
  const [busy, setBusy] = useState(false)
  const inputRef = useRef(null)

  const handleFile = async (e) => {
    const file = e.target.files && e.target.files[0]
    e.target.value = '' // allow re-selecting the same file
    if (!file) return
    setBusy(true)
    try {
      onChange(await fileToLogoDataUrl(file))
    } catch (err) {
      addToast?.(err.message || 'Could not load that image.', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      {value && (
        <div style={{ marginBottom: 10, padding: 16, border: '1px solid var(--line)', borderRadius: 10, background: 'var(--surface-2, #fafaf8)', textAlign: 'center' }}>
          <img src={value} alt="Company logo" style={{ maxHeight: 80, maxWidth: '100%' }} onError={(e) => { e.target.style.display = 'none' }} />
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>Current logo</div>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => inputRef.current?.click()} disabled={busy}>
          {busy ? 'Processing…' : value ? 'Replace logo' : 'Upload logo'}
        </button>
        {value && (
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => onChange('')} disabled={busy}>
            Remove
          </button>
        )}
      </div>
    </div>
  )
}

// ── Step 1: Company profile ───────────────────────────────────────────────────
function CompanyProfileBody({ profile, saveProfile, step, addToast }) {
  const [form, setForm] = useState({
    name: profile?.name || '',
    website: profile?.website || '',
    country: profile?.country || '',
    contact_name: profile?.contact_name || '',
    contact_email: profile?.contact_email || '',
    contact_phone: profile?.contact_phone || '',
    description: profile?.description || '',
    logo_url: profile?.logo_url || '',
  })
  const [saving, setSaving] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    await saveProfile(form, { completeStep: step })
    setSaving(false)
  }

  return (
    <form onSubmit={submit}>
      <div className="modal-body">
        <Field label="Company name"><input className="form-input" value={form.name} onChange={set('name')} required /></Field>
        <Field label="Website"><input className="form-input" value={form.website} onChange={set('website')} placeholder="https://example.com" /></Field>
        <Field label="Country"><input className="form-input" value={form.country} onChange={set('country')} /></Field>
        <Field label="Primary contact name"><input className="form-input" value={form.contact_name} onChange={set('contact_name')} /></Field>
        <Field label="Contact email"><input className="form-input" type="email" value={form.contact_email} onChange={set('contact_email')} /></Field>
        <Field label="Contact phone"><input className="form-input" value={form.contact_phone} onChange={set('contact_phone')} /></Field>
        <Field label="Company logo" hint="Upload your logo (PNG or SVG, transparent background recommended).">
          <LogoField value={form.logo_url} onChange={(v) => setForm((f) => ({ ...f, logo_url: v }))} addToast={addToast} />
        </Field>
        <Field label="Company description" hint="A short blurb used on co-branded materials.">
          <textarea className="form-textarea" rows={3} value={form.description} onChange={set('description')} />
        </Field>
      </div>
      <div className="modal-footer">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save details'}
        </button>
      </div>
    </form>
  )
}

// ── Step 2: Company logo ──────────────────────────────────────────────────────
function LogoBody({ profile, saveProfile, step, addToast }) {
  const [logoUrl, setLogoUrl] = useState(profile?.logo_url || '')
  const [saving, setSaving] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    await saveProfile({ logo_url: logoUrl }, { completeStep: logoUrl ? step : null })
    setSaving(false)
  }

  return (
    <form onSubmit={submit}>
      <div className="modal-body">
        <Field label="Company logo" hint="Upload a high-resolution logo image (PNG or SVG, transparent background recommended).">
          <LogoField value={logoUrl} onChange={setLogoUrl} addToast={addToast} />
        </Field>
        <Field label="…or paste a logo image URL" hint="If your logo is already hosted online, paste its link here instead.">
          <input className="form-input" value={logoUrl?.startsWith('data:') ? '' : logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://…/logo.png" />
        </Field>
      </div>
      <div className="modal-footer">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save logo'}
        </button>
      </div>
    </form>
  )
}

// ── Step 3: Partner agreement ─────────────────────────────────────────────────
function AgreementBody({ profile, acceptAgreement }) {
  const [accepting, setAccepting] = useState(false)
  const acceptedAt = profile?.agreement_accepted_at

  const accept = async () => {
    setAccepting(true)
    await acceptAgreement()
    setAccepting(false)
  }

  return (
    <>
      <div className="modal-body">
        <div style={{
          maxHeight: 220, overflowY: 'auto', padding: 16, border: '1px solid var(--line)',
          borderRadius: 10, background: 'var(--surface-2, #fafaf8)', fontSize: 13, lineHeight: 1.7, color: 'var(--muted)',
        }}>
          <p style={{ marginTop: 0 }}><strong>AssetZentri Partner Programme Agreement</strong></p>
          <p>By accepting, you agree to represent AssetZentri products accurately, to protect confidential information shared through this portal, and to comply with the deal-registration and pricing terms of the Partner Programme.</p>
          <p>Registered deals are protected for the duration shown on each deal. Partner tier and benefits are determined by AssetZentri and may be reviewed periodically.</p>
          <p>This is a summary for the portal. The full legal agreement is provided separately by your Partner Success Manager.</p>
        </div>
        {acceptedAt && (
          <div style={{ marginTop: 14, color: '#15803D', fontSize: 13, fontWeight: 500 }}>
            ✓ Accepted on {new Date(acceptedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        )}
      </div>
      <div className="modal-footer">
        <button className="btn btn-primary" onClick={accept} disabled={accepting || !!acceptedAt}>
          {acceptedAt ? 'Agreement accepted' : accepting ? 'Recording…' : 'I accept the agreement'}
        </button>
      </div>
    </>
  )
}

// ── Steps 4 & 6: link out to another section ──────────────────────────────────
function LinkOutBody({ text, cta, to, navigate, closeModal }) {
  return (
    <>
      <div className="modal-body">
        <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7, marginTop: 0 }}>{text}</p>
      </div>
      <div className="modal-footer">
        <button className="btn btn-primary" onClick={() => { closeModal(); navigate(to) }}>{cta}</button>
      </div>
    </>
  )
}

// ── Step 5: demo video ────────────────────────────────────────────────────────
function VideoBody({ markStep, step }) {
  return (
    <>
      <div className="modal-body">
        <div style={{
          aspectRatio: '16 / 9', borderRadius: 10, background: '#0f0f0f', color: '#fff',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12,
        }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="#c9a96e"><polygon points="9 7 9 17 17 12" /></svg>
          <div style={{ fontSize: 13, color: '#aaa' }}>AssetZentri platform walkthrough · 45 min</div>
        </div>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 14 }}>
          Watch the full product walkthrough, then mark this step complete.
        </p>
      </div>
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={() => window.open('https://www.assetzentri.com', '_blank', 'noopener')}>Open video</button>
        <button className="btn btn-primary" onClick={() => markStep(step, true)} disabled={step.done}>
          {step.done ? 'Marked watched' : "I've watched it"}
        </button>
      </div>
    </>
  )
}

// ── Step 7: knowledge check ───────────────────────────────────────────────────
const QUIZ = [
  {
    q: 'What does AssetZentri primarily help organisations manage?',
    options: ['Payroll', 'IT assets and devices', 'Social media', 'Logistics fleets'],
    answer: 1,
  },
  {
    q: 'What is the minimum score to pass the partner knowledge check?',
    options: ['50%', '65%', '80%', '100%'],
    answer: 2,
  },
  {
    q: 'How long is a registered deal protected by default?',
    options: ['30 days', '60 days', '90 days', 'Forever'],
    answer: 2,
  },
  {
    q: 'Which subscription tiers does AssetZentri offer?',
    options: ['Free and Paid', 'Standard and Premium', 'Bronze and Gold', 'Basic and Pro'],
    answer: 1,
  },
  {
    q: 'After a partner registers a new deal, what happens next?',
    options: ['It is instantly Won', 'It awaits approval by AssetZentri partner ops', 'It is deleted after 24 hours', 'Nothing — it stays hidden'],
    answer: 1,
  },
]

function KnowledgeCheckBody({ markStep, step, addToast }) {
  const [answers, setAnswers] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    const correct = QUIZ.reduce((n, item, i) => n + (answers[i] === item.answer ? 1 : 0), 0)
    const pct = Math.round((correct / QUIZ.length) * 100)
    if (pct < 80) {
      addToast?.(`You scored ${pct}%. You need 80% to pass — review and try again.`, 'error')
      return
    }
    setSubmitting(true)
    // Persist the score so partner ops can see knowledge-check completion.
    await client.post('/profile/knowledge-check', { score: pct }).catch(() => {})
    await markStep(step, true)
    addToast?.(`Passed with ${pct}%!`, 'success')
    setSubmitting(false)
  }

  if (step.done) {
    return (
      <>
        <div className="modal-body">
          <div style={{ color: '#15803D', fontWeight: 500 }}>✓ You've passed the knowledge check.</div>
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>You can retake it below if you'd like to refresh.</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => markStep(step, false)}>Retake</button>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="modal-body">
        {QUIZ.map((item, i) => (
          <div key={i} style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 8 }}>{i + 1}. {item.q}</div>
            {item.options.map((opt, oi) => (
              <label key={oi} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', fontSize: 13, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name={`q${i}`}
                  checked={answers[i] === oi}
                  onChange={() => setAnswers((a) => ({ ...a, [i]: oi }))}
                />
                {opt}
              </label>
            ))}
          </div>
        ))}
      </div>
      <div className="modal-footer">
        <button className="btn btn-primary" onClick={submit} disabled={submitting || Object.keys(answers).length < QUIZ.length}>
          {submitting ? 'Submitting…' : 'Submit answers'}
        </button>
      </div>
    </>
  )
}

// ── Step 8: territory plan ────────────────────────────────────────────────────
function TerritoryPlanBody({ profile, saveProfile, step }) {
  const [plan, setPlan] = useState(profile?.territory_plan || '')
  const [saving, setSaving] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    await saveProfile({ territory_plan: plan }, { completeStep: plan.trim() ? step : null })
    setSaving(false)
  }

  return (
    <form onSubmit={submit}>
      <div className="modal-body">
        <Field label="Your 90-day territory plan" hint="Target verticals, pipeline targets, and key prospects.">
          <textarea className="form-textarea" rows={8} value={plan} onChange={(e) => setPlan(e.target.value)} placeholder="Outline your go-to-market plan…" />
        </Field>
      </div>
      <div className="modal-footer">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving…' : 'Submit plan'}
        </button>
      </div>
    </form>
  )
}

function StepModal({ step, profile, saveProfile, acceptAgreement, markStep, addToast, navigate, onClose }) {
  // Steps 1/2/3/8 pre-fill from the partner profile; wait for it to load so the
  // form fields don't initialise empty and then go stale.
  const needsProfile = [1, 2, 3, 8].includes(step.step_number)
  const body = (() => {
    if (needsProfile && !profile) {
      return <div className="modal-body"><div className="loading-center"><div className="spinner" /></div></div>
    }
    switch (step.step_number) {
      case 1: return <CompanyProfileBody profile={profile} saveProfile={saveProfile} step={step} addToast={addToast} />
      case 2: return <LogoBody profile={profile} saveProfile={saveProfile} step={step} addToast={addToast} />
      case 3: return <AgreementBody profile={profile} acceptAgreement={acceptAgreement} />
      case 4: return <LinkOutBody text="Invite your sales team so they can register deals and access partner resources." cta="Go to Team" to="/team" navigate={navigate} closeModal={onClose} />
      case 5: return <VideoBody markStep={markStep} step={step} />
      case 6: return <LinkOutBody text="Browse the Sales Playbook, battlecards, and pricing guide in Product Collaterals." cta="Open Collaterals" to="/collateral" navigate={navigate} closeModal={onClose} />
      case 7: return <KnowledgeCheckBody markStep={markStep} step={step} addToast={addToast} />
      case 8: return <TerritoryPlanBody profile={profile} saveProfile={saveProfile} step={step} />
      default: return <div className="modal-body"><p style={{ color: 'var(--muted)' }}>{step.description}</p></div>
    }
  })()

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">{step.title}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>Step {step.step_number} · {step.done ? 'Completed' : 'Not yet complete'}</div>
          </div>
          <button className="btn-close" onClick={onClose}><CloseIcon /></button>
        </div>

        {step.description && (
          <div style={{ padding: '14px 24px 0', fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
            {step.description}
          </div>
        )}

        {body}

        <div style={{ padding: '0 24px 18px', display: 'flex', justifyContent: 'flex-start' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => markStep(step, !step.done)}
          >
            {step.done ? 'Mark as not complete' : 'Mark as complete'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Onboarding({ addToast, checklist: initialChecklist, setChecklist: setParentChecklist }) {
  const navigate = useNavigate()
  const [checklist, setChecklist] = useState(initialChecklist || [])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(!initialChecklist || initialChecklist.length === 0)
  const [activeStepId, setActiveStepId] = useState(null)

  useEffect(() => {
    if (!(initialChecklist && initialChecklist.length > 0)) {
      client.get('/checklist')
        .then((res) => {
          setChecklist(res.data)
          setParentChecklist?.(res.data)
        })
        .catch(() => addToast?.('Failed to load checklist', 'error'))
        .finally(() => setLoading(false))
    }
    client.get('/profile').then((res) => setProfile(res.data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (initialChecklist && initialChecklist.length > 0) {
      setChecklist(initialChecklist)
    }
  }, [initialChecklist])

  const markStep = async (step, done) => {
    try {
      await client.put(`/checklist/${step.id}`, { done })
      const updated = checklist.map((s) => (s.id === step.id ? { ...s, done } : s))
      setChecklist(updated)
      setParentChecklist?.(updated)
      addToast?.(done ? 'Step marked complete!' : 'Step marked incomplete', 'success')
    } catch (err) {
      addToast?.('Failed to update step', 'error')
    }
  }

  // Save partner profile fields; optionally mark a step complete on success.
  const saveProfile = async (patch, { completeStep } = {}) => {
    try {
      const res = await client.put('/profile', patch)
      setProfile(res.data)
      addToast?.('Saved', 'success')
      if (completeStep && !completeStep.done) await markStep(completeStep, true)
      return true
    } catch (err) {
      addToast?.(err.response?.data?.error || 'Failed to save', 'error')
      return false
    }
  }

  const acceptAgreement = async () => {
    try {
      const res = await client.post('/profile/accept-agreement')
      setProfile((p) => ({ ...(p || {}), agreement_accepted_at: res.data.agreement_accepted_at }))
      const step = checklist.find((s) => s.step_number === 3)
      if (step && !step.done) await markStep(step, true)
      addToast?.('Agreement accepted', 'success')
    } catch (err) {
      addToast?.('Failed to record acceptance', 'error')
    }
  }

  const doneCount = checklist.filter((s) => s.done).length
  const total = checklist.length
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0
  const activeStep = checklist.find((s) => s.id === activeStepId) || null

  if (loading) return <div className="loading-center"><div className="spinner" /><span>Loading checklist...</span></div>

  return (
    <div style={{ animation: 'fadeUp 0.2s ease' }}>
      <div className="page-header">
        <h1 className="page-title">Onboarding Checklist</h1>
        <p className="page-subtitle">Complete these steps to become a fully active partner. Click any step to view or edit its details.</p>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div style={{ fontFamily: 'Fraunces, serif', fontSize: 20, fontWeight: 600, color: 'var(--ink)' }}>
              {doneCount} of {total} complete
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{pct}% progress</div>
          </div>
          {doneCount === total && total > 0 && (
            <div style={{ padding: '8px 16px', background: '#F0FDF4', color: '#15803D', borderRadius: 8, fontWeight: 600, fontSize: 13 }}>
              Fully onboarded!
            </div>
          )}
        </div>
        <div className="progress-bar" style={{ height: 8 }}>
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="card" style={{ padding: '8px 16px' }}>
        {checklist.map((step) => (
          <div
            key={step.id}
            className={`checklist-item${step.done ? ' done' : ''}`}
            onClick={() => setActiveStepId(step.id)}
          >
            <div className={`step-circle${step.done ? '' : ' incomplete'}`}>
              {step.done ? <CheckIcon /> : step.step_number}
            </div>
            <div style={{ flex: 1 }}>
              <div className="step-title" style={{ textDecoration: step.done ? 'line-through' : 'none' }}>
                {step.title}
              </div>
              <div className="step-desc">{step.description}</div>
            </div>
            <div className="step-action">
              {step.done ? 'View / edit' : 'Open'}
            </div>
          </div>
        ))}
      </div>

      {activeStep && (
        <StepModal
          step={activeStep}
          profile={profile}
          saveProfile={saveProfile}
          acceptAgreement={acceptAgreement}
          markStep={markStep}
          addToast={addToast}
          navigate={navigate}
          onClose={() => setActiveStepId(null)}
        />
      )}
    </div>
  )
}
