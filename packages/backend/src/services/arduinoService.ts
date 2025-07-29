import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import { Server } from 'socket.io';
import type { MotorDirection, MotorStatus, ClientToServerEvents, ServerToClientEvents } from '../../../shared-types';
import config from '../config';
import { getMsFromCalibration } from './calibrationService'; // Kalibrasyon servisini import et

// io nesnesini tutacak bir değişken ekliyoruz.
let io: Server<ClientToServerEvents, ServerToClientEvents> | null = null;

// Servisimizin durumunu tutacak modül seviyesinde değişkenler
let port: SerialPort | null = null;
let parser: ReadlineParser | null = null;
let isConnected = false;
let pingInterval: NodeJS.Timeout | null = null;
let oscillationInterval: NodeJS.Timeout | null = null;
let oscillationDirection: MotorDirection = 0;

// Backend'in Tek Doğruluk Kaynağı olarak motor durumu
let motorStatus: MotorStatus = {
    isActive: false,
    pwm: 100, // Başlangıçta varsayılan bir hız
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
        if (motorStatus.pwm === 0) motorStatus.pwm = 100;
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

export const startOscillation = (options: { pwm: number; angle: number; rpm: number }) => {
    stopMotor(); // Önce çalışan başka bir mod varsa durdur
    motorStatus.isActive = true;
    motorStatus.pwm = options.pwm;
    broadcastMotorStatus();

    const ms = getMsFromCalibration(options.rpm, options.angle);
    if (ms === 0) {
        console.error("Osilasyon başlatılamadı, kalibrasyon verisi bulunamadı.");
        stopMotor();
        return;
    }

    const performStep = () => {
        sendCommand(`DEV.MOTOR.SET_DIR:${oscillationDirection}`);
        sendCommand(`DEV.MOTOR.EXEC_TIMED_RUN:${motorStatus.pwm}|${ms}`);
        oscillationDirection = oscillationDirection === 0 ? 1 : 0;
    };

    performStep();
    oscillationInterval = setInterval(performStep, ms * 2 + 50);
};

export const pingArduino = () => {
    if (isConnected) {
        sendCommand('SYS.PING');
    }
};