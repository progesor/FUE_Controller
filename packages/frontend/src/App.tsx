// packages/frontend/src/App.tsx

import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Container } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { listenToEvents } from './services/socketService';
import { initializeSessionService } from "./services/sessionService.ts";

// Bileşenleri yeni konumlarından import ediyoruz
import { MainLayout } from './components/engineering/MainLayout';
import { ClinicalLayout } from './components/clinical/ClinicalLayout';

/**
 * Uygulamanın ana (root) bileşeni.
 * Artık URL'ye göre hangi arayüzün gösterileceğini yönetir.
 * @returns {JSX.Element} Uygulamanın tamamını temsil eden JSX.
 */
function App() {

    useEffect(() => {
        listenToEvents();
        initializeSessionService();
    }, []);

    return (
        // BrowserRouter, tüm uygulamayı sarmalayarak routing özelliklerini aktif eder.
        <BrowserRouter>
            {/* Notifications bileşeni tüm sayfalarda görünmesi için burada kalmalı. */}
            <Notifications />

            {/* Routes, farklı URL yolları için hangi bileşenin render edileceğini tanımlar. */}
            <Routes>
                {/* Ana yol (`/`) tıklandığında Klinik Arayüzü göster. */}
                <Route path="/" element={<ClinicalLayout />} />

                {/* `/dev` yolu tıklandığında Mühendislik Arayüzünü göster. */}
                <Route
                    path="/dev"
                    element={
                        <Container size="xl" p="md">
                            <MainLayout />
                        </Container>
                    }
                />
            </Routes>
        </BrowserRouter>
    );
}

export default App;