// packages/frontend/src/utils/rpmUtils.ts

import { RPM_CALIBRATION_MARKS } from '../config/calibration';

/**
 * Mevcut PWM değerine en yakın kalibrasyon noktasının slider'daki indeksini bulur.
 * Bu, slider'ın doğru konumda başlamasını sağlar.
 * @param pwm - Mevcut PWM değeri.
 * @returns {number} Slider üzerindeki en yakın işaretin indeksi.
 */
export const findClosestMarkIndex = (pwm: number): number => {
    if (!RPM_CALIBRATION_MARKS || RPM_CALIBRATION_MARKS.length === 0) return -1;

    // `reduce` metodu ile kalibrasyon dizisindeki her bir adımı
    // mevcut pwm değerine olan yakınlığına göre karşılaştırır ve en yakın olanı bulur.
    const closestMark = RPM_CALIBRATION_MARKS.reduce((prev, curr) =>
        Math.abs(curr.pwm - pwm) < Math.abs(prev.pwm - pwm) ? curr : prev
    );

    // Bulunan en yakın noktanın dizideki indeksini döndür.
    return RPM_CALIBRATION_MARKS.indexOf(closestMark);
};

/**
 * Verilen anlık PWM değerine en yakın kalibre edilmiş RPM değerini bulur.
 * @param pwm - Motorun anlık PWM değeri (0-255).
 * @returns {number} Kalibrasyon tablosundaki en yakın RPM değeri.
 */
export const pwmToClosestRpm = (pwm: number): number => {
    if (pwm === 0) return 0;
    const closestMark = RPM_CALIBRATION_MARKS.reduce((prev, curr) =>
        Math.abs(curr.pwm - pwm) < Math.abs(prev.pwm - pwm) ? curr : prev
    );
    return closestMark.rpm;
};

/**
 * Verilen bir RPM değerine en yakın kalibre edilmiş PWM değerini bulur.
 * @param rpm - Hedeflenen RPM değeri.
 * @returns {number} Kalibrasyon tablosundaki en yakın PWM değeri.
 */
export const rpmToClosestPwm = (rpm: number): number => {
    if (rpm === 0) return 0;
    const closestMark = RPM_CALIBRATION_MARKS.reduce((prev, curr) =>
        Math.abs(curr.rpm - rpm) < Math.abs(prev.rpm - rpm) ? curr : prev
    );
    return closestMark.pwm;
};