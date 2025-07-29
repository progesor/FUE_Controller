// packages/frontend/src/components/panels/DisplayPanel.tsx

import { Paper, Title, Text, Stack, Group, Button } from '@mantine/core';
import { useControllerStore } from '../../store/useControllerStore';
import React, { useState, useEffect, useRef } from 'react'; // <-- useState, useEffect, useRef import edildi

// RPM değerini PWM'den hesaplayan basit bir yardımcı fonksiyon
const pwmToRpm = (pwm: number) => {
    if (pwm === 0) return 0;
    // Bu formül tamamen tahmini bir başlangıç noktasıdır.
    return Math.round((pwm / 255) * 18000);
};

export function DisplayPanel() {
    const motorStatus = useControllerStore((state) => state.motorStatus);
    const [graftCount, setGraftCount] = useState(0);

    // --- useStopwatch yerine kendi kronometre mantığımız ---
    const [time, setTime] = useState(0);
    const [running, setRunning] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (motorStatus.isActive) {
            if (!running) {
                setRunning(true);
                timerRef.current = setInterval(() => {
                    setTime(prevTime => prevTime + 1);
                }, 1000);
            }
        } else {
            if (running) {
                setRunning(false);
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                }
            }
        }

        // Bileşen kaldırıldığında interval'ı temizle
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [motorStatus.isActive, running]);

    const resetTimer = () => {
        setTime(0);
        setGraftCount(0); // Süre sıfırlanınca greft de sıfırlansın
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
        setRunning(false);
    };
    // --- Kronometre mantığı sonu ---

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
                    <Text fz={80} fw={700} c={motorStatus.isActive ? 'teal.4' : 'dimmed'}>
                        {pwmToRpm(motorStatus.pwm)}
                    </Text>
                    <Text size="xl" c="dimmed">RPM</Text>
                </Stack>

                {/* Greft ve Süre */}
                <Group grow justify="center" w="100%">
                    <Stack gap={0} align="center">
                        <Text size="lg" c="dimmed">GREFT SAYISI</Text>
                        <Text fz={50} fw={600}>{graftCount}</Text>
                        <Button onClick={() => setGraftCount(c => c + 1)} size="xs">MANUEL ARTIR</Button>
                    </Stack>
                    <Stack gap={0} align="center">
                        <Text size="lg" c="dimmed">SEANS SÜRESİ</Text>
                        <Text fz={50} fw={600}>{formatTime(time)}</Text>
                        <Button onClick={resetTimer} color="red" size="xs">SIFIRLA</Button>
                    </Stack>
                </Group>

            </Stack>
        </Paper>
    );
}