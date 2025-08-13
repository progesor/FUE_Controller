// packages/frontend/src/components/modals/RndModal.tsx

import {useState, useRef, useEffect} from 'react';
import {Modal, Title, Stack, Text, Slider, Button, Group, NumberInput, Divider, Box, Select} from '@mantine/core';
import { socket } from '../../services/socketService.ts';
import { useControllerStore } from '../../store/useControllerStore.ts';
import type { MotorDirection } from '../../../../shared-types';
import {RPM_CALIBRATION_MARKS, VALID_ANGLES} from "../../config/calibration.ts";

interface RndModalProps {
    opened: boolean;
    onClose: () => void;
}

export function RndModal({ opened, onClose }: RndModalProps) {
    const { addConsoleEntry } = useControllerStore.getState();
    const oscillationInterval = useRef<NodeJS.Timeout | null>(null);
    let oscillationDirection: MotorDirection = 0;


    // State'ler
    const [rawPwm, setRawPwm] = useState<number>(0);
    const [timedPwm, setTimedPwm] = useState<number>(100);
    const [timedDuration, setTimedDuration] = useState<number>(50);
    const [beepDuration, setBeepDuration] = useState<number>(100);
    const [beepFreq, setBeepFreq] = useState<number>(1000);
    const [stepPwm, setStepPwm] = useState<number>(100);
    const [stepDuration, setStepDuration] = useState<number>(90);
    const [liveOscPwm, setLiveOscPwm] = useState<number>(100);
    const [liveOscDuration, setLiveOscDuration] = useState<number>(90);
    const [liveOscDelay, setLiveOscDelay] = useState<number>(50);
    const [isLiveOscRunning, setIsLiveOscRunning] = useState<boolean>(false);
    const [selectedRpm, setSelectedRpm] = useState<string | null>(null);
    const [selectedAngle, setSelectedAngle] = useState<string | null>(null);


    // Fonksiyonlar

    useEffect(() => {
        // Backend'den gelen kalibrasyon verisi cevabını dinle
        const onCalibrationData = (data: { pwm: number; duration: number }) => {
            addConsoleEntry({
                type: 'event',
                source: 'backend',
                message: 'Kalibrasyon verisi alındı',
                data: [data],
            });
            // Input'ları gelen veriyle doldur
            setStepPwm(data.pwm);
            setStepDuration(data.duration);
        };

        socket.on('calibration_data_response', onCalibrationData);

        // Bileşen kaldırıldığında dinleyiciyi temizle
        return () => {
            socket.off('calibration_data_response', onCalibrationData);
        };
    }, [addConsoleEntry]);

    // Seçim menülerinden biri değiştiğinde backend'e istek gönder
    useEffect(() => {
        if (selectedRpm && selectedAngle) {
            socket.emit('get_calibration_data', {
                rpm: Number(selectedRpm),
                angle: Number(selectedAngle),
            });
        }
    }, [selectedRpm, selectedAngle]);

    const sendRawCommand = (command: string) => {
        addConsoleEntry({
            type: 'command',
            source: 'frontend',
            message: `Komut gönderildi: ${command}`,
        });
        socket.emit('send_raw_command', command);
    };

    const handleSingleStep = (direction: MotorDirection) => {
        sendRawCommand(`DEV.MOTOR.SET_DIR:${direction}`);
        sendRawCommand(`DEV.MOTOR.EXEC_TIMED_RUN:${stepPwm}|${stepDuration}`);
    };

    const startLiveOscillation = () => {
        if (oscillationInterval.current) {
            clearInterval(oscillationInterval.current);
        }

        const performStep = () => {
            sendRawCommand(`DEV.MOTOR.SET_DIR:${oscillationDirection}`);
            sendRawCommand(`DEV.MOTOR.EXEC_TIMED_RUN:${liveOscPwm}|${liveOscDuration}`);
            oscillationDirection = oscillationDirection === 0 ? 1 : 0;
        };

        performStep(); // İlk adımı hemen at
        oscillationInterval.current = setInterval(performStep, liveOscDuration + liveOscDelay);
    };

    const stopLiveOscillation = () => {
        if (oscillationInterval.current) {
            clearInterval(oscillationInterval.current);
            oscillationInterval.current = null;
        }
        sendRawCommand('DEV.MOTOR.STOP');
    };

    // Canlı test çalışırken parametreler değişirse, interval'i yeniden başlat
    useEffect(() => {
        if (isLiveOscRunning) {
            startLiveOscillation();
        }
        // Bu effect'in cleanup'ı, bileşen unmount olduğunda interval'i temizler
        return () => {
            if (oscillationInterval.current) {
                clearInterval(oscillationInterval.current);
            }
        };
    }, [isLiveOscRunning, liveOscPwm, liveOscDuration, liveOscDelay]);

    const handleToggleLiveOscillation = () => {
        const nextState = !isLiveOscRunning;
        setIsLiveOscRunning(nextState);
        if (!nextState) {
            stopLiveOscillation();
        }
    };

    const handleClose = () => {
        if (isLiveOscRunning) {
            handleToggleLiveOscillation();
        }
        onClose();
    };

    return (
        <Modal
            opened={opened}
            onClose={handleClose}
            title="Ar-Ge Test Paneli"
            size="xl" // Modal boyutunu artırdık
            centered
            // scrollAreaProps={{ type: 'auto' }}
        >
            <Box px="md"> {/* Yatayda padding ekledik */}
                <Text size="xs" c="dimmed" mt={-10} mb="md">
                    Bu panel, Arduino'ya doğrudan ham komutlar gönderir.
                </Text>
                <Stack gap="lg"> {/* Dikey boşluğu artırdık */}
                    <Box>
                        <Title order={5}>Osilasyon Adım Simülatörü</Title>
                        <Text size="xs" c="dimmed">Kalibrasyon için tek bir osilasyon adımını test edin.</Text>
                        <Group grow mt="sm">
                            <Select
                                label="Kalibrasyon Kısayolu (RPM)"
                                placeholder="Bir RPM değeri seçin"
                                data={RPM_CALIBRATION_MARKS.map(mark => ({ value: mark.rpm.toString(), label: `${mark.rpm} RPM` }))}
                                value={selectedRpm}
                                onChange={setSelectedRpm}
                                clearable
                            />
                            <Select
                                label="Kalibrasyon Kısayolu (Açı)"
                                placeholder="Bir açı değeri seçin"
                                data={VALID_ANGLES.map(angle => ({ value: angle.toString(), label: `${angle}°` }))}
                                value={selectedAngle}
                                onChange={setSelectedAngle}
                                clearable
                            />
                        </Group>
                        <Group grow mt="sm">
                            <NumberInput label="PWM Değeri" value={stepPwm} onChange={(v) => setStepPwm(Number(v) || 0)} min={0} max={255}/>
                            <NumberInput label="Süre (ms)" value={stepDuration} onChange={(v) => setStepDuration(Number(v) || 0)} min={10} max={5000}/>
                        </Group>
                        <Group grow mt="md">
                            <Button onClick={() => handleSingleStep(0)} variant="outline">Tek Adım CW</Button>
                            <Button onClick={() => handleSingleStep(1)} variant="outline">Tek Adım CCW</Button>
                        </Group>
                    </Box>
                    <Divider />
                    <Box>
                        <Title order={5}>Canlı Osilasyon Test Aracı</Title>
                        <Text size="xs" c="dimmed">Sürekli osilasyon döngüsünü test edin.</Text>
                        <Group grow mt="sm">
                            <NumberInput label="PWM" value={liveOscPwm} onChange={(v) => setLiveOscPwm(Number(v) || 0)} min={0} max={255}/>
                            <NumberInput label="Adım Süresi (ms)" value={liveOscDuration} onChange={(v) => setLiveOscDuration(Number(v) || 0)} min={10} max={5000}/>
                            <NumberInput label="Bekleme (ms)" value={liveOscDelay} onChange={(v) => setLiveOscDelay(Number(v) || 0)} min={0} max={1000}/>
                        </Group>
                        <Button mt="md" fullWidth onClick={handleToggleLiveOscillation} color={isLiveOscRunning ? 'red' : 'blue'}>
                            {isLiveOscRunning ? 'CANLI OSİLASYONU DURDUR' : 'CANLI OSİLASYONU BAŞLAT'}
                        </Button>
                    </Box>
                    <Divider />
                    <Stack>
                        <Title order={5}>Diğer Test Araçları</Title>
                        <Box mb="xl">
                            <Text fw={500}>Anlık PWM Kontrolü</Text>
                            <Group grow align="flex-end">
                                <Slider
                                    value={rawPwm}
                                    onChange={setRawPwm}
                                    onChangeEnd={(value) => sendRawCommand(`DEV.MOTOR.SET_PWM:${value}`)}
                                    min={0}
                                    max={255}
                                    step={1}
                                    label={(value) => value}
                                />
                                <Button onClick={() => sendRawCommand('DEV.MOTOR.STOP')} color="red" variant='outline'>
                                    STOP
                                </Button>
                            </Group>
                        </Box>
                        <Box mb="xl">
                            <Text fw={500} mb="xs">Zamanlı Çalıştırma</Text>
                            <Group grow>
                                <NumberInput label="PWM" value={timedPwm} onChange={(v) => setTimedPwm(Number(v) || 0)} min={0} max={255} />
                                <NumberInput label="Süre (ms)" value={timedDuration} onChange={(v) => setTimedDuration(Number(v) || 0)} min={10} max={5000} />
                            </Group>
                            <Button mt="md" fullWidth onClick={() => sendRawCommand(`DEV.MOTOR.EXEC_TIMED_RUN:${timedPwm}|${timedDuration}`)}>
                                Çalıştır
                            </Button>
                        </Box>
                        <Box>
                            <Text fw={500} mb="xs">Buzzer Testi</Text>
                            <Group grow>
                                <NumberInput label="Süre (ms)" value={beepDuration} onChange={(v) => setBeepDuration(Number(v) || 0)} min={10} max={2000} />
                                <NumberInput label="Frekans (Hz)" value={beepFreq} onChange={(v) => setBeepFreq(Number(v) || 0)} min={100} max={5000} />
                            </Group>
                            <Button mt="md" fullWidth onClick={() => sendRawCommand(`DEV.BUZZER.BEEP:${beepDuration}|${beepFreq}`)} variant="outline">
                                Bip Sesi Çal
                            </Button>
                        </Box>
                    </Stack>
                </Stack>
            </Box>
        </Modal>
    );
}