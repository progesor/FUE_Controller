// packages/frontend/src/components/aura/AuraLayout.tsx (YENİDEN OLUŞTURULMUŞ HALİ)

import { Box } from '@mantine/core';
import { DynamicBackground } from './DynamicBackground';
import { StatusOrb } from './StatusOrb';
import { HolographicGauge } from './HolographicGauge';
import { ControlArc } from './ControlArc';
import { useControllerStore } from '../../store/useControllerStore';
import { RPM_CALIBRATION_MARKS, VALID_ANGLES } from '../../config/calibration';
import classes from './AuraLayout.module.css';
import {sendMotorPwm, sendOscillationSettings} from "../../services/socketService.ts";
import {RecipeDrawer} from "./RecipeDrawer.tsx";

// PWM'i en yakın RPM değerine çeviren yardımcı fonksiyon (değişiklik yok)
const pwmToClosestRpm = (pwm: number): number => {
    if (pwm === 0) return 0;
    const closestMark = RPM_CALIBRATION_MARKS.reduce((prev, curr) =>
        Math.abs(curr.pwm - pwm) < Math.abs(prev.pwm - pwm) ? curr : prev
    );
    return closestMark.rpm;
};

// RPM'i en yakın PWM değerine çeviren yeni yardımcı fonksiyon
const rpmToClosestPwm = (rpm: number): number => {
    if (rpm === 0) return 0;
    const closestMark = RPM_CALIBRATION_MARKS.reduce((prev, curr) =>
        Math.abs(curr.rpm - rpm) < Math.abs(prev.rpm - rpm) ? curr : prev
    );
    return closestMark.pwm;
};


export function AuraLayout() {
    const { motor, oscillationSettings, operatingMode, setMotorStatus, setOscillationSettings } = useControllerStore();

    const currentRpm = pwmToClosestRpm(motor.pwm);
    const maxRpm = RPM_CALIBRATION_MARKS[RPM_CALIBRATION_MARKS.length - 1]?.rpm || 3000;
    const maxAngle = VALID_ANGLES[VALID_ANGLES.length - 1] || 600;

    const isRpmInteractive = operatingMode === 'continuous' || operatingMode === 'oscillation';
    const isAngleInteractive = operatingMode === 'oscillation';

    const handleRpmChange = (newRpm: number) => {
        const newPwm = rpmToClosestPwm(newRpm);
        // Önce frontend state'ini anında güncelle (daha akıcı his için)
        setMotorStatus({ pwm: newPwm });
        // Sonra bu değişikliği backend'e gönder
        sendMotorPwm(newPwm);
    };

    const handleAngleChange = (newAngle: number) => {
        // En yakın geçerli açıya yuvarla (isteğe bağlı ama daha iyi bir UX)
        const closestAngle = VALID_ANGLES.reduce((prev, curr) =>
            Math.abs(curr - newAngle) < Math.abs(prev - newAngle) ? curr : prev
        );
        // Frontend state'ini güncelle
        setOscillationSettings({ angle: closestAngle });
        // Backend'e gönder
        sendOscillationSettings({ angle: closestAngle });
    };


    return (
        <Box className={classes.wrapper}>
            <DynamicBackground />
            <Box className={classes.content}>
                <Box className={classes.gaugeCluster}>
                    <HolographicGauge
                        value={currentRpm}
                        maxValue={maxRpm}
                        label="Motor Hızı"
                        unit="RPM"
                        color="#00e5ff"
                        isInteractive={isRpmInteractive}
                        onChange={handleRpmChange}
                        sensitivity={10}
                    />
                    <StatusOrb />
                    <HolographicGauge
                        value={oscillationSettings.angle}
                        maxValue={maxAngle}
                        label="Osilasyon"
                        unit="Derece"
                        color="#d457ff"
                        isInteractive={isAngleInteractive}
                        onChange={handleAngleChange}
                        sensitivity={2}
                    />
                </Box>
                <ControlArc />
            </Box>
            <RecipeDrawer />
        </Box>
    );
}