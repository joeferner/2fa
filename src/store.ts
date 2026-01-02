import { decryptData, encryptData, generateTOTP } from './utils/encrypt.utils';
import { signal, effect } from '@preact/signals-react';

export const LOCAL_STORAGE_PASSWORD_KEY = 'password';

export interface Key {
    name: string;
    code: string;
}

export interface KeyWithTOTP extends Key {
    totp?: string;
    error?: string;
}

export interface DecryptError {
    type: 'missingPassword' | 'missingEncryptedData' | 'other';
    message: string;
}

export async function initializeStore(): Promise<void> {
    console.log('loading 2fa data');
    const response = await fetch('2fa.dat');
    encryptedData.value = (await response.text()).replaceAll(/\s+/g, '');

    const password = localStorage.getItem(LOCAL_STORAGE_PASSWORD_KEY) ?? '';
    await login(password);
}

export const encryptedData = signal('');
export const keys = signal<KeyWithTOTP[] | undefined>(undefined);
export const decryptError = signal<DecryptError | undefined>(undefined);
export const decryptedDataString = signal('');
export const timeLeft = signal(0);

// update keys on timeLeft change
let previousTimeLeft = 0;
effect(() => {
    async function updateTOTPs(newKeys: KeyWithTOTP[]): Promise<void> {
        keys.value = await toKeysWithTOTPs(newKeys);
    }

    if (timeLeft.value > previousTimeLeft && keys.value) {
        void updateTOTPs(keys.value);
    }
    previousTimeLeft = timeLeft.value;
});

export async function encrypt(password: string): Promise<void> {
    const verifiedNewValue = JSON.stringify(JSON.parse(decryptedDataString.value));
    encryptedData.value = splitIntoLines(await encryptData(password, verifiedNewValue), 80);
}

// decrypt keys on password or encryptedData change
export async function login(password: string): Promise<void> {
    const encryptedDataValue = encryptedData.value.trim();
    if (encryptedDataValue.length === 0) {
        decryptError.value = {
            type: 'missingEncryptedData',
            message: 'Missing encrypted data',
        };
        return;
    }
    if (password.length === 0) {
        decryptError.value = {
            type: 'missingPassword',
            message: 'Password required',
        };
        return;
    }

    try {
        const decryptedData = await decryptData(password, encryptedDataValue);
        const decryptedKeys = JSON.parse(decryptedData) as Key[];
        const newDecryptedDataString = JSON.stringify(decryptedKeys, null, 2);
        const newKeys = await toKeysWithTOTPs(decryptedKeys);

        localStorage.setItem(LOCAL_STORAGE_PASSWORD_KEY, password);
        keys.value = newKeys;
        decryptedDataString.value = newDecryptedDataString;
        decryptError.value = undefined;
    } catch (err) {
        console.error('failed to decrypt data', err);
        keys.value = undefined;
        decryptedDataString.value = '';
        decryptError.value = {
            type: 'other',
            message: `Failed to decrypt data: ${err}`,
        };
    }
}

export function logout(): void {
    keys.value = undefined;
    decryptedDataString.value = '';
    localStorage.setItem(LOCAL_STORAGE_PASSWORD_KEY, '');
    decryptError.value = {
        type: 'missingPassword',
        message: 'Password required',
    };
}

export async function toKeysWithTOTPs(keys: Key[]): Promise<KeyWithTOTP[]> {
    return Promise.all(keys.map(toKeyWithTOTP));
}

async function toKeyWithTOTP(key: Key): Promise<KeyWithTOTP> {
    try {
        const totp = await generateTOTP(key.code);
        return {
            ...key,
            totp,
        };
    } catch (err) {
        return {
            ...key,
            error: `${err}`,
        };
    }
}

function splitIntoLines(str: string, lineLength: number): string {
    const lines = [];
    for (let i = 0; i < str.length; i += lineLength) {
        lines.push(str.slice(i, i + lineLength));
    }
    return lines.join('\n');
}
