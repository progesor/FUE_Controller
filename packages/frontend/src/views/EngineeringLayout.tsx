// packages/frontend/src/components/layout/EngineeringLayout.tsx

import {Box, Drawer} from '@mantine/core';
import { ControlPanel } from '../components/engineering/panels/ControlPanel.tsx';
import { DisplayPanel } from '../components/engineering/panels/DisplayPanel.tsx';
import { SettingsPanel } from '../components/engineering/panels/SettingsPanel.tsx';
import { DevConsolePanel } from '../components/engineering/panels/DevConsolePanel.tsx';
import { StatusBar } from '../components/engineering/StatusBar.tsx';
import {useDisclosure, useMediaQuery} from "@mantine/hooks";

// DEĞİŞİKLİK: Ayarları daha kolay yönetmek için sabitleri yukarı taşıyalım.
const DRAWER_SIZE = '350px'; // İçeriğin rahat sığması için genişliği artırdık.
const WIDE_SCREEN_BREAKPOINT = '(min-width: 1600px)'; // Breakpoint'i yeni boyuta göre güncelledik.


export function EngineeringLayout() {

    const [consoleOpened, { open: openConsole, close: closeConsole }] = useDisclosure(false);

    const isWideScreen = useMediaQuery(WIDE_SCREEN_BREAKPOINT);

    return (
        <>
            <Drawer
                opened={consoleOpened}
                onClose={closeConsole}
                title="Geliştirici Konsolu"
                position="right"
                size={DRAWER_SIZE} // Yeni boyutu kullandık
                withOverlay={false}
                withCloseButton
                styles={{
                    header: { borderBottom: '1px solid var(--mantine-color-dark-4)' },
                    body: { height: 'calc(100% - 60px)', padding: 0 },
                }}
            >
                <DevConsolePanel />
            </Drawer>

            <Box
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: 'calc(100vh - 4rem)',
                    // Mantık aynı, ama artık güncel değerlerle çalışıyor.
                    marginRight: consoleOpened && !isWideScreen ? DRAWER_SIZE : 0,
                    transition: 'margin-right 0.2s ease-in-out',
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