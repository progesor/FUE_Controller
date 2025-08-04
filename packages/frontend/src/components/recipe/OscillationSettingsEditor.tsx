// packages/frontend/src/components/recipe/OscillationSettingsEditor.tsx

import { Slider, Text, Stack, Divider } from '@mantine/core';
import type { OscillationSettings } from '../../../../shared-types';
import { VALID_ANGLES, RPM_CALIBRATION_MARKS } from '../../config/calibration';
import { findClosestMarkIndex } from '../../utils/rpmUtils';

interface OscillationSettingsEditorProps {
    settings: Partial<OscillationSettings>;
    // DÜZELTME: onChange artık kısmi güncellemeleri kabul ediyor.
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