// packages/frontend/src/components/aura/SessionHUD.tsx

import { Box, Group, Text } from '@mantine/core';
import { useControllerStore } from '../../store/useControllerStore';
import classes from './SessionHUD.module.css';
import { IconClock, IconRecycle } from '@tabler/icons-react';

// formatTime fonksiyonu aynı kalıyor
const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60).toString().padStart(2, '0');
    const seconds = (timeInSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
};

export function SessionHUD() {
    // isSessionActive koşulu kaldırıldı
    const { graftCount, sessionTime } = useControllerStore();

    return (
        <Box className={classes.hudWrapper}>
            <Group className={classes.hudContent} justify="space-between" align="center">
                <Group gap="xs" className={classes.hudItem}>
                    <IconClock size={28} className={classes.hudIcon} stroke={1.5} />
                    <Box>
                        <Text className={classes.hudLabel}>SEANS SÜRESİ</Text>
                        <Text className={classes.hudValue}>{formatTime(sessionTime)}</Text>
                    </Box>
                </Group>

                <Group gap="xs" className={classes.hudItem} justify="flex-end">
                    <Box style={{ textAlign: 'right' }}>
                        <Text className={classes.hudLabel}>GREFT SAYISI</Text>
                        <Text className={classes.hudValue}>{graftCount}</Text>
                    </Box>
                    <IconRecycle size={28} className={classes.hudIcon} stroke={1.5} />
                </Group>
            </Group>
        </Box>
    );
}