// packages/frontend/src/components/recipe/PulseSettingsEditor.tsx

import { Group, NumberInput } from '@mantine/core';
import type { PulseSettings } from '../../../../shared-types';

interface PulseSettingsEditorProps {
    settings: Partial<PulseSettings>;
    // Değişiklik: Artık tüm nesne yerine sadece değişen kısmı gönderiyoruz.
    onChange: (newSettings: Partial<PulseSettings>) => void;
}

export function PulseSettingsEditor({ settings, onChange }: PulseSettingsEditorProps) {
    // Değişiklik: Bu fonksiyon artık çok daha basit. Sadece değişen alanı bildiriyor.
    const handleSettingChange = (field: keyof PulseSettings, value: number) => {
        onChange({ [field]: value });
    };

    return (
        <Group grow>
            <NumberInput
                label="Darbe Süresi (ms)"
                value={settings.pulseDuration || 100}
                onChange={(val) => handleSettingChange('pulseDuration', Number(val) || 0)}
                min={20}
                max={500}
            />
            <NumberInput
                label="Bekleme (ms)"
                value={settings.pulseDelay || 500}
                onChange={(val) => handleSettingChange('pulseDelay', Number(val) || 0)}
                min={50}
                max={2000}
            />
        </Group>
    );
}