import {Box, Stack, Group, Text} from '@mantine/core';
import classes from './ClinicalLayout.module.css';
import {Gauge} from "./Gauge.tsx";
import {RPM_CALIBRATION_MARKS, VALID_ANGLES} from "../../config/calibration.ts";
import {useControllerStore} from "../../store/useControllerStore.ts";
import {InfoPanel} from "./InfoPanel.tsx";
import {pwmToClosestRpm, rpmToClosestPwm} from "../../utils/rpmUtils.ts";
import {PresetButtons} from "./PresetButtons.tsx";
import {sendMotorPwm, sendOscillationSettings, sendStartMotor, sendStopMotor} from "../../services/socketService.ts";
import ErtipLogo from '../../assets/ertip-logo.svg?react';
import cx from 'clsx';
// import {TissueHardnessChart} from "./TissueHardnessChart.tsx";
import {MAX_OSC_ANGLE, pwmToRpm} from "../../utils/deviceSelectors.ts";
import {TissueHardnessChartBar} from "./TissueHardnessChartBar.tsx";


export function ClinicalLayout() {
    const { motor, oscillationSettings, setMotorStatus, setOscillationSettings } = useControllerStore();
    const maxRpm = RPM_CALIBRATION_MARKS[RPM_CALIBRATION_MARKS.length - 1].rpm;
    // const maxAngle = 600;
    const maxAngle=VALID_ANGLES[VALID_ANGLES.length-1];

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

    const handleLogoDoubleClick = () => {
        if (motor.isActive) {
            sendStopMotor();
        } else {
            sendStartMotor();
        }
    };

    //temp
    const rpm = pwmToRpm(motor.pwm);
    const oscPercent = Math.round(
        (Math.max(0, oscillationSettings.angle) / MAX_OSC_ANGLE) * 100
    );


    return (
        <Box className={classes.wrapper}>
            <Stack justify="space-between" h="100%" p="xl">
                <PresetButtons />

                <Group justify="center" align="center" w="100%" className={classes.centerGroup}>

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
                                rpm={rpm}
                                oscillation={oscPercent}
                            />
                        </Stack>
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
                {/*<Stack align="center" gap={8} className={classes.chartStack}>*/}
                {/*    <TissueHardnessChart />*/}
                {/*</Stack>*/}
                <Stack align="center" gap="md">
                    {/*<InfoPanel />*/}
                    {/*<Clock />*/}
                    <InfoPanel showClock/>
                </Stack>
            </Stack>
        </Box>
    );
}