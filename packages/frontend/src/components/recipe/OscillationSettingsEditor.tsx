// packages/frontend/src/components/recipe/OscillationSettingsEditor.tsx

import { Slider, Text, Stack } from '@mantine/core';
import type { OscillationSettings } from '../../../../shared-types';
import { VALID_ANGLES } from '../../config/calibration';

interface OscillationSettingsEditorProps {
    settings: Partial<OscillationSettings>;
    onChange: (newSettings: OscillationSettings) => void;
}

export function OscillationSettingsEditor({ settings, onChange }: OscillationSettingsEditorProps) {
    const currentAngle = settings.angle || 180;
    const currentMarkIndex = VALID_ANGLES.indexOf(currentAngle);

    const handleSliderChange = (markIndex: number) => {
        const selectedAngle = VALID_ANGLES[markIndex];
        if (selectedAngle !== undefined) {
            onChange({ angle: selectedAngle });
        }
    };

    return (
        <Stack gap="xs">
            <Text fz="sm" fw={500}>Osilasyon Açısı</Text>
            <Slider
                value={currentMarkIndex !== -1 ? currentMarkIndex : 0}
                onChange={handleSliderChange}
                min={0}
                max={VALID_ANGLES.length - 1}
                step={1}
                label={null}
                marks={VALID_ANGLES.map((angle, index) => ({ value: index, label: `${angle}°` }))}
            />
        </Stack>
    );
}