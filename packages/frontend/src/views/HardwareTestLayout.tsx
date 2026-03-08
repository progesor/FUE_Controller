// packages/frontend/src/views/HardwareTestLayout.tsx

import { Container, Grid, Title, Button, Group, Stack, Slider, Text, Card, Badge } from '@mantine/core';
import { useControllerStore } from '../store/useControllerStore';
import type {OperatingMode} from 'shared-types';
import {socket} from '../services/socketService';

// ===================================================================
// Alt Bileşenler: Seçilen Moda Göre Değişen Dinamik Kontrol Kartları
// ===================================================================

const ContinuousControls = ({ motor, handleSetPwm }: any) => (
    <Stack gap="xl" align="center" justify="center" h="100%">
        <Title order={3} c="dimmed">Hedef Motor Hızı</Title>
        <Text fz={64} fw={900} c="blue">{motor.pwm} RPM</Text>
        <Slider
            w="100%"
            size="xl"
            value={motor.pwm}
            onChange={handleSetPwm}
            min={0}
            max={3000}
            step={50}
            marks={[{ value: 500, label: '500' }, { value: 1500, label: '1500' }, { value: 3000, label: '3000' }]}
        />
    </Stack>
);

const OscillationControls = ({ motor, oscillationSettings }: any) => (
    <Stack gap="xl" align="center" justify="center" h="100%">
        <Title order={3} c="dimmed">Osilasyon Ayarları</Title>
        <Group grow w="100%">
            <Card withBorder radius="md" p="xl" ta="center">
                <Text size="lg" c="dimmed">Dönüş Açısı</Text>
                <Text fz={48} fw={700} c="grape">{oscillationSettings.angle}°</Text>
            </Card>
            <Card withBorder radius="md" p="xl" ta="center">
                <Text size="lg" c="dimmed">Maks RPM</Text>
                <Text fz={48} fw={700} c="grape">{motor.pwm}</Text>
            </Card>
        </Group>
        <Text size="sm" c="dimmed" mt="md">* Açı ayarları için arayüze ek bileşenler eklenebilir.</Text>
    </Stack>
);

const PulseControls = ({ motor, pulseSettings }: any) => (
    <Stack gap="xl" align="center" justify="center" h="100%">
        <Title order={3} c="dimmed">Darbe (Punch) Ayarları</Title>
        <Group grow w="100%">
            <Card withBorder radius="md" p="xl" ta="center">
                <Text size="lg" c="dimmed">Darbe Süresi</Text>
                <Text fz={48} fw={700} c="orange">{pulseSettings.pulseDuration} ms</Text>
            </Card>
            <Card withBorder radius="md" p="xl" ta="center">
                <Text size="lg" c="dimmed">Hedef Hız</Text>
                <Text fz={48} fw={700} c="orange">{motor.pwm} RPM</Text>
            </Card>
        </Group>
    </Stack>
);

// ===================================================================
// Ana Bileşen: Akıllı Klinik Düzen (Bento Box Tasarımı)
// ===================================================================

export function HardwareTestLayout() {
    const motor = useControllerStore((state) => state.motor);
    const operatingMode = useControllerStore((state) => state.operatingMode);
    const oscillationSettings = useControllerStore((state) => state.oscillationSettings);
    const pulseSettings = useControllerStore((state) => state.pulseSettings);

    const handleStartMotor = () => socket.emit('start_motor');
    const handleStopMotor = () => socket.emit('stop_motor');
    const handleSetPwm = (value: number) => socket.emit('set_motor_pwm', value);
    const handleSetOperatingMode = (mode: OperatingMode) => socket.emit('set_operating_mode', mode);

    // Modlara göre renk ve ikon/stil haritası
    const modeColors: Record<string, string> = {
        continuous: 'blue',
        oscillation: 'grape',
        pulse: 'orange',
        vibration: 'teal'
    };

    return (
        <Container fluid p="xl" h="100vh">
            <Stack h="100%" gap="lg">

                {/* ÜST BİLGİ ÇUBUĞU */}
                <Group justify="space-between" align="center">
                    <Title order={1}>Klinik Operasyon Paneli</Title>
                    <Badge
                        color={motor.isActive ? 'green' : 'red'}
                        size="xl"
                        variant="dot"
                        p="lg"
                    >
                        {motor.isActive ? 'SİSTEM AKTİF - MOTOR DÖNÜYOR' : 'SİSTEM BEKLEMEDE'}
                    </Badge>
                </Group>

                {/* ANA IZGARA (GRID) */}
                <Grid gutter="lg" style={{ flexGrow: 1 }}>

                    {/* SOL KOLON: ÇALIŞMA MODLARI (Dokunmatik büyük butonlar) */}
                    <Grid.Col span={3}>
                        <Card shadow="sm" radius="lg" withBorder h="100%">
                            <Stack gap="md" h="100%">
                                <Title order={4} mb="md" ta="center">Çalışma Modu</Title>
                                {(['continuous', 'oscillation', 'pulse', 'vibration'] as OperatingMode[]).map((mode) => (
                                    <Button
                                        key={mode}
                                        size="xl"
                                        h={80}
                                        variant={operatingMode === mode ? 'filled' : 'light'}
                                        color={modeColors[mode]}
                                        onClick={() => handleSetOperatingMode(mode)}
                                        style={{ fontSize: '1.2rem' }}
                                    >
                                        {mode.toUpperCase()}
                                    </Button>
                                ))}
                            </Stack>
                        </Card>
                    </Grid.Col>

                    {/* ORTA KOLON: DİNAMİK KONTROLLER (Seçilen moda göre değişir) */}
                    <Grid.Col span={6}>
                        <Card shadow="md" radius="lg" withBorder h="100%" >
                            {operatingMode === 'continuous' && <ContinuousControls motor={motor} handleSetPwm={handleSetPwm} />}
                            {operatingMode === 'oscillation' && <OscillationControls motor={motor} oscillationSettings={oscillationSettings} />}
                            {operatingMode === 'pulse' && <PulseControls motor={motor} pulseSettings={pulseSettings} />}
                            {operatingMode === 'vibration' && (
                                <Stack align="center" justify="center" h="100%">
                                    <Title order={2} c="teal">Titreşim Modu Aktif</Title>
                                    <Text size="lg" c="dimmed">Titreşim yoğunluğu doğrudan hedeflenen RPM üzerinden hesaplanmaktadır.</Text>
                                </Stack>
                            )}
                        </Card>
                    </Grid.Col>

                    {/* SAĞ KOLON: ANA AKSİYONLAR (Dev Başlat/Durdur Butonları) */}
                    <Grid.Col span={3}>
                        <Card shadow="sm" radius="lg" withBorder h="100%">
                            <Stack justify="center" gap="xl" h="100%">
                                <Button
                                    color="green"
                                    radius="md"
                                    h={150}
                                    style={{ fontSize: '2rem' }}
                                    onClick={handleStartMotor}
                                    disabled={motor.isActive}
                                >
                                    BAŞLAT
                                </Button>
                                <Button
                                    color="red"
                                    radius="md"
                                    h={150}
                                    style={{ fontSize: '2rem' }}
                                    onClick={handleStopMotor}
                                    disabled={!motor.isActive}
                                >
                                    DURDUR
                                </Button>
                            </Stack>
                        </Card>
                    </Grid.Col>

                </Grid>
            </Stack>
        </Container>
    );
}