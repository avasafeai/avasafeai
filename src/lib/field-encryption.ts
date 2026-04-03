import { getKMSClient, getKMSKeyName } from './kms-client'

export const SENSITIVE_FIELDS = [
  'passport_number',
  'date_of_birth',
  'place_of_birth',
  'issue_date',
  'expiry_date',
] as const

export type SensitiveField = typeof SENSITIVE_FIELDS[number]

export async function encryptField(value: string): Promise<string> {
  if (!value) return value
  const client = getKMSClient()
  const [response] = await client.encrypt({
    name: getKMSKeyName(),
    plaintext: Buffer.from(value, 'utf8'),
  })
  const encrypted = Buffer.from(response.ciphertext as Uint8Array).toString('base64')
  return `enc:${encrypted}`
}

export async function decryptField(value: string): Promise<string> {
  if (!value || !value.startsWith('enc:')) return value
  const client = getKMSClient()
  const [response] = await client.decrypt({
    name: getKMSKeyName(),
    ciphertext: Buffer.from(value.slice(4), 'base64'),
  })
  return Buffer.from(response.plaintext as Uint8Array).toString('utf8')
}

export async function encryptSensitiveFields(
  data: Record<string, string>
): Promise<Record<string, string>> {
  const result = { ...data }
  for (const field of SENSITIVE_FIELDS) {
    if (result[field]) {
      result[field] = await encryptField(result[field])
    }
  }
  return result
}

export async function decryptSensitiveFields(
  data: Record<string, string>
): Promise<Record<string, string>> {
  const result = { ...data }
  for (const [key, val] of Object.entries(result)) {
    if (typeof val === 'string' && val.startsWith('enc:')) {
      result[key] = await decryptField(val)
    }
  }
  return result
}
