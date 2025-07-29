import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import type { MotorDirection } from '../../../shared-types';
import config from '../config';

// Servisimizin durumunu tutacak modül seviyesinde değişkenler
let port: SerialPort | null = null;
let parser: ReadlineParser | null = null;
let isConnected = false;
let pingInterval: NodeJS.Timeout | null = null;

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
    console.log(`[Arduino -> RPi]: ${data}`);
    // TODO: Bu veri, Socket.IO ile arayüze gönderilecek.
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
        // TODO: Arayüze 'arduino_connected' olayını gönder
    });

    parser.on('data', handleData);

    port.on('close', () => {
        isConnected = false;
        console.warn("Arduino bağlantısı kesildi. Yeniden bağlanmaya çalışılıyor...");
        if (pingInterval) clearInterval(pingInterval);
        // TODO: Arayüze 'arduino_disconnected' olayını gönder
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
    if (port && isConnected) {
        port.write(`${command}\n`, (err) => {
            if (err) {
                return console.error('Komut gönderilirken hata:', err.message);
            }
            console.log(`[RPi -> Arduino]: ${command}`);
        });
    } else {
        console.warn("Komut gönderilemedi. Arduino bağlı değil.");
    }
};

// --- DIŞA AÇILAN KONTROL FONKSİYONLARI ---

export const setMotorPwm = (value: number) => {
    const pwm = Math.max(0, Math.min(255, value));
    sendCommand(`DEV.MOTOR.SET_PWM:${pwm}`);
};

export const setMotorDirection = (direction: MotorDirection) => {
    sendCommand(`DEV.MOTOR.SET_DIR:${direction}`);
};

export const stopMotor = () => {
    sendCommand('DEV.MOTOR.STOP');
};

export const executeTimedRun = (pwm: number, ms: number) => {
    sendCommand(`DEV.MOTOR.EXEC_TIMED_RUN:${pwm}|${ms}`);
};

export const pingArduino = () => {
    if (isConnected) {
        sendCommand('SYS.PING');
    }
};