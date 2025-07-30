import { Paper, Title, Stack, Text, SegmentedControl, Center, Box, Slider, Button } from '@mantine/core';
import { IconArrowBackUp, IconArrowForwardUp, IconPlayerPlay, IconPlayerStop } from '@tabler/icons-react';
import { useControllerStore, type OperatingMode } from '../../store/useControllerStore';
import {
    sendMotorPwm,
    sendStopMotor,
    sendMotorDirection,
    sendStartMotor,
    sendStartOscillation,
    sendOperatingMode // Yeni servis fonksiyonu
} from '../../services/socketService';
import { RPM_CALIBRATION_MARKS } from '../../config/calibration';
import type {MotorDirection} from "../../../../shared-types";

// PWM'den en yakın kalibre edilmiş RPM değerini bulan fonksiyon
const pwmToClosestRpm = (pwm: number) => {
    const closestMark = RPM_CALIBRATION_MARKS.reduce((prev, curr) =>
        Math.abs(curr.pwm - pwm) < Math.abs(prev.pwm - pwm) ? curr : prev
    );
    return closestMark.rpm;
};

export function ControlPanel() {
    const { motorStatus, operatingMode, oscillationSettings, setMotorStatus } = useControllerStore();

    const handleSliderChange = (markIndex: number) => {
        const selectedMark = RPM_CALIBRATION_MARKS[markIndex];
        if (!selectedMark) return;
        setMotorStatus({ pwm: selectedMark.pwm });
        sendMotorPwm(selectedMark.pwm);
    };

    const handleDirectionChange = (direction: MotorDirection) => {
        sendMotorDirection(direction);
    };

    const handleModeChange = (mode: OperatingMode) => {
        // Mod değişikliğini anında backend'e bildir
        sendOperatingMode(mode);
    };

    const toggleMotorActive = () => {
        if (motorStatus.isActive) {
            sendStopMotor();
        } else {
            const currentRpm = pwmToClosestRpm(motorStatus.pwm);
            if (operatingMode === 'continuous') {
                sendStartMotor();
            } else {
                sendStartOscillation({
                    pwm: motorStatus.pwm,
                    angle: oscillationSettings.angle,
                    rpm: currentRpm
                });
            }
        }
    };

    const findClosestMarkIndex = (pwm: number) => {
        const closestMark = RPM_CALIBRATION_MARKS.reduce((prev, curr) =>
            Math.abs(curr.pwm - pwm) < Math.abs(prev.pwm - pwm) ? curr : prev
        );
        return RPM_CALIBRATION_MARKS.indexOf(closestMark);
    }

    const currentMarkIndex = findClosestMarkIndex(motorStatus.pwm);

    return (
        <Paper withBorder p="md" h="100%">
            <Stack justify="space-between" h="100%">
                <Title order={3} mb="md">Kontrol Paneli</Title>
                <Stack gap="xl">
                    <Stack gap="xs">
                        <Text fw={500}>Motor Hızı</Text>
                        <Text fz={32} fw={700}>{pwmToClosestRpm(motorStatus.pwm)} RPM</Text>
                        <Slider
                            value={currentMarkIndex !== -1 ? currentMarkIndex : 0}
                            onChange={handleSliderChange}
                            min={0}
                            max={RPM_CALIBRATION_MARKS.length - 1}
                            step={1}
                            label={null}
                            marks={RPM_CALIBRATION_MARKS.map((mark, index) => ({ value: index, label: `${mark.rpm}` }))}
                            mb={40}
                        />
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
                            onChange={(value) => handleModeChange(value as OperatingMode)}
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