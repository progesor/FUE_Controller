"use strict";
// packages/backend/src/services/recipePersistenceService.ts
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteRecipe = exports.saveRecipe = exports.listRecipes = void 0;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
// Reçetelerin saklanacağı dosyanın yolu
const RECIPES_FILE_PATH = path.join(__dirname, '..', '..', 'recipes.json');
/**
 * Dosyadan tüm reçeteleri okur. Dosya yoksa boş bir dizi döner.
 */
const readRecipesFromFile = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield fs.access(RECIPES_FILE_PATH);
        const fileContent = yield fs.readFile(RECIPES_FILE_PATH, 'utf-8');
        return JSON.parse(fileContent);
    }
    catch (error) {
        // Dosya yoksa veya okuma hatası olursa, boş bir listeyle başla
        return [];
    }
});
/**
 * Verilen reçete dizisini dosyaya yazar.
 */
const writeRecipesToFile = (recipes) => __awaiter(void 0, void 0, void 0, function* () {
    yield fs.writeFile(RECIPES_FILE_PATH, JSON.stringify(recipes, null, 2), 'utf-8');
});
/**
 * Kayıtlı tüm reçetelerin bir listesini döner.
 */
const listRecipes = () => __awaiter(void 0, void 0, void 0, function* () {
    return yield readRecipesFromFile();
});
exports.listRecipes = listRecipes;
/**
 * Yeni bir reçeteyi kaydeder veya mevcut bir reçeteyi günceller.
 */
const saveRecipe = (recipeToSave) => __awaiter(void 0, void 0, void 0, function* () {
    const recipes = yield readRecipesFromFile();
    const existingRecipeIndex = recipes.findIndex(r => r.id === recipeToSave.id);
    if (existingRecipeIndex > -1) {
        // Reçete zaten var, güncelle
        recipes[existingRecipeIndex] = recipeToSave;
    }
    else {
        // Yeni reçete, listeye ekle
        recipes.push(recipeToSave);
    }
    yield writeRecipesToFile(recipes);
    return recipes; // Güncel listeyi dön
});
exports.saveRecipe = saveRecipe;
/**
 * Belirtilen ID'ye sahip reçeteyi siler.
 */
const deleteRecipe = (recipeId) => __awaiter(void 0, void 0, void 0, function* () {
    let recipes = yield readRecipesFromFile();
    recipes = recipes.filter(r => r.id !== recipeId);
    yield writeRecipesToFile(recipes);
    return recipes; // Güncel listeyi dön
});
exports.deleteRecipe = deleteRecipe;
