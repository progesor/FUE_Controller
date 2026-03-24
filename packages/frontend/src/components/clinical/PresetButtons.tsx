// packages/frontend/src/components/clinical/PresetButtons.tsx

import { Button, Group, Text } from '@mantine/core';
import { useControllerStore } from '../../store/useControllerStore';
import { sendActiveRecipe, sendOperatingMode } from '../../services/socketService';
import classes from './PresetButtons.module.css';
import cx from 'clsx';
import { IconStar, IconInfinity, IconRepeat } from '@tabler/icons-react';
import type { Recipe, OperatingMode } from '../../../../shared-types';

export function PresetButtons() {
    const { savedRecipes, activeRecipe, operatingMode, setOperatingMode, setActiveRecipe } = useControllerStore();

    // Sadece favoriye alınmış reçeteleri filtrele
    const favoriteRecipes = savedRecipes.filter(recipe => (recipe as any).isFavorite === true);

    const handleRecipeClick = (recipe: Recipe) => {
        setActiveRecipe(recipe);
        sendActiveRecipe(recipe);
    };

    const handleBaseModeClick = (mode: OperatingMode) => {
        setActiveRecipe(null);
        sendActiveRecipe(null);
        setOperatingMode(mode);
        sendOperatingMode(mode);
    };

    return (
        <Group justify="center" gap="lg">
            {/* SABİT MOD 1: CONTINUOUS */}
            <Button
                variant="default"
                className={cx(classes.presetButton, {
                    [classes.active]: !activeRecipe && operatingMode === 'continuous'
                })}
                onClick={() => handleBaseModeClick('continuous')}
                leftSection={<IconInfinity size={22} />}
            >
                <Text component="span" className={classes.buttonLabel}>Continuous</Text>
            </Button>

            {/* SABİT MOD 2: OSCILLATION */}
            <Button
                variant="default"
                className={cx(classes.presetButton, {
                    [classes.active]: !activeRecipe && operatingMode === 'oscillation'
                })}
                onClick={() => handleBaseModeClick('oscillation')}
                leftSection={<IconRepeat size={22} />}
            >
                <Text component="span" className={classes.buttonLabel}>Oscillation</Text>
            </Button>

            {/* DİNAMİK OLARAK EKLENEN FAVORİ REÇETELER */}
            {favoriteRecipes.map((recipe) => (
                <Button
                    key={recipe.id}
                    variant="default"
                    color="orange"
                    className={cx(classes.presetButton, {
                        [classes.active]: activeRecipe?.id === recipe.id
                    })}
                    onClick={() => handleRecipeClick(recipe)}
                    leftSection={<IconStar size={22} color={activeRecipe?.id === recipe.id ? "white" : "orange"} />}
                >
                    <Text component="span" className={classes.buttonLabel}>{recipe.name}</Text>
                </Button>
            ))}
        </Group>
    );
}