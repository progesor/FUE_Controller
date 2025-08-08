// packages/frontend/src/components/aura/ActiveModeDisplay.tsx

import { Group, Text, Box } from '@mantine/core';
import { useControllerStore } from '../../store/useControllerStore';
import classes from './ActiveModeDisplay.module.css';
import { AnimatePresence, motion } from 'framer-motion';
import { IconInfinity, IconRepeat, IconActivity, IconWaveSine, IconBook } from '@tabler/icons-react';
import type { OperatingMode } from '../../../../shared-types';

const modeIcons: Record<OperatingMode | 'recipe', React.ElementType> = {
    continuous: IconInfinity,
    oscillation: IconRepeat,
    pulse: IconActivity,
    vibration: IconWaveSine,
    recipe: IconBook, // Reçetenin genel ikonu
};

const modeLabels: Record<OperatingMode, string> = {
    continuous: 'Sürekli Mod',
    oscillation: 'Osilasyon Modu',
    pulse: 'Darbe Modu',
    vibration: 'Titreşim Modu',
};

export function ActiveModeDisplay() {
    const { motor, operatingMode, recipeStatus, activeRecipe } = useControllerStore();

    const isRecipeRunning = recipeStatus.isRunning && activeRecipe && recipeStatus.currentStepIndex !== null;

    // YENİ: Reçete çalışıyorsa, o anki adımın modunu ve ikonunu al
    const currentStep = isRecipeRunning ? activeRecipe.steps[recipeStatus.currentStepIndex] : null;
    const CurrentModeIcon = currentStep ? modeIcons[currentStep.mode] : modeIcons[operatingMode];

    return (
        <AnimatePresence>
            {motor.isActive && (
                // DİKKAT: style prop'u doğrudan burada yönetiliyor
                <motion.div
                    className={classes.displayWrapper}
                    // YENİ: Animasyon varyantları tanımlanıyor
                    variants={{
                        hidden: { y: 20, x: "-50%", opacity: 0 },
                        visible: { y: 0, x: "-50%", opacity: 1 },
                    }}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                >
                    <Group gap="xs" align="center" noWrap>
                        {CurrentModeIcon && <CurrentModeIcon size={20} className={classes.displayIcon} stroke={2} />}
                        <Box>
                            {isRecipeRunning && currentStep ? (
                                <>
                                    <Text className={classes.displayLabel} truncate>
                                        {activeRecipe.name}
                                    </Text>
                                    <Text className={classes.displayValue}>
                                        {`Adım ${recipeStatus.currentStepIndex + 1}/${recipeStatus.totalSteps}`}
                                    </Text>
                                </>
                            ) : (
                                <>
                                    <Text className={classes.displayLabel}>AKTİF MOD</Text>
                                    <Text className={classes.displayValue}>{modeLabels[operatingMode]}</Text>
                                </>
                            )}
                        </Box>
                    </Group>
                </motion.div>
            )}
        </AnimatePresence>
    );
}