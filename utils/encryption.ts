
import CryptoJS from 'crypto-js';
// Key must be 16, 24, or 32 bytes (AES-128/192/256)
const key = CryptoJS.enc.Utf8.parse("12345678901234567890123456789012"); // 32 chars = 256-bit
const iv = CryptoJS.enc.Utf8.parse("1234567890123456"); // 16 chars = 128-bit


export function encryptData(plainText: string): string {
  try {
    const encrypted = CryptoJS.AES.encrypt(plainText, key,
      { iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
    ).toString();
    return encrypted;
  } catch (err) {
    console.error('Encryption error:', err);
    return plainText; // fallback
  }
}

export function decryptData(cipher: string): string {
  try {
    const bytes = CryptoJS.AES.decrypt(cipher, key, { iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted;
  } catch (err) {
    console.error('Decryption error:', err);
    return ''; // empty signals failure
  }
}
