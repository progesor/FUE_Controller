// packages/frontend/src/services/socketService.ts

import { io, Socket } from 'socket.io-client';
import {type OperatingMode, type OscillationSettings, useControllerStore} from '../store/useControllerStore';
import type { ServerToClientEvents, ClientToServerEvents } from '../../../shared-types';
import config from '../../../backend/src/config'; // Backend config'ini doğrudan kullanabiliriz!

// Backend adresini config'den alıyoruz
const SERVER_URL = `http://localhost:${config.server.port}`;

// Tip-güvenli socket nesnesi oluşturuyoruz
export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SERVER_URL, {
    autoConnect: false, // Sayfa yüklenir yüklenmez otomatik bağlanmasın
});

/**
 * Backend'den gelecek tüm olayları dinleyecek olan ana fonksiyon.
 * Bu fonksiyon App.tsx'de sadece bir kez çağrılacak.
 */
export const listenToEvents = () => {
    const { setConnectionStatus, setArduinoStatus, incrementGraftCount, setFtswMode, updateDeviceStatus } = useControllerStore.getState();

    socket.on('connect', () => setConnectionStatus('connected'));
    socket.on('disconnect', () => setConnectionStatus('disconnected'));
    socket.on('arduino_connected', () => setArduinoStatus('connected'));
    socket.on('arduino_disconnected', () => setArduinoStatus('disconnected'));

    // Arduino'dan gelen pedal, switch gibi olayları dinliyoruz
    socket.on('arduino_event', (data) => {
        if (data.type === 'PEDAL' && data.state === 0) {
            incrementGraftCount();
        } else if (data.type === 'FTSW') {
            setFtswMode(data.state === 1 ? 'hand' : 'foot');
        }
    });


    // Motor durumu güncellemelerini dinliyoruz
    socket.on('device_status_update', (status) => {
        updateDeviceStatus(status);
    });



    // Manuel olarak bağlantıyı başlat
    socket.connect();
};

// --- Arayüzden Backend'e Komut Gönderecek Fonksiyonlar ---

export const sendMotorPwm = (value: number) => {
    socket.emit('set_motor_pwm', value);
}

export const sendMotorDirection = (direction: 0 | 1) => {
    socket.emit('set_motor_direction', direction);
}

export const sendStartMotor = () => {
    socket.emit('start_motor');
}

export const sendStopMotor = () => {
    socket.emit('stop_motor');
}

export const sendStartOscillation = (options: { pwm: number, angle: number, rpm: number  }) => {
    socket.emit('start_oscillation', options);
}

export const sendOperatingMode = (mode: OperatingMode) => socket.emit('set_operating_mode', mode);
export const sendOscillationSettings = (settings: OscillationSettings) => socket.emit('set_oscillation_settings', settings);