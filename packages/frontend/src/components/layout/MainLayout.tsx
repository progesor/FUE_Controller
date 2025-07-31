// packages/frontend/src/components/layout/MainLayout.tsx

import { Grid, Tabs } from '@mantine/core';
import { ControlPanel } from '../panels/ControlPanel';
import { DisplayPanel } from '../panels/DisplayPanel';
import { SettingsPanel } from '../panels/SettingsPanel';
import { StatusBar } from "./StatusBar.tsx";
import {IconSettings, IconTerminal2} from "@tabler/icons-react";
import {DevConsolePanel} from "../panels/DevConsolePanel.tsx";

/**
 * Uygulamanın ana sayfa düzenini (layout) oluşturan bileşen.
 * Tüm ana panelleri bir Grid (ızgara) sistemi içerisinde konumlandırır.
 * Bu yapı, ekran boyutuna göre esnek ve düzenli bir görünüm sağlar.
 * @returns {JSX.Element} Ana sayfa düzenini içeren JSX.
 */
export function MainLayout() {
    return (
        // Mantine Grid bileşeni, 12 birimlik bir ızgara sistemi kullanır.
        // Grid.Col bileşenlerinin 'span' değerlerinin toplamı idealde 12 olmalıdır.
        // Bizim düzenimizde: 3 (Kontrol) + 6 (Gösterge) + 3 (Ayarlar) = 12.
        <Grid gutter="xl">
            {/* Sol Sütun: Kontrol Paneli */}
            <Grid.Col span={3}>
                <ControlPanel />
            </Grid.Col>

            {/* Orta Sütun: Ana Gösterge Paneli */}
            <Grid.Col span={5}>
                <DisplayPanel />
            </Grid.Col>

            {/* Sağ Sütun: Ayarlar Paneli */}
            <Grid.Col span={4}>
                {/* YENİ: Tabs bileşeni ile panelleri gruplayalım */}
                <Tabs defaultValue="settings" h="100%">
                    <Tabs.List grow>
                        <Tabs.Tab value="settings" leftSection={<IconSettings size={16} />}>
                            Ayar Paneli
                        </Tabs.Tab>
                        <Tabs.Tab value="console" leftSection={<IconTerminal2 size={16} />}>
                            Konsol
                        </Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="settings" pt="xs" h="calc(100% - 38px)">
                        <SettingsPanel />
                    </Tabs.Panel>

                    <Tabs.Panel value="console" pt="xs" h="calc(100% - 38px)">
                        <DevConsolePanel />
                    </Tabs.Panel>
                </Tabs>
            </Grid.Col>

            {/* Tam Genişlik Sütun: Durum Çubuğu */}
            <Grid.Col span={12} mt="md">
                <StatusBar />
            </Grid.Col>
        </Grid>
    );
}