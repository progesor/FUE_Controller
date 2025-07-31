// packages/frontend/src/components/layout/MainLayout.tsx

import { Tabs, Box } from '@mantine/core';
import {IconFlask, IconSettings, IconTerminal2} from '@tabler/icons-react';
import { ControlPanel } from '../panels/ControlPanel';
import { DisplayPanel } from '../panels/DisplayPanel';
import { SettingsPanel } from '../panels/SettingsPanel';
import { DevConsolePanel } from '../panels/DevConsolePanel';
import { StatusBar } from './StatusBar.tsx';
import {RndPanel} from "../panels/RndPanel.tsx";

export function MainLayout() {
    return (
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
                    <Tabs defaultValue="settings" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Tabs.List grow>
                            <Tabs.Tab value="settings" leftSection={<IconSettings size={16} />}>
                                Ayar Paneli
                            </Tabs.Tab>
                            <Tabs.Tab value="console" leftSection={<IconTerminal2 size={16} />}>
                                Konsol
                            </Tabs.Tab>
                            <Tabs.Tab value="rnd" leftSection={<IconFlask size={16} />}>
                                Ar-Ge
                            </Tabs.Tab>
                        </Tabs.List>

                        <Tabs.Panel value="settings" pt="xs" style={{ flex: 1, overflow: 'auto' }}>
                            <SettingsPanel />
                        </Tabs.Panel>
                        <Tabs.Panel value="console" pt="xs" style={{ flex: 1, overflow: 'hidden' }}>
                            <DevConsolePanel />
                        </Tabs.Panel>
                        <Tabs.Panel value="rnd" pt="xs" style={{ flex: 1, overflow: 'auto' }}>
                            <RndPanel />
                        </Tabs.Panel>
                    </Tabs>
                </Box>

            </Box>

            {/* Durum Çubuğu Alanı: Sabit bir şekilde en altta durur. */}
            <Box mt="md">
                <StatusBar />
            </Box>
        </Box>
    );
}