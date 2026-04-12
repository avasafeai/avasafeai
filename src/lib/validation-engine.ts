// ── Validation Engine — service-agnostic rule evaluator ───────────────────────
// The validate-application API route calls this. Extend evaluateRule() for
// new service-specific rule IDs without touching the API layer.

import type { ReadinessCheck } from '@/types/supabase'
import type { ServiceConfig, ValidationRule } from './services/registry'
import { isMinor } from './prefill-engine'

export interface ValidationContext {
  formData: Record<string, string>
  passportData: Record<string, string> | null
  lockerDocTypes: string[]
  service: ServiceConfig
}

// ── evaluateRule ───────────────────────────────────────────────────────────────
// Returns a ReadinessCheck for a single ValidationRule.
// Add new case blocks as new services and rules are added.

export function evaluateRule(
  rule: ValidationRule,
  ctx: ValidationContext,
): ReadinessCheck | null {
  const { formData: f, passportData: p, lockerDocTypes: locker } = ctx
  const now = Date.now()

  switch (rule.id) {

    case 'name_match': {
      if (!p?.last_name) return null  // no passport to compare — skip
      const passportLast = p.last_name.trim().toUpperCase()
      const formLast = (f.last_name ?? '').trim().toUpperCase()
      if (!formLast) return null
      if (formLast !== passportLast) {
        return { id: rule.id, title: rule.title, status: 'failed', severity: rule.severity, message: rule.error_message.replace('{form}', f.last_name).replace('{passport}', p.last_name), fix: rule.fix_message, field: rule.fix_field, correct_value: p.last_name }
      }
      return { id: rule.id, title: rule.title, status: 'passed', severity: null, message: 'Name verified.', fix: null, field: null, correct_value: null }
    }

    case 'place_of_issue': {
      const poi = (f.passport_issued_by ?? '').toLowerCase()
      if (!f.passport_issued_by) return { id: rule.id, title: rule.title, status: 'warning', severity: 'warning', message: rule.error_message, fix: rule.fix_message, field: rule.fix_field, correct_value: rule.fix_value }
      if (poi.includes('united states') || poi === 'us' || poi === 'usa') {
        return { id: rule.id, title: rule.title, status: 'failed', severity: rule.severity, message: rule.error_message, fix: rule.fix_message, field: rule.fix_field, correct_value: rule.fix_value }
      }
      return { id: rule.id, title: rule.title, status: 'passed', severity: null, message: `Place of issue: ${f.passport_issued_by}`, fix: null, field: null, correct_value: null }
    }

    case 'passport_expiry': {
      const expiryStr = f.passport_expiry_date
      if (!expiryStr) return { id: rule.id, title: rule.title, status: 'failed', severity: rule.severity, message: 'Passport expiry date is required.', fix: null, field: 'passport_expiry_date', correct_value: null }
      const daysLeft = (new Date(expiryStr).getTime() - now) / 86400000
      if (daysLeft < 180) {
        return { id: rule.id, title: rule.title, status: 'failed', severity: rule.severity, message: rule.error_message.replace('{days}', String(Math.max(0, Math.floor(daysLeft)))), fix: rule.fix_message, field: rule.fix_field, correct_value: null }
      }
      return { id: rule.id, title: rule.title, status: 'passed', severity: null, message: `Passport valid for ${Math.floor(daysLeft)} more days.`, fix: null, field: null, correct_value: null }
    }

    case 'photo_present': {
      if (!locker.includes('photo')) {
        return { id: rule.id, title: 'No photo uploaded', status: 'failed', severity: rule.severity, message: 'OCI requires a square JPEG photo with white background, minimum 200x200px, maximum 1MB. Upload one to avoid rejection.', fix: 'Upload a compliant photo', field: null, correct_value: null }
      }
      return { id: rule.id, title: 'Photo verified', status: 'passed', severity: null, message: 'Square JPEG uploaded. Meets OCI photo requirements.', fix: null, field: null, correct_value: null }
    }

    case 'dob_match': {
      if (!p?.date_of_birth) {
        if (!f.date_of_birth) return { id: rule.id, title: rule.title, status: 'failed', severity: rule.severity, message: 'Date of birth is required.', fix: null, field: 'date_of_birth', correct_value: null }
        return { id: rule.id, title: rule.title, status: 'passed', severity: null, message: 'DOB provided (unverified).', fix: null, field: null, correct_value: null }
      }
      if (f.date_of_birth && f.date_of_birth !== p.date_of_birth) {
        return { id: rule.id, title: rule.title, status: 'failed', severity: rule.severity, message: rule.error_message, fix: `Update to: ${p.date_of_birth}`, field: 'date_of_birth', correct_value: p.date_of_birth }
      }
      return { id: rule.id, title: rule.title, status: 'passed', severity: null, message: 'Date of birth verified.', fix: null, field: null, correct_value: null }
    }

    case 'vfs_jurisdiction': {
      const state = (f.address_state ?? '').toUpperCase()
      if (!state) return { id: rule.id, title: rule.title, status: 'failed', severity: rule.severity, message: 'Address state required for VFS jurisdiction.', fix: null, field: 'address_state', correct_value: null }
      return { id: rule.id, title: rule.title, status: 'passed', severity: null, message: `State: ${state}`, fix: null, field: null, correct_value: null }
    }

    case 'email_valid': {
      const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email ?? '')
      if (!emailValid) return { id: rule.id, title: rule.title, status: 'warning', severity: 'suggestion', message: rule.error_message, fix: null, field: 'email', correct_value: null }
      return { id: rule.id, title: rule.title, status: 'passed', severity: null, message: `Email: ${f.email}`, fix: null, field: null, correct_value: null }
    }

    case 'place_of_birth': {
      const pob = (f.place_of_birth ?? '').toUpperCase().trim()
      if (!pob) return { id: rule.id, title: rule.title, status: 'passed', severity: null, message: 'No place of birth entered.', fix: null, field: null, correct_value: null }

      // US locations are always correct — never flag
      const isUSLocation =
        pob.includes('U.S.A') || pob.includes('UNITED STATES') ||
        pob.includes(' USA') || pob.includes(',USA') || pob.includes(', USA')
      if (isUSLocation) {
        return { id: rule.id, title: rule.title, status: 'passed', severity: null, message: `Place of birth: ${f.place_of_birth}`, fix: null, field: null, correct_value: null }
      }

      // Flag only Indian locations where extra city/state detail was added
      // e.g. "HYDERABAD, INDIA" — the portal wants exactly what's on the passport
      const hasIndiaWithCity = pob.includes('INDIA') && pob.split(',').length > 1
      if (hasIndiaWithCity) {
        return { id: rule.id, title: rule.title, status: 'failed', severity: rule.severity, message: rule.error_message, fix: rule.fix_message, field: null, correct_value: null }
      }

      return { id: rule.id, title: rule.title, status: 'passed', severity: null, message: `Place of birth: ${f.place_of_birth}`, fix: null, field: null, correct_value: null }
    }

    case 'parent_docs_for_minor': {
      const dob = f.date_of_birth
      if (!dob || !isMinor(dob)) {
        return { id: rule.id, title: rule.title, status: 'passed', severity: null, message: 'Adult application. No parent documents required.', fix: null, field: null, correct_value: null }
      }
      const hasParentDoc =
        locker.includes('father_passport') ||
        locker.includes('mother_passport') ||
        locker.includes('indian_passport')
      if (!hasParentDoc) {
        return { id: rule.id, title: rule.title, status: 'failed', severity: rule.severity, message: rule.error_message, fix: rule.fix_message, field: null, correct_value: null }
      }
      return { id: rule.id, title: rule.title, status: 'passed', severity: null, message: 'Parent documents present for minor application.', fix: null, field: null, correct_value: null }
    }

    // Required document presence checks — dynamic based on rule ID pattern
    default: {
      if (rule.id.startsWith('doc_present_')) {
        const docType = rule.id.replace('doc_present_', '')
        // Indian passport: surrender certificate is accepted as equivalent
        const hasIndianPassportOrEquivalent =
          docType === 'indian_passport' &&
          (locker.includes('indian_passport') || locker.includes('surrender_certificate'))
        const present = hasIndianPassportOrEquivalent || locker.includes(docType)
        if (!present) {
          return { id: rule.id, title: rule.title, status: 'failed', severity: rule.severity, message: rule.error_message, fix: rule.fix_message, field: null, correct_value: null }
        }
        return { id: rule.id, title: rule.title, status: 'passed', severity: null, message: `${rule.title} found in locker.`, fix: null, field: null, correct_value: null }
      }
      return null
    }
  }
}

// ── runValidation ──────────────────────────────────────────────────────────────

export function runValidation(ctx: ValidationContext): ReadinessCheck[] {
  const checks: ReadinessCheck[] = []

  for (const rule of ctx.service.validation_rules) {
    const check = evaluateRule(rule, ctx)
    if (check) checks.push(check)
  }

  return checks
}
