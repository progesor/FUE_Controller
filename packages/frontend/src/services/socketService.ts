// packages/frontend/src/services/socketService.ts

import { io, Socket } from 'socket.io-client';
import { useControllerStore } from '../store/useControllerStore';
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
    const { setConnectionStatus, setMotorStatus, startSession, stopSession,incrementGraftCount,  } = useControllerStore.getState();

    socket.on('connect', () => {
        setConnectionStatus('connected');
        console.log('Backend aSocket.IO sunucusuna bağlandı!');
    });

    socket.on('disconnect', () => {
        setConnectionStatus('disconnected');
        console.log('Socket.IO bağlantısı kesildi.');
    });

    // Arduino bağlantı olaylarını dinliyoruz
    socket.on('arduino_connected', () => {
        // Bu olayı daha detaylı bir durum için kullanabiliriz.
        console.log('Arduino donanımı bağlandı!');
    });

    socket.on('arduino_disconnected', () => {
        console.warn('Arduino donanım bağlantısı kesildi!');
    });

    // Arduino'dan gelen pedal, switch gibi olayları dinliyoruz
    socket.on('arduino_event', (data) => {
        console.log('Arduino Olayı:', data);

        // Eğer olay pedal bırakma olayı ise, greft sayacını artır.
        // data.state === 0, PULLUP olduğu için pedalın bırakıldığı anlamına gelir.
        if (data.type === 'PEDAL' && data.state === 0) {
            incrementGraftCount();
            console.log('Pedal bırakıldı, greft sayısı artırıldı!');
        }
    });

    // Motor durumu güncellemelerini dinliyoruz
    socket.on('motor_status_update', (status) => {
        setMotorStatus(status);
        // Gelen duruma göre seansı başlat veya durdur
        if (status.isActive) {
            startSession();
        } else {
            stopSession();
        }
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