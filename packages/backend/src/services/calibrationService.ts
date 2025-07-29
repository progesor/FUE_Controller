// packages/backend/src/services/calibrationService.ts

// Orijinal Arduino kodundaki E...Hiz ve ...Hiz dizilerini birleştiriyoruz.
// Bu harita, arayüzde gösterilen RPM değerini, bizim kullanacağımız PWM indeksine çevirir.
const rpmToPwmIndexMap = new Map<number, number>([
    [500, 0], [1090, 1], [750, 2], [1280, 3], [1000, 4], [1470, 5],
    [1380, 6], [1660, 7], [1750, 8], [1850, 9], [1940, 10], [2040, 11],
    [2130, 12], [2230, 13], [2320, 14], [2410, 15], [2510, 16], [2600, 17],
    [2700, 18]
]);

// Orijinal Arduino kodundaki Acilar dizisinin birebir aynısı.
// Dış dizi: Hız indeksi (0-18), İç dizi: Açı indeksi (0-9)
const calibrationTable: number[][] = [
    [150, 179, 210, 250, 293, 298, 305, 312, 323, 340],
    [94, 107, 128, 140, 148, 159, 170, 176, 182, 188],
    [99, 112, 138, 152, 165, 175, 183, 190, 200, 214],
    [91, 103, 113, 125, 136, 144, 151, 161, 170, 179],
    [95, 108, 129, 144, 150, 163, 175, 183, 190, 197],
    [86, 96, 108, 118, 128, 135, 142, 150, 158, 166],
    [90, 98, 110, 120, 130, 140, 150, 158, 165, 172],
    [72, 80, 90, 96, 105, 111, 117, 124, 130, 136],
    [66, 75, 83, 92, 98, 104, 110, 117, 123, 129],
    [63, 72, 80, 89, 95, 102, 108, 113, 118, 123],
    [58, 67, 74, 82, 88, 93, 98, 103, 108, 113],
    [55, 63, 69, 76, 82, 87, 91, 97, 102, 107],
    [51, 58, 64, 71, 76, 81, 85, 90, 95, 100],
    [46, 52, 59, 64, 70, 75, 79, 84, 88, 92],
    [42, 48, 55, 60, 64, 69, 73, 77, 81, 85],
    [37, 43, 48, 52, 57, 61, 65, 70, 74, 78],
    [34, 38, 42, 50, 52, 55, 57, 61, 64, 67],
    [28, 32, 36, 40, 43, 46, 49, 52, 55, 58],
    [27, 31, 35, 38, 41, 44, 47, 50, 53, 56]
];

// Arayüzde gösterilen Açı değerini, tablodaki Açı indeksine çevirir.
const angleToIndexMap = new Map<number, number>([
    [180, 0], [225, 1], [270, 2], [315, 3], [360, 4], [405, 5],
    [450, 6], [495, 7], [540, 8], [600, 9]
]);


/**
 * Verilen RPM ve Açı değerlerine göre kalibrasyon tablosundan
 * doğru milisaniye (ms) değerini bulur.
 * @param targetRpm Arayüzden gelen RPM değeri (örn: 1750)
 * @param targetAngle Arayüzden gelen Açı değeri (örn: 270)
 * @returns {number} Gerekli bekleme süresi (ms) veya bulunamazsa 0
 */
export const getMsFromCalibration = (targetRpm: number, targetAngle: number): number => {
    const speedIndex = rpmToPwmIndexMap.get(targetRpm);
    const angleIndex = angleToIndexMap.get(targetAngle);

    if (speedIndex === undefined || angleIndex === undefined) {
        console.error(`Kalibrasyon hatası: RPM (${targetRpm}) veya Açı (${targetAngle}) için bir değer bulunamadı.`);
        return 0; // Hata durumunda 0 döndür
    }

    return calibrationTable[speedIndex][angleIndex];
};