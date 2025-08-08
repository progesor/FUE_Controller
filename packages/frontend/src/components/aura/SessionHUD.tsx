// packages/frontend/src/components/aura/SessionHUD.tsx

import { Box, Group, Text, Divider } from '@mantine/core';
import { useControllerStore } from '../../store/useControllerStore';
import classes from './SessionHUD.module.css';
import { AnimatePresence, motion } from 'framer-motion';

// Zamanı "DAKİKA:SANİYE" formatına çeviren yardımcı fonksiyon
const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60).toString().padStart(2, '0');
    const seconds = (timeInSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
};

export function SessionHUD() {
    const { graftCount, sessionTime, motor } = useControllerStore();

    return (
        <AnimatePresence>
            {motor.isActive && (
                <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -50, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                    className={classes.hudWrapper}
                >
                    <Group className={classes.hudContent} gap="xl">
                        <Box className={classes.hudItem}>
                            <Text className={classes.hudLabel}>GREFT</Text>
                            <Text className={classes.hudValue}>{graftCount}</Text>
                        </Box>
                        <Divider orientation="vertical" className={classes.hudDivider} />
                        <Box className={classes.hudItem}>
                            <Text className={classes.hudLabel}>SEANS SÜRESİ</Text>
                            <Text className={classes.hudValue}>{formatTime(sessionTime)}</Text>
                        </Box>
                    </Group>
                </motion.div>
            )}
        </AnimatePresence>
    );
}