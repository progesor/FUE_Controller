// packages/frontend/src/main.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import { MantineProvider } from '@mantine/core'; // <-- Mantine importları
import App from './App.tsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        {/* MantineProvider'ı ekliyoruz ve varsayılan temayı 'dark' yapıyoruz */}
        <MantineProvider withGlobalStyles withNormalizeCSS theme={{ colorScheme: 'dark' }}>
            <App />
        </MantineProvider>
    </React.StrictMode>,
);