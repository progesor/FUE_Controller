// packages/frontend/src/components/layout/MainLayout.tsx

import { Grid } from '@mantine/core';
import { ControlPanel } from '../panels/ControlPanel';
import { DisplayPanel } from '../panels/DisplayPanel';
import { SettingsPanel } from '../panels/SettingsPanel';
import { StatusBar } from "./StatusBar.tsx";

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
            <Grid.Col span={6}>
                <DisplayPanel />
            </Grid.Col>

            {/* Sağ Sütun: Ayarlar Paneli */}
            <Grid.Col span={3}>
                <SettingsPanel />
            </Grid.Col>

            {/* Tam Genişlik Sütun: Durum Çubuğu */}
            <Grid.Col span={12} mt="md">
                <StatusBar />
            </Grid.Col>
        </Grid>
    );
}