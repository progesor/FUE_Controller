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
        <Group justify="center" gap="lg" style={{ perspective: '1000px' }}>
            <Button
                variant="default"
                classNames={{
                    root: cx(classes.presetButton, { [classes.active]: !activeRecipe && operatingMode === 'continuous' }),
                    inner: classes.buttonInner,
                    label: classes.buttonLabel
                }}
                onClick={() => handleBaseModeClick('continuous')}
                leftSection={<IconInfinity size={24} />}
            >
                <Text component="span" className={classes.buttonText}>Continuous</Text>
            </Button>

            <Button
                variant="default"
                classNames={{
                    root: cx(classes.presetButton, { [classes.active]: !activeRecipe && operatingMode === 'oscillation' }),
                    inner: classes.buttonInner,
                    label: classes.buttonLabel
                }}
                onClick={() => handleBaseModeClick('oscillation')}
                leftSection={<IconRepeat size={24} />}
            >
                <Text component="span" className={classes.buttonText}>Oscillation</Text>
            </Button>

            {favoriteRecipes.map((recipe) => (
                <Button
                    key={recipe.id}
                    variant="default"
                    color="orange"
                    classNames={{
                        root: cx(classes.presetButton, { [classes.active]: activeRecipe?.id === recipe.id }),
                        inner: classes.buttonInner,
                        label: classes.buttonLabel
                    }}
                    onClick={() => handleRecipeClick(recipe)}
                    leftSection={<IconStar size={24} color={activeRecipe?.id === recipe.id ? "white" : "orange"} />}
                >
                    <Text component="span" className={classes.buttonText}>{recipe.name}</Text>
                </Button>
            ))}
        </Group>
    );
}