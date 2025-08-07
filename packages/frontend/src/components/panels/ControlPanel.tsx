// packages/frontend/src/components/panels/ControlPanel.tsx (DÜZELTİLMİŞ NİHAİ HALİ)

import { Paper, Title, Stack, Text, SegmentedControl, Center, Box, Slider, Button } from '@mantine/core';
import { IconArrowBackUp, IconArrowForwardUp, IconPlayerPlay, IconPlayerStop } from '@tabler/icons-react';
import { useControllerStore } from '../../store/useControllerStore';
import {
    sendMotorPwm,
    sendStopMotor,
    sendMotorDirection,
    sendStartMotor,
    sendOperatingMode,
    sendRecipeStop,
    sendRecipeStart,
    sendActiveRecipe
} from '../../services/socketService';
import { RPM_CALIBRATION_MARKS } from '../../config/calibration';
import type { MotorDirection, OperatingMode } from "../../../../shared-types";
import { NotificationService } from "../../services/notificationService.tsx";
import { useEffect, useState } from "react";

const pwmToClosestRpm = (pwm: number): number => {
    if (pwm === 0) return 0;
    const closestMark = RPM_CALIBRATION_MARKS.reduce((prev, curr) =>
        Math.abs(curr.pwm - pwm) < Math.abs(prev.pwm - pwm) ? curr : prev
    );
    return closestMark.rpm;
};

export function ControlPanel() {
    // DÜZELTME: Eksik olan 'setActiveRecipe' eklendi
    const { motor, operatingMode, activeRecipe, setOperatingMode, setActiveRecipe } = useControllerStore();

    // Arayüzdeki seçimi tutmak için yerel state
    const [uiMode, setUiMode] = useState<OperatingMode | 'recipe'>(operatingMode);

    useEffect(() => {
        // Reçete aktif değilse, UI modunu donanım moduyla eşitle
        if (!activeRecipe) {
            setUiMode(operatingMode);
        } else {
            // Reçete aktifse, UI modunu 'recipe' yap
            setUiMode('recipe');
        }
    }, [operatingMode, activeRecipe]);

    const handleSliderChange = (markIndex: number) => {
        const selectedMark = RPM_CALIBRATION_MARKS[markIndex];
        if (!selectedMark) return;
        sendMotorPwm(selectedMark.pwm);
    };

    const handleDirectionChange = (direction: MotorDirection) => {
        sendMotorDirection(direction);
    };

    const handleModeChange = (mode: OperatingMode | 'recipe') => {
        setUiMode(mode); // Arayüz seçimini güncelle

        if (mode !== 'recipe') {
            // Manuel moda geçildiğinde aktif reçeteyi temizle
            setActiveRecipe(null);
            sendActiveRecipe(null);
            // Donanımın modunu güncelle
            setOperatingMode(mode);
            sendOperatingMode(mode);
        }
    };

    const toggleMotorActive = () => {
        if (motor.isActive) {
            sendStopMotor();
            sendRecipeStop();
        } else {
            if (uiMode === 'recipe') {
                if (activeRecipe) {
                    sendRecipeStart(activeRecipe);
                } else {
                    NotificationService.showError('Çalıştırılacak aktif bir reçete bulunamadı.');
                }
            } else {
                sendStartMotor();
            }
        }
    };

    const findClosestMarkIndex = (pwm: number): number => {
        const closestMark = RPM_CALIBRATION_MARKS.reduce((prev, curr) =>
            Math.abs(curr.pwm - pwm) < Math.abs(prev.pwm - pwm) ? curr : prev
        );
        return RPM_CALIBRATION_MARKS.indexOf(closestMark);
    };

    const currentMarkIndex = findClosestMarkIndex(motor.pwm);

    return (
        <Paper withBorder p="md" h="100%">
            <Stack justify="space-between" h="100%">
                <Title order={3} mb="md">Kontrol Paneli</Title>

                <Stack gap="xl">
                    {/* Motor Hızı Slider'ı */}
                    <Stack gap="xs">
                        <Text fw={500}>Motor Hızı</Text>
                        <Text fz={32} fw={700}>{pwmToClosestRpm(motor.pwm)} RPM</Text>
                        <Slider
                            value={currentMarkIndex}
                            onChangeEnd={handleSliderChange}
                            min={0}
                            max={RPM_CALIBRATION_MARKS.length - 1}
                            step={1}
                            label={null}
                            marks={RPM_CALIBRATION_MARKS.map((mark, index) => ({ value: index, label: `${mark.rpm}` }))}
                            mb={40}
                        />
                    </Stack>

                    {/* Dönüş Yönü Seçimi */}
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

                    {/* Çalışma Modu Seçimi */}
                    <Stack gap="xs">
                        <Text fw={500}>Çalışma Modu</Text>
                        <SegmentedControl
                            fullWidth
                            size="md"
                            // DÜZELTME: Değer artık 'uiMode' state'ine bağlı
                            value={uiMode}
                            onChange={(value) => handleModeChange(value as OperatingMode | 'recipe')}
                            data={[
                                { label: 'Sürekli', value: 'continuous' },
                                { label: 'Osilasyon', value: 'oscillation' },
                                { label: 'Darbe', value: 'pulse' },
                                { label: 'Titreşim', value: 'vibration' },
                                { label: 'Reçete', value: 'recipe' },
                            ]}
                        />
                    </Stack>
                </Stack>

                {/* Ana Başlat/Durdur Butonu */}
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