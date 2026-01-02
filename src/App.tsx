import { Accordion, Card, ColorSchemeScript, MantineProvider } from '@mantine/core';
import './App.module.scss';
import '@mantine/core/styles.css';
import classes from './App.module.scss';
import { useCallback, useEffect, useState, type JSX } from 'react';
import { Raw } from './Raw';
import { Keys } from './Keys';
import { Notifications } from '@mantine/notifications';
import '@mantine/notifications/styles.css';
import { initializeStore } from './store';

export function App(): JSX.Element {
    const [openAccordions, setOpenAccordions] = useState<string[]>(['keys']);

    useEffect(() => {
        void initializeStore();
    }, []);

    const handleChange = useCallback(
        (newValue: string[]) => {
            if (!newValue.includes('keys')) {
                newValue.push('keys');
            }
            setOpenAccordions(newValue);
        },
        [setOpenAccordions]
    );

    return (
        <>
            <ColorSchemeScript forceColorScheme="dark" />
            <MantineProvider forceColorScheme="dark">
                <Notifications position="top-right" />
                <div className={classes.main}>
                    <Card shadow="sm" p="lg" radius="md" withBorder>
                        <Card.Section>
                            <Accordion value={openAccordions} onChange={handleChange} multiple>
                                <Accordion.Item value="keys">
                                    <Accordion.Control>Keys</Accordion.Control>
                                    <Accordion.Panel>
                                        <Keys />
                                    </Accordion.Panel>
                                </Accordion.Item>

                                <Accordion.Item value="raw">
                                    <Accordion.Control>Raw Data</Accordion.Control>
                                    <Accordion.Panel>
                                        <Raw />
                                    </Accordion.Panel>
                                </Accordion.Item>
                            </Accordion>
                        </Card.Section>
                    </Card>
                </div>
            </MantineProvider>
        </>
    );
}
