// packages/frontend/src/components/clinical/PresetButtons.tsx

import { Button, Group } from '@mantine/core';
import { useControllerStore } from '../../store/useControllerStore';
import { sendOperatingMode } from '../../services/socketService';
import type { OperatingMode } from '../../../../shared-types';
import classes from './PresetButtons.module.css';
import cx from 'clsx';
import { NotificationService } from '../../services/notificationService';

const presets = [
    { id: 'continuous', label: 'Sürekli' },
    { id: 'oscillation', label: 'Osilasyon' },
    { id: 'protocol1', label: 'Protokol 1' },
    { id: 'protocol2', label: 'Protokol 2' },
    { id: 'protocol3', label: 'Protokol 3' },
    { id: 'recipe1', label: 'Hızlı Reçete' },
];

export function PresetButtons() {
    const { operatingMode, setOperatingMode } = useControllerStore();

    const handlePresetClick = (id: string) => {
        if (id === 'continuous' || id === 'oscillation') {
            const newMode = id as OperatingMode;
            setOperatingMode(newMode);
            sendOperatingMode(newMode);
        } else {
            // Gelecekteki özellikler için yer tutucu
            NotificationService.showInfo(`'${presets.find(p => p.id === id)?.label}' özelliği yakında eklenecek.`);
        }
    };

    return (
        <Group justify="center" gap="lg">
            {presets.map((preset) => (
                <Button
                    key={preset.id}
                    variant="default"
                    className={cx(classes.presetButton, {
                        [classes.active]: operatingMode === preset.id
                    })}
                    onClick={() => handlePresetClick(preset.id)}
                >
                    {preset.label}
                </Button>
            ))}
        </Group>
    );
}