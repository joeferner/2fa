export const TOTP_TIME_STEP_SECONDS = 30;

export async function encryptData(password: string, text: string): Promise<string> {
    const enc = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(password, salt);

    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, enc.encode(text));

    // Combine salt + iv + encrypted data
    const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encrypted), salt.length + iv.length);

    // Convert to base64 for easy storage/transmission
    const base64 = btoa(String.fromCharCode(...combined));

    return base64;
}

export async function decryptData(password: string, text: string): Promise<string> {
    // Decode from base64
    const combined = new Uint8Array(
        atob(text)
            .split('')
            .map((c) => c.charCodeAt(0))
    );

    // Extract salt, iv, and encrypted data
    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const data = combined.slice(28);

    const key = await deriveKey(password, salt);

    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv }, key, data);

    const dec = new TextDecoder();
    const plaintext = dec.decode(decrypted);

    return plaintext;
}

// Derive a key from password using PBKDF2
async function deriveKey(password: string, salt: Uint8Array<ArrayBuffer>): Promise<CryptoKey> {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, [
        'deriveBits',
        'deriveKey',
    ]);

    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,
            hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

// Base32 decoding utility
function base32Decode(base32: string): Uint8Array {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const cleanedInput = base32.toUpperCase().replace(/=+$/, '');

    let bits = '';
    for (const char of cleanedInput) {
        const val = alphabet.indexOf(char);
        if (val === -1) throw new Error('Invalid base32 character');
        bits += val.toString(2).padStart(5, '0');
    }

    const bytes = new Uint8Array(Math.floor(bits.length / 8));
    for (let i = 0; i < bytes.length; i++) {
        const offset = i * 8;
        bytes[i] = parseInt(bits.substring(offset, offset + 8), 2);
    }

    return bytes;
}

// Convert number to 8-byte array (big-endian)
function intToBytes(num: number): Uint8Array {
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    view.setBigUint64(0, BigInt(num), false); // false = big-endian
    return new Uint8Array(buffer);
}

// HMAC-SHA1 using Web Crypto API
async function hmacSha1(key: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        key as BufferSource,
        { name: 'HMAC', hash: 'SHA-1' },
        false,
        ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, message as BufferSource);
    return new Uint8Array(signature);
}

// Generate OTP from HMAC result
function truncate(hmac: Uint8Array, digits = 6): string {
    const offset = hmac[hmac.length - 1] & 0x0f;
    const binary =
        ((hmac[offset] & 0x7f) << 24) |
        ((hmac[offset + 1] & 0xff) << 16) |
        ((hmac[offset + 2] & 0xff) << 8) |
        (hmac[offset + 3] & 0xff);

    const otp = binary % Math.pow(10, digits);
    return otp.toString().padStart(digits, '0');
}

// HOTP - Counter-based OTP
export async function generateHOTP(secret: string, counter: number, digits = 6): Promise<string> {
    const key = base32Decode(secret);
    const counterBytes = intToBytes(counter);
    const hmac = await hmacSha1(key, counterBytes);
    return truncate(hmac, digits);
}

// TOTP - Time-based OTP
export async function generateTOTP(
    secret: string,
    timeStep = TOTP_TIME_STEP_SECONDS,
    digits = 6,
    t0 = 0
): Promise<string> {
    secret = secret.toUpperCase().replaceAll(/\s+/g, '');

    const now = Math.floor(Date.now() / 1000);
    const counter = Math.floor((now - t0) / timeStep);
    return generateHOTP(secret, counter, digits);
}

// Get remaining seconds until TOTP changes
export function getTOTPRemainingMs(timeStep = TOTP_TIME_STEP_SECONDS): number {
    const now = Date.now();
    const timeStepMs = timeStep * 1000;
    return timeStepMs - (now % timeStepMs);
}
