(() => {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  function getSubtle() {
    if (!window.crypto || !window.crypto.subtle) {
      throw new Error('Web Crypto unavailable in this context');
    }
    return window.crypto.subtle;
  }

  async function deriveKey(masterPassword, salt) {
    const subtle = getSubtle();
    const baseKey = await subtle.importKey(
      'raw',
      encoder.encode(masterPassword),
      'PBKDF2',
      false,
      ['deriveKey'],
    );

    return subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 200000,
        hash: 'SHA-256',
      },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt'],
    );
  }

  function bufferToBase64(bytes) {
    let binary = '';
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return btoa(binary);
  }

  function base64ToBuffer(value) {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  async function encryptVaultPayload(value, masterPassword) {
    const subtle = getSubtle();
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(masterPassword, salt);
    const ciphertext = await subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(JSON.stringify(value)),
    );

    return {
      version: 1,
      salt: bufferToBase64(salt),
      iv: bufferToBase64(iv),
      ciphertext: bufferToBase64(new Uint8Array(ciphertext)),
    };
  }

  async function decryptVaultPayload(payload, masterPassword) {
    const subtle = getSubtle();
    const salt = base64ToBuffer(payload.salt)
    const iv = base64ToBuffer(payload.iv)
    const key = await deriveKey(masterPassword, salt)
    const decrypted = await subtle.decrypt({ name: 'AES-GCM', iv }, key, base64ToBuffer(payload.ciphertext));
    return decoder.decode(decrypted);
  }

  window.NexvaultCrypto = {
    encryptVaultPayload,
    decryptVaultPayload,
  };
})();
