// packages/frontend/src/components/aura/StatusOrb.tsx
import { Box } from '@mantine/core';
import { useControllerStore } from '../../store/useControllerStore';
import cx from 'clsx';
import classes from './StatusOrb.module.css';

export function StatusOrb() {
    const { connectionStatus, arduinoStatus, motor } = useControllerStore();
    const isDisconnected =
        connectionStatus === 'disconnected' || arduinoStatus === 'disconnected';

    let stateClass = classes.orbBreathing;
    if (isDisconnected) {
        stateClass = classes.orbGlitch;
    } else if (motor.isActive) {
        stateClass = classes.orbHeartbeat;
    }

    return <Box className={cx(classes.statusOrb, stateClass)} />;
}