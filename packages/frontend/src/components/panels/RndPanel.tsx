// packages/frontend/src/components/panels/RndPanel.tsx

import { useState } from 'react';
import {Paper, Title, Stack, Text, Slider, Button, Group, NumberInput, Divider, Box} from '@mantine/core';
import { socket } from '../../services/socketService'; // Ham socket'i kullanacağız
import { useControllerStore } from '../../store/useControllerStore';

/**
 * Teknisyenlerin ve geliştiricilerin ham Arduino komutları göndererek
 * donanımı test etmelerini sağlayan Ar-Ge (Araştırma-Geliştirme) paneli.
 */
export function RndPanel() {
    const { addConsoleEntry } = useControllerStore.getState();

    // Panel içindeki kontroller için yerel state'ler
    const [rawPwm, setRawPwm] = useState<number>(0);
    const [timedPwm, setTimedPwm] = useState<number>(100);
    const [timedDuration, setTimedDuration] = useState<number>(50);
    const [beepDuration, setBeepDuration] = useState<number>(100);
    const [beepFreq, setBeepFreq] = useState<number>(1000);

    // Ham komut gönderen ve konsola loglayan yardımcı fonksiyon
    const sendRawCommand = (command: string, params: string | number) => {
        const fullCommand = `${command}:${params}`;
        addConsoleEntry({
            type: 'command',
            source: 'frontend',
            message: `[Ar-Ge] Ham komut gönderildi: ${fullCommand}`,
        });
        socket.emit('send_raw_command', fullCommand); // Backend'e bu şekilde gönderelim
    };

    // Zamanlı çalıştırma butonu
    const handleTimedRun = () => {
        sendRawCommand('DEV.MOTOR.EXEC_TIMED_RUN', `${timedPwm}|${timedDuration}`);
    };

    // Buzzer test butonu
    const handleBeep = () => {
        sendRawCommand('DEV.BUZZER.BEEP', `${beepDuration}|${beepFreq}`);
    };

    return (
        <Paper withBorder p="md" h="100%">
            <Stack h="100%">
                <Title order={3}>Ar-Ge Test Paneli</Title>
                <Text size="xs" c="dimmed" mt={-10} mb="md">
                    Bu panel, Arduino'ya doğrudan ham komutlar gönderir.
                </Text>

                <Stack gap="xl">
                    {/* Anlık PWM Kontrolü */}
                    <Box>
                        <Text fw={500}>Anlık PWM Kontrolü</Text>
                        <Group grow align="flex-end">
                            <Slider
                                value={rawPwm}
                                onChange={setRawPwm}
                                onChangeEnd={(value) => sendRawCommand('DEV.MOTOR.SET_PWM', value)}
                                min={0}
                                max={255}
                                step={1}
                                label={(value) => value}
                            />
                            <Button onClick={() => sendRawCommand('DEV.MOTOR.STOP', '')} color="red" variant='outline'>
                                STOP
                            </Button>
                        </Group>
                    </Box>
                    <Divider />
                    {/* Zamanlı Çalıştırma */}
                    <Box>
                        <Text fw={500} mb="xs">Zamanlı Çalıştırma Testi</Text>
                        <Group grow>
                            <NumberInput label="PWM Değeri" value={timedPwm} onChange={(val) => setTimedPwm(Number(val))} min={0} max={255} />
                            <NumberInput label="Süre (ms)" value={timedDuration} onChange={(val) => setTimedDuration(Number(val))} min={10} max={5000} />
                        </Group>
                        <Button mt="md" fullWidth onClick={handleTimedRun}>
                            Zamanlı Çalıştır
                        </Button>
                    </Box>
                    <Divider />
                    {/* Buzzer Testi */}
                    <Box>
                        <Text fw={500} mb="xs">Buzzer Testi</Text>
                        <Group grow>
                            <NumberInput label="Süre (ms)" value={beepDuration} onChange={(val) => setBeepDuration(Number(val))} min={10} max={2000} />
                            <NumberInput label="Frekans (Hz)" value={beepFreq} onChange={(val) => setBeepFreq(Number(val))} min={100} max={5000} />
                        </Group>
                        <Button mt="md" fullWidth onClick={handleBeep} variant="outline">
                            Bip Sesi Çal
                        </Button>
                    </Box>
                </Stack>
            </Stack>
        </Paper>
    );
}