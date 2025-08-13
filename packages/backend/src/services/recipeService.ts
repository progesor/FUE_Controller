// packages/backend/src/services/recipeService.ts

import { Server } from 'socket.io';
import { executeStep, stopMotorFromRecipe } from './arduinoService';
import {ClientToServerEvents, Recipe, RecipeStatus, ServerToClientEvents} from "shared-types/index";

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

export const getRecipeStatus = () => {
    return recipeStatus;
};

/**
 * Recipe servisini ana Socket.IO sunucu örneği ile başlatır.
 */
export const initializeRecipeService = (socketIoServer: Server<ClientToServerEvents, ServerToClientEvents>) => {
    io = socketIoServer;
};

/**
 * Sıradaki reçete adımını çalıştırır.
 */
const playNextStep = () => {
    if (!currentRecipe || currentStepIndex >= currentRecipe.steps.length - 1) {
        stopRecipe();
        return;
    }

    currentStepIndex++;
    const step = currentRecipe.steps[currentStepIndex];
    let remainingTime = step.duration;

    recipeStatus.currentStepIndex = currentStepIndex;
    recipeStatus.totalSteps = currentRecipe.steps.length;

    executeStep(step);

    // YENİ: Kalan süreyi periyodik olarak güncelleyen ve yayınlayan interval
    if (statusInterval) clearInterval(statusInterval);
    statusInterval = setInterval(() => {
        remainingTime -= 100; // Her 100ms'de bir azalt
        recipeStatus.remainingTimeInStep = Math.max(0, remainingTime);
    }, 100);

    // Bu adımın süresi dolduğunda bir sonrakine geçmek için zamanlayıcı kur
    if (stepTimeout) clearTimeout(stepTimeout);
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
    // YENİ: Durum interval'ini de temizlediğimizden emin oluyoruz
    if (statusInterval) clearInterval(statusInterval);

    stopMotorFromRecipe();

    // Durumu sıfırla
    currentRecipe = null;
    currentStepIndex = -1;
    recipeStatus.isRunning = false;
    recipeStatus.currentStepIndex = null;
    recipeStatus.remainingTimeInStep = 0;

};