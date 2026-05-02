/**
 * Dispatch a custom event to open the FeedbackWidget.
 * Safe to call from any client component — the widget listens for this event.
 * In beta mode the widget checks its cooldown before opening.
 * In non-beta mode this is a no-op (widget ignores the event).
 */
export function triggerFeedback(location: string) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('ava:feedback-trigger', { detail: { location } }))
}
