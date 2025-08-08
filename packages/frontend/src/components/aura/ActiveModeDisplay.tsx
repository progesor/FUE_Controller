// packages/frontend/src/components/aura/ActiveModeDisplay.tsx

import { Group, Text, Box } from '@mantine/core';
import { useControllerStore } from '../../store/useControllerStore';
import classes from './ActiveModeDisplay.module.css';
import { AnimatePresence, motion } from 'framer-motion';
import { IconInfinity, IconRepeat, IconActivity, IconWaveSine, IconBook } from '@tabler/icons-react';
import type { OperatingMode, RecipeStep } from '../../../../shared-types';

const modeIcons: Record<OperatingMode | 'recipe', React.ElementType> = {
    continuous: IconInfinity,
    oscillation: IconRepeat,
    pulse: IconActivity,
    vibration: IconWaveSine,
    recipe: IconBook,
};

const modeLabels: Record<OperatingMode, string> = {
    continuous: 'Sürekli Mod',
    oscillation: 'Osilasyon Modu',
    pulse: 'Darbe Modu',
    vibration: 'Titreşim Modu',
};

export function ActiveModeDisplay() {
    const { motor, operatingMode, recipeStatus, activeRecipe } = useControllerStore();

    // --- RENDER LOGIC ---
    // Render nothing if the motor is off
    if (!motor.isActive) {
        return null;
    }

    // Default values for manual mode
    let displayLabel = "AKTİF MOD";
    let displayValue = modeLabels[operatingMode];
    let DisplayIcon = modeIcons[operatingMode];

    // Check for recipe mode and safely override defaults
    if (recipeStatus.isRunning && activeRecipe && recipeStatus.currentStepIndex !== null) {
        // Inside this block, TypeScript knows currentStepIndex is a 'number'
        const currentStep: RecipeStep | undefined = activeRecipe.steps[recipeStatus.currentStepIndex];

        if (currentStep) {
            displayLabel = activeRecipe.name;
            displayValue = `Adım ${recipeStatus.currentStepIndex + 1}/${recipeStatus.totalSteps}`;
            DisplayIcon = modeIcons[currentStep.mode];
        }
    }

    return (
        <AnimatePresence>
            <motion.div
                className={classes.displayWrapper}
                variants={{
                    hidden: { y: 20, x: "-50%", opacity: 0 },
                    visible: { y: 0, x: "-50%", opacity: 1 },
                }}
                initial="hidden"
                animate="visible"
                exit="hidden"
                transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            >
                <Group gap="xs" align="center" wrap="nowrap">
                    {DisplayIcon && <DisplayIcon size={20} className={classes.displayIcon} stroke={2} />}
                    <Box>
                        <Text className={classes.displayLabel} truncate>
                            {displayLabel}
                        </Text>
                        <Text className={classes.displayValue}>
                            {displayValue}
                        </Text>
                    </Box>
                </Group>
            </motion.div>
        </AnimatePresence>
    );
}