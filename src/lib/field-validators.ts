// ── Client-side field validators ──────────────────────────────────────────────
// Return a string error message, or null if valid.

export const validators = {

  name: (value: string): string | null => {
    if (!value?.trim()) return 'Required'
    if (value.trim().length < 2) return 'Must be at least 2 characters'
    if (!/^[a-zA-Z\s\-'.]+$/.test(value)) return 'Names can only contain letters, spaces, and hyphens'
    return null
  },

  passport_number: (value: string): string | null => {
    if (!value?.trim()) return 'Required'
    if (value.trim().length < 6) return 'Passport number must be at least 6 characters'
    if (!/^[A-Z0-9]+$/i.test(value.trim())) return 'Passport number can only contain letters and numbers'
    return null
  },

  date: (value: string): string | null => {
    if (!value?.trim()) return 'Required'
    const date = new Date(value)
    if (isNaN(date.getTime())) return 'Enter a valid date'
    if (date.getFullYear() < 1900) return 'Enter a valid date'
    if (date.getFullYear() > new Date().getFullYear() + 20) return 'Date seems too far in the future'
    return null
  },

  email: (value: string): string | null => {
    if (!value?.trim()) return 'Required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email address'
    return null
  },

  phone: (value: string): string | null => {
    if (!value?.trim()) return 'Required'
    const digits = value.replace(/\D/g, '')
    if (digits.length < 7) return 'Enter a valid phone number'
    return null
  },

  zip: (value: string): string | null => {
    if (!value?.trim()) return 'Required'
    if (!/^\d{5}(-\d{4})?$/.test(value.trim())) return 'Enter a valid US ZIP code'
    return null
  },

  place_of_birth: (value: string): string | null => {
    if (!value?.trim()) return 'Required'
    if (value.trim().length < 2) return 'Enter a valid place of birth'
    return null
  },

  generic_text: (value: string, label: string): string | null => {
    if (!value?.trim()) return `${label} is required`
    if (value.trim().length < 2) return `${label} must be at least 2 characters`
    return null
  },
}

// ── Per-field validator map ────────────────────────────────────────────────────

export const FIELD_VALIDATORS: Record<string, (value: string) => string | null> = {
  first_name:           validators.name,
  last_name:            validators.name,
  father_name:          validators.name,
  mother_name:          validators.name,
  passport_number:      validators.passport_number,
  old_passport_number:  validators.passport_number,
  date_of_birth:        validators.date,
  passport_issue_date:  validators.date,
  passport_expiry_date: validators.date,
  email:                validators.email,
  phone:                validators.phone,
  address_zip:          validators.zip,
  place_of_birth:       validators.place_of_birth,
  address_city:         (v) => validators.generic_text(v, 'City'),
  address_line1:        (v) => validators.generic_text(v, 'Street address'),
}
