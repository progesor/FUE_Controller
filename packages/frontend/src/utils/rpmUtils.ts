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