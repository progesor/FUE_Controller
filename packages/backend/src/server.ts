// packages/backend/src/server.ts

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import config from './config';
import {
    ClientToServerEvents,
    ContinuousSettings,
    PulseSettings, Recipe,
    ServerToClientEvents,
    VibrationSettings
} from '../../shared-types';
import {
    connectToArduino,
    initializeArduinoService,
    setMotorPwm,
    setMotorDirection,
    stopMotor,
    startMotor,
    startOscillation,
    setOscillationSettings,
    setOperatingMode,
    getIsArduinoConnected,
    sendRawArduinoCommand,
    setPulseSettings,
    setVibrationSettings,
    setContinuousSettings, setActiveRecipe, startCurrentMode
} from './services/arduinoService';
import {getCalibrationData} from "./services/calibrationService";
import {initializeRecipeService, startRecipe, stopRecipe} from "./services/recipeService";
import {deleteRecipe, listRecipes, saveRecipe} from "./services/recipePersistenceService";

// ===================================================================
//
//                        FUE CONTROLLER BACKEND SUNUCUSU
//
// -------------------------------------------------------------------
// Açıklama:
// Bu dosya, projenin backend sunucusunu başlatır. Express.js ile temel
// bir HTTP sunucusu kurar ve bu sunucu üzerine Socket.IO'yu entegre
// ederek frontend ile gerçek zamanlı çift yönlü iletişim sağlar.
// Gelen tüm komutları `arduinoService`'e yönlendirir.
//
// ===================================================================


// --- Sunucu ve Socket.IO Kurulumu ---

const app = express();
const httpServer = createServer(app);

// Socket.IO sunucusunu, paylaşılan tipleri (shared-types) kullanarak
// tip-güvenli (type-safe) bir şekilde oluştur. Bu sayede, gönderilen ve
// alınan olayların veri yapıları TypeScript tarafından kontrol edilir.
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: config.socket.cors // Frontend'den gelen isteklere izin vermek için CORS ayarları
});

const PORT = config.server.port;

initializeRecipeService(io);


// --- Temel HTTP Endpoint ---

// Sunucunun çalışıp çalışmadığını kontrol etmek için basit bir test endpoint'i.
// Tarayıcıdan http://localhost:3000 adresine gidildiğinde bu mesaj görünür.
app.get('/', (req, res) => {
    res.send('FUE Controller Backend çalışıyor!');
});


// ===================================================================
//                        Socket.IO Olay Yönetimi
// ===================================================================

// 'connection' olayı, yeni bir frontend istemcisi bağlandığında tetiklenir.
io.on('connection', (socket) => {
    console.log(`Bir istemci bağlandı: ${socket.id}`);

    if (getIsArduinoConnected()) {
        socket.emit('arduino_connected');
    } else {
        socket.emit('arduino_disconnected');
    }

    // --- Frontend'den Gelen Olayları Dinleme ---
    // Her bir 'socket.on' dinleyicisi, frontend'deki bir kullanıcı
    // etkileşimine karşılık gelir ve ilgili arduinoService fonksiyonunu çağırır.

    socket.on('set_motor_pwm', (value) => {
        console.log(`[Client -> Server]: set_motor_pwm isteği: ${value}`);
        setMotorPwm(value);
    });

    socket.on('set_motor_direction', (direction) => {
        console.log(`[Client -> Server]: set_motor_direction isteği: ${direction}`);
        setMotorDirection(direction);
    });

    socket.on('start_motor', () => {
        console.log(`[Client -> Server]: start_motor isteği`);
        startCurrentMode(); // Değişiklik burada
    });

    socket.on('stop_motor', () => {
        console.log(`[Client -> Server]: stop_motor isteği`);
        stopMotor();
    });

    socket.on('start_oscillation', (options) => {
        console.log(`[Client -> Server]: start_oscillation isteği:`, options);
        startOscillation(options);
    });

    socket.on('set_operating_mode', (mode) => {
        console.log(`[Client -> Server]: set_operating_mode isteği: ${mode}`);
        setOperatingMode(mode);
    });

    socket.on('set_oscillation_settings', (settings) => {
        console.log(`[Client -> Server]: set_oscillation_settings isteği:`, settings);
        setOscillationSettings(settings);
    });

    socket.on('set_pulse_settings', (settings: PulseSettings) => {
        console.log(`[Client -> Server]: set_pulse_settings isteği:`, settings);
        setPulseSettings(settings);
    });

    socket.on('set_vibration_settings', (settings: VibrationSettings) => {
        console.log(`[Client -> Server]: set_vibration_settings isteği:`, settings);
        setVibrationSettings(settings);
    });

    socket.on('set_continuous_settings', (settings: ContinuousSettings) => {
        console.log(`[Client -> Server]: set_continuous_settings isteği:`, settings);
        setContinuousSettings(settings);
    });

    socket.on('recipe_start', (recipe) => {
        console.log(`[Client -> Server]: recipe_start isteği: ${recipe.name}`);
        startRecipe(recipe);
    });

    socket.on('recipe_stop', () => {
        console.log(`[Client -> Server]: recipe_stop isteği`);
        stopRecipe();
    });

    listRecipes().then(recipes => {
        socket.emit('recipe_list_update', recipes);
    });

    // YENİ: Arayüzden gelen aktif reçete seçimini dinle ve servise ilet
    socket.on('set_active_recipe', (recipe: Recipe | null) => {
        console.log(`[Client -> Server]: Aktif reçete ayarlandı: ${recipe?.name || 'Hiçbiri'}`);
        setActiveRecipe(recipe);
    });

    socket.on('recipe_save', async (recipe) => {
        console.log(`[Client -> Server]: recipe_save isteği: ${recipe.name}`);
        const updatedRecipes = await saveRecipe(recipe);
        // Değişikliği tüm istemcilere yayınla
        io.emit('recipe_list_update', updatedRecipes);
    });

    socket.on('recipe_delete', async (recipeId) => {
        console.log(`[Client -> Server]: recipe_delete isteği: ${recipeId}`);
        const updatedRecipes = await deleteRecipe(recipeId);
        // Değişikliği tüm istemcilere yayınla
        io.emit('recipe_list_update', updatedRecipes);
    });

    // 'disconnect' olayı, bir istemcinin bağlantısı koptuğunda tetiklenir.
    socket.on('disconnect', () => {
        console.log(`İstemcinin bağlantısı kesildi: ${socket.id}`);
    });

    // Ar-Ge panelinden gelen kalibrasyon verisi isteğini dinle
    socket.on('get_calibration_data', (data) => {
        console.log(`[Client -> Server]: get_calibration_data isteği:`, data);

        const calibrationData = getCalibrationData(data.rpm, data.angle);

        if (calibrationData) {
            socket.emit('calibration_data_response', calibrationData);
        } else {
            // İsteğe bağlı: Arayüze bir hata durumu da gönderebiliriz.
            // Şimdilik sadece sunucu konsoluna log basmak yeterli.
            console.error(`İstenen RPM (${data.rpm}) ve Açı (${data.angle}) için kalibrasyon verisi bulunamadı.`);
        }
    });

    // Ar-Ge panelinden gelen ham komutları dinle
    socket.on('send_raw_command', (command) => {
        console.log(`[Ar-Ge Client -> Server]: Ham komut isteği: ${command}`);
        sendRawArduinoCommand(command); // Doğrudan arduinoService'e pasla
    });
});


// ===================================================================
//                        Sunucuyu Başlatma
// ===================================================================

httpServer.listen(PORT, () => {
    console.log(`Backend sunucusu http://localhost:${PORT} adresinde başlatıldı.`);

    // Arduino servisini, tüm istemcilere yayın yapabilmesi için
    // oluşturduğumuz 'io' nesnesi ile başlat.
    initializeArduinoService(io);

    // Arduino'ya bağlanma sürecini başlat.
    connectToArduino();
});