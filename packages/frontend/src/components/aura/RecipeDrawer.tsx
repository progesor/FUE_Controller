// packages/frontend/src/components/aura/RecipeDrawer.tsx (GÜNCELLENMİŞ HALİ)

import { Box, ScrollArea, Text, UnstyledButton } from '@mantine/core';
import { useControllerStore } from '../../store/useControllerStore';
import classes from './RecipeDrawer.module.css';
import cx from 'clsx';
import type { Recipe } from '../../../../shared-types';
import { NotificationService } from '../../services/notificationService';

export function RecipeDrawer() {
    const { isRecipeDrawerOpen, savedRecipes, activeRecipe, setActiveRecipe, toggleRecipeDrawer } = useControllerStore();

    // Fonksiyonun adı aynı kalabilir, ama artık çift tıklama ile tetiklenecek
    const handleActivateRecipe = (recipe: Recipe) => {
        setActiveRecipe(recipe);
        NotificationService.showSuccess(`'${recipe.name}' aktif reçete olarak ayarlandı.`);
        // Reçete seçildiğinde paneli kapat
        toggleRecipeDrawer(false);
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

                <ScrollArea className={classes.scrollArea}>
                    {savedRecipes.length === 0 ? (
                        <Text c="dimmed" ta="center" pt="xl">Kayıtlı reçete bulunamadı.</Text>
                    ) : (
                        savedRecipes.map(recipe => (
                            <UnstyledButton
                                key={recipe.id}
                                className={cx(classes.recipeButton, { [classes.activeRecipe]: recipe.id === activeRecipe?.id })}
                                // onClick -> onDoubleClick olarak değiştirildi
                                onDoubleClick={() => handleActivateRecipe(recipe)}
                            >
                                <Text size="sm" className={classes.recipeButtonText}>{recipe.name}</Text>
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