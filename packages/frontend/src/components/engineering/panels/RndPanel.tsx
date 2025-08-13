// packages/frontend/src/components/panels/RndPanel.tsx

import { useState, useRef } from 'react';
import { Paper, Title, Stack, Text, Slider, Button, Group, NumberInput, Divider, Box } from '@mantine/core';
import { socket } from '../../../services/socketService.ts';
import { useControllerStore } from '../../../store/useControllerStore.ts';
import type { MotorDirection } from '../../../../../shared-types';

/**
 * Teknisyenlerin ve geliştiricilerin ham Arduino komutları göndererek
 * donanımı test etmelerini sağlayan Ar-Ge (Araştırma-Geliştirme) paneli.
 */
export function RndPanel() {
    const { addConsoleEntry } = useControllerStore.getState();
    const oscillationInterval = useRef<NodeJS.Timeout | null>(null);

    // --- State'ler ---
    // Anlık PWM
    const [rawPwm, setRawPwm] = useState<number>(0);
    // Zamanlı Çalıştırma
    const [timedPwm, setTimedPwm] = useState<number>(100);
    const [timedDuration, setTimedDuration] = useState<number>(50);
    // Buzzer
    const [beepDuration, setBeepDuration] = useState<number>(100);
    const [beepFreq, setBeepFreq] = useState<number>(1000);
    // Osilasyon Adım Simülatörü
    const [stepPwm, setStepPwm] = useState<number>(100);
    const [stepDuration, setStepDuration] = useState<number>(90);
    // Canlı Osilasyon Testi
    const [liveOscPwm, setLiveOscPwm] = useState<number>(100);
    const [liveOscDuration, setLiveOscDuration] = useState<number>(90);
    const [liveOscDelay, setLiveOscDelay] = useState<number>(50);
    const [isLiveOscRunning, setIsLiveOscRunning] = useState<boolean>(false);

    // --- Fonksiyonlar ---
    const sendRawCommand = (command: string) => {
        addConsoleEntry({
            type: 'command',
            source: 'frontend',
            message: `[Ar-Ge] Ham komut gönderildi: ${command}`,
        });
        socket.emit('send_raw_command', command);
    };

    const handleSingleStep = (direction: MotorDirection) => {
        sendRawCommand(`DEV.MOTOR.SET_DIR:${direction}`);
        sendRawCommand(`DEV.MOTOR.EXEC_TIMED_RUN:${stepPwm}|${stepDuration}`);
    };

    const toggleLiveOscillation = () => {
        if (isLiveOscRunning) {
            // Osilasyonu Durdur
            if (oscillationInterval.current) {
                clearInterval(oscillationInterval.current);
                oscillationInterval.current = null;
            }
            sendRawCommand('DEV.MOTOR.STOP');
            setIsLiveOscRunning(false);
        } else {
            // Osilasyonu Başlat
            setIsLiveOscRunning(true);
            let direction: MotorDirection = 0;

            const performStep = () => {
                sendRawCommand(`DEV.MOTOR.SET_DIR:${direction}`);
                sendRawCommand(`DEV.MOTOR.EXEC_TIMED_RUN:${liveOscPwm}|${liveOscDuration}`);
                direction = direction === 0 ? 1 : 0; // Yönü değiştir
            };

            performStep(); // İlk adımı hemen at
            oscillationInterval.current = setInterval(performStep, liveOscDuration + liveOscDelay);
        }
    };

    return (
        <Paper withBorder p="md" h="100%" style={{ overflow: 'auto' }}>
            <Stack>
                <Title order={3}>Ar-Ge Test Paneli</Title>
                <Text size="xs" c="dimmed" mt={-10} mb="md">
                    Bu panel, Arduino'ya doğrudan ham komutlar gönderir.
                </Text>

                {/* Osilasyon Adım Simülatörü */}
                <Box>
                    <Title order={5}>Osilasyon Adım Simülatörü</Title>
                    <Text size="xs" c="dimmed">Kalibrasyon için tek bir osilasyon adımını test edin.</Text>
                    <Group grow mt="sm">
                        <NumberInput label="PWM Değeri" value={stepPwm} onChange={(v) => setStepPwm(Number(v))} min={0} max={255}/>
                        <NumberInput label="Süre (ms)" value={stepDuration} onChange={(v) => setStepDuration(Number(v))} min={10} max={5000}/>
                    </Group>
                    <Group grow mt="md">
                        <Button onClick={() => handleSingleStep(0)} variant="outline">Tek Adım CW</Button>
                        <Button onClick={() => handleSingleStep(1)} variant="outline">Tek Adım CCW</Button>
                    </Group>
                </Box>
                <Divider my="md" />

                {/* Canlı Osilasyon Testi */}
                <Box>
                    <Title order={5}>Canlı Osilasyon Test Aracı</Title>
                    <Text size="xs" c="dimmed">Sürekli osilasyon döngüsünü test edin.</Text>
                    <Group grow mt="sm">
                        <NumberInput label="PWM" value={liveOscPwm} onChange={(v) => setLiveOscPwm(Number(v))} min={0} max={255}/>
                        <NumberInput label="Adım Süresi (ms)" value={liveOscDuration} onChange={(v) => setLiveOscDuration(Number(v))} min={10} max={5000}/>
                        <NumberInput label="Bekleme (ms)" value={liveOscDelay} onChange={(v) => setLiveOscDelay(Number(v))} min={0} max={1000}/>
                    </Group>
                    <Button mt="md" fullWidth onClick={toggleLiveOscillation} color={isLiveOscRunning ? 'red' : 'blue'}>
                        {isLiveOscRunning ? 'CANLI OSİLASYONU DURDUR' : 'CANLI OSİLASYONU BAŞLAT'}
                    </Button>
                </Box>
                <Divider my="md" />

                {/* Önceki Ar-Ge Araçları */}
                <Stack>
                    <Title order={5}>Diğer Test Araçları</Title>
                    <Box>
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
                    <Box>
                        <Text fw={500} mb="xs">Zamanlı Çalıştırma</Text>
                        <Group grow>
                            <NumberInput label="PWM" value={timedPwm} onChange={(v) => setTimedPwm(Number(v))} min={0} max={255} />
                            <NumberInput label="Süre (ms)" value={timedDuration} onChange={(v) => setTimedDuration(Number(v))} min={10} max={5000} />
                        </Group>
                        <Button mt="md" fullWidth onClick={() => sendRawCommand(`DEV.MOTOR.EXEC_TIMED_RUN:${timedPwm}|${timedDuration}`)}>
                            Çalıştır
                        </Button>
                    </Box>
                    <Box>
                        <Text fw={500} mb="xs">Buzzer Testi</Text>
                        <Group grow>
                            <NumberInput label="Süre (ms)" value={beepDuration} onChange={(v) => setBeepDuration(Number(v))} min={10} max={2000} />
                            <NumberInput label="Frekans (Hz)" value={beepFreq} onChange={(v) => setBeepFreq(Number(v))} min={100} max={5000} />
                        </Group>
                        <Button mt="md" fullWidth onClick={() => sendRawCommand(`DEV.BUZZER.BEEP:${beepDuration}|${beepFreq}`)} variant="outline">
                            Bip Sesi Çal
                        </Button>
                    </Box>
                </Stack>
            </Stack>
        </Paper>
    );
}