// packages/frontend/src/views/ClinicalLayout.tsx

import { useState, useEffect } from 'react';
import {
    Box, Stack, Group, Text, SegmentedControl, Tooltip, Button, Drawer, Modal,
    Card, ActionIcon, TextInput, Divider, Badge, Flex
} from '@mantine/core';
import classes from './ClinicalLayout.module.css';
import { Gauge } from "../components/clinical/Gauge.tsx";
import { VALID_ANGLES } from "../config/calibration.ts";
import { useControllerStore } from "../store/useControllerStore.ts";
import { InfoPanel } from "../components/clinical/InfoPanel.tsx";
import { PresetButtons } from "../components/clinical/PresetButtons.tsx";
import {
    sendMotorPwm, sendOscillationSettings, sendStartMotor, sendStopMotor,
    sendRecipeStart, sendRecipeStop, sendRecipeSave, sendActiveRecipe, sendRecipeDelete
} from "../services/socketService.ts";
import ErtipLogo from '../assets/clinical/ertip-logo.svg?react';
import cx from 'clsx';
import { LayoutSwitchButton } from "../components/common/LayoutSwitchButton.tsx";
import { IconList, IconEdit, IconX, IconPlus, IconTrash, IconDeviceFloppy, IconStar, IconStarFilled } from '@tabler/icons-react';
import type { Recipe } from 'shared-types';
import { TissueHardnessChart } from "../components/clinical/TissueHardnessChart.tsx";
import {TouchNumberInput} from "../components/clinical/TouchNumberInput.tsx";

const RPM_STEP = 100;
const MAX_ACCEL = 50000;
const MAX_OSC_ANGLE = VALID_ANGLES[VALID_ANGLES.length - 1] || 600;

const UI_MODES = ['continuous', 'oscillation_angle', 'oscillation_time', 'vibration', 'pulse', 'loop'];
const MODE_COLORS: Record<string, string> = { continuous: 'blue', oscillation_angle: 'grape', oscillation_time: 'violet', vibration: 'teal', pulse: 'orange', loop: 'red' };
const MODE_LABELS: Record<string, string> = { continuous: 'CONTINUOUS', oscillation_angle: 'OSCILLATION (ANGLE)', oscillation_time: 'OSCILLATION (TIME)', vibration: 'VIBRATION', pulse: 'PULSE', loop: 'RESTART (LOOP)' };

const RecipeEditorModal = ({ opened, onClose, initialRecipe }: { opened: boolean, onClose: () => void, initialRecipe: Recipe | null }) => {
    const [localRecipe, setLocalRecipe] = useState<Recipe>({ id: '', name: '', steps: [] });

    useEffect(() => {
        if (opened) setLocalRecipe(initialRecipe ? JSON.parse(JSON.stringify(initialRecipe)) : { id: Date.now().toString(), name: 'New Program', steps: [] });
    }, [opened, initialRecipe]);

    const addStep = () => setLocalRecipe(prev => ({ ...prev, steps: [...prev.steps, { id: Date.now().toString(), mode: 'continuous', duration: 1000, settings: { pwm: 1500 } }] }));
    const updateStepSetting = (index: number, settingUpdates: any) => { const newSteps = [...localRecipe.steps]; newSteps[index].settings = { ...(newSteps[index].settings || {}), ...settingUpdates }; setLocalRecipe({ ...localRecipe, steps: newSteps }); };
    const updateStepDuration = (index: number, duration: number) => { const newSteps = [...localRecipe.steps]; newSteps[index].duration = duration; setLocalRecipe({ ...localRecipe, steps: newSteps }); };
    const removeStep = (index: number) => setLocalRecipe(prev => ({ ...prev, steps: prev.steps.filter((_, i) => i !== index) }));

    const getUIMode = (step: any) => { if (step.mode === 'oscillation') return step.settings?.mode === 'time' ? 'oscillation_time' : 'oscillation_angle'; return step.mode; };
    const cycleMode = (index: number, step: any) => {
        const currentUIMode = getUIMode(step);
        const nextUIMode = UI_MODES[(UI_MODES.indexOf(currentUIMode) + 1) % UI_MODES.length];
        const newSteps = [...localRecipe.steps];
        if (nextUIMode === 'oscillation_angle') newSteps[index] = { ...step, mode: 'oscillation', settings: { mode: 'angle', angle: 180, accel: MAX_ACCEL, pwm: 1500 } };
        else if (nextUIMode === 'oscillation_time') newSteps[index] = { ...step, mode: 'oscillation', settings: { mode: 'time', timeMs: 100, accel: MAX_ACCEL, pwm: 1500 } };
        else if (nextUIMode === 'vibration') newSteps[index] = { ...step, mode: 'vibration', settings: { rpm: 3000, timeMs: 20, accel: 100000 } };
        else if (nextUIMode === 'pulse') newSteps[index] = { ...step, mode: 'pulse', settings: { baseRpm: 1000, pulseRpm: 5000, pulseDuration: 100, pulseInterval: 1000 } };
        else if (nextUIMode === 'loop') newSteps[index] = { ...step, mode: 'loop' as any, settings: {} };
        else newSteps[index] = { ...step, mode: 'continuous', settings: { pwm: 1500 } };
        setLocalRecipe({ ...localRecipe, steps: newSteps });
    };

    const handleSave = () => {
        sendRecipeSave(localRecipe);
        const currentRecipes = useControllerStore.getState().savedRecipes;
        const existingIdx = currentRecipes.findIndex(r => r.id === localRecipe.id);
        if (existingIdx >= 0) { const newRecipes = [...currentRecipes]; newRecipes[existingIdx] = localRecipe; useControllerStore.getState().setSavedRecipes(newRecipes); }
        else useControllerStore.getState().setSavedRecipes([...currentRecipes, localRecipe]);
        sendActiveRecipe(localRecipe);
        useControllerStore.getState().setActiveRecipe(localRecipe);
        onClose();
    };

    const totalItems = localRecipe.steps.length + 1;
    const scaleFactor = totalItems > 4 ? 4.2 / totalItems : 1;

    return (
        <Modal opened={opened} onClose={onClose} fullScreen title={<Text size="xl" fw={700}>Program Editor</Text>} transitionProps={{ transition: 'fade', duration: 200 }}>
            <Stack h="100%" justify="space-between">
                <Group justify="space-between" align="center">
                    <TextInput size="xl" value={localRecipe.name} onChange={(e) => setLocalRecipe({...localRecipe, name: e.target.value})} placeholder="e.g. Aggressive Extraction" w={400}/>
                    <Group>
                        <Button size="xl" color="green" leftSection={<IconDeviceFloppy size={24}/>} onClick={handleSave}>Save & Apply</Button>
                        <Button size="xl" variant="light" color="red" onClick={onClose}>Close</Button>
                    </Group>
                </Group>
                <Divider my="md" />

                <Box style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    <Flex
                        wrap="nowrap"
                        align="stretch"
                        gap="lg"
                        w="max-content"
                        style={{
                            transform: `scale(${scaleFactor})`,
                            transformOrigin: 'center center',
                            transition: 'transform 0.3s ease-out'
                        }}
                    >
                        {localRecipe.steps.length === 0 && <Text c="dimmed" size="lg" mt="xl">No steps added yet. Click the button on the right.</Text>}
                        {localRecipe.steps.map((step, i) => {
                            const uiMode = getUIMode(step);
                            const stepSettings = step.settings as any;
                            return (
                                <Card key={step.id} withBorder shadow="md" w={320} radius="md" style={{ flexShrink: 0 }}>
                                    <Group justify="space-between" mb="xs">
                                        <Badge size="lg" color="gray">STEP {i + 1}</Badge>
                                        <ActionIcon color="red" variant="subtle" onClick={() => removeStep(i)}><IconTrash size={20}/></ActionIcon>
                                    </Group>
                                    <Button fullWidth size="xl" color={MODE_COLORS[uiMode]} onClick={() => cycleMode(i, step)} style={{ fontSize: '1.2rem', height: '60px' }}>{MODE_LABELS[uiMode]}</Button>

                                    <Stack mt="xl" gap="md">
                                        {/* YENİ: className={classes.fatFingerInput} tüm NumberInput'lara eklendi */}
                                        <TouchNumberInput label={uiMode === 'loop' ? "Wait Time (ms)" : "Step Duration (ms)"} value={step.duration} onChange={(val) => updateStepDuration(i, Number(val) || 0)} min={100} step={100}/>
                                        <Divider />

                                        {uiMode === 'loop' && (
                                            <Text c="dimmed" size="sm" ta="center" mt="sm">
                                                The motor will stop and wait for the specified time, then the program will <Text span c="red" fw={700}>RESTART</Text> from Step 1.
                                            </Text>
                                        )}

                                        {uiMode === 'continuous' && <TouchNumberInput label="Target Speed (RPM)" value={stepSettings?.pwm || 1500} onChange={(val) => updateStepSetting(i, { pwm: Number(val) || 0 })} min={0} step={500} />}
                                        {uiMode === 'oscillation_angle' && <> <TouchNumberInput label="Target Speed (RPM)" value={stepSettings?.pwm || 1500} onChange={(val) => updateStepSetting(i, { pwm: Number(val) || 0 })} min={0} step={500} /> <TouchNumberInput label="Rotation Angle (°)" value={stepSettings?.angle || 180} onChange={(val) => updateStepSetting(i, { angle: Number(val) || 0 })} min={10} step={15} /> </>}
                                        {uiMode === 'oscillation_time' && <> <TouchNumberInput label="Target Speed (RPM)" value={stepSettings?.pwm || 1500} onChange={(val) => updateStepSetting(i, { pwm: Number(val) || 0 })} min={0} step={500}  /> <TouchNumberInput label="Oscillation Time (ms)" value={stepSettings?.timeMs || 100} onChange={(val) => updateStepSetting(i, { timeMs: Number(val) || 0 })} min={10} step={10}  /> </>}
                                        {uiMode === 'vibration' && <> <TouchNumberInput label="Vibration Intensity (RPM)" value={stepSettings?.rpm || 3000} onChange={(val) => updateStepSetting(i, { rpm: Number(val) || 0 })} min={0} step={500}  /> <TouchNumberInput label="Stroke Time (ms)" value={stepSettings?.timeMs || 20} onChange={(val) => updateStepSetting(i, { timeMs: Number(val) || 0 })} min={5} step={5} /> </>}
                                        {uiMode === 'pulse' && <> <TouchNumberInput label="Base Speed (RPM)" value={stepSettings?.baseRpm || 1000} onChange={(val) => updateStepSetting(i, { baseRpm: Number(val) || 0 })} min={0} step={100} /> <TouchNumberInput label="Peak Speed (RPM)" value={stepSettings?.pulseRpm || 5000} onChange={(val) => updateStepSetting(i, { pulseRpm: Number(val) || 0 })} min={0} step={500}  /> </>}
                                    </Stack>

                                </Card>
                            );
                        })}
                        <Button variant="light" color="gray" w={200} h="100%" style={{ borderStyle: 'dashed', minHeight: '300px' }} onClick={addStep}>
                            <Stack align="center" gap="xs"><IconPlus size={48} /><Text>Add New Step</Text></Stack>
                        </Button>
                    </Flex>
                </Box>
            </Stack>
        </Modal>
    );
};

export function ClinicalLayout() {
    const { motor, oscillationSettings, setMotorStatus, setOscillationSettings, savedRecipes, activeRecipe, recipeStatus, setActiveRecipe, operatingMode } = useControllerStore();
    const [oscModeUI, setOscModeUI] = useState<'sensitive' | 'powerful'>('sensitive');
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isEditorOpen, setIsEditorOpen] = useState(false);

    const currentMaxRpm = operatingMode === 'oscillation' ? 5000 : 35000;

    useEffect(() => {
        if (!activeRecipe && motor.pwm > currentMaxRpm) {
            setMotorStatus({ pwm: currentMaxRpm });
            sendMotorPwm(currentMaxRpm);
        }
    }, [currentMaxRpm]);

    const handleIncrementRpm = () => {
        const newVal = Math.min(currentMaxRpm, motor.pwm + RPM_STEP);
        setMotorStatus({ pwm: newVal });
        sendMotorPwm(newVal);
    };

    const handleDecrementRpm = () => {
        const newVal = Math.max(0, motor.pwm - RPM_STEP);
        setMotorStatus({ pwm: newVal });
        sendMotorPwm(newVal);
    };

    const handleRpmSliderChange = (sliderValue: number) => {
        const clampedValue = Math.min(currentMaxRpm, sliderValue);
        setMotorStatus({ pwm: clampedValue });
        sendMotorPwm(clampedValue);
    };

    const handleIncrementAngle = () => { const currentIndex = VALID_ANGLES.indexOf(oscillationSettings.angle); applyOscillation(VALID_ANGLES[Math.min(VALID_ANGLES.length - 1, currentIndex !== -1 ? currentIndex + 1 : 0)], oscModeUI); };
    const handleDecrementAngle = () => { const currentIndex = VALID_ANGLES.indexOf(oscillationSettings.angle); applyOscillation(VALID_ANGLES[Math.max(0, currentIndex !== -1 ? currentIndex - 1 : 0)], oscModeUI); };
    const handleAngleSliderChange = (sliderValue: number) => { applyOscillation(VALID_ANGLES.reduce((prev, curr) => Math.abs(curr - sliderValue) < Math.abs(prev - sliderValue) ? curr : prev ), oscModeUI); };

    const handleModeSwitch = (newMode: 'sensitive' | 'powerful') => { setOscModeUI(newMode); applyOscillation(oscillationSettings.angle, newMode); };
    const getMappedTimeMs = (angle: number) => Math.round(50 + ((angle - VALID_ANGLES[0]) / ((VALID_ANGLES[VALID_ANGLES.length - 1] || 600) - VALID_ANGLES[0])) * (500 - 50));

    const applyOscillation = (targetAngle: number, activeMode: 'sensitive' | 'powerful') => {
        setOscillationSettings({ ...oscillationSettings, angle: targetAngle });
        if (activeMode === 'sensitive') sendOscillationSettings({ mode: 'angle', angle: targetAngle, accel: MAX_ACCEL } as any);
        else sendOscillationSettings({ mode: 'time', angle: targetAngle, timeMs: getMappedTimeMs(targetAngle), accel: MAX_ACCEL } as any);
    };

    const handleLogoClick = () => {
        if (activeRecipe) {
            if (recipeStatus.isRunning) sendRecipeStop();
            else sendRecipeStart(activeRecipe);
            return;
        }
        if (motor.isActive) sendStopMotor();
        else sendStartMotor();
    };

    const oscPercent = Math.round((Math.max(0, oscillationSettings.angle) / MAX_OSC_ANGLE) * 100);

    return (
        <Box className={classes.wrapper}>
            <LayoutSwitchButton />

            <Box style={{ position: 'absolute', top: 25, left: 25, zIndex: 100 }}>
                <Button
                    size="xl"
                    radius="md"
                    variant="default"
                    leftSection={<IconList size={28}/>}
                    onClick={() => setIsDrawerOpen(true)}
                    style={{
                        boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
                        border: '1px solid rgba(255,255,255,0.2)'
                    }}
                >
                    Quick Programs
                </Button>
            </Box>

            <Stack justify="space-between" h="100%" p="xl">
                <PresetButtons />

                <Group justify="center" align="center" w="100%" className={classes.centerGroup}>
                    <Gauge
                        value={motor.pwm}
                        maxValue={currentMaxRpm}
                        step={RPM_STEP}
                        label="RPM"
                        mirror={false}
                        onIncrement={handleIncrementRpm}
                        onDecrement={handleDecrementRpm}
                        onChange={handleRpmSliderChange}
                        onSliderChange={handleRpmSliderChange}
                    />

                    <Stack align="center" mx="xl" className={classes.logoWrap} style={{ position: 'relative' }}>
                        {activeRecipe && (
                            /* YENİ: Senin yaptığın 500px ve 28px metin düzeltmesi buraya eklendi! */
                            <Box style={{ position: 'absolute', top: -150, width: '500px', textAlign: 'center', zIndex: 10 }}>
                                <Badge size="xl" color="green" mb="sm" p="md" style={{ fontSize: '14px', letterSpacing: '1px' }}>
                                    ACTIVE PROGRAM
                                </Badge>
                                <Group justify="center" gap="md">
                                    <Text fw={800} size="28px" c="green" style={{ letterSpacing: '0.5px' }}>
                                        {activeRecipe.name}
                                    </Text>
                                    <ActionIcon size="xl" radius="md" variant="light" color="blue" onClick={() => setIsEditorOpen(true)}>
                                        <IconEdit size={26}/>
                                    </ActionIcon>
                                    <ActionIcon size="xl" radius="md" variant="light" color="red" onClick={() => { sendActiveRecipe(null); setActiveRecipe(null); }}>
                                        <IconX size={26}/>
                                    </ActionIcon>
                                </Group>
                            </Box>
                        )}

                        <Box
                            onClick={handleLogoClick}
                            style={{ cursor: 'pointer', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <ErtipLogo
                                className={cx(classes.logo, { [classes.logoActive]: motor.isActive || recipeStatus.isRunning })}
                                width="300"
                            />

                            <Box className={classes.centerGraphic} style={{ pointerEvents: 'none' }}>
                                {recipeStatus.isRunning ? (
                                    <>
                                        <Text className={classes.welcomeText} c="green">Program Running</Text>
                                        <Text className={classes.doctorName}>Automatic Mode</Text>
                                    </>
                                ) : (
                                    <>
                                        <Text className={classes.welcomeText}>Welcome</Text>
                                        <Text className={classes.doctorName}>Dr. Tayfun Oğuzoğlu</Text>
                                    </>
                                )}
                            </Box>
                        </Box>

                        <Stack align="center" mt={8} mb={-200}>
                            <TissueHardnessChart
                                isRunning={motor.isActive || recipeStatus.isRunning}
                                rpm={motor.pwm}
                                oscillation={oscPercent}
                            />
                        </Stack>
                    </Stack>

                    <Stack align="center" gap="xs">
                        <Tooltip label={oscModeUI === 'sensitive' ? "Focuses on angle." : `Focuses on time (Exactly ${getMappedTimeMs(oscillationSettings.angle)}ms stroke).`} position="top" withArrow>
                            <SegmentedControl
                                value={oscModeUI}
                                onChange={(val) => handleModeSwitch(val as 'sensitive' | 'powerful')}
                                data={[
                                    { label: 'Sensitive (Angle)', value: 'sensitive' },
                                    { label: 'Powerful (Time)', value: 'powerful' }
                                ]}
                                size="lg"
                                color="grape"
                                radius="xl"
                                style={{
                                    marginBottom: '0px',
                                    zIndex: 10,
                                    top: -30,
                                    left: -30,
                                    boxShadow: '0 4px 15px rgba(0,0,0,0.4)'
                                }}
                            />
                        </Tooltip>

                        <Gauge
                            value={oscillationSettings.angle}
                            maxValue={MAX_OSC_ANGLE}
                            step={15}
                            label="Oscillation"
                            subLabel="°"
                            mirror={true}
                            onIncrement={handleIncrementAngle}
                            onDecrement={handleDecrementAngle}
                            onChange={handleAngleSliderChange}
                            onSliderChange={handleAngleSliderChange}
                        />
                    </Stack>
                </Group>

                <Stack align="center" gap="md">
                    <InfoPanel showClock/>
                </Stack>
            </Stack>

            <Drawer
                opened={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                title={<Text size="2xl" fw={700}>Quick Programs</Text>}
                position="left"
                size="md"
                keepMounted={false}
                overlayProps={{ blur: 3, backgroundOpacity: 0.6 }}
                zIndex={1000}
            >
                <Stack gap="md" mt="sm">
                    <Button
                        size="lg"
                        variant="light"
                        color="blue"
                        fullWidth
                        leftSection={<IconPlus size={24}/>}
                        onClick={() => { setIsDrawerOpen(false); sendActiveRecipe(null); setActiveRecipe(null); setIsEditorOpen(true); }}
                    >
                        Create New Program
                    </Button>
                    <Divider my="xs" />
                    {savedRecipes.length === 0 && <Text c="dimmed" ta="center">No saved programs yet.</Text>}

                    {savedRecipes.map(recipe => {
                        const isFav = (recipe as any).isFavorite;
                        const isReadonly = (recipe as any).isReadonly;

                        return (
                            <Card
                                key={recipe.id}
                                withBorder
                                shadow="sm"
                                p="md"
                                radius="md"
                                className={classes.recipeCard}
                                style={{
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                    border: isFav ? '1px solid var(--mantine-color-orange-5)' : undefined
                                }}
                                onClick={() => { sendActiveRecipe(recipe); setActiveRecipe(recipe); setIsDrawerOpen(false); }}
                            >
                                <Group justify="space-between" align="flex-start" mb="sm">
                                    <Text fw={600} size="lg" style={{ flex: 1 }}>{recipe.name}</Text>
                                    <Group gap="xs">
                                        <Button
                                            size="md"
                                            color={isFav ? "gray" : "orange"}
                                            variant={isFav ? "light" : "filled"}
                                            leftSection={isFav ? <IconStar size={18} /> : <IconStarFilled size={18} />}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const updatedRecipe = { ...recipe, isFavorite: !isFav } as any;
                                                sendRecipeSave(updatedRecipe);

                                                const newRecipes = savedRecipes.map(r => r.id === recipe.id ? updatedRecipe : r);
                                                useControllerStore.getState().setSavedRecipes(newRecipes);
                                                if (activeRecipe?.id === recipe.id) setActiveRecipe(updatedRecipe);
                                            }}
                                        >
                                            {isFav ? "Unfavorite" : "Favorite"}
                                        </Button>

                                        <Button size="md" color="blue" variant="light" onClick={(e) => { e.stopPropagation(); setIsDrawerOpen(false); setActiveRecipe(recipe); setIsEditorOpen(true); }}>
                                            Edit
                                        </Button>
                                    </Group>
                                </Group>

                                <Group justify="space-between">
                                    <Badge size="lg" color="gray" variant="light">{recipe.steps.length} steps</Badge>
                                    {!isReadonly && (
                                        <Button
                                            size="sm"
                                            color="red"
                                            variant="subtle"
                                            leftSection={<IconTrash size={16}/>}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (!window.confirm("Are you sure you want to delete this program? This action cannot be undone.")) return;
                                                sendRecipeDelete(recipe.id);
                                                useControllerStore.getState().setSavedRecipes(useControllerStore.getState().savedRecipes.filter((r) => r.id !== recipe.id));
                                            }}
                                        >
                                            Delete
                                        </Button>
                                    )}
                                </Group>
                            </Card>
                        );
                    })}
                </Stack>
            </Drawer>

            <RecipeEditorModal opened={isEditorOpen} onClose={() => setIsEditorOpen(false)} initialRecipe={activeRecipe} />
        </Box>
    );
}