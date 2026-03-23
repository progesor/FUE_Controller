// packages/frontend/src/views/ClinicalLayout.tsx

import { Box, Stack, Group, Text } from '@mantine/core';
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

// Maksimum donanım limitleri (Artık kalibrasyon tablosu yok, doğrudan gerçek veriler)
const MAX_RPM = 35000;
const RPM_STEP = 500; // + ve - butonlarına basıldığında atlanacak RPM miktarı
const DEFAULT_ACCEL = 30000; // Klinik ekranından osilasyon değiştirildiğinde varsayılan sertlik
const MAX_OSC_ANGLE = VALID_ANGLES[VALID_ANGLES.length - 1] || 600;

export function ClinicalLayout() {
    const { motor, oscillationSettings, setMotorStatus, setOscillationSettings } = useControllerStore();

    // ==========================================
    // RPM KONTROLLERİ (DOĞRUDAN DEVİR)
    // ==========================================
    const handleIncrementRpm = () => {
        // Hedef hızı RPM_STEP kadar artır, MAX_RPM'i geçme
        const newVal = Math.min(MAX_RPM, motor.pwm + RPM_STEP);
        setMotorStatus({ pwm: newVal });
        sendMotorPwm(newVal);
    };

    const handleDecrementRpm = () => {
        // Hedef hızı RPM_STEP kadar azalt, 0'ın altına düşme
        const newVal = Math.max(0, motor.pwm - RPM_STEP);
        setMotorStatus({ pwm: newVal });
        sendMotorPwm(newVal);
    };

    const handleRpmSliderChange = (sliderValue: number) => {
        // Kullanıcı slider'ı sürüklediğinde gelen hassas değeri doğrudan uygula
        setMotorStatus({ pwm: sliderValue });
        sendMotorPwm(sliderValue);
    };

    // ==========================================
    // OSİLASYON (AÇI) KONTROLLERİ
    // ==========================================
    const handleIncrementAngle = () => {
        // Butonlarda hala VALID_ANGLES dizisini kullanarak standart açılara zıplıyoruz
        const currentIndex = VALID_ANGLES.indexOf(oscillationSettings.angle);
        const nextIndex = Math.min(VALID_ANGLES.length - 1, currentIndex !== -1 ? currentIndex + 1 : 0);
        const newAngle = VALID_ANGLES[nextIndex];

        applyOscillationAngle(newAngle);
    };

    const handleDecrementAngle = () => {
        const currentIndex = VALID_ANGLES.indexOf(oscillationSettings.angle);
        const prevIndex = Math.max(0, currentIndex !== -1 ? currentIndex - 1 : 0);
        const newAngle = VALID_ANGLES[prevIndex];

        applyOscillationAngle(newAngle);
    };

    const handleAngleSliderChange = (sliderValue: number) => {
        // Sürüklemede en yakın VALID_ANGLE değerine yapıştır (İstersen bunu kaldırıp serbest bırakabilirsin)
        const closestAngle = VALID_ANGLES.reduce((prev, curr) =>
            Math.abs(curr - sliderValue) < Math.abs(prev - sliderValue) ? curr : prev
        );
        applyOscillationAngle(closestAngle);
    };

    // Osilasyon komutunu arka planda her zaman Açı modu ve Sabit İvme ile gönderen yardımcı fonksiyon
    const applyOscillationAngle = (newAngle: number) => {
        const newSettings = {
            ...oscillationSettings,
            mode: 'angle' as const,
            angle: newAngle,
            accel: DEFAULT_ACCEL
        };
        setOscillationSettings(newSettings);
        sendOscillationSettings(newSettings);
    };

    // ==========================================
    // ORTAK KONTROLLER
    // ==========================================
    const handleLogoDoubleClick = () => {
        if (motor.isActive) {
            sendStopMotor();
        } else {
            sendStartMotor();
        }
    };

    // Grafik bar için yüzdelik hesaplama
    const oscPercent = Math.round((Math.max(0, oscillationSettings.angle) / MAX_OSC_ANGLE) * 100);

    return (
        <Box className={classes.wrapper}>
            <LayoutSwitchButton />
            <Stack justify="space-between" h="100%" p="xl">
                <PresetButtons />

                <Group justify="center" align="center" w="100%" className={classes.centerGroup}>

                    <Gauge
                        value={motor.pwm} // Artık motor.pwm doğrudan RPM'i temsil ediyor
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
                            onDoubleClick={handleLogoDoubleClick}
                            width="300"
                        />
                        <Box className={classes.centerGraphic}>
                            <Text className={classes.welcomeText}>Hoş geldiniz</Text>
                            <Text className={classes.doctorName}>Dr. Tayfun Oğuzoğlu</Text>
                        </Box>

                        <Stack align="center" mt={8} mb={-200}>
                            <TissueHardnessChartBar
                                isRunning={motor.isActive}
                                rpm={motor.pwm} // Grafiğe de gerçek RPM'i veriyoruz
                                oscillation={oscPercent}
                            />
                        </Stack>
                    </Stack>

                    <Gauge
                        value={oscillationSettings.angle}
                        maxValue={MAX_OSC_ANGLE}
                        label="Oscillation"
                        subLabel="°" // Yüzde (%) yerine Derece işareti (°) koymak daha mantıklı olabilir
                        mirror={true}
                        onIncrement={handleIncrementAngle}
                        onDecrement={handleDecrementAngle}
                        onChange={handleAngleSliderChange}
                        onSliderChange={handleAngleSliderChange}
                    />
                </Group>

                <Stack align="center" gap="md">
                    <InfoPanel showClock/>
                </Stack>
            </Stack>
        </Box>
    );
}