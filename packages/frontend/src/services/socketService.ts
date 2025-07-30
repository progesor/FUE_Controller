// packages/frontend/src/services/socketService.ts

import { io, Socket } from 'socket.io-client';
import { useControllerStore } from '../store/useControllerStore';
import type { ServerToClientEvents, ClientToServerEvents, DeviceStatus, MotorDirection, OperatingMode, OscillationSettings } from '../../../shared-types';
import config from '../../../backend/src/config';
import {NotificationService} from "./notificationService.tsx";

// ===================================================================
//
//                        Socket İletişim Servisi
//
// -------------------------------------------------------------------
// Açıklama:
// Bu servis, frontend uygulaması ile backend sunucusu arasındaki
// tüm gerçek zamanlı iletişimi yönetir. Socket.IO istemcisini
// kurar, sunucudan gelen olayları (event) dinleyerek store'u
// günceller ve kullanıcı arayüzünden tetiklenen eylemleri
// sunucuya iletir.
//
// ===================================================================

let isSocketInitialized = false;

// --- Socket İstemcisi Kurulumu ---

// Backend sunucusunun adresini doğrudan backend konfigürasyon dosyasından alıyoruz.
// Bu, her iki paketin de aynı portu kullanmasını garanti eder.
const SERVER_URL = `http://localhost:${config.server.port}`;

/**
 * Uygulamanın backend ile iletişim kurmak için kullanacağı tek (singleton)
 * Socket.IO istemci örneği. `shared-types` paketi sayesinde tip-güvenlidir.
 * `autoConnect: false` ayarı, bağlantının manuel olarak `socket.connect()`
 * ile başlatılmasını sağlar.
 */
export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SERVER_URL, {
    autoConnect: false,
});


// ===================================================================
//                      Backend Olaylarını Dinleme
// ===================================================================

/**
 * Backend'den gelecek tüm olayları dinlemek için gerekli olan dinleyicileri (listeners) kurar.
 * Bu fonksiyon, uygulamanın en başında (App.tsx içinde) yalnızca bir kez çağrılmalıdır.
 */
export const listenToEvents = () => {
    // Fonksiyon daha önce çalıştıysa, hiçbir şey yapmadan çık
    if (isSocketInitialized) {
        return;
    }
    // Gerekli eylemleri store'dan alıyoruz.
    // Not: `getState()` anlık durumu almak içindir. Sürekli güncellenen değerler
    // için bileşen içinde hook (`useControllerStore()`) kullanılmalıdır.
    const {
        setConnectionStatus,
        setArduinoStatus,
        incrementGraftCount,
        setFtswMode,
        updateDeviceStatus,
        // setIsSessionActive, // Seansı başlatmak/durdurmak için
    } = useControllerStore.getState();

    // --- Bağlantı Durum Olayları ---
    socket.on('connect', () => setConnectionStatus('connected'));
    socket.on('disconnect', () => {
        setConnectionStatus('disconnected');
        NotificationService.showError('Sunucu ile bağlantı koptu!');
    });
    socket.on('arduino_connected', () => {
        setArduinoStatus('connected');
        NotificationService.showSuccess('Cihaz (Arduino) başarıyla bağlandı.')
    });
    socket.on('arduino_disconnected', () => {
        setArduinoStatus('disconnected');
        NotificationService.showError('Cihaz (Arduino) bağlantısı kesildi!');
    });

    // --- Cihaz Durum Güncelleme Olayı ---
    // Backend'den cihazın tam durumu geldiğinde, bu olay tetiklenir ve
    // store'daki tüm ilgili verileri günceller.
    socket.on('device_status_update', (status: DeviceStatus) => {
        updateDeviceStatus(status);
    });

    // --- Arduino Donanım Olayları ---
    // Pedal basılması, anahtarın çevrilmesi gibi fiziksel olayları dinler.
    socket.on('arduino_event', (data) => {
        // Pedal bırakıldığında (state: 0), greft sayısını bir artır.
        if (data.type === 'PEDAL' && data.state === 0) {
            incrementGraftCount();
        }
        // El/Ayak anahtarı durumu değiştiğinde, store'daki modu güncelle.
        else if (data.type === 'FTSW') {
            setFtswMode(data.state === 1 ? 'hand' : 'foot');
        }
    });

    // Tüm dinleyiciler kurulduktan sonra sunucuya manuel olarak bağlan.
    socket.connect();

    // Fonksiyonun sonunda bayrağı true yapın ki bir daha çalışmasın
    isSocketInitialized = true;
};


// ===================================================================
//                 Backend'e Komut Gönderme Fonksiyonları
// ===================================================================
// Bu fonksiyonlar, React bileşenleri tarafından çağrılarak kullanıcı
// eylemlerini backend'e iletir. Her fonksiyon, belirli bir Socket.IO
// olayını (`emit`) tetikler.

/** Motorun PWM hızını backend'e gönderir. */
export const sendMotorPwm = (value: number) => {
    socket.emit('set_motor_pwm', value);
}

/** Motorun dönüş yönünü backend'e gönderir. */
export const sendMotorDirection = (direction: MotorDirection) => {
    socket.emit('set_motor_direction', direction);
}

/** Moturu (mevcut modda) başlatma komutu gönderir. */
export const sendStartMotor = () => {
    socket.emit('start_motor');
}

/** Motoru durdurma komutu gönderir. */
export const sendStopMotor = () => {
    socket.emit('stop_motor');
}

/** Motoru osilasyon modunda başlatma komutu gönderir. */
export const sendStartOscillation = (options: { pwm: number, angle: number, rpm: number }) => {
    socket.emit('start_oscillation', options);
}

/** Çalışma modunu (sürekli/osilasyon) değiştirme komutu gönderir. */
export const sendOperatingMode = (mode: OperatingMode) => {
    socket.emit('set_operating_mode', mode);
}

/** Osilasyon ayarlarını (açı gibi) değiştirme komutu gönderir. */
export const sendOscillationSettings = (settings: OscillationSettings) => {
    socket.emit('set_oscillation_settings', settings);
}