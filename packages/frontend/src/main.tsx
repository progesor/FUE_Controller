// packages/frontend/src/main.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import App from './App.tsx';

// --- Global Stil Dosyaları ---
// Mantine UI kütüphanesinin temel ve bildirimler (notifications) için
// gerekli olan stil dosyalarını projeye dahil ediyoruz.
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

// Uygulamanın genel (global) stillerini içeren dosya.
import './index.css';

/**
 * Uygulamanın ana giriş noktası (entry point).
 * React DOM'u kullanarak 'root' id'li HTML elementinin içine
 * ana App bileşenimizi render eder.
 */
ReactDOM.createRoot(document.getElementById('root')!).render(
    // React.StrictMode, uygulama geliştirme aşamasındayken olası problemleri
    // (eski API kullanımı gibi) tespit etmeye yardımcı olan bir sarmalayıcıdır.
    <React.StrictMode>
        {/*
         * MantineProvider, projedeki tüm Mantine bileşenlerinin
         * doğru şekilde çalışması için gerekli olan tema, stil ve
         * diğer context'leri sağlar. `defaultColorScheme="dark"`
         * ile uygulamanın varsayılan temasını karanlık olarak ayarlıyoruz.
         */}
        <MantineProvider defaultColorScheme="dark">
            <App />
        </MantineProvider>
    </React.StrictMode>,
);