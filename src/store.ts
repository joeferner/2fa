import { atom } from 'jotai';
import { decryptData, generateTOTP, TOTP_TIME_STEP_SECONDS } from './utils/encrypt.utils';
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

export const encryptedDataAtom = atom(async () => {
    console.log('loading 2fa data');
    const response = await fetch('2fa.dat');
    return await response.text();
});

export const keysAtom = atom<KeyWithTOTP[] | undefined>(undefined);
export const decryptedDataStringAtom = atom('', (_get, set, newValue: string) => {
    set(decryptedDataStringAtom, newValue);
});
export const decryptErrorAtom = atom<string | undefined>(undefined);

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

    const encryptedData = await get(encryptedDataAtom);

    try {
        const decryptedData = await decryptData(newValue, encryptedData);
        const keys = JSON.parse(decryptedData) as Key[];
        set(decryptedDataStringAtom, JSON.stringify(keys, null, 2));
        set(keysAtom, await toKeysWithTOTPs(keys));
        set(storedPasswordAtom, newValue);
        set(decryptErrorAtom, undefined);
    } catch (err) {
        console.error('failed to decrypt data', err);
        set(keysAtom, undefined);
        set(decryptedDataStringAtom, '');
        set(decryptErrorAtom, 'Failed to decrypt data');
    }

    await set(passwordAtom, newValue);
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
