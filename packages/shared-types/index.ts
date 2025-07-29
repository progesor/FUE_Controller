// packages/shared-types/index.ts

/**
 * Motorun dönüş yönünü belirtir.
 * 0 = İleri (Saat Yönü)
 * 1 = Geri (Saat Yönü Tersi)
 */
export type MotorDirection = 0 | 1;

/**
 * Motorun anlık durumunu temsil eden veri yapısı.
 * Bu yapı, arayüzde gösterilecek veriler için kullanılabilir.
 */
export interface MotorStatus {
    pwm: number;
    direction: MotorDirection;
    rpm?: number; // RPM ölçümü eklenirse kullanılacak (isteğe bağlı)
    isActive: boolean;
}

/**
 * Socket.IO ile backend'den frontend'e gönderilecek olaylar ve veri tipleri.
 */
export interface ServerToClientEvents {
    'motor_status_update': (status: MotorStatus) => void;
    'arduino_event': (data: { type: 'PEDAL' | 'FTSW', state: 0 | 1 }) => void;
    'arduino_disconnected': () => void;
    'arduino_connected': () => void;
}

/**
 * Socket.IO ile frontend'den backend'e gönderilecek olaylar ve veri tipleri.
 */
export interface ClientToServerEvents {
    'set_motor_pwm': (value: number) => void;
    'set_motor_direction': (direction: MotorDirection) => void;
    'start_motor': () => void;
    'stop_motor': () => void;
    'start_oscillation': (options: { pwm: number, angle: number }) => void;
}