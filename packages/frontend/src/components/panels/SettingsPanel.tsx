import { Paper, Title, Stack, Text, Collapse, Slider } from '@mantine/core';
import { useControllerStore } from '../../store/useControllerStore';
import { VALID_ANGLES } from '../../config/calibration';
import { sendOscillationSettings } from '../../services/socketService';
import { useState, useEffect } from 'react'; // useState ve useEffect'i import ediyoruz

// En yakın geçerli değeri bulan yardımcı fonksiyon
const findClosestValue = (goal: number, arr: number[]) => {
    return arr.reduce((prev, curr) => (Math.abs(curr - goal) < Math.abs(prev - goal) ? curr : prev));
};

export function SettingsPanel() {
    const { operatingMode, oscillationSettings } = useControllerStore();

    // --- YENİ: Slider'ın akıcı hareketi için yerel bir state tutuyoruz ---
    const [localAngle, setLocalAngle] = useState(oscillationSettings.angle);

    // Global durum (backend'den gelen) değiştiğinde, yerel state'i de senkronize et
    useEffect(() => {
        setLocalAngle(oscillationSettings.angle);
    }, [oscillationSettings.angle]);


    // Kullanıcı parmağını kaldırdığında, en yakın geçerli değere yapış ve backend'e gönder
    const handleAngleChangeEnd = (valueFromSlider: number) => {
        const snappedAngle = findClosestValue(valueFromSlider, VALID_ANGLES);
        // Yeni ayarları backend'e bildir. Store güncellemesi backend'den gelen yayınla olacak.
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
                            <Text fz={32} fw={700}>{localAngle}°</Text>
                            <Slider
                                // Değeri artık yerel state'den alıyoruz
                                value={localAngle}
                                // Sürüklerken sadece yerel state'i güncelle
                                onChange={setLocalAngle}
                                // Asıl işlem, kullanıcı slider'ı bıraktığında gerçekleşir
                                onChangeEnd={handleAngleChangeEnd}
                                min={VALID_ANGLES[0]}
                                max={VALID_ANGLES[VALID_ANGLES.length - 1]}
                                marks={VALID_ANGLES.map(angle => ({ value: angle, label: `${angle}°` }))}
                                step={1}
                                label={(value) => `${findClosestValue(value, VALID_ANGLES)}°`}
                                mb={40}
                            />
                        </Stack>
                    </Stack>
                </Collapse>
            </Stack>
        </Paper>
    );
}