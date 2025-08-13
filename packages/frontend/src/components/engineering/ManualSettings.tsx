// packages/frontend/src/components/panels/settings/ManualSettings.tsx

import { Stack, Text, Collapse, Slider } from '@mantine/core';
import { useControllerStore } from '../../store/useControllerStore.ts';
import { VALID_ANGLES } from '../../config/calibration.ts';
import {
    sendContinuousSettings,
    sendOscillationSettings,
    sendPulseSettings,
    sendVibrationSettings
} from '../../services/socketService.ts';

const MIN_PWM = 0;
const MAX_PWM = 255;

const pwmToPercentage = (pwm: number) => {
    return Math.round(((pwm - MIN_PWM) / (MAX_PWM - MIN_PWM)) * 100);
};

const percentageToPwm = (percentage: number) => {
    return Math.round((percentage / 100) * (MAX_PWM - MIN_PWM) + MIN_PWM);
};

export function ManualSettings() {
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

    const handleSliderChange = (markIndex: number) => {
        const selectedAngle = VALID_ANGLES[markIndex];
        if (selectedAngle === undefined) return;
        setGlobalOscillationSettings({ angle: selectedAngle });
        sendOscillationSettings({ angle: selectedAngle });
    };

    const handlePulseDurationChange = (value: number) => {
        const newSettings = { ...pulseSettings, pulseDuration: value };
        setPulseSettings(newSettings);
        startIgnoringStatusUpdates();
        sendPulseSettings(newSettings);
    };

    const handlePulseDelayChange = (value: number) => {
        const newSettings = { ...pulseSettings, pulseDelay: value };
        setPulseSettings(newSettings);
        startIgnoringStatusUpdates();
        sendPulseSettings(newSettings);
    };

    const handleVibrationIntensityChange = (percentage: number) => {
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

    const currentMarkIndex = VALID_ANGLES.indexOf(oscillationSettings.angle);

    return (
        <Stack>
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
    );
}