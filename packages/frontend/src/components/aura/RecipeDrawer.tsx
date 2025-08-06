// packages/frontend/src/components/aura/RecipeDrawer.tsx (GÜNCELLENMİŞ HALİ)

import { ActionIcon, Box, Button, Group, ScrollArea, Text, TextInput, UnstyledButton } from '@mantine/core';
import { IconEdit, IconPlus } from '@tabler/icons-react';
import { useMemo, useState } from 'react';
import { useControllerStore } from '../../store/useControllerStore';
import classes from './RecipeDrawer.module.css';
import cx from 'clsx';
import type { Recipe } from '../../../../shared-types';
import { NotificationService } from '../../services/notificationService';

export function RecipeDrawer() {
    const { isRecipeDrawerOpen, savedRecipes, activeRecipe, setActiveRecipe, toggleRecipeDrawer } = useControllerStore();
    const [search, setSearch] = useState('');

    const filteredRecipes = useMemo(
        () => savedRecipes.filter(r => r.name.toLowerCase().includes(search.toLowerCase())),
        [savedRecipes, search]
    );

    const handleActivateRecipe = (recipe: Recipe) => {
        setActiveRecipe(recipe);
        NotificationService.showSuccess(`'${recipe.name}' aktif reçete olarak ayarlandı.`);
        toggleRecipeDrawer(false);
    };

    const handleCreateRecipe = () => {
        NotificationService.showInfo('Reçete editörü yakında eklenecek.');
    };

    const handleEditRecipe = (recipe: Recipe) => {
        NotificationService.showInfo(`'${recipe.name}' için düzenleme yakında eklenecek.`);
    };

    return (
        <Box
            className={cx(classes.drawerWrapper, { [classes.drawerOpen]: isRecipeDrawerOpen })}
            // Panelin dışına tıklandığında kapanması için bir olay ekleyelim
            onClick={(e) => {
                if (e.currentTarget === e.target) {
                    toggleRecipeDrawer(false);
                }
            }}
        >
            <Box className={classes.drawerContent}>
                <Text className={classes.drawerTitle}>Kütüphane</Text>
                <Group className={classes.header} gap="sm">
                    <TextInput
                        value={search}
                        onChange={(e) => setSearch(e.currentTarget.value)}
                        placeholder="Reçetelerde ara..."
                        className={classes.searchInput}
                        size="xs"
                    />
                    <Button
                        leftSection={<IconPlus size={16} />}
                        onClick={handleCreateRecipe}
                        className={classes.addButton}
                        size="xs"
                    >
                        Yeni
                    </Button>
                </Group>

                <ScrollArea className={classes.scrollArea}>
                    {filteredRecipes.length === 0 ? (
                        <Text c="dimmed" ta="center" pt="xl">Kayıtlı reçete bulunamadı.</Text>
                    ) : (
                        filteredRecipes.map(recipe => (
                            <UnstyledButton
                                key={recipe.id}
                                className={cx(classes.recipeButton, { [classes.activeRecipe]: recipe.id === activeRecipe?.id })}
                                onDoubleClick={() => handleActivateRecipe(recipe)}
                            >
                                <Group justify="space-between">
                                    <Text size="sm" className={classes.recipeButtonText}>{recipe.name}</Text>
                                    <ActionIcon
                                        size="sm"
                                        variant="subtle"
                                        className={classes.editIcon}
                                        onClick={(e) => { e.stopPropagation(); handleEditRecipe(recipe); }}
                                    >
                                        <IconEdit size={14} />
                                    </ActionIcon>
                                </Group>
                            </UnstyledButton>
                        ))
                    )}
                </ScrollArea>
                <Text c="dimmed" fz="xs" ta="center" mt="md">
                    Aktif etmek için bir reçeteye çift tıklayın.
                </Text>
            </Box>
        </Box>
    );
}
