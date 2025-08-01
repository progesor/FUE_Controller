// packages/backend/src/services/calibrationService.ts

// ===================================================================
//
//                        Kalibrasyon Servisi
//
// -------------------------------------------------------------------
// Açıklama:
// Bu servis, motorun fiziksel davranışları ile kullanıcı arayüzünde
// gösterilen RPM (devir/dakika) ve Açı değerleri arasındaki dönüşümü
// yönetir. Orijinal Arduino projesindeki test edilmiş ve kalibre
// edilmiş sabit değerleri içerir. Bu sayede motorun farklı hız ve
// açılarda tutarlı çalışması sağlanır.
//
// ===================================================================


// --- RPM ve PWM Kalibrasyon Verileri ---

/**
 * Motorun belirli RPM değerlerine ulaşması için gereken PWM (0-255)
 * değerlerini içeren kalibrasyon tablosu.
 * Bu, doğrusal olmayan motor davranışını telafi etmek için kullanılır.
 * Örn: 1750 RPM için PWM değeri 42 olarak ayarlanmalıdır.
 */
const RPM_CALIBRATION_MARKS = [
    { rpm: 500, pwm: 8 }, { rpm: 750, pwm: 16 }, { rpm: 1000, pwm: 22 },
    { rpm: 1090, pwm: 23 }, { rpm: 1280, pwm: 25 }, { rpm: 1380, pwm: 26 },
    { rpm: 1470, pwm: 27 }, { rpm: 1660, pwm: 38 }, { rpm: 1750, pwm: 42 },
    { rpm: 1850, pwm: 45 }, { rpm: 1940, pwm: 53 }, { rpm: 2040, pwm: 60 },
    { rpm: 2130, pwm: 70 }, { rpm: 2230, pwm: 82 }, { rpm: 2320, pwm: 90 },
    { rpm: 2410, pwm: 120 }, { rpm: 2510, pwm: 160 }, { rpm: 2600, pwm: 230 },
    { rpm: 2700, pwm: 255 },
];

/**
 * Arayüzde seçilen RPM değerini, `calibrationTable` içindeki doğru hız
 * indeksine (satır numarasına) çeviren harita.
 * Bu, Arduino kodundaki `EOscHiz` ve `OscHiz` dizilerinin birleşik mantığını temsil eder.
 * Örn: 1750 RPM, tablodaki 8. indekse karşılık gelir.
 */
const rpmToSpeedIndexMap = new Map<number, number>([
    [500, 0], [1090, 1], [750, 2], [1280, 3], [1000, 4], [1470, 5],
    [1380, 6], [1660, 7], [1750, 8], [1850, 9], [1940, 10], [2040, 11],
    [2130, 12], [2230, 13], [2320, 14], [2410, 15], [2510, 16], [2600, 17],
    [2700, 18]
]);

/**
 * Arayüzde seçilen Açı değerini, `calibrationTable` içindeki doğru açı
 * indeksine (sütun numarasına) çeviren harita.
 * Örn: 270 derece, tablodaki 2. indekse karşılık gelir.
 */
const angleToIndexMap = new Map<number, number>([
    [180, 0], [225, 1], [270, 2], [315, 3], [360, 4], [405, 5],
    [450, 6], [495, 7], [540, 8], [600, 9]
]);

/**
 * Osilasyon modunda, belirli bir hız (RPM) ve açıda motorun ne kadar
 * süre (milisaniye) çalışması gerektiğini belirten ana kalibrasyon tablosu.
 * Bu, Arduino kodundaki 'Acilar' dizisinin birebir karşılığıdır.
 * Dış dizi: Hız indeksi (rpmToSpeedIndexMap'ten gelir)
 * İç dizi: Açı indeksi (angleToIndexMap'ten gelir)
 * Değer: Milisaniye cinsinden motor çalışma süresi.
 */
const calibrationTable: number[][] = [
    // Açı İndeksi->  0,   1,   2,   3,   4,   5,   6,   7,   8,   9
    /* Hız İndeksi 0 */[150, 179, 210, 250, 293, 298, 305, 312, 323, 340],
    /* Hız İndeksi 1 */[94, 107, 128, 140, 148, 159, 170, 176, 182, 188],
    /* Hız İndeksi 2 */[99, 112, 138, 152, 165, 175, 183, 190, 200, 214],
    /* Hız İndeksi 3 */[91, 103, 113, 125, 136, 144, 151, 161, 170, 179],
    /* Hız İndeksi 4 */[95, 108, 129, 144, 150, 163, 175, 183, 190, 197],
    /* Hız İndeksi 5 */[86, 96, 108, 118, 128, 135, 142, 150, 158, 166],
    /* Hız İndeksi 6 */[90, 98, 110, 120, 130, 140, 150, 158, 165, 172],
    /* Hız İndeksi 7 */[72, 80, 90, 96, 105, 111, 117, 124, 130, 136],
    /* Hız İndeksi 8 */[66, 75, 83, 92, 98, 104, 110, 117, 123, 129],
    /* Hız İndeksi 9 */[63, 72, 80, 89, 95, 102, 108, 113, 118, 123],
    /* Hız İndeksi 10 */[58, 67, 74, 82, 88, 93, 98, 103, 108, 113],
    /* Hız İndeksi 11 */[55, 63, 69, 76, 82, 87, 91, 97, 102, 107],
    /* Hız İndeksi 12 */[51, 58, 64, 71, 76, 81, 85, 90, 95, 100],
    /* Hız İndeksi 13 */[46, 52, 59, 64, 70, 75, 79, 84, 88, 92],
    /* Hız İndeksi 14 */[42, 48, 55, 60, 64, 69, 73, 77, 81, 85],
    /* Hız İndeksi 15 */[37, 43, 48, 52, 57, 61, 65, 70, 74, 78],
    /* Hız İndeksi 16 */[34, 38, 42, 50, 52, 55, 57, 61, 64, 67],
    /* Hız İndeksi 17 */[28, 32, 36, 40, 43, 46, 49, 52, 55, 58],
    /* Hız İndeksi 18 */[27, 31, 35, 38, 41, 44, 47, 50, 53, 56]
];


// ===================================================================
//                        Dönüşüm Fonksiyonları
// ===================================================================

/**
 * Verilen RPM ve Açı değerlerine göre kalibrasyon tablosundan
 * osilasyon için doğru motor çalışma süresini (milisaniye) bulur.
 * @param targetRpm - Arayüzden gelen hedef RPM değeri (örn: 1750).
 * @param targetAngle - Arayüzden gelen hedef Açı değeri (örn: 270).
 * @returns {number} Gerekli motor çalışma süresi (ms) veya bulunamazsa 0.
 */
export const getMsFromCalibration = (targetRpm: number, targetAngle: number): number => {
    // RPM ve Açı değerlerini tablodaki indekslere dönüştür
    const speedIndex = rpmToSpeedIndexMap.get(targetRpm);
    const angleIndex = angleToIndexMap.get(targetAngle);

    // Eğer haritalarda karşılık gelen bir indeks yoksa, bu geçersiz bir kombinasyondur.
    if (speedIndex === undefined || angleIndex === undefined) {
        console.error(`Kalibrasyon hatası: RPM (${targetRpm}) veya Açı (${targetAngle}) için bir harita değeri bulunamadı.`);
        return 0; // Hata durumunda 0 döndürerek motorun çalışmasını engelle.
    }

    // İndekslere karşılık gelen milisaniye değerini tablodan oku ve döndür.
    return calibrationTable[speedIndex][angleIndex];
};

/**
 * Verilen bir PWM değerine en yakın kalibre edilmiş RPM değerini bulur.
 * Bu fonksiyon, motorun çalışma modu değiştiğinde veya mevcut durumu
 * arayüze raporlarken kullanılır.
 * @param pwm - Motorun anlık PWM değeri (0-255).
 * @returns {number} Kalibrasyon tablosundaki en yakın RPM değeri.
 */
export const pwmToCalibratedRpm = (pwm: number): number => {
    if (pwm === 0) return 0;

    // `reduce` fonksiyonu ile `RPM_CALIBRATION_MARKS` dizisindeki her bir
    // elemanın PWM değerini, verilen PWM değerine olan mutlak farkına
    // göre karşılaştırır ve en yakın olanı bulur.
    const closestMark = RPM_CALIBRATION_MARKS.reduce((prev, curr) =>
        Math.abs(curr.pwm - pwm) < Math.abs(prev.pwm - pwm) ? curr : prev
    );

    return closestMark.rpm;
};

/**
 * Verilen RPM ve Açı değerlerine karşılık gelen tam kalibrasyon
 * verisini (PWM ve Süre) döndürür.
 * @param targetRpm - Arayüzden gelen hedef RPM değeri.
 * @param targetAngle - Arayüzden gelen hedef Açı değeri.
 * @returns {{pwm: number, duration: number} | null} İlgili PWM ve süre (ms)
 * değerlerini içeren bir nesne veya bulunamazsa null.
 */
export const getCalibrationData = (targetRpm: number, targetAngle: number): { pwm: number; duration: number } | null => {
    // 1. RPM'e karşılık gelen PWM değerini bul
    const calibrationMark = RPM_CALIBRATION_MARKS.find(mark => mark.rpm === targetRpm);
    if (!calibrationMark) {
        console.error(`Kalibrasyon hatası: RPM (${targetRpm}) için bir PWM değeri bulunamadı.`);
        return null;
    }

    // 2. RPM ve Açı'ya karşılık gelen Süre (ms) değerini bul
    const duration = getMsFromCalibration(targetRpm, targetAngle);
    if (duration === 0) {
        // getMsFromCalibration zaten kendi hata mesajını basıyor.
        return null;
    }

    // 3. Bulunan değerleri bir nesne olarak döndür
    return {
        pwm: calibrationMark.pwm,
        duration: duration,
    };
};