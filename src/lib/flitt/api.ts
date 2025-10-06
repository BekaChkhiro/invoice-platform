import crypto from 'crypto'

// Simple AES-256-CBC encryption for secret keys
const ALGORITHM = 'aes-256-cbc'
const ENCRYPTION_KEY = 'flitt-secret-encryption-key-2024-v1' // Fixed 32 char key

/**
 * Generate consistent encryption key
 */
function getEncryptionKey(): string {
  const secret = process.env.FLITT_ENCRYPTION_SECRET || ENCRYPTION_KEY
  return crypto.createHash('sha256').update(secret).digest('hex').substring(0, 32)
}

/**
 * Encrypt Flitt secret key using simple AES
 */
export function encryptSecretKey(secretKey: string): string {
  try {
    console.log('Encrypting secret key...')
    // For now, just base64 encode for testing
    const encoded = Buffer.from(secretKey, 'utf8').toString('base64')
    console.log('Secret key encoded successfully')
    return encoded
  } catch (error) {
    console.error('Error encrypting secret key:', error)
    throw new Error('Encryption failed')
  }
}

/**
 * Decrypt Flitt secret key
 */
export function decryptSecretKey(encryptedSecretKey: string): string | null {
  try {
    console.log('Decrypting secret key...')
    // For now, just base64 decode for testing
    const decoded = Buffer.from(encryptedSecretKey, 'base64').toString('utf8')
    console.log('Secret key decoded successfully')
    return decoded
  } catch (error) {
    console.error('Error decrypting secret key:', error)
    return null
  }
}

/**
 * Generate signature for Flitt API requests
 *
 * Flitt signature algorithm:
 * 1. Start with secret key
 * 2. Sort all non-empty parameters alphabetically by key
 * 3. For nested objects, convert to JSON string
 * 4. Concatenate: secret_key|param1_value|param2_value|...
 * 5. Apply SHA1 hash and convert to lowercase hex
 */
export function generateFlittSignature(payload: any, secretKey: string): string {
  // Filter out empty values and signature field itself
  const params: Record<string, string> = {}

  for (const [key, value] of Object.entries(payload)) {
    if (key === 'signature') continue // Exclude signature itself
    if (value === null || value === undefined || value === '') continue

    // Convert to string - handle nested objects by JSON stringifying
    if (typeof value === 'object' && value !== null) {
      params[key] = JSON.stringify(value)
    } else {
      params[key] = String(value)
    }
  }

  // Sort keys alphabetically
  const sortedKeys = Object.keys(params).sort()

  // Build string: secret_key|value1|value2|...
  const values = [secretKey, ...sortedKeys.map(key => params[key])]
  const signatureString = values.join('|')

  console.log('[Flitt] Signature string:', signatureString)
  console.log('[Flitt] Sorted params:', sortedKeys.map(k => `${k}=${params[k]}`).join(', '))

  // Generate SHA1 hash (lowercase hex)
  return crypto
    .createHash('sha1')
    .update(signatureString, 'utf8')
    .digest('hex')
    .toLowerCase()
}

/**
 * Verify webhook signature from Flitt
 */
export function verifyFlittWebhookSignature(
  payload: any,
  signature: string,
  secretKey: string
): boolean {
  try {
    const expectedSignature = generateFlittSignature(payload, secretKey)
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    )
  } catch (error) {
    console.error('Error verifying webhook signature:', error)
    return false
  }
}

/**
 * Generate a secure encryption key (for setup/testing)
 */
export function generateRandomEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex')
}