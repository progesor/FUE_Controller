import { Box, Stack, Group } from '@mantine/core';
import classes from './ClinicalLayout.module.css';

// SVG varlıklarını projemize import ediyoruz
import ertipLogo from '../../assets/ertip-logo.svg';
import deviceGraphic from '../../assets/device-graphic.svg';
import {Gauge} from "./Gauge.tsx";
import {RPM_CALIBRATION_MARKS} from "../../config/calibration.ts";
import {useControllerStore} from "../../store/useControllerStore.ts";
import {InfoPanel} from "./InfoPanel.tsx";
import {Clock} from "./Clock.tsx";
import {pwmToClosestRpm} from "../../utils/rpmUtils.ts";


const PresetButtonsPlaceholder = () => (
    <Group justify="center" gap="lg">
        {Array(5).fill(0).map((_, index) => (
            <Box key={index} className={classes.presetButtonPlaceholder} />
        ))}
    </Group>
);

export function ClinicalLayout() {
    // Store'dan anlık verileri çekiyoruz
    const { motor, oscillationSettings } = useControllerStore();

    // RPM ve Açı göstergeleri için maksimum değerleri belirliyoruz
    const maxRpm = RPM_CALIBRATION_MARKS[RPM_CALIBRATION_MARKS.length - 1].rpm;
    const maxAngle = 600;

    return (
        <Box className={classes.wrapper}>
            <Stack justify="space-between" h="100%" p="xl">
                {/* ... Diğer bileşenler aynı kalıyor ... */}
                <PresetButtonsPlaceholder />

                <Group justify="center" align="center" w="100%">
                    {/* Store'dan gelen 'oscillationSettings.angle' verisini bağlıyoruz */}
                    <Gauge
                        value={oscillationSettings.angle}
                        maxValue={maxAngle}
                        label="Oscillation"
                        subLabel="%" // Bu kısmı şimdilik statik bırakabilir veya başka bir veri ile doldurabiliriz.
                    />

                    <Stack align="center" mx="xl">
                        <img src={ertipLogo} alt="Ertip Logo" width="300" />
                        <img src={deviceGraphic} alt="Device" width="300" />
                    </Stack>

                    {/* Store'dan gelen 'motor.pwm' verisini RPM'e çevirip bağlıyoruz */}
                    <Gauge
                        value={pwmToClosestRpm(motor.pwm)}
                        maxValue={maxRpm}
                        label="RPM"
                        mirror={true}
                    />
                </Group>

                {/* ... Diğer bileşenler aynı kalıyor ... */}
                <Stack align="center">
                    {/* Placeholder'ları gerçek bileşenlerle değiştiriyoruz */}
                    <InfoPanel />
                    <Clock />
                </Stack>
            </Stack>
        </Box>
    );
}