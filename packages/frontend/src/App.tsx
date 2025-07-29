// packages/frontend/src/App.tsx

import { useEffect } from 'react';
import { listenToEvents } from './services/socketService';
import { MainLayout } from './components/layout/MainLayout';
import { Notifications } from '@mantine/notifications';
import { Container } from '@mantine/core';

function App() {
    // Uygulama ilk açıldığında backend'i dinlemeye başla
    useEffect(() => {
        listenToEvents();
    }, []);

    return (
        <Container size="xl" p="md">
            {/* Mantine bildirimlerinin çalışması için bu bileşeni ekliyoruz */}
            <Notifications />
            <MainLayout />
        </Container>
    );
}

export default App;