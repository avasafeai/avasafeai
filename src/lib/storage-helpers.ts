import { createServiceClient } from '@/lib/supabase/server'

/**
 * Download a stored document file and return it as a Buffer.
 * Used by the PDF generation API to embed original documents.
 * Returns null if the file doesn't exist or download fails.
 */
export async function getDocumentFile(storagePath: string): Promise<Buffer | null> {
  try {
    const serviceClient = createServiceClient()
    const { data, error } = await serviceClient.storage
      .from('documents')
      .download(storagePath)

    if (error || !data) return null

    const arrayBuffer = await data.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch {
    return null
  }
}

/**
 * Generate a short-lived signed URL for a stored document.
 * Always generate server-side — never expose storage paths to clients.
 * Returns null if signing fails.
 */
export async function getSignedUrl(
  storagePath: string,
  expiresInSeconds: number = 3600
): Promise<string | null> {
  try {
    const serviceClient = createServiceClient()
    const { data, error } = await serviceClient.storage
      .from('documents')
      .createSignedUrl(storagePath, expiresInSeconds)

    if (error || !data) return null
    return data.signedUrl
  } catch {
    return null
  }
}
