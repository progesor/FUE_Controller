// packages/frontend/src/components/recipe/RecipeEditor.tsx

import { useState, useCallback, useEffect } from 'react';
import { Stack, Button, Group, TextInput, Divider } from '@mantine/core';
import { IconDeviceFloppy, IconPlus } from '@tabler/icons-react';
import type { Recipe, RecipeStep } from '../../../../shared-types';
import { v4 as uuidv4 } from 'uuid';
import { RecipeStepEditor } from "./RecipeStepEditor.tsx";

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
    // Düzenlemek için mevcut bir reçete alabilir (veya null olabilir).
    initialRecipe?: Recipe | null;
    // Kullanıcı "Kaydet" butonuna tıkladığında tetiklenecek fonksiyon.
    onSave: (recipe: Recipe) => void;
    // Kullanıcı "İptal" butonuna tıkladığında tetiklenecek fonksiyon.
    onCancel: () => void;
}

/**
 * Reçete Editörü Ana Bileşeni
 * Artık bir Drawer içinde çalışacak şekilde tasarlandı.
 */
export function RecipeEditor({ initialRecipe, onSave, onCancel }: RecipeEditorProps) {
    // initialRecipe prop'u varsa onu, yoksa varsayılan bir reçeteyi state'e yükle.
    const [recipe, setRecipe] = useState<Recipe>(() => initialRecipe || createDefaultRecipe());

    // Eğer Drawer tekrar açıldığında farklı bir reçete gelirse, state'i güncelle.
    useEffect(() => {
        setRecipe(initialRecipe || createDefaultRecipe());
    }, [initialRecipe]);


    const handleUpdateStep = useCallback((index: number, updatedStep: RecipeStep) => {
        setRecipe(prevRecipe => {
            const newSteps = [...prevRecipe.steps];
            newSteps[index] = updatedStep;
            return { ...prevRecipe, steps: newSteps };
        });
    }, []);

    const handleAddStep = () => {
        const newStep: RecipeStep = {
            id: uuidv4(),
            mode: 'pulse',
            duration: 1000,
            settings: { pulseDuration: 150, pulseDelay: 300 }
        };
        setRecipe(prev => ({ ...prev, steps: [...prev.steps, newStep] }));
    };

    const handleDeleteStep = useCallback((index: number) => {
        setRecipe(prev => ({
            ...prev,
            steps: prev.steps.filter((_, i) => i !== index)
        }));
    }, []);

    const handleMoveStep = useCallback((index: number, direction: 'up' | 'down') => {
        setRecipe(prevRecipe => {
            const newSteps = [...prevRecipe.steps];
            const targetIndex = direction === 'up' ? index - 1 : index + 1;

            if (targetIndex < 0 || targetIndex >= newSteps.length) {
                return prevRecipe;
            }

            [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
            return { ...prevRecipe, steps: newSteps };
        });
    }, []);

    const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRecipe(prev => ({ ...prev, name: event.currentTarget.value }));
    };

    return (
        // Box yerine doğrudan Stack kullanarak bir seviye iç içeliği azaltalım.
        <Stack gap="xl" h="100%">
            {/* Butonları en üste taşıdık, daha iyi bir UX için */}
            <Group justify="flex-end">
                <Button variant="default" onClick={onCancel}>
                    İptal
                </Button>
                <Button
                    leftSection={<IconDeviceFloppy size={18} />}
                    onClick={() => onSave(recipe)}
                    disabled={!recipe.name || recipe.steps.length === 0}
                >
                    Kaydet ve Kapat
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

            {/* Adımların listelendiği alanın kendi içinde scroll olmasını sağlıyoruz */}
            <Stack gap="md" style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }}>
                {recipe.steps.map((step, index) => (
                    <RecipeStepEditor
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
    );
}