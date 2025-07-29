// packages/frontend/src/components/layout/MainLayout.tsx

import { Grid, Paper, Title } from '@mantine/core';

// Şimdilik panelleri basit birer kutu olarak tanımlıyoruz.
// Birazdan bunları kendi dosyalarına taşıyacağız.

function ControlPanel() {
    return <Paper withBorder p="md" h="100%"><Title order={3}>Kontrol Paneli</Title></Paper>;
}

function DisplayPanel() {
    return <Paper withBorder p="md" h="100%"><Title order={3}>Gösterge Paneli</Title></Paper>;
}

function SettingsPanel() {
    return <Paper withBorder p="md" h="100%"><Title order={3}>Ayar Paneli</Title></Paper>;
}

function StatusBar() {
    return <Paper withBorder p="md" h="100%"><Title order={3}>Durum Çubuğu</Title></Paper>;
}


export function MainLayout() {
    return (
        // Grid.Col'ların toplam 'span' değeri 12 olmalıdır.
        // 3 + 6 + 3 = 12
        <Grid gutter="xl">
            <Grid.Col span={3}>
                <ControlPanel />
            </Grid.Col>
            <Grid.Col span={6}>
                <DisplayPanel />
            </Grid.Col>
            <Grid.Col span={3}>
                <SettingsPanel />
            </Grid.Col>
            <Grid.Col span={12} mt="md">
                <StatusBar />
            </Grid.Col>
        </Grid>
    );
}