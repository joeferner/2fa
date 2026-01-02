import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.scss';
import { App } from './App';

const root = document.getElementById('root');
if (root) {
    createRoot(root).render(
        <StrictMode>
            <App />
        </StrictMode>
    );
} else {
    console.error('could not find root element');
}
