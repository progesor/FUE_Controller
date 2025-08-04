// packages/frontend/src/components/recipe/ContinuousSettingsEditor.tsx

import { Slider, Text, Stack, Divider } from '@mantine/core';
import type { ContinuousSettings } from '../../../../shared-types';
import { RPM_CALIBRATION_MARKS } from '../../config/calibration';
import { findClosestMarkIndex } from '../../utils/rpmUtils';

interface ContinuousSettingsEditorProps {
    settings: Partial<ContinuousSettings>;
    // DÜZELTME: onChange artık kısmi güncellemeleri kabul ediyor.
    onChange: (newSettings: Partial<ContinuousSettings>) => void;
}

export function ContinuousSettingsEditor({ settings, onChange }: ContinuousSettingsEditorProps) {
    const handleSettingChange = (newSetting: Partial<ContinuousSettings>) => {
        onChange(newSetting);
    };

    const handleRpmSliderChange = (markIndex: number) => {
        const selectedMark = RPM_CALIBRATION_MARKS[markIndex];
        if (selectedMark) {
            handleSettingChange({ pwm: selectedMark.pwm });
        }
    };

    // Adımda bir hız belirtilmemişse, varsayılan olarak 100 PWM kullan.
    // Backend, bu alan hiç gönderilmezse global hızı kullanacaktır.
    const currentPwm = settings.pwm ?? 100;
    const currentMarkIndex = findClosestMarkIndex(currentPwm);

    return (
        <Stack gap="md">
            {/* YENİ: RPM Slider */}
            <Stack gap="xs">
                <Text fz="sm" fw={500}>Motor Hızı (RPM)</Text>
                <Slider
                    value={currentMarkIndex}
                    onChange={handleRpmSliderChange}
                    min={0}
                    max={RPM_CALIBRATION_MARKS.length - 1}
                    step={1}
                    label={(value) => `${RPM_CALIBRATION_MARKS[value]?.rpm || 0} RPM`}
                    marks={RPM_CALIBRATION_MARKS.map((mark, index) => ({ value: index, label: `${mark.rpm}` }))}
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