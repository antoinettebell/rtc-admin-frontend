import cryptLib from 'cryptlib';

/**
 * Decrypt a single field using cryptlib
 * Supports format: "iv_base64:cipher_base64" (backend format)
 */
export function decryptField(encryptedData: string, secretKey: string): string {
  if (!encryptedData || !secretKey) return encryptedData || '';

  try {
    // Only attempt decryption if it looks like our encrypted format
    if (!isEncrypted(encryptedData)) return encryptedData;

    const [iv, cipherText] = splitIvCipher(encryptedData);
    if (!iv || !cipherText) return encryptedData;

    // Generate the same key as backend
    const key = cryptLib.getHashSha256(secretKey, 32);

    // Decrypt using cryptlib - both IV and cipher are already in correct format
    const plain = cryptLib.decrypt(cipherText, key, iv);

    // Validate result
    if (typeof plain !== 'string' || plain.length === 0) return encryptedData;
    return plain;
  } catch (e) {
    console.error('Decryption error (cryptlib):', e);
    return encryptedData;
  }
}

export function decryptFields<T extends Record<string, any>>(
  data: T, 
  fieldsToDecrypt: (keyof T)[], 
  secretKey: string
): T {
  if (!data || !secretKey) return data;
  const out = { ...data };
  for (const field of fieldsToDecrypt) {
    const val = out[field];
    if (typeof val === 'string') {
      const dec = decryptField(val, secretKey);
      if (dec !== val) out[field] = dec as any;
    }
  }
  return out;
}

export function isEncrypted(value: string): boolean {
  if (typeof value !== 'string') return false;
  const idx = value.indexOf(':');
  if (idx <= 0) return false;
  
  // Check if it has the basic structure (don't validate as hex since it's base64)
  const ivPart = value.slice(0, idx);
  const cipherPart = value.slice(idx + 1);
  
  return ivPart.length > 0 && cipherPart.length > 0;
}

function splitIvCipher(value: string): [string, string] {
  const idx = value.indexOf(':');
  if (idx <= 0) return ['', ''];
  return [value.slice(0, idx), value.slice(idx + 1)];
}