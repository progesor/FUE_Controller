"use strict";
// packages/backend/src/services/recipeService.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.stopRecipe = exports.startRecipe = exports.initializeRecipeService = exports.getRecipeStatus = void 0;
const arduinoService_1 = require("./arduinoService"); // arduinoService'den gelecek yeni fonksiyonlar
let io = null;
// Reçetenin anlık durumunu tutacak olan state
let currentRecipe = null;
let currentStepIndex = -1;
let stepTimeout = null;
let statusInterval = null;
const recipeStatus = {
    isRunning: false,
    currentStepIndex: null,
    totalSteps: 0,
    remainingTimeInStep: 0,
};
const getRecipeStatus = () => {
    return recipeStatus;
};
exports.getRecipeStatus = getRecipeStatus;
/**
 * Recipe servisini ana Socket.IO sunucu örneği ile başlatır.
 */
const initializeRecipeService = (socketIoServer) => {
    io = socketIoServer;
};
exports.initializeRecipeService = initializeRecipeService;
/**
 * Sıradaki reçete adımını çalıştırır.
 */
const playNextStep = () => {
    if (!currentRecipe || currentStepIndex >= currentRecipe.steps.length - 1) {
        (0, exports.stopRecipe)();
        return;
    }
    currentStepIndex++;
    const step = currentRecipe.steps[currentStepIndex];
    let remainingTime = step.duration;
    recipeStatus.currentStepIndex = currentStepIndex;
    recipeStatus.totalSteps = currentRecipe.steps.length;
    (0, arduinoService_1.executeStep)(step);
    // YENİ: Kalan süreyi periyodik olarak güncelleyen ve yayınlayan interval
    if (statusInterval)
        clearInterval(statusInterval);
    statusInterval = setInterval(() => {
        remainingTime -= 100; // Her 100ms'de bir azalt
        recipeStatus.remainingTimeInStep = Math.max(0, remainingTime);
    }, 100);
    // Bu adımın süresi dolduğunda bir sonrakine geçmek için zamanlayıcı kur
    if (stepTimeout)
        clearTimeout(stepTimeout);
    stepTimeout = setTimeout(playNextStep, step.duration);
};
/**
 * Reçeteyi başlatır.
 */
const startRecipe = (recipe) => {
    if (recipeStatus.isRunning) {
        console.warn("Zaten bir reçete çalışıyor. Önce durdurun.");
        return;
    }
    console.log(`Reçete başlatılıyor: ${recipe.name}`);
    currentRecipe = recipe;
    recipeStatus.isRunning = true;
    playNextStep(); // İlk adımı başlat
};
exports.startRecipe = startRecipe;
/**
 * Çalışan reçeteyi durdurur.
 */
const stopRecipe = () => {
    if (!recipeStatus.isRunning)
        return;
    console.log("Reçete durduruluyor...");
    if (stepTimeout)
        clearTimeout(stepTimeout);
    // YENİ: Durum interval'ini de temizlediğimizden emin oluyoruz
    if (statusInterval)
        clearInterval(statusInterval);
    (0, arduinoService_1.stopMotorFromRecipe)();
    // Durumu sıfırla
    currentRecipe = null;
    currentStepIndex = -1;
    recipeStatus.isRunning = false;
    recipeStatus.currentStepIndex = null;
    recipeStatus.remainingTimeInStep = 0;
};
exports.stopRecipe = stopRecipe;
