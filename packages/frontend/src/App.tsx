// packages/frontend/src/App.tsx

import { useEffect } from 'react';
import { Container } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { listenToEvents } from './services/socketService';
import { initializeSessionService } from "./services/sessionService.ts";
import { MainLayout } from './components/layout/MainLayout';

/**
 * Uygulamanın ana (root) bileşeni.
 * Tüm diğer bileşenleri ve layout'ları içerir.
 * @returns {JSX.Element} Uygulamanın tamamını temsil eden JSX.
 */
function App() {

    // useEffect hook'u, bileşen ilk render edildiğinde (mount olduğunda)
    // içindeki fonksiyonu bir kez çalıştırmak için kullanılır.
    // Boş bağımlılık dizisi `[]` sayesinde bu etkinin sadece bir kez
    // çalışması sağlanır.
    useEffect(() => {
        // Uygulama başlar başlamaz backend ile iletişimi kuracak
        // ve olayları dinleyecek olan socket servisini başlat.
        listenToEvents();

        // Seans süresini (kronometre) yönetecek olan servisi başlat.
        initializeSessionService();
    }, []);

    // Bileşenin render ettiği JSX yapısı
    return (
        // Container, içeriği yatay olarak ortalayan ve maksimum genişlik
        // sağlayan bir Mantine bileşenidir.
        <Container size="xl" p="md">
            {/*
             * Notifications bileşeni, Mantine'in bildirim sisteminin
             * çalışması için gereklidir. Bildirimler bu bileşenin
             * içinde render edilir.
             */}
            <Notifications />

            {/*
             * MainLayout, uygulamanın ana sayfa düzenini (kontrol paneli,
             * gösterge paneli vb.) içeren bileşendir.
             */}
            <MainLayout />
        </Container>
    );
}

export default App;