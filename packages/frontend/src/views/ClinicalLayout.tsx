// packages/frontend/src/views/ClinicalLayout.tsx

import { useState, useEffect } from 'react';
import {
    Box,
    Stack,
    Group,
    Text,
    SegmentedControl,
    Tooltip,
    Button,
    Drawer,
    Modal,
    ScrollArea,
    Card,
    ActionIcon,
    NumberInput,
    TextInput,
    Divider,
    Badge,
    Flex
} from '@mantine/core';
import classes from './ClinicalLayout.module.css';
import { Gauge } from "../components/clinical/Gauge.tsx";
import { VALID_ANGLES } from "../config/calibration.ts";
import { useControllerStore } from "../store/useControllerStore.ts";
import { InfoPanel } from "../components/clinical/InfoPanel.tsx";
import { PresetButtons } from "../components/clinical/PresetButtons.tsx";
import {
    sendMotorPwm,
    sendOscillationSettings,
    sendStartMotor,
    sendStopMotor,
    sendRecipeStart,
    sendRecipeStop,
    sendRecipeSave,
    sendActiveRecipe,
    sendRecipeDelete
} from "../services/socketService.ts";
import ErtipLogo from '../assets/clinical/ertip-logo.svg?react';
import cx from 'clsx';
import { TissueHardnessChartBar } from "../components/clinical/TissueHardnessChartBar.tsx";
import { LayoutSwitchButton } from "../components/common/LayoutSwitchButton.tsx";
import { IconList, IconEdit, IconX, IconPlus, IconTrash, IconDeviceFloppy } from '@tabler/icons-react';
import type { Recipe } from 'shared-types';

// ==========================================
// CONSTANTS & LIMITS
// ==========================================
const MAX_RPM = 35000;
const RPM_STEP = 500;
const MAX_ACCEL = 50000;
const MAX_OSC_ANGLE = VALID_ANGLES[VALID_ANGLES.length - 1] || 600;

// UI Modes for the Editor (Separating Oscillation into Angle and Time)
const UI_MODES = ['continuous', 'oscillation_angle', 'oscillation_time', 'vibration', 'pulse'];
const MODE_COLORS: Record<string, string> = {
    continuous: 'blue',
    oscillation_angle: 'grape',
    oscillation_time: 'violet',
    vibration: 'teal',
    pulse: 'orange'
};
const MODE_LABELS: Record<string, string> = {
    continuous: 'CONTINUOUS',
    oscillation_angle: 'OSCILLATION (ANGLE)',
    oscillation_time: 'OSCILLATION (TIME)',
    vibration: 'VIBRATION',
    pulse: 'PULSE'
};

// ==========================================
// FULL-SCREEN RECIPE EDITOR MODAL
// ==========================================
const RecipeEditorModal = ({ opened, onClose, initialRecipe }: { opened: boolean, onClose: () => void, initialRecipe: Recipe | null }) => {
    const [localRecipe, setLocalRecipe] = useState<Recipe>({ id: '', name: '', steps: [] });

    useEffect(() => {
        if (opened) {
            setLocalRecipe(initialRecipe ? JSON.parse(JSON.stringify(initialRecipe)) : { id: Date.now().toString(), name: 'New Recipe', steps: [] });
        }
    }, [opened, initialRecipe]);

    const addStep = () => {
        setLocalRecipe(prev => ({
            ...prev,
            steps: [...prev.steps, {
                id: Date.now().toString(),
                mode: 'continuous',
                duration: 1000,
                settings: { pwm: 1500 }
            }]
        }));
    };

    const updateStepSetting = (index: number, settingUpdates: any) => {
        const newSteps = [...localRecipe.steps];
        newSteps[index].settings = { ...(newSteps[index].settings || {}), ...settingUpdates };
        setLocalRecipe({ ...localRecipe, steps: newSteps });
    };

    const removeStep = (index: number) => {
        setLocalRecipe(prev => ({ ...prev, steps: prev.steps.filter((_, i) => i !== index) }));
    };

    // Helper to determine current UI mode from step data
    const getUIMode = (step: any) => {
        if (step.mode === 'oscillation') {
            return step.settings?.mode === 'time' ? 'oscillation_time' : 'oscillation_angle';
        }
        return step.mode;
    };

    // Cycles through the modes when the colored button is clicked
    const cycleMode = (index: number, step: any) => {
        const currentUIMode = getUIMode(step);
        const currentIdx = UI_MODES.indexOf(currentUIMode);
        const nextUIMode = UI_MODES[(currentIdx + 1) % UI_MODES.length];

        const newSteps = [...localRecipe.steps];

        if (nextUIMode === 'oscillation_angle') {
            newSteps[index] = { ...step, mode: 'oscillation', settings: { mode: 'angle', angle: 180, accel: MAX_ACCEL, pwm: 1500 } };
        } else if (nextUIMode === 'oscillation_time') {
            newSteps[index] = { ...step, mode: 'oscillation', settings: { mode: 'time', timeMs: 100, accel: MAX_ACCEL, pwm: 1500 } };
        } else if (nextUIMode === 'vibration') {
            newSteps[index] = { ...step, mode: 'vibration', settings: { rpm: 3000, timeMs: 20, accel: 100000 } };
        } else if (nextUIMode === 'pulse') {
            newSteps[index] = { ...step, mode: 'pulse', settings: { baseRpm: 1000, pulseRpm: 5000, pulseDuration: 100, pulseInterval: 1000 } };
        } else {
            // continuous
            newSteps[index] = { ...step, mode: 'continuous', settings: { pwm: 1500 } };
        }

        setLocalRecipe({ ...localRecipe, steps: newSteps });
    };

    const handleSave = () => {
        // 1. Send to backend
        sendRecipeSave(localRecipe);

        // 2. Offline Fallback: Update local store immediately (Fixes the issue of not saving when disconnected)
        const currentRecipes = useControllerStore.getState().savedRecipes;
        const existingIdx = currentRecipes.findIndex(r => r.id === localRecipe.id);
        if (existingIdx >= 0) {
            const newRecipes = [...currentRecipes];
            newRecipes[existingIdx] = localRecipe;
            useControllerStore.getState().setSavedRecipes(newRecipes);
        } else {
            useControllerStore.getState().setSavedRecipes([...currentRecipes, localRecipe]);
        }

        // 3. Set Active and Close
        sendActiveRecipe(localRecipe);
        useControllerStore.getState().setActiveRecipe(localRecipe);
        onClose();
    };

    return (
        <Modal opened={opened} onClose={onClose} fullScreen title={<Text size="xl" fw={700}>Recipe Editor</Text>} transitionProps={{ transition: 'fade', duration: 200 }}>
            <Stack h="100%" justify="space-between">
                <Group justify="space-between" align="center">
                    <TextInput
                        size="xl"
                        value={localRecipe.name}
                        onChange={(e) => setLocalRecipe({...localRecipe, name: e.target.value})}
                        placeholder="e.g. Aggressive Extraction"
                        w={400}
                    />
                    <Group>
                        <Button size="xl" color="green" leftSection={<IconDeviceFloppy size={24}/>} onClick={handleSave}>Save & Apply</Button>

                        <Button size="xl" variant="light" color="red" onClick={onClose}>Close</Button>
                    </Group>

                </Group>

                <Divider my="md" />

                {/* Fixed the disappearing bug: Using Flex with w="max-content" inside ScrollArea */}
                <ScrollArea type="always" w="100%" style={{ flex: 1 }} pb="xl" offsetScrollbars>
                    <Flex wrap="nowrap" align="stretch" gap="lg" px="md" w="max-content" style={{ minHeight: '350px' }}>
                        {localRecipe.steps.length === 0 && <Text c="dimmed" size="lg" mt="xl">No steps added yet. Click the button on the right.</Text>}

                        {localRecipe.steps.map((step, i) => {
                            const uiMode = getUIMode(step);
                            const stepSettings = step.settings as any; // YENİ EKLENDİ: TS Hatasını Engeller

                            return (
                                <Card key={step.id} withBorder shadow="md" w={320} radius="md" style={{ flexShrink: 0 }}>
                                    <Group justify="space-between" mb="xs">
                                        <Badge size="lg" color="gray">STEP {i + 1}</Badge>
                                        <ActionIcon color="red" variant="subtle" onClick={() => removeStep(i)}><IconTrash size={20}/></ActionIcon>
                                    </Group>

                                    <Button
                                        fullWidth
                                        size="xl"
                                        color={MODE_COLORS[uiMode]}
                                        onClick={() => cycleMode(i, step)}
                                        style={{ fontSize: '1.2rem', height: '60px' }}
                                    >
                                        {MODE_LABELS[uiMode]}
                                    </Button>

                                    <Stack mt="xl" gap="md">
                                        <NumberInput label="Step Duration (ms)" value={step.duration} onChange={(val) => updateStepSetting(i, { duration: Number(val) || 0 })} min={100} step={100} size="md" />
                                        <Divider />

                                        {uiMode === 'continuous' && (
                                            <NumberInput label="Target Speed (RPM)" value={stepSettings?.pwm || 1500} onChange={(val) => updateStepSetting(i, { pwm: Number(val) || 0 })} min={0} step={500} size="md" />
                                        )}

                                        {uiMode === 'oscillation_angle' && (
                                            <>
                                                <NumberInput label="Target Speed (RPM)" value={stepSettings?.pwm || 1500} onChange={(val) => updateStepSetting(i, { pwm: Number(val) || 0 })} min={0} step={500} size="md" />
                                                <NumberInput label="Rotation Angle (°)" value={stepSettings?.angle || 180} onChange={(val) => updateStepSetting(i, { angle: Number(val) || 0 })} min={10} step={15} size="md" />
                                            </>
                                        )}

                                        {uiMode === 'oscillation_time' && (
                                            <>
                                                <NumberInput label="Target Speed (RPM)" value={stepSettings?.pwm || 1500} onChange={(val) => updateStepSetting(i, { pwm: Number(val) || 0 })} min={0} step={500} size="md" />
                                                <NumberInput label="Oscillation Time (ms)" value={stepSettings?.timeMs || 100} onChange={(val) => updateStepSetting(i, { timeMs: Number(val) || 0 })} min={10} step={10} size="md" />
                                            </>
                                        )}

                                        {uiMode === 'vibration' && (
                                            <>
                                                <NumberInput label="Vibration Intensity (RPM)" value={stepSettings?.rpm || 3000} onChange={(val) => updateStepSetting(i, { rpm: Number(val) || 0 })} min={0} step={500} size="md" />
                                                <NumberInput label="Stroke Time (ms)" value={stepSettings?.timeMs || 20} onChange={(val) => updateStepSetting(i, { timeMs: Number(val) || 0 })} min={5} step={5} size="md" />
                                            </>
                                        )}

                                        {uiMode === 'pulse' && (
                                            <>
                                                <NumberInput label="Base Speed (RPM)" value={stepSettings?.baseRpm || 1000} onChange={(val) => updateStepSetting(i, { baseRpm: Number(val) || 0 })} min={0} step={100} size="md" />
                                                <NumberInput label="Peak Speed (RPM)" value={stepSettings?.pulseRpm || 5000} onChange={(val) => updateStepSetting(i, { pulseRpm: Number(val) || 0 })} min={0} step={500} size="md" />
                                            </>
                                        )}
                                    </Stack>
                                </Card>
                            );
                        })}

                        <Button
                            variant="light"
                            color="gray"
                            w={200}
                            h="100%"
                            style={{ borderStyle: 'dashed', minHeight: '300px' }}
                            onClick={addStep}
                        >
                            <Stack align="center" gap="xs">
                                <IconPlus size={48} />
                                <Text>Add New Step</Text>
                            </Stack>
                        </Button>
                    </Flex>
                </ScrollArea>
            </Stack>
        </Modal>
    );
};

// ==========================================
// MAIN CLINICAL COMPONENT
// ==========================================
export function ClinicalLayout() {
    const { motor, oscillationSettings, setMotorStatus, setOscillationSettings, savedRecipes, activeRecipe, recipeStatus, setActiveRecipe } = useControllerStore();

    const [oscModeUI, setOscModeUI] = useState<'sensitive' | 'powerful'>('sensitive');

    // UI States
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isEditorOpen, setIsEditorOpen] = useState(false);

    // ==========================================
    // RPM & OSCILLATION CONTROLS
    // ==========================================
    const handleIncrementRpm = () => { const newVal = Math.min(MAX_RPM, motor.pwm + RPM_STEP); setMotorStatus({ pwm: newVal }); sendMotorPwm(newVal); };
    const handleDecrementRpm = () => { const newVal = Math.max(0, motor.pwm - RPM_STEP); setMotorStatus({ pwm: newVal }); sendMotorPwm(newVal); };
    const handleRpmSliderChange = (sliderValue: number) => { setMotorStatus({ pwm: sliderValue }); sendMotorPwm(sliderValue); };

    const handleIncrementAngle = () => {
        const currentIndex = VALID_ANGLES.indexOf(oscillationSettings.angle);
        const nextIndex = Math.min(VALID_ANGLES.length - 1, currentIndex !== -1 ? currentIndex + 1 : 0);
        applyOscillation(VALID_ANGLES[nextIndex], oscModeUI);
    };
    const handleDecrementAngle = () => {
        const currentIndex = VALID_ANGLES.indexOf(oscillationSettings.angle);
        const prevIndex = Math.max(0, currentIndex !== -1 ? currentIndex - 1 : 0);
        applyOscillation(VALID_ANGLES[prevIndex], oscModeUI);
    };
    const handleAngleSliderChange = (sliderValue: number) => {
        const closestAngle = VALID_ANGLES.reduce((prev, curr) => Math.abs(curr - sliderValue) < Math.abs(prev - sliderValue) ? curr : prev );
        applyOscillation(closestAngle, oscModeUI);
    };

    const handleModeSwitch = (newMode: 'sensitive' | 'powerful') => {
        setOscModeUI(newMode);
        applyOscillation(oscillationSettings.angle, newMode);
    };

    const getMappedTimeMs = (angle: number) => {
        const minAngle = VALID_ANGLES[0];
        const maxAngle = VALID_ANGLES[VALID_ANGLES.length - 1] || 600;
        return Math.round(50 + ((angle - minAngle) / (maxAngle - minAngle)) * (500 - 50));
    };

    const applyOscillation = (targetAngle: number, activeMode: 'sensitive' | 'powerful') => {
        setOscillationSettings({ ...oscillationSettings, angle: targetAngle });
        if (activeMode === 'sensitive') {
            sendOscillationSettings({ mode: 'angle', angle: targetAngle, accel: MAX_ACCEL } as any);
        } else {
            // angle eklendi ve 'as any' ile tip güvenliği aşıldı
            sendOscillationSettings({ mode: 'time', angle: targetAngle, timeMs: getMappedTimeMs(targetAngle), accel: MAX_ACCEL } as any);
        }
    };

    // ==========================================
    // SMART LOGO (RECIPE OR MANUAL START)
    // ==========================================
    const handleLogoClick = () => {
        if (activeRecipe) {
            if (recipeStatus.isRunning) {
                sendRecipeStop();
            } else {
                sendRecipeStart(activeRecipe);
            }
            return;
        }

        if (motor.isActive) {
            sendStopMotor();
        } else {
            sendStartMotor();
        }
    };

    const oscPercent = Math.round((Math.max(0, oscillationSettings.angle) / MAX_OSC_ANGLE) * 100);

    return (
        <Box className={classes.wrapper}>
            <LayoutSwitchButton />

            {/* TOP LEFT QUICK RECIPES BUTTON */}
            <Box style={{ position: 'absolute', top: 20, left: 20, zIndex: 100 }}>
                <Button size="lg" variant="default" leftSection={<IconList size={24}/>} onClick={() => setIsDrawerOpen(true)}>
                    Quick Recipes
                </Button>
            </Box>

            <Stack justify="space-between" h="100%" p="xl">
                <PresetButtons />

                <Group justify="center" align="center" w="100%" className={classes.centerGroup}>

                    <Gauge
                        value={motor.pwm}
                        maxValue={MAX_RPM}
                        step={RPM_STEP}
                        label="RPM"
                        mirror={false}
                        onIncrement={handleIncrementRpm}
                        onDecrement={handleDecrementRpm}
                        onChange={handleRpmSliderChange}
                        onSliderChange={handleRpmSliderChange}
                    />

                    <Stack align="center" mx="xl" className={classes.logoWrap} style={{ position: 'relative' }}>

                        {/* ACTIVE RECIPE INFO BANNER */}
                        {activeRecipe && (
                            <Box style={{ position: 'absolute', top: -100, width: '100%', textAlign: 'center' }}>
                                <Badge size="lg" color="green" mb="xs">ACTIVE RECIPE</Badge>
                                <Group justify="center" gap="xs">
                                    <Text fw={700} size="xl" c="green">{activeRecipe.name}</Text>
                                    <ActionIcon variant="light" color="blue" onClick={() => setIsEditorOpen(true)}><IconEdit size={18}/></ActionIcon>
                                    <ActionIcon variant="light" color="red" onClick={() => {
                                        sendActiveRecipe(null);
                                        setActiveRecipe(null); // Offline fallback
                                    }}><IconX size={18}/></ActionIcon>
                                </Group>
                            </Box>
                        )}

                        <ErtipLogo
                            className={cx(classes.logo, {
                                [classes.logoActive]: motor.isActive || recipeStatus.isRunning
                            })}
                            onClick={handleLogoClick}
                            width="300"
                            style={{ cursor: 'pointer' }}
                        />
                        <Box className={classes.centerGraphic}>
                            {recipeStatus.isRunning ? (
                                <>
                                    <Text className={classes.welcomeText} c="green">Recipe Running</Text>
                                    <Text className={classes.doctorName}>Automatic Mode</Text>
                                </>
                            ) : (
                                <>
                                    <Text className={classes.welcomeText}>Welcome</Text>
                                    <Text className={classes.doctorName}>Dr. Tayfun Oğuzoğlu</Text>
                                </>
                            )}
                        </Box>

                        <Stack align="center" mt={8} mb={-200}>
                            <TissueHardnessChartBar
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
                                size="sm"
                                color="grape"
                                radius="xl"
                                style={{ marginBottom: '-10px', zIndex: 10, top: -20, left: -50 }}
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

            {/* QUICK RECIPE DRAWER */}
            <Drawer opened={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title={<Text size="xl" fw={700}>Saved Recipes</Text>} position="left" size="md">
                <Stack>
                    <Button variant="light" color="blue" fullWidth leftSection={<IconPlus size={20}/>} onClick={() => {
                        setIsDrawerOpen(false);
                        sendActiveRecipe(null);
                        setActiveRecipe(null);
                        setIsEditorOpen(true);
                    }}>
                        Create New Recipe
                    </Button>
                    <Divider my="sm" />
                    {savedRecipes.length === 0 && <Text c="dimmed" ta="center">No saved recipes yet.</Text>}
                    {savedRecipes.map(recipe => (
                        <Card key={recipe.id} withBorder shadow="sm" p="sm" className={classes.recipeCard}>
                            <Group justify="space-between">
                                <Text fw={600}>{recipe.name}</Text>
                                <Group>
                                <Button size="sm" color="green" variant="light" onClick={() => {
                                    sendActiveRecipe(recipe);
                                    setActiveRecipe(recipe); // Offline fallback
                                    setIsDrawerOpen(false);
                                }}>
                                    Favorite
                                </Button>

                                <Button size="sm" color="blue" variant="light" onClick={() => {
                                    setIsDrawerOpen(true);
                                    setActiveRecipe(recipe);
                                    setIsEditorOpen(true);
                                }}>
                                    Edit
                                </Button>
                                </Group>
                            </Group>

                            <Group justify="space-between" mt="8px">
                            <Text size="xs" c="dimmed" mt="xs">{recipe.steps.length} steps.</Text>
                            <Button size="xs" color="red" variant="light" onClick={() => {
                                // 1. Backend'e Silme İsteği Gönder
                                sendRecipeDelete(recipe.id);

                                // 2. Offline Fallback: Hemen Local Store'dan Kaldır (Silme işlemi geri alınamaz olduğu için onay istemiyoruz)
                                const currentRecipes = useControllerStore.getState().savedRecipes;
                                useControllerStore.getState().setSavedRecipes(currentRecipes.filter(r => r.id !== recipe.id));
                            }}>Delete</Button>
                            </Group>
                        </Card>
                    ))}
                </Stack>
            </Drawer>

            {/* FULL SCREEN RECIPE EDITOR MODAL */}
            <RecipeEditorModal
                opened={isEditorOpen}
                onClose={() => setIsEditorOpen(false)}
                initialRecipe={activeRecipe}
            />
        </Box>
    );
}