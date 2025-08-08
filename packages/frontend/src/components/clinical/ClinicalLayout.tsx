import { Box, Stack, Group } from '@mantine/core';
import classes from './ClinicalLayout.module.css';

// SVG varlıklarını projemize import ediyoruz
import ertipLogo from '../../assets/ertip-logo.svg';
import {Gauge} from "./Gauge.tsx";
import {RPM_CALIBRATION_MARKS} from "../../config/calibration.ts";
import {useControllerStore} from "../../store/useControllerStore.ts";
import {InfoPanel} from "./InfoPanel.tsx";
import {Clock} from "./Clock.tsx";
import {pwmToClosestRpm} from "../../utils/rpmUtils.ts";
import {PresetButtons} from "./PresetButtons.tsx";


export function ClinicalLayout() {
    const { motor, oscillationSettings } = useControllerStore();
    const maxRpm = RPM_CALIBRATION_MARKS[RPM_CALIBRATION_MARKS.length - 1].rpm;
    const maxAngle = 600;

    return (
        <Box className={classes.wrapper}>
            <Stack justify="space-between" h="100%" p="xl">
                {/* ... Diğer bileşenler aynı kalıyor ... */}
                <PresetButtons />

                <Group justify="center" align="center" w="100%">
                    {/* Store'dan gelen 'oscillationSettings.angle' verisini bağlıyoruz */}

                    <Gauge
                        value={pwmToClosestRpm(motor.pwm)}
                        maxValue={maxRpm}
                        label="RPM"
                        mirror={false}
                    />
                    <Stack align="center" mx="xl">
                        <img src={ertipLogo} alt="Ertip Logo" width="300" />
                        {/*<img src={deviceGraphic} alt="Device" width="300" />*/}
                        <Box className={classes.centerGraphic} />
                    </Stack>
                    <Gauge
                        value={oscillationSettings.angle}
                        maxValue={maxAngle}
                        label="Oscillation"
                        subLabel="%"
                        mirror={true}
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