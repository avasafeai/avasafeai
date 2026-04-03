import { createServiceClient } from '@/lib/supabase/server'
import { decryptFile } from './document-encryption'

/**
 * Download and decrypt a stored document file, returning the original bytes.
 * Used by the PDF generation API and the document-preview API.
 * Returns null if the file doesn't exist, decryption fails, or any error occurs.
 */
export async function getDocumentFile(storagePath: string): Promise<Buffer | null> {
  try {
    const serviceClient = createServiceClient()
    const { data, error } = await serviceClient.storage
      .from('documents')
      .download(storagePath)

    if (error || !data) {
      console.error('[storage-helpers] Download error:', error?.message)
      return null
    }

    const arrayBuffer = await data.arrayBuffer()
    const encryptedBuffer = Buffer.from(arrayBuffer)

    return await decryptFile(encryptedBuffer)
  } catch (err) {
    console.error('[storage-helpers] getDocumentFile error:', err)
    return null
  }
}
