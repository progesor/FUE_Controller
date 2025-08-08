// frontend src/utils/deviceSelectors.ts

import type {DeviceStatus} from "../../../shared-types";

export const MAX_RPM = 6000;        // gerçek kalibrasyonla güncelle
export const MAX_OSC_ANGLE = 180;   // cihaz limitine göre güncelle

export const pwmToRpm = (pwm: number) =>
    Math.round((Math.max(0, Math.min(255, pwm)) / 255) * MAX_RPM);

// Mod özel PWM > yoksa global motor PWM
export const selectEffectivePwm = (s: DeviceStatus) => {
    switch (s.operatingMode) {
        case 'oscillation':
            return s.oscillationSettings.pwm ?? s.motor.pwm;
        case 'pulse':
            return s.pulseSettings.pwm ?? s.motor.pwm;
        case 'vibration':
            return s.vibrationSettings.intensity ?? s.motor.pwm;
        case 'continuous':
        default:
            return s.continuousSettings.pwm ?? s.motor.pwm;
    }
};

export const selectIsActive = (s: DeviceStatus) => s.motor.isActive;

export const selectRpm = (s: DeviceStatus) => pwmToRpm(selectEffectivePwm(s));

// Oscillation yüzdesi (açı -> %)
export const selectOscPercent = (s: DeviceStatus) => {
    const angle = s.oscillationSettings?.angle ?? 0;
    return Math.round((Math.max(0, angle) / MAX_OSC_ANGLE) * 100);
};
