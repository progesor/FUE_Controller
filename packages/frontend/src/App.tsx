// packages/frontend/src/App.tsx

import { useEffect } from 'react';
import { listenToEvents } from './services/socketService';
import { MainLayout } from './components/layout/MainLayout';
import { Notifications } from '@mantine/notifications';
import { Container } from '@mantine/core';
import {initializeSessionService} from "./services/sessionService.ts";

function App() {
    useEffect(() => {
        // Uygulama ilk açıldığında servisleri başlat
        listenToEvents();
        initializeSessionService(); // <-- YENİ SERVİSİ BAŞLAT
    }, []);

    return (
        <Container size="xl" p="md">
            <Notifications />
            <MainLayout />
        </Container>
    );
}


export default App;