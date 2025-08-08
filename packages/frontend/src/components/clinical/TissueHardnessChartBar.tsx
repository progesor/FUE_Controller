import { useEffect, useRef, useState } from 'react';
import { Paper, Text } from '@mantine/core';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
} from 'chart.js';
import type { ChartData } from 'chart.js'; // ✅ type-only import
import { Bar } from 'react-chartjs-2';
import classes from './TissueHardnessChart.module.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

type Props = {
    isRunning: boolean;
    rpm?: number;
    oscillation?: number;
};

const MAX_POINTS = 60;
const TICK_MS = 250;
const CLAMP_MIN = 0;
const CLAMP_MAX = 100;

export function TissueHardnessChartBar({ isRunning, rpm = 0, oscillation = 0 }: Props) {
    const [labels, setLabels] = useState<string[]>([]);
    const [dataPoints, setDataPoints] = useState<number[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const emaRef = useRef<number>(10);
    const cycleRef = useRef<number>(0);

    const nextValue = () => {
        if (!isRunning) {
            emaRef.current += (0 - emaRef.current) * 0.25;
            return Math.max(CLAMP_MIN, emaRef.current);
        }

        cycleRef.current += TICK_MS;
        const progress = (cycleRef.current % 5000) / 5000;

        let baseLevel = 20;
        let amplitude = 5;
        let spikeChance = 0.02;
        let waveFreq = 1.0;

        if (progress < 0.1) {
            baseLevel = 15;
            amplitude = 4;
        } else if (progress < 0.25) {
            baseLevel = 75;
            amplitude = 10;
            spikeChance = 0.15;
            waveFreq = 2.5;
        } else if (progress < 0.7) {
            baseLevel = 50;
            amplitude = 12;
            waveFreq = 1.5;
        } else if (progress < 0.95) {
            baseLevel = 65 + Math.sin(progress * Math.PI * 3) * 10;
            amplitude = 14;
            waveFreq = 2.0;
            spikeChance = 0.1;
        } else {
            baseLevel = 80;
            amplitude = 16;
            spikeChance = 0.2;
            waveFreq = 2.5;
        }

        const t = Date.now() / 1000;
        let v =
            baseLevel +
            Math.sin(t * waveFreq) * amplitude +
            (Math.random() - 0.5) * amplitude * 0.5;

        if (Math.random() < spikeChance) {
            v += Math.random() * 15;
        }

        v += (rpm / 6000) * 3 + (oscillation / 100) * 2;

        const alpha = 0.25;
        emaRef.current = emaRef.current + alpha * (v - emaRef.current);

        return Math.max(CLAMP_MIN, Math.min(CLAMP_MAX, emaRef.current));
    };

    useEffect(() => {
        if (isRunning) {
            // setDataPoints([]);
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = setInterval(() => {
                const label = '';
                const value = nextValue();

                setLabels((prev) => {
                    const updated = [...prev, label];
                    return updated.length > MAX_POINTS ? updated.slice(updated.length - MAX_POINTS) : updated;
                });

                setDataPoints((prev) => {
                    const updated = [...prev, value];
                    return updated.length > MAX_POINTS ? updated.slice(updated.length - MAX_POINTS) : updated;
                });
            }, TICK_MS);
        } else {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isRunning, rpm, oscillation]);

    const chartData: ChartData<'bar'> = {
        labels,
        datasets: [
            {
                label: 'Hardness',
                data: dataPoints,
                backgroundColor: (ctx) => {
                    const raw = ctx.raw as number | undefined;
                    const parsed = (ctx.parsed && typeof ctx.parsed.y === 'number') ? ctx.parsed.y : undefined;
                    const v = Number.isFinite(raw as number) ? (raw as number) : (parsed ?? 0);
                    if (v > 75) return 'rgba(255, 99, 99, 0.9)';
                    if (v > 55) return 'rgba(255, 206, 86, 0.9)';
                    return 'rgba(75, 192, 75, 0.9)';
                },
                borderRadius: 0,
                barPercentage: 0.8,       // ✅ dataset seviyesinde
                categoryPercentage: 0.9,  // ✅ dataset seviyesinde
            },
        ],
    };

    return (
        <Paper
            radius="lg"
            withBorder
            className={`${classes.chartContainer} ${!isRunning ? classes.paused : ''}`}
        >
            <Text className={classes.title}>Tissue Hardness (dummy)</Text>
            <Bar
                data={chartData}
                options={{
                    responsive: true,
                    animation: false,
                    plugins: { legend: { display: false }, tooltip: { enabled: false } },
                    scales: {
                        x: {
                            grid: { color: 'rgba(255,255,255,0.05)' },
                            ticks: { display: false },
                            stacked: false,
                        },
                        y: {
                            min: CLAMP_MIN,
                            max: CLAMP_MAX,
                            grid: { color: 'rgba(255,255,255,0.05)' },
                            ticks: { stepSize: 20 },
                        },
                    },
                }}
                datasetIdKey="id"  // ✅ dataset id anahtarı
                // redraw
            />
        </Paper>
    );
}
