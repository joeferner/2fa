import { Textarea } from '@mantine/core';
import { useCallback, useState, type ChangeEvent, type JSX } from 'react';
import classes from './Raw.module.scss';
import { decryptedDataStringAtom, encryptedDataAtom } from './store';
import { useAtom, useAtomValue } from 'jotai';

const PLACEHOLDER = JSON.stringify(
    [
        { name: 'Google', code: '<Google 2fa secret>' },
        { name: 'Amazon', code: '<Amazon 2fa secret>' },
    ],
    null,
    2
);
const ROWS = 10;

export function Raw(): JSX.Element {
    const [error, setError] = useState<string | undefined>(undefined);
    const [decryptedDataString, setDecryptedDataString] = useAtom(decryptedDataStringAtom);
    const encryptedData = useAtomValue(encryptedDataAtom);

    const handleDecryptedDataOnChange = useCallback(
        (event: ChangeEvent<HTMLTextAreaElement>) => {
            const value: string = event.target.value;
            const run = async (): Promise<void> => {
                try {
                    setError(undefined);
                    await setDecryptedDataString(value);
                } catch (err) {
                    setError(`${err}`);
                }
            };
            void run();
        },
        [setError, setDecryptedDataString]
    );

    return (
        <div className={classes.rawWrapper}>
            <Textarea
                styles={{
                    input: {
                        fontFamily: 'monospace',
                    },
                }}
                label="JSON"
                placeholder={PLACEHOLDER}
                value={decryptedDataString}
                error={error}
                onChange={(e) => {
                    handleDecryptedDataOnChange(e);
                }}
                rows={ROWS}
            />

            <Textarea
                styles={{
                    input: {
                        fontFamily: 'monospace',
                    },
                }}
                label="Encrypted Data"
                value={encryptedData}
                readOnly={true}
                rows={ROWS}
            />
        </div>
    );
}
