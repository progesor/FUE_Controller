// packages/backend/src/services/recipeService.ts

import { Server } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents, Recipe, RecipeStep, RecipeStatus } from '../../../shared-types';
import { executeStep, stopMotorFromRecipe } from './arduinoService'; // arduinoService'den gelecek yeni fonksiyonlar

let io: Server<ClientToServerEvents, ServerToClientEvents> | null = null;

// Reçetenin anlık durumunu tutacak olan state
let currentRecipe: Recipe | null = null;
let currentStepIndex: number = -1;
let stepTimeout: NodeJS.Timeout | null = null;
let statusInterval: NodeJS.Timeout | null = null;

const recipeStatus: RecipeStatus = {
    isRunning: false,
    currentStepIndex: null,
    totalSteps: 0,
    remainingTimeInStep: 0,
};

/**
 * Recipe servisini ana Socket.IO sunucu örneği ile başlatır.
 */
export const initializeRecipeService = (socketIoServer: Server<ClientToServerEvents, ServerToClientEvents>) => {
    io = socketIoServer;
};

/**
 * Reçetenin anlık durumunu tüm istemcilere yayınlar.
 */
const broadcastRecipeStatus = () => {
    io?.emit('recipe_status_update', recipeStatus);
};

/**
 * Sıradaki reçete adımını çalıştırır.
 */
const playNextStep = () => {
    if (!currentRecipe || currentStepIndex >= currentRecipe.steps.length - 1) {
        stopRecipe(); // Reçete bitti
        return;
    }

    currentStepIndex++;
    const step = currentRecipe.steps[currentStepIndex];

    recipeStatus.currentStepIndex = currentStepIndex;
    recipeStatus.totalSteps = currentRecipe.steps.length;
    recipeStatus.remainingTimeInStep = step.duration;

    executeStep(step); // Arduino servisine adımı çalıştırması için komut ver
    broadcastRecipeStatus();

    // Bu adımın süresi dolduğunda bir sonrakine geçmek için zamanlayıcı kur
    stepTimeout = setTimeout(playNextStep, step.duration);
};

/**
 * Reçeteyi başlatır.
 */
export const startRecipe = (recipe: Recipe) => {
    if (recipeStatus.isRunning) {
        console.warn("Zaten bir reçete çalışıyor. Önce durdurun.");
        return;
    }
    console.log(`Reçete başlatılıyor: ${recipe.name}`);
    currentRecipe = recipe;
    recipeStatus.isRunning = true;

    playNextStep(); // İlk adımı başlat
};

/**
 * Çalışan reçeteyi durdurur.
 */
export const stopRecipe = () => {
    if (!recipeStatus.isRunning) return;

    console.log("Reçete durduruluyor...");
    if (stepTimeout) clearTimeout(stepTimeout);
    if (statusInterval) clearInterval(statusInterval);

    stopMotorFromRecipe(); // Motoru durdur

    // Durumu sıfırla
    currentRecipe = null;
    currentStepIndex = -1;
    recipeStatus.isRunning = false;
    recipeStatus.currentStepIndex = null;
    recipeStatus.remainingTimeInStep = 0;

    broadcastRecipeStatus();
};