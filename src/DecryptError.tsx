import { useCallback, useState, type ChangeEvent, type JSX } from 'react';
import { login, type DecryptError } from './store';
import { Button, Notification, TextInput } from '@mantine/core';
import classes from './DecryptError.module.scss';

export function DecryptError({ error }: { error: DecryptError }): JSX.Element {
    const [inputError, setInputError] = useState<string | undefined>(undefined);
    const [inputPassword, setInputPassword] = useState('');

    const handlePasswordChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => {
            setInputPassword(event.target.value);
        },
        [setInputPassword]
    );

    const handleSubmit = useCallback((): void => {
        void (async (): Promise<void> => {
            try {
                setInputError(undefined);
                await login(inputPassword);
            } catch (err) {
                console.error('could not decrypt data', err);
                setInputError('Could not decrypt data');
            }
        })();
    }, [inputPassword, setInputError]);

    return (
        <div className={classes.wrapper}>
            <div>
                <Notification color="red" title="Error" withCloseButton={false}>
                    {error.message}
                </Notification>
                <form
                    className={classes.decryptWrapper}
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSubmit();
                    }}
                >
                    <TextInput
                        label="Password"
                        type="password"
                        placeholder="Enter your password"
                        value={inputPassword}
                        onChange={handlePasswordChange}
                        error={inputError}
                        required
                    />
                    <div className={classes.actions}>
                        <Button onClick={handleSubmit}>Decrypt</Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
