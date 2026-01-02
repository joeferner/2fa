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

export async function initializeStore(): Promise<void> {
    console.log('loading 2fa data');
    const response = await fetch('2fa.dat');
    const text = (await response.text()).replaceAll(/\s+/g, '');
    encryptedData.value = text;
}

export const encryptedData = signal('');
export const keys = signal<KeyWithTOTP[] | undefined>(undefined);
export const decryptError = signal<string | undefined>(undefined);
export const decryptedDataString = signal('');
export const timeLeft = signal(0);
export const password = signal(localStorage.getItem(LOCAL_STORAGE_PASSWORD_KEY) ?? '');

// update encrypted data on decryptedDataString change
effect(() => {
    async function updateEncryptedData(password: string, newValue: string): Promise<void> {
        encryptedData.value = splitIntoLines(await encryptData(password, newValue), 80);
    }

    if (decryptedDataString.value.trim().length > 0) {
        const verifiedNewValue = JSON.stringify(JSON.parse(decryptedDataString.value));
        void updateEncryptedData(password.value, verifiedNewValue);
    }
});

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

// decrypt keys on password or encryptedData change
let _passwordValue = '';
let _encryptedDataValue = '';
effect(() => {
    const passwordValue = password.value.trim();
    const encryptedDataValue = encryptedData.value.trim();
    if (passwordValue.length === 0) {
        decryptError.value = 'Password required';
        return;
    }
    if (encryptedDataValue.length === 0) {
        decryptError.value = 'Missing encrypted data';
        return;
    }

    if (_passwordValue !== passwordValue) {
        _passwordValue = passwordValue;
    }

    if (_encryptedDataValue !== encryptedDataValue) {
        _encryptedDataValue = encryptedDataValue;
    }

    async function decryptKeys(password: string, encryptedData: string): Promise<void> {
        try {
            const decryptedData = await decryptData(password, encryptedData);
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
            decryptError.value = `Failed to decrypt data: ${err}`;
        }
    }

    void decryptKeys(passwordValue, encryptedDataValue);
});

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
