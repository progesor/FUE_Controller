// packages/shared-types/index.ts

export type MotorDirection = 0 | 1;
export type OperatingMode = 'continuous' | 'oscillation';

export interface OscillationSettings {
    angle: number;
}

export interface MotorStatus {
    pwm: number;
    direction: MotorDirection;
    isActive: boolean;
}

// Backend'in arayüze göndereceği tüm durumu içeren ana veri yapısı
export interface DeviceStatus {
    motor: MotorStatus;
    operatingMode: OperatingMode;
    oscillationSettings: OscillationSettings;
}

// Backend'den arayüze giden olayları güncelliyoruz
export interface ServerToClientEvents {
    'device_status_update': (status: DeviceStatus) => void; // motor_status_update yerine bunu kullanacağız
    'arduino_event': (data: { type: 'PEDAL' | 'FTSW', state: 0 | 1 }) => void;
    'arduino_disconnected': () => void;
    'arduino_connected': () => void;
}

// Arayüzden backend'e giden olaylar (değişiklik yok)
export interface ClientToServerEvents {
    'set_motor_pwm': (value: number) => void;
    'set_motor_direction': (direction: MotorDirection) => void;
    'start_motor': () => void;
    'stop_motor': () => void;
    'start_oscillation': (options: { pwm: number, angle: number, rpm: number }) => void;
    'set_operating_mode': (mode: OperatingMode) => void;
    'set_oscillation_settings': (settings: OscillationSettings) => void;
}