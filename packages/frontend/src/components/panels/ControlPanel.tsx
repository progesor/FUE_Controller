import { Paper, Title, Stack, Text, Group, ActionIcon, Button, SegmentedControl, Center, Box } from '@mantine/core';
import { IconArrowBackUp, IconArrowForwardUp, IconMinus, IconPlayerPlay, IconPlayerStop, IconPlus } from '@tabler/icons-react';
import {type OperatingMode, useControllerStore} from '../../store/useControllerStore';
import { sendMotorPwm, sendStopMotor, sendMotorDirection, sendStartMotor } from '../../services/socketService';
import type {MotorDirection} from "../../../../shared-types";

const pwmToRpm = (pwm: number) => Math.round((pwm / 255) * 18000);

export function ControlPanel() {
    const { motorStatus, operatingMode, setOperatingMode } = useControllerStore();

    const handlePwmChange = (delta: number) => {
        const newPwm = Math.max(0, Math.min(255, motorStatus.pwm + delta));
        // Yeni hedef hızı koşulsuz olarak backend'e gönder.
        // Arayüzün güncellemesi, backend'den gelecek olan 'motor_status_update' ile olacak.
        sendMotorPwm(newPwm);
    };

    const handleDirectionChange = (direction: MotorDirection) => {
        sendMotorDirection(direction);
    };

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
                    <Stack gap="xs">
                        <Text fw={500}>Çalışma Modu</Text>
                        <SegmentedControl
                            fullWidth
                            size="md"
                            value={operatingMode}
                            onChange={(value) => setOperatingMode(value as OperatingMode)}
                            data={[
                                { label: 'Sürekli', value: 'continuous' },
                                { label: 'Osilasyon', value: 'oscillation' },
                            ]}
                        />
                    </Stack>
                </Stack>
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