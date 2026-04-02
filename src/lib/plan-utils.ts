export type Plan = 'free' | 'locker' | 'apply' | 'family'

export const PLAN_LIMITS = {
  free: {
    maxDocuments: 3,
    canApply: false,
    alertsEnabled: false,
    maxProfiles: 1,
  },
  locker: {
    maxDocuments: Infinity,
    canApply: false,
    alertsEnabled: true,
    maxProfiles: 2,
  },
  apply: {
    maxDocuments: Infinity,
    canApply: true,
    alertsEnabled: true,
    maxProfiles: 5,
  },
  family: {
    maxDocuments: Infinity,
    canApply: true,
    alertsEnabled: true,
    maxProfiles: Infinity,
  },
} satisfies Record<Plan, { maxDocuments: number; canApply: boolean; alertsEnabled: boolean; maxProfiles: number }>

export function canAddDocument(plan: Plan, currentCount: number): boolean {
  return currentCount < PLAN_LIMITS[plan].maxDocuments
}

export function canApply(plan: Plan): boolean {
  return PLAN_LIMITS[plan].canApply
}
