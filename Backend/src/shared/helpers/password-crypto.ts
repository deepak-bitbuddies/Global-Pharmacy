import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto"

import { env } from "../../core/config/env.js"

/**
 * Reversible encryption for a branch's login password — deliberately separate from `passwordHash`
 * (bcrypt, one-way, still the only thing actually checked at login). This exists purely so a
 * super_admin can look a branch's current password back up from the Edit Branch screen instead of
 * it being lost the moment it's typed — a real, accepted trade-off against storing zero recoverable
 * copy, not a replacement for the bcrypt hash.
 *
 * AES-256-GCM: `PASSWORD_ENCRYPTION_KEY` is stretched to a 32-byte key via scrypt (so the env var
 * itself doesn't have to be exactly 32 bytes), a fresh random IV per encryption, and the GCM auth
 * tag is stored alongside the ciphertext so tampering/corruption is detected on decrypt rather than
 * silently producing garbage.
 */
const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16

let cachedKey: Buffer | null = null
function getKey(): Buffer {
  cachedKey ??= scryptSync(env.PASSWORD_ENCRYPTION_KEY, "global-pharmacy-branch-password", 32)
  return cachedKey
}

export function encryptPassword(plaintext: string): string {
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, getKey(), iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
  const authTag = cipher.getAuthTag()
  return Buffer.concat([iv, authTag, ciphertext]).toString("base64")
}

export function decryptPassword(payload: string): string {
  const buffer = Buffer.from(payload, "base64")
  const iv = buffer.subarray(0, IV_LENGTH)
  const authTag = buffer.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
  const ciphertext = buffer.subarray(IV_LENGTH + AUTH_TAG_LENGTH)

  const decipher = createDecipheriv(ALGORITHM, getKey(), iv)
  decipher.setAuthTag(authTag)
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8")
}
