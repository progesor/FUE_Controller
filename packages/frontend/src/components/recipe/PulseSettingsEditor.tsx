// packages/frontend/src/components/recipe/PulseSettingsEditor.tsx

import { Group, NumberInput, Stack, Text, Slider, Divider } from '@mantine/core';
import type { PulseSettings } from '../../../../shared-types';
import { RPM_CALIBRATION_MARKS } from '../../config/calibration';
import { findClosestMarkIndex } from '../../utils/rpmUtils';

interface PulseSettingsEditorProps {
    settings: Partial<PulseSettings>;
    onChange: (newSettings: Partial<PulseSettings>) => void;
}

export function PulseSettingsEditor({ settings, onChange }: PulseSettingsEditorProps) {
    const handleSettingChange = (newSetting: Partial<PulseSettings>) => {
        onChange(newSetting);
    };

    // --- RPM Slider Mantığı ---
    const currentPwm = settings.pwm ?? 100;
    const currentRpmMarkIndex = findClosestMarkIndex(currentPwm);
    const handleRpmSliderChange = (markIndex: number) => {
        const selectedMark = RPM_CALIBRATION_MARKS[markIndex];
        if (selectedMark) {
            handleSettingChange({ pwm: selectedMark.pwm });
        }
    };

    return (
        <Stack gap="md">
            {/* YENİ: RPM Slider */}
            <Stack gap="xs">
                <Text fz="sm" fw={500}>Motor Hızı (RPM)</Text>
                <Slider
                    value={currentRpmMarkIndex}
                    onChange={handleRpmSliderChange}
                    min={0}
                    max={RPM_CALIBRATION_MARKS.length - 1}
                    step={1}
                    label={(value) => `${RPM_CALIBRATION_MARKS[value]?.rpm || 0} RPM`}
                    marks={RPM_CALIBRATION_MARKS.map((mark, index) => ({ value: index, label: `${mark.rpm}` }))}
                />
            </Stack>

            <Divider />

            {/* Mevcut Darbe Süresi ve Bekleme Ayarları */}
            <Group grow>
                <NumberInput
                    label="Darbe Süresi (ms)"
                    value={settings.pulseDuration || 100}
                    onChange={(val) => handleSettingChange({ pulseDuration: Number(val) || 0 })}
                    min={20}
                    max={500}
                />
                <NumberInput
                    label="Bekleme (ms)"
                    value={settings.pulseDelay || 500}
                    onChange={(val) => handleSettingChange({ pulseDelay: Number(val) || 0 })}
                    min={50}
                    max={2000}
                />
            </Group>
        </Stack>
    );
}