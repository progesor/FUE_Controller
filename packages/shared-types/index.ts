// packages/shared-types/index.ts

/** Motorun dönüş yönünü belirtir (0: Saat Yönü, 1: Saat Yönü Tersi) */
export type MotorDirection = 0 | 1;

/** Cihazın ana çalışma modları */
export type OperatingMode = 'continuous' | 'oscillation';

/** Kontrolün el (sürekli) veya ayak (pedal) modunda olup olmadığını belirtir */
export type FtswMode = 'foot' | 'hand';

/** Osilasyon modu için ayarları içerir */
export interface OscillationSettings {
    angle: number;
}

/** Motorun anlık fiziksel durumunu temsil eder */
export interface MotorStatus {
    pwm: number;
    direction: MotorDirection;
    isActive: boolean;
}

/** Backend'in hafızasında tuttuğu ve arayüze yayınladığı tüm cihaz durumu */
export interface DeviceStatus {
    motor: MotorStatus;
    operatingMode: OperatingMode;
    oscillationSettings: OscillationSettings;
}

/** Backend'den arayüze gönderilecek Socket.IO olayları ve veri yapıları */
export interface ServerToClientEvents {
    'device_status_update': (status: DeviceStatus) => void;
    'arduino_event': (data: { type: 'PEDAL' | 'FTSW', state: 0 | 1 }) => void;
    'arduino_disconnected': () => void;
    'arduino_connected': () => void;
}

/** Arayüzden backend'e gönderilecek Socket.IO olayları ve veri yapıları */
export interface ClientToServerEvents {
    'set_motor_pwm': (value: number) => void;
    'set_motor_direction': (direction: MotorDirection) => void;
    'start_motor': () => void;
    'stop_motor': () => void;
    'start_oscillation': (options: { pwm: number, angle: number, rpm: number }) => void;
    'set_operating_mode': (mode: OperatingMode) => void;
    'set_oscillation_settings': (settings: OscillationSettings) => void;
}