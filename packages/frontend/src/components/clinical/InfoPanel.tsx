import { Group, Stack, Text } from '@mantine/core';
import { useControllerStore } from '../../store/useControllerStore';
import classes from './InfoPanel.module.css';

// Zamanı "DAKİKA:SANİYE" formatına çeviren yardımcı fonksiyon
const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60).toString().padStart(2, '0');
    const seconds = (timeInSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
};

export function InfoPanel() {
    // Store'dan anlık seans verilerini çekiyoruz
    const { graftCount, sessionTime } = useControllerStore();

    return (
        <Group justify="space-around" w="100%" gap="xl">
            <Stack align="center" gap={0}>
                <Text className={classes.label}>Work Time</Text>
                <Text className={classes.value}>{formatTime(sessionTime)}</Text>
            </Stack>
            <Stack align="center" gap={0}>
                <Text className={classes.label}>Counter</Text>
                <Text className={classes.value}>{graftCount}</Text>
            </Stack>
            <Stack align="center" gap={0}>
                <Text className={classes.label}>Total Work Time</Text>
                {/* Bu değer şimdilik seans süresi ile aynı olabilir,
                    ileride farklı bir mantıkla doldurulabilir. */}
                <Text className={classes.value}>{formatTime(sessionTime)}</Text>
            </Stack>
        </Group>
    );
}