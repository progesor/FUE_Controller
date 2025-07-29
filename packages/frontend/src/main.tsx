// packages/frontend/src/main.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import { MantineProvider } from '@mantine/core';

// Gerekli Mantine stillerini import et
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css'; // <-- Bunu da ekleyelim, bildirimler için lazım olacak
// import './global.css'; // <-- Birazdan oluşturacağımız dosya

import App from './App.tsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <MantineProvider defaultColorScheme="dark">
            <App />
        </MantineProvider>
    </React.StrictMode>,
);