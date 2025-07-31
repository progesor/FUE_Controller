// packages/frontend/src/store/useControllerStore.ts

import { create } from 'zustand';
import type { DeviceStatus, MotorStatus } from '../../../shared-types';

// ===================================================================
//
//                        KONTROLCÜ DURUM YÖNETİMİ (STORE)
//
// -------------------------------------------------------------------
// Açıklama:
// Bu dosya, Zustand kütüphanesini kullanarak uygulamanın tüm global
// durumunu (state) yönetir. Arayüzdeki tüm bileşenler, ihtiyaç
// duydukları verilere buradan erişir ve veriyi değiştirmek için
// buradaki eylemleri (actions) çağırır. Bu, merkezi ve tutarlı bir
// veri akışı sağlar.
//
// ===================================================================


// --- Tip Tanımlamaları ---

/** Cihazın ana çalışma modları. `shared-types` ile senkronize. */
export type OperatingMode = 'continuous' | 'oscillation';

/** Kontrolün el (sürekli) veya ayak (pedal) modunda olup olmadığını belirtir. */
export type FtswMode = 'foot' | 'hand';

/** Osilasyon modu için ayarları içerir. */
export interface OscillationSettings {
    angle: number; // Derece cinsinden osilasyon açısı (örn: 180, 270)
}

/** Konsolda gösterilecek her bir log satırının yapısı */
export interface ConsoleEntry {
    id: number;
    timestamp: string;
    type: 'event' | 'command' | 'status';
    source: 'frontend' | 'backend';
    message: string;
    data?: any;
}

/**
 * Store'da tutulacak tüm verilerin yapısını tanımlar.
 * Bu yapı, backend'den gelen `DeviceStatus` tipini genişletir.
 */
interface ControllerState extends DeviceStatus {
    /** Sunucu ile olan Socket.IO bağlantısının durumu. */
    connectionStatus: 'connected' | 'disconnected' | 'connecting';
    /** Arduino'nun sunucuya bağlı olup olmama durumu. */
    arduinoStatus: 'connected' | 'disconnected';
    /** Mevcut seansta sayılan greft sayısı. */
    graftCount: number;
    /** Mevcut seansın saniye cinsinden süresi. */
    sessionTime: number;
    /** Kontrol modunun el mi ayak mı olduğunu belirtir. */
    ftswMode: FtswMode;
    /**
     * @deprecated Bu mantık sessionService.ts'e taşınmış gibi görünüyor.
     * Seansın aktif olup olmadığını ve zamanlayıcının çalışıp çalışmayacağını belirtir.
     */
    isSessionActive: boolean;
    /** Geliştirici konsolu için log kayıtlarını tutar */
    consoleEntries: ConsoleEntry[];
}

/**
 * Store'daki verileri değiştirmek için kullanılacak fonksiyonların (eylemlerin)
 * yapısını tanımlar.
 */
interface ControllerActions {
    /** Socket.IO bağlantı durumunu günceller. */
    setConnectionStatus: (status: ControllerState['connectionStatus']) => void;
    /** Arduino bağlantı durumunu günceller. */
    setArduinoStatus: (status: ControllerState['arduinoStatus']) => void;
    /** Greft sayısını manuel olarak bir artırır. */
    incrementGraftCount: () => void;
    /** Seans süresini ve greft sayısını sıfırlar. */
    resetSession: () => void;
    /** Seans süresini bir saniye ilerletir. */
    tickSecond: () => void;
    /** El/Ayak kontrol modunu ayarlar. */
    setFtswMode: (mode: FtswMode) => void;
    /** Motor durumunun bir kısmını (örn: sadece pwm) günceller. */
    setMotorStatus: (newStatus: Partial<MotorStatus>) => void;
    /** Cihazın ana çalışma modunu (sürekli/osilasyon) ayarlar. */
    setOperatingMode: (mode: OperatingMode) => void;
    /** Osilasyon ayarlarını günceller. */
    setOscillationSettings: (settings: Partial<OscillationSettings>) => void;
    /** Backend'den gelen tüm cihaz durumunu store'a işler. */
    updateDeviceStatus: (status: DeviceStatus) => void;
    /** Seans zamanlayıcısını aktif veya pasif hale getirir. */
    setIsSessionActive: (isActive: boolean) => void;
    /** Geliştirici konsoluna yeni bir log kaydı ekler */
    addConsoleEntry: (entry: Omit<ConsoleEntry, 'id' | 'timestamp'>) => void;
}


/**
 * Zustand store'unu oluşturur.
 * `set` fonksiyonu state'i değiştirmek, `get` fonksiyonu ise anlık state'i okumak için kullanılır.
 */
export const useControllerStore = create<ControllerState & ControllerActions>((set, get) => ({
    // --- Başlangıç Durumu (Initial State) ---
    connectionStatus: 'connecting',
    arduinoStatus: 'disconnected',
    motor: { isActive: false, pwm: 100, direction: 0 },
    operatingMode: 'continuous',
    oscillationSettings: { angle: 180 },
    graftCount: 0,
    sessionTime: 0,
    ftswMode: 'foot',
    isSessionActive: false,
    consoleEntries: [],

    // --- Eylemler (Actions) ---
    setConnectionStatus: (status) => set({ connectionStatus: status }),
    setArduinoStatus: (status) => set({ arduinoStatus: status }),
    incrementGraftCount: () => set((state) => ({ graftCount: state.graftCount + 1 })),

    resetSession: () => {
        // Not: Seans sıfırlama mantığı, `sessionService` ile çakışıyor olabilir.
        // `isSessionActive` durumu false yapıldığında `sessionService` zaten interval'i durdurmalıdır.
        set({ sessionTime: 0, graftCount: 0, isSessionActive: false });
    },

    tickSecond: () => set((state) => ({ sessionTime: state.sessionTime + 1 })),
    setFtswMode: (mode) => set({ ftswMode: mode }),

    // Partial<MotorStatus> sayesinde sadece değişen kısımları göndermek yeterlidir.
    // Örn: setMotorStatus({ pwm: 150 })
    setMotorStatus: (newStatus) => set((state) => ({ motor: { ...state.motor, ...newStatus } })),

    setOperatingMode: (mode) => set({ operatingMode: mode }),

    setOscillationSettings: (settings) => set((state) => ({
        oscillationSettings: { ...state.oscillationSettings, ...settings }
    })),

    setIsSessionActive: (isActive) => set({ isSessionActive: isActive }),

    addConsoleEntry: (newEntry) => set((state) => ({
        consoleEntries: [
            ...state.consoleEntries,
            {
                ...newEntry,
                id: state.consoleEntries.length,
                timestamp: new Date().toLocaleTimeString('tr-TR', { hour12: false }),
            }
        ]
    })),

    /**
     * Backend'den 'device_status_update' olayı ile gelen tüm cihaz durumunu günceller.
     * Bu fonksiyon, backend'deki 'deviceStatus' nesnesi ile frontend'in senkronize
     * kalmasını sağlayan ana mekanizmadır.
     * @param status Backend'den gelen en güncel cihaz durumu.
     */
    updateDeviceStatus: (status) => {
        const wasActive = get().motor.isActive;
        const isActive = status.motor.isActive;

        // Gelen yeni durumu state'e işle
        set(status);

        // Motorun durumu 'aktif değil'den 'aktif'e geçtiyse seansı başlat.
        if (isActive && !wasActive) {
            set({ isSessionActive: true });
        }
        // Motor 'aktif'ten 'aktif değil'e geçtiyse seansı durdur.
        else if (!isActive && wasActive) {
            set({ isSessionActive: false });
        }
        // Not: Bu mantık, `sessionService.ts` dosyasının sorumluluğunda olmalıdır.
        // `sessionService` store'daki `isSessionActive` değişikliğini dinleyerek
        // zamanlayıcıyı (setInterval) kendi içinde yönetmelidir.
        // Bu fonksiyonda doğrudan zamanlayıcı kontrolü yapmak, sorumlulukların
        // karışmasına neden olabilir.
    },
}));