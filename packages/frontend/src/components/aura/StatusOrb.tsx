// packages/frontend/src/components/aura/StatusOrb.tsx

import { Box } from '@mantine/core';
import { useControllerStore } from '../../store/useControllerStore';
import classes from './StatusOrb.module.css';
import cx from 'clsx';

export function StatusOrb() {
    // uiMode state'i store'dan alındı.
    const { connectionStatus, arduinoStatus, motor, uiMode } = useControllerStore();

    const isDisconnected = connectionStatus === 'disconnected' || arduinoStatus === 'disconnected';
    const isMotorActive = motor.isActive;

    // DÜZELTME: Animasyon ve renk sınıflarını ayrı ayrı belirliyoruz.
    const animationClass = isDisconnected
        ? classes.orbGlitch
        : isMotorActive
            ? classes.orbHeartbeat
            : classes.orbBreathing;

    const modeColorClass = classes[`mode-${uiMode}`];

    // Tüm sınıfları birleştiriyoruz.
    const orbClassName = cx(
        classes.statusOrb,
        animationClass,
        modeColorClass
    );

    return <Box className={orbClassName} />;
}
