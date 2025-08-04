// packages/frontend/src/components/recipe/VibrationSettingsEditor.tsx

import { Group, Slider, Text, Stack } from '@mantine/core';
import type { VibrationSettings } from '../../../../shared-types';

interface VibrationSettingsEditorProps {
    settings: Partial<VibrationSettings>;
    // Değişiklik: Artık tüm nesne yerine sadece değişen kısmı gönderiyoruz.
    onChange: (newSettings: Partial<VibrationSettings>) => void;
}

// Bu yardımcı fonksiyonlar aynı kalabilir
const pwmToPercentage = (pwm: number) => {
    const MIN_PWM = 50;
    const MAX_PWM = 255;
    if (pwm < MIN_PWM) return 0;
    return Math.round(((pwm - MIN_PWM) / (MAX_PWM - MIN_PWM)) * 100);
};

const percentageToPwm = (percentage: number) => {
    const MIN_PWM = 50;
    const MAX_PWM = 255;
    return Math.round((percentage / 100) * (MAX_PWM - MIN_PWM) + MIN_PWM);
};

export function VibrationSettingsEditor({ settings, onChange }: VibrationSettingsEditorProps) {
    // Değişiklik: Bu fonksiyon artık çok daha basit. Sadece değişen alanı bildiriyor.
    const handleSettingChange = (field: keyof VibrationSettings, value: number) => {
        onChange({ [field]: value });
    };

    return (
        <Group grow>
            <Stack gap="xs" style={{ flex: 1 }}>
                <Text fz="sm" fw={500}>Yoğunluk</Text>
                <Slider
                    value={pwmToPercentage(settings.intensity || 100)}
                    onChange={(val) => handleSettingChange('intensity', percentageToPwm(val))}
                    min={0}
                    max={100}
                    label={(val) => `% ${val}`}
                />
            </Stack>
            <Stack gap="xs" style={{ flex: 1 }}>
                <Text fz="sm" fw={500}>Frekans</Text>
                <Slider
                    value={settings.frequency || 5}
                    onChange={(val) => handleSettingChange('frequency', val)}
                    min={1}
                    max={10}
                    label={(val) => `Seviye ${val}`}
                />
            </Stack>
        </Group>
    );
}