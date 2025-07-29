import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import { Server } from 'socket.io';
import type { MotorDirection, MotorStatus, ClientToServerEvents, ServerToClientEvents } from '../../../shared-types';
import config from '../config';

let io: Server<ClientToServerEvents, ServerToClientEvents> | null = null;
let port: SerialPort | null = null;
let parser: ReadlineParser | null = null;
let isConnected = false;
let pingInterval: NodeJS.Timeout | null = null;

// Backend'in Tek Doğruluk Kaynağı
let motorStatus: MotorStatus = {
    isActive: false,
    pwm: 100, // Başlangıçta varsayılan bir hız olsun
    direction: 0,
};

// Osilasyon döngüsünü yönetecek olan interval'ı tutar
let oscillationInterval: NodeJS.Timeout | null = null;
let oscillationDirection: MotorDirection = 0; // Osilasyonun mevcut yönünü tutar

/**
 * Verilen PWM hızı ve açıya göre motorun dönmesi gereken süreyi (ms) hesaplar.
 * BU FONKSİYON, CİHAZIN GERÇEK PERFORMANSINA GÖRE KALİBRE EDİLMELİDİR!
 * @param pwm Motorun hızı (0-255)
 * @param angle İstenen dönüş açısı (derece)
 * @returns {number} Milisaniye cinsinden süre
 */
const calculateMsForAngle = (pwm: number, angle: number): number => {
    if (pwm === 0) return 0;

    // Bu, tam hızda (255 PWM) 360 derecelik bir tur için gereken sürenin (ms)
    // tahmini bir kalibrasyon değeridir. Gerçek motorunuza göre ayarlanmalıdır.
    const BASE_MS_FOR_360_DEG_AT_MAX_SPEED = 200; // Örnek değer

    // Hız arttıkça süre azalır (ters orantı)
    const speedFactor = 255 / pwm;

    // Açı arttıkça süre artar (doğru orantı)
    const angleFactor = angle / 360;

    return Math.round(BASE_MS_FOR_360_DEG_AT_MAX_SPEED * speedFactor * angleFactor);
};

export const initializeArduinoService = (socketIoServer: Server<ClientToServerEvents, ServerToClientEvents>) => {
    io = socketIoServer;
};

const broadcastMotorStatus = () => {
    io?.emit('motor_status_update', motorStatus);
};

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

const handleData = (data: string) => {
    if (data.startsWith('PONG') && !config.arduino.logPings) {
        return; // Sessizce geç
    }
    console.log(`[Arduino -> RPi]: ${data}`);

    if (data.startsWith('EVT:PEDAL:1')) { // Pedal basıldı
        motorStatus.isActive = true;
        if (motorStatus.pwm === 0) motorStatus.pwm = 100; // Hız 0'sa varsayılan hızla başlat
        sendCommand(`DEV.MOTOR.SET_PWM:${motorStatus.pwm}`);
        broadcastMotorStatus();
        io?.emit('arduino_event', { type: 'PEDAL', state: 1 });
    } else if (data.startsWith('EVT:PEDAL:0')) { // Pedal bırakıldı
        motorStatus.isActive = false;
        sendCommand('DEV.MOTOR.STOP');
        broadcastMotorStatus();
        io?.emit('arduino_event', { type: 'PEDAL', state: 0 });
    }
};

export const connectToArduino = async () => {
    let portPath: string | null = config.arduino.port || null;
    if (!portPath) {
        console.log("Manuel port belirtilmemiş. Otomatik port aranıyor...");
        portPath = await findArduinoPort();
    }
    if (!portPath) {
        console.error(`Arduino portu bulunamadı. ${config.arduino.reconnectTimeout / 1000} saniye sonra tekrar denenecek.`);
        setTimeout(connectToArduino, config.arduino.reconnectTimeout);
        return;
    }
    console.log(`Port ${portPath} üzerinden Arduino'ya bağlanılıyor...`);
    port = new SerialPort({ path: portPath, baudRate: config.arduino.baudRate });
    parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));
    port.on('open', () => {
        isConnected = true;
        console.log(`Arduino'ya başarıyla bağlanıldı: ${portPath}`);
        if (pingInterval) clearInterval(pingInterval);
        pingInterval = setInterval(pingArduino, config.arduino.pingInterval);
        io?.emit('arduino_connected');
        broadcastMotorStatus(); // Bağlanır bağlanmaz mevcut durumu arayüze gönder
    });
    parser.on('data', handleData);
    port.on('close', () => {
        isConnected = false;
        console.warn("Arduino bağlantısı kesildi. Yeniden bağlanmaya çalışılıyor...");
        if (pingInterval) clearInterval(pingInterval);
        io?.emit('arduino_disconnected');
        setTimeout(connectToArduino, config.arduino.reconnectTimeout);
    });
    port.on('error', (err) => {
        console.error(`Seri port hatası (${portPath}):`, err.message);
        isConnected = false;
        port?.close();
    });
};

const sendCommand = (command: string) => {
    if (port && port.isOpen) {
        port.write(`${command}\n`, (err) => {
            if (err) return console.error('Komut gönderilirken hata:', err.message);
            if (!command.startsWith('SYS.PING') || config.arduino.logPings) {
                console.log(`[RPi -> Arduino]: ${command}`);
            }
        });
    } else {
        console.warn("Komut gönderilemedi. Arduino bağlı değil veya port açık değil.");
    }
};

export const setMotorPwm = (value: number) => {
    const pwm = Math.max(0, Math.min(255, value));
    motorStatus.pwm = pwm;
    if (motorStatus.isActive) {
        sendCommand(`DEV.MOTOR.SET_PWM:${pwm}`);
    }
    broadcastMotorStatus();
};

export const setMotorDirection = (direction: MotorDirection) => {
    motorStatus.direction = direction;
    sendCommand(`DEV.MOTOR.SET_DIR:${direction}`);
    broadcastMotorStatus();
};

export const stopMotor = () => {
    // Eğer bir osilasyon döngüsü çalışıyorsa, onu temizle
    if (oscillationInterval) {
        clearInterval(oscillationInterval);
        oscillationInterval = null;
    }
    motorStatus.isActive = false;
    sendCommand('DEV.MOTOR.STOP');
    broadcastMotorStatus();
};

export const startMotor = () => {
    motorStatus.isActive = true;
    if (motorStatus.pwm === 0) motorStatus.pwm = 100;
    sendCommand(`DEV.MOTOR.SET_PWM:${motorStatus.pwm}`);
    broadcastMotorStatus();
};

/**
 * Osilasyon modunu başlatır ve yönetir.
 */
export const startOscillation = (options: { pwm: number, angle: number }) => {
    // Önce çalışan başka bir mod varsa durdur
    stopMotor();

    // Durumu güncelle ve arayüze bildir
    motorStatus.isActive = true;
    motorStatus.pwm = options.pwm;
    broadcastMotorStatus();

    // Süreyi hesapla
    const ms = calculateMsForAngle(options.pwm, options.angle);
    if (ms === 0) return;

    // Osilasyon döngüsünü başlatan fonksiyon
    const performStep = () => {
        // Yönü ayarla
        sendCommand(`DEV.MOTOR.SET_DIR:${oscillationDirection}`);
        // Belirlenen süre kadar motoru çalıştır
        sendCommand(`DEV.MOTOR.EXEC_TIMED_RUN:${motorStatus.pwm}|${ms}`);
        // Bir sonraki adım için yönü değiştir
        oscillationDirection = oscillationDirection === 0 ? 1 : 0;
    };

    // İlk adımı hemen at, sonrakileri interval ile periyodik yap
    performStep();
    // Her adımın süresi + küçük bir bekleme payı (örn: 50ms)
    oscillationInterval = setInterval(performStep, ms * 2 + 50);
};

export const pingArduino = () => {
    if (isConnected) {
        sendCommand('SYS.PING');
    }
};