"use strict";
// packages/backend/src/server.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const config_1 = __importDefault(require("./config"));
const arduinoService_1 = require("./services/arduinoService");
const calibrationService_1 = require("./services/calibrationService");
const recipeService_1 = require("./services/recipeService");
const recipePersistenceService_1 = require("./services/recipePersistenceService");
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
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
// Socket.IO sunucusunu, paylaşılan tipleri (shared-types) kullanarak
// tip-güvenli (type-safe) bir şekilde oluştur. Bu sayede, gönderilen ve
// alınan olayların veri yapıları TypeScript tarafından kontrol edilir.
const io = new socket_io_1.Server(httpServer, {
    cors: config_1.default.socket.cors // Frontend'den gelen isteklere izin vermek için CORS ayarları
});
const PORT = config_1.default.server.port;
(0, recipeService_1.initializeRecipeService)(io);
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
    if ((0, arduinoService_1.getIsArduinoConnected)()) {
        socket.emit('arduino_connected');
    }
    else {
        socket.emit('arduino_disconnected');
    }
    // --- Frontend'den Gelen Olayları Dinleme ---
    // Her bir 'socket.on' dinleyicisi, frontend'deki bir kullanıcı
    // etkileşimine karşılık gelir ve ilgili arduinoService fonksiyonunu çağırır.
    socket.on('set_motor_pwm', (value) => {
        console.log(`[Client -> Server]: set_motor_pwm isteği: ${value}`);
        (0, arduinoService_1.setMotorPwm)(value);
    });
    socket.on('set_motor_direction', (direction) => {
        console.log(`[Client -> Server]: set_motor_direction isteği: ${direction}`);
        (0, arduinoService_1.setMotorDirection)(direction);
    });
    socket.on('start_motor', () => {
        console.log(`[Client -> Server]: start_motor isteği`);
        (0, arduinoService_1.startCurrentMode)(); // Değişiklik burada
    });
    socket.on('stop_motor', () => {
        console.log(`[Client -> Server]: stop_motor isteği`);
        (0, arduinoService_1.stopMotor)();
    });
    socket.on('start_oscillation', (options) => {
        console.log(`[Client -> Server]: start_oscillation isteği:`, options);
        (0, arduinoService_1.startOscillation)(options);
    });
    socket.on('set_operating_mode', (mode) => {
        console.log(`[Client -> Server]: set_operating_mode isteği: ${mode}`);
        (0, arduinoService_1.setOperatingMode)(mode);
    });
    socket.on('set_oscillation_settings', (settings) => {
        console.log(`[Client -> Server]: set_oscillation_settings isteği:`, settings);
        (0, arduinoService_1.setOscillationSettings)(settings);
    });
    socket.on('set_pulse_settings', (settings) => {
        console.log(`[Client -> Server]: set_pulse_settings isteği:`, settings);
        (0, arduinoService_1.setPulseSettings)(settings);
    });
    socket.on('set_vibration_settings', (settings) => {
        console.log(`[Client -> Server]: set_vibration_settings isteği:`, settings);
        (0, arduinoService_1.setVibrationSettings)(settings);
    });
    socket.on('set_continuous_settings', (settings) => {
        console.log(`[Client -> Server]: set_continuous_settings isteği:`, settings);
        (0, arduinoService_1.setContinuousSettings)(settings);
    });
    socket.on('recipe_start', (recipe) => {
        console.log(`[Client -> Server]: recipe_start isteği: ${recipe.name}`);
        (0, recipeService_1.startRecipe)(recipe);
    });
    socket.on('recipe_stop', () => {
        console.log(`[Client -> Server]: recipe_stop isteği`);
        (0, recipeService_1.stopRecipe)();
    });
    (0, recipePersistenceService_1.listRecipes)().then(recipes => {
        socket.emit('recipe_list_update', recipes);
    });
    // YENİ: Arayüzden gelen aktif reçete seçimini dinle ve servise ilet
    socket.on('set_active_recipe', (recipe) => {
        console.log(`[Client -> Server]: Aktif reçete ayarlandı: ${(recipe === null || recipe === void 0 ? void 0 : recipe.name) || 'Hiçbiri'}`);
        (0, arduinoService_1.setActiveRecipe)(recipe);
    });
    socket.on('recipe_save', (recipe) => __awaiter(void 0, void 0, void 0, function* () {
        console.log(`[Client -> Server]: recipe_save isteği: ${recipe.name}`);
        const updatedRecipes = yield (0, recipePersistenceService_1.saveRecipe)(recipe);
        // Değişikliği tüm istemcilere yayınla
        io.emit('recipe_list_update', updatedRecipes);
    }));
    socket.on('recipe_delete', (recipeId) => __awaiter(void 0, void 0, void 0, function* () {
        console.log(`[Client -> Server]: recipe_delete isteği: ${recipeId}`);
        const updatedRecipes = yield (0, recipePersistenceService_1.deleteRecipe)(recipeId);
        // Değişikliği tüm istemcilere yayınla
        io.emit('recipe_list_update', updatedRecipes);
    }));
    // 'disconnect' olayı, bir istemcinin bağlantısı koptuğunda tetiklenir.
    socket.on('disconnect', () => {
        console.log(`İstemcinin bağlantısı kesildi: ${socket.id}`);
    });
    // Ar-Ge panelinden gelen kalibrasyon verisi isteğini dinle
    socket.on('get_calibration_data', (data) => {
        console.log(`[Client -> Server]: get_calibration_data isteği:`, data);
        const calibrationData = (0, calibrationService_1.getCalibrationData)(data.rpm, data.angle);
        if (calibrationData) {
            socket.emit('calibration_data_response', calibrationData);
        }
        else {
            // İsteğe bağlı: Arayüze bir hata durumu da gönderebiliriz.
            // Şimdilik sadece sunucu konsoluna log basmak yeterli.
            console.error(`İstenen RPM (${data.rpm}) ve Açı (${data.angle}) için kalibrasyon verisi bulunamadı.`);
        }
    });
    // Ar-Ge panelinden gelen ham komutları dinle
    socket.on('send_raw_command', (command) => {
        console.log(`[Ar-Ge Client -> Server]: Ham komut isteği: ${command}`);
        (0, arduinoService_1.sendCommand)(command); // Doğrudan arduinoService'e pasla
    });
});
// ===================================================================
//                        Sunucuyu Başlatma
// ===================================================================
httpServer.listen(PORT, () => {
    console.log(`Backend sunucusu http://localhost:${PORT} adresinde başlatıldı.`);
    // Arduino servisini, tüm istemcilere yayın yapabilmesi için
    // oluşturduğumuz 'io' nesnesi ile başlat.
    (0, arduinoService_1.initializeArduinoService)(io);
    // Arduino'ya bağlanma sürecini başlat.
    (0, arduinoService_1.connectToArduino)();
});
