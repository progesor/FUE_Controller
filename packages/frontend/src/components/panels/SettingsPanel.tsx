// packages/frontend/src/components/panels/SettingsPanel.tsx

import { Paper, Title, Stack, Text, Collapse, Slider } from '@mantine/core';
import { useControllerStore } from '../../store/useControllerStore';
import { VALID_ANGLES } from '../../config/calibration';
import {
    sendContinuousSettings,
    sendOscillationSettings,
    sendPulseSettings,
    sendVibrationSettings
} from '../../services/socketService';

const MIN_PWM = 0;
const MAX_PWM = 255;

/**
 * PWM değerini (50-255) 0-100 arası bir yüzdeye çevirir.
 */
const pwmToPercentage = (pwm: number) => {
    return Math.round(((pwm - MIN_PWM) / (MAX_PWM - MIN_PWM)) * 100);
};

/**
 * Yüzde değerini (0-100) 50-255 arası bir PWM değerine çevirir.
 */
const percentageToPwm = (percentage: number) => {
    return Math.round((percentage / 100) * (MAX_PWM - MIN_PWM) + MIN_PWM);
};

/**
 * Osilasyon modu gibi belirli durumlara özel ayarların yapıldığı panel.
 * Yalnızca ilgili çalışma modu seçildiğinde görünür hale gelerek
 * arayüzün sade kalmasını sağlar.
 * @returns {JSX.Element} Ayar paneli JSX'i.
 */
export function SettingsPanel() {
    // Gerekli durumları ve eylemleri merkezi store'dan alıyoruz.
    const {
        operatingMode,
        continuousSettings,
        oscillationSettings,
        pulseSettings,
        vibrationSettings,
        setOscillationSettings: setGlobalOscillationSettings,
        setPulseSettings,
        setVibrationSettings,
        setContinuousSettings,
        startIgnoringStatusUpdates
    } = useControllerStore();

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
        setPulseSettings(newSettings);         // 1. İyimser Güncelleme
        startIgnoringStatusUpdates();          // 2. "Yok Sayma" modunu başlat
        sendPulseSettings(newSettings);        // 3. Backend'e komutu gönder
    };

    const handlePulseDelayChange = (value: number) => {
        const newSettings = { ...pulseSettings, pulseDelay: value };
        setPulseSettings(newSettings);         // 1. İyimser Güncelleme
        startIgnoringStatusUpdates();          // 2. "Yok Sayma" modunu başlat
        sendPulseSettings(newSettings);        // 3. Backend'e komutu gönder
    };

    const handleVibrationIntensityChange = (percentage: number) => {
        // Arayüzden gelen yüzdeyi, backend'in anlayacağı PWM'e çevir
        const newPwmValue = percentageToPwm(percentage);

        const newSettings = { ...vibrationSettings, intensity: newPwmValue };
        setVibrationSettings(newSettings);
        startIgnoringStatusUpdates();
        sendVibrationSettings(newSettings);
    };

    const handleVibrationFrequencyChange = (value: number) => {
        const newSettings = { ...vibrationSettings, frequency: value };
        setVibrationSettings(newSettings);
        startIgnoringStatusUpdates();
        sendVibrationSettings(newSettings);
    };

    const handleRampDurationChange = (value: number) => {
        const newSettings = { ...continuousSettings, rampDuration: value };
        setContinuousSettings(newSettings);
        startIgnoringStatusUpdates();
        sendContinuousSettings(newSettings);
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
                <Collapse in={operatingMode === 'continuous'}>
                    <Stack gap="xl">
                        <Stack gap="xs">
                            <Text fw={500}>Rampa Süresi (Yavaş Başlatma)</Text>
                            <Text fz={32} fw={700}>{continuousSettings.rampDuration} ms</Text>
                            <Slider
                                value={continuousSettings.rampDuration}
                                onChange={handleRampDurationChange}
                                min={0}
                                max={2000} // 2 saniye
                                step={100}
                                label={(value) => value === 0 ? 'Kapalı' : `${value} ms`}
                                marks={[
                                    { value: 0, label: 'Kapalı' },
                                    { value: 1000, label: '1sn' },
                                    { value: 2000, label: '2sn' },
                                ]}
                            />
                        </Stack>
                    </Stack>
                </Collapse>
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
                        <Stack gap="xs">
                            <Text fw={500}>Darbe Süresi</Text>
                            <Text fz={32} fw={700}>{pulseSettings.pulseDuration} ms</Text>
                            <Slider
                                value={pulseSettings.pulseDuration}
                                // onChange kullanıyoruz, anında tepki için
                                onChange={handlePulseDurationChange}
                                min={20}
                                max={500}
                                step={10}
                                label={(value) => `${value} ms`}
                            />
                        </Stack>
                        <Stack gap="xs">
                            <Text fw={500}>Darbeler Arası Bekleme</Text>
                            <Text fz={32} fw={700}>{pulseSettings.pulseDelay} ms</Text>
                            <Slider
                                value={pulseSettings.pulseDelay}
                                // onChange kullanıyoruz
                                onChange={handlePulseDelayChange}
                                min={50}
                                max={2000}
                                step={50}
                                label={(value) => `${value} ms`}
                            />
                        </Stack>
                    </Stack>
                </Collapse>
                <Collapse in={operatingMode === 'vibration'}>
                    <Stack gap="xl">
                        {/* Yoğunluk Slider'ı - YÜZDE GÖSTERECEK ŞEKİLDE GÜNCELLENDİ */}
                        <Stack gap="xs">
                            <Text fw={500}>Titreşim Yoğunluğu</Text>
                            {/* Gösterilen değeri yeni fonksiyonla yüzdeye çeviriyoruz */}
                            <Text fz={32} fw={700}>% {pwmToPercentage(vibrationSettings.intensity)}</Text>
                            <Slider
                                // Slider'ın değeri de yüzde olmalı
                                value={pwmToPercentage(vibrationSettings.intensity)}
                                // onChange artık yüzde değeriyle çalışıyor
                                onChange={handleVibrationIntensityChange}
                                min={0}
                                max={100}
                                step={1}
                                label={(value) => `% ${value}`}
                            />
                        </Stack>

                        {/* Frekans Slider'ı (Aynı kalıyor) */}
                        <Stack gap="xs">
                            <Text fw={500}>Titreşim Frekansı</Text>
                            <Text fz={32} fw={700}>Seviye {vibrationSettings.frequency}</Text>
                            <Slider
                                value={vibrationSettings.frequency}
                                onChange={handleVibrationFrequencyChange}
                                min={1}
                                max={10}
                                step={1}
                                label={(value) => `Seviye ${value}`}
                            />
                        </Stack>
                    </Stack>
                </Collapse>
            </Stack>
        </Paper>
    );
}