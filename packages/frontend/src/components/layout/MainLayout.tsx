// packages/frontend/src/components/layout/MainLayout.tsx

import { Grid } from '@mantine/core';
import { ControlPanel } from '../panels/ControlPanel';
import { DisplayPanel } from '../panels/DisplayPanel';
import { SettingsPanel } from '../panels/SettingsPanel';
import {StatusBar} from "./StatusBar.tsx";

// Şimdilik panelleri basit birer kutu olarak tanımlıyoruz.
// Birazdan bunları kendi dosyalarına taşıyacağız.


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