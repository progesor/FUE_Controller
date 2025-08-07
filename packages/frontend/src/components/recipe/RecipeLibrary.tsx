// packages/frontend/src/components/recipe/RecipeLibrary.tsx

import { ScrollArea, Stack, Group, Text, Button, Paper, UnstyledButton, Divider, ActionIcon } from '@mantine/core';
import { IconTrash, IconPencil } from '@tabler/icons-react';
import { useControllerStore } from '../../store/useControllerStore';
import type { Recipe } from '../../../../shared-types';
import {sendActiveRecipe, sendRecipeDelete} from '../../services/socketService';
import { NotificationService } from '../../services/notificationService';
import { useState } from 'react';

interface RecipeLibraryProps {
    onEdit: (recipe: Recipe) => void; // Bir reçeteyi düzenlemek için tetiklenecek fonksiyon
}

export function RecipeLibrary({ onEdit }: RecipeLibraryProps) {
    const { savedRecipes, activeRecipe, setActiveRecipe } = useControllerStore();
    const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);

    // Bu fonksiyon bir reçeteyi SADECE AKTİF yapar.
    const handleActivateRecipe = (recipe: Recipe) => {
        setActiveRecipe(recipe); // Frontend state'ini güncelle
        sendActiveRecipe(recipe); // YENİ: Backend'e de bu reçetenin aktif olduğunu bildir
        NotificationService.showSuccess(`'${recipe.name}' aktif reçete olarak ayarlandı.`);
    };

    const handleDeleteSelectedRecipe = () => {
        if (!selectedRecipeId) return;
        const recipeToDelete = savedRecipes.find(r => r.id === selectedRecipeId);
        if (recipeToDelete) {
            sendRecipeDelete(selectedRecipeId);
            NotificationService.showSuccess(`'${recipeToDelete.name}' silindi.`);
            setSelectedRecipeId(null);
        }
    };

    return (
        <Paper withBorder p="md" radius="sm" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

            <Stack gap="xs" style={{ flex: 1 }}>
                {/* Aktif Reçete Bilgisi */}
                <Group justify="space-between">
                    <Text fz="xs" c="dimmed">AKTİF REÇETE</Text>
                    {activeRecipe && (
                        <Button
                            size="compact-xs"
                            variant="light"
                            leftSection={<IconPencil size={14} />}
                            onClick={() => onEdit(activeRecipe)}
                        >
                            Düzenle
                        </Button>
                    )}

                </Group>
                <Text fw={500}>
                    {activeRecipe ? activeRecipe.name : 'Hiçbiri Seçili Değil'}

                </Text>

                <Divider my="xs" />

                {/* Reçete Listesi */}
                <Text fz="xs" c="dimmed">(Aktif yapmak için çift tıkla)</Text>

                <ScrollArea style={{ flex: 1 }}>

                    {savedRecipes.length === 0 ? (
                        <Text c="dimmed" ta="center" pt="xl">Kayıtlı reçete yok.</Text>
                    ) : (
                        savedRecipes.map(recipe => (
                            <UnstyledButton
                                key={recipe.id}
                                onClick={() => setSelectedRecipeId(recipe.id)}
                                onDoubleClick={() => handleActivateRecipe(recipe)}
                                p="xs"
                                style={{
                                    display: 'block',
                                    width: '100%',
                                    backgroundColor: recipe.id === selectedRecipeId ? 'var(--mantine-color-dark-6)' : 'transparent',
                                    borderRadius: 'var(--mantine-radius-sm)'
                                }}
                            >
                                <Text size="sm" fw={recipe.id === activeRecipe?.id ? 700 : 400} c={recipe.id === activeRecipe?.id ? 'blue.4' : 'inherit'}>
                                    {recipe.name}
                                </Text>
                            </UnstyledButton>
                        ))
                    )}

                    <ActionIcon
                        variant="filled"
                        color="red"
                        onClick={handleDeleteSelectedRecipe}
                        disabled={!selectedRecipeId}
                        title="Seçili reçeteyi sil"
                        style={{ position: 'absolute', bottom: '12px', right: '12px' }}
                    >
                        <IconTrash size={16} />
                    </ActionIcon>
                </ScrollArea>
            </Stack>
        </Paper>
    );
}