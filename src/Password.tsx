import { type JSX } from 'react';
import { password } from './store';
import { TextInput } from '@mantine/core';
import classes from './Password.module.scss';

export function Password(): JSX.Element {
    return (
        <div className={classes.wrapper}>
            <TextInput
                label="Password"
                type="password"
                placeholder="Enter your password"
                value={password.value}
                onChange={(e) => {
                    password.value = e.target.value;
                }}
                required
            />
        </div>
    );
}
