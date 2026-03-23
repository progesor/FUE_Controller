// packages/frontend/src/components/recipe/PulseSettingsEditor.tsx

import { Group, NumberInput, Stack, Text, Slider, Divider } from '@mantine/core';
import type { PulseSettings } from '../../../../shared-types';

interface PulseSettingsEditorProps {
    settings: Partial<PulseSettings>;
    onChange: (newSettings: Partial<PulseSettings>) => void;
}

export function PulseSettingsEditor({ settings, onChange }: PulseSettingsEditorProps) {
    const handleSettingChange = (newSetting: Partial<PulseSettings>) => {
        onChange(newSetting);
    };

    return (
        <Stack gap="md">
            {/* YENİ: Özgür RPM Slider (Artık tabloya bağlı değil) */}
            <Stack gap="xs">
                <Text fz="sm" fw={500}>Taban Motor Hızı (Base RPM)</Text>
                <Slider
                    value={settings.baseRpm ?? 1000}
                    onChange={(val) => handleSettingChange({ baseRpm: val })}
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

            {/* Mevcut Darbe Süresi, Bekleme ve Pik Hız Ayarları */}
            <Group grow>
                <NumberInput
                    label="Pik Hız (Pulse RPM)"
                    value={settings.pulseRpm || 5000}
                    onChange={(val) => handleSettingChange({ pulseRpm: Number(val) || 0 })}
                    min={100}
                    max={35000}
                    step={500}
                />
                <NumberInput
                    label="Darbe Süresi (ms)"
                    value={settings.pulseDuration || 100}
                    onChange={(val) => handleSettingChange({ pulseDuration: Number(val) || 0 })}
                    min={20}
                    max={500}
                />
                <NumberInput
                    label="Bekleme (ms)"
                    value={settings.pulseInterval || 500}
                    onChange={(val) => handleSettingChange({ pulseInterval: Number(val) || 0 })}
                    min={50}
                    max={2000}
                />
            </Group>
        </Stack>
    );
}