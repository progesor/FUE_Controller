// packages/frontend/src/components/common/LogSummary.tsx

import { Text, Badge, Group } from '@mantine/core';
import { IconPower, IconRepeat, IconInfinity } from '@tabler/icons-react';
import type { DeviceStatus } from '../../../../shared-types';

interface LogSummaryProps {
    data: DeviceStatus;
}

/**
 * DeviceStatus nesnesini kompakt ve okunabilir bir özet olarak görüntüler.
 */
export function LogSummary({ data }: LogSummaryProps) {
    if (!data || !data.motor) {
        return null; // Geçersiz veri gelirse hiçbir şey gösterme
    }

    const { motor, operatingMode, oscillationSettings } = data;

    return (
        <Group gap="xs" wrap="nowrap" mt={4}>
            <Badge
                size="sm"
                variant="light"
                color={motor.isActive ? 'green' : 'gray'}
                leftSection={<IconPower size={12} />}
            >
                {motor.isActive ? `AKTİF - ${motor.pwm} PWM` : 'DURDU'}
            </Badge>

            <Text c="dimmed" fz="xs">→</Text>

            <Badge
                size="sm"
                variant="outline"
                color="blue"
                leftSection={operatingMode === 'continuous' ? <IconInfinity size={12} /> : <IconRepeat size={12} />}
            >
                {operatingMode === 'continuous' ? 'Sürekli' : `Osilasyon (${oscillationSettings.angle}°)`}
            </Badge>

            <Text c="dimmed" fz="xs">→</Text>

            <Badge size="sm" variant="outline" color="gray">
                Yön: {motor.direction === 0 ? 'CW' : 'CCW'}
            </Badge>
        </Group>
    );
}