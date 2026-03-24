// packages/frontend/src/components/clinical/TissueHardnessChart.tsx

import { useEffect, useState } from 'react';
import { Paper, Text } from '@mantine/core';
import {
    Chart as ChartJS, CategoryScale, LinearScale, PointElement,
    LineElement, Tooltip, Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import classes from './TissueHardnessChart.module.css';
import { socket } from '../../services/socketService';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

type Props = {
    isRunning: boolean;
    rpm?: number;
    oscillation?: number;
};

const MAX_POINTS = 50; // Grafikte aynı anda görünecek nokta sayısı

export function TissueHardnessChart({ isRunning }: Props) {
    const [labels, setLabels] = useState<string[]>([]);
    const [dataPoints, setDataPoints] = useState<number[]>([]);

    // 1. Manuel başlatmalarda (Motor tamamen durmuşken -> Çalışıyor'a geçince) temizle
    useEffect(() => {
        if (isRunning) {
            setLabels([]);
            setDataPoints([]);
        }
    }, [isRunning]);

    // 2. Telemetri ve Sıfırlama Sinyallerini Dinle
    useEffect(() => {
        let lastUpdateTime = 0; // YENİ: Frenleme (Throttle) için zaman tutucu

        const handleTelemetry = (data: string) => {
            if (!isRunning) return;

            // YENİ: PERFORMANS KORUMASI
            // Telemetri ne kadar hızlı gelirse gelsin, React'i saniyede en fazla 10 kez (100ms'de bir) yor!
            const now = Date.now();
            if (now - lastUpdateTime < 100) return;
            lastUpdateTime = now;

            const cleanString = data.replace('<TEL,', '').replace('>', '');
            const values = cleanString.split(',');
            const rawRpm = parseFloat(values[0]);

            if (!isNaN(rawRpm)) {
                const absoluteRpm = Math.abs(rawRpm);
                const timeLabel = new Date().toLocaleTimeString('en-US', { minute: '2-digit', second: '2-digit' });

                setLabels((prev) => {
                    const updated = [...prev, timeLabel];
                    return updated.length > MAX_POINTS ? updated.slice(updated.length - MAX_POINTS) : updated;
                });

                setDataPoints((prev) => {
                    const updated = [...prev, absoluteRpm];
                    return updated.length > MAX_POINTS ? updated.slice(updated.length - MAX_POINTS) : updated;
                });
            }
        };

        const handleClear = () => {
            setLabels([]);
            setDataPoints([]);
        };

        socket.on('telemetry_data', handleTelemetry);
        (socket as any).on('chart_clear', handleClear);

        return () => {
            socket.off('telemetry_data', handleTelemetry);
            (socket as any).off('chart_clear', handleClear);
        };
    }, [isRunning]);

    return (
        <Paper radius="lg" withBorder className={`${classes.chartContainer} ${!isRunning ? classes.paused : ''}`}>
            <Text className={classes.title} c="dimmed" size="sm" mb="xs" ml="xs">Gerçek Zamanlı Motor RPM</Text>
            <div style={{ height: '140px' }}> {/* Yüksekliği sabitledik ki UI zıplamasın */}
                <Line
                    data={{
                        labels,
                        datasets: [
                            {
                                label: 'RPM',
                                data: dataPoints,
                                fill: true,
                                borderColor: 'rgba(64, 192, 87, 0.9)', // FUE temasına uygun yeşil hat
                                backgroundColor: 'rgba(64, 192, 87, 0.1)',
                                tension: 0.2,
                                pointRadius: 0,
                            },
                        ],
                    }}
                    options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        animation: { duration: 0 }, // Gerçek zamanlı akış için animasyonu kapattık
                        layout: { padding: { top: 2, bottom: 0 } },
                        plugins: { legend: { display: false }, tooltip: { intersect: false, mode: 'index' } },
                        elements: { line: { borderWidth: 2 } },
                        scales: {
                            x: {
                                display: false // Sade görünüm için X yazıları gizli
                            },
                            y: {
                                min: 0,
                                suggestedMax: 5000, // Varsayılan tavan (35000 gelirse otomatik yukarı esner)
                                grid: { color: 'rgba(255,255,255,0.05)' },
                                ticks: { maxTicksLimit: 5 },
                            },
                        },
                    }}
                />
            </div>
        </Paper>
    );
}