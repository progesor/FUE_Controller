// packages/frontend/src/views/HardwareTestLayout.tsx

import { useState, useEffect, useRef } from 'react';
import { Container, Grid, Title, Button, Group, Stack, Slider, Text, Card, Badge, ActionIcon, NumberInput, Divider, SegmentedControl, Accordion, Code, Box } from '@mantine/core';
import { IconPlus, IconMinus, IconDeviceFloppy, IconAdjustmentsHorizontal, IconCpu, IconDownload, IconBolt, IconWaveSine } from '@tabler/icons-react';
import { useControllerStore } from '../store/useControllerStore';
import type {OperatingMode} from 'shared-types';
import {socket} from '../services/socketService';

import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title as ChartTitle, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';
import classes from "./ClinicalLayout.module.css";
import {LayoutSwitchButton} from "../components/common/LayoutSwitchButton.tsx";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ChartTitle, Tooltip, Legend, Filler);

// ===================================================================
// BİLEŞEN 1: SÜREKLİ (CONTINUOUS) KONTROLLER
// ===================================================================
const ContinuousModePanel = ({ motor, handleSetPwm }: any) => {
    const [localPwm, setLocalPwm] = useState(motor.pwm);
    const lastEmitTime = useRef<number>(0);

    useEffect(() => { setLocalPwm(motor.pwm); }, [motor.pwm]);

    const stepChange = (amount: number) => {
        const newVal = Math.max(0, Math.min(35000, localPwm + amount));
        setLocalPwm(newVal);
        handleSetPwm(newVal);
    };

    const handleSliderChange = (val: number) => {
        setLocalPwm(val);
        const now = Date.now();
        if (now - lastEmitTime.current > 150) {
            handleSetPwm(val);
            lastEmitTime.current = now;
        }
    };

    return (
        <Stack gap="xl" align="center" justify="center" h="100%">
            <Title order={3} c="dimmed">Hedef Motor Hızı</Title>
            <Text fz={80} fw={900} c="blue" lh={1}>{localPwm.toLocaleString('tr-TR')} <Text span fz={24} c="dimmed">RPM</Text></Text>

            <Group w="100%" wrap="nowrap" gap="md">
                <ActionIcon size="xl" variant="light" color="blue" onClick={() => stepChange(-500)}>
                    <IconMinus size={24} />
                </ActionIcon>

                <Slider
                    style={{ flexGrow: 1 }} size="xl" value={localPwm}
                    onChange={handleSliderChange} onChangeEnd={handleSetPwm}
                    min={0} max={35000} step={500}
                    marks={[{ value: 10000, label: '10k' }, { value: 20000, label: '20k' }, { value: 30000, label: '30k' }]}
                />

                <ActionIcon size="xl" variant="light" color="blue" onClick={() => stepChange(500)}>
                    <IconPlus size={24} />
                </ActionIcon>
            </Group>
        </Stack>
    );
};

// ===================================================================
// BİLEŞEN 2: OSİLASYON (OSCILLATION) KONTROLLERİ
// ===================================================================
const OscillationModePanel = ({ motor, oscillationSettings, handleSetPwm, handleSetOscillation }: any) => {
    // Kilitlenmeleri önlemek için Yerel State (Local State) kullanıyoruz
    const [mode, setMode] = useState<'angle' | 'time'>(oscillationSettings.mode || 'angle');
    const [angle, setAngle] = useState<number>(oscillationSettings.angle || 180);
    const [timeMs, setTimeMs] = useState<number>(oscillationSettings.timeMs || 500);
    const [accel, setAccel] = useState<number>(oscillationSettings.accel || 5000);
    const [rpm, setRpm] = useState<number>(motor.pwm || 1500);

    // Ayarları topluca cihaza gönderme fonksiyonu
    const handleApplySettings = () => {
        handleSetOscillation({ mode, angle, timeMs, accel });
        handleSetPwm(rpm);
    };

    return (
        <Stack gap="lg" align="stretch" justify="space-between" h="100%">
            <Stack gap="md">
                <Group justify="space-between">
                    <Title order={3} c="dimmed">Osilasyon Parametreleri</Title>
                    <IconWaveSine size={28} color="var(--mantine-color-grape-5)" />
                </Group>

                <SegmentedControl
                    value={mode}
                    onChange={(val) => setMode(val as 'angle' | 'time')}
                    data={[
                        { label: 'Açı Odaklı (Angle)', value: 'angle' },
                        { label: 'Süre Odaklı (Time)', value: 'time' },
                    ]}
                    size="lg" color="grape"
                />

                <Grid gutter="md">
                    {mode === 'time' ? (
                        <Grid.Col span={6}>
                            <NumberInput label="Süre (ms)" value={timeMs} onChange={(val) => setTimeMs(Number(val))} min={10} max={10000} step={50} size="lg"/>
                        </Grid.Col>
                    ) : (
                        <Grid.Col span={6}>
                            <NumberInput label="Dönüş Açısı (°)" value={angle} onChange={(val) => setAngle(Number(val))} min={10} max={10000} step={15} size="lg"/>
                        </Grid.Col>
                    )}
                    <Grid.Col span={6}>
                        <NumberInput label="Maksimum Hız (RPM)" value={rpm} onChange={(val) => setRpm(Number(val))} min={100} max={35000} step={500} size="lg"/>
                    </Grid.Col>
                    <Grid.Col span={12}>
                        <NumberInput label="İvmelenme (Accel)" value={accel} onChange={(val) => setAccel(Number(val))} min={100} max={1000000} step={5000} size="lg"/>
                    </Grid.Col>
                </Grid>
            </Stack>

            <Button
                size="xl" color="grape" variant="light"
                onClick={handleApplySettings}
                leftSection={<IconBolt size={24} />}
            >
                Değerleri Cihaza Uygula
            </Button>
        </Stack>
    );
};

// ===================================================================
// BİLEŞEN 3: GERÇEK ZAMANLI TELEMETRİ GRAFİĞİ
// ===================================================================
const TelemetryChartPanel = ({ motor }: any) => {
    // Grafiğin daha akıcı ve uzun görünmesi için 50 noktalık bir kuyruk kullanıyoruz
    const [dataPoints, setDataPoints] = useState<number[]>(Array(50).fill(0));

    useEffect(() => {
        const handleTelemetry = (data: string) => {
            // Örnek STM32 verisi: "<TEL,1500.5,1.2>" (RPM ve Akım vs.)
            // 1. Temizlik: Başındaki "<TEL," ve sonundaki ">" işaretlerini at
            const cleanString = data.replace('<TEL,', '').replace('>', '');
            const values = cleanString.split(',');

            // 2. İlk değerin Anlık RPM olduğunu varsayıyoruz
            const rawRpm = parseFloat(values[0]);

            if (!isNaN(rawRpm)) {
                // 3. Osilasyondaki eksi (ters yön) değerleri mutlak değer ile pozitife çeviriyoruz
                const absoluteRpm = Math.abs(rawRpm);

                // 4. Grafiği güncelle
                setDataPoints(prev => {
                    const newData = [...prev.slice(1), absoluteRpm];
                    return newData;
                });
            }
        };

        socket.on('telemetry_data', handleTelemetry);
        return () => {
            socket.off('telemetry_data', handleTelemetry);
        };
    }, []);

    const data = {
        labels: Array(50).fill(''),
        datasets: [{
            label: 'Gerçek Encoder RPM',
            data: dataPoints,
            borderColor: motor.isActive ? '#40c057' : '#ced4da',
            backgroundColor: motor.isActive ? 'rgba(64, 192, 87, 0.1)' : 'transparent',
            fill: true, tension: 0.2, pointRadius: 0,
        }]
    };

    const options = {
        responsive: true, maintainAspectRatio: false, animation: { duration: 0 },
        scales: { y: { min: 0, suggestedMax: 5000 }, x: { display: false } },
        plugins: { legend: { display: false } }
    };

    return (
        <Card withBorder radius="md" h={200} p="sm">
            <Text size="sm" c="dimmed" mb="xs">Gerçek Zamanlı Telemetri Grafiği (Makineden Akan Veri)</Text>
            <div style={{ height: '150px' }}>
                <Line data={data} options={options} />
            </div>
        </Card>
    );
};

// ===================================================================
// BİLEŞEN 4: PID VE AYARLAR PANELİ (SAĞ KOLON)
// ===================================================================
const PIDSettingsPanel = () => {
    const [kp, setKp] = useState<number | string>(1.5);
    const [ki, setKi] = useState<number | string>(0.05);

    const handleApplyParams = () => socket.emit('send_raw_command', `APPLY_PID:${kp}:${ki}`);
    const handleSaveParams = () => {
        socket.emit('send_raw_command', `APPLY_PID:${kp}:${ki}`);
        setTimeout(() => socket.emit('send_raw_command', 'SAVE_PARAMS'), 200);
        setTimeout(() => socket.emit('send_raw_command', 'GET_PARAMS'), 400);
    };

    return (
        <Card shadow="sm" radius="lg" withBorder>
            <Group mb="sm">
                <IconAdjustmentsHorizontal size={20} color="gray" />
                <Title order={5} c="dimmed">PID Parametreleri</Title>
            </Group>
            <Divider mb="sm" />
            <Grid gutter="xs">
                <Grid.Col span={6}>
                    <NumberInput label="Kp" value={kp} onChange={setKp} step={0.1} decimalScale={2} />
                </Grid.Col>
                <Grid.Col span={6}>
                    <NumberInput label="Ki" value={ki} onChange={setKi} step={0.01} decimalScale={2} />
                </Grid.Col>
            </Grid>
            <Group grow mt="md">
                <Button variant="light" color="orange" leftSection={<IconBolt size={18} />} onClick={handleApplyParams}>Anlık</Button>
                <Button variant="light" color="blue" leftSection={<IconDeviceFloppy size={18} />} onClick={handleSaveParams}>Flaşa Yaz</Button>
            </Group>
        </Card>
    );
};

// ===================================================================
// BİLEŞEN 5: VIBRATION (TİTREŞİM) KONTROLLERİ
// ===================================================================
const VibrationModePanel = ({ vibrationSettings }: any) => {
    const [timeMs, setTimeMs] = useState<number>(vibrationSettings?.timeMs || 20);
    const [rpm, setRpm] = useState<number>(vibrationSettings?.rpm || 3000);
    const [accel, setAccel] = useState<number>(vibrationSettings?.accel || 100000);

    const handleApply = () => {
        // Backend'deki pulseSettings setter'ına veya emit'ine bağlayacağız
        socket.emit('set_vibration_settings', { timeMs, rpm, accel });
    };

    return (
        <Stack gap="lg" align="stretch" justify="space-between" h="100%">
            <Stack gap="md">
                <Title order={3} c="dimmed" ta="center">Titreşim (Mikro-Osilasyon) Parametreleri</Title>
                <Grid gutter="md">
                    <Grid.Col span={4}>
                        <NumberInput label="Vuruş Süresi (ms)" value={timeMs} onChange={(val) => setTimeMs(Number(val))} min={5} max={200} step={5} size="lg"/>
                    </Grid.Col>
                    <Grid.Col span={4}>
                        <NumberInput label="Şiddet (RPM)" value={rpm} onChange={(val) => setRpm(Number(val))} min={100} max={35000} step={500} size="lg"/>
                    </Grid.Col>
                    <Grid.Col span={4}>
                        <NumberInput label="Sertlik (Accel)" value={accel} onChange={(val) => setAccel(Number(val))} min={1000} max={1000000} step={10000} size="lg"/>
                    </Grid.Col>
                </Grid>
            </Stack>
            <Button size="xl" color="teal" variant="light" onClick={handleApply}>Değerleri Uygula</Button>
        </Stack>
    );
};

// ===================================================================
// BİLEŞEN 6: PULSE (DARBE) KONTROLLERİ
// ===================================================================
const PulseModePanel = ({ pulseSettings }: any) => {
    const [baseRpm, setBaseRpm] = useState<number>(pulseSettings?.baseRpm || 1000);
    const [pulseRpm, setPulseRpm] = useState<number>(pulseSettings?.pulseRpm || 8000);
    const [pulseDuration, setPulseDuration] = useState<number>(pulseSettings?.pulseDuration || 100);
    const [pulseInterval, setPulseInterval] = useState<number>(pulseSettings?.pulseInterval || 1000);

    const handleApply = () => {
        socket.emit('set_pulse_settings', { baseRpm, pulseRpm, pulseDuration, pulseInterval });
    };

    return (
        <Stack gap="lg" align="stretch" justify="space-between" h="100%">
            <Stack gap="md">
                <Title order={3} c="dimmed" ta="center">Darbe (Yazılımsal Sequencer) Parametreleri</Title>
                <Grid gutter="md">
                    <Grid.Col span={6}>
                        <NumberInput label="Taban Hız (Base RPM)" value={baseRpm} onChange={(val) => setBaseRpm(Number(val))} min={0} max={35000} step={100} size="lg"/>
                    </Grid.Col>
                    <Grid.Col span={6}>
                        <NumberInput label="Darbe Hızı (Peak RPM)" value={pulseRpm} onChange={(val) => setPulseRpm(Number(val))} min={100} max={35000} step={500} size="lg"/>
                    </Grid.Col>
                    <Grid.Col span={6}>
                        <NumberInput label="Darbe Süresi (ms)" value={pulseDuration} onChange={(val) => setPulseDuration(Number(val))} min={10} max={2000} step={10} size="lg"/>
                    </Grid.Col>
                    <Grid.Col span={6}>
                        <NumberInput label="Darbe Aralığı (Interval ms)" value={pulseInterval} onChange={(val) => setPulseInterval(Number(val))} min={100} max={5000} step={100} size="lg"/>
                    </Grid.Col>
                </Grid>
            </Stack>
            <Button size="xl" color="orange" variant="light" onClick={handleApply}>Değerleri Uygula</Button>
        </Stack>
    );
};

// ===================================================================
// ANA BİLEŞEN (MAIN LAYOUT)
// ===================================================================
export function HardwareTestLayout() {
    const motor = useControllerStore((state) => state.motor);
    const operatingMode = useControllerStore((state) => state.operatingMode);
    const oscillationSettings = useControllerStore((state) => state.oscillationSettings);
    const setOscillationSettings = useControllerStore((state) => state.setOscillationSettings);

    const [rawParams, setRawParams] = useState<string>("Cihazdan henüz veri çekilmedi.");

    useEffect(() => {
        socket.on('device_params_response', (data: string) => setRawParams(data));
        return () => { socket.off('device_params_response'); };
    }, []);

    const handleStartMotor = () => socket.emit('start_motor');
    const handleStopMotor = () => socket.emit('stop_motor');
    const handleSetPwm = (value: number) => socket.emit('set_motor_pwm', value);
    const handleSetOperatingMode = (mode: OperatingMode) => socket.emit('set_operating_mode', mode);
    const handleSetOscillation = (settings: any) => {
        setOscillationSettings(settings);
        socket.emit('set_oscillation_settings', settings);
    };
    const handleGetParams = () => socket.emit('send_raw_command', 'GET_PARAMS');

    const vibrationSettings = useControllerStore((state) => state.vibrationSettings);
    const pulseSettings = useControllerStore((state) => state.pulseSettings);

    const modeColors: Record<string, string> = {
        continuous: 'blue', oscillation: 'grape', pulse: 'orange', vibration: 'teal'
    };

    return (
        <Box className={classes.wrapper}>
            <LayoutSwitchButton />
        <Container fluid p="xl" h="100vh" style={{ display: 'flex', flexDirection: 'column' }}>
            <Group justify="space-between" align="center" mb="lg">
                <div>
                    <Title order={1}>Ar-Ge & Kalibrasyon Terminali</Title>
                    <Text c="dimmed">Binary Protocol (0xAA 0x55) İletişim Arayüzü</Text>
                </div>
                <Badge color={motor.isActive ? 'green' : 'red'} size="xl" variant="filled" p="lg">
                    {motor.isActive ? 'MOTOR AKTİF' : 'BEKLEMEDE'}
                </Badge>
            </Group>

            <Grid gutter="lg" style={{ flexGrow: 1, overflow: 'hidden' }}>
                {/* SOL KOLON: MODLAR */}
                <Grid.Col span={3}>
                    <Card shadow="sm" radius="lg" withBorder h="100%">
                        <Stack gap="md" h="100%">
                            <Title order={4} mb="sm" ta="center">Çalışma Modu</Title>
                            {(['continuous', 'oscillation', 'pulse', 'vibration'] as OperatingMode[]).map((mode) => (
                                <Button
                                    key={mode} size="xl" h={70}
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

                {/* ORTA KOLON: DİNAMİK KONTROLLER & GRAFİK */}
                <Grid.Col span={6}>
                    <Stack h="100%" gap="lg">
                        <Card shadow="md" radius="lg" withBorder style={{ flexGrow: 1 }}>
                            {operatingMode === 'continuous' && <ContinuousModePanel motor={motor} handleSetPwm={handleSetPwm} />}
                            {operatingMode === 'oscillation' && <OscillationModePanel motor={motor} oscillationSettings={oscillationSettings} handleSetPwm={handleSetPwm} handleSetOscillation={handleSetOscillation} />}
                            {operatingMode === 'vibration' && <VibrationModePanel vibrationSettings={vibrationSettings} />}
                            {operatingMode === 'pulse' && <PulseModePanel pulseSettings={pulseSettings} />}
                        </Card>
                        <TelemetryChartPanel motor={motor} />
                    </Stack>
                </Grid.Col>

                {/* SAĞ KOLON: ANA MOTOR AKSİYONLARI & PID */}
                <Grid.Col span={3}>
                    <Stack h="100%" gap="lg">
                        <Card shadow="sm" radius="lg" withBorder style={{ flexGrow: 1 }}>
                            <Stack justify="center" gap="md" h="100%">
                                <Button color="green" radius="md" h={120} style={{ fontSize: '2rem' }} onClick={handleStartMotor} disabled={motor.isActive}>BAŞLAT</Button>
                                <Button color="red" radius="md" h={120} style={{ fontSize: '2rem' }} onClick={handleStopMotor} disabled={!motor.isActive}>DURDUR</Button>
                            </Stack>
                        </Card>
                        <PIDSettingsPanel />
                    </Stack>
                </Grid.Col>
            </Grid>

            {/* GİZLİ CİHAZ PARAMETRELERİ */}
            <Accordion variant="separated" mt="lg">
                <Accordion.Item value="params">
                    <Accordion.Control icon={<IconCpu size={20} color="gray" />}><Text fw={500}>Gelişmiş Cihaz Parametreleri (Makineden Oku)</Text></Accordion.Control>
                    <Accordion.Panel>
                        <Group mb="md"><Button variant="light" leftSection={<IconDownload size={16}/>} onClick={handleGetParams}>Cihazdan Veri Çek</Button></Group>
                        <Code block color="gray">{rawParams}</Code>
                    </Accordion.Panel>
                </Accordion.Item>
            </Accordion>
        </Container>
        </Box>
    );
}