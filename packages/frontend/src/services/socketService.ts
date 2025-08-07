// packages/frontend/src/services/socketService.ts

import { io, Socket } from 'socket.io-client';
import { useControllerStore } from '../store/useControllerStore';
import type {
    ServerToClientEvents,
    ClientToServerEvents,
    DeviceStatus,
    MotorDirection,
    OperatingMode,
    OscillationSettings,
    PulseSettings, VibrationSettings, ContinuousSettings, Recipe, RecipeStatus
} from '../../../shared-types';
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
        addConsoleEntry,
        setRecipeStatus,
        setSavedRecipes,
        // setIsSessionActive, // Seansı başlatmak/durdurmak için
    } = useControllerStore.getState();

    // --- Bağlantı Durum Olayları ---
    // --- Tüm olayları dinlemek için bir "catch-all" dinleyicisi ekleyelim ---
    socket.onAny((eventName, ...args) => {
        addConsoleEntry({
            type: 'event',
            source: 'backend',
            message: `Etkinlik alındı: ${eventName}`,
            data: args,
        });
    });
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
        if (useControllerStore.getState().isIgnoringStatusUpdates) {
            return;
        }
        updateDeviceStatus(status);
    });

    socket.on('recipe_status_update', (status: RecipeStatus) => {
        setRecipeStatus(status);
    });
    /** YENİ: Reçete listesi güncellendiğinde bu olay tetiklenir */
    socket.on('recipe_list_update', (recipes: Recipe[]) => {
        setSavedRecipes(recipes); // Gelen yeni listeyi store'a kaydet
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
    useControllerStore.getState().addConsoleEntry({
        type: 'command',
        source: 'frontend',
        message: `Komut gönderildi: set_motor_pwm`,
        data:{value},
    })
    socket.emit('set_motor_pwm', value);
}

/** Motorun dönüş yönünü backend'e gönderir. */
export const sendMotorDirection = (direction: MotorDirection) => {
    useControllerStore.getState().addConsoleEntry({
        type: 'command',
        source: 'frontend',
        message: `Komut gönderildi: set_motor_direction`,
        data:{direction},
    })
    socket.emit('set_motor_direction', direction);
}

/** Moturu (mevcut modda) başlatma komutu gönderir. */
export const sendStartMotor = () => {
    useControllerStore.getState().addConsoleEntry({
        type: 'command',
        source: 'frontend',
        message: `Komut gönderildi: start_motor`,
        data:{},
    })
    socket.emit('start_motor');
}

/** Motoru durdurma komutu gönderir. */
export const sendStopMotor = () => {
    useControllerStore.getState().addConsoleEntry({
        type: 'command',
        source: 'frontend',
        message: `Komut gönderildi: stop_motor`,
        data:{},
    })
    socket.emit('stop_motor');
}

/** Motoru osilasyon modunda başlatma komutu gönderir. */
export const sendStartOscillation = (options: { pwm: number, angle: number, rpm: number }) => {
    useControllerStore.getState().addConsoleEntry({
        type: 'command',
        source: 'frontend',
        message: `Komut gönderildi: start_oscillation`,
        data: options,
    })
    socket.emit('start_oscillation', options);
}

/** Çalışma modunu (sürekli/osilasyon) değiştirme komutu gönderir. */
export const sendOperatingMode = (mode: OperatingMode) => {
    useControllerStore.getState().addConsoleEntry({
        type: 'command',
        source: 'frontend',
        message: `Komut gönderildi: set_operating_mode`,
        data:{mode},
    })
    socket.emit('set_operating_mode', mode);
}

/** Osilasyon ayarlarını (açı gibi) değiştirme komutu gönderir. */
export const sendOscillationSettings = (settings: OscillationSettings) => {
    useControllerStore.getState().addConsoleEntry({
        type: 'command',
        source: 'frontend',
        message: `Komut gönderildi: set_oscillation_settings`,
        data: settings,
    })
    socket.emit('set_oscillation_settings', settings);
}

/** Darbe modu ayarlarını (darbe süresi, bekleme süresi) backend'e gönderir. */
export const sendPulseSettings = (settings: PulseSettings) => {
    useControllerStore.getState().addConsoleEntry({
        type: 'command',
        source: 'frontend',
        message: `Komut gönderildi: set_pulse_settings`,
        data: [settings],
    });
    socket.emit('set_pulse_settings', settings);
}

/** Titreşim modu ayarlarını (yoğunluk, frekans) backend'e gönderir. */
export const sendVibrationSettings = (settings: VibrationSettings) => {
    useControllerStore.getState().addConsoleEntry({
        type: 'command',
        source: 'frontend',
        message: `Komut gönderildi: set_vibration_settings`,
        data: [settings],
    });
    socket.emit('set_vibration_settings', settings);
}

/** Sürekli mod ayarlarını (rampa süresi gibi) backend'e gönderir. */
export const sendContinuousSettings = (settings: ContinuousSettings) => {
    useControllerStore.getState().addConsoleEntry({
        type: 'command',
        source: 'frontend',
        message: `Komut gönderildi: set_continuous_settings`,
        data: [settings],
    });
    socket.emit('set_continuous_settings', settings);
}

/** Belirtilen reçeteyi çalıştırması için backend'e komut gönderir. */
export const sendRecipeStart = (recipe: Recipe) => {
    useControllerStore.getState().addConsoleEntry({
        type: 'command',
        source: 'frontend',
        message: `Komut gönderildi: recipe_start`,
        data: [recipe],
    });
    socket.emit('recipe_start', recipe);
};

/** Çalışan reçeteyi durdurması için backend'e komut gönderir. */
export const sendRecipeStop = () => {
    useControllerStore.getState().addConsoleEntry({
        type: 'command',
        source: 'frontend',
        message: `Komut gönderildi: recipe_stop`,
        data: [],
    });
    socket.emit('recipe_stop');
};

/** Aktif reçeteyi sunucuya kaydetmesi veya güncellemesi için gönderir. */
export const sendRecipeSave = (recipe: Recipe) => {
    useControllerStore.getState().addConsoleEntry({
        type: 'command',
        source: 'frontend',
        message: `Komut gönderildi: recipe_save`,
        data: [recipe],
    });
    socket.emit('recipe_save', recipe);
};

/** Belirtilen reçeteyi silmesi için sunucuya komut gönderir. */
export const sendRecipeDelete = (recipeId: string) => {
    useControllerStore.getState().addConsoleEntry({
        type: 'command',
        source: 'frontend',
        message: `Komut gönderildi: recipe_delete`,
        data: [{ id: recipeId }],
    });
    socket.emit('recipe_delete', recipeId);
};

/** YENİ: Seçilen aktif reçeteyi (veya hiçbiri seçilmediyse null) backend'e bildirir. */
export const sendActiveRecipe = (recipe: Recipe | null) => {
    socket.emit('set_active_recipe', recipe);
};