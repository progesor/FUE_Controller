// packages/frontend/src/components/layout/StatusBar.tsx

import { Paper, Group, Badge, Text, Divider } from '@mantine/core';
import { useControllerStore } from '../../store/useControllerStore';
// --- DEĞİŞİKLİK BURADA: IconUsbOff yerine IconPlugConnectedX import ediliyor ---
import { IconWifi, IconWifiOff, IconShoe, IconUsb, IconPlugConnectedX } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { socket } from '../../services/socketService';

export function StatusBar() {
    // Merkezi store'dan ilgili durumları alıyoruz
    const { connectionStatus, arduinoStatus } = useControllerStore();

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
            <Group justify="space-between">
                {/* Sol Taraf: Bağlantı Durumları */}
                <Group>
                    {/* Arayüz <-> Sunucu Bağlantısı */}
                    <Group gap="xs">
                        {connectionStatus === 'connected' ? <IconWifi color="green" /> : <IconWifiOff color="red" />}
                        <Text size="sm">Sunucu</Text>
                    </Group>

                    <Divider orientation="vertical" />

                    {/* Sunucu <-> Arduino Bağlantısı */}
                    <Group gap="xs">
                        {/* --- DEĞİŞİKLİK BURADA: IconUsbOff yerine IconPlugConnectedX kullanılıyor --- */}
                        {arduinoStatus === 'connected' ? <IconUsb color="green" /> : <IconPlugConnectedX color="red" />}
                        <Text size="sm">Cihaz</Text>
                    </Group>
                </Group>

                {/* Sağ Taraf: Anlık Durum İkonları */}
                <Group>
                    {isPedalPressed && (
                        <Badge
                            variant="light"
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