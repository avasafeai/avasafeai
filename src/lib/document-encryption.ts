import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'
import { getKMSClient, getKMSKeyName } from './kms-client'

const ALGORITHM = 'aes-256-gcm'

/**
 * Envelope encryption:
 * 1. Generate a random 256-bit data key locally
 * 2. Encrypt the file with the data key (AES-256-GCM)
 * 3. Encrypt the data key with GCP KMS
 * 4. Store [encrypted key length][encrypted key][IV][auth tag][ciphertext]
 *
 * The data key is cleared from memory after use.
 */
export async function encryptFile(fileBuffer: Buffer): Promise<Buffer> {
  const client = getKMSClient()
  const keyName = getKMSKeyName()

  // Generate a fresh random data key for this file
  const dataKey = randomBytes(32)

  // Encrypt the data key with GCP KMS
  const [encryptResponse] = await client.encrypt({
    name: keyName,
    plaintext: dataKey,
  })

  if (!encryptResponse.ciphertext) {
    throw new Error('KMS encrypt returned empty ciphertext')
  }
  const encryptedDataKey = Buffer.from(encryptResponse.ciphertext as Uint8Array)

  // Encrypt the file bytes with the data key
  const iv = randomBytes(16)
  const cipher = createCipheriv(ALGORITHM, dataKey, iv)
  const encrypted = Buffer.concat([cipher.update(fileBuffer), cipher.final()])
  const authTag = cipher.getAuthTag()

  // Zero out the data key from memory immediately
  dataKey.fill(0)

  // Binary layout:
  // Bytes 0–3:           encrypted key length (UInt32BE)
  // Bytes 4–(4+keyLen):  encrypted data key
  // Next 16 bytes:       IV
  // Next 16 bytes:       GCM auth tag
  // Remainder:           encrypted file data
  const keyLengthBuf = Buffer.allocUnsafe(4)
  keyLengthBuf.writeUInt32BE(encryptedDataKey.length, 0)

  return Buffer.concat([keyLengthBuf, encryptedDataKey, iv, authTag, encrypted])
}

/**
 * Reverse of encryptFile — decrypts envelope-encrypted buffer back to the
 * original file bytes. GCP KMS decrypts the data key; AES-256-GCM decrypts
 * the file. Data key is zeroed after use.
 */
export async function decryptFile(encryptedBuffer: Buffer): Promise<Buffer> {
  const client = getKMSClient()
  const keyName = getKMSKeyName()

  // Read the encrypted key length from the header
  const keyLength = encryptedBuffer.readUInt32BE(0)

  const encryptedDataKey = encryptedBuffer.subarray(4, 4 + keyLength)
  const iv              = encryptedBuffer.subarray(4 + keyLength,      4 + keyLength + 16)
  const authTag         = encryptedBuffer.subarray(4 + keyLength + 16, 4 + keyLength + 32)
  const encryptedData   = encryptedBuffer.subarray(4 + keyLength + 32)

  // Ask GCP KMS to decrypt the data key
  const [decryptResponse] = await client.decrypt({
    name: keyName,
    ciphertext: encryptedDataKey,
  })

  if (!decryptResponse.plaintext) {
    throw new Error('KMS decrypt returned empty plaintext')
  }
  const dataKey = Buffer.from(decryptResponse.plaintext as Uint8Array)

  // Decrypt the file with the recovered data key
  const decipher = createDecipheriv(ALGORITHM, dataKey, iv)
  decipher.setAuthTag(authTag)
  const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()])

  // Zero out the data key
  dataKey.fill(0)

  return decrypted
}
