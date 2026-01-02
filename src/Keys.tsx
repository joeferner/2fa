import { decryptError, keys, logout, timeLeft, type KeyWithTOTP } from './store';
import { useCallback, useEffect, type JSX } from 'react';
import classes from './Keys.module.scss';
import { ActionIcon, Button, Progress } from '@mantine/core';
import { Copy as CopyIcon } from 'react-bootstrap-icons';
import { notifications } from '@mantine/notifications';
import { getTOTPRemainingMs, TOTP_TIME_STEP_SECONDS } from './utils/encrypt.utils';
import { DecryptError } from './DecryptError';

export function Keys(): JSX.Element | null {
    useEffect(() => {
        const interval = setInterval(() => {
            const newTimeLeft = getTOTPRemainingMs();
            timeLeft.value = newTimeLeft;
        }, 100);

        return (): void => {
            clearInterval(interval);
        };
    }, []);

    const handleLogoutClick = useCallback(() => {
        logout();
    }, []);

    if (decryptError.value) {
        return <DecryptError error={decryptError.value} />;
    }

    if (!keys.value) {
        return null;
    }

    return (
        <div className={classes.keys}>
            <div>
                {keys.value.map((key) => (
                    <Key key={key.name} keyWithTOTP={key} />
                ))}
            </div>

            <Progress value={(timeLeft.value / (TOTP_TIME_STEP_SECONDS * 1000)) * 100} />
            <div className={classes.actions}>
                <Button onClick={handleLogoutClick}>Logout</Button>
            </div>
        </div>
    );
}

function Key({ keyWithTOTP: key }: { keyWithTOTP: KeyWithTOTP }): JSX.Element {
    const copyToClipboard = useCallback(() => {
        if (key.totp) {
            navigator.clipboard
                .writeText(key.totp)
                .then(() => {
                    notifications.show({
                        title: 'Copied',
                        message: 'Code copied to clipboard',
                        color: 'green',
                        autoClose: 3000,
                    });
                })
                .catch((err: unknown) => {
                    console.error('Failed to copy:', err);
                });
        }
    }, [key]);

    if (key.error) {
        return (
            <div className={classes.key}>
                <div className={classes.keyName}>{key.name}:</div>
                <div className={classes.keyError}>Error: {key.error}</div>
            </div>
        );
    }

    if (key.totp) {
        return (
            <div className={classes.key}>
                <div className={classes.keyName}>{key.name}:</div>
                <div className={classes.keyCode}>
                    {key.totp}{' '}
                    <ActionIcon onClick={copyToClipboard} variant="transparent">
                        <CopyIcon />
                    </ActionIcon>
                </div>
            </div>
        );
    }

    return <div>Invalid KeyWithTOTP</div>;
}
