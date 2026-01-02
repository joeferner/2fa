import { Textarea } from '@mantine/core';
import { useCallback, useState, type ChangeEvent, type JSX } from 'react';
import classes from './Raw.module.scss';
import { decryptedDataString, encryptedData } from './store';

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

    const handleDecryptedDataOnChange = useCallback(
        (event: ChangeEvent<HTMLTextAreaElement>) => {
            try {
                setError(undefined);
                decryptedDataString.value = event.target.value;
            } catch (err) {
                setError(`${err}`);
            }
        },
        [setError]
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
                value={decryptedDataString.value}
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
                value={encryptedData.value}
                readOnly={true}
                rows={ROWS}
            />
        </div>
    );
}
