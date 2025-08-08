import { Group, Text, Paper, Divider, Grid } from '@mantine/core';
import { useControllerStore } from '../../store/useControllerStore';
import classes from './InfoPanel.module.css';

type InfoPanelProps = {
    showClock?: boolean;
    // İleride totalWorkTime store'dan geldiğinde buraya eklenebilir
};

const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60).toString().padStart(2, '0');
    const seconds = (timeInSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
};

export function InfoPanel({ showClock = true }: InfoPanelProps) {
    const { graftCount, sessionTime } = useControllerStore();

    return (
        <Paper radius="xl" className={classes.bar} withBorder>
            <Grid align="center" gutter="md" className={classes.grid}>
                <Grid.Col span={{ base: 6, sm: 3 }}>
                    <Group gap={2} justify="center" className={classes.item}>
                        <Text className={classes.label}>Work Time</Text>
                        <Text className={classes.value}>{formatTime(sessionTime)}</Text>
                    </Group>
                </Grid.Col>

                <Grid.Col span={{ base: 6, sm: 3 }}>
                    <Group gap={2} justify="center" className={classes.item}>
                        <Text className={classes.label}>Counter</Text>
                        <Text className={classes.value}>{graftCount}</Text>
                    </Group>
                </Grid.Col>

                <Grid.Col span={{ base: 6, sm: 3 }}>
                    <Group gap={2} justify="center" className={classes.item}>
                        <Text className={classes.label}>Total Work Time</Text>
                        <Text className={classes.value}>{formatTime(sessionTime)}</Text>
                    </Group>
                </Grid.Col>

                {showClock && (
                    <Grid.Col span={{ base: 6, sm: 3 }}>
                        <Group gap={2} justify="center" className={classes.item}>
                            <Text className={classes.label}>Local Time</Text>
                            <Text className={classes.value} id="realtime-clock">{/* Clock değerini JS ile dolduracağız */}</Text>
                        </Group>
                    </Grid.Col>
                )}
            </Grid>

            {/* Dikey ayırıcılar – yalnızca geniş ekranda görünür */}
            <Divider orientation="vertical" className={classes.sep} />
            <Divider orientation="vertical" className={classes.sep} />
            <Divider orientation="vertical" className={classes.sep} />
        </Paper>
    );
}

// Bar içinde canlı saat: basit bir efekt
if (typeof window !== 'undefined') {
    const tick = () => {
        const el = document.getElementById('realtime-clock');
        if (el) {
            el.textContent = new Date().toLocaleTimeString('en-US', {
                hour: '2-digit', minute: '2-digit',
            });
        }
    };
    tick();
    setInterval(tick, 1000);
}
