import { atom } from 'jotai';
import { decryptData, encryptData, generateTOTP, TOTP_TIME_STEP_SECONDS } from './utils/encrypt.utils';
import { atomWithStorage } from 'jotai/utils';

export interface Key {
    name: string;
    code: string;
}

export interface KeyWithTOTP extends Key {
    totp?: string;
    error?: string;
}

export const storedPasswordAtom = atomWithStorage('password', '');

export const encryptedDataAtom = atom('');

export const keysAtom = atom<KeyWithTOTP[] | undefined>(undefined);
export const decryptErrorAtom = atom<string | undefined>(undefined);

export const decryptedDataStringAtom = atom('', async (get, set, newValue: string) => {
    await set(decryptedDataStringAtom, newValue);
    if (newValue.trim().length > 0) {
        const verifiedNewValue = JSON.stringify(JSON.parse(newValue));
        const password = get(passwordAtom);
        const encryptedData = splitIntoLines(await encryptData(password, verifiedNewValue), 80);
        set(encryptedDataAtom, encryptedData);
    }
});

export const timeLeftAtom = atom(TOTP_TIME_STEP_SECONDS, async (get, set, newValue: number) => {
    const lastValue = get(timeLeftAtom);
    if (newValue > lastValue) {
        const keys = get(keysAtom);
        if (keys) {
            set(keysAtom, await toKeysWithTOTPs(keys));
        }
    }
    await set(timeLeftAtom, newValue);
});

export const passwordAtom = atom('', async (get, set, newValue: string) => {
    if (newValue.trim().length === 0) {
        await set(passwordAtom, newValue);
        return;
    }

    let encryptedData = get(encryptedDataAtom);
    if (encryptedData === '') {
        console.log('loading 2fa data');
        const response = await fetch('2fa.dat');
        const text = (await response.text()).replaceAll(/\s+/g, '');
        encryptedData = text;
        set(encryptedDataAtom, text);
    }

    try {
        const decryptedData = await decryptData(newValue, encryptedData);
        const keys = JSON.parse(decryptedData) as Key[];
        await set(passwordAtom, newValue);
        await set(decryptedDataStringAtom, JSON.stringify(keys, null, 2));
        set(keysAtom, await toKeysWithTOTPs(keys));
        set(storedPasswordAtom, newValue);
        set(decryptErrorAtom, undefined);
    } catch (err) {
        await set(passwordAtom, newValue);
        console.error('failed to decrypt data', err);
        set(keysAtom, undefined);
        await set(decryptedDataStringAtom, '');
        set(decryptErrorAtom, 'Failed to decrypt data');
    }
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
