// packages/frontend/src/views/HardwareTestLayout.tsx

import { useState, useEffect, useRef } from 'react';
import { Container, Grid, Title, Button, Group, Stack, Slider, Text, Card, Badge, ActionIcon, NumberInput, Divider, SegmentedControl, Accordion, Code, Box, Modal, Select, ScrollArea, TextInput } from '@mantine/core';
import { IconPlus, IconMinus, IconDeviceFloppy, IconAdjustmentsHorizontal, IconCpu, IconDownload, IconBolt, IconWaveSine, IconPlayerPlay, IconEdit, IconTrash } from '@tabler/icons-react';
import { useControllerStore } from '../store/useControllerStore';
import type {OperatingMode} from 'shared-types';
import {socket} from '../services/socketService';

import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title as ChartTitle, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';
import classes from "./ClinicalLayout.module.css";
import {LayoutSwitchButton} from "../components/common/LayoutSwitchButton.tsx";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ChartTitle, Tooltip, Legend, Filler);

// ===================================================================
// GEÇİCİ MAKRO (REÇETE) SİSTEMİ TİPLERİ VE VARSAYILANLAR
// ===================================================================
type MacroStep = {
    id: string;
    mode: OperatingMode;
    stepDurationMs: number;
    pwm: number;
    baseRpm?: number; // Darbe (Pulse) modu için eklendi
    oscMode?: 'angle' | 'time';
    oscAngle?: number;
    oscTimeMs?: number;
    accel?: number;
    vibTimeMs?: number;
    pulseDuration?: number;
    pulseInterval?: number;
};

type Macro = { id: string; name: string; steps: MacroStep[] };

const DEFAULT_MACROS: Macro[] = [
    {
        id: 'macro-1',
        name: 'Sınır Zorlama Testi (Örnek Senaryo)',
        steps: [
            { id: 's1', mode: 'continuous', stepDurationMs: 750, pwm: 4500 },
            { id: 's2', mode: 'oscillation', stepDurationMs: 1500, pwm: 2000, oscMode: 'angle', oscAngle: 180, accel: 30000 },
            { id: 's3', mode: 'oscillation', stepDurationMs: 1000, pwm: 5000, oscMode: 'time', oscTimeMs: 500, accel: 25000 },
            { id: 's4', mode: 'vibration', stepDurationMs: 500, pwm: 3000, vibTimeMs: 35, accel: 100000 }
        ]
    }
];

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
                    min={100} max={35000} step={100}
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
    const [mode, setMode] = useState<'angle' | 'time'>(oscillationSettings.mode || 'angle');
    const [angle, setAngle] = useState<number>(oscillationSettings.angle || 180);
    const [timeMs, setTimeMs] = useState<number>(oscillationSettings.timeMs || 500);
    const [accel, setAccel] = useState<number>(oscillationSettings.accel || 5000);
    const [rpm, setRpm] = useState<number>(motor.pwm || 1500);

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
    const [dataPoints, setDataPoints] = useState<number[]>(Array(50).fill(0));

    useEffect(() => {
        const handleTelemetry = (data: string) => {
            const cleanString = data.replace('<TEL,', '').replace('>', '');
            const values = cleanString.split(',');
            const rawRpm = parseFloat(values[0]);

            if (!isNaN(rawRpm)) {
                const absoluteRpm = Math.abs(rawRpm);
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
// BİLEŞEN 4: PID VE AYARLAR PANELİ
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
// YENİ BİLEŞEN: MAKRO DÜZENLEYİCİ (MODAL)
// ===================================================================
const MacroEditorModal = ({ opened, onClose, onSave, initialData }: { opened: boolean, onClose: () => void, onSave: (macro: Macro) => void, initialData: Macro | null }) => {
    const [macro, setMacro] = useState<Macro>({ id: '', name: '', steps: [] });

    useEffect(() => {
        if (opened) {
            setMacro(initialData ? { ...initialData } : { id: Date.now().toString(), name: 'Yeni Senaryo', steps: [] });
        }
    }, [opened, initialData]);

    const addStep = () => {
        setMacro(prev => ({
            ...prev,
            steps: [...prev.steps, { id: Date.now().toString(), mode: 'continuous', stepDurationMs: 1000, pwm: 1500 }]
        }));
    };

    const updateStep = (index: number, updates: Partial<MacroStep>) => {
        setMacro(prev => {
            const newSteps = [...prev.steps];
            newSteps[index] = { ...newSteps[index], ...updates };
            return { ...prev, steps: newSteps };
        });
    };

    const removeStep = (index: number) => {
        setMacro(prev => ({ ...prev, steps: prev.steps.filter((_, i) => i !== index) }));
    };

    return (
        <Modal opened={opened} onClose={onClose} title={<Title order={4}>Senaryo Düzenleyici</Title>} size="xl">
            <Stack>
                <TextInput label="Senaryo Adı" value={macro.name} onChange={(e) => setMacro({...macro, name: e.target.value})} placeholder="Örn: Agresif Kök Çıkarma Testi" size="md"/>

                <Divider label="Adımlar" labelPosition="center" />

                <ScrollArea h={450} type="auto">
                    <Stack gap="sm" pr="sm">
                        {macro.steps.length === 0 && <Text c="dimmed" ta="center" py="xl">Henüz bir adım eklenmedi.</Text>}
                        {macro.steps.map((step, i) => (
                            <Card key={step.id} withBorder shadow="sm">
                                <Group justify="space-between" mb="sm">
                                    <Badge size="lg">Adım {i + 1}</Badge>
                                    <ActionIcon color="red" variant="subtle" onClick={() => removeStep(i)}><IconTrash size={18}/></ActionIcon>
                                </Group>
                                <Grid>
                                    <Grid.Col span={4}>
                                        <Select label="Çalışma Modu" value={step.mode} onChange={(val) => updateStep(i, { mode: val as OperatingMode })} data={[
                                            { value: 'continuous', label: 'Sürekli (Continuous)' },
                                            { value: 'oscillation', label: 'Osilasyon (Oscillation)' },
                                            { value: 'vibration', label: 'Titreşim (Vibration)' },
                                            { value: 'pulse', label: 'Darbe (Pulse)' },
                                        ]} />
                                    </Grid.Col>
                                    <Grid.Col span={4}>
                                        <NumberInput label="Çalışma Süresi (ms)" value={step.stepDurationMs} onChange={(val) => updateStep(i, { stepDurationMs: Number(val) })} min={100} step={100} />
                                    </Grid.Col>
                                    <Grid.Col span={4}>
                                        <NumberInput label={step.mode === 'pulse' ? 'Pik Hız (RPM)' : 'Hedef Hız (RPM)'} value={step.pwm} onChange={(val) => updateStep(i, { pwm: Number(val) })} min={0} step={500} />
                                    </Grid.Col>

                                    {/* DİNAMİK ALANLAR (MODA GÖRE DEĞİŞİR) */}
                                    {step.mode === 'oscillation' && (
                                        <>
                                            <Grid.Col span={4}>
                                                <Select label="Osilasyon Tipi" value={step.oscMode || 'angle'} onChange={(val) => updateStep(i, { oscMode: val as 'angle' | 'time' })} data={[{value:'angle', label:'Açı Odaklı'}, {value:'time', label:'Süre Odaklı'}]} />
                                            </Grid.Col>
                                            <Grid.Col span={4}>
                                                {(!step.oscMode || step.oscMode === 'angle') ?
                                                    <NumberInput label="Açı (°)" value={step.oscAngle || 180} onChange={(val) => updateStep(i, { oscAngle: Number(val) })} /> :
                                                    <NumberInput label="Osilasyon Süresi (ms)" value={step.oscTimeMs || 500} onChange={(val) => updateStep(i, { oscTimeMs: Number(val) })} />
                                                }
                                            </Grid.Col>
                                            <Grid.Col span={4}>
                                                <NumberInput label="İvmelenme (Accel)" value={step.accel || 30000} onChange={(val) => updateStep(i, { accel: Number(val) })} step={5000} />
                                            </Grid.Col>
                                        </>
                                    )}

                                    {step.mode === 'vibration' && (
                                        <>
                                            <Grid.Col span={6}>
                                                <NumberInput label="Vuruş Süresi (ms)" value={step.vibTimeMs || 20} onChange={(val) => updateStep(i, { vibTimeMs: Number(val) })} />
                                            </Grid.Col>
                                            <Grid.Col span={6}>
                                                <NumberInput label="İvmelenme (Accel)" value={step.accel || 100000} onChange={(val) => updateStep(i, { accel: Number(val) })} step={10000} />
                                            </Grid.Col>
                                        </>
                                    )}

                                    {step.mode === 'pulse' && (
                                        <>
                                            <Grid.Col span={4}>
                                                <NumberInput label="Taban Hız (Base RPM)" value={step.baseRpm || 1000} onChange={(val) => updateStep(i, { baseRpm: Number(val) })} />
                                            </Grid.Col>
                                            <Grid.Col span={4}>
                                                <NumberInput label="Darbe Süresi (ms)" value={step.pulseDuration || 100} onChange={(val) => updateStep(i, { pulseDuration: Number(val) })} />
                                            </Grid.Col>
                                            <Grid.Col span={4}>
                                                <NumberInput label="Bekleme Aralığı (ms)" value={step.pulseInterval || 1000} onChange={(val) => updateStep(i, { pulseInterval: Number(val) })} />
                                            </Grid.Col>
                                        </>
                                    )}
                                </Grid>
                            </Card>
                        ))}
                        <Button variant="light" leftSection={<IconPlus size={16}/>} onClick={addStep} color="blue" mt="md" fullWidth style={{ borderStyle: 'dashed' }}>Yeni Adım Ekle</Button>
                    </Stack>
                </ScrollArea>

                <Group justify="flex-end" mt="md">
                    <Button variant="default" onClick={onClose}>İptal</Button>
                    <Button color="green" onClick={() => onSave(macro)} leftSection={<IconDeviceFloppy size={16}/>}>Senaryoyu Kaydet</Button>
                </Group>
            </Stack>
        </Modal>
    );
};

// ===================================================================
// YENİ BİLEŞEN: GEÇİCİ MAKRO YÖNETİCİSİ VE OYNATICISI
// ===================================================================
const MacroManagerPanel = ({ motor, handleStopGlobal }: any) => {
    const [macros, setMacros] = useState<Macro[]>(() => {
        const saved = localStorage.getItem('hw_macros');
        return saved ? JSON.parse(saved) : DEFAULT_MACROS;
    });
    const [isPlaying, setIsPlaying] = useState(false);
    const [activeMacroId, setActiveMacroId] = useState<string | null>(null);
    const [activeStepIndex, setActiveStepIndex] = useState<number>(-1);

    // Editor States
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingMacro, setEditingMacro] = useState<Macro | null>(null);

    const cancelRef = useRef(false);

    useEffect(() => { localStorage.setItem('hw_macros', JSON.stringify(macros)); }, [macros]);

    const playMacro = async (macro: Macro) => {
        if (motor.isActive) handleStopGlobal();
        setIsPlaying(true);
        setActiveMacroId(macro.id);
        cancelRef.current = false;

        for (let i = 0; i < macro.steps.length; i++) {
            if (cancelRef.current) break;

            const step = macro.steps[i];
            setActiveStepIndex(i);

            if (step.mode === 'continuous') {
                socket.emit('set_motor_pwm', step.pwm);
            } else if (step.mode === 'oscillation') {
                // YENİ: Undefined gelme ihtimaline karşı varsayılan değerler eklendi
                socket.emit('set_oscillation_settings', {
                    mode: step.oscMode || 'angle',
                    angle: step.oscAngle || 180,
                    timeMs: step.oscTimeMs || 500,
                    accel: step.accel || 30000
                });
                socket.emit('set_motor_pwm', step.pwm);
            } else if (step.mode === 'vibration') {
                // YENİ: Undefined gelme ihtimaline karşı varsayılan değerler eklendi
                socket.emit('set_vibration_settings', {
                    timeMs: step.vibTimeMs || 20,
                    rpm: step.pwm,
                    accel: step.accel || 100000
                });
            } else if (step.mode === 'pulse') {
                // YENİ: Undefined gelme ihtimaline karşı varsayılan değerler eklendi
                socket.emit('set_pulse_settings', {
                    baseRpm: step.baseRpm || 1000,
                    pulseRpm: step.pwm,
                    pulseDuration: step.pulseDuration || 100,
                    pulseInterval: step.pulseInterval || 1000
                });
            }

            socket.emit('set_operating_mode', step.mode);
            socket.emit('start_motor');

            await new Promise(resolve => setTimeout(resolve, step.stepDurationMs));
        }

        socket.emit('stop_motor');
        setIsPlaying(false);
        setActiveMacroId(null);
        setActiveStepIndex(-1);
    };

    const stopMacro = () => {
        cancelRef.current = true;
        socket.emit('stop_motor');
        setIsPlaying(false);
    };

    const handleSaveMacro = (savedMacro: Macro) => {
        setMacros(prev => {
            const exists = prev.find(m => m.id === savedMacro.id);
            if (exists) return prev.map(m => m.id === savedMacro.id ? savedMacro : m);
            return [...prev, savedMacro];
        });
        setIsEditorOpen(false);
    };

    const handleDeleteMacro = (id: string) => {
        setMacros(prev => prev.filter(m => m.id !== id));
    };

    const openEditor = (macro?: Macro) => {
        setEditingMacro(macro || null);
        setIsEditorOpen(true);
    };

    return (
        <>
            <Card shadow="sm" radius="lg" withBorder mt="sm">
                <Group justify="space-between" mb="sm">
                    <Group><IconPlayerPlay size={20} color="var(--mantine-color-teal-6)" /><Title order={5} c="dimmed">Test Senaryoları</Title></Group>
                    {isPlaying && <Badge color="teal" variant="light" className="animate-pulse">ÇALIŞIYOR</Badge>}
                </Group>
                <Divider mb="sm" />
                <Stack gap="xs">
                    {macros.map(macro => (
                        <Card key={macro.id} withBorder p="sm" bg={activeMacroId === macro.id ? "teal.0" : undefined}>
                            <Group justify="space-between">
                                <Text fw={600} size="sm" truncate style={{flex: 1}}>{macro.name}</Text>
                                <Group gap="xs" wrap="nowrap">
                                    <ActionIcon variant="subtle" color="blue" onClick={() => openEditor(macro)} disabled={isPlaying}><IconEdit size={16}/></ActionIcon>
                                    <ActionIcon variant="subtle" color="red" onClick={() => handleDeleteMacro(macro.id)} disabled={isPlaying}><IconTrash size={16}/></ActionIcon>

                                    {activeMacroId === macro.id ? (
                                        <Button size="xs" color="red" onClick={stopMacro}>Durdur</Button>
                                    ) : (
                                        <Button size="xs" color="teal" variant="light" onClick={() => playMacro(macro)} disabled={isPlaying}>Oynat</Button>
                                    )}
                                </Group>
                            </Group>
                            {activeMacroId === macro.id && activeStepIndex >= 0 && (
                                <Text size="xs" c="teal" mt="xs" fw={700}>
                                    Adım {activeStepIndex + 1}: {macro.steps[activeStepIndex].mode.toUpperCase()}
                                </Text>
                            )}
                        </Card>
                    ))}
                    <Button variant="light" color="blue" fullWidth mt="sm" onClick={() => openEditor()} disabled={isPlaying} leftSection={<IconPlus size={16}/>}>Yeni Senaryo Ekle</Button>
                </Stack>
            </Card>

            <MacroEditorModal
                opened={isEditorOpen}
                onClose={() => setIsEditorOpen(false)}
                onSave={handleSaveMacro}
                initialData={editingMacro}
            />
        </>
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

                    {/* SAĞ KOLON: ANA MOTOR AKSİYONLARI, PID VE MAKRO */}
                    <Grid.Col span={3}>
                        <Stack h="100%" gap="lg">
                            <Card shadow="sm" radius="lg" withBorder>
                                <Stack justify="center" gap="md" h="100%">
                                    <Button color="green" radius="md" h={80} style={{ fontSize: '1.5rem' }} onClick={handleStartMotor} disabled={motor.isActive}>BAŞLAT</Button>
                                    <Button color="red" radius="md" h={80} style={{ fontSize: '1.5rem' }} onClick={handleStopMotor} disabled={!motor.isActive}>DURDUR</Button>
                                </Stack>
                            </Card>

                            <PIDSettingsPanel />

                            {/* GEÇİCİ MAKRO SİSTEMİ */}
                            <MacroManagerPanel motor={motor} handleStopGlobal={handleStopMotor} />
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