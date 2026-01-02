import { Textarea } from '@mantine/core';
import { type JSX } from 'react';
import classes from './Raw.module.scss';
import { decryptedDataStringAtom, encryptedDataAtom } from './store';
import { useAtom, useAtomValue } from 'jotai';

export function Raw(): JSX.Element {
    const [decryptedDataString, setDecryptedDataString] = useAtom(decryptedDataStringAtom);
    const encryptedData = useAtomValue(encryptedDataAtom);

    return (
        <div className={classes.rawWrapper}>
            <Textarea
                styles={{
                    input: {
                        fontFamily: 'monospace',
                    },
                }}
                value={decryptedDataString}
                onChange={(e) => {
                    setDecryptedDataString(e.target.value);
                }}
                rows={20}
            />
            <Textarea
                styles={{
                    input: {
                        fontFamily: 'monospace',
                    },
                }}
                value={encryptedData}
                readOnly={true}
                rows={20}
            />
        </div>
    );
}
