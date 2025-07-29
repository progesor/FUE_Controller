import { Paper, Title, Stack, Text, Collapse, Slider } from '@mantine/core';
import { useControllerStore } from '../../store/useControllerStore';
import { VALID_ANGLES } from '../../config/calibration';

// En yakın geçerli değeri bulan yardımcı fonksiyon
const findClosestValue = (goal: number, arr: number[]) => {
    return arr.reduce((prev, curr) => (Math.abs(curr - goal) < Math.abs(prev - goal) ? curr : prev));
};

export function SettingsPanel() {
    const { operatingMode, oscillationSettings, setOscillationAngle } = useControllerStore();

    // Açı slider'ı için 'onChangeEnd' daha basit, çünkü backend'e komut göndermiyoruz.
    const handleAngleChange = (valueFromSlider: number) => {
        const snappedAngle = findClosestValue(valueFromSlider, VALID_ANGLES);
        setOscillationAngle(snappedAngle);
    };

    return (
        <Paper withBorder p="md" h="100%">
            <Stack>
                <Title order={3} mb="md">Ayar Paneli</Title>
                <Collapse in={operatingMode === 'oscillation'}>
                    <Stack gap="xl">
                        <Stack gap="xs">
                            <Text fw={500}>Osilasyon Açısı</Text>
                            <Text fz={32} fw={700}>{oscillationSettings.angle}°</Text>
                            <Slider
                                value={oscillationSettings.angle}
                                onChange={handleAngleChange} // Değişim anında yapıştırabiliriz
                                min={VALID_ANGLES[0]}
                                max={VALID_ANGLES[VALID_ANGLES.length - 1]}
                                marks={VALID_ANGLES.map(angle => ({ value: angle, label: `${angle}°` }))}
                                step={1} // Daha hassas "yakalama" için adımı 1 yapıyoruz
                                label={null}
                            />
                        </Stack>
                    </Stack>
                </Collapse>
            </Stack>
        </Paper>
    );
}