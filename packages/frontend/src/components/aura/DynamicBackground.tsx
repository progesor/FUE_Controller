// packages/frontend/src/components/aura/DynamicBackground.tsx

import { Box } from '@mantine/core';
import classes from './AuraLayout.module.css';

export function DynamicBackground() {
    return (
        <Box className={classes.dynamicBackground}>
            {/* Bu boş div'ler, CSS'te ::before ve ::after ile
                hedefleyeceğimiz katmanları temsil edecek.
                Bu sayede daha karmaşık ve zengin bir görsel
                efekt oluşturabiliyoruz. */}
        </Box>
    );
}