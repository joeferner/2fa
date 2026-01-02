import { Button, Textarea, TextInput } from '@mantine/core';
import { useCallback, useState, type ChangeEvent, type JSX } from 'react';
import classes from './Raw.module.scss';
import { decryptedDataString, encrypt, encryptedData } from './store';

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
    const [inputError, setInputError] = useState<string | undefined>(undefined);
    const [inputPassword, setInputPassword] = useState('');

    const handlePasswordChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => {
            setInputPassword(event.target.value);
        },
        [setInputPassword]
    );

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

    const handleEncryptClick = useCallback(() => {
        void (async (): Promise<void> => {
            try {
                setInputError('');
                await encrypt(inputPassword);
            } catch (err) {
                console.error('failed to encrypt', err);
                setInputError(`Failed to encrypt: ${err}`);
            }
        })();
    }, [inputPassword, setInputError]);

    return (
        <div className={classes.rawWrapper}>
            <div className={classes.decrypted}>
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
                    onChange={handleDecryptedDataOnChange}
                    rows={ROWS}
                />
                <TextInput
                    label="Encrypt Password"
                    type="password"
                    placeholder="Enter your password"
                    value={inputPassword}
                    onChange={handlePasswordChange}
                    error={inputError}
                    required
                />
                <div className={classes.actions}>
                    <Button onClick={handleEncryptClick}>Encrypt</Button>
                </div>
            </div>

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
