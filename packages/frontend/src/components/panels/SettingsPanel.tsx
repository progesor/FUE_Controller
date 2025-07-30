import { Paper, Title, Stack, Text, Collapse, Slider } from '@mantine/core';
import { useControllerStore } from '../../store/useControllerStore';
import { VALID_ANGLES } from '../../config/calibration';
import { sendOscillationSettings } from '../../services/socketService';
import React from 'react';

export function SettingsPanel() {
    const { operatingMode, oscillationSettings, setOscillationSettings: setGlobalOscillationSettings } = useControllerStore();

    // Slider'dan gelen DEĞER, artık Açı değil, 0'dan başlayan bir İNDEKSTİR.
    const handleSliderChange = (markIndex: number) => {
        const selectedAngle = VALID_ANGLES[markIndex];
        if (selectedAngle === undefined) return;

        // Hem arayüzü (iyimser güncelleme) hem de backend'i bu kesin değerle güncelle
        setGlobalOscillationSettings({ angle: selectedAngle });
        sendOscillationSettings({ angle: selectedAngle });
    };

    // Mevcut Açı değerine karşılık gelen slider indeksini bul
    const currentMarkIndex = VALID_ANGLES.indexOf(oscillationSettings.angle);

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
                                // Değer olarak 0'dan başlayan indeksi kullanıyoruz
                                value={currentMarkIndex !== -1 ? currentMarkIndex : 0}
                                // Değişim anında hem arayüzü hem backend'i güncelliyoruz
                                onChange={handleSliderChange}
                                min={0}
                                max={VALID_ANGLES.length - 1}
                                step={1} // Her adımda bir sonraki kalibrasyon noktasına atla
                                label={null} // Değer etiketini gizle
                                // İşaretleri Açı değerleri olarak göster
                                marks={VALID_ANGLES.map((angle, index) => ({ value: index, label: `${angle}°` }))}
                                mb={40} // Etiketlerin (marks) rahat sığması için alttan boşluk
                            />
                        </Stack>
                    </Stack>
                </Collapse>
            </Stack>
        </Paper>
    );
}