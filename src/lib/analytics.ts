'use client'

import posthog from 'posthog-js'

export function initAnalytics(userId?: string, email?: string) {
  if (typeof window === 'undefined') return
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return
  if (posthog.__loaded) return  // already initialised

  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://app.posthog.com',
    capture_pageview: false,  // we fire manually on pathname change
    capture_pageleave: true,
    session_recording: {
      maskAllInputs: true,
      maskInputOptions: { password: true },
    },
  })

  if (userId) {
    posthog.identify(userId, { email, platform: 'avasafe' })
  }
}

export function resetAnalytics() {
  if (typeof window === 'undefined') return
  posthog.reset()
}

export const analytics = {
  // User lifecycle
  userSignedUp: (props: { plan: string; isBeta: boolean }) =>
    posthog.capture('user_signed_up', props),

  userLoggedIn: () => posthog.capture('user_logged_in'),

  // Documents
  documentUploadStarted: (props: { docType: string }) =>
    posthog.capture('document_upload_started', props),

  documentUploadCompleted: (props: { docType: string; fieldsExtracted: number; hadEncryptedFields: boolean }) =>
    posthog.capture('document_upload_completed', props),

  documentUploadFailed: (props: { docType: string; error: string }) =>
    posthog.capture('document_upload_failed', props),

  // Application funnel
  applicationTierSelected: (props: { serviceType: string; tier: string }) =>
    posthog.capture('application_tier_selected', props),

  paymentStarted: (props: { serviceType: string; tier: string; amount: number }) =>
    posthog.capture('payment_started', props),

  paymentCompleted: (props: { serviceType: string; tier: string; amount: number; applicationId: string }) =>
    posthog.capture('payment_completed', props),

  prepareScreenViewed: (props: { serviceType: string; prefillCoverage: number; documentsReady: number; documentsMissing: number }) =>
    posthog.capture('prepare_screen_viewed', props),

  formStarted: (props: { serviceType: string; applicationId: string }) =>
    posthog.capture('form_started', props),

  formStepCompleted: (props: { serviceType: string; step: number; totalSteps: number; wasPreFilled: boolean }) =>
    posthog.capture('form_step_completed', props),

  formAbandoned: (props: { serviceType: string; step: number; totalSteps: number }) =>
    posthog.capture('form_abandoned', props),

  reviewScreenViewed: (props: { serviceType: string; readinessScore: number; blockerCount: number; warningCount: number; tier: string }) =>
    posthog.capture('review_screen_viewed', props),

  issueFixed: (props: { serviceType: string; issueId: string; fixType: 'inline' | 'manual' }) =>
    posthog.capture('issue_fixed', props),

  upgradePromptViewed: (props: { serviceType: string; readinessScore: number; location: 'review' | 'companion' | 'dashboard' }) =>
    posthog.capture('upgrade_prompt_viewed', props),

  upgradeStarted: (props: { serviceType: string; applicationId: string }) =>
    posthog.capture('upgrade_started', props),

  upgradeCompleted: (props: { serviceType: string; applicationId: string }) =>
    posthog.capture('upgrade_completed', props),

  applicationCompleted: (props: { serviceType: string; tier: string; applicationId: string; readinessScore: number; completionMethod: 'usan' | 'checklist' }) =>
    posthog.capture('application_completed', props),

  // Pain points
  pollingTimedOut: (props: { serviceType: string; attempts: number }) =>
    posthog.capture('payment_polling_timeout', props),

  downloadFailed: (props: { documentId: string; error: string }) =>
    posthog.capture('download_failed', props),

  // Locker
  lockerUpgradeStarted: () => posthog.capture('locker_upgrade_started'),
  lockerUpgradeCompleted: () => posthog.capture('locker_upgrade_completed'),

  // Feedback
  feedbackSubmitted: (props: { rating: number; triggerLocation: string; serviceType?: string }) =>
    posthog.capture('feedback_submitted', props),
}
