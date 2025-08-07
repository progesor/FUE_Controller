// packages/frontend/src/components/aura/RecipeDrawer.tsx (HATA DÜZELTİLDİ)

import { ActionIcon, Box, Button, Group, ScrollArea, Text, TextInput } from '@mantine/core';
import { IconEdit, IconPlus } from '@tabler/icons-react';
import { useMemo, useState } from 'react';
import { useControllerStore } from '../../store/useControllerStore';
import classes from './RecipeDrawer.module.css';
import cx from 'clsx';
import type { Recipe } from '../../../../shared-types';
import { NotificationService } from '../../services/notificationService';
import { sendActiveRecipe } from '../../services/socketService'; // Gerekli import'u ekledim

export function RecipeDrawer() {
    const { isRecipeDrawerOpen, savedRecipes, activeRecipe, setActiveRecipe, toggleRecipeDrawer } = useControllerStore();
    const [search, setSearch] = useState('');

    const filteredRecipes = useMemo(
        () => savedRecipes.filter(r => r.name.toLowerCase().includes(search.toLowerCase())),
        [savedRecipes, search]
    );

    const handleActivateRecipe = (recipe: Recipe) => {
        setActiveRecipe(recipe);
        sendActiveRecipe(recipe); // Backend'e bildir
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
                        size="sm"
                    />
                    <Button
                        leftSection={<IconPlus size={20} />}
                        onClick={handleCreateRecipe}
                        className={classes.addButton}
                        size="sm"
                    >
                        Yeni
                    </Button>
                </Group>

                <ScrollArea className={classes.scrollArea}>
                    {filteredRecipes.length === 0 ? (
                        <Text c="dimmed" ta="center" pt="xl">Kayıtlı reçete bulunamadı.</Text>
                    ) : (
                        filteredRecipes.map(recipe => (
                            // DÜZELTME: UnstyledButton yerine Box kullanıldı.
                            // Bu, iç içe button hatasını çözer.
                            <Box
                                key={recipe.id}
                                className={cx(classes.recipeButton, { [classes.activeRecipe]: recipe.id === activeRecipe?.id })}
                                onClick={() => handleActivateRecipe(recipe)}
                            >
                                <Group justify="space-between" align="center" wrap="nowrap">
                                    <Text className={classes.recipeButtonText} truncate>{recipe.name}</Text>
                                    <ActionIcon
                                        size="md"
                                        variant="subtle"
                                        className={classes.editIcon}
                                        onClick={(e) => { e.stopPropagation(); handleEditRecipe(recipe); }}
                                        aria-label="Reçeteyi düzenle"
                                    >
                                        <IconEdit size={18} />
                                    </ActionIcon>
                                </Group>
                            </Box>
                        ))
                    )}
                </ScrollArea>
                <Text c="dimmed" fz="sm" ta="center" mt="md">
                    Aktif etmek için bir reçeteye dokunun.
                </Text>
            </Box>
        </Box>
    );
}
