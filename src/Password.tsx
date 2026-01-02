import { useAtom, useAtomValue } from 'jotai';
import { useEffect, type JSX } from 'react';
import { decryptErrorAtom, passwordAtom, storedPasswordAtom } from './store';
import { TextInput } from '@mantine/core';
import classes from './Password.module.scss';

export function Password(): JSX.Element {
    const storedPassword = useAtomValue(storedPasswordAtom);
    const decryptError = useAtomValue(decryptErrorAtom);
    const [password, setPassword] = useAtom(passwordAtom);

    useEffect(() => {
        void setPassword(storedPassword);
    }, [setPassword, storedPassword]);

    return (
        <div className={classes.wrapper}>
            <TextInput
                label="Password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                    void setPassword(e.target.value);
                }}
                required
                error={decryptError}
            />
        </div>
    );
}
