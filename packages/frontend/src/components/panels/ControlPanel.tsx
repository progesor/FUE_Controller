// packages/frontend/src/components/panels/ControlPanel.tsx

import { Paper, Title, Stack, Text, Group, ActionIcon, Button, SegmentedControl, Center, Box } from '@mantine/core';
import { IconArrowBackUp, IconArrowForwardUp, IconMinus, IconPlayerPlay, IconPlayerStop, IconPlus } from '@tabler/icons-react';
import { useControllerStore } from '../../store/useControllerStore';
import { sendMotorPwm, sendStopMotor, sendMotorDirection, sendStartMotor } from '../../services/socketService';
import type {MotorDirection} from "../../../../shared-types";

// PWM'i RPM'e çeviren yardımcı fonksiyon
const pwmToRpm = (pwm: number) => Math.round((pwm / 255) * 18000);

export function ControlPanel() {
    // Store'dan sadece verileri okuyoruz. Butonlar doğrudan servis fonksiyonlarını çağıracak.
    const { motorStatus, setMotorStatus } = useControllerStore();

    const handlePwmChange = (delta: number) => {
        const newPwm = Math.max(0, Math.min(255, motorStatus.pwm + delta));
        // Sadece store'daki hedef PWM'i güncelle. Motor aktifse, yeni değeri gönder.
        setMotorStatus({ pwm: newPwm });
        if (motorStatus.isActive) {
            sendMotorPwm(newPwm);
        }
    };

    const handleDirectionChange = (direction: MotorDirection) => {
        // Yön değişikliği anında gönderilir. Store güncellemesi backend'den gelecek.
        sendMotorDirection(direction);
    };

    // Bu fonksiyon artık çok daha basit. Sadece doğru komutu gönderiyor.
    const toggleMotorActive = () => {
        if (motorStatus.isActive) {
            sendStopMotor();
        } else {
            sendStartMotor();
        }
    };

    return (
        <Paper withBorder p="md" h="100%">
            <Stack justify="space-between" h="100%">
                <Title order={3} mb="md">Kontrol Paneli</Title>

                <Stack gap="xl">
                    {/* Hız Kontrolü */}
                    <Stack gap="xs">
                        <Text fw={500}>Motor Hızı (RPM)</Text>
                        <Group justify="center">
                            <ActionIcon variant="default" size="xl" onClick={() => handlePwmChange(-5)}>
                                <IconMinus />
                            </ActionIcon>
                            <Text w={100} ta="center" fz={24} fw={600}>
                                {pwmToRpm(motorStatus.pwm)}
                            </Text>
                            <ActionIcon variant="default" size="xl" onClick={() => handlePwmChange(5)}>
                                <IconPlus />
                            </ActionIcon>
                        </Group>
                    </Stack>

                    {/* Yön Kontrolü */}
                    <Stack gap="xs">
                        <Text fw={500}>Dönüş Yönü</Text>
                        <SegmentedControl
                            fullWidth
                            size="md"
                            value={motorStatus.direction.toString()}
                            onChange={(value) => handleDirectionChange(parseInt(value) as MotorDirection)}
                            data={[
                                { label: (<Center><IconArrowBackUp size={16} /><Box ml={10}>CCW</Box></Center>), value: '1' },
                                { label: (<Center><IconArrowForwardUp size={16} /><Box ml={10}>CW</Box></Center>), value: '0' },
                            ]}
                        />
                    </Stack>
                </Stack>

                {/* Başlat / Durdur Butonu */}
                <Button
                    fullWidth
                    size="lg"
                    color={motorStatus.isActive ? 'red' : 'green'}
                    leftSection={motorStatus.isActive ? <IconPlayerStop /> : <IconPlayerPlay />}
                    onClick={toggleMotorActive}
                >
                    {motorStatus.isActive ? 'DURDUR' : 'BAŞLAT'}
                </Button>
            </Stack>
        </Paper>
    );
}