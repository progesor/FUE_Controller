// packages/backend/src/services/recipePersistenceService.ts

import * as fs from 'fs/promises';
import * as path from 'path';
import type { Recipe } from '../../../shared-types';

// Reçetelerin saklanacağı dosyanın yolu
const RECIPES_FILE_PATH = path.join(__dirname, '..', '..', 'recipes.json');

/**
 * Dosyadan tüm reçeteleri okur. Dosya yoksa boş bir dizi döner.
 */
const readRecipesFromFile = async (): Promise<Recipe[]> => {
    try {
        await fs.access(RECIPES_FILE_PATH);
        const fileContent = await fs.readFile(RECIPES_FILE_PATH, 'utf-8');
        return JSON.parse(fileContent) as Recipe[];
    } catch (error) {
        // Dosya yoksa veya okuma hatası olursa, boş bir listeyle başla
        return [];
    }
};

/**
 * Verilen reçete dizisini dosyaya yazar.
 */
const writeRecipesToFile = async (recipes: Recipe[]): Promise<void> => {
    await fs.writeFile(RECIPES_FILE_PATH, JSON.stringify(recipes, null, 2), 'utf-8');
};

/**
 * Kayıtlı tüm reçetelerin bir listesini döner.
 */
export const listRecipes = async (): Promise<Recipe[]> => {
    return await readRecipesFromFile();
};

/**
 * Yeni bir reçeteyi kaydeder veya mevcut bir reçeteyi günceller.
 */
export const saveRecipe = async (recipeToSave: Recipe): Promise<Recipe[]> => {
    const recipes = await readRecipesFromFile();
    const existingRecipeIndex = recipes.findIndex(r => r.id === recipeToSave.id);

    if (existingRecipeIndex > -1) {
        // Reçete zaten var, güncelle
        recipes[existingRecipeIndex] = recipeToSave;
    } else {
        // Yeni reçete, listeye ekle
        recipes.push(recipeToSave);
    }

    await writeRecipesToFile(recipes);
    return recipes; // Güncel listeyi dön
};

/**
 * Belirtilen ID'ye sahip reçeteyi siler.
 */
export const deleteRecipe = async (recipeId: string): Promise<Recipe[]> => {
    let recipes = await readRecipesFromFile();
    recipes = recipes.filter(r => r.id !== recipeId);
    await writeRecipesToFile(recipes);
    return recipes; // Güncel listeyi dön
};