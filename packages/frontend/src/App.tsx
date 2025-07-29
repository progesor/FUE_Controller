// packages/frontend/src/App.tsx

import { useEffect } from 'react';
import { listenToEvents } from './services/socketService';
import { useControllerStore } from './store/useControllerStore';
import { Badge } from '@mantine/core';

function App() {
    // Zustand store'undan bağlantı durumunu çekiyoruz
    const connectionStatus = useControllerStore((state) => state.connectionStatus);

    // Uygulama ilk açıldığında backend'i dinlemeye başla
    useEffect(() => {
        listenToEvents();
    }, []);

    const getStatusColor = () => {
        if (connectionStatus === 'connected') return 'green';
        if (connectionStatus === 'connecting') return 'yellow';
        return 'red';
    }

    return (
        <>
            <h1>FUE Kontrol Ünitesi</h1>
            <Badge color={getStatusColor()} size="xl" variant="filled">
                Bağlantı Durumu: {connectionStatus}
            </Badge>
            {/* Gelecekteki tüm arayüz bileşenleri buraya eklenecek */}
        </>
    )
}

export default App