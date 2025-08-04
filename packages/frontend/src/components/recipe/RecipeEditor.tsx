// packages/frontend/src/components/recipe/RecipeEditor.tsx

import { useState, useCallback } from 'react';
import { Box, Stack, Button, Group, TextInput, Title, Divider } from '@mantine/core';
import { IconDeviceFloppy, IconPlus } from '@tabler/icons-react';
import type { Recipe, RecipeStep } from '../../../../shared-types';
import { v4 as uuidv4 } from 'uuid';
import {RecipeStepEditor} from "./RecipeStepEditor.tsx";

// Bileşene bir başlangıç reçetesi verilmezse kullanılacak varsayılan yapı.
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
    // Düzenlemek için mevcut bir reçete alabilir veya varsayılanı kullanabilir.
    initialRecipe?: Recipe;
    // Kullanıcı "Kaydet" butonuna tıkladığında tetiklenecek fonksiyon.
    onSave: (recipe: Recipe) => void;
}

/**
 * Reçete Editörü Ana Bileşeni
 * Kullanıcının operasyon akışlarını (reçeteleri) görsel olarak oluşturmasını,
 * düzenlemesini, adımları yönetmesini ve kaydetmesini sağlar.
 */
export function RecipeEditor({ initialRecipe, onSave }: RecipeEditorProps) {
    // initialRecipe prop'u varsa onu, yoksa varsayılan bir reçeteyi state'e yükle.
    const [recipe, setRecipe] = useState<Recipe>(initialRecipe || createDefaultRecipe());

    /**
     * Bir adımdaki değişiklikleri ana reçete state'ine işler.
     * RecipeStepEditor bileşeninden gelen güncellemeleri yönetir.
     * useCallback ile sarmalanarak alt bileşenlerin gereksiz yere render olması engellenir.
     */
    const handleUpdateStep = useCallback((index: number, updatedStep: RecipeStep) => {
        const newSteps = [...recipe.steps];
        newSteps[index] = updatedStep;
        setRecipe(prev => ({ ...prev, steps: newSteps }));
    }, [recipe.steps]); // Sadece adımlar değiştiğinde fonksiyon yeniden oluşturulur.

    /**
     * Reçeteye yeni bir varsayılan adım ekler.
     */
    const handleAddStep = () => {
        const newStep: RecipeStep = {
            id: uuidv4(), // Her adımın benzersiz bir anahtarı olmalı
            mode: 'pulse',
            duration: 1000,
            settings: { pulseDuration: 150, pulseDelay: 300 }
        };
        setRecipe(prev => ({ ...prev, steps: [...prev.steps, newStep] }));
    };

    /**
     * Belirtilen index'teki adımı reçeteden siler.
     * useCallback ile sarmalanmıştır.
     */
    const handleDeleteStep = useCallback((index: number) => {
        setRecipe(prev => ({
            ...prev,
            steps: prev.steps.filter((_, i) => i !== index)
        }));
    }, []);

    /**
     * Bir adımı listede yukarı veya aşağı taşır.
     * useCallback ile sarmalanmıştır.
     */
    const handleMoveStep = useCallback((index: number, direction: 'up' | 'down') => {
        const newSteps = [...recipe.steps];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        // Sınır kontrolü
        if (targetIndex < 0 || targetIndex >= newSteps.length) return;

        // Elemanların yerini değiştir (array destructuring ile pratik bir yöntem)
        [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
        setRecipe(prev => ({ ...prev, steps: newSteps }));
    }, [recipe.steps]);

    /**
     * Reçete adı input'undaki değişiklikleri state'e yansıtır.
     */
    const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRecipe(prev => ({ ...prev, name: event.currentTarget.value }));
    };

    return (
        <Box>
            <Stack gap="xl">
                <Group justify="space-between">
                    <Title order={3}>Reçete Editörü</Title>
                    <Button
                        leftSection={<IconDeviceFloppy size={18} />}
                        onClick={() => onSave(recipe)}
                        disabled={!recipe.name || recipe.steps.length === 0}
                    >
                        Reçeteyi Kaydet
                    </Button>
                </Group>

                <TextInput
                    label="Reçete Adı"
                    placeholder="Örn: Sert Doku için Başlangıç Protokolü"
                    value={recipe.name}
                    onChange={handleNameChange}
                    required
                />

                <Divider my="xs" label="Reçete Adımları" labelPosition="center" />

                <Stack gap="md">
                    {recipe.steps.map((step, index) => (
                        <RecipeStepEditor
                            // React'in listeleri verimli bir şekilde güncellemesi için benzersiz anahtar.
                            key={step.id}
                            step={step}
                            index={index}
                            totalSteps={recipe.steps.length}
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
        </Box>
    );
}