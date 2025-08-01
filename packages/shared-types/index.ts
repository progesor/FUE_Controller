// packages/shared-types/index.ts

// ===================================================================
//
//                        Paylaşılan Tip Tanımlamaları
//
// -------------------------------------------------------------------
// Açıklama:
// Bu dosya, projenin frontend ve backend paketleri arasında paylaşılan
// tüm TypeScript tiplerini ve arayüzlerini (interface) içerir.
// İletişimdeki veri yapılarının tutarlı olmasını sağlayarak hataları
// önler ve projenin tip-güvenli (type-safe) olmasını sağlar.
//
// ===================================================================


// --- Temel Fiziksel ve Durum Tipleri ---

/** Motorun dönüş yönünü belirtir (0: Saat Yönü - CW, 1: Saat Yönü Tersi - CCW). */
export type MotorDirection = 0 | 1;

/** Cihazın ana çalışma modları. */
export type OperatingMode = 'continuous' | 'oscillation';

/** Kontrolün el (sürekli) veya ayak (pedal) modunda olup olmadığını belirtir. */
export type FtswMode = 'foot' | 'hand';


// --- Veri Yapısı Arayüzleri (Interfaces) ---

/** Osilasyon modu için gerekli ayarları içerir. */
export interface OscillationSettings {
    /** Osilasyonun gerçekleşeceği açı (derece cinsinden). */
    angle: number;
}

/** Motorun anlık fiziksel durumunu temsil eder. */
export interface MotorStatus {
    /** Motor gücü (0-255). */
    pwm: number;
    /** Motorun dönüş yönü. */
    direction: MotorDirection;
    /** Motorun çalışıp çalışmadığı. */
    isActive: boolean;
}

/**
 * Backend'in hafızasında tuttuğu ve periyodik olarak arayüze yayınladığı
 * tüm cihaz durumunu kapsayan ana veri yapısı.
 */
export interface DeviceStatus {
    /** Motorun anlık durumu. */
    motor: MotorStatus;
    /** Cihazın mevcut çalışma modu. */
    operatingMode: OperatingMode;
    /** Osilasyon modu için geçerli ayarlar. */
    oscillationSettings: OscillationSettings;
}


// ===================================================================
//                 Socket.IO Olay (Event) Arayüzleri
// ===================================================================

/**
 * Backend'den (Sunucu) arayüze (İstemci) gönderilecek Socket.IO
 * olaylarını ve bu olayların taşıyacağı veri yapılarını tanımlar.
 */
export interface ServerToClientEvents {
    /** Cihazın tüm durumu güncellendiğinde tetiklenir. */
    'device_status_update': (status: DeviceStatus) => void;
    /** Arduino üzerindeki pedal veya anahtar gibi bir donanım olayı gerçekleştiğinde tetiklenir. */
    'arduino_event': (data: { type: 'PEDAL' | 'FTSW', state: 0 | 1 }) => void;
    /** Arduino ile seri port bağlantısı koptuğunda tetiklenir. */
    'arduino_disconnected': () => void;
    /** Arduino ile seri port bağlantısı başarıyla kurulduğunda tetiklenir. */
    'arduino_connected': () => void;
    /** Ar-Ge panelindeki kalibrasyon verisi isteğine cevaben gönderilir. */
    'calibration_data_response': (data: { pwm: number; duration: number }) => void;
}

/**
 * Arayüzden (İstemci) backend'e (Sunucu) gönderilecek Socket.IO
 * olaylarını ve bu olayların taşıyacağı veri yapılarını tanımlar.
 */
export interface ClientToServerEvents {
    /** Motorun PWM hızını ayarlamak için gönderilir. */
    'set_motor_pwm': (value: number) => void;
    /** Motorun dönüş yönünü ayarlamak için gönderilir. */
    'set_motor_direction': (direction: MotorDirection) => void;
    /** Motoru mevcut modda başlatmak için gönderilir. */
    'start_motor': () => void;
    /** Motoru durdurmak için gönderilir. */
    'stop_motor': () => void;
    /** Motoru osilasyon modunda başlatmak için gönderilir. */
    'start_oscillation': (options: { pwm: number, angle: number, rpm: number }) => void;
    /** Cihazın ana çalışma modunu değiştirmek için gönderilir. */
    'set_operating_mode': (mode: OperatingMode) => void;
    /** Osilasyon ayarlarını (örn: açı) güncellemek için gönderilir. */
    'set_oscillation_settings': (settings: OscillationSettings) => void;
    /** Ar-Ge panelinden ham Arduino komutu göndermek için kullanılır. */
    'send_raw_command': (command: string) => void;
    /** Ar-Ge panelinden belirli bir RPM ve Açı için kalibrasyon verilerini ister. */
    'get_calibration_data': (data: { rpm: number; angle: number }) => void;

}