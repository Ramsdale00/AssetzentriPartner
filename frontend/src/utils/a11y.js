// Make a non-button element (e.g. a table row) operable by keyboard and assistive
// tech: it gains a button role, is focusable, and activates on Enter/Space.
export function rowActivation(onActivate, label) {
  return {
    role: 'button',
    tabIndex: 0,
    'aria-label': label,
    onClick: onActivate,
    onKeyDown: (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onActivate(e)
      }
    },
  }
}
