import { Box, Center, Stack, Group } from '@mantine/core';
import classes from './ClinicalLayout.module.css';

// SVG varlıklarını projemize import ediyoruz
import ertipLogo from '../../assets/ertip-logo.svg';
import deviceGraphic from '../../assets/device-graphic.svg';

// Gelecek fazlarda oluşturacağımız bileşenler için yer tutucular
const GaugePlaceholder = ({ label }: { label: string }) => (
    <Center className={classes.gaugePlaceholder}>
        <Box ta="center">{label}</Box>
    </Center>
);

const InfoPanelPlaceholder = () => (
    <Group justify="space-around" w="100%" mt="md">
        <Box ta="center">Work Time</Box>
        <Box ta="center">Counter</Box>
        <Box ta="center">Total Work Time</Box>
    </Group>
);

const PresetButtonsPlaceholder = () => (
    <Group justify="center" gap="lg">
        {Array(5).fill(0).map((_, index) => (
            <Box key={index} className={classes.presetButtonPlaceholder} />
        ))}
    </Group>
);

const ClockPlaceholder = () => (
    <Box mt="xl">09:54 AM</Box>
);

export function ClinicalLayout() {
    return (
        <Box className={classes.wrapper}>
            {/* Arka plan SVG'si CSS üzerinden eklenecek.
                Bu, içeriğin üzerinde konumlanmasını kolaylaştırır.
            */}
            <Stack justify="space-between" h="100%" p="xl">
                {/* Üst Kısım: Preset Butonları */}
                <PresetButtonsPlaceholder />

                {/* Orta Kısım: Göstergeler ve Cihaz Grafiği */}
                <Group justify="center" align="center" w="100%">
                    <GaugePlaceholder label="Oscillation Gauge" />
                    <Stack align="center" mx="xl">
                        <img src={ertipLogo} alt="Ertip Logo" width="150" />
                        <img src={deviceGraphic} alt="Device" width="300" />
                    </Stack>
                    <GaugePlaceholder label="RPM Gauge" />
                </Group>

                {/* Alt Kısım: Bilgiler ve Saat */}
                <Stack align="center">
                    <InfoPanelPlaceholder />
                    <ClockPlaceholder />
                </Stack>
            </Stack>
        </Box>
    );
}