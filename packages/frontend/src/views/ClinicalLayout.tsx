// packages/frontend/src/views/ClinicalLayout.tsx

import { useState } from 'react';
import { Box, Stack, Group, Text, SegmentedControl, Tooltip } from '@mantine/core';
import classes from './ClinicalLayout.module.css';
import { Gauge } from "../components/clinical/Gauge.tsx";
import { VALID_ANGLES } from "../config/calibration.ts";
import { useControllerStore } from "../store/useControllerStore.ts";
import { InfoPanel } from "../components/clinical/InfoPanel.tsx";
import { PresetButtons } from "../components/clinical/PresetButtons.tsx";
import { sendMotorPwm, sendOscillationSettings, sendStartMotor, sendStopMotor } from "../services/socketService.ts";
import ErtipLogo from '../assets/clinical/ertip-logo.svg?react';
import cx from 'clsx';
import { TissueHardnessChartBar } from "../components/clinical/TissueHardnessChartBar.tsx";
import { LayoutSwitchButton } from "../components/common/LayoutSwitchButton.tsx";

// ==========================================
// SABİTLER VE LİMİTLER
// ==========================================
const MAX_RPM = 35000;
const RPM_STEP = 500;
const MAX_ACCEL = 50000; // Güvenlik sınırı: 50.000'i geçmeyecek
const MAX_OSC_ANGLE = VALID_ANGLES[VALID_ANGLES.length - 1] || 600;

export function ClinicalLayout() {
    const { motor, oscillationSettings, setMotorStatus, setOscillationSettings } = useControllerStore();

    // UI için yerel osilasyon mod durumu (Hassas = Angle, Kuvvetli = Time)
    const [oscModeUI, setOscModeUI] = useState<'hassas' | 'kuvvetli'>('hassas');

    // ==========================================
    // RPM KONTROLLERİ
    // ==========================================
    const handleIncrementRpm = () => {
        const newVal = Math.min(MAX_RPM, motor.pwm + RPM_STEP);
        setMotorStatus({ pwm: newVal });
        sendMotorPwm(newVal);
    };

    const handleDecrementRpm = () => {
        const newVal = Math.max(0, motor.pwm - RPM_STEP);
        setMotorStatus({ pwm: newVal });
        sendMotorPwm(newVal);
    };

    const handleRpmSliderChange = (sliderValue: number) => {
        setMotorStatus({ pwm: sliderValue });
        sendMotorPwm(sliderValue);
    };

    // ==========================================
    // OSİLASYON (AÇI VE SÜRE) KONTROLLERİ
    // ==========================================
    const handleIncrementAngle = () => {
        const currentIndex = VALID_ANGLES.indexOf(oscillationSettings.angle);
        const nextIndex = Math.min(VALID_ANGLES.length - 1, currentIndex !== -1 ? currentIndex + 1 : 0);
        applyOscillation(VALID_ANGLES[nextIndex], oscModeUI);
    };

    const handleDecrementAngle = () => {
        const currentIndex = VALID_ANGLES.indexOf(oscillationSettings.angle);
        const prevIndex = Math.max(0, currentIndex !== -1 ? currentIndex - 1 : 0);
        applyOscillation(VALID_ANGLES[prevIndex], oscModeUI);
    };

    const handleAngleSliderChange = (sliderValue: number) => {
        const closestAngle = VALID_ANGLES.reduce((prev, curr) =>
            Math.abs(curr - sliderValue) < Math.abs(prev - sliderValue) ? curr : prev
        );
        applyOscillation(closestAngle, oscModeUI);
    };

    // 180°-600° aralığını, 50ms-500ms aralığına dönüştüren matematiksel oranlayıcı
    const getMappedTimeMs = (angle: number) => {
        const minAngle = VALID_ANGLES[0]; // 180
        const maxAngle = VALID_ANGLES[VALID_ANGLES.length - 1] || 600; // 600
        const minTime = 50;
        const maxTime = 500;

        return Math.round(minTime + ((angle - minAngle) / (maxAngle - minAngle)) * (maxTime - minTime));
    };

    // Mod değiştiğinde (Hassas <-> Kuvvetli) mevcut açıyı yeni kurallarla donanıma gönder
    const handleModeSwitch = (newMode: 'hassas' | 'kuvvetli') => {
        setOscModeUI(newMode);
        applyOscillation(oscillationSettings.angle, newMode);
    };

    /**
     * Ortak Osilasyon Uygulayıcı:
     * UI'da her zaman Açı (Derece) görünür. Ancak donanıma giden veri seçilen moda göre değişir.
     */
    const applyOscillation = (targetAngle: number, activeMode: 'hassas' | 'kuvvetli') => {
        setOscillationSettings({ ...oscillationSettings, angle: targetAngle });

        if (activeMode === 'hassas') {
            sendOscillationSettings({
                mode: 'angle',
                angle: targetAngle,
                accel: MAX_ACCEL
            });
        } else {
            // KUVVETLİ (Powerful) MOD: Yeni orantı fonksiyonumuzu kullanıyoruz
            const calculatedTimeMs = getMappedTimeMs(targetAngle);

            sendOscillationSettings({
                mode: 'time',
                timeMs: calculatedTimeMs,
                accel: MAX_ACCEL,
                angle: 0
            });
        }
    };

    // ==========================================
    // ORTAK KONTROLLER
    // ==========================================
    const handleLogoClick = () => {
        if (motor.isActive) {
            sendStopMotor();
        } else {
            sendStartMotor();
        }
    };

    const oscPercent = Math.round((Math.max(0, oscillationSettings.angle) / MAX_OSC_ANGLE) * 100);

    return (
        <Box className={classes.wrapper}>
            <LayoutSwitchButton />
            <Stack justify="space-between" h="100%" p="xl">
                <PresetButtons />

                <Group justify="center" align="center" w="100%" className={classes.centerGroup}>

                    <Gauge
                        value={motor.pwm}
                        maxValue={MAX_RPM}
                        step={RPM_STEP}
                        label="RPM"
                        mirror={false}
                        onIncrement={handleIncrementRpm}
                        onDecrement={handleDecrementRpm}
                        onChange={handleRpmSliderChange}
                        onSliderChange={handleRpmSliderChange}
                    />

                    <Stack align="center" mx="xl" className={classes.logoWrap}>
                        <ErtipLogo
                            className={cx(classes.logo, { [classes.logoActive]: motor.isActive })}
                            onClick={handleLogoClick}
                            width="300"
                            style={{ cursor: 'pointer' }}
                        />
                        <Box className={classes.centerGraphic}>
                            <Text className={classes.welcomeText}>Hoş geldiniz</Text>
                            <Text className={classes.doctorName}>Dr. Tayfun Oğuzoğlu</Text>
                        </Box>

                        <Stack align="center" mt={8} mb={-200}>
                            <TissueHardnessChartBar
                                isRunning={motor.isActive}
                                rpm={motor.pwm}
                                oscillation={oscPercent}
                            />
                        </Stack>
                    </Stack>

                    {/* SAĞ KADRAN (OSİLASYON) VE MOD SEÇİCİ */}
                    <Stack align="center" gap="xs">
                        {/* YENİ: Hassas / Kuvvetli Mod Seçici */}
                        <Tooltip label={oscModeUI === 'hassas' ? "Motor açıya odaklanır." : `Motor süreye odaklanır (Tam ${getMappedTimeMs(oscillationSettings.angle)}ms vuruş süresi).`} position="top" withArrow>
                            <SegmentedControl
                                value={oscModeUI}
                                onChange={(val) => handleModeSwitch(val as 'hassas' | 'kuvvetli')}
                                data={[
                                    { label: 'Hassas (Sensitive)', value: 'hassas' },
                                    { label: 'Kuvvetli (Powerful)', value: 'kuvvetli' }
                                ]}
                                size="sm"
                                color="grape"
                                radius="xl"
                                style={{ marginBottom: '-10px', zIndex: 10 }}
                            />
                        </Tooltip>

                        <Gauge
                            value={oscillationSettings.angle}
                            maxValue={MAX_OSC_ANGLE}
                            step={15}
                            label="Oscillation"
                            subLabel="°"
                            mirror={true}
                            onIncrement={handleIncrementAngle}
                            onDecrement={handleDecrementAngle}
                            onChange={handleAngleSliderChange}
                            onSliderChange={handleAngleSliderChange}
                        />
                    </Stack>

                </Group>

                <Stack align="center" gap="md">
                    <InfoPanel showClock/>
                </Stack>
            </Stack>
        </Box>
    );
}