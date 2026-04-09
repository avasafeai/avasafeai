// Pure date utilities — no server-only imports, safe for client and server

export function isMinor(dateOfBirth: string): boolean {
  if (!dateOfBirth) return false
  try {
    const dob = new Date(dateOfBirth)
    if (isNaN(dob.getTime())) return false
    const today = new Date()
    let age = today.getFullYear() - dob.getFullYear()
    const m = today.getMonth() - dob.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--
    return age < 18
  } catch {
    return false
  }
}
