// packages/frontend/src/components/panels/DisplayPanel.tsx

import { Paper, Text, Stack, Group, Button } from '@mantine/core';
import { useControllerStore } from '../../store/useControllerStore';

const pwmToRpm = (pwm: number) => {
    if (pwm === 0) return 0;
    return Math.round((pwm / 255) * 18000);
};

export function DisplayPanel() {
    // Tüm verileri doğrudan store'dan alıyoruz
    const { motor, graftCount, sessionTime, incrementGraftCount, resetSession } = useControllerStore();

    const formatTime = (timeInSeconds: number) => {
        const minutes = Math.floor(timeInSeconds / 60).toString().padStart(2, '0');
        const seconds = (timeInSeconds % 60).toString().padStart(2, '0');
        return `${minutes}:${seconds}`;
    };

    return (
        <Paper withBorder p="xl" h="100%">
            <Stack align="center" justify="space-around" h="100%">
                {/* RPM Göstergesi */}
                <Stack gap={0} align="center">
                    <Text size="xl" c="dimmed">MOTOR HIZI</Text>
                    <Text fz={80} fw={700} c={motor.isActive ? 'teal.4' : 'dimmed'}>
                        {pwmToRpm(motor.pwm)}
                    </Text>
                    <Text size="xl" c="dimmed">RPM</Text>
                </Stack>

                {/* Greft ve Süre */}
                <Group grow justify="center" w="100%">
                    <Stack gap={0} align="center">
                        <Text size="lg" c="dimmed">GREFT SAYISI</Text>
                        <Text fz={50} fw={600}>{graftCount}</Text>
                        <Button onClick={incrementGraftCount} size="xs">MANUEL ARTIR</Button>
                    </Stack>
                    <Stack gap={0} align="center">
                        <Text size="lg" c="dimmed">SEANS SÜRESİ</Text>
                        <Text fz={50} fw={600}>{formatTime(sessionTime)}</Text>
                        <Button onClick={resetSession} color="red" size="xs">SIFIRLA</Button>
                    </Stack>
                </Group>
            </Stack>
        </Paper>
    );
}