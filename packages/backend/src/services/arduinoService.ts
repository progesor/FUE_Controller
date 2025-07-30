// packages/backend/src/services/arduinoService.ts

import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import { Server } from 'socket.io';
import type { MotorDirection, ClientToServerEvents, ServerToClientEvents, OperatingMode, OscillationSettings, DeviceStatus } from '../../../shared-types';
import config from '../config';
import {getMsFromCalibration, pwmToCalibratedRpm} from './calibrationService';

let io: Server<ClientToServerEvents, ServerToClientEvents> | null = null;
let port: SerialPort | null = null;
let parser: ReadlineParser | null = null;
let isConnected = false;
let pingInterval: NodeJS.Timeout | null = null;
let oscillationInterval: NodeJS.Timeout | null = null;
let oscillationDirection: MotorDirection = 0;

// Backend'in Tek Doğruluk Kaynağı
let deviceStatus: DeviceStatus = {
    motor: {
        isActive: false,
        pwm: 100,
        direction: 0,
    },
    operatingMode: 'continuous',
    oscillationSettings: {
        angle: 180,
    },
};

export const initializeArduinoService = (socketIoServer: Server<ClientToServerEvents, ServerToClientEvents>) => { io = socketIoServer; };
const broadcastDeviceStatus = () => { io?.emit('device_status_update', deviceStatus); };

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
    if (data.startsWith('PONG') && !config.arduino.logPings) return;
    console.log(`[Arduino -> RPi]: ${data}`);

    if (data.startsWith('EVT:PEDAL:1')) {
        if (deviceStatus.operatingMode === 'continuous') {
            startMotor();
        } else {
            const rpm = pwmToCalibratedRpm(deviceStatus.motor.pwm);
            startOscillation({ ...deviceStatus.oscillationSettings, pwm: deviceStatus.motor.pwm, rpm });
        }
        io?.emit('arduino_event', { type: 'PEDAL', state: 1 });
    } else if (data.startsWith('EVT:PEDAL:0')) {
        stopMotor();
        io?.emit('arduino_event', { type: 'PEDAL', state: 0 });
    } else if (data.startsWith('EVT:FTSW:')) {
        const state = parseInt(data.split(':')[2]) as 0 | 1;
        io?.emit('arduino_event', { type: 'FTSW', state });
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
        broadcastDeviceStatus(); // Bağlanır bağlanmaz mevcut durumu arayüze gönder
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

/**
 * Motoru durdurur, intervalları temizler ancak state'i DEĞİŞTİRMEZ veya yayın YAPMAZ.
 * Bu, mod geçişleri gibi iç işlemler için kullanılır.
 */
const internalStop = () => {
    if (oscillationInterval) {
        clearInterval(oscillationInterval);
        oscillationInterval = null;
    }
    sendCommand('DEV.MOTOR.STOP');
};

export const setMotorPwm = (value: number) => {
    const wasActive = deviceStatus.motor.isActive;
    const pwm = Math.max(0, Math.min(255, value));
    deviceStatus.motor.pwm = pwm;

    if (wasActive) {
        if (deviceStatus.operatingMode === 'continuous') {
            sendCommand(`DEV.MOTOR.SET_PWM:${pwm}`);
        } else {
            const rpm = pwmToCalibratedRpm(pwm);
            startOscillation({ ...deviceStatus.oscillationSettings, pwm, rpm });
        }
    }
    broadcastDeviceStatus();
};


export const setMotorDirection = (direction: MotorDirection) => {
    deviceStatus.motor.direction = direction;
    sendCommand(`DEV.MOTOR.SET_DIR:${direction}`);
    broadcastDeviceStatus();
};

export const setOperatingMode = (mode: OperatingMode) => {
    if (deviceStatus.operatingMode === mode) return;
    const wasActive = deviceStatus.motor.isActive;
    if (wasActive) {
        internalStop();
    }
    deviceStatus.operatingMode = mode;
    if (wasActive) {
        if (mode === 'continuous') {
            startMotor(true);
        } else {
            const rpm = pwmToCalibratedRpm(deviceStatus.motor.pwm);
            startOscillation({ ...deviceStatus.oscillationSettings, pwm: deviceStatus.motor.pwm, rpm }, true);
        }
    } else {
        broadcastDeviceStatus();
    }
};


export const setOscillationSettings = (settings: OscillationSettings) => {
    const wasActive = deviceStatus.motor.isActive;
    deviceStatus.oscillationSettings = settings;

    if (wasActive && deviceStatus.operatingMode === 'oscillation') {
        // --- DEĞİŞİKLİK BURADA: Artık kaba formül yerine doğru kalibrasyon fonksiyonunu kullanıyoruz ---
        const rpm = pwmToCalibratedRpm(deviceStatus.motor.pwm);
        startOscillation({ ...settings, pwm: deviceStatus.motor.pwm, rpm }, true);
    } else {
        broadcastDeviceStatus();
    }
};


export const stopMotor = () => {
    internalStop(); // Motoru ve intervalları durdur
    deviceStatus.motor.isActive = false; // Durumu güncelle
    broadcastDeviceStatus(); // Herkese bildir
};


export const startMotor = (isContinuation = false) => {
    if (!isContinuation && deviceStatus.motor.isActive) return;
    internalStop();
    deviceStatus.motor.isActive = true;
    if (deviceStatus.motor.pwm === 0) deviceStatus.motor.pwm = 100;
    sendCommand(`DEV.MOTOR.SET_DIR:${deviceStatus.motor.direction}`);
    sendCommand(`DEV.MOTOR.SET_PWM:${deviceStatus.motor.pwm}`);
    broadcastDeviceStatus();
};

export const startOscillation = (options: { pwm: number; angle: number; rpm: number }, isContinuation = false) => {
    if (!isContinuation && deviceStatus.motor.isActive) return;
    internalStop();
    deviceStatus.motor.isActive = true;
    deviceStatus.motor.pwm = options.pwm;
    deviceStatus.oscillationSettings.angle = options.angle;

    const ms = getMsFromCalibration(options.rpm, options.angle);
    if (ms === 0) {
        console.error("Osilasyon başlatılamadı, kalibrasyon verisi bulunamadı.");
        stopMotor();
        return;
    }

    const performStep = () => {
        sendCommand(`DEV.MOTOR.SET_DIR:${oscillationDirection}`);
        sendCommand(`DEV.MOTOR.EXEC_TIMED_RUN:${deviceStatus.motor.pwm}|${ms}`);
        oscillationDirection = oscillationDirection === 0 ? 1 : 0;
    };

    performStep();
    oscillationInterval = setInterval(performStep, ms * 2 + 50);
    broadcastDeviceStatus();
};


export const pingArduino = () => {
    if (isConnected) {
        sendCommand('SYS.PING');
    }
};