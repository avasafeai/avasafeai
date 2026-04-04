export type Plan = 'free' | 'locker' | 'guided' | 'human_assisted'

export const PLAN_LIMITS = {
  free: {
    maxDocuments: 3,
    canApply: false,
    alertsEnabled: false,
    maxProfiles: 1,
    humanAssistance: false,
    label: 'Free',
    price: '$0',
    period: 'forever',
  },
  locker: {
    maxDocuments: Infinity,
    canApply: false,
    alertsEnabled: true,
    maxProfiles: 1,
    humanAssistance: false,
    label: 'Locker',
    price: '$19',
    period: 'per year',
  },
  guided: {
    maxDocuments: Infinity,
    canApply: true,
    alertsEnabled: true,
    maxProfiles: 1,
    humanAssistance: false,
    label: 'Guided',
    price: '$29',
    period: 'per application',
  },
  human_assisted: {
    maxDocuments: Infinity,
    canApply: true,
    alertsEnabled: true,
    maxProfiles: 1,
    humanAssistance: true,
    label: 'Human Assisted',
    price: '$79',
    period: 'per application',
  },
} satisfies Record<Plan, {
  maxDocuments: number
  canApply: boolean
  alertsEnabled: boolean
  maxProfiles: number
  humanAssistance: boolean
  label: string
  price: string
  period: string
}>

export function canAddDocument(plan: Plan, currentCount: number): boolean {
  return currentCount < PLAN_LIMITS[plan].maxDocuments
}

export function canUserApply(plan: Plan): boolean {
  return PLAN_LIMITS[plan].canApply
}

export function hasHumanAssistance(plan: Plan): boolean {
  return PLAN_LIMITS[plan].humanAssistance
}

// Legacy alias — keep so existing imports don't break
export const canApply = canUserApply
