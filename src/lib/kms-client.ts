import { KeyManagementServiceClient } from '@google-cloud/kms'

let kmsClient: KeyManagementServiceClient | null = null

export function getKMSClient(): KeyManagementServiceClient {
  if (!kmsClient) {
    const rawKey = process.env.GCP_SERVICE_ACCOUNT_KEY
    if (!rawKey) throw new Error('GCP_SERVICE_ACCOUNT_KEY env var is not set')

    const credentials = JSON.parse(rawKey) as Record<string, unknown>
    kmsClient = new KeyManagementServiceClient({ credentials })
  }
  return kmsClient
}

export function getKMSKeyName(): string {
  const name = process.env.GCP_KMS_KEY_NAME
  if (!name) throw new Error('GCP_KMS_KEY_NAME env var is not set')
  return name
}
