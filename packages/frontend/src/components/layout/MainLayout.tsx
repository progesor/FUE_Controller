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

    return (
        <>
            <Drawer
                opened={consoleOpened}
                onClose={closeConsole}
                title="Geliştirici Konsolu"
                position="bottom" // Konsol için alt taraf daha kullanışlı
                size="40%"       // Ekranın %40'ını kaplasın
                overlayProps={{ backgroundOpacity: 0.5, blur: 4 }}
                withCloseButton
            >
                <DevConsolePanel />
            </Drawer>
        // Ana Konteyner: Tüm ekranı kapla (padding'leri hesaba katarak) ve dikey flex yapısı kur.
        <Box style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 4rem)' }}>

            {/* Paneller Alanı: Kalan tüm alanı dolduran YATAY bir flex container. */}
            <Box style={{ display: 'flex', flex: 1, gap: 'var(--mantine-spacing-xl)', overflow: 'hidden' }}>

                {/* 1. Sütun: Kontrol Paneli (Genişlik ~ span={3}) */}
                <Box style={{ flexBasis: '25%', height: '100%' }}>
                    <ControlPanel />
                </Box>

                {/* 2. Sütun: Gösterge Paneli (Genişlik ~ span={5}) */}
                <Box style={{ flexBasis: '41.66%', height: '100%' }}>
                    <DisplayPanel />
                </Box>

                {/* 3. Sütun: Ayarlar ve Konsol (Genişlik ~ span={4}) */}
                <Box style={{ flexBasis: '33.33%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <SettingsPanel/>
                </Box>

            </Box>

            {/* Durum Çubuğu Alanı: Sabit bir şekilde en altta durur. */}
            <Box mt="md">
                <StatusBar onConsoleOpen={openConsole} />
            </Box>
        </Box>
            </>
    );
}