// packages/frontend/src/components/panels/SettingsPanel.tsx

import { Paper, Title, Stack, Button, Drawer, Group } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus } from '@tabler/icons-react';
import { useControllerStore } from '../../store/useControllerStore';
import { RecipeEditor } from '../recipe/RecipeEditor';
import { NotificationService } from '../../services/notificationService';
import type { Recipe } from '../../../../shared-types';
import { ManualSettings } from './settings/ManualSettings';
import { RecipeLibrary } from '../recipe/RecipeLibrary';
import { sendRecipeSave } from '../../services/socketService';
import { useState } from 'react';

export function SettingsPanel() {
    const [drawerOpened, { open: openDrawer, close: closeDrawer }] = useDisclosure(false);
    const { setActiveRecipe } = useControllerStore();

    const [recipeToEdit, setRecipeToEdit] = useState<Recipe | null>(null);

    const handleSaveRecipe = (recipe: Recipe) => {
        setActiveRecipe(recipe);
        sendRecipeSave(recipe);
        NotificationService.showSuccess(`'${recipe.name}' aktif reçete olarak ayarlandı ve kaydedildi!`);
        closeDrawer();
    };

    // Bu fonksiyon artık SADECE editörü açma görevini üstleniyor.
    const handleEditRecipe = (recipe: Recipe) => {
        setRecipeToEdit(recipe);
        openDrawer();
    };

    const handleCreateNewRecipe = () => {
        setRecipeToEdit(null);
        openDrawer();
    };

    return (
        <>
            <Drawer
                opened={drawerOpened}
                onClose={closeDrawer}
                title="Reçete Editörü"
                position="right"
                size="xl"
                overlayProps={{ backgroundOpacity: 0.5, blur: 4 }}
                withCloseButton
            >
                <RecipeEditor
                    initialRecipe={recipeToEdit}
                    onSave={handleSaveRecipe}
                    onCancel={closeDrawer}
                />
            </Drawer>

            <Paper withBorder p="md" h="100%">
                <Stack h="100%">
                    <Group justify="space-between" align="center">
                        <Title order={3}>Reçete Paneli</Title>
                        <Button
                            leftSection={<IconPlus size={16} />}
                            variant="outline"
                            onClick={handleCreateNewRecipe}
                        >
                            Yeni Reçete
                        </Button>
                        <RecipeLibrary onEdit={handleEditRecipe} />
                    </Group>

                    <Title order={4} mt="md">Manuel Ayarlar</Title>
                    <ManualSettings />
                </Stack>
            </Paper>
        </>
    );
}