// packages/frontend/src/components/panels/ControlPanel.tsx

import { Paper, Title, Stack, Text, Group, ActionIcon, Button, SegmentedControl } from '@mantine/core';
import { IconArrowBackUp, IconArrowForwardUp, IconMinus, IconPlayerPlay, IconPlayerStop, IconPlus } from '@tabler/icons-react';
import { useControllerStore } from '../../store/useControllerStore';
import { sendMotorPwm, sendStopMotor, sendMotorDirection } from '../../services/socketService';

export function ControlPanel() {
    // Store'dan motorun anlık durumunu ve durumunu değiştirecek fonksiyonu alıyoruz
    const { motorStatus, setMotorStatus } = useControllerStore();

    const handlePwmChange = (delta: number) => {
        const newPwm = Math.max(0, Math.min(255, motorStatus.pwm + delta));
        setMotorStatus({ pwm: newPwm });

        // Eğer motor zaten aktifse, yeni hızı anında gönder
        if (motorStatus.isActive) {
            sendMotorPwm(newPwm);
        }
    };

    const handleDirectionChange = (direction: MotorDirection) => {
        setMotorStatus({ direction });
        sendMotorDirection(direction);
    };

    const toggleMotorActive = () => {
        const newIsActive = !motorStatus.isActive;
        setMotorStatus({ isActive: newIsActive });

        if (newIsActive) {
            // Motoru başlatırken mevcut PWM değeriyle başlat
            sendMotorPwm(motorStatus.pwm);
        } else {
            // Motoru durdur
            sendStopMotor();
        }
    };

    // PWM'i RPM'e çeviren yardımcı fonksiyon
    const pwmToRpm = (pwm: number) => Math.round((pwm / 255) * 18000);

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
                                { label: (
                                        <Center>
                                            <IconArrowBackUp size={16} />
                                            <Box ml={10}>CCW</Box>
                                        </Center>
                                    ), value: '0' },
                                { label: (
                                        <Center>
                                            <IconArrowForwardUp size={16} />
                                            <Box ml={10}>CW</Box>
                                        </Center>
                                    ), value: '1' },
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

// SegmentedControl içinde ikonları ve metni hizalamak için
// bu bileşenleri de import etmemiz gerekiyor.
import { Center, Box } from '@mantine/core';
import React from 'react';
import type {MotorDirection} from "../../../../shared-types";