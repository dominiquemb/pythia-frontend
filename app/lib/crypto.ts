// Web Crypto API utilities for end-to-end encryption
// Uses AES-256-GCM for message encryption and PBKDF2 for key derivation

// ===== UTILITY FUNCTIONS =====

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32)); // 256-bit salt
}

export function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(12)); // GCM standard IV length
}

export function generateRecoveryKey(): string {
  const keyBytes = crypto.getRandomValues(new Uint8Array(32));
  return arrayBufferToBase64(keyBytes);
}

// ===== KEY DERIVATION =====

export async function deriveKeyFromPassword(
  password: string,
  salt: Uint8Array,
  iterations: number = 100000
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  // Derive AES key using PBKDF2 with SHA-256
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: iterations,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

// ===== MASTER KEY GENERATION =====

export async function generateMasterKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

// ===== KEY IMPORT/EXPORT =====

async function exportKey(key: CryptoKey): Promise<ArrayBuffer> {
  return crypto.subtle.exportKey('raw', key);
}

async function importKey(keyData: ArrayBuffer): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM' },
    true,
    ['encrypt', 'decrypt']
  );
}

// ===== MASTER KEY ENCRYPTION/DECRYPTION =====

export async function encryptMasterKey(
  masterKey: CryptoKey,
  passwordDerivedKey: CryptoKey
): Promise<{ encryptedKey: string; iv: string }> {
  const iv = generateIV();
  const keyData = await exportKey(masterKey);

  const encryptedData = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    passwordDerivedKey,
    keyData
  );

  return {
    encryptedKey: arrayBufferToBase64(encryptedData),
    iv: arrayBufferToBase64(iv)
  };
}

export async function decryptMasterKey(
  encryptedKeyData: string,
  iv: string,
  passwordDerivedKey: CryptoKey
): Promise<CryptoKey> {
  const encryptedBuffer = base64ToArrayBuffer(encryptedKeyData);
  const ivBuffer = base64ToArrayBuffer(iv);

  const decryptedData = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBuffer },
    passwordDerivedKey,
    encryptedBuffer
  );

  return importKey(decryptedData);
}

// ===== MESSAGE ENCRYPTION/DECRYPTION =====

export async function encryptMessage(
  plaintext: string,
  masterKey: CryptoKey
): Promise<{ ciphertext: string; iv: string }> {
  const encoder = new TextEncoder();
  const iv = generateIV();
  const plaintextBuffer = encoder.encode(plaintext);

  const encryptedData = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    masterKey,
    plaintextBuffer
  );

  return {
    ciphertext: arrayBufferToBase64(encryptedData),
    iv: arrayBufferToBase64(iv)
  };
}

export async function decryptMessage(
  ciphertext: string,
  iv: string,
  masterKey: CryptoKey
): Promise<string> {
  const decoder = new TextDecoder();
  const ciphertextBuffer = base64ToArrayBuffer(ciphertext);
  const ivBuffer = base64ToArrayBuffer(iv);

  const decryptedData = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBuffer },
    masterKey,
    ciphertextBuffer
  );

  return decoder.decode(decryptedData);
}
