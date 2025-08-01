// packages/frontend/src/components/panels/SettingsPanel.tsx

import { Paper, Title, Stack, Text, Collapse, Slider } from '@mantine/core';
import { useControllerStore } from '../../store/useControllerStore';
import { VALID_ANGLES } from '../../config/calibration';
import {sendOscillationSettings, sendPulseSettings} from '../../services/socketService';

/**
 * Osilasyon modu gibi belirli durumlara özel ayarların yapıldığı panel.
 * Yalnızca ilgili çalışma modu seçildiğinde görünür hale gelerek
 * arayüzün sade kalmasını sağlar.
 * @returns {JSX.Element} Ayar paneli JSX'i.
 */
export function SettingsPanel() {
    // Gerekli durumları ve eylemleri merkezi store'dan alıyoruz.
    const { operatingMode, oscillationSettings, pulseSettings, setOscillationSettings: setGlobalOscillationSettings, setPulseSettings  } = useControllerStore();

    /**
     * Osilasyon açısı slider'ı hareket ettirildiğinde tetiklenir.
     * @param markIndex - Slider üzerindeki seçilen geçerli açının indeksi.
     */
    const handleSliderChange = (markIndex: number) => {
        // İndekse karşılık gelen açı değerini kalibrasyon dizisinden al.
        const selectedAngle = VALID_ANGLES[markIndex];
        if (selectedAngle === undefined) return; // Geçersiz bir indeks ise işlemi durdur.

        // 1. İyimser Güncelleme (Optimistic Update): Arayüzün anında tepki vermesi için
        //    store'daki osilasyon ayarlarını hemen güncelle.
        setGlobalOscillationSettings({ angle: selectedAngle });

        // 2. Backend'e Bildirim: Yeni açı ayarını `socketService` aracılığıyla
        //    sunucuya ve dolayısıyla Arduino'ya gönder.
        sendOscillationSettings({ angle: selectedAngle });
    };

    const handlePulseDurationChange = (value: number) => {
        const newSettings = { ...pulseSettings, pulseDuration: value };
        setPulseSettings(newSettings); // İyimser güncelleme
        sendPulseSettings(newSettings); // Backend'e gönder
    };

    const handlePulseDelayChange = (value: number) => {
        const newSettings = { ...pulseSettings, pulseDelay: value };
        setPulseSettings(newSettings); // İyimser güncelleme
        sendPulseSettings(newSettings); // Backend'e gönder
    };

    // Mevcut osilasyon açısının `VALID_ANGLES` dizisindeki indeksini bul.
    // Bu, slider'ın doğru konumda başlaması ve güncellenmesi için gereklidir.
    const currentMarkIndex = VALID_ANGLES.indexOf(oscillationSettings.angle);

    return (
        <Paper withBorder p="md" h="100%">
            <Stack>
                <Title order={3} mb="md">Ayar Paneli</Title>

                {/*
                 * Collapse bileşeni, `in` prop'u `true` olduğunda içeriğini gösterir.
                 * Bu sayede, osilasyon ayarları sadece `operatingMode` 'oscillation'
                 * olduğunda görünür olur.
                 */}
                <Collapse in={operatingMode === 'oscillation'}>
                    <Stack gap="xl">
                        <Stack gap="xs">
                            <Text fw={500}>Osilasyon Açısı</Text>
                            <Text fz={32} fw={700}>{oscillationSettings.angle}°</Text>
                            <Slider
                                // Slider'ın değeri, 0'dan başlayan `markIndex`'tir.
                                value={currentMarkIndex !== -1 ? currentMarkIndex : 0}
                                onChange={handleSliderChange}
                                min={0}
                                max={VALID_ANGLES.length - 1}
                                step={1} // Her adımda bir sonraki geçerli açıya atla
                                label={null} // Etiketler (marks) zaten yeterli olduğu için ek etiketi gizle
                                marks={VALID_ANGLES.map((angle, index) => ({ value: index, label: `${angle}°` }))}
                                mb={40} // `marks` etiketlerinin rahat sığması için boşluk
                            />
                        </Stack>
                        {/* Buraya gelecekte başka osilasyon ayarları eklenebilir. */}
                    </Stack>
                </Collapse>
                <Collapse in={operatingMode === 'pulse'}>
                    <Stack gap="xl">
                        {/* Darbe Süresi Slider'ı */}
                        <Stack gap="xs">
                            <Text fw={500}>Darbe Süresi</Text>
                            <Text fz={32} fw={700}>{pulseSettings.pulseDuration} ms</Text>
                            <Slider
                                value={pulseSettings.pulseDuration}
                                onChange={handlePulseDurationChange}
                                min={20}
                                max={500}
                                step={10}
                                label={(value) => `${value} ms`}
                            />
                        </Stack>
                        {/* Bekleme Süresi Slider'ı */}
                        <Stack gap="xs">
                            <Text fw={500}>Darbeler Arası Bekleme</Text>
                            <Text fz={32} fw={700}>{pulseSettings.pulseDelay} ms</Text>
                            <Slider
                                value={pulseSettings.pulseDelay}
                                onChange={handlePulseDelayChange}
                                min={50}
                                max={2000}
                                step={50}
                                label={(value) => `${value} ms`}
                            />
                        </Stack>
                    </Stack>
                </Collapse>
            </Stack>
        </Paper>
    );
}