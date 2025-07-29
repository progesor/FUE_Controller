import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import { Server } from 'socket.io';
import type {MotorDirection, ClientToServerEvents, ServerToClientEvents, MotorStatus} from '../../../shared-types';
import config from '../config';

// io nesnesini tutacak bir değişken ekliyoruz.
let io: Server<ClientToServerEvents, ServerToClientEvents> | null = null;

// Servisimizin durumunu tutacak modül seviyesinde değişkenler
let port: SerialPort | null = null;
let parser: ReadlineParser | null = null;
let isConnected = false;
let pingInterval: NodeJS.Timeout | null = null;

let motorStatus: MotorStatus = {
    isActive: false,
    pwm: 0,
    direction: 0,
};

/**
 * Bu servis modülünü ana Socket.IO sunucusu ile başlatır.
 * @param socketIoServer server.ts'de oluşturulan io nesnesi.
 */
export const initializeArduinoService = (socketIoServer: Server<ClientToServerEvents, ServerToClientEvents>) => {
    io = socketIoServer;
};

const broadcastMotorStatus = () => {
    io?.emit('motor_status_update', motorStatus);
};

/**
 * Arduino'nun bağlı olduğu portu otomatik olarak bulmaya çalışır.
 * @returns {Promise<string | null>} Bulunan portun yolu veya null.
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
 * Arduino'dan gelen veriyi işleyen fonksiyon.
 * @param {string} data Arduino'dan gelen ham veri satırı.
 */
const handleData = (data: string) => {
    if (data.startsWith('PONG') && !config.arduino.logPings) {
        // Sessizce geç
    } else {
        console.log(`[Arduino -> RPi]: ${data}`);
    }

    // Pedal basma olayı
    if (data.startsWith('EVT:PEDAL:1')) {
        motorStatus.isActive = true;
        sendCommand(`DEV.MOTOR.SET_PWM:${motorStatus.pwm || 100}`);
        broadcastMotorStatus();

        // --- EKLENECEK KOD ---
        // Bu olayı arayüze de bildir.
        io?.emit('arduino_event', { type: 'PEDAL', state: 1 });

    }
    // Pedal bırakma olayı
    else if (data.startsWith('EVT:PEDAL:0')) {
        motorStatus.isActive = false;
        sendCommand('DEV.MOTOR.STOP');
        broadcastMotorStatus();

        // --- EKLENECEK KOD ---
        // Bu olayı arayüze de bildir. Arayüz bu olayı sayım için kullanacak.
        io?.emit('arduino_event', { type: 'PEDAL', state: 0 });
    }
};

/**
 * Arduino'ya bağlanmayı deneyen ana fonksiyon (Hibrit Mantık ile).
 */
export const connectToArduino = async () => {
    let portPath: string | null = config.arduino.port || null;

    // Manuel port belirtilmemişse, otomatik bulmayı dene
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

/**
 * Arduino'ya UniCom formatında komut gönderir.
 * @param {string} command Gönderilecek komut.
 */
const sendCommand = (command: string) => {
    if (port && port.isOpen) {
        port.write(`${command}\n`, (err) => {
            if (err) return console.error('Komut gönderilirken hata:', err.message);

            // Ping loglama kontrolü
            if (!command.startsWith('SYS.PING') || config.arduino.logPings) {
                console.log(`[RPi -> Arduino]: ${command}`);
            }
        });
    } else {
        console.warn("Komut gönderilemedi. Arduino bağlı değil veya port açık değil.");
    }
};

// --- DIŞA AÇILAN KONTROL FONKSİYONLARI ---

export const setMotorPwm = (value: number) => {
    const pwm = Math.max(0, Math.min(255, value));
    motorStatus.pwm = pwm; // Önce durumu güncelle
    if (motorStatus.isActive) {
        sendCommand(`DEV.MOTOR.SET_PWM:${pwm}`);
    }
    broadcastMotorStatus(); // Durumu yayınla
};

export const setMotorDirection = (direction: MotorDirection) => {
    motorStatus.direction = direction;
    sendCommand(`DEV.MOTOR.SET_DIR:${direction}`);
    broadcastMotorStatus();
};

export const stopMotor = () => {
    motorStatus.isActive = false;
    sendCommand('DEV.MOTOR.STOP');
    broadcastMotorStatus();
};

export const startMotor = () => {
    motorStatus.isActive = true;
    sendCommand(`DEV.MOTOR.SET_PWM:${motorStatus.pwm || 100}`); // Kayıtlı son hızla veya varsayılan bir hızla başla
    broadcastMotorStatus();
};

export const executeTimedRun = (pwm: number, ms: number) => {
    sendCommand(`DEV.MOTOR.EXEC_TIMED_RUN:${pwm}|${ms}`);
};

export const pingArduino = () => {
    if (isConnected) {
        sendCommand('SYS.PING');
    }
};