// ── Plan model ────────────────────────────────────────────────────────────────
// Plan = the user's document storage subscription (profiles.plan)
// ApplicationTier = the per-application service level (applications.tier)
// These are completely independent. A free user can buy guided. A locker user
// can buy an expert session. Plan and tier do not overlap.

export type Plan = 'free' | 'locker'

export type ApplicationTier = 'guided' | 'human_assisted'

export const PLAN_LIMITS: Record<Plan, {
  maxDocuments: number
  alertsEnabled: boolean
  label: string
  price: string
  period: string
}> = {
  free: {
    maxDocuments: 3,
    alertsEnabled: false,
    label: 'Free',
    price: '$0',
    period: 'forever',
  },
  locker: {
    maxDocuments: Infinity,
    alertsEnabled: true,
    label: 'Locker',
    price: '$19',
    period: 'per year',
  },
}

export const APPLICATION_TIERS: Record<ApplicationTier, {
  label: string
  price: number
  priceLabel: string
  description: string
  features: string[]
}> = {
  guided: {
    label: 'Guided',
    price: 29,
    priceLabel: '$29',
    description: 'AVA pre-fills and validates your entire application',
    features: [
      'AVA pre-fills from your documents',
      'Validates against rejection causes',
      'Readiness score with auto-fixes',
      'Companion mode for portal',
      'PDF checklist',
      'Rejection guarantee',
    ],
  },
  human_assisted: {
    label: 'Expert Session',
    price: 79,
    priceLabel: '$79',
    description: 'Live screen share with an Avasafe expert',
    features: [
      'Everything in Guided',
      '45-minute Zoom session',
      'Expert guides portal submission',
      'You handle passwords only',
      'Priority 48-hour booking',
      'Support until card arrives',
    ],
  },
}

export function canAddDocument(plan: Plan, currentCount: number): boolean {
  return currentCount < PLAN_LIMITS[plan].maxDocuments
}

export function hasAlerts(plan: Plan): boolean {
  return PLAN_LIMITS[plan].alertsEnabled
}

export function getResumeUrl(app: {
  id: string
  service_type: string
  tier?: string | null
}): string {
  if (app.tier === 'human_assisted') {
    return `/apply/human?applicationId=${app.id}`
  }
  return `/apply/prepare/${app.service_type}?applicationId=${app.id}`
}
