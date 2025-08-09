"use strict";
// packages/backend/src/services/arduinoService.ts
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
exports.startCurrentMode = exports.startContinuousMode = exports.stopMotorFromRecipe = exports.executeStep = exports.getIsArduinoConnected = exports.setVibrationSettings = exports.setPulseSettings = exports.setOscillationSettings = exports.setContinuousSettings = exports.setOperatingMode = exports.setMotorDirection = exports.setMotorPwm = exports.startVibrationMode = exports.startPulseMode = exports.startOscillation = exports.startMotor = exports.stopMotor = exports.connectToArduino = exports.sendCommand = exports.initializeArduinoService = exports.setActiveRecipe = void 0;
const serialport_1 = require("serialport");
const parser_readline_1 = require("@serialport/parser-readline");
const shared_types_1 = require("../../../shared-types");
const config_1 = __importDefault(require("../config"));
const calibrationService_1 = require("./calibrationService");
const recipeService_1 = require("./recipeService");
// ===================================================================
//
//                        Arduino Servisi
//
// -------------------------------------------------------------------
// Açıklama:
// Bu servis, Node.js sunucusu ile USB üzerinden bağlı olan Arduino
// arasındaki tüm iletişimi yönetir. Seri port bağlantısını kurar,
// komutları gönderir, Arduino'dan gelen olayları (event) dinler ve
// anlık cihaz durumunu tüm bağlı istemcilere (frontend) yayınlar.
//
// ===================================================================
// --- Modül Seviyesi Değişkenler ve Durum Yönetimi ---
/** Ana Socket.IO sunucu örneği. initializeArduinoService ile set edilir. */
let io = null;
/** Arduino ile haberleşmeyi sağlayan seri port nesnesi. */
let port = null;
/** Seri porttan gelen veriyi satır satır ayrıştıran parser. */
let parser = null;
/** Arduino'ya PING gönderip bağlantıyı kontrol eden interval. */
let pingInterval = null;
/** Darbe modunda motoru periyodik olarak çalıştıran interval. */
let pulseInterval = null;
/** Titreşim modunda motoru periyodik olarak çalıştıran interval. */
let vibrationInterval = null;
let rampArduinoInterval = null;
let rampUiInterval = null;
/** Osilasyon modunda motoru periyodik olarak çalıştıran interval. */
let oscillationInterval = null;
/** Titreşim modunun bir sonraki adımda hangi yöne döneceğini tutar. */
let vibrationDirection = 0;
/** Osilasyonun bir sonraki adımda hangi yöne döneceğini tutar. */
let oscillationDirection = 0; // 0: CW, 1: CCW
/** Bağlantı durumunu takip etmek için */
let isArduinoConnected = false;
// YENİ: Frontend'den seçilen ve pedalın başlamasını bekleyen reçeteyi tutar.
let activeRecipe = null;
// YENİ: Bu fonksiyon, frontend'den gelen reçete seçimini değişkene atar.
const setActiveRecipe = (recipe) => {
    activeRecipe = recipe;
};
exports.setActiveRecipe = setActiveRecipe;
/**
 * Cihazın anlık durumunu tutan tek gerçek kaynak (Single Source of Truth).
 * Tüm değişiklikler bu nesne üzerinden yapılır ve istemcilere yayınlanır.
 */
let deviceStatus = {
    motor: { isActive: false, pwm: 100, direction: 0 },
    operatingMode: 'continuous',
    oscillationSettings: { angle: 180 },
    pulseSettings: { pulseDuration: 1000, pulseDelay: 500 },
    vibrationSettings: { intensity: 100, frequency: 5 },
    continuousSettings: { rampDuration: 0 },
};
// ===================================================================
//                      Servis Başlatma ve Yayın
// ===================================================================
/**
 * Arduino servisini ana Socket.IO sunucu örneği ile başlatır.
 * Bu fonksiyon, server.ts içinde sunucu ayağa kalktığında bir kez çağrılmalıdır.
 * @param socketIoServer - Ana Socket.IO sunucu örneği.
 */
const initializeArduinoService = (socketIoServer) => {
    io = socketIoServer;
};
exports.initializeArduinoService = initializeArduinoService;
/**
 * Mevcut 'deviceStatus' nesnesini tüm bağlı frontend istemcilerine yayınlar.
 * Cihazın durumunda bir değişiklik olduğunda çağrılır.
 */
const broadcastDeviceStatus = () => {
    // YENİ: Göndermeden önce, recipeService'den en güncel reçete durumunu al
    const currentRecipeStatus = (0, recipeService_1.getRecipeStatus)();
    // İki durumu birleştirip tek bir paket olarak gönder
    const combinedStatus = Object.assign(Object.assign({}, deviceStatus), { recipeStatus: currentRecipeStatus });
    io === null || io === void 0 ? void 0 : io.emit('device_status_update', combinedStatus);
};
// ===================================================================
//                   Seri Port Haberleşme Yönetimi
// ===================================================================
/**
 * Arduino'ya belirli bir formatta komut gönderir.
 * @param command - Arduino'ya gönderilecek 'GRUP.KOMUT:PARAMETRE' formatındaki dize.
 */
const sendCommand = (command) => {
    if (port && port.isOpen) {
        port.write(`${command}\n`, (err) => {
            if (err) {
                console.error('Arduino komut gönderim hatası:', err.message);
                return;
            }
            // Ping komutları çok sık gönderildiği için log'ları kirletmemesi adına opsiyonel olarak gizlenir.
            if (!command.startsWith('SYS.PING') || config_1.default.arduino.logPings) {
                console.log(`[Server -> Device]: ${command}`);
            }
        });
    }
    else {
        console.warn("Komut gönderilemedi. Arduino bağlı değil veya port açık değil.");
    }
};
exports.sendCommand = sendCommand;
/**
 * Arduino'dan gelen verileri işler.
 * Bu fonksiyon, parser tarafından her yeni satır geldiğinde tetiklenir.
 * @param data - Seri porttan gelen tek bir satırlık veri.
 */
const handleData = (data) => {
    if (data.startsWith('PONG') && !config_1.default.arduino.logPings)
        return;
    console.log(`[Device -> Server]: ${data}`);
    const pedalPrefix = `${shared_types_1.ArduinoCommands.EVT}PEDAL:`;
    const ftswPrefix = `${shared_types_1.ArduinoCommands.EVT}FTSW:`;
    if (data.startsWith(pedalPrefix + '1')) {
        if (activeRecipe && !(0, recipeService_1.getRecipeStatus)().isRunning) {
            (0, recipeService_1.startRecipe)(activeRecipe);
        }
        else if (!(0, recipeService_1.getRecipeStatus)().isRunning) {
            (0, exports.startCurrentMode)();
        }
        io === null || io === void 0 ? void 0 : io.emit('arduino_event', { type: 'PEDAL', state: 1 });
    }
    else if (data.startsWith(pedalPrefix + '0')) {
        if (!(0, recipeService_1.getRecipeStatus)().isRunning) {
            (0, exports.stopMotor)();
        }
        io === null || io === void 0 ? void 0 : io.emit('arduino_event', { type: 'PEDAL', state: 0 });
    }
    else if (data.startsWith(ftswPrefix)) {
        const state = parseInt(data.substring(ftswPrefix.length));
        io === null || io === void 0 ? void 0 : io.emit('arduino_event', { type: 'FTSW', state });
    }
};
// ===================================================================
//                  Arduino Bağlantı Yönetimi
// ===================================================================
/**
 * Mevcut seri portlar arasında konfigürasyonda belirtilen
 * tanımlayıcılara uyan bir Arduino portu arar.
 * @returns {Promise<string | null>} Bulunan portun yolu veya bulunamazsa null.
 */
const findArduinoPort = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const portList = yield serialport_1.SerialPort.list();
        const arduinoPortInfo = portList.find(p => config_1.default.arduino.portIdentifiers.some(id => {
            var _a, _b;
            return ((_a = p.manufacturer) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(id)) ||
                ((_b = p.serialNumber) === null || _b === void 0 ? void 0 : _b.toLowerCase().includes(id));
        }));
        return arduinoPortInfo ? arduinoPortInfo.path : null;
    }
    catch (error) {
        console.error("Seri portlar listelenirken hata oluştu:", error);
        return null;
    }
});
/**
 * Arduino'ya bağlanmayı dener. Başarısız olursa, belirli aralıklarla
 * yeniden dener. Bağlantı olaylarını (bağlandı, koptu, hata) yönetir.
 */
const connectToArduino = () => __awaiter(void 0, void 0, void 0, function* () {
    let portPath = config_1.default.arduino.port || null;
    if (!portPath) {
        console.log("Manuel port belirtilmemiş. Otomatik olarak Arduino portu aranıyor...");
        portPath = yield findArduinoPort();
    }
    if (!portPath) {
        console.error(`Arduino portu bulunamadı. ${config_1.default.arduino.reconnectTimeout / 1000} saniye sonra tekrar denenecek.`);
        setTimeout(exports.connectToArduino, config_1.default.arduino.reconnectTimeout);
        return;
    }
    console.log(`'${portPath}' portu üzerinden Arduino'ya bağlanılıyor...`);
    port = new serialport_1.SerialPort({ path: portPath, baudRate: config_1.default.arduino.baudRate });
    parser = port.pipe(new parser_readline_1.ReadlineParser({ delimiter: '\n' }));
    // --- Seri Port Olay Dinleyicileri ---
    port.on('open', () => {
        console.log(`Arduino'ya başarıyla bağlanıldı: ${portPath}`);
        isArduinoConnected = true;
        if (pingInterval)
            clearInterval(pingInterval);
        pingInterval = setInterval(() => (0, exports.sendCommand)(shared_types_1.ArduinoCommands.SYS_PING), config_1.default.arduino.pingInterval);
        io === null || io === void 0 ? void 0 : io.emit('arduino_connected');
        broadcastDeviceStatus();
    });
    parser.on('data', handleData);
    port.on('close', () => {
        console.warn("Arduino bağlantısı kesildi. Yeniden bağlanmaya çalışılıyor...");
        isArduinoConnected = false;
        if (pingInterval)
            clearInterval(pingInterval);
        io === null || io === void 0 ? void 0 : io.emit('arduino_disconnected');
        setTimeout(exports.connectToArduino, config_1.default.arduino.reconnectTimeout);
    });
    port.on('error', (err) => {
        console.error(`Seri port hatası (${portPath}):`, err.message);
        port === null || port === void 0 ? void 0 : port.close(); // Hata durumunda portu kapatıp 'close' olayını tetikle
    });
});
exports.connectToArduino = connectToArduino;
// ===================================================================
//                      Motor Kontrol Fonksiyonları
// ===================================================================
/**
 * Motoru ve osilasyon gibi periyodik görevleri durduran iç yardımcı fonksiyon.
 * Durumu istemcilere yayınlamaz, sadece donanımı durdurur.
 * Mod değişiklikleri arasında temiz bir geçiş sağlar.
 */
const internalStopMotor = () => {
    if (oscillationInterval)
        clearInterval(oscillationInterval);
    if (pulseInterval)
        clearInterval(pulseInterval);
    if (vibrationInterval)
        clearInterval(vibrationInterval);
    if (rampArduinoInterval)
        clearInterval(rampArduinoInterval);
    if (rampUiInterval)
        clearInterval(rampUiInterval);
    oscillationInterval = pulseInterval = vibrationInterval = rampArduinoInterval = rampUiInterval = null;
    (0, exports.sendCommand)(shared_types_1.ArduinoCommands.MOTOR_STOP);
};
/**
 * Motoru tamamen durdurur, durumu günceller ve bu değişikliği
 * tüm istemcilere yayınlar.
 */
const stopMotor = () => {
    internalStopMotor();
    deviceStatus.motor.isActive = false;
    broadcastDeviceStatus();
};
exports.stopMotor = stopMotor;
/**
 * Motoru mevcut bir PWM değerinden hedef bir PWM değerine pürüzsüzce rampalar.
 * Bu fonksiyon, hem hızlanma hem de yavaşlama senaryolarını yönetir.
 * @param startPwm - Rampanın başlayacağı PWM değeri.
 * @param targetPwm - Rampanın ulaşacağı hedef PWM değeri.
 */
const _performRamp = (startPwm, targetPwm) => {
    const { rampDuration } = deviceStatus.continuousSettings;
    // Eğer rampa istenmiyorsa, anında hedef hıza geç ve bitir.
    if (rampDuration < 100) {
        deviceStatus.motor.pwm = targetPwm;
        (0, exports.sendCommand)(`${shared_types_1.ArduinoCommands.MOTOR_SET_PWM}:${targetPwm}`);
        broadcastDeviceStatus();
        return;
    }
    let currentPwm = startPwm;
    const stepCount = 20; // Rampayı 20 pürüzsüz adımda tamamla
    const stepInterval = rampDuration / stepCount;
    const pwmDifference = targetPwm - startPwm;
    const pwmIncrement = pwmDifference / stepCount;
    if (rampArduinoInterval)
        clearInterval(rampArduinoInterval);
    if (rampUiInterval)
        clearInterval(rampUiInterval);
    // 1. GÖREV: ARDUINO'YA YÜKSEK FREKANSTA KOMUT GÖNDER
    rampArduinoInterval = setInterval(() => {
        currentPwm += pwmIncrement;
        if ((pwmIncrement > 0 && currentPwm >= targetPwm) || (pwmIncrement < 0 && currentPwm <= targetPwm)) {
            currentPwm = targetPwm;
            if (rampArduinoInterval)
                clearInterval(rampArduinoInterval);
        }
        (0, exports.sendCommand)(`${shared_types_1.ArduinoCommands.MOTOR_SET_PWM}:${Math.round(currentPwm)}`);
    }, stepInterval);
    // 2. GÖREV: ARAYÜZÜ DAHA YAVAŞ VE MAKUL BİR HIZDA GÜNCELLE
    rampUiInterval = setInterval(() => {
        // Anlık PWM değerini store'a işle ve yayınla
        deviceStatus.motor.pwm = Math.round(currentPwm);
        broadcastDeviceStatus();
        // Hedefe ulaşıldıysa bu interval'i de durdur
        if (currentPwm === targetPwm) {
            if (rampUiInterval)
                clearInterval(rampUiInterval);
        }
    }, 50); // Arayüzü saniyede 20 kez (her 50ms'de bir) güncelle, bu pürüzsüzlük için yeterlidir.
};
/**
 * Motoru sürekli modda çalıştırır.
 * Rampa ayarı varsa, motoru mevcut hızından hedeflenen hıza pürüzsüz bir şekilde rampalar (hızlandırır veya yavaşlatır).
 */
/**
 * Motoru sürekli modda SIFIRDAN başlatır.
 */
const startMotor = (isContinuation = false) => {
    if (!isContinuation && deviceStatus.motor.isActive)
        return;
    internalStopMotor();
    const targetPwm = deviceStatus.motor.pwm === 0 ? 100 : deviceStatus.motor.pwm;
    deviceStatus.motor.isActive = true;
    (0, exports.sendCommand)(`${shared_types_1.ArduinoCommands.MOTOR_SET_DIR}:${deviceStatus.motor.direction}`);
    // Rampalama işini yeni özel fonksiyonumuza devrediyoruz (başlangıç hızı 0)
    _performRamp(0, targetPwm);
    // Motorun "aktif" olduğunu hemen yayınla
    broadcastDeviceStatus();
};
exports.startMotor = startMotor;
/**
 * Motoru osilasyon (salınım) modunda çalıştırır.
 * @param options - Osilasyon için gerekli PWM, açı ve RPM değerleri.
 * @param isContinuation - Mod değişikliği sonrası devam ediyorsa true.
 */
const startOscillation = (options, isContinuation = false) => {
    if (!isContinuation && deviceStatus.motor.isActive)
        return;
    internalStopMotor();
    // Durumu güncelle
    deviceStatus.motor.isActive = true;
    deviceStatus.motor.pwm = options.pwm;
    deviceStatus.oscillationSettings.angle = options.angle;
    // Kalibrasyon tablosundan bu RPM ve Açı için gereken milisaniye değerini al
    const ms = (0, calibrationService_1.getMsFromCalibration)(options.rpm, options.angle);
    if (ms === 0) {
        console.error("Osilasyon başlatılamadı: kalibrasyon verisi bulunamadı.");
        (0, exports.stopMotor)(); // Motoru güvenli bir şekilde durdur
        return;
    }
    // Osilasyon adımını gerçekleştiren fonksiyon
    const performStep = () => {
        (0, exports.sendCommand)(`${shared_types_1.ArduinoCommands.MOTOR_SET_DIR}:${oscillationDirection}`);
        (0, exports.sendCommand)(`${shared_types_1.ArduinoCommands.MOTOR_TIMED_RUN}:${deviceStatus.motor.pwm}|${ms}`);
        // Her adımdan sonra yönü tersine çevir
        oscillationDirection = oscillationDirection === 0 ? 1 : 0;
    };
    performStep(); // İlk adımı hemen at
    // Her (dönüş + bekleme + diğer dönüş + bekleme) süresi sonunda tekrarla
    // 50ms'lik ek süre, seri haberleşme ve Arduino'nun işlem süresi için bir paydır.
    oscillationInterval = setInterval(performStep, ms * 2 + 50);
    broadcastDeviceStatus();
};
exports.startOscillation = startOscillation;
/**
 * Motoru darbe (pulse) modunda çalıştırır.
 * @param isContinuation - Mod değişikliği sonrası devam ediyorsa true.
 */
const startPulseMode = (isContinuation = false) => {
    if (!isContinuation && deviceStatus.motor.isActive)
        return;
    internalStopMotor();
    deviceStatus.motor.isActive = true;
    if (deviceStatus.motor.pwm === 0)
        deviceStatus.motor.pwm = 100;
    const { pulseDuration, pulseDelay } = deviceStatus.pulseSettings;
    // Toplam döngü süresi artık frenlemeyi de hesaba katmalı, ancak
    // backend'in bekleme süresini etkilemez.
    const totalIntervalTime = pulseDuration + pulseDelay;
    const performStep = () => {
        (0, exports.sendCommand)(`${shared_types_1.ArduinoCommands.MOTOR_SET_DIR}:${deviceStatus.motor.direction}`);
        (0, exports.sendCommand)(`${shared_types_1.ArduinoCommands.MOTOR_TIMED_RUN}:${deviceStatus.motor.pwm}|${pulseDuration}`);
        // 3. YENİ ADIM: Darbe biter bitmez fren komutunu gönder
        // Arduino'daki delay nedeniyle bu komutun tamamlanmasını beklemeyeceğiz,
        // backend kendi döngüsüne devam edecek.
        setTimeout(() => {
            (0, exports.sendCommand)(shared_types_1.ArduinoCommands.MOTOR_BRAKE);
        }, pulseDuration); // Darbe bittiği anda fren yap
    };
    performStep();
    pulseInterval = setInterval(performStep, totalIntervalTime);
    broadcastDeviceStatus();
};
exports.startPulseMode = startPulseMode;
/**
 * Motoru titreşim (vibration) modunda çalıştırır.
 * @param isContinuation - Mod değişikliği sonrası devam ediyorsa true.
 */
const startVibrationMode = (isContinuation = false) => {
    if (!isContinuation && deviceStatus.motor.isActive)
        return;
    internalStopMotor(); // Önceki modu temizle
    deviceStatus.motor.isActive = true;
    const { intensity, frequency } = deviceStatus.vibrationSettings;
    deviceStatus.motor.pwm = intensity; // Motor PWM'ini doğrudan yoğunluk ayarına eşitle
    // Frekansı (1-10) daha kısa ms değerlerine çevirelim.
    // Yüksek frekans = daha kısa süre ve daha az bekleme.
    // const stepDuration = Math.max(15, 40 - (frequency * 2)); // örn: frekans 10 -> 20ms, frekans 1 -> 38ms
    // const stepDelay = Math.max(10, 30 - frequency);      // örn: frekans 10 -> 20ms, frekans 1 -> 29ms
    // Seviye 1'i daha yavaş, Seviye 10'u daha hızlı yapacak şekilde katsayıları güncelledik.
    const VIB_BASE_DURATION = 60; // Temel dönüş süresi (ms)
    const VIB_FREQ_MULTIPLIER_DURATION = 4; // Frekansın dönüş süresine etki çarpanı
    const VIB_BASE_DELAY = 50; // Temel bekleme süresi (ms)
    const VIB_FREQ_MULTIPLIER_DELAY = 3; // Frekansın bekleme süresine etki çarpanı
    const stepDuration = Math.max(15, VIB_BASE_DURATION - (frequency * VIB_FREQ_MULTIPLIER_DURATION));
    const stepDelay = Math.max(10, VIB_BASE_DELAY - (frequency * VIB_FREQ_MULTIPLIER_DELAY));
    const totalIntervalTime = stepDuration + stepDelay;
    const performStep = () => {
        (0, exports.sendCommand)(`${shared_types_1.ArduinoCommands.MOTOR_SET_DIR}:${vibrationDirection}`);
        (0, exports.sendCommand)(`${shared_types_1.ArduinoCommands.MOTOR_TIMED_RUN}:${deviceStatus.motor.pwm}|${stepDuration}`);
        vibrationDirection = vibrationDirection === 0 ? 1 : 0; // Her adımda yönü değiştir
    };
    performStep(); // İlk adımı hemen at
    vibrationInterval = setInterval(performStep, totalIntervalTime);
    broadcastDeviceStatus();
};
exports.startVibrationMode = startVibrationMode;
/**
 * Motorun PWM (hız) değerini günceller.
 * Eğer motor zaten çalışıyorsa, mevcut hızından yeni hedefe pürüzsüzce rampalar.
 */
const setMotorPwm = (value) => {
    const wasActive = deviceStatus.motor.isActive;
    const newTargetPwm = Math.max(0, Math.min(255, value));
    // Mevcut (eski) hızı, rampa fonksiyonuna başlangıç noktası olarak vermek için sakla
    const previousPwm = deviceStatus.motor.pwm;
    // Yeni hedef hızı ayarla
    deviceStatus.motor.pwm = newTargetPwm;
    if (wasActive) {
        if (deviceStatus.operatingMode === 'continuous') {
            // Rampalama işini yeni özel fonksiyonumuza devrediyoruz
            _performRamp(previousPwm, newTargetPwm);
        }
        else if (deviceStatus.operatingMode === 'oscillation') {
            const rpm = (0, calibrationService_1.pwmToCalibratedRpm)(newTargetPwm);
            (0, exports.startOscillation)(Object.assign(Object.assign({}, deviceStatus.oscillationSettings), { pwm: newTargetPwm, rpm }), true);
        }
        else if (deviceStatus.operatingMode === 'pulse') {
            (0, exports.startPulseMode)(true);
        }
    }
    else {
        // Motor çalışmıyorsa, sadece güncellenmiş durumu (yeni hedef hızı) arayüze bildir.
        broadcastDeviceStatus();
    }
};
exports.setMotorPwm = setMotorPwm;
/**
 * Motorun dönüş yönünü ayarlar.
 * @param direction - Yeni yön (0: CW, 1: CCW).
 */
const setMotorDirection = (direction) => {
    deviceStatus.motor.direction = direction;
    (0, exports.sendCommand)(`${shared_types_1.ArduinoCommands.MOTOR_SET_DIR}:${direction}`);
    broadcastDeviceStatus();
};
exports.setMotorDirection = setMotorDirection;
/**
 * Cihazın çalışma modunu (sürekli/osilasyon) ayarlar.
 * Eğer motor çalışıyorsa, durdurup yeni modda yeniden başlatır.
 * @param mode - Yeni çalışma modu.
 */
const setOperatingMode = (mode) => {
    if (deviceStatus.operatingMode === mode)
        return;
    const wasActive = deviceStatus.motor.isActive;
    if (wasActive) {
        internalStopMotor();
    }
    deviceStatus.operatingMode = mode;
    // Eğer motor daha önce de çalışıyorsa, yeni modda tekrar başlat.
    if (wasActive) {
        (0, exports.startCurrentMode)(); // Artık tek ve doğru bir yerden başlatılıyor
    }
    else {
        broadcastDeviceStatus();
    }
};
exports.setOperatingMode = setOperatingMode;
/**
 * Sürekli mod ayarlarını günceller.
 * @param settings - Yeni sürekli mod ayarları.
 */
const setContinuousSettings = (settings) => {
    deviceStatus.continuousSettings = settings;
    // Sürekli mod çalışırken ayar değişirse anlık etki etmesi istenirse
    // buraya bir yeniden başlatma mantığı eklenebilir. Şimdilik sadece durumu güncelliyoruz.
    broadcastDeviceStatus();
};
exports.setContinuousSettings = setContinuousSettings;
/**
 * Osilasyon ayarlarını (şu an için sadece açı) günceller.
 * Eğer motor osilasyon modunda çalışıyorsa, yeni ayarlarla yeniden başlatır.
 * @param settings - Yeni osilasyon ayarları.
 */
const setOscillationSettings = (settings) => {
    const wasActive = deviceStatus.motor.isActive;
    deviceStatus.oscillationSettings = settings;
    if (wasActive && deviceStatus.operatingMode === 'oscillation') {
        const rpm = (0, calibrationService_1.pwmToCalibratedRpm)(deviceStatus.motor.pwm);
        (0, exports.startOscillation)(Object.assign(Object.assign({}, settings), { pwm: deviceStatus.motor.pwm, rpm }), true);
    }
    else {
        broadcastDeviceStatus();
    }
};
exports.setOscillationSettings = setOscillationSettings;
/**
 * Darbe modu ayarlarını (darbe süresi, bekleme süresi) günceller.
 * Eğer motor darbe modunda çalışıyorsa, yeni ayarlarla döngüyü yeniden başlatır.
 * @param settings - Yeni darbe ayarları.
 */
const setPulseSettings = (settings) => {
    // 1. Yeni ayarları hemen deviceStatus'a işle.
    deviceStatus.pulseSettings = settings;
    // 2. Motorun zaten darbe modunda çalışıp çalışmadığını kontrol et.
    const isMotorActiveInPulseMode = deviceStatus.motor.isActive && deviceStatus.operatingMode === 'pulse';
    // 3. Eğer motor zaten darbe modunda çalışıyorsa, döngüyü yeni ayarlarla yeniden başlat.
    // Bu, çalışan setInterval'i temizleyip yenisini kurar.
    if (isMotorActiveInPulseMode) {
        console.log("Darbe modu çalışırken ayarlar değişti. Döngü yeniden başlatılıyor...");
        (0, exports.startPulseMode)(true);
    }
    // 4. Motor çalışmıyorsa, sadece güncellenmiş durumu arayüze bildir.
    else {
        broadcastDeviceStatus();
    }
};
exports.setPulseSettings = setPulseSettings;
/**
 * Titreşim modu ayarlarını günceller.
 * Eğer motor titreşim modunda çalışıyorsa, yeni ayarlarla yeniden başlatır.
 * @param settings - Yeni titreşim ayarları.
 */
const setVibrationSettings = (settings) => {
    const wasActive = deviceStatus.motor.isActive;
    deviceStatus.vibrationSettings = settings;
    if (wasActive && deviceStatus.operatingMode === 'vibration') {
        (0, exports.startVibrationMode)(true); // Yeni ayarlarla yeniden başlat
    }
    else {
        broadcastDeviceStatus();
    }
};
exports.setVibrationSettings = setVibrationSettings;
/**
 * Arduino'nun mevcut bağlantı durumunu döndürür.
 * @returns {boolean} Arduino bağlı ise true, değilse false.
 */
const getIsArduinoConnected = () => {
    return isArduinoConnected;
};
exports.getIsArduinoConnected = getIsArduinoConnected;
/**
 * Reçete servisinden gelen bir adımı alır ve ilgili motor fonksiyonunu çalıştırır.
 * Bu, modüler yapının temelini oluşturan "yönlendiricidir".
 * @param step - Çalıştırılacak reçete adımı.
 */
const executeStep = (step) => {
    console.log(`Adım ${step.id} çalıştırılıyor: Mod=${step.mode}, Süre=${step.duration}ms`);
    deviceStatus.operatingMode = step.mode;
    if (step.settings) {
        let stepPwm;
        // 'vibration' modu hızı 'intensity' alanından alır.
        if (step.mode === 'vibration' && 'intensity' in step.settings) {
            stepPwm = step.settings.intensity;
        }
        // Diğer modlar için 'pwm' alanını kontrol et.
        else if ('pwm' in step.settings && typeof step.settings.pwm === 'number') {
            stepPwm = step.settings.pwm;
        }
        // Eğer adım için bir PWM değeri bulunduysa, bunu ana motor durumuna işle.
        // Bulunmadıysa, mevcut manuel ayardaki PWM değeri korunur.
        if (stepPwm !== undefined) {
            deviceStatus.motor.pwm = stepPwm;
            console.log(`Adıma özel PWM ayarlandı: ${stepPwm}`);
        }
        else {
            console.log(`Adıma özel PWM belirtilmemiş, global PWM kullanılıyor: ${deviceStatus.motor.pwm}`);
        }
    }
    if (step.settings) {
        if (step.mode === 'continuous' && 'rampDuration' in step.settings) {
            deviceStatus.continuousSettings = step.settings;
        }
        else if (step.mode === 'oscillation' && 'angle' in step.settings) {
            deviceStatus.oscillationSettings = step.settings;
        }
        else if (step.mode === 'pulse' && 'pulseDuration' in step.settings) {
            deviceStatus.pulseSettings = step.settings;
        }
        else if (step.mode === 'vibration' && 'intensity' in step.settings) {
            deviceStatus.vibrationSettings = step.settings;
        }
    }
    switch (step.mode) {
        case 'continuous':
            (0, exports.startMotor)(true);
            break;
        case 'oscillation':
            const rpm = (0, calibrationService_1.pwmToCalibratedRpm)(deviceStatus.motor.pwm);
            (0, exports.startOscillation)({
                pwm: deviceStatus.motor.pwm,
                angle: deviceStatus.oscillationSettings.angle,
                rpm: rpm,
            }, true); // isContinuation parametresini de gönderiyoruz
            break;
        case 'pulse':
            (0, exports.startPulseMode)(true);
            break;
        case 'vibration':
            (0, exports.startVibrationMode)(true);
            break;
    }
};
exports.executeStep = executeStep;
/**
 * Reçete bittiğinde veya durdurulduğunda motoru güvenli bir şekilde durdurur.
 */
const stopMotorFromRecipe = () => {
    internalStopMotor();
    deviceStatus.motor.isActive = false;
    broadcastDeviceStatus();
};
exports.stopMotorFromRecipe = stopMotorFromRecipe;
// YENİ: startMotor fonksiyonu artık sadece sürekli modu başlatıyor
const startContinuousMode = (isContinuation = false) => {
    if (!isContinuation && deviceStatus.motor.isActive)
        return;
    internalStopMotor();
    const targetPwm = deviceStatus.motor.pwm === 0 ? 100 : deviceStatus.motor.pwm;
    deviceStatus.motor.isActive = true;
    (0, exports.sendCommand)(`${shared_types_1.ArduinoCommands.MOTOR_SET_DIR}:${deviceStatus.motor.direction}`);
    _performRamp(0, targetPwm);
    broadcastDeviceStatus();
};
exports.startContinuousMode = startContinuousMode;
// YENİ MERKEZİ BAŞLATMA FONKSİYONU
/**
 * @brief Cihazın mevcut `operatingMode`'una göre doğru motor başlatma fonksiyonunu çağırır.
 * Bu, hem UI butonları hem de pedal için tek giriş noktasıdır.
 */
const startCurrentMode = () => {
    console.log(`Mevcut mod başlatılıyor: ${deviceStatus.operatingMode}`);
    switch (deviceStatus.operatingMode) {
        case 'continuous':
            (0, exports.startContinuousMode)();
            break;
        case 'oscillation':
            const rpm = (0, calibrationService_1.pwmToCalibratedRpm)(deviceStatus.motor.pwm);
            (0, exports.startOscillation)(Object.assign(Object.assign({}, deviceStatus.oscillationSettings), { pwm: deviceStatus.motor.pwm, rpm }));
            break;
        case 'pulse':
            (0, exports.startPulseMode)();
            break;
        case 'vibration':
            (0, exports.startVibrationMode)();
            break;
    }
};
exports.startCurrentMode = startCurrentMode;
