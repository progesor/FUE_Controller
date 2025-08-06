// packages/frontend/src/components/aura/StatusOrb.tsx
import { Box } from '@mantine/core';
import { useControllerStore } from '../../store/useControllerStore';
import classes from './StatusOrb.module.css'; // GÜNCELLENDİ
import cx from 'clsx';
// ... (geri kalan kod aynı)
export function StatusOrb() {
    const { connectionStatus, arduinoStatus, motor } = useControllerStore();
    const isDisconnected = connectionStatus === 'disconnected' || arduinoStatus === 'disconnected';
    const isMotorActive = motor.isActive;
    const orbClassName = cx(classes.statusOrb, {
        [classes.orbDisconnected]: isDisconnected,
        [classes.orbActive]: isMotorActive && !isDisconnected,
    });
    return <Box className={orbClassName} />;
}