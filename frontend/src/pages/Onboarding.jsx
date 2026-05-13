import React, { useState, useEffect } from 'react'
import client from '../api/client'

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

export default function Onboarding({ addToast, checklist: initialChecklist, setChecklist: setParentChecklist }) {
  const [checklist, setChecklist] = useState(initialChecklist || [])
  const [loading, setLoading] = useState(!initialChecklist || initialChecklist.length === 0)
  const [toggling, setToggling] = useState(null)

  useEffect(() => {
    if (initialChecklist && initialChecklist.length > 0) {
      setChecklist(initialChecklist)
      setLoading(false)
      return
    }
    client.get('/checklist')
      .then((res) => {
        setChecklist(res.data)
        setParentChecklist?.(res.data)
      })
      .catch(() => addToast?.('Failed to load checklist', 'error'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (initialChecklist && initialChecklist.length > 0) {
      setChecklist(initialChecklist)
    }
  }, [initialChecklist])

  const toggleStep = async (step) => {
    if (toggling) return
    setToggling(step.id)
    const newDone = !step.done
    try {
      await client.put(`/checklist/${step.id}`, { done: newDone })
      const updated = checklist.map(s => s.id === step.id ? { ...s, done: newDone } : s)
      setChecklist(updated)
      setParentChecklist?.(updated)
      addToast?.(newDone ? 'Step marked complete!' : 'Step marked incomplete', 'success')
    } catch (err) {
      addToast?.('Failed to update step', 'error')
    } finally {
      setToggling(null)
    }
  }

  const doneCount = checklist.filter(s => s.done).length
  const total = checklist.length
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0

  if (loading) return <div className="loading-center"><div className="spinner" /><span>Loading checklist...</span></div>

  return (
    <div style={{ animation: 'fadeUp 0.2s ease' }}>
      <div className="page-header">
        <h1 className="page-title">Onboarding Checklist</h1>
        <p className="page-subtitle">Complete these steps to become a fully active partner.</p>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div style={{ fontFamily: 'Fraunces, serif', fontSize: 20, fontWeight: 600, color: 'var(--ink)' }}>
              {doneCount} of {total} complete
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
              {pct}% progress
            </div>
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
            onClick={() => toggleStep(step)}
            style={{ opacity: toggling === step.id ? 0.6 : 1 }}
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
            <div className={`step-action${step.done ? ' done-label' : ''}`}>
              {step.done ? 'Done' : 'Mark complete'}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
