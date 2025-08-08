import { useEffect, useRef, useState } from 'react';
import { Paper, Text } from '@mantine/core';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import classes from './TissueHardnessChart.module.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

type Props = {
    isRunning: boolean;
    rpm?: number;
    oscillation?: number;
};

const MAX_POINTS = 40;
const TICK_MS = 250;
const CLAMP_MIN = 0;
const CLAMP_MAX = 100;

export function TissueHardnessChart({ isRunning, rpm = 0, oscillation = 0 }: Props) {
    const [labels, setLabels] = useState<string[]>([]);
    const [dataPoints, setDataPoints] = useState<number[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const emaRef = useRef<number>(10);
    const cycleRef = useRef<number>(0);

    const nextValue = () => {
        // Motor kapalı → sertliği hızlı düşür
        if (!isRunning) {
            emaRef.current += (0 - emaRef.current) * 0.25;
            return Math.max(CLAMP_MIN, emaRef.current);
        }

        cycleRef.current += TICK_MS;
        const progress = (cycleRef.current % 5000) / 5000; // 5 sn'lik döngü

        let baseLevel = 20;
        let amplitude = 5;
        let spikeChance = 0.02;
        let waveFreq = 1.0;

        if (progress < 0.1) {
            // Boşta dönme
            baseLevel = 15;
            amplitude = 4;
        } else if (progress < 0.25) {
            // İlk sert temas
            baseLevel = 75;
            amplitude = 10;
            spikeChance = 0.15;
            waveFreq = 2.5;
        } else if (progress < 0.7) {
            // Kolay doku
            baseLevel = 50;
            amplitude = 12;
            waveFreq = 1.5;
        } else if (progress < 0.95) {
            // Sona doğru artış
            baseLevel = 65 + Math.sin(progress * Math.PI * 3) * 10;
            amplitude = 14;
            waveFreq = 2.0;
            spikeChance = 0.1;
        } else {
            // Bitmeye yakın ani sertlik
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

        // RPM ve oscillation'a göre ufak ek modifikasyon
        v += (rpm / 6000) * 3 + (oscillation / 100) * 2;

        // EMA yumuşatma
        const alpha = 0.25;
        emaRef.current = emaRef.current + alpha * (v - emaRef.current);

        return Math.max(CLAMP_MIN, Math.min(CLAMP_MAX, emaRef.current));
    };

    useEffect(() => {
        if (isRunning) {
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = setInterval(() => {
                const label = new Date().toLocaleTimeString('en-US', { minute: '2-digit', second: '2-digit' });
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

    return (
        <Paper
            radius="lg"
            withBorder
            className={`${classes.chartContainer} ${!isRunning ? classes.paused : ''}`}
        >
            <Text className={classes.title}>Tissue Hardness (dummy)</Text>
            <Line
                data={{
                    labels,
                    datasets: [
                        {
                            label: 'Hardness',
                            data: dataPoints,
                            fill: true,
                            borderColor: 'rgba(0, 229, 255, 0.9)',
                            backgroundColor: 'rgba(0, 229, 255, 0.1)',
                            tension: 0.35,
                            pointRadius: 0,
                        },
                    ],
                }}
                options={{
                    responsive: true,
                    animation: false,
                    layout: { padding: { top: 2, bottom: 0 } },
                    plugins: { legend: { display: false }, tooltip: { intersect: false, mode: 'index' } },
                    elements: { line: { borderWidth: 2 } },
                    scales: {
                        x: {
                            grid: { color: 'rgba(255,255,255,0.05)' },
                            ticks: { maxTicksLimit: 6 },
                        },
                        y: {
                            min: CLAMP_MIN,
                            max: CLAMP_MAX,
                            grid: { color: 'rgba(255,255,255,0.05)' },
                            ticks: { stepSize: 20 },
                        },
                    },
                }}
            />
        </Paper>
    );
}
