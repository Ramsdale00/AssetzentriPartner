import React, { useEffect, useRef } from 'react'

// Cloudflare Turnstile widget. Renders only when VITE_TURNSTILE_SITE_KEY is set,
// so the app works unchanged in local dev without a Cloudflare account.
// Calls onToken(token) when solved, and onToken('') on expiry/error.
const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY
const SCRIPT_ID = 'cf-turnstile-script'
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

function loadScript() {
  return new Promise((resolve, reject) => {
    if (window.turnstile) return resolve()
    let script = document.getElementById(SCRIPT_ID)
    if (script) {
      script.addEventListener('load', () => resolve())
      script.addEventListener('error', reject)
      return
    }
    script = document.createElement('script')
    script.id = SCRIPT_ID
    script.src = SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = reject
    document.head.appendChild(script)
  })
}

export default function Turnstile({ onToken }) {
  const containerRef = useRef(null)
  const widgetIdRef = useRef(null)

  useEffect(() => {
    if (!SITE_KEY) return
    let cancelled = false

    loadScript()
      .then(() => {
        if (cancelled || !window.turnstile || !containerRef.current) return
        if (widgetIdRef.current !== null) return
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: SITE_KEY,
          callback: (token) => onToken(token),
          'error-callback': () => onToken(''),
          'expired-callback': () => onToken(''),
        })
      })
      .catch(() => {
        // Script blocked or failed to load — leave the token empty; the backend
        // will reject if Turnstile is required.
        if (!cancelled) onToken('')
      })

    return () => {
      cancelled = true
      if (widgetIdRef.current !== null && window.turnstile) {
        try { window.turnstile.remove(widgetIdRef.current) } catch { /* noop */ }
        widgetIdRef.current = null
      }
    }
  }, [onToken])

  if (!SITE_KEY) return null
  return <div ref={containerRef} style={{ marginBottom: 16 }} />
}
