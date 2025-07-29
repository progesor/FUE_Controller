import { Paper, Title, Stack, Text, Collapse, Slider } from '@mantine/core';
import { useControllerStore } from '../../store/useControllerStore';
import {VALID_ANGLES} from "backend/src/config/calibration.ts";

export function SettingsPanel() {
    const { operatingMode, oscillationSettings, setOscillationAngle } = useControllerStore();

    return (
        <Paper withBorder p="md" h="100%">
            <Stack>
                <Title order={3} mb="md">Ayar Paneli</Title>
                <Collapse in={operatingMode === 'oscillation'}>
                    <Stack gap="xl">
                        {/* Açı Ayarı (YENİ YAPI) */}
                        <Stack gap="xs">
                            <Text fw={500}>Osilasyon Açısı</Text>
                            <Text fz={32} fw={700}>{oscillationSettings.angle}°</Text>
                            <Slider
                                value={oscillationSettings.angle}
                                onChange={setOscillationAngle}
                                min={VALID_ANGLES[0]}
                                max={VALID_ANGLES[VALID_ANGLES.length - 1]}
                                marks={VALID_ANGLES.map(angle => ({ value: angle, label: `${angle}°` }))}
                                step={45} // 225 gibi ara değerler için
                                label={null}
                            />
                        </Stack>
                    </Stack>
                </Collapse>
            </Stack>
        </Paper>
    );
}