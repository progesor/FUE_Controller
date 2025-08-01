// packages/backend/src/services/arduinoService.ts

import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import { Server } from 'socket.io';
import type {
    MotorDirection,
    ClientToServerEvents,
    ServerToClientEvents,
    OperatingMode,
    OscillationSettings,
    DeviceStatus,
    PulseSettings, VibrationSettings, ContinuousSettings
} from '../../../shared-types';
import config from '../config';
import { getMsFromCalibration, pwmToCalibratedRpm } from './calibrationService';

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
let io: Server<ClientToServerEvents, ServerToClientEvents> | null = null;

/** Arduino ile haberleşmeyi sağlayan seri port nesnesi. */
let port: SerialPort | null = null;

/** Seri porttan gelen veriyi satır satır ayrıştıran parser. */
let parser: ReadlineParser | null = null;

/** Arduino'ya PING gönderip bağlantıyı kontrol eden interval. */
let pingInterval: NodeJS.Timeout | null = null;

/** Darbe modunda motoru periyodik olarak çalıştıran interval. */
let pulseInterval: NodeJS.Timeout | null = null;

/** Titreşim modunda motoru periyodik olarak çalıştıran interval. */
let vibrationInterval: NodeJS.Timeout | null = null;

let rampArduinoInterval: NodeJS.Timeout | null = null;
let rampUiInterval: NodeJS.Timeout | null = null;

/** Osilasyon modunda motoru periyodik olarak çalıştıran interval. */
let oscillationInterval: NodeJS.Timeout | null = null;

/** Titreşim modunun bir sonraki adımda hangi yöne döneceğini tutar. */
let vibrationDirection: MotorDirection = 0;

/** Osilasyonun bir sonraki adımda hangi yöne döneceğini tutar. */
let oscillationDirection: MotorDirection = 0; // 0: CW, 1: CCW

/** Bağlantı durumunu takip etmek için */
let isArduinoConnected = false;

/**
 * Cihazın anlık durumunu tutan tek gerçek kaynak (Single Source of Truth).
 * Tüm değişiklikler bu nesne üzerinden yapılır ve istemcilere yayınlanır.
 */
let deviceStatus: DeviceStatus & { } = {
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
export const initializeArduinoService = (socketIoServer: Server<ClientToServerEvents, ServerToClientEvents>) => {
    io = socketIoServer;
};

/**
 * Mevcut 'deviceStatus' nesnesini tüm bağlı frontend istemcilerine yayınlar.
 * Cihazın durumunda bir değişiklik olduğunda çağrılır.
 */
const broadcastDeviceStatus = () => {
    io?.emit('device_status_update', deviceStatus);
};


// ===================================================================
//                   Seri Port Haberleşme Yönetimi
// ===================================================================

/**
 * Arduino'ya belirli bir formatta komut gönderir.
 * @param command - Arduino'ya gönderilecek 'GRUP.KOMUT:PARAMETRE' formatındaki dize.
 */
export const sendRawArduinoCommand = (command: string) => {
    if (port && port.isOpen) {
        port.write(`${command}\n`, (err) => {
            if (err) {
                console.error('Arduino komut gönderim hatası:', err.message);
                return;
            }
            // Ping komutları çok sık gönderildiği için log'ları kirletmemesi adına opsiyonel olarak gizlenir.
            if (!command.startsWith('SYS.PING') || config.arduino.logPings) {
                console.log(`[Server -> Device]: ${command}`);
            }
        });
    } else {
        console.warn("Komut gönderilemedi. Arduino bağlı değil veya port açık değil.");
    }
};

/**
 * Arduino'dan gelen verileri işler.
 * Bu fonksiyon, parser tarafından her yeni satır geldiğinde tetiklenir.
 * @param data - Seri porttan gelen tek bir satırlık veri.
 */
const handleData = (data: string) => {
    // Ping cevaplarını (PONG) opsiyonel olarak gizle
    if (data.startsWith('PONG') && !config.arduino.logPings) return;

    console.log(`[Device -> Server]: ${data}`);

    // Gelen veriyi olay (event) veya bilgi olarak işle ve istemcilere bildir.
    if (data.startsWith('EVT:PEDAL:1')) { // Pedal basıldı
        if (deviceStatus.operatingMode === 'continuous') {
            startMotor();
        } else {
            const rpm = pwmToCalibratedRpm(deviceStatus.motor.pwm);
            startOscillation({ ...deviceStatus.oscillationSettings, pwm: deviceStatus.motor.pwm, rpm });
        }
        io?.emit('arduino_event', { type: 'PEDAL', state: 1 });
    } else if (data.startsWith('EVT:PEDAL:0')) { // Pedal bırakıldı
        stopMotor();
        io?.emit('arduino_event', { type: 'PEDAL', state: 0 });
    } else if (data.startsWith('EVT:FTSW:')) { // El/Ayak anahtarı durumu değişti
        const state = parseInt(data.split(':')[2]) as 0 | 1;
        io?.emit('arduino_event', { type: 'FTSW', state });
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
const findArduinoPort = async (): Promise<string | null> => {
    try {
        const portList = await SerialPort.list();
        const arduinoPortInfo = portList.find(p =>
            config.arduino.portIdentifiers.some(id =>
                p.manufacturer?.toLowerCase().includes(id) ||
                p.serialNumber?.toLowerCase().includes(id)
            )
        );
        return arduinoPortInfo ? arduinoPortInfo.path : null;
    } catch (error) {
        console.error("Seri portlar listelenirken hata oluştu:", error);
        return null;
    }
};

/**
 * Arduino'ya bağlanmayı dener. Başarısız olursa, belirli aralıklarla
 * yeniden dener. Bağlantı olaylarını (bağlandı, koptu, hata) yönetir.
 */
export const connectToArduino = async () => {
    let portPath: string | null = config.arduino.port || null;
    if (!portPath) {
        console.log("Manuel port belirtilmemiş. Otomatik olarak Arduino portu aranıyor...");
        portPath = await findArduinoPort();
    }

    if (!portPath) {
        console.error(`Arduino portu bulunamadı. ${config.arduino.reconnectTimeout / 1000} saniye sonra tekrar denenecek.`);
        setTimeout(connectToArduino, config.arduino.reconnectTimeout);
        return;
    }

    console.log(`'${portPath}' portu üzerinden Arduino'ya bağlanılıyor...`);
    port = new SerialPort({ path: portPath, baudRate: config.arduino.baudRate });
    parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

    // --- Seri Port Olay Dinleyicileri ---
    port.on('open', () => {
        console.log(`Arduino'ya başarıyla bağlanıldı: ${portPath}`);
        isArduinoConnected = true;
        if (pingInterval) clearInterval(pingInterval);
        pingInterval = setInterval(() => sendRawArduinoCommand('SYS.PING'), config.arduino.pingInterval);
        io?.emit('arduino_connected');
        broadcastDeviceStatus(); // Bağlanır bağlanmaz mevcut durumu arayüze gönder
    });

    parser.on('data', handleData);

    port.on('close', () => {
        console.warn("Arduino bağlantısı kesildi. Yeniden bağlanmaya çalışılıyor...");
        isArduinoConnected = false;
        if (pingInterval) clearInterval(pingInterval);
        io?.emit('arduino_disconnected');
        setTimeout(connectToArduino, config.arduino.reconnectTimeout);
    });

    port.on('error', (err) => {
        console.error(`Seri port hatası (${portPath}):`, err.message);
        port?.close(); // Hata durumunda portu kapatıp 'close' olayını tetikle
    });
};


// ===================================================================
//                      Motor Kontrol Fonksiyonları
// ===================================================================

/**
 * Motoru ve osilasyon gibi periyodik görevleri durduran iç yardımcı fonksiyon.
 * Durumu istemcilere yayınlamaz, sadece donanımı durdurur.
 * Mod değişiklikleri arasında temiz bir geçiş sağlar.
 */
const internalStopMotor = () => {
    if (oscillationInterval) {
        clearInterval(oscillationInterval);
        oscillationInterval = null;
    }
    if (pulseInterval) {
        clearInterval(pulseInterval);
        pulseInterval = null;
    }
    if (vibrationInterval) {
        clearInterval(vibrationInterval);
        vibrationInterval = null;
    }
    if (rampArduinoInterval) {
        clearInterval(rampArduinoInterval);
        rampArduinoInterval = null;
    }
    if (rampUiInterval) {
        clearInterval(rampUiInterval);
        rampUiInterval = null;
    }
    sendRawArduinoCommand('DEV.MOTOR.STOP');
};

/**
 * Motoru tamamen durdurur, durumu günceller ve bu değişikliği
 * tüm istemcilere yayınlar.
 */
export const stopMotor = () => {
    internalStopMotor();
    deviceStatus.motor.isActive = false;
    broadcastDeviceStatus();
};

/**
 * Motoru mevcut bir PWM değerinden hedef bir PWM değerine pürüzsüzce rampalar.
 * Bu fonksiyon, hem hızlanma hem de yavaşlama senaryolarını yönetir.
 * @param startPwm - Rampanın başlayacağı PWM değeri.
 * @param targetPwm - Rampanın ulaşacağı hedef PWM değeri.
 */
const _performRamp = (startPwm: number, targetPwm: number) => {
    const { rampDuration } = deviceStatus.continuousSettings;

    // Eğer rampa istenmiyorsa, anında hedef hıza geç ve bitir.
    if (rampDuration < 100) {
        deviceStatus.motor.pwm = targetPwm;
        sendRawArduinoCommand(`DEV.MOTOR.SET_PWM:${targetPwm}`);
        broadcastDeviceStatus();
        return;
    }

    let currentPwm = startPwm;
    const stepCount = 20; // Rampayı 20 pürüzsüz adımda tamamla
    const stepInterval = rampDuration / stepCount;
    const pwmDifference = targetPwm - startPwm;
    const pwmIncrement = pwmDifference / stepCount;

    if (rampArduinoInterval) clearInterval(rampArduinoInterval);
    if (rampUiInterval) clearInterval(rampUiInterval);

    // 1. GÖREV: ARDUINO'YA YÜKSEK FREKANSTA KOMUT GÖNDER
    rampArduinoInterval = setInterval(() => {
        currentPwm += pwmIncrement;

        if ((pwmIncrement > 0 && currentPwm >= targetPwm) || (pwmIncrement < 0 && currentPwm <= targetPwm)) {
            currentPwm = targetPwm;
            if (rampArduinoInterval) clearInterval(rampArduinoInterval);
        }

        sendRawArduinoCommand(`DEV.MOTOR.SET_PWM:${Math.round(currentPwm)}`);
    }, stepInterval);

    // 2. GÖREV: ARAYÜZÜ DAHA YAVAŞ VE MAKUL BİR HIZDA GÜNCELLE
    rampUiInterval = setInterval(() => {
        // Anlık PWM değerini store'a işle ve yayınla
        deviceStatus.motor.pwm = Math.round(currentPwm);
        broadcastDeviceStatus();

        // Hedefe ulaşıldıysa bu interval'i de durdur
        if (currentPwm === targetPwm) {
            if (rampUiInterval) clearInterval(rampUiInterval);
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
export const startMotor = (isContinuation = false) => {
    if (!isContinuation && deviceStatus.motor.isActive) return;
    internalStopMotor();

    const targetPwm = deviceStatus.motor.pwm === 0 ? 100 : deviceStatus.motor.pwm;

    deviceStatus.motor.isActive = true;
    sendRawArduinoCommand(`DEV.MOTOR.SET_DIR:${deviceStatus.motor.direction}`);

    // Rampalama işini yeni özel fonksiyonumuza devrediyoruz (başlangıç hızı 0)
    _performRamp(0, targetPwm);

    // Motorun "aktif" olduğunu hemen yayınla
    broadcastDeviceStatus();
};
/**
 * Motoru osilasyon (salınım) modunda çalıştırır.
 * @param options - Osilasyon için gerekli PWM, açı ve RPM değerleri.
 * @param isContinuation - Mod değişikliği sonrası devam ediyorsa true.
 */
export const startOscillation = (options: { pwm: number; angle: number; rpm: number }, isContinuation = false) => {
    if (!isContinuation && deviceStatus.motor.isActive) return;
    internalStopMotor();

    // Durumu güncelle
    deviceStatus.motor.isActive = true;
    deviceStatus.motor.pwm = options.pwm;
    deviceStatus.oscillationSettings.angle = options.angle;

    // Kalibrasyon tablosundan bu RPM ve Açı için gereken milisaniye değerini al
    const ms = getMsFromCalibration(options.rpm, options.angle);
    if (ms === 0) {
        console.error("Osilasyon başlatılamadı: kalibrasyon verisi bulunamadı.");
        stopMotor(); // Motoru güvenli bir şekilde durdur
        return;
    }

    // Osilasyon adımını gerçekleştiren fonksiyon
    const performStep = () => {
        sendRawArduinoCommand(`DEV.MOTOR.SET_DIR:${oscillationDirection}`);
        sendRawArduinoCommand(`DEV.MOTOR.EXEC_TIMED_RUN:${deviceStatus.motor.pwm}|${ms}`);
        // Her adımdan sonra yönü tersine çevir
        oscillationDirection = oscillationDirection === 0 ? 1 : 0;
    };

    performStep(); // İlk adımı hemen at
    // Her (dönüş + bekleme + diğer dönüş + bekleme) süresi sonunda tekrarla
    // 50ms'lik ek süre, seri haberleşme ve Arduino'nun işlem süresi için bir paydır.
    oscillationInterval = setInterval(performStep, ms * 2 + 50);

    broadcastDeviceStatus();
};

/**
 * Motoru darbe (pulse) modunda çalıştırır.
 * @param isContinuation - Mod değişikliği sonrası devam ediyorsa true.
 */
export const startPulseMode = (isContinuation = false) => {
    if (!isContinuation && deviceStatus.motor.isActive) return;
    internalStopMotor();

    deviceStatus.motor.isActive = true;
    if (deviceStatus.motor.pwm === 0) deviceStatus.motor.pwm = 100;

    const { pulseDuration, pulseDelay } = deviceStatus.pulseSettings;
    // Toplam döngü süresi artık frenlemeyi de hesaba katmalı, ancak
    // backend'in bekleme süresini etkilemez.
    const totalIntervalTime = pulseDuration + pulseDelay;

    const performStep = () => {
        // 1. Motor yönünü ayarla
        sendRawArduinoCommand(`DEV.MOTOR.SET_DIR:${deviceStatus.motor.direction}`);
        // 2. Belirlenen süre kadar motoru çalıştır
        sendRawArduinoCommand(`DEV.MOTOR.EXEC_TIMED_RUN:${deviceStatus.motor.pwm}|${pulseDuration}`);

        // 3. YENİ ADIM: Darbe biter bitmez fren komutunu gönder
        // Arduino'daki delay nedeniyle bu komutun tamamlanmasını beklemeyeceğiz,
        // backend kendi döngüsüne devam edecek.
        setTimeout(() => {
            sendRawArduinoCommand('DEV.MOTOR.BRAKE');
        }, pulseDuration); // Darbe bittiği anda fren yap
    };

    performStep();
    pulseInterval = setInterval(performStep, totalIntervalTime);

    broadcastDeviceStatus();
};

/**
 * Motoru titreşim (vibration) modunda çalıştırır.
 * @param isContinuation - Mod değişikliği sonrası devam ediyorsa true.
 */
export const startVibrationMode = (isContinuation = false) => {
    if (!isContinuation && deviceStatus.motor.isActive) return;
    internalStopMotor(); // Önceki modu temizle

    deviceStatus.motor.isActive = true;

    const { intensity, frequency } = deviceStatus.vibrationSettings;
    deviceStatus.motor.pwm = intensity; // Motor PWM'ini doğrudan yoğunluk ayarına eşitle

    // Frekansı (1-10) daha kısa ms değerlerine çevirelim.
    // Yüksek frekans = daha kısa süre ve daha az bekleme.
    const stepDuration = Math.max(15, 40 - (frequency * 2)); // örn: frekans 10 -> 20ms, frekans 1 -> 38ms
    const stepDelay = Math.max(10, 30 - frequency);      // örn: frekans 10 -> 20ms, frekans 1 -> 29ms
    const totalIntervalTime = stepDuration + stepDelay;

    const performStep = () => {
        sendRawArduinoCommand(`DEV.MOTOR.SET_DIR:${vibrationDirection}`);
        sendRawArduinoCommand(`DEV.MOTOR.EXEC_TIMED_RUN:${deviceStatus.motor.pwm}|${stepDuration}`);
        vibrationDirection = vibrationDirection === 0 ? 1 : 0; // Her adımda yönü değiştir
    };

    performStep(); // İlk adımı hemen at
    vibrationInterval = setInterval(performStep, totalIntervalTime);

    broadcastDeviceStatus();
};

/**
 * Motorun PWM (hız) değerini günceller.
 * Eğer motor zaten çalışıyorsa, mevcut hızından yeni hedefe pürüzsüzce rampalar.
 */
export const setMotorPwm = (value: number) => {
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
            const rpm = pwmToCalibratedRpm(newTargetPwm);
            startOscillation({ ...deviceStatus.oscillationSettings, pwm: newTargetPwm, rpm }, true);
        }
        else if (deviceStatus.operatingMode === 'pulse') {
            startPulseMode(true);
        }
    }
    else {
        // Motor çalışmıyorsa, sadece güncellenmiş durumu (yeni hedef hızı) arayüze bildir.
        broadcastDeviceStatus();
    }
};


/**
 * Motorun dönüş yönünü ayarlar.
 * @param direction - Yeni yön (0: CW, 1: CCW).
 */
export const setMotorDirection = (direction: MotorDirection) => {
    deviceStatus.motor.direction = direction;
    sendRawArduinoCommand(`DEV.MOTOR.SET_DIR:${direction}`);
    broadcastDeviceStatus();
};

/**
 * Cihazın çalışma modunu (sürekli/osilasyon) ayarlar.
 * Eğer motor çalışıyorsa, durdurup yeni modda yeniden başlatır.
 * @param mode - Yeni çalışma modu.
 */
export const setOperatingMode = (mode: OperatingMode) => {
    // Eğer zaten aynı moddaysak, hiçbir şey yapma
    if (deviceStatus.operatingMode === mode) return;

    // 1. Motorun mevcut durumunu kaydet (çalışıyor muydu?)
    const wasActive = deviceStatus.motor.isActive;

    // 2. Eğer motor çalışıyorsa, yeni moda geçmeden önce mevcut görevi durdur.
    if (wasActive) {
        internalStopMotor();
    }

    // 3. Yeni çalışma modunu ayarla.
    deviceStatus.operatingMode = mode;

    // 4. SADECE VE SADECE motor daha önce de çalışıyorsa, yeni modda tekrar başlat.
    if (wasActive) {
        if (mode === 'continuous') {
            startMotor(true);
        } else if (mode === 'oscillation') {
            const rpm = pwmToCalibratedRpm(deviceStatus.motor.pwm);
            startOscillation({ ...deviceStatus.oscillationSettings, pwm: deviceStatus.motor.pwm, rpm }, true);
        } else if (mode === 'pulse') {
            startPulseMode(true);
        } else if (mode === 'vibration') {
            startVibrationMode(true);
        }
    }
    // 5. Eğer motor duruyorsa, motoru çalıştırma, sadece güncellenmiş durumu arayüze bildir.
    else {
        broadcastDeviceStatus();
    }
};

/**
 * Sürekli mod ayarlarını günceller.
 * @param settings - Yeni sürekli mod ayarları.
 */
export const setContinuousSettings = (settings: ContinuousSettings) => {
    deviceStatus.continuousSettings = settings;
    // Sürekli mod çalışırken ayar değişirse anlık etki etmesi istenirse
    // buraya bir yeniden başlatma mantığı eklenebilir. Şimdilik sadece durumu güncelliyoruz.
    broadcastDeviceStatus();
};

/**
 * Osilasyon ayarlarını (şu an için sadece açı) günceller.
 * Eğer motor osilasyon modunda çalışıyorsa, yeni ayarlarla yeniden başlatır.
 * @param settings - Yeni osilasyon ayarları.
 */
export const setOscillationSettings = (settings: OscillationSettings) => {
    const wasActive = deviceStatus.motor.isActive;
    deviceStatus.oscillationSettings = settings;

    if (wasActive && deviceStatus.operatingMode === 'oscillation') {
        const rpm = pwmToCalibratedRpm(deviceStatus.motor.pwm);
        startOscillation({ ...settings, pwm: deviceStatus.motor.pwm, rpm }, true);
    } else {
        broadcastDeviceStatus();
    }
};

/**
 * Darbe modu ayarlarını (darbe süresi, bekleme süresi) günceller.
 * Eğer motor darbe modunda çalışıyorsa, yeni ayarlarla döngüyü yeniden başlatır.
 * @param settings - Yeni darbe ayarları.
 */
export const setPulseSettings = (settings: PulseSettings) => {
    // 1. Yeni ayarları hemen deviceStatus'a işle.
    deviceStatus.pulseSettings = settings;

    // 2. Motorun zaten darbe modunda çalışıp çalışmadığını kontrol et.
    const isMotorActiveInPulseMode =
        deviceStatus.motor.isActive && deviceStatus.operatingMode === 'pulse';

    // 3. Eğer motor zaten darbe modunda çalışıyorsa, döngüyü yeni ayarlarla yeniden başlat.
    // Bu, çalışan setInterval'i temizleyip yenisini kurar.
    if (isMotorActiveInPulseMode) {
        console.log("Darbe modu çalışırken ayarlar değişti. Döngü yeniden başlatılıyor...");
        startPulseMode(true);
    }
    // 4. Motor çalışmıyorsa, sadece güncellenmiş durumu arayüze bildir.
    else {
        broadcastDeviceStatus();
    }
};

/**
 * Titreşim modu ayarlarını günceller.
 * Eğer motor titreşim modunda çalışıyorsa, yeni ayarlarla yeniden başlatır.
 * @param settings - Yeni titreşim ayarları.
 */
export const setVibrationSettings = (settings: VibrationSettings) => {
    const wasActive = deviceStatus.motor.isActive;
    deviceStatus.vibrationSettings = settings;

    if (wasActive && deviceStatus.operatingMode === 'vibration') {
        startVibrationMode(true); // Yeni ayarlarla yeniden başlat
    } else {
        broadcastDeviceStatus();
    }
};

/**
 * Arduino'nun mevcut bağlantı durumunu döndürür.
 * @returns {boolean} Arduino bağlı ise true, değilse false.
 */
export const getIsArduinoConnected = () => {
    return isArduinoConnected;
};
