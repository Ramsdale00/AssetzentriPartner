import React, { useEffect, useRef } from 'react'

let modalSeq = 0

// Accessible dialog: role=dialog + aria-modal, labelled by its title, closes on
// Escape, traps Tab focus inside, and restores focus to the trigger on close.
export default function Modal({ title, onClose, children, footer, size }) {
  const ref = useRef(null)
  const titleId = useRef(`modal-title-${++modalSeq}`)

  useEffect(() => {
    const node = ref.current
    const previouslyFocused = document.activeElement

    const focusable = () =>
      Array.from(
        node.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => el.offsetParent !== null)

    focusable()[0]?.focus()

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
        return
      }
      if (e.key === 'Tab') {
        const items = focusable()
        if (items.length === 0) return
        const idx = items.indexOf(document.activeElement)
        if (e.shiftKey && idx <= 0) {
          e.preventDefault()
          items[items.length - 1].focus()
        } else if (!e.shiftKey && idx === items.length - 1) {
          e.preventDefault()
          items[0].focus()
        }
      }
    }

    node.addEventListener('keydown', onKeyDown)
    return () => {
      node.removeEventListener('keydown', onKeyDown)
      if (previouslyFocused && previouslyFocused.focus) previouslyFocused.focus()
    }
  }, [onClose])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal${size === 'lg' ? ' modal-lg' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId.current}
        ref={ref}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title" id={titleId.current}>{title}</div>
          <button className="btn-close" aria-label="Close dialog" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        {children}
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  )
}
