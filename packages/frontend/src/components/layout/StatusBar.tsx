// packages/frontend/src/components/layout/StatusBar.tsx

import { useEffect, useState } from 'react';
import {Paper, Group, Text, Divider, Badge, ActionIcon} from '@mantine/core';
import {
    IconWifi, IconWifiOff, IconShoe, IconUsb, IconPlugConnectedX,
    IconPower, IconInfinity, IconRepeat, IconHandGrab, IconFlask
} from '@tabler/icons-react';
import { useControllerStore } from '../../store/useControllerStore';
import { socket } from '../../services/socketService';
import {useDisclosure} from "@mantine/hooks";
import {RndModal} from "../modals/RndModal.tsx";

/**
 * PWM değerini (0-255) yaklaşık RPM değerine çeviren yardımcı fonksiyon.
 * @param pwm - 0 ile 255 arasında bir PWM değeri.
 * @returns {number} Yaklaşık RPM değeri.
 */
const pwmToRpm = (pwm: number) => Math.round((pwm / 255) * 18000);

/**
 * Uygulamanın en altında yer alan ve anlık durum bilgilerini gösteren bileşen.
 * Sunucu ve cihaz bağlantısı, motor durumu, çalışma modu ve pedal durumu gibi
 * kritik bilgileri tek bir bakışta kullanıcıya sunar.
 * @returns {JSX.Element} Durum çubuğu JSX'i.
 */
export function StatusBar() {
    // Gerekli tüm anlık durumları `useControllerStore` hook'u ile store'dan çekiyoruz.
    // Bu hook sayesinde, store'daki bu değerler her değiştiğinde bileşen otomatik
    // olarak yeniden render edilir.
    const {
        connectionStatus,
        arduinoStatus,
        motor,
        operatingMode,
        oscillationSettings,
        ftswMode
    } = useControllerStore();

    // Pedal basılma durumu, anlık bir olay olduğu için store'da tutmak yerine
    // bu bileşenin kendi içinde bir state olarak yönetilir.
    const [isPedalPressed, setIsPedalPressed] = useState(false);

    const [rndModalOpened, { open: openRndModal, close: closeRndModal }] = useDisclosure(false);


    // Bu useEffect, bileşen ilk render edildiğinde çalışır ve 'arduino_event'
    // olayını dinlemeye başlar.
    useEffect(() => {
        // Arduino'dan PEDAL olayı geldiğinde çalışacak olan fonksiyon.
        const onArduinoEvent = (data: { type: 'PEDAL' | 'FTSW', state: 0 | 1 }) => {
            if (data.type === 'PEDAL') {
                // Gelen state 1 ise (basıldı) true, 0 ise (bırakıldı) false yap.
                setIsPedalPressed(data.state === 1);
            }
        };

        socket.on('arduino_event', onArduinoEvent);

        // Cleanup fonksiyonu: Bileşen ekrandan kaldırıldığında (unmount)
        // bu olay dinleyicisini kaldırır. Bu, hafıza sızıntılarını önler.
        return () => {
            socket.off('arduino_event', onArduinoEvent);
        };
    }, []); // Boş bağımlılık dizisi, bu etkinin sadece bir kez çalışmasını sağlar.





    return (
        <>
            <RndModal opened={rndModalOpened} onClose={closeRndModal} />

            <Paper withBorder p="xs" radius="md">
                <Group justify="space-between" wrap="nowrap">
                    {/* Sol Taraf: Bağlantı Durumları */}
                    <Group gap="xs">
                        <Group gap={5} align="center">
                            {connectionStatus === 'connected' ? <IconWifi size={20} color="green" /> : <IconWifiOff size={20} color="red" />}
                            <Text size="sm">Sunucu</Text>
                        </Group>
                        <Divider orientation="vertical" />
                        <Group gap={5} align="center">
                            {arduinoStatus === 'connected' ? <IconUsb size={20} color="green" /> : <IconPlugConnectedX size={20} color="red" />}
                            <Text size="sm">Cihaz</Text>
                        </Group>
                    </Group>

                    {/* Orta Taraf: Anlık Cihaz Bilgileri */}
                    <Group gap="xs">
                        <Badge color={motor.isActive ? 'green' : 'gray'} leftSection={<IconPower size={14} />}>
                            {motor.isActive ? `${pwmToRpm(motor.pwm)} RPM` : 'DURUYOR'}
                        </Badge>

                        <Badge
                            variant="light"
                            color="cyan"
                            leftSection={operatingMode === 'continuous' ? <IconInfinity size={14} /> : <IconRepeat size={14} />}
                        >
                            {operatingMode === 'continuous' ? 'Sürekli Mod' : `Osilasyon: ${oscillationSettings.angle}°`}
                        </Badge>
                    </Group>

                    {/* Sağ Taraf: Kontrol Modu ve Pedal Durumu */}
                    <Group gap="xs">

                        {/* YENİ: Ar-Ge Modal'ını açacak buton */}
                        <ActionIcon variant="outline" onClick={openRndModal} title="Ar-Ge Test Paneli">
                            <IconFlask size={18} />
                        </ActionIcon>
                        <Divider orientation="vertical" />
                        <Badge
                            variant="outline"
                            color="gray"
                            leftSection={ftswMode === 'foot' ? <IconShoe size={14} /> : <IconHandGrab size={14} />}
                        >
                            {ftswMode === 'foot' ? 'Ayak Kontrol' : 'El Kontrol'}
                        </Badge>
                        {/* `isPedalPressed` true ise, "Pedal Aktif" rozetini göster */}
                        {isPedalPressed && (
                            <Badge variant="filled" color="blue">
                                Pedal Aktif
                            </Badge>
                        )}
                    </Group>
                </Group>
            </Paper>
        </>
    );
}