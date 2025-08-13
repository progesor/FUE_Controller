// packages/frontend/src/components/aura/AuraLayout.tsx

import { Box } from '@mantine/core';
import { DynamicBackground } from '../components/aura/DynamicBackground.tsx';
import { StatusOrb } from '../components/aura/StatusOrb.tsx';
import { HolographicGauge } from '../components/aura/HolographicGauge.tsx';
import { ControlArc } from '../components/aura/ControlArc.tsx';
import { useControllerStore } from '../store/useControllerStore.ts';
import { RPM_CALIBRATION_MARKS, VALID_ANGLES } from '../config/calibration.ts';
import classes from './AuraLayout.module.css';
import {sendMotorPwm, sendOscillationSettings} from "../services/socketService.ts";
import {RecipeDrawer} from "../components/aura/RecipeDrawer.tsx";
import {pwmToClosestRpm, rpmToClosestPwm} from "../utils/rpmUtils.ts";
import {SessionHUD} from "../components/aura/SessionHUD.tsx";
import {ActiveModeDisplay} from "../components/aura/ActiveModeDisplay.tsx";
import {LayoutSwitchButton} from "../components/common/LayoutSwitchButton.tsx";


export function AuraLayout() {
    const { motor, oscillationSettings, operatingMode, setMotorStatus, setOscillationSettings } = useControllerStore();

    const currentRpm = pwmToClosestRpm(motor.pwm);
    const maxRpm = RPM_CALIBRATION_MARKS[RPM_CALIBRATION_MARKS.length - 1]?.rpm || 3000;
    const maxAngle = VALID_ANGLES[VALID_ANGLES.length - 1] || 600;

    const isRpmInteractive = operatingMode === 'continuous' || operatingMode === 'oscillation';
    const isAngleInteractive = operatingMode === 'oscillation';

    const handleRpmChange = (finalRpm: number) => {
        const newPwm = rpmToClosestPwm(finalRpm);
        setMotorStatus({ pwm: newPwm });
        sendMotorPwm(newPwm);
    };

    const handleIncrementAngle = () => {
        const currentIndex = VALID_ANGLES.indexOf(oscillationSettings.angle);
        const nextIndex = Math.min(VALID_ANGLES.length - 1, currentIndex + 1);
        if (currentIndex !== nextIndex) {
            const newAngle = VALID_ANGLES[nextIndex];
            setOscillationSettings({ angle: newAngle });
            sendOscillationSettings({ angle: newAngle });
        }
    };

    const handleDecrementAngle = () => {
        const currentIndex = VALID_ANGLES.indexOf(oscillationSettings.angle);
        const prevIndex = Math.max(0, currentIndex - 1);
        if (currentIndex !== prevIndex) {
            const newAngle = VALID_ANGLES[prevIndex];
            setOscillationSettings({ angle: newAngle });
            sendOscillationSettings({ angle: newAngle });
        }
    };

    const handleIncrementRpm = () => {
        const currentMark = RPM_CALIBRATION_MARKS.find(m => m.pwm === motor.pwm) || RPM_CALIBRATION_MARKS[0];
        const currentIndex = RPM_CALIBRATION_MARKS.indexOf(currentMark);
        const nextIndex = Math.min(RPM_CALIBRATION_MARKS.length - 1, currentIndex + 1);
        if (currentIndex !== nextIndex) {
            const newPwm = RPM_CALIBRATION_MARKS[nextIndex].pwm;
            setMotorStatus({ pwm: newPwm });
            sendMotorPwm(newPwm);
        }
    };

    const handleDecrementRpm = () => {
        const currentMark = RPM_CALIBRATION_MARKS.find(m => m.pwm === motor.pwm) || RPM_CALIBRATION_MARKS[0];
        const currentIndex = RPM_CALIBRATION_MARKS.indexOf(currentMark);
        const prevIndex = Math.max(0, currentIndex - 1);
        if (currentIndex !== prevIndex) {
            const newPwm = RPM_CALIBRATION_MARKS[prevIndex].pwm;
            setMotorStatus({ pwm: newPwm });
            sendMotorPwm(newPwm);
        }
    };

    const handleAngleChange = (finalAngle: number) => {
    const closestAngle = VALID_ANGLES.reduce((prev, curr) =>
        Math.abs(curr - finalAngle) < Math.abs(prev - finalAngle) ? curr : prev
    );
    setOscillationSettings({ angle: closestAngle });
    sendOscillationSettings({ angle: closestAngle });
};


    return (
        <Box className={classes.wrapper}>
            <LayoutSwitchButton />
            <DynamicBackground />
            <SessionHUD />

            <ActiveModeDisplay />
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
                        mirror={false}
                        onIncrement={handleIncrementRpm}
                        onDecrement={handleDecrementRpm}
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
                        mirror={true}
                        onIncrement={handleIncrementAngle}
                        onDecrement={handleDecrementAngle}
                    />
                </Box>
                <ControlArc />
            </Box>
            <RecipeDrawer />
        </Box>
    );
}