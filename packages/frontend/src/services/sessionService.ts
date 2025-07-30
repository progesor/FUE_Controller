// packages/frontend/src/services/sessionService.ts

import { useControllerStore } from '../store/useControllerStore';

// ===================================================================
//
//                        Seans Zamanlayıcı Servisi
//
// -------------------------------------------------------------------
// Açıklama:
// Bu servis, seans süresini (kronometre) yönetir. Merkezi store'u
// (`useControllerStore`) dinleyerek seansın aktif olup olmadığını
// anlar ve buna göre zamanlayıcıyı (setInterval) başlatır veya durdurur.
// Bu yaklaşım, zamanlayıcı mantığını bileşenlerin dışına taşıyarak
// kodun daha temiz ve yönetilebilir olmasını sağlar.
//
// ===================================================================

/**
 * Zamanlayıcıyı (setInterval) tutan global değişken.
 * Bu sayede zamanlayıcıyı istediğimiz zaman başlatıp durdurabiliriz.
 */
let timerInterval: NodeJS.Timeout | null = null;

let isSessionServiceInitialized = false;

/**
 * Seans servisini başlatır.
 * Bu fonksiyon, `App.tsx` içinde uygulama ilk başladığında sadece bir kez çağrılır.
 * Store'daki değişikliklere abone (subscribe) olur ve seans durumuna göre
 * zamanlayıcıyı yönetir.
 */
export const initializeSessionService = () => {
    // Fonksiyon daha önce çalıştıysa, hiçbir şey yapmadan çık
    if (isSessionServiceInitialized) {
        return;
    }
    // `useControllerStore.subscribe` metodu, store'daki herhangi bir state
    // değişikliğinde içine verilen fonksiyonu tetikler.
    useControllerStore.subscribe(
        // `state` en güncel durumu, `prevState` ise değişiklikten önceki durumu temsil eder.
        (state, prevState) => {
            // --- Zamanlayıcı Başlatma Koşulu ---
            // Eğer seans yeni aktif olduysa (önceden pasifken şimdi aktifse)...
            if (state.isSessionActive && !prevState.isSessionActive) {
                // Güvenlik önlemi: Eğer daha önceden kalma bir zamanlayıcı varsa temizle.
                if (timerInterval) clearInterval(timerInterval);

                // Her 1000 milisaniyede (1 saniyede) bir, store'daki `tickSecond`
                // eylemini çağıracak olan yeni bir zamanlayıcı başlat.
                timerInterval = setInterval(() => {
                    useControllerStore.getState().tickSecond();
                }, 1000);
            }
                // --- Zamanlayıcı Durdurma Koşulu ---
            // Eğer seans yeni pasif hale geldiyse (önceden aktifken şimdi pasifse)...
            else if (!state.isSessionActive && prevState.isSessionActive) {
                // Eğer çalışan bir zamanlayıcı varsa...
                if (timerInterval) {
                    // Zamanlayıcıyı temizle ve değişkeni null yaparak
                    // hafızada yer tutmasını engelle.
                    clearInterval(timerInterval);
                    timerInterval = null;
                }
            }
        }
    );
    isSessionServiceInitialized = true;
};