// packages/frontend/src/components/panels/SettingsPanel.tsx
import { Paper, Title, Stack, Text, Group, ActionIcon, Collapse } from '@mantine/core';
import { IconMinus, IconPlus } from '@tabler/icons-react';
import { useControllerStore } from '../../store/useControllerStore';

export function SettingsPanel() {
    const { operatingMode, oscillationSettings, setOscillationAngle } = useControllerStore();

    const handleAngleChange = (delta: number) => {
        // Açı değerini 90 derecelik adımlarla değiştir
        const newAngle = oscillationSettings.angle + delta;
        if (newAngle >= 90 && newAngle <= 540) { // Örnek min/max değerler
            setOscillationAngle(newAngle);
        }
    };

    return (
        <Paper withBorder p="md" h="100%">
            <Stack>
                <Title order={3} mb="md">Ayar Paneli</Title>
                <Collapse in={operatingMode === 'oscillation'}>
                    <Stack gap="xl">
                        {/* Açı Ayarı */}
                        <Stack gap="xs">
                            <Text fw={500}>Osilasyon Açısı (Derece)</Text>
                            <Group justify="center">
                                <ActionIcon variant="default" size="xl" onClick={() => handleAngleChange(-90)}>
                                    <IconMinus />
                                </ActionIcon>
                                <Text w={100} ta="center" fz={24} fw={600}>
                                    {oscillationSettings.angle}°
                                </Text>
                                <ActionIcon variant="default" size="xl" onClick={() => handleAngleChange(90)}>
                                    <IconPlus />
                                </ActionIcon>
                            </Group>
                        </Stack>
                        {/* Gelecekte diğer osilasyon ayarları buraya eklenebilir */}
                    </Stack>
                </Collapse>
            </Stack>
        </Paper>
    );
}