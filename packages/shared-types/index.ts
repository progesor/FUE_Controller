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
export type OperatingMode = 'continuous' | 'oscillation' | 'pulse' | 'vibration' | 'recipe';

/** Kontrolün el (sürekli) veya ayak (pedal) modunda olup olmadığını belirtir. */
export type FtswMode = 'foot' | 'hand';


// --- Veri Yapısı Arayüzleri (Interfaces) ---

/** Osilasyon modu için gerekli ayarları içerir. */
export interface OscillationSettings {
    /** Osilasyonun gerçekleşeceği açı (derece cinsinden). */
    angle: number;
    /** [YENİ] Bu adıma özel motor hızı (0-255). Belirtilmezse global hız kullanılır. */
    pwm?: number;
}

/** Darbe modu için gerekli ayarları içerir. */
export interface PulseSettings {
    /** Motorun her bir darbede ne kadar süre döneceği (milisaniye). */
    pulseDuration: number;
    /** İki darbe arasındaki bekleme süresi (milisaniye). */
    pulseDelay: number;
    /** [YENİ] Bu adıma özel motor hızı (0-255). Belirtilmezse global hız kullanılır. */
    pwm?: number;
}

/** Titreşim modu için gerekli ayarları içerir. */
export interface VibrationSettings {
    /** Titreşimin gücünü belirleyen PWM değeri. */
    intensity: number; // Aslında bu doğrudan motorun PWM'i olacak
    /** Titreşimin ne kadar seri olacağını belirler (örn: 1-10 arası bir seviye). */
    frequency: number;
}

/** Sürekli mod için gerekli ayarları içerir. */
export interface ContinuousSettings {
    /** Motorun 0'dan hedeflenen hıza ulaşma süresi (milisaniye). 0 ise rampa yok demektir. */
    rampDuration: number;
    /** [YENİ] Bu adıma özel motor hızı (0-255). Belirtilmezse global hız kullanılır. */
    pwm?: number;
}


export type AllModeSettings = ContinuousSettings | OscillationSettings | PulseSettings | VibrationSettings;

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
    /** Darbe modu için geçerli ayarlar. */
    pulseSettings: PulseSettings;
    /** Titreşim modu için geçerli ayarlar. */
    vibrationSettings: VibrationSettings;
    /** Sürekli mod için geçerli ayarlar. */
    continuousSettings: ContinuousSettings;

    recipeStatus?: RecipeStatus;
}

/** Bir reçetenin tek bir adımını tanımlar. */
export interface RecipeStep {
    id: string; // Adımı ayırt etmek için benzersiz kimlik (örn: UUID)
    mode: OperatingMode; // Bu adımda kullanılacak mod
    duration: number; // Bu adımın ne kadar süreceği (milisaniye)
    settings: Partial<AllModeSettings>; // O moda ait ayarlar (Partial, çünkü sürekli modun kendi ayarı yok)
}

/** Bir dizi adımdan oluşan tam bir reçeteyi tanımlar. */
export interface Recipe {
    id: string; // Reçeteyi ayırt etmek için benzersiz kimlik
    name: string; // Kullanıcının verdiği isim (örn: "Yumuşak Doku Başlangıcı")
    steps: RecipeStep[]; // Reçete adımları dizisi
}

/** Backend'in, reçetenin anlık durumu hakkında arayüzü bilgilendirdiği veri yapısı. */
export interface RecipeStatus {
    isRunning: boolean;
    currentStepIndex: number | null;
    totalSteps: number;
    remainingTimeInStep: number; // Mevcut adımda kalan süre (ms)
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
    /** Reçetenin anlık çalışma durumu değiştiğinde backend tarafından gönderilir. */
    'recipe_status_update': (status: RecipeStatus) => void;
    /** YENİ: Reçete listesi güncellendiğinde backend tarafından gönderilir. */
    'recipe_list_update': (recipes: Recipe[]) => void;
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
    /** Darbe modu ayarlarını (darbe süresi, bekleme süresi) güncellemek için gönderilir. */
    'set_pulse_settings': (settings: PulseSettings) => void;
    /** Titreşim modu ayarlarını (yoğunluk, frekans) güncellemek için gönderilir. */
    'set_vibration_settings': (settings: VibrationSettings) => void;
    /** Sürekli mod ayarlarını (rampa süresi gibi) güncellemek için gönderilir. */
    'set_continuous_settings': (settings: ContinuousSettings) => void;
    /** Belirli bir reçeteyi çalıştırmak için arayüz tarafından gönderilir. */
    'recipe_start': (recipe: Recipe) => void;
    /** Çalışan bir reçeteyi durdurmak için gönderilir. */
    'recipe_stop': () => void;
    /** YENİ: Bir reçeteyi kaydetmek veya güncellemek için gönderilir. */
    'recipe_save': (recipe: Recipe) => void;
    /** YENİ: Bir reçeteyi silmek için gönderilir. */
    'recipe_delete': (recipeId: string) => void;

}