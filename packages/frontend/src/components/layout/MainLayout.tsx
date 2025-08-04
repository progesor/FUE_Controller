// packages/frontend/src/components/layout/MainLayout.tsx

import {Box, Drawer} from '@mantine/core';
import { ControlPanel } from '../panels/ControlPanel';
import { DisplayPanel } from '../panels/DisplayPanel';
import { SettingsPanel } from '../panels/SettingsPanel';
import { DevConsolePanel } from '../panels/DevConsolePanel';
import { StatusBar } from './StatusBar.tsx';
import {useDisclosure} from "@mantine/hooks";

export function MainLayout() {

    const [consoleOpened, { open: openConsole, close: closeConsole }] = useDisclosure(false);

    const drawerSize = '25%';

    return (
        <>
            <Drawer
                opened={consoleOpened}
                onClose={closeConsole}
                title="Geliştirici Konsolu"
                position="right" // 1. Sağdan açılacak
                size={drawerSize} // 2. Genişliğini ayarladık
                withOverlay={false} // 3. EN ÖNEMLİSİ: Arka planla etkileşime izin ver
                // withCloseButton artık gerekli, çünkü overlay'e tıklayarak kapatamayız.
                withCloseButton
                // Gölge gibi stil detayları ekleyerek ana içerikten ayrışmasını sağlayabiliriz.
                styles={{
                    header: { borderBottom: '1px solid var(--mantine-color-dark-4)' },
                    body: { height: 'calc(100% - 60px)' }, // Başlık yüksekliğini hesaptan düş
                }}
            >
                <DevConsolePanel />
            </Drawer>
        // Ana Konteyner: Tüm ekranı kapla (padding'leri hesaba katarak) ve dikey flex yapısı kur.
            <Box
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: 'calc(100vh - 4rem)',
                    // DEĞİŞİKLİK: Drawer açıldığında ana içeriği sola kaydır
                    // Bu, konsolun içeriğin üzerine binmesini engeller.
                    marginRight: consoleOpened ? drawerSize : 0,
                    transition: 'margin-right 0.2s ease-in-out', // Pürüzsüz bir geçiş için
                }}
            >
                {/* Paneller Alanı (Değişiklik yok) */}
                <Box style={{ display: 'flex', flex: 1, gap: 'var(--mantine-spacing-xl)', overflow: 'hidden' }}>
                    <Box style={{ flexBasis: '25%', height: '100%' }}>
                        <ControlPanel />
                    </Box>
                    <Box style={{ flexBasis: '41.66%', height: '100%' }}>
                        <DisplayPanel />
                    </Box>
                    <Box style={{ flexBasis: '33.33%', height: '100%' }}>
                        <SettingsPanel />
                    </Box>
                </Box>

                {/* Durum Çubuğu Alanı (Değişiklik yok) */}
                <Box mt="md">
                    <StatusBar onConsoleOpen={openConsole} />
                </Box>
            </Box>
            </>
    );
}