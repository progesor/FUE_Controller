// packages/frontend/src/components/modals/RndModal.tsx

import { useState, useRef } from 'react';
import { Modal, Title, Stack, Text, Slider, Button, Group, NumberInput, Divider, Box } from '@mantine/core';
import { socket } from '../../services/socketService';
import { useControllerStore } from '../../store/useControllerStore';
import type { MotorDirection } from '../../../../shared-types';

interface RndModalProps {
    opened: boolean;
    onClose: () => void;
}

export function RndModal({ opened, onClose }: RndModalProps) {
    const { addConsoleEntry } = useControllerStore.getState();
    const oscillationInterval = useRef<NodeJS.Timeout | null>(null);

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

    // Fonksiyonlar
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

    const toggleLiveOscillation = () => {
        if (isLiveOscRunning) {
            if (oscillationInterval.current) {
                clearInterval(oscillationInterval.current);
                oscillationInterval.current = null;
            }
            sendRawCommand('DEV.MOTOR.STOP');
            setIsLiveOscRunning(false);
        } else {
            setIsLiveOscRunning(true);
            let direction: MotorDirection = 0;
            const performStep = () => {
                sendRawCommand(`DEV.MOTOR.SET_DIR:${direction}`);
                sendRawCommand(`DEV.MOTOR.EXEC_TIMED_RUN:${liveOscPwm}|${liveOscDuration}`);
                direction = direction === 0 ? 1 : 0;
            };
            performStep();
            oscillationInterval.current = setInterval(performStep, liveOscDuration + liveOscDelay);
        }
    };

    const handleClose = () => {
        if (isLiveOscRunning) {
            toggleLiveOscillation();
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
            scrollAreaProps={{ type: 'auto' }}
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
                        <Button mt="md" fullWidth onClick={toggleLiveOscillation} color={isLiveOscRunning ? 'red' : 'blue'}>
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