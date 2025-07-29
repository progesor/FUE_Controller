// packages/frontend/src/store/useControllerStore.ts

import { create } from 'zustand';
import type { MotorStatus } from '../../../shared-types';

// Store'umuzun tutacağı verilerin yapısı
interface ControllerState {
    connectionStatus: 'connected' | 'disconnected' | 'connecting';
    motorStatus: MotorStatus;
    graftCount: number;
    sessionTime: number; // saniye cinsinden
    isSessionActive: boolean;
}

// Store'daki verileri değiştirecek fonksiyonların yapısı
interface ControllerActions {
    setConnectionStatus: (status: ControllerState['connectionStatus']) => void;
    setMotorStatus: (status: Partial<MotorStatus>) => void;
    incrementGraftCount: () => void;
    resetSession: () => void;
    startSession: () => void;
    stopSession: () => void;
    tickSecond: () => void;
}

export const useControllerStore = create<ControllerState & ControllerActions>((set) => ({
    // Başlangıç değerleri
    connectionStatus: 'connecting',
    motorStatus: { isActive: false, pwm: 100, direction: 0 }, // Başlangıç PWM'i belirleyelim
    graftCount: 0,
    sessionTime: 0,
    isSessionActive: false,

    // Aksiyonlar (Fonksiyonlar)
    setConnectionStatus: (status) => set({ connectionStatus: status }),
    setMotorStatus: (newStatus) => set((state) => ({
        motorStatus: { ...state.motorStatus, ...newStatus }
    })),
    incrementGraftCount: () => set((state) => ({ graftCount: state.graftCount + 1 })),
    resetSession: () => set({ sessionTime: 0, graftCount: 0, isSessionActive: false }),
    startSession: () => set({ isSessionActive: true }),
    stopSession: () => set({ isSessionActive: false }),
    tickSecond: () => set((state) => ({ sessionTime: state.sessionTime + 1 })),
}));