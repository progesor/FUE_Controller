// packages/frontend/src/components/recipe/ContinuousSettingsEditor.tsx

import { Slider, Text, Stack, Divider } from '@mantine/core';
import type { ContinuousSettings } from '../../../../shared-types';

interface ContinuousSettingsEditorProps {
    settings: Partial<ContinuousSettings>;
    onChange: (newSettings: Partial<ContinuousSettings>) => void;
}

export function ContinuousSettingsEditor({ settings, onChange }: ContinuousSettingsEditorProps) {
    const handleSettingChange = (newSetting: Partial<ContinuousSettings>) => {
        onChange(newSetting);
    };

    return (
        <Stack gap="md">
            {/* YENİ: Gerçek RPM Slider (Tablo Bağımlılığı Kaldırıldı) */}
            <Stack gap="xs">
                <Text fz="sm" fw={500}>Motor Hızı (RPM)</Text>
                <Slider
                    value={settings.pwm ?? 1500}
                    onChange={(val) => handleSettingChange({ pwm: val })}
                    min={0}
                    max={35000}
                    step={500}
                    label={(value) => `${value} RPM`}
                    marks={[
                        { value: 10000, label: '10k' },
                        { value: 20000, label: '20k' },
                        { value: 30000, label: '30k' }
                    ]}
                />
            </Stack>

            <Divider />

            {/* Mevcut Rampa Süresi Slider'ı */}
            <Stack gap="xs">
                <Text fz="sm" fw={500}>Rampa Süresi (Yavaş Başlatma)</Text>
                <Slider
                    value={settings.rampDuration || 0}
                    onChange={(duration) => handleSettingChange({ rampDuration: duration })}
                    min={0}
                    max={2000}
                    step={100}
                    label={(value) => (value === 0 ? 'Kapalı' : `${value} ms`)}
                />
            </Stack>
        </Stack>
    );
}