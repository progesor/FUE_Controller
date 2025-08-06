// packages/frontend/src/components/aura/DynamicBackground.tsx

import { Box } from '@mantine/core';
import classes from './AuraLayout.module.css';
import { useControllerStore } from '../../store/useControllerStore';
import type { CSSProperties } from 'react';

type DynamicBgStyle = CSSProperties & {
    '--bg-speed': number;
    '--bg-brightness': number;
};

export function DynamicBackground() {
    const { motor, connectionStatus } = useControllerStore();

    const style: DynamicBgStyle = {
        '--bg-speed': motor.isActive ? 2 : 1,
        '--bg-brightness': connectionStatus === 'connected' ? 0.8 : 0.4,
    };

    return (
        <Box
            className={classes.dynamicBackground}
            style={style}
            data-connection={connectionStatus}
        >
            {/* Bu boş div'ler, CSS'te ::before ve ::after ile
                hedefleyeceğimiz katmanları temsil edecek.
                Bu sayede daha karmaşık ve zengin bir görsel
                efekt oluşturabiliyoruz. */}
        </Box>
    );
}
