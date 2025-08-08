// packages/frontend/src/components/aura/StatusOrb.tsx
import { Box } from '@mantine/core';
import { useControllerStore } from '../../store/useControllerStore';
import cx from 'clsx';
import classes from './StatusOrb.module.css';

export function StatusOrb() {
    const { connectionStatus, arduinoStatus, motor, operatingMode } = useControllerStore();

    const isDisconnected = connectionStatus === 'disconnected' || arduinoStatus === 'disconnected';

    let stateClass = classes.orbBreathing; // Varsayılan durum (bağlantı bekleniyor veya idle)
    if (isDisconnected) {
        stateClass = classes.orbGlitch;
    } else if (motor.isActive) {
        switch (operatingMode) {
            case 'continuous':
                stateClass = classes.orbHeartbeat; // Sürekli mod için "kalp atışı" benzeri bir puls
                break;
            case 'oscillation':
                stateClass = classes.orbFlowing; // Osilasyon için akışkan hareket
                break;
            case 'pulse':
                stateClass = classes.orbPulsing; // Darbe için kısa, belirgin vuruşlar
                break;
            case 'vibration':
                stateClass = classes.orbVibrating; // Titreşim için ince, hızlı hareketler
                break;
            default:
                stateClass = classes.orbHeartbeat; // Bilinmeyen veya varsayılan aktif mod
        }
    } else {
        // Motor aktif değilse, bağlantı varsa statik "nefes alma" efekti
        stateClass = classes.orbBreathing;
    }

    return <Box className={cx(classes.statusOrb, stateClass)} />;
}