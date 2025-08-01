// packages/frontend/src/components/common/LogSummary.tsx

import { Box, Text, Badge, Group, Paper, Divider, Progress, ThemeIcon } from '@mantine/core';
import { IconPower, IconRepeat, IconInfinity, IconWaveSine, IconActivity, IconSettings, IconArrowRight, IconArrowLeft } from '@tabler/icons-react';
import type { DeviceStatus, OperatingMode } from '../../../../shared-types';

interface LogSummaryProps {
    data: DeviceStatus;
}

const pwmToPercentage = (pwm: number) => {
    const MIN_PWM = 50;
    const MAX_PWM = 255;
    if (pwm < MIN_PWM) return 0;
    return Math.round(((pwm - MIN_PWM) / (MAX_PWM - MIN_PWM)) * 100);
};

/**
 * Modun türüne göre uygun renk ve ikonu döndüren bir yardımcı fonksiyon.
 */
const getModeTheme = (mode: OperatingMode) => {
    switch (mode) {
        case 'continuous':
            return { color: 'blue', icon: <IconInfinity size={14} /> };
        case 'oscillation':
            return { color: 'teal', icon: <IconRepeat size={14} /> };
        case 'pulse':
            return { color: 'orange', icon: <IconActivity size={14} /> };
        case 'vibration':
            return { color: 'grape', icon: <IconWaveSine size={14} /> };
        default:
            return { color: 'gray', icon: <IconSettings size={14} /> };
    }
};

/**
 * Cihazın anlık çalışma modu ve temel ayarlarını gösteren detaylı bir bölüm render eder.
 */
const ModeDetails = ({ data }: { data: DeviceStatus }) => {
    const { operatingMode, oscillationSettings, pulseSettings, vibrationSettings } = data;

    const renderDetail = (label: string, value: string | number) => (
        <Group justify="space-between" mt={4}>
            <Text fz="xs" c="dimmed">{label}</Text>
            <Text fz="xs" fw={700}>{value}</Text>
        </Group>
    );

    const modeTheme = getModeTheme(operatingMode);

    return (
        <Box style={{ flex: 1 }}>
            <Group gap="xs" mb={4}>
                <ThemeIcon variant="light" color={modeTheme.color} size="sm">
                    {modeTheme.icon}
                </ThemeIcon>
                <Text fz="xs" fw={700} tt="capitalize">{operatingMode}</Text>
            </Group>
            <Divider />
            { operatingMode === 'oscillation' && renderDetail('Açı:', `${oscillationSettings.angle}°`) }
            { operatingMode === 'pulse' && renderDetail('Darbe/Bekleme:', `${pulseSettings.pulseDuration}ms / ${pulseSettings.pulseDelay}ms`) }
            { operatingMode === 'vibration' && renderDetail('Yoğunluk/Frekans:', `%${pwmToPercentage(vibrationSettings.intensity)} / Sviye ${vibrationSettings.frequency}`) }
        </Box>
    );
};

/**
 * DeviceStatus nesnesini detaylı ve şık bir "bilgi paneli" olarak görüntüler.
 */
export function LogSummary({ data }: LogSummaryProps) {
    if (!data || !data.motor) return null;

    const { motor } = data;
    const motorColor = motor.isActive ? 'green' : 'gray';

    return (
        <Paper withBorder p="xs" radius="sm" mt={4} bg="dark.7">
            <Group wrap="nowrap" align="stretch">
                {/* Motor Durumu */}
                <Box style={{ flex: 1 }}>
                    <Group gap="xs" mb={4}>
                        <ThemeIcon variant="light" color={motorColor} size="sm">
                            <IconPower size={14} />
                        </ThemeIcon>
                        <Text fz="xs" fw={700}>Motor</Text>
                    </Group>
                    <Divider />
                    <Group justify="space-between" mt={4}>
                        <Text fz="xs" c="dimmed">PWM</Text>
                        <Text fz="xs" fw={700}>{motor.pwm} / 255</Text>
                    </Group>
                    <Progress value={(motor.pwm / 255) * 100} size="sm" mt={4} color={motorColor} animated={motor.isActive} />
                    <Group justify="space-between" mt={4}>
                        <Text fz="xs" c="dimmed">Yön</Text>
                        <Badge
                            size="sm"
                            variant="filled"
                            color={motor.direction === 0 ? 'blue' : 'cyan'}
                            leftSection={motor.direction === 0 ? <IconArrowRight size={12}/> : <IconArrowLeft size={12} />}
                        >
                            {motor.direction === 0 ? 'CW' : 'CCW'}
                        </Badge>
                    </Group>
                </Box>

                <Divider orientation="vertical" />

                {/* Mod Ayarları */}
                <ModeDetails data={data} />
            </Group>
        </Paper>
    );
}