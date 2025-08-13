// packages/frontend/src/App.tsx

import { useEffect } from 'react';
import {BrowserRouter, Routes, Route, useNavigate, useLocation} from 'react-router-dom';
import { Container } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { listenToEvents } from './services/socketService';
import { initializeSessionService } from "./services/sessionService.ts";
import { ClinicalLayout } from './views/ClinicalLayout.tsx';
import {AuraLayout} from "./views/AuraLayout.tsx";
import {LayoutSelector} from "./views/LayoutSelector.tsx";
import {EngineeringLayout} from "./views/EngineeringLayout.tsx";

function AppInitializer() {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const preferredLayout = localStorage.getItem('preferredLayout');
        // Sadece ana sayfadayken yönlendirme yap
        if (preferredLayout && location.pathname === '/') {
            navigate(preferredLayout, { replace: true });
        }
    }, [navigate, location.pathname]);

    return null; // Bu bileşen ekranda bir şey göstermez
}


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
            <AppInitializer />
            {/* Notifications bileşeni tüm sayfalarda görünmesi için burada kalmalı. */}
            <Notifications />

            {/* Routes, farklı URL yolları için hangi bileşenin render edileceğini tanımlar. */}
            <Routes>

                <Route path="/" element={<LayoutSelector />} />
                {/* Ana yol (`/`) tıklandığında Klinik Arayüzü göster. */}
                <Route path="/clinical" element={<ClinicalLayout />} />

                {/* YENİ AURA ARAYÜZÜ YOLU */}
                <Route path="/aura" element={<AuraLayout />} />

                {/* `/dev` yolu tıklandığında Mühendislik Arayüzünü göster. */}
                <Route
                    path="/dev"
                    element={
                        <Container size="xl" p="md">
                            <EngineeringLayout />
                        </Container>
                    }
                />
            </Routes>
        </BrowserRouter>
    );
}

export default App;