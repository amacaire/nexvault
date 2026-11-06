export type EncryptedPayload = {
  version: number
  salt: string
  iv: string
  ciphertext: string
}

const encoder = new TextEncoder()
const decoder = new TextDecoder()

function getCryptoSubtle() {
  const cryptoInstance = globalThis.crypto

  if (!cryptoInstance || !cryptoInstance.subtle) {
    throw new Error(
      'Le chiffrement Web Crypto n’est pas disponible. Ouvrez l’application via HTTPS ou localhost pour utiliser le vault chiffré.',
    )
  }

  return cryptoInstance.subtle
}

async function deriveKey(masterPassword: string, salt: Uint8Array) {
  const subtle = getCryptoSubtle()
  const saltBuffer = Uint8Array.from(salt).buffer

  const baseKey = await subtle.importKey(
    'raw',
    encoder.encode(masterPassword),
    'PBKDF2',
    false,
    ['deriveKey'],
  )

  return subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 200_000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

export async function encryptVaultPayload(value: unknown, masterPassword: string): Promise<EncryptedPayload> {
  const cryptoInstance = globalThis.crypto
  if (!cryptoInstance || !cryptoInstance.getRandomValues) {
    throw new Error('Web Crypto n’est pas disponible dans ce navigateur.')
  }

  const subtle = getCryptoSubtle()
  const salt = cryptoInstance.getRandomValues(new Uint8Array(16))
  const iv = cryptoInstance.getRandomValues(new Uint8Array(12))
  const key = await deriveKey(masterPassword, salt)
  const ciphertext = await subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(JSON.stringify(value)),
  )

  return {
    version: 1,
    salt: bufferToBase64(salt),
    iv: bufferToBase64(iv),
    ciphertext: bufferToBase64(new Uint8Array(ciphertext)),
  }
}

export async function decryptVaultPayload(payload: EncryptedPayload, masterPassword: string): Promise<string> {
  const subtle = getCryptoSubtle()
  const salt = base64ToBuffer(payload.salt)
  const iv = base64ToBuffer(payload.iv)
  const key = await deriveKey(masterPassword, salt)
  const ciphertext = base64ToBuffer(payload.ciphertext)
  const decrypted = await subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)
  return decoder.decode(decrypted)
}

function bufferToBase64(data: Uint8Array) {
  let binary = ''
  data.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary)
}

function base64ToBuffer(value: string) {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}
