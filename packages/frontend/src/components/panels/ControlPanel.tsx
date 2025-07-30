// packages/frontend/src/components/panels/ControlPanel.tsx

import { Paper, Title, Stack, Text, SegmentedControl, Center, Box, Slider, Button } from '@mantine/core';
import { IconArrowBackUp, IconArrowForwardUp, IconPlayerPlay, IconPlayerStop } from '@tabler/icons-react';
import { useControllerStore } from '../../store/useControllerStore';
import { sendMotorPwm, sendStopMotor, sendMotorDirection, sendStartMotor, sendStartOscillation, sendOperatingMode } from '../../services/socketService';

import { RPM_CALIBRATION_MARKS } from '../../config/calibration';
import type {MotorDirection, OperatingMode} from "../../../../shared-types";

const pwmToClosestRpm = (pwm: number) => {
    const closestMark = RPM_CALIBRATION_MARKS.reduce((prev, curr) =>
        Math.abs(curr.pwm - pwm) < Math.abs(prev.pwm - pwm) ? curr : prev
    );
    return closestMark.rpm;
};

export function ControlPanel() {
    // --- DEĞİŞİKLİK: 'motor' olarak okuyoruz ---
    const { motor, operatingMode, oscillationSettings, setMotorStatus, setOperatingMode } = useControllerStore();

    const handleSliderChange = (markIndex: number) => {
        const selectedMark = RPM_CALIBRATION_MARKS[markIndex];
        if (!selectedMark) return;
        setMotorStatus({ pwm: selectedMark.pwm }); // Yerel durumu anında güncelle
        sendMotorPwm(selectedMark.pwm); // Backend'e bildir
    };

    const handleDirectionChange = (direction: MotorDirection) => {
        sendMotorDirection(direction);
    };

    const handleModeChange = (mode: OperatingMode) => {
        setOperatingMode(mode); // Yerel durumu anında güncelle
        sendOperatingMode(mode); // Backend'e bildir
    };

    const toggleMotorActive = () => {
        if (motor.isActive) {
            sendStopMotor();
        } else {
            const currentRpm = pwmToClosestRpm(motor.pwm);
            if (operatingMode === 'continuous') {
                sendStartMotor();
            } else {
                sendStartOscillation({
                    pwm: motor.pwm,
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

    const currentMarkIndex = findClosestMarkIndex(motor.pwm);

    return (
        <Paper withBorder p="md" h="100%">
            <Stack justify="space-between" h="100%">
                <Title order={3} mb="md">Kontrol Paneli</Title>
                <Stack gap="xl">
                    <Stack gap="xs">
                        <Text fw={500}>Motor Hızı</Text>
                        <Text fz={32} fw={700}>{pwmToClosestRpm(motor.pwm)} RPM</Text>
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
                            value={motor.direction.toString()}
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
                    color={motor.isActive ? 'red' : 'green'}
                    leftSection={motor.isActive ? <IconPlayerStop /> : <IconPlayerPlay />}
                    onClick={toggleMotorActive}
                >
                    {motor.isActive ? 'DURDUR' : 'BAŞLAT'}
                </Button>
            </Stack>
        </Paper>
    );
}