// packages/frontend/src/store/useControllerStore.ts

import { create } from 'zustand';
import type { MotorStatus } from '../../../shared-types';

export type OperatingMode = 'continuous' | 'oscillation';
export type FtswMode = 'foot' | 'hand';

export interface OscillationSettings {
    angle: number; // 90, 180, 270 gibi
    // Gelecekte hız, bekleme süresi gibi ayarlar da eklenebilir.
}

// Store'umuzun tutacağı verilerin yapısı
interface ControllerState {
    connectionStatus: 'connected' | 'disconnected' | 'connecting';
    arduinoStatus: 'connected' | 'disconnected';
    motorStatus: MotorStatus;
    graftCount: number;
    sessionTime: number; // saniye cinsinden
    isSessionActive: boolean;
    operatingMode: OperatingMode;
    oscillationSettings: OscillationSettings;
    ftswMode: FtswMode;
}

// Store'daki verileri değiştirecek fonksiyonların yapısı
interface ControllerActions {
    setConnectionStatus: (status: ControllerState['connectionStatus']) => void;
    setArduinoStatus: (status: ControllerState['arduinoStatus']) => void;
    setMotorStatus: (status: Partial<MotorStatus>) => void;
    incrementGraftCount: () => void;
    resetSession: () => void;
    startSession: () => void;
    stopSession: () => void;
    tickSecond: () => void;
    setOperatingMode: (mode: OperatingMode) => void;
    setOscillationAngle: (angle: number) => void;
    setFtswMode: (mode: FtswMode) => void;
}

export const useControllerStore = create<ControllerState & ControllerActions>((set) => ({
    // Başlangıç değerleri
    connectionStatus: 'connecting',
    arduinoStatus: 'disconnected',
    motorStatus: { isActive: false, pwm: 100, direction: 0 }, // Başlangıç PWM'i belirleyelim
    graftCount: 0,
    sessionTime: 0,
    isSessionActive: false,
    operatingMode: 'continuous', // Varsayılan mod
    oscillationSettings: {
        angle: 180, // Varsayılan açı
    },
    ftswMode: 'foot',

    // Aksiyonlar (Fonksiyonlar)
    setConnectionStatus: (status) => set({ connectionStatus: status }),
    setArduinoStatus: (status) => set({ arduinoStatus: status }),
    setMotorStatus: (newStatus) => set((state) => ({
        motorStatus: { ...state.motorStatus, ...newStatus }
    })),
    incrementGraftCount: () => set((state) => ({ graftCount: state.graftCount + 1 })),
    resetSession: () => set({ sessionTime: 0, graftCount: 0, isSessionActive: false }),
    startSession: () => set({ isSessionActive: true }),
    stopSession: () => set({ isSessionActive: false }),
    tickSecond: () => set((state) => ({ sessionTime: state.sessionTime + 1 })),
    setOperatingMode: (mode) => set({ operatingMode: mode }),
    setOscillationAngle: (angle) => set((state) => ({
        oscillationSettings: { ...state.oscillationSettings, angle }
    })),
    setFtswMode: (mode) => set({ ftswMode: mode }),
}));