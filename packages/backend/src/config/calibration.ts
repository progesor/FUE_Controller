// packages/frontend/src/config/calibration.ts

// Backend'deki kalibrasyon tablosuyla uyumlu,
// arayüzde seçilebilecek geçerli RPM değerleri.
export const VALID_RPMS = [
    500, 750, 1000, 1090, 1280, 1380, 1470, 1660, 1750, 1850,
    1940, 2040, 2130, 2230, 2320, 2410, 2510, 2600, 2700
].sort((a, b) => a - b); // Değerleri küçükten büyüğe sıralayalım

// Geçerli Açı değerleri.
export const VALID_ANGLES = [
    180, 225, 270, 315, 360, 405, 450, 495, 540, 600
];