// packages/backend/src/services/arduinoService.ts

import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import { Server } from 'socket.io';
import config from '../config';
import { getRecipeStatus, startRecipe } from './recipeService';
import {
    ClientToServerEvents, ContinuousSettings,
    DeviceStatus,
    MotorDirection, OperatingMode, OscillationSettings, PulseSettings,
    Recipe, RecipeStep,
    ServerToClientEvents, VibrationSettings
} from "shared-types/index";

// ===================================================================
//                        Hardware Protocol Constants
// ===================================================================

const CMD_PING = 0x01;
const CMD_SET_RPM = 0x10;
const CMD_STOP = 0x20;
const CMD_SET_PID = 0x30;
const CMD_OSC_ANGLE = 0x40;
const CMD_OSC_TIME = 0x50;
const CMD_GET_PARAMS = 0x60;
const CMD_SAVE_PARAMS = 0x70;

// ===================================================================
//                        State Management
// ===================================================================

let io: Server<ClientToServerEvents, ServerToClientEvents> | null = null;
let port: SerialPort | null = null;
let parser: ReadlineParser | null = null;
let pingInterval: NodeJS.Timeout | null = null;
let watchdogInterval: NodeJS.Timeout | null = null;
let lastHeartbeatTime = 0;
let isArduinoConnected = false;
let activeRecipe: Recipe | null = null;
let pulseTimer: NodeJS.Timeout | null = null;
let lastStopTime = 0; // YENİ: Motorun son durdurulma zamanı

export const setActiveRecipe = (recipe: Recipe | null) => {
    activeRecipe = recipe;
};

// Note: `pwm` is kept for frontend type compatibility but is now treated as Target RPM
let deviceStatus: DeviceStatus = {
    motor: { isActive: false, pwm: 1000, direction: 0 },
    operatingMode: 'continuous',
    oscillationSettings: { angle: 180, mode: 'angle', timeMs: 500, accel: 35000 },
    pulseSettings: { baseRpm: 1000, pulseRpm: 5000, pulseDuration: 100, pulseInterval: 1000 },
    vibrationSettings: { timeMs: 20, rpm: 3000, accel: 100000 },
    continuousSettings: { rampDuration: 0 },
};

export const initializeArduinoService = (socketIoServer: Server<ClientToServerEvents, ServerToClientEvents>) => {
    io = socketIoServer;
};

const broadcastDeviceStatus = () => {
    const currentRecipeStatus = getRecipeStatus();
    const combinedStatus = {
        ...deviceStatus,
        recipeStatus: currentRecipeStatus,
    };
    io?.emit('device_status_update', combinedStatus);
};

// ===================================================================
//                      Binary Packet Builder
// ===================================================================

/**
 * Calculates Modbus CRC16. Includes payload length, command byte, and payload.
 */
function calculateCRC16Modbus(buffer: Buffer): number {
    let crc = 0xFFFF;
    for (let i = 0; i < buffer.length; i++) {
        crc ^= buffer[i];
        for (let j = 0; j < 8; j++) {
            if ((crc & 0x0001) !== 0) {
                crc = (crc >> 1) ^ 0xA001;
            } else {
                crc >>= 1;
            }
        }
    }
    return crc;
}

/**
 * Builds the exact binary packet expected by the STM32 UART protocol.
 */
function sendBinaryCommand(command: number, payload: Buffer = Buffer.alloc(0)) {
    if (!port || !port.isOpen) {
        console.warn("Command failed: Arduino not connected.");
        return;
    }

    const payloadLength = payload.length;

    // 1. Build Header: 0xAA, 0x55, Length, Command
    const header = Buffer.from([0xAA, 0x55, payloadLength, command]);

    // 2. Data for CRC: Length, Command, Payload
    const dataToCrc = Buffer.concat([Buffer.from([payloadLength, command]), payload]);
    const crc16 = calculateCRC16Modbus(dataToCrc);

    // 3. Build CRC Buffer (Little-Endian)
    const crcBuffer = Buffer.alloc(2);
    crcBuffer.writeUInt16LE(crc16, 0);

    // 4. Combine and send
    const finalPacket = Buffer.concat([header, payload, crcBuffer]);

    port.write(finalPacket, (err) => {
        if (err) console.error('Binary transmission error:', err.message);
    });
}

// ===================================================================
//                   Serial Port & Telemetry Handling
// ===================================================================

const handleData = (data: string) => {
    const cleanData = data.trim();

    // 1. Heartbeat (Ping/Pong) Yakalama
    if (cleanData.includes('HB_OK')) {
        lastHeartbeatTime = Date.now(); // Son görülme zamanını güncelle
        if (!config.arduino.logPings) return; // İstenmiyorsa konsola basma
    }

    // 2. Telemetri Spam'ini Filtreleme
    // Telemetri verisini doğrudan frontend'e fırlat ve konsola basma!
    if (cleanData.startsWith('<TEL')) {
        io?.emit('telemetry_data', cleanData);
        return;
    }

    if (cleanData.startsWith('<PRM')) {
        io?.emit('device_params_response', cleanData);
        return;
    }

    // Sadece önemli hata veya debug mesajlarını konsola bas
    console.log(`[STM32 -> Server]: ${cleanData}`);

    // 3. Donanım Event'lerini (Pedal) İşleme
    if (cleanData.startsWith('<EVT:PEDAL:1>')) {
        // YENİ: Elektromanyetik Geri Besleme (EMI) Koruması!
        // Motor durduktan sonraki 1.5 saniye (1500ms) içindeki pedal sinyallerini parazit sayıp reddet.
        if (Date.now() - lastStopTime > 1500) {
            if (activeRecipe && !getRecipeStatus().isRunning) {
                startRecipe(activeRecipe);
            } else if (!getRecipeStatus().isRunning) {
                startCurrentMode();
            }
        } else {
            console.log("[EMI KORUMASI] Motor duruşu sırasındaki elektriksel parazit (sahte pedal) engellendi.");
        }

        io?.emit('arduino_event', { type: 'PEDAL', state: 1 });
    } else if (cleanData.startsWith('<EVT:PEDAL:0>')) {
        if (!getRecipeStatus().isRunning) stopMotor();
        io?.emit('arduino_event', { type: 'PEDAL', state: 0 });
    }
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
        return null;
    }
};

export const connectToArduino = async () => {
    let portPath = config.arduino.port || await findArduinoPort();
    // let portPath = "COM3"; // Test için sabitlediğimiz port

    if (!portPath) {
        console.error("Arduino port not found. Retrying...");
        setTimeout(connectToArduino, config.arduino.reconnectTimeout);
        return;
    }

    try {
        console.log(`Connecting to STM32 on port '${portPath}'...`);
        port = new SerialPort({ path: portPath, baudRate: config.arduino.baudRate });
        parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

        port.on('open', () => {
            console.log(`STM32 Connected: ${portPath}`);
            isArduinoConnected = true;
            lastHeartbeatTime = Date.now(); // Watchdog başlangıç zamanı

            if (pingInterval) clearInterval(pingInterval);
            if (watchdogInterval) clearInterval(watchdogInterval);

            // Periyodik olarak 0x01 (Ping) komutu gönder
            pingInterval = setInterval(() => sendBinaryCommand(CMD_PING), config.arduino.pingInterval);

            // Yanıt gelip gelmediğini kontrol eden Watchdog
            watchdogInterval = setInterval(() => {
                const timeSinceLastHeartbeat = Date.now() - lastHeartbeatTime;
                // 3 ping periyodu boyunca yanıt gelmezse cihazı "Deaf/Donmuş" kabul et
                if (timeSinceLastHeartbeat > (config.arduino.pingInterval * 3)) {
                    console.error(`[WATCHDOG ERROR] STM32 yanıt vermiyor (${timeSinceLastHeartbeat}ms). Port sıfırlanıyor...`);
                    port?.close(); // Bu işlem port.on('close') eventini tetikler
                }
            }, config.arduino.pingInterval);

            io?.emit('arduino_connected');
            broadcastDeviceStatus();
        });

        parser.on('data', handleData);

        port.on('close', () => {
            isArduinoConnected = false;
            if (pingInterval) clearInterval(pingInterval);
            if (watchdogInterval) clearInterval(watchdogInterval);
            io?.emit('arduino_disconnected');
            setTimeout(connectToArduino, config.arduino.reconnectTimeout);
        });

        port.on('error', (err) => {
            port?.close();
        });
    } catch (err) {
        isArduinoConnected = false;
        io?.emit('arduino_disconnected');
        setTimeout(connectToArduino, config.arduino.reconnectTimeout);
    }
};

// ===================================================================
//                      Hardware-Offloaded Motor Control
// ===================================================================

export const stopMotor = () => {
    if (pulseTimer) clearInterval(pulseTimer); // Pulse döngüsünü kır
    sendBinaryCommand(CMD_STOP);
    deviceStatus.motor.isActive = false;
    lastStopTime = Date.now(); // YENİ: Motorun durduğu anı milisaniye olarak kaydet
    broadcastDeviceStatus();
};

export const startContinuousMode = (isContinuation = false) => {
    // if (!isContinuation && deviceStatus.motor.isActive) return;

    deviceStatus.motor.isActive = true;

    // Send Target RPM directly (4 bytes, float, Little-Endian)
    const payload = Buffer.alloc(4);
    payload.writeFloatLE(deviceStatus.motor.pwm, 0);

    sendBinaryCommand(CMD_SET_RPM, payload);
    broadcastDeviceStatus();
};

export const startOscillation = (options?: { pwm?: number; angle?: number; rpm?: number }, isContinuation = false) => {
    if (!isContinuation && deviceStatus.motor.isActive) return;

    if (options?.pwm !== undefined) deviceStatus.motor.pwm = options.pwm;
    if (options?.angle !== undefined) deviceStatus.oscillationSettings.angle = options.angle;

    deviceStatus.motor.isActive = true;

    // Arayüzden gelen tüm ayarları çekiyoruz
    const { angle = 180, timeMs = 500, accel = 5000, mode = 'angle' } = deviceStatus.oscillationSettings;

    const payload = Buffer.alloc(12);
    if (mode === 'time') {
        payload.writeFloatLE(timeMs, 0);
        payload.writeFloatLE(deviceStatus.motor.pwm, 4);
        payload.writeFloatLE(accel, 8);
        sendBinaryCommand(CMD_OSC_TIME, payload); // Süre Odaklı
    } else {
        payload.writeFloatLE(angle, 0);
        payload.writeFloatLE(deviceStatus.motor.pwm, 4);
        payload.writeFloatLE(accel, 8);
        sendBinaryCommand(CMD_OSC_ANGLE, payload); // Açı Odaklı
    }
    broadcastDeviceStatus();
};

export const startVibrationMode = (isContinuation = false) => {
    if (!isContinuation && deviceStatus.motor.isActive) return;
    deviceStatus.motor.isActive = true;

    // Titreşim: Süre Odaklı Osilasyonun mikro düzeyde kullanılması
    const { timeMs = 20, accel = 50000 } = deviceStatus.vibrationSettings || {};
    const rpm = deviceStatus.vibrationSettings?.rpm || deviceStatus.motor.pwm;

    const payload = Buffer.alloc(12);
    payload.writeFloatLE(timeMs, 0);
    payload.writeFloatLE(rpm, 4);
    payload.writeFloatLE(accel, 8);

    sendBinaryCommand(CMD_OSC_TIME, payload);
    broadcastDeviceStatus();
};

export const startPulseMode = (isContinuation = false) => {
    if (!isContinuation && deviceStatus.motor.isActive) return;
    deviceStatus.motor.isActive = true;

    if (pulseTimer) clearInterval(pulseTimer);

    const { baseRpm = 1000, pulseRpm = 5000, pulseDuration = 100, pulseInterval = 1000 } = deviceStatus.pulseSettings || {};

    // 1. Motoru Base RPM ile başlat
    const payloadBase = Buffer.alloc(4);
    payloadBase.writeFloatLE(baseRpm, 0);
    sendBinaryCommand(CMD_SET_RPM, payloadBase);

    // 2. Darbe (Pulse) Döngüsünü Kur
    pulseTimer = setInterval(() => {
        if (!deviceStatus.motor.isActive || deviceStatus.operatingMode !== 'pulse') {
            clearInterval(pulseTimer!);
            return;
        }

        // Pik hıza çık
        const payloadPulse = Buffer.alloc(4);
        payloadPulse.writeFloatLE(pulseRpm, 0);
        sendBinaryCommand(CMD_SET_RPM, payloadPulse);

        // Darbe süresi bittiğinde tekrar Base RPM'e dön
        setTimeout(() => {
            if (deviceStatus.motor.isActive && deviceStatus.operatingMode === 'pulse') {
                sendBinaryCommand(CMD_SET_RPM, payloadBase);
            }
        }, pulseDuration);

    }, pulseInterval);

    broadcastDeviceStatus();
};

// ===================================================================
//                      State Updaters
// ===================================================================

export const setMotorPwm = (value: number) => {
    deviceStatus.motor.pwm = value; // Treat 'pwm' as Target RPM now
    if (deviceStatus.motor.isActive) startCurrentMode();
    else broadcastDeviceStatus();
};

export const setMotorDirection = (direction: MotorDirection) => {
    deviceStatus.motor.direction = direction;
    // Note: If direction requires a binary update, send it here.
    broadcastDeviceStatus();
};

export const setOperatingMode = (mode: OperatingMode) => {
    if (deviceStatus.operatingMode === mode) return;
    deviceStatus.operatingMode = mode;
    if (deviceStatus.motor.isActive) startCurrentMode();
    else broadcastDeviceStatus();
};

export const setContinuousSettings = (settings: ContinuousSettings) => {
    deviceStatus.continuousSettings = settings;
    broadcastDeviceStatus();
};

export const setOscillationSettings = (settings: OscillationSettings) => {
    deviceStatus.oscillationSettings = settings;
    if (deviceStatus.motor.isActive && deviceStatus.operatingMode === 'oscillation') {
        startOscillation(undefined, true);
    } else broadcastDeviceStatus();
};

export const setPulseSettings = (settings: PulseSettings) => {
    deviceStatus.pulseSettings = settings;
    if (deviceStatus.motor.isActive && deviceStatus.operatingMode === 'pulse') {
        startPulseMode(true);
    } else broadcastDeviceStatus();
};

export const setVibrationSettings = (settings: VibrationSettings) => {
    deviceStatus.vibrationSettings = settings;
    if (deviceStatus.motor.isActive && deviceStatus.operatingMode === 'vibration') {
        startVibrationMode(true);
    } else broadcastDeviceStatus();
};

// packages/backend/src/services/arduinoService.ts İÇİNDEKİ İLGİLİ FONKSİYONLARI DEĞİŞTİR:

export const executeStep = (step: RecipeStep) => {
    deviceStatus.operatingMode = step.mode;

    if (step.settings) {
        // 1. Ortak Motor Hızını (PWM/RPM) Güncelleme
        if ('pwm' in step.settings && typeof step.settings.pwm === 'number') {
            deviceStatus.motor.pwm = step.settings.pwm;
        } else if (step.mode === 'vibration' && 'rpm' in step.settings) {
            deviceStatus.motor.pwm = (step.settings as VibrationSettings).rpm;
        } else if (step.mode === 'pulse' && 'baseRpm' in step.settings) {
            deviceStatus.motor.pwm = (step.settings as PulseSettings).baseRpm;
        }

        // 2. Moda Özel Gelişmiş Ayarları Güncelleme
        switch (step.mode) {
            case 'continuous':
                deviceStatus.continuousSettings = { ...deviceStatus.continuousSettings, ...(step.settings as ContinuousSettings) };
                break;
            case 'oscillation':
                deviceStatus.oscillationSettings = { ...deviceStatus.oscillationSettings, ...(step.settings as OscillationSettings) };
                break;
            case 'pulse':
                deviceStatus.pulseSettings = { ...deviceStatus.pulseSettings, ...(step.settings as PulseSettings) };
                break;
            case 'vibration':
                deviceStatus.vibrationSettings = { ...deviceStatus.vibrationSettings, ...(step.settings as VibrationSettings) };
                break;
        }
    }

    // YENİ: Kilitleri aşması için isContinuation bayrağını 'true' olarak gönderiyoruz!
    startCurrentMode(true);
};

export const stopMotorFromRecipe = () => {
    stopMotor();
};

// YENİ: isContinuation parametresini alt fonksiyonlara paslıyoruz
export const startCurrentMode = (isContinuation = false) => {
    switch (deviceStatus.operatingMode) {
        case 'continuous': startContinuousMode(isContinuation); break;
        case 'oscillation': startOscillation(undefined, isContinuation); break;
        case 'pulse': startPulseMode(isContinuation); break;
        case 'vibration': startVibrationMode(isContinuation); break;
    }
};

// ===================================================================
//                Geriye Dönük Uyumluluk (Legacy / Server.ts)
// ===================================================================

/**
 * server.ts'in bağlantı durumunu sorgulayabilmesi için getter.
 */
export const getIsArduinoConnected = () => {
    return isArduinoConnected;
};

/**
 * Eski sistemdeki startMotor çağrılarını yeni akıllı başlatıcıya yönlendirir.
 */
export const startMotor = () => {
    startCurrentMode();
};

/**
 * Ar-Ge panelinden (frontend) gelen ham metin komutları için uyumluluk.
 * Not: Yeni firmware sadece 0xAA 0x55 binary paketleri kabul ettiği için,
 * eğer STM32 tarafında özel bir metin yakalayıcı (text parser) bırakmadıysan
 * bu komutlar cihaz tarafından görmezden gelinecektir.
 */
/**
 * Ar-Ge panelinden (frontend) gelen ham metin komutları için uyumluluk ve Hack'ler.
 */
export const sendCommand = (command: string) => {
    // Gelen komutun başındaki/sonundaki gizli boşlukları veya \n karakterlerini temizle
    const cleanCommand = command.trim();

    if (cleanCommand === 'GET_PARAMS') {
        sendBinaryCommand(CMD_GET_PARAMS);
        return;
    }

    if (cleanCommand === 'SAVE_PARAMS') {
        sendBinaryCommand(CMD_SAVE_PARAMS);
        return;
    }

    if (cleanCommand.startsWith('APPLY_PID:')) {
        const parts = cleanCommand.split(':');
        const kp = parseFloat(parts[1]);
        const ki = parseFloat(parts[2]);

        const payload = Buffer.alloc(8);
        payload.writeFloatLE(kp, 0);
        payload.writeFloatLE(ki, 4);

        sendBinaryCommand(CMD_SET_PID, payload);
        console.log(`[STM32] Anlık PID Uygulandı: Kp=${kp}, Ki=${ki}`);
        return;
    }

    console.warn(`[UYARI] Tanımsız metin komutu gönderildi: '${command}'`);
    if (port && port.isOpen) {
        port.write(`${command}\n`, (err) => {
            if (err) console.error('Metin komut gönderim hatası:', err.message);
        });
    }
};