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
 * Sıradaki reçete adımını çalıştırır. RESTART (LOOP) mantığını içerir.
 */
const playNextStep = () => {
    if (!currentRecipe) return;

    // Eğer son adımdan da ileri gitmeye çalışıyorsak, reçeteyi güvenli bir şekilde kapat
    if (currentStepIndex + 1 >= currentRecipe.steps.length) {
        stopRecipe();
        return;
    }

    currentStepIndex++;
    const step = currentRecipe.steps[currentStepIndex];

    // YENİ: LOOP / RESTART MODÜLÜ
    // Eğer bu adım bir döngü/yeniden başlatma (loop) adımı ise:
    if (step.mode === 'loop' as any) {
        // 1. Motoru durdur.
        stopMotorFromRecipe();

        // 2. Kullanıcının girdiği Bekleme Süresi (step.duration) kadar bekle
        if (stepTimeout) clearTimeout(stepTimeout);
        stepTimeout = setTimeout(() => {
            if (!recipeStatus.isRunning) return; // O sırada iptal edildiyse dur

            // 3. Süre dolunca indeksi en başa (-1) sar ve yeniden ateşle!
            console.log("[RECIPE] Restart adımı tetiklendi. Program başa sarılıyor...");
            currentStepIndex = -1;
            playNextStep();
        }, step.duration);

        return; // Normal komutların cihaza gitmesini engellemek için buradan çıkıyoruz
    }

    // Normal bir adımsa, donanıma ilgili komutu gönder (Sürekli, Osilasyon vs.)
    executeStep(step);

    // Bu adımın çalışma süresi dolduğunda bir sonraki adıma geçmek için zamanlayıcı kur
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
// packages/backend/src/services/recipeService.ts İÇİNDEKİ FONKSİYONU DEĞİŞTİR:

export const stopRecipe = () => {
    if (!recipeStatus.isRunning) return;

    console.log("Reçete durduruluyor...");
    if (stepTimeout) clearTimeout(stepTimeout);
    if (statusInterval) clearInterval(statusInterval);

    // 1. ÖNEMLİ: Durumu motoru durdurmadan ÖNCE sıfırla ki arayüze (Logo'ya) temiz bilgi gitsin!
    currentRecipe = null;
    currentStepIndex = -1;
    recipeStatus.isRunning = false;
    recipeStatus.currentStepIndex = null;
    recipeStatus.remainingTimeInStep = 0;

    // 2. Motoru SONRA durdur (Böylece broadcast yaparken isRunning=false gidecek)
    stopMotorFromRecipe();

    io?.emit('recipe_status_update', recipeStatus);
};