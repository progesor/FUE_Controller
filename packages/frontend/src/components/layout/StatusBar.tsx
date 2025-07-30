// packages/frontend/src/components/layout/StatusBar.tsx

import { Paper, Group, Badge, Text } from '@mantine/core';
import { useControllerStore } from '../../store/useControllerStore';
import { IconWifi, IconWifiOff, IconShoe } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { socket } from '../../services/socketService';

export function StatusBar() {
    // Merkezi store'dan genel bağlantı durumunu alıyoruz
    const connectionStatus = useControllerStore((state) => state.connectionStatus);

    // Pedal durumu için yerel bir state tutuyoruz, çünkü bu anlık bir olay.
    const [isPedalPressed, setIsPedalPressed] = useState(false);

    useEffect(() => {
        // Arduino olaylarını dinlemek için bir listener kuruyoruz
        const onArduinoEvent = (data: { type: 'PEDAL' | 'FTSW', state: 0 | 1 }) => {
            if (data.type === 'PEDAL') {
                setIsPedalPressed(data.state === 1);
            }
        };

        // Olay dinleyicisini socket'e ekle
        socket.on('arduino_event', onArduinoEvent);

        // Bileşen kaldırıldığında dinleyiciyi temizle (hafıza sızıntılarını önler)
        return () => {
            socket.off('arduino_event', onArduinoEvent);
        };
    }, []);


    return (
        <Paper withBorder p="xs" radius="md">
            <Group justify="space-between">
                {/* Sol Taraf: Bağlantı Durumu */}
                <Group>
                    {connectionStatus === 'connected' ? <IconWifi color="green" /> : <IconWifiOff color="red" />}
                    <Text size="sm">
                        {connectionStatus === 'connected' ? 'Bağlandı' : 'Bağlantı Koptu'}
                    </Text>
                </Group>

                {/* Sağ Taraf: Anlık Durum İkonları */}
                <Group>
                    {isPedalPressed && (
                        <Badge
                            variant="filled"
                            color="blue"
                            size="lg"
                            leftSection={<IconShoe size={16} />}
                        >
                            Pedal Aktif
                        </Badge>
                    )}
                </Group>
            </Group>
        </Paper>
    );
}