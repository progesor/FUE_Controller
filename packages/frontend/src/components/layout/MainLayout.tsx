// packages/frontend/src/components/layout/MainLayout.tsx

import { Grid, Paper, Title } from '@mantine/core';
import { ControlPanel } from '../panels/ControlPanel';
import { DisplayPanel } from '../panels/DisplayPanel';
import { SettingsPanel } from '../panels/SettingsPanel';

// Şimdilik panelleri basit birer kutu olarak tanımlıyoruz.
// Birazdan bunları kendi dosyalarına taşıyacağız.

function StatusBar() {
    return <Paper withBorder p="md" h="100%"><Title order={3}>Durum Çubuğu</Title></Paper>;
}


export function MainLayout() {
    return (
        // Grid.Col'ların toplam 'span' değeri 12 olmalıdır.
        // 3 + 6 + 3 = 12
        <Grid gutter="xl">
            <Grid.Col span={3}><ControlPanel /></Grid.Col>
            <Grid.Col span={6}><DisplayPanel /></Grid.Col>
            <Grid.Col span={3}><SettingsPanel /></Grid.Col>
            <Grid.Col span={12} mt="md"><StatusBar /></Grid.Col>
        </Grid>
    );
}