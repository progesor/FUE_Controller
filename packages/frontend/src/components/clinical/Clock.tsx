import { useState, useEffect } from 'react';
import { Text } from '@mantine/core';
import classes from './Clock.module.css';

export function Clock() {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        // Her saniye saati güncellemek için bir interval kuruyoruz
        const timerId = setInterval(() => {
            setTime(new Date());
        }, 1000);

        // Bileşen kaldırıldığında interval'i temizliyoruz
        return () => clearInterval(timerId);
    }, []);

    const formattedTime = time.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <Text className={classes.timeText}>{formattedTime}</Text>
    );
}