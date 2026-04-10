'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, X, Send } from 'lucide-react'
import { analytics } from '@/lib/analytics'

const EMOJIS = ['😞', '😕', '😐', '🙂', '😍']
const TAGS = ['Too complicated', 'Missing documents', 'Slow', 'Confusing wording', 'Great experience', 'Other']
const DEDUP_KEY = 'ava_feedback_shown'

interface Props {
  triggerLocation?: string
  serviceType?: string
  autoTriggerMs?: number   // if set, widget auto-opens after this many ms (once per session)
}

export default function FeedbackWidget({ triggerLocation = 'manual', serviceType, autoTriggerMs }: Props) {
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState<number | null>(null)
  const [note, setNote] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Auto-trigger once per session
  useEffect(() => {
    if (!autoTriggerMs) return
    const alreadyShown = sessionStorage.getItem(DEDUP_KEY)
    if (alreadyShown) return
    const timer = setTimeout(() => {
      setOpen(true)
      sessionStorage.setItem(DEDUP_KEY, '1')
    }, autoTriggerMs)
    return () => clearTimeout(timer)
  }, [autoTriggerMs])

  function toggleTag(tag: string) {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  async function handleSubmit() {
    if (rating === null) return
    setSubmitting(true)
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: rating + 1, note, tags, triggerLocation, serviceType }),
      })
      analytics.feedbackSubmitted({ rating: rating + 1, triggerLocation, serviceType })
      setSubmitted(true)
    } catch { /* non-fatal */ }
    setSubmitting(false)
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        title="Give feedback"
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 200,
          width: 44, height: 44, borderRadius: '50%',
          background: 'var(--color-navy)', color: 'white',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(15,45,82,0.35)',
        }}
      >
        {open ? <X size={18} /> : <MessageSquare size={18} />}
      </button>

      {/* Widget panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 80, right: 24, zIndex: 200,
          width: 320, background: 'white', borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0,0,0,0.16)', overflow: 'hidden',
          fontFamily: 'var(--font-body)',
        }}>
          {/* Header */}
          <div style={{ background: 'var(--color-navy)', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: 'white', fontWeight: 600, fontSize: 15 }}>How are we doing?</span>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', display: 'flex', padding: 0 }}>
              <X size={16} />
            </button>
          </div>

          {submitted ? (
            <div style={{ padding: '32px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🙏</div>
              <p style={{ fontWeight: 600, color: 'var(--color-navy)', marginBottom: 6 }}>Thank you!</p>
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                Your feedback helps AVA get better every day.
              </p>
            </div>
          ) : (
            <div style={{ padding: '20px 20px 24px' }}>
              {/* Emoji rating */}
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
                How was your experience?
              </p>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {EMOJIS.map((emoji, i) => (
                  <button
                    key={i}
                    onClick={() => setRating(i)}
                    title={['Terrible', 'Bad', 'OK', 'Good', 'Love it'][i]}
                    style={{
                      flex: 1, height: 44, borderRadius: 10, fontSize: 20,
                      border: rating === i ? '2px solid var(--color-navy)' : '1px solid var(--color-border)',
                      background: rating === i ? 'var(--color-navy)' : 'white',
                      cursor: 'pointer', transition: 'all 150ms ease',
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Tags */}
              {rating !== null && rating <= 2 && (
                <div style={{ marginBottom: 14 }}>
                  <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 8 }}>What went wrong?</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {TAGS.slice(0, 5).map(tag => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        style={{
                          padding: '4px 10px', borderRadius: 100, fontSize: 12,
                          border: tags.includes(tag) ? '1.5px solid var(--color-navy)' : '1px solid var(--color-border)',
                          background: tags.includes(tag) ? 'var(--color-navy)' : 'white',
                          color: tags.includes(tag) ? 'white' : 'var(--color-text-secondary)',
                          cursor: 'pointer',
                        }}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Note */}
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Anything else? (optional)"
                rows={3}
                style={{
                  width: '100%', borderRadius: 10, border: '1px solid var(--color-border)',
                  padding: '10px 12px', fontSize: 13, fontFamily: 'var(--font-body)',
                  resize: 'none', outline: 'none', color: 'var(--color-text-primary)',
                  boxSizing: 'border-box', marginBottom: 14,
                }}
              />

              <button
                onClick={handleSubmit}
                disabled={rating === null || submitting}
                style={{
                  width: '100%', height: 42, borderRadius: 10,
                  background: rating === null ? 'var(--color-border)' : 'var(--color-navy)',
                  color: 'white', border: 'none', fontSize: 14, fontWeight: 600,
                  cursor: rating === null ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'background 150ms ease',
                }}
              >
                <Send size={14} />
                {submitting ? 'Sending…' : 'Send feedback'}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  )
}
