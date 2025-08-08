// packages/frontend/src/components/clinical/PresetButtons.tsx

import { Button, Group, Text } from '@mantine/core';
import { useControllerStore } from '../../store/useControllerStore';
import { sendOperatingMode } from '../../services/socketService';
import type { OperatingMode } from '../../../../shared-types';
import classes from './PresetButtons.module.css';
import cx from 'clsx';
import { NotificationService } from '../../services/notificationService';
import { IconInfinity, IconRepeat, IconBook, IconListDetails } from '@tabler/icons-react';

const presets = [
    { id: 'continuous', label: 'Sürekli', icon: IconInfinity },
    { id: 'oscillation', label: 'Osilasyon', icon: IconRepeat },
    { id: 'protocol1', label: 'Protokol 1', icon: IconBook },
    { id: 'protocol2', label: 'Protokol 2', icon: IconBook },
    { id: 'protocol3', label: 'Protokol 3', icon: IconBook },
    { id: 'recipe1', label: 'Hızlı Reçete', icon: IconListDetails },
];

export function PresetButtons() {
    const { operatingMode, setOperatingMode } = useControllerStore();

    const handlePresetClick = (id: string) => {
        if (id === 'continuous' || id === 'oscillation') {
            const newMode = id as OperatingMode;
            setOperatingMode(newMode);
            sendOperatingMode(newMode);
        } else {
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
                    leftSection={<preset.icon size={22} />}
                >
                    <Text component="span" className={classes.buttonLabel}>{preset.label}</Text>
                </Button>
            ))}
        </Group>
    );
}