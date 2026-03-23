// packages/frontend/src/components/recipe/OscillationSettingsEditor.tsx

import { Slider, Text, Stack, Divider } from '@mantine/core';
import type { OscillationSettings } from '../../../../shared-types';
import { VALID_ANGLES } from '../../config/calibration';

interface OscillationSettingsEditorProps {
    settings: Partial<OscillationSettings>;
    onChange: (newSettings: Partial<OscillationSettings>) => void;
}

export function OscillationSettingsEditor({ settings, onChange }: OscillationSettingsEditorProps) {
    const handleSettingChange = (newSetting: Partial<OscillationSettings>) => {
        onChange(newSetting);
    };

    // --- Açı Slider Mantığı ---
    const currentAngle = settings.angle || 180;
    const currentAngleMarkIndex = VALID_ANGLES.indexOf(currentAngle);

    const handleAngleSliderChange = (markIndex: number) => {
        const selectedAngle = VALID_ANGLES[markIndex];
        if (selectedAngle !== undefined) {
            handleSettingChange({ angle: selectedAngle });
        }
    };

    return (
        <Stack gap="md">
            {/* YENİ: Gerçek RPM Slider (Tablo Bağımlılığı Kaldırıldı) */}
            <Stack gap="xs">
                <Text fz="sm" fw={500}>Maksimum Motor Hızı (RPM)</Text>
                <Slider
                    value={settings.pwm ?? 1500}
                    onChange={(val) => handleSettingChange({ pwm: val })}
                    min={0}
                    max={5000}
                    step={100}
                    label={(value) => `${value} RPM`}
                    marks={[
                        { value: 1000, label: '1k' },
                        { value: 2000, label: '2k' },
                        { value: 3000, label: '3k' },
                        { value: 4000, label: '4k' },
                        { value: 5000, label: '5k' }
                    ]}
                />
            </Stack>

            <Divider />

            {/* Mevcut Açı Slider'ı */}
            <Stack gap="xs">
                <Text fz="sm" fw={500}>Osilasyon Açısı</Text>
                <Slider
                    value={currentAngleMarkIndex !== -1 ? currentAngleMarkIndex : 0}
                    onChange={handleAngleSliderChange}
                    min={0}
                    max={VALID_ANGLES.length - 1}
                    step={1}
                    label={null}
                    marks={VALID_ANGLES.map((angle, index) => ({ value: index, label: `${angle}°` }))}
                />
            </Stack>
        </Stack>
    );
}