// packages/frontend/src/components/recipe/RecipeEditor.tsx

import { useState, useCallback, useEffect } from 'react';
import { Stack, Button, Group, TextInput, Divider } from '@mantine/core';
import { IconDeviceFloppy, IconPlus } from '@tabler/icons-react';
import type { Recipe, RecipeStep } from '../../../../shared-types';
import { v4 as uuidv4 } from 'uuid';
import { RecipeStepEditor } from "./RecipeStepEditor.tsx";

const createDefaultRecipe = (): Recipe => ({
    id: uuidv4(),
    name: 'Yeni Operasyon Reçetesi',
    steps: [
        {
            id: uuidv4(),
            mode: 'continuous',
            duration: 2000,
            settings: { rampDuration: 500 }
        }
    ]
});

interface RecipeEditorProps {
    initialRecipe?: Recipe | null;
    onSave: (recipe: Recipe) => void;
    onCancel: () => void;
}

export function RecipeEditor({ initialRecipe, onSave, onCancel }: RecipeEditorProps) {
    // --- YENİ VE GÜVENLİ STATE YÖNETİMİ ---
    // Reçetenin her parçasını ayrı bir state'te tutuyoruz.
    const [id, setId] = useState<string>('');
    const [name, setName] = useState<string>('');
    const [steps, setSteps] = useState<RecipeStep[]>([]);

    // initialRecipe değiştiğinde, tüm state'leri güvenli bir şekilde güncelliyoruz.
    useEffect(() => {
        const recipeToLoad = initialRecipe || createDefaultRecipe();
        setId(recipeToLoad.id);
        setName(recipeToLoad.name);
        setSteps(recipeToLoad.steps);
    }, [initialRecipe]);

    const handleUpdateStep = useCallback((index: number, updatedStep: RecipeStep) => {
        setSteps(currentSteps => {
            const newSteps = [...currentSteps];
            newSteps[index] = updatedStep;
            return newSteps;
        });
    }, []);

    const handleAddStep = () => {
        const newStep: RecipeStep = {
            id: uuidv4(),
            mode: 'pulse',
            duration: 1000,
            settings: { pulseDuration: 150, pulseDelay: 300 }
        };
        setSteps(currentSteps => [...currentSteps, newStep]);
    };

    const handleDeleteStep = useCallback((index: number) => {
        setSteps(currentSteps => currentSteps.filter((_, i) => i !== index));
    }, []);

    const handleMoveStep = useCallback((index: number, direction: 'up' | 'down') => {
        setSteps(currentSteps => {
            const newSteps = [...currentSteps];
            const targetIndex = direction === 'up' ? index - 1 : index + 1;

            if (targetIndex < 0 || targetIndex >= newSteps.length) {
                return newSteps;
            }

            [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
            return newSteps;
        });
    }, []);

    // Kaydetme işlemi, ayrı state'leri tekrar bir Recipe nesnesinde birleştirir.
    const handleSave = () => {
        const recipeToSave: Recipe = { id, name, steps };
        onSave(recipeToSave);
    };

    return (
        <Stack gap="xl" h="100%">
            <Group justify="flex-end">
                <Button variant="default" onClick={onCancel}>
                    İptal
                </Button>
                <Button
                    leftSection={<IconDeviceFloppy size={18} />}
                    onClick={handleSave}
                    disabled={!name || steps.length === 0}
                >
                    Kaydet ve Kapat
                </Button>
            </Group>

            <TextInput
                label="Reçete Adı"
                placeholder="Örn: Sert Doku için Başlangıç Protokolü"
                value={name} // Doğrudan 'name' state'ine bağlandı.
                onChange={(event) => setName(event.currentTarget.value)} // Sadece 'name' state'ini günceller.
                required
            />

            <Divider my="xs" label="Reçete Adımları" labelPosition="center" />

            <Stack gap="md" style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }}>
                {steps.map((step, index) => (
                    <RecipeStepEditor
                        key={step.id}
                        step={step}
                        index={index}
                        totalSteps={steps.length}
                        onUpdate={handleUpdateStep}
                        onDelete={handleDeleteStep}
                        onMove={handleMoveStep}
                    />
                ))}
            </Stack>

            <Button
                leftSection={<IconPlus size={18} />}
                variant="outline"
                onClick={handleAddStep}
                fullWidth
                mt="md"
            >
                Yeni Adım Ekle
            </Button>
        </Stack>
    );
}