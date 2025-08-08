import { Box, Stack, Group } from '@mantine/core';
import classes from './ClinicalLayout.module.css';

// SVG varlıklarını projemize import ediyoruz
import ertipLogo from '../../assets/ertip-logo.svg';
import {Gauge} from "./Gauge.tsx";
import {RPM_CALIBRATION_MARKS, VALID_ANGLES} from "../../config/calibration.ts";
import {useControllerStore} from "../../store/useControllerStore.ts";
import {InfoPanel} from "./InfoPanel.tsx";
import {Clock} from "./Clock.tsx";
import {pwmToClosestRpm, rpmToClosestPwm} from "../../utils/rpmUtils.ts";
import {PresetButtons} from "./PresetButtons.tsx";
import {sendMotorPwm, sendOscillationSettings} from "../../services/socketService.ts";


export function ClinicalLayout() {
    const { motor, oscillationSettings, setMotorStatus, setOscillationSettings } = useControllerStore();
    const maxRpm = RPM_CALIBRATION_MARKS[RPM_CALIBRATION_MARKS.length - 1].rpm;
    const maxAngle = 600;

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

    const handleRpmSliderChange = (sliderValue: number) => {
        const newPwm = rpmToClosestPwm(sliderValue);
        setMotorStatus({ pwm: newPwm });
        sendMotorPwm(newPwm);
    };

    const handleAngleSliderChange = (sliderValue: number) => {
        const closestAngle = VALID_ANGLES.reduce((prev, curr) =>
            Math.abs(curr - sliderValue) < Math.abs(prev - sliderValue) ? curr : prev
        );
        setOscillationSettings({ angle: closestAngle });
        sendOscillationSettings({ angle: closestAngle });
    };

    // YENİ: Dokunmatik sürükleme için handler'lar (slider ile aynı mantık)
    const handleRpmGaugeChange = (gaugeValue: number) => {
        handleRpmSliderChange(gaugeValue); // Aynı mantığı kullanabiliriz
    };

    const handleAngleGaugeChange = (gaugeValue: number) => {
        handleAngleSliderChange(gaugeValue);
    };


    return (
        <Box className={classes.wrapper}>
            <Stack justify="space-between" h="100%" p="xl">
                <PresetButtons />

                <Group justify="center" align="center" w="100%">

                    <Gauge
                        value={pwmToClosestRpm(motor.pwm)}
                        maxValue={maxRpm}
                        label="RPM"
                        mirror={false}
                        onIncrement={handleIncrementRpm}
                        onDecrement={handleDecrementRpm}
                        onChange={handleRpmGaugeChange}
                        onSliderChange={handleRpmSliderChange}
                    />
                    <Stack align="center" mx="xl">
                        <img src={ertipLogo} alt="Ertip Logo" width="300" />
                        {/*<img src={deviceGraphic} alt="Device" width="300" />*/}
                        <Box className={classes.centerGraphic}>
                            <text className={classes.welcomeText}>Hoş geldiniz</text>
                            <text className={classes.doctorName}>Dr. Tayfun Oğuzoğlu</text>
                        </Box>
                    </Stack>
                    <Gauge
                        value={oscillationSettings.angle}
                        maxValue={maxAngle}
                        label="Oscillation"
                        subLabel="%"
                        mirror={true}
                        onIncrement={handleIncrementAngle}
                        onDecrement={handleDecrementAngle}
                        onChange={handleAngleGaugeChange}
                        onSliderChange={handleAngleSliderChange}
                    />

                </Group>
                <Stack align="center">
                    <InfoPanel />
                    <Clock />
                </Stack>
            </Stack>
        </Box>
    );
}