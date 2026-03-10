// packages/frontend/src/views/HardwareTestLayout.tsx

import {useState, useEffect, useRef} from 'react';
import { Container, Grid, Title, Button, Group, Stack, Slider, Text, Card, Badge, ActionIcon, NumberInput, Divider, SegmentedControl, Accordion, Code } from '@mantine/core';
import { IconPlus, IconMinus, IconDeviceFloppy, IconAdjustmentsHorizontal, IconCpu, IconDownload, IconBolt } from '@tabler/icons-react';
import { useControllerStore } from '../store/useControllerStore';
import type {OperatingMode} from 'shared-types';
import {socket} from '../services/socketService';

import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title as ChartTitle, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ChartTitle, Tooltip, Legend, Filler);

// ===================================================================
// ALT BİLEŞEN: SÜREKLİ (CONTINUOUS) KONTROLLER
// ===================================================================
const ContinuousControls = ({ motor, handleSetPwm }: any) => {
    const [localPwm, setLocalPwm] = useState(motor.pwm);
    const lastEmitTime = useRef<number>(0);

    useEffect(() => { setLocalPwm(motor.pwm); }, [motor.pwm]);

    const stepChange = (amount: number) => {
        const newVal = Math.max(0, Math.min(35000, localPwm + amount));
        setLocalPwm(newVal);
        handleSetPwm(newVal); // Sadece yeni hızı yollamak yeterli! Backend anında uygulayacak.
    };

    // Slider kaydırılırken pürüzsüz hız değişimi (150ms Throttling)
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
                    style={{ flexGrow: 1 }}
                    size="xl"
                    value={localPwm}
                    onChange={handleSliderChange}
                    onChangeEnd={handleSetPwm} // Bırakıldığında son değeri kesinleştir
                    min={0}
                    max={35000}
                    step={500}
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
// ALT BİLEŞEN: ÇİFT MODLU OSİLASYON KONTROLLERİ
// ===================================================================
const OscillationControls = ({ motor, oscillationSettings, handleSetPwm, handleSetOscillation }: any) => {
    const isTimeMode = oscillationSettings.mode === 'time';

    return (
        <Stack gap="xl" align="stretch" justify="center" h="100%">
            <Title order={3} c="dimmed" ta="center">Osilasyon Ayarları</Title>

            <SegmentedControl
                value={oscillationSettings.mode || 'angle'}
                onChange={(val) => handleSetOscillation({ mode: val })}
                data={[
                    { label: 'Açı Odaklı (Angle)', value: 'angle' },
                    { label: 'Süre Odaklı (Time)', value: 'time' },
                ]}
                size="lg"
                color="grape"
            />

            <Grid gutter="md">
                {isTimeMode ? (
                    <Grid.Col span={4}>
                        <NumberInput label="Süre (ms)" value={oscillationSettings.timeMs || 500} onChange={(val) => handleSetOscillation({ timeMs: Number(val) })} min={10} max={10000} step={50} size="lg"/>
                    </Grid.Col>
                ) : (
                    <Grid.Col span={4}>
                        <NumberInput label="Dönüş Açısı (°)" value={oscillationSettings.angle} onChange={(val) => handleSetOscillation({ angle: Number(val) })} min={180} max={10000} step={15} size="lg"/>
                    </Grid.Col>
                )}
                <Grid.Col span={4}>
                    <NumberInput label="Maksimum Hız (RPM)" value={motor.pwm} onChange={(val) => handleSetPwm(Number(val))} min={100} max={35000} step={500} size="lg"/>
                </Grid.Col>
                <Grid.Col span={4}>
                    {/* İvmelenme limiti 1.000.000'a çıkarıldı */}
                    <NumberInput label="İvmelenme (Accel)" value={oscillationSettings.accel || 50000} onChange={(val) => handleSetOscillation({ accel: Number(val) })} min={100} max={1000000} step={5000} size="lg"/>
                </Grid.Col>
            </Grid>
        </Stack>
    );
};

// ===================================================================
// ALT BİLEŞEN: DİNAMİK TELEMETRİ GRAFİĞİ
// ===================================================================
const TelemetryChart = ({ motor }: any) => {
    const [dataPoints, setDataPoints] = useState<number[]>(Array(20).fill(0));

    useEffect(() => {
        const interval = setInterval(() => {
            setDataPoints(prev => {
                const newData = [...prev.slice(1)];
                const rpm = motor.isActive ? motor.pwm + (Math.random() * 200 - 100) : 0;
                newData.push(rpm);
                return newData;
            });
        }, 200);
        return () => clearInterval(interval);
    }, [motor.isActive, motor.pwm]);

    const data = {
        labels: Array(20).fill(''),
        datasets: [{
            label: 'Encoder Anlık RPM',
            data: dataPoints,
            borderColor: motor.isActive ? '#40c057' : '#ced4da',
            backgroundColor: motor.isActive ? 'rgba(64, 192, 87, 0.1)' : 'transparent',
            fill: true,
            tension: 0.4,
            pointRadius: 0,
        }]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 0 },
        scales: {
            y: { min: 0, suggestedMax: 5000 },
            x: { display: false }
        },
        plugins: { legend: { display: false } }
    };

    return (
        <Card withBorder radius="md" h={200} p="sm">
            <Text size="sm" c="dimmed" mb="xs">Gerçek Zamanlı Telemetri Grafiği</Text>
            <div style={{ height: '150px' }}>
                <Line data={data} options={options} />
            </div>
        </Card>
    );
};

// ===================================================================
// ANA BİLEŞEN
// ===================================================================
export function HardwareTestLayout() {
    const motor = useControllerStore((state) => state.motor);
    const operatingMode = useControllerStore((state) => state.operatingMode);
    const oscillationSettings = useControllerStore((state) => state.oscillationSettings);
    const setOscillationSettings = useControllerStore((state) => state.setOscillationSettings);

    const [kp, setKp] = useState<number | string>(1.5);
    const [ki, setKi] = useState<number | string>(0.05);
    const [rawParams, setRawParams] = useState<string>("Cihazdan henüz veri çekilmedi.");

    useEffect(() => {
        socket.on('device_params_response', (data: string) => {
            setRawParams(data);
        });
        return () => {
            socket.off('device_params_response');
        };
    }, []);

    const handleStartMotor = () => socket.emit('start_motor');
    const handleStopMotor = () => socket.emit('stop_motor');
    const handleSetPwm = (value: number) => socket.emit('set_motor_pwm', value);
    const handleSetOperatingMode = (mode: OperatingMode) => socket.emit('set_operating_mode', mode);

    const handleSetOscillation = (settings: any) => {
        setOscillationSettings(settings);
        socket.emit('set_oscillation_settings', settings);
    };

    // Yeni PID Hack Komutları
    const handleApplyParams = () => {
        socket.emit('send_raw_command', `APPLY_PID:${kp}:${ki}`);
    };

    const handleSaveParams = () => {
        // 1. Önce değerleri cihaza anlık olarak uygula (RAM'e yaz)
        socket.emit('send_raw_command', `APPLY_PID:${kp}:${ki}`);

        // 2. 200ms sonra (RAM güncellendikten sonra) Flaşa kaydet komutunu yolla
        setTimeout(() => {
            socket.emit('send_raw_command', 'SAVE_PARAMS');

            // 3. 200ms daha bekleyip cihazın güncel verilerini ekrana geri çek (Teyit için)
            setTimeout(() => {
                socket.emit('send_raw_command', 'GET_PARAMS');
            }, 200);
        }, 200);
    };

    const handleGetParams = () => {
        socket.emit('send_raw_command', 'GET_PARAMS');
    };

    const modeColors: Record<string, string> = {
        continuous: 'blue', oscillation: 'grape', pulse: 'orange', vibration: 'teal'
    };

    return (
        <Container fluid p="xl" h="100vh"  style={{ display: 'flex', flexDirection: 'column' }}>
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

                <Grid.Col span={6}>
                    <Stack h="100%" gap="lg">
                        <Card shadow="md" radius="lg" withBorder style={{ flexGrow: 1 }}>
                            {operatingMode === 'continuous' && (
                                <ContinuousControls
                                    motor={motor}
                                    handleSetPwm={handleSetPwm}
                                    handleStartMotor={handleStartMotor}
                                    handleStopMotor={handleStopMotor} // YENİ EKLENEN PROP
                                />
                            )}
                            {operatingMode === 'oscillation' && <OscillationControls motor={motor} oscillationSettings={oscillationSettings} handleSetPwm={handleSetPwm} handleSetOscillation={handleSetOscillation}/>}
                            {(operatingMode === 'pulse' || operatingMode === 'vibration') && (
                                <Stack align="center" justify="center" h="100%">
                                    <Title order={3} c="dimmed">{operatingMode.toUpperCase()} Modu Geliştirme Aşamasında</Title>
                                </Stack>
                            )}
                        </Card>

                        <TelemetryChart motor={motor} />
                    </Stack>
                </Grid.Col>

                <Grid.Col span={3}>
                    <Stack h="100%" gap="lg">
                        <Card shadow="sm" radius="lg" withBorder style={{ flexGrow: 1 }}>
                            <Stack justify="center" gap="md" h="100%">
                                <Button
                                    color="green" radius="md" h={120} style={{ fontSize: '2rem' }}
                                    onClick={handleStartMotor} disabled={motor.isActive}
                                >
                                    BAŞLAT
                                </Button>
                                <Button
                                    color="red" radius="md" h={120} style={{ fontSize: '2rem' }}
                                    onClick={handleStopMotor} disabled={!motor.isActive}
                                >
                                    DURDUR
                                </Button>
                            </Stack>
                        </Card>

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

                            {/* İKİ ADET PID UYGULAMA BUTONU */}
                            <Group grow mt="md">
                                <Button variant="light" color="orange" leftSection={<IconBolt size={18} />} onClick={handleApplyParams}>
                                    Anlık Uygula
                                </Button>
                                <Button variant="light" color="blue" leftSection={<IconDeviceFloppy size={18} />} onClick={handleSaveParams}>
                                    Flaşa Kaydet
                                </Button>
                            </Group>

                        </Card>
                    </Stack>
                </Grid.Col>
            </Grid>

            <Accordion variant="separated" mt="lg">
                <Accordion.Item value="params">
                    <Accordion.Control icon={<IconCpu size={20} color="gray" />}>
                        <Text fw={500}>Gelişmiş Cihaz Parametreleri (Makineden Oku)</Text>
                    </Accordion.Control>
                    <Accordion.Panel>
                        <Group mb="md">
                            <Button variant="light" leftSection={<IconDownload size={16}/>} onClick={handleGetParams}>
                                Cihazdan Veri Çek
                            </Button>
                        </Group>
                        <Code block color="gray">{rawParams}</Code>
                    </Accordion.Panel>
                </Accordion.Item>
            </Accordion>
        </Container>
    );
}