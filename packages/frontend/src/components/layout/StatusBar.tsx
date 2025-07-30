// packages/frontend/src/components/layout/StatusBar.tsx

import { Paper, Group, Text, Divider, Badge } from '@mantine/core';
import { useControllerStore } from '../../store/useControllerStore';
import {
    IconWifi, IconWifiOff, IconShoe, IconUsb, IconPlugConnectedX,
    IconPower, IconInfinity, IconRepeat, IconHandGrab
} from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { socket } from '../../services/socketService';

const pwmToRpm = (pwm: number) => Math.round((pwm / 255) * 18000);

export function StatusBar() {
    // Store'dan gerekli tüm durumları çekiyoruz
    const {
        connectionStatus,
        arduinoStatus,
        motorStatus,
        operatingMode,
        oscillationSettings,
        ftswMode
    } = useControllerStore();

    const [isPedalPressed, setIsPedalPressed] = useState(false);

    useEffect(() => {
        const onArduinoEvent = (data: { type: 'PEDAL' | 'FTSW', state: 0 | 1 }) => {
            if (data.type === 'PEDAL') {
                setIsPedalPressed(data.state === 1);
            }
        };
        socket.on('arduino_event', onArduinoEvent);
        return () => {
            socket.off('arduino_event', onArduinoEvent);
        };
    }, []);

    return (
        <Paper withBorder p="xs" radius="md">
            <Group justify="space-between" wrap="nowrap">
                {/* Sol Taraf: Bağlantı Durumları */}
                <Group gap="xs">
                    <Group gap={5}>
                        {connectionStatus === 'connected' ? <IconWifi size={20} color="green" /> : <IconWifiOff size={20} color="red" />}
                        <Text size="xs">Sunucu</Text>
                    </Group>
                    <Divider orientation="vertical" />
                    <Group gap={5}>
                        {arduinoStatus === 'connected' ? <IconUsb size={20} color="green" /> : <IconPlugConnectedX size={20} color="red" />}
                        <Text size="xs">Cihaz</Text>
                    </Group>
                </Group>

                {/* Orta Taraf: Anlık Cihaz Bilgileri */}
                <Group gap="xs">
                    <Badge color={motorStatus.isActive ? 'green' : 'gray'} leftSection={<IconPower size={14} />}>
                        {motorStatus.isActive ? `${pwmToRpm(motorStatus.pwm)} RPM` : 'DURUYOR'}
                    </Badge>

                    <Badge
                        variant="light"
                        color="cyan"
                        leftSection={operatingMode === 'continuous' ? <IconInfinity size={14} /> : <IconRepeat size={14} />}
                    >
                        {operatingMode === 'continuous' ? 'Sürekli' : `Osilasyon: ${oscillationSettings.angle}°`}
                    </Badge>
                </Group>

                {/* Sağ Taraf: Kontrol Modu ve Pedal Durumu */}
                <Group gap="xs">
                    <Badge
                        variant="outline"
                        color="gray"
                        leftSection={ftswMode === 'foot' ? <IconShoe size={14} /> : <IconHandGrab size={14} />}
                    >
                        {ftswMode === 'foot' ? 'Ayak Kontrol' : 'El Kontrol'}
                    </Badge>
                    {isPedalPressed && (
                        <Badge
                            variant="filled"
                            color="blue"
                        >
                            Pedal Aktif
                        </Badge>
                    )}
                </Group>
            </Group>
        </Paper>
    );
}