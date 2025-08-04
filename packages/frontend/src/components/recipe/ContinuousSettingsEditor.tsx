// packages/frontend/src/components/recipe/ContinuousSettingsEditor.tsx

import { Slider, Text, Stack } from '@mantine/core';
import type { ContinuousSettings } from '../../../../shared-types';

interface ContinuousSettingsEditorProps {
    settings: Partial<ContinuousSettings>;
    onChange: (newSettings: ContinuousSettings) => void;
}

export function ContinuousSettingsEditor({ settings, onChange }: ContinuousSettingsEditorProps) {
    const handleRampChange = (duration: number) => {
        onChange({ rampDuration: duration });
    };

    return (
        <Stack gap="xs">
            <Text fz="sm" fw={500}>Rampa Süresi (Yavaş Başlatma)</Text>
            <Slider
                value={settings.rampDuration || 0}
                onChange={handleRampChange}
                min={0}
                max={2000}
                step={100}
                label={(value) => (value === 0 ? 'Kapalı' : `${value} ms`)}
            />
        </Stack>
    );
}