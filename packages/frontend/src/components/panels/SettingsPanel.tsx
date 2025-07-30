import { Paper, Title, Stack, Text, Collapse, Slider } from '@mantine/core';
import { useControllerStore } from '../../store/useControllerStore';
import { VALID_ANGLES } from '../../config/calibration';
import { sendOscillationSettings } from '../../services/socketService'; // Yeni servis fonksiyonu
// En yakın geçerli değeri bulan yardımcı fonksiyon
const findClosestValue = (goal: number, arr: number[]) => {
    return arr.reduce((prev, curr) => (Math.abs(curr - goal) < Math.abs(prev - goal) ? curr : prev));
};

export function SettingsPanel() {
    const { operatingMode, oscillationSettings } = useControllerStore();

    // Kullanıcı parmağını kaldırdığında, en yakın geçerli değere yapış ve backend'e gönder
    const handleAngleChangeEnd = (valueFromSlider: number) => {
        const snappedAngle = findClosestValue(valueFromSlider, VALID_ANGLES);
        // Yeni ayarları backend'e bildir
        sendOscillationSettings({ angle: snappedAngle });
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
                                // Değeri doğrudan store'dan alıyoruz
                                value={oscillationSettings.angle}
                                // onChange anında bir şey yapmaz, sadece görsel olarak günceller
                                onChange={() => {}}
                                // Asıl işlem, kullanıcı slider'ı bıraktığında gerçekleşir
                                onChangeEnd={handleAngleChangeEnd}
                                min={VALID_ANGLES[0]}
                                max={VALID_ANGLES[VALID_ANGLES.length - 1]}
                                marks={VALID_ANGLES.map(angle => ({ value: angle, label: `${angle}°` }))}
                                step={1} // Daha hassas "yakalama" için adımı 1 yapıyoruz
                                label={(value) => `${findClosestValue(value, VALID_ANGLES)}°`} // Sürüklerken en yakın değeri göster
                                mb={40}
                            />
                        </Stack>
                    </Stack>
                </Collapse>
            </Stack>
        </Paper>
    );
}