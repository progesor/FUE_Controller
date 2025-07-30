// packages/backend/src/services/arduinoService.ts

import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import { Server } from 'socket.io';
import type { MotorDirection, ClientToServerEvents, ServerToClientEvents, OperatingMode, OscillationSettings, DeviceStatus } from '../../../shared-types';
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

/** Osilasyon modunda motoru periyodik olarak çalıştıran interval. */
let oscillationInterval: NodeJS.Timeout | null = null;

/** Osilasyonun bir sonraki adımda hangi yöne döneceğini tutar. */
let oscillationDirection: MotorDirection = 0; // 0: CW, 1: CCW

/**
 * Cihazın anlık durumunu tutan tek gerçek kaynak (Single Source of Truth).
 * Tüm değişiklikler bu nesne üzerinden yapılır ve istemcilere yayınlanır.
 */
let deviceStatus: DeviceStatus = {
    motor: { isActive: false, pwm: 100, direction: 0 },
    operatingMode: 'continuous',
    oscillationSettings: { angle: 180 },
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
const sendCommand = (command: string) => {
    if (port && port.isOpen) {
        port.write(`${command}\n`, (err) => {
            if (err) {
                console.error('Arduino komut gönderim hatası:', err.message);
                return;
            }
            // Ping komutları çok sık gönderildiği için log'ları kirletmemesi adına opsiyonel olarak gizlenir.
            if (!command.startsWith('SYS.PING') || config.arduino.logPings) {
                console.log(`[RPi -> Arduino]: ${command}`);
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

    console.log(`[Arduino -> RPi]: ${data}`);

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
        if (pingInterval) clearInterval(pingInterval);
        pingInterval = setInterval(() => sendCommand('SYS.PING'), config.arduino.pingInterval);
        io?.emit('arduino_connected');
        broadcastDeviceStatus(); // Bağlanır bağlanmaz mevcut durumu arayüze gönder
    });

    parser.on('data', handleData);

    port.on('close', () => {
        console.warn("Arduino bağlantısı kesildi. Yeniden bağlanmaya çalışılıyor...");
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
    sendCommand('DEV.MOTOR.STOP');
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
 * Motoru sürekli modda çalıştırır.
 * @param isContinuation - Eğer bir mod değişikliği sonrası devam ediyorsa true.
 * Bu, motorun zaten aktif olduğu bir durumda tekrar 'start'
 * isteği gelmesini engeller.
 */
export const startMotor = (isContinuation = false) => {
    if (!isContinuation && deviceStatus.motor.isActive) return;
    internalStopMotor(); // Önceki modu (örn: osilasyon) temizle

    deviceStatus.motor.isActive = true;
    if (deviceStatus.motor.pwm === 0) deviceStatus.motor.pwm = 100; // Eğer hız 0 ise varsayılan bir değere çek

    sendCommand(`DEV.MOTOR.SET_DIR:${deviceStatus.motor.direction}`);
    sendCommand(`DEV.MOTOR.SET_PWM:${deviceStatus.motor.pwm}`);
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
        sendCommand(`DEV.MOTOR.SET_DIR:${oscillationDirection}`);
        sendCommand(`DEV.MOTOR.EXEC_TIMED_RUN:${deviceStatus.motor.pwm}|${ms}`);
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
 * Motorun PWM (hız) değerini günceller.
 * Eğer motor zaten çalışıyorsa, yeni hız değerini anında uygular.
 * @param value - Yeni PWM değeri (0-255).
 */
export const setMotorPwm = (value: number) => {
    const wasActive = deviceStatus.motor.isActive;
    const pwm = Math.max(0, Math.min(255, value)); // Değeri 0-255 aralığına sıkıştır
    deviceStatus.motor.pwm = pwm;

    if (wasActive) {
        if (deviceStatus.operatingMode === 'continuous') {
            sendCommand(`DEV.MOTOR.SET_PWM:${pwm}`);
        } else {
            // Osilasyon modundaysa, yeni hıza göre osilasyonu yeniden başlat
            const rpm = pwmToCalibratedRpm(pwm);
            startOscillation({ ...deviceStatus.oscillationSettings, pwm, rpm }, true);
        }
    }
    broadcastDeviceStatus();
};

/**
 * Motorun dönüş yönünü ayarlar.
 * @param direction - Yeni yön (0: CW, 1: CCW).
 */
export const setMotorDirection = (direction: MotorDirection) => {
    deviceStatus.motor.direction = direction;
    sendCommand(`DEV.MOTOR.SET_DIR:${direction}`);
    broadcastDeviceStatus();
};

/**
 * Cihazın çalışma modunu (sürekli/osilasyon) ayarlar.
 * Eğer motor çalışıyorsa, durdurup yeni modda yeniden başlatır.
 * @param mode - Yeni çalışma modu.
 */
export const setOperatingMode = (mode: OperatingMode) => {
    if (deviceStatus.operatingMode === mode) return; // Zaten bu moddaysa bir şey yapma

    const wasActive = deviceStatus.motor.isActive;
    if (wasActive) {
        internalStopMotor(); // Mod değiştirmeden önce motoru durdur
    }

    deviceStatus.operatingMode = mode;

    if (wasActive) { // Eğer motor daha önce aktifse, yeni modda tekrar çalıştır
        if (mode === 'continuous') {
            startMotor(true);
        } else {
            const rpm = pwmToCalibratedRpm(deviceStatus.motor.pwm);
            startOscillation({ ...deviceStatus.oscillationSettings, pwm: deviceStatus.motor.pwm, rpm }, true);
        }
    } else {
        broadcastDeviceStatus(); // Motor aktif değilse, sadece mod değişikliğini yayınla
    }
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