// packages/frontend/src/store/useControllerStore.ts

import { create } from 'zustand';
import type {DeviceStatus, MotorStatus} from '../../../shared-types';

export type OperatingMode = 'continuous' | 'oscillation';
export type FtswMode = 'foot' | 'hand';

export interface OscillationSettings {
    angle: number; // 90, 180, 270 gibi
    // Gelecekte hız, bekleme süresi gibi ayarlar da eklenebilir.
}

// Store'umuzun tutacağı verilerin yapısı
interface ControllerState extends DeviceStatus {
    connectionStatus: 'connected' | 'disconnected' | 'connecting';
    arduinoStatus: 'connected' | 'disconnected';
    graftCount: number;
    sessionTime: number;
    ftswMode: FtswMode;
}

// Store'daki verileri değiştirecek fonksiyonların yapısı
interface ControllerActions {
    setConnectionStatus: (status: ControllerState['connectionStatus']) => void;
    setArduinoStatus: (status: ControllerState['arduinoStatus']) => void;
    incrementGraftCount: () => void;
    resetSession: () => void;
    tickSecond: () => void;
    setFtswMode: (mode: FtswMode) => void;
    setMotorStatus: (newStatus: Partial<MotorStatus>) => void;
    setOperatingMode: (mode: OperatingMode) => void;
    setOscillationSettings: (settings: Partial<OscillationSettings>) => void;
    updateDeviceStatus: (status: DeviceStatus) => void;
}

let timerInterval: NodeJS.Timeout | null = null;

export const useControllerStore = create<ControllerState & ControllerActions>((set, get) => ({
    connectionStatus: 'connecting',
    arduinoStatus: 'disconnected',
    motor: { isActive: false, pwm: 100, direction: 0 },
    operatingMode: 'continuous',
    oscillationSettings: { angle: 180 },
    graftCount: 0,
    sessionTime: 0,
    ftswMode: 'foot',

    setConnectionStatus: (status) => set({ connectionStatus: status }),
    setArduinoStatus: (status) => set({ arduinoStatus: status }),
    incrementGraftCount: () => set((state) => ({ graftCount: state.graftCount + 1 })),
    resetSession: () => {
        if (timerInterval) clearInterval(timerInterval);
        timerInterval = null;
        set({ sessionTime: 0, graftCount: 0 });
    },
    tickSecond: () => set((state) => ({ sessionTime: state.sessionTime + 1 })),
    setFtswMode: (mode) => set({ ftswMode: mode }),
    setMotorStatus: (newStatus) => set((state) => ({ motor: { ...state.motor, ...newStatus } })),
    setOperatingMode: (mode) => set({ operatingMode: mode }),
    setOscillationSettings: (settings) => set((state) => ({
        oscillationSettings: { ...state.oscillationSettings, ...settings }
    })),

    updateDeviceStatus: (status) => {
        const wasActive = get().motor.isActive;
        set(status);
        const isActive = status.motor.isActive;

        if (isActive && !wasActive) {
            if (timerInterval) clearInterval(timerInterval);
            timerInterval = setInterval(() => get().tickSecond(), 1000);
        } else if (!isActive && wasActive) {
            if (timerInterval) {
                clearInterval(timerInterval);
                timerInterval = null;
            }
        }
    },
}));