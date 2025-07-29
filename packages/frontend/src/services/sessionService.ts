// packages/frontend/src/services/sessionService.ts

import { useControllerStore } from '../store/useControllerStore';

let timerInterval: NodeJS.Timeout | null = null;

/**
 * Seans zamanlayıcısını (kronometre) başlatan ve durduran servis.
 */
export const initializeSessionService = () => {
    const store = useControllerStore;

    // Store'daki 'isSessionActive' durumu her değiştiğinde bu fonksiyon çalışır.
    store.subscribe((state, prevState) => {
        // Seans aktif hale geldiyse ve zamanlayıcı çalışmıyorsa...
        if (state.isSessionActive && !prevState.isSessionActive) {
            if (timerInterval) clearInterval(timerInterval); // Öncekini temizle (güvenlik)

            timerInterval = setInterval(() => {
                store.getState().tickSecond(); // Her saniye store'u güncelle
            }, 1000);
        }
        // Seans pasif hale geldiyse ve zamanlayıcı çalışıyorsa...
        else if (!state.isSessionActive && prevState.isSessionActive) {
            if (timerInterval) {
                clearInterval(timerInterval);
                timerInterval = null;
            }
        }
    });
};