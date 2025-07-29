// packages/frontend/src/store/useControllerStore.ts

import { create } from 'zustand';
import type { MotorStatus } from '../../../shared-types'; // <-- Monorepo'nun gücü!

// Store'umuzun tutacağı verilerin yapısı
interface ControllerState {
    connectionStatus: 'connected' | 'disconnected' | 'connecting';
    motorStatus: MotorStatus;
}

// Store'daki verileri değiştirecek fonksiyonların yapısı
interface ControllerActions {
    setConnectionStatus: (status: ControllerState['connectionStatus']) => void;
    setMotorStatus: (status: Partial<MotorStatus>) => void;
}

// Zustand store'unu oluşturuyoruz
export const useControllerStore = create<ControllerState & ControllerActions>((set) => ({
    // Başlangıç değerleri
    connectionStatus: 'connecting',
    motorStatus: {
        isActive: false,
        pwm: 0,
        direction: 0,
    },

    // Aksiyonlar (Fonksiyonlar)
    setConnectionStatus: (status) => set({ connectionStatus: status }),
    setMotorStatus: (newStatus) => set((state) => ({
        motorStatus: { ...state.motorStatus, ...newStatus }
    })),
}));