// packages/frontend/src/config/calibration.ts

// Her bir kalibrasyon adımını RPM ve karşılık gelen PWM değeriyle tanımlıyoruz.
export interface CalibrationMark {
    rpm: number;
    pwm: number;
}

// Orijinal Arduino kodunuzdaki `EOscHiz` ve `OscHiz` dizilerinin birleşimi.
export const RPM_CALIBRATION_MARKS: CalibrationMark[] = [
    { rpm: 500, pwm: 8 },
    { rpm: 750, pwm: 16 },
    { rpm: 1000, pwm: 22 },
    { rpm: 1090, pwm: 23 },
    { rpm: 1280, pwm: 25 },
    { rpm: 1380, pwm: 26 },
    { rpm: 1470, pwm: 27 },
    { rpm: 1660, pwm: 38 },
    { rpm: 1750, pwm: 42 },
    { rpm: 1850, pwm: 45 },
    { rpm: 1940, pwm: 53 },
    { rpm: 2040, pwm: 60 },
    { rpm: 2130, pwm: 70 },
    { rpm: 2230, pwm: 82 },
    { rpm: 2320, pwm: 90 },
    { rpm: 2410, pwm: 120 },
    { rpm: 2510, pwm: 160 },
    { rpm: 2600, pwm: 230 },
    { rpm: 2700, pwm: 255 },
];

// Açı değerleri aynı kalabilir.
export const VALID_ANGLES = [180, 225, 270, 315, 360, 405, 450, 495, 540, 600];