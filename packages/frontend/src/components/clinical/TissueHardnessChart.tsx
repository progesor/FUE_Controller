// packages/frontend/src/components/clinical/TissueHardnessChart.tsx

import { useEffect, useState } from 'react';
import { Paper, Text } from '@mantine/core';
import {
    Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import classes from './TissueHardnessChart.module.css';
import { socket } from '../../services/socketService';
import { useControllerStore } from '../../store/useControllerStore';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

type Props = {
    isRunning: boolean;
    rpm?: number;
    oscillation?: number;
};

// YENİ: Ekranda aynı anda görünecek çubuk sayısı 200'e çıkarıldı!
const MAX_POINTS = 200;

const MODE_COLORS: Record<string, string> = {
    continuous: 'rgba(51, 154, 240, 0.9)',
    oscillation: 'rgba(204, 93, 232, 0.9)',
    vibration: 'rgba(32, 201, 151, 0.9)',
    pulse: 'rgba(255, 146, 43, 0.9)',
    loop: 'rgba(255, 107, 107, 0.9)'
};
const DEFAULT_COLOR = 'rgba(0, 229, 255, 0.8)';

export function TissueHardnessChart({ isRunning }: Props) {
    const [labels, setLabels] = useState<string[]>([]);
    const [dataPoints, setDataPoints] = useState<number[]>([]);
    const [barColors, setBarColors] = useState<string[]>([]);

    // YENİ: DİNAMİK YÜKSEKLİK (Y-AXIS) HESAPLAMA
    // Ekrandaki mevcut en yüksek RPM değerini bulur.
    // Minimum 1000 RPM tavan sınırı koyuyoruz ki motor durduğunda grafik sıfıra çöküp ezilmesin.
    const maxRpmInChart = dataPoints.length > 0 ? Math.max(...dataPoints) : 1000;
    const dynamicYMax = Math.max(1000, Math.floor(maxRpmInChart * 1.15)); // Zirve noktasının %15 üstünde nefes boşluğu bırakır

    useEffect(() => {
        if (isRunning) {
            setLabels([]);
            setDataPoints([]);
            setBarColors([]);
        }
    }, [isRunning]);

    useEffect(() => {
        let lastUpdateTime = 0;

        const handleTelemetry = (data: string) => {
            if (!isRunning) return;

            const now = Date.now();
            // YENİ: Veri çekme hızı saniyede 10'dan 25'e (40ms) yükseltildi!
            // Grafikte çok daha sık, EKG gibi akan çubuklar göreceksin.
            if (now - lastUpdateTime < 40) return;
            lastUpdateTime = now;

            const cleanString = data.replace('<TEL,', '').replace('>', '');
            const values = cleanString.split(',');
            const rawRpm = parseFloat(values[0]);

            if (!isNaN(rawRpm)) {
                const absoluteRpm = Math.abs(rawRpm);
                const timeLabel = new Date().toLocaleTimeString('en-US', { minute: '2-digit', second: '2-digit', fractionalSecondDigits: 1 });

                const currentMode = useControllerStore.getState().operatingMode || 'continuous';
                const currentColor = MODE_COLORS[currentMode] || DEFAULT_COLOR;

                setLabels((prev) => {
                    const updated = [...prev, timeLabel];
                    return updated.length > MAX_POINTS ? updated.slice(updated.length - MAX_POINTS) : updated;
                });

                setDataPoints((prev) => {
                    const updated = [...prev, absoluteRpm];
                    return updated.length > MAX_POINTS ? updated.slice(updated.length - MAX_POINTS) : updated;
                });

                setBarColors((prev) => {
                    const updated = [...prev, currentColor];
                    return updated.length > MAX_POINTS ? updated.slice(updated.length - MAX_POINTS) : updated;
                });
            }
        };

        const handleClear = () => {
            setLabels([]);
            setDataPoints([]);
            setBarColors([]);
        };

        socket.on('telemetry_data', handleTelemetry);
        (socket as any).on('chart_clear', handleClear);

        return () => {
            socket.off('telemetry_data', handleTelemetry);
            (socket as any).off('chart_clear', handleClear);
        };
    }, [isRunning]);

    return (
        <Paper w="100%" radius="lg" withBorder className={`${classes.chartContainer} ${!isRunning ? classes.paused : ''}`}>
            <Text className={classes.title} c="dimmed" size="sm" mb="xs" ml="xs" fw={600} style={{ letterSpacing: '1px' }}>
                Motor Dynamics
            </Text>

            <div style={{ height: '140px', width: '100%' }}>
                <Bar
                    data={{
                        labels,
                        datasets: [
                            {
                                label: 'RPM',
                                data: dataPoints,
                                backgroundColor: barColors,
                                borderRadius: 4,
                                barPercentage: 0.9,
                                categoryPercentage: 0.85, // YENİ: Çubuklar arasına çok ince, şık bir boşluk eklendi
                            },
                        ],
                    }}
                    options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        animation: { duration: 0 },
                        layout: { padding: { top: 2, bottom: 0 } },
                        plugins: { legend: { display: false }, tooltip: { intersect: false, mode: 'index' } },
                        scales: {
                            x: {
                                display: false
                            },
                            y: {
                                min: 0,
                                max: dynamicYMax, // YENİ: Grafiğin yüksekliği artık gelen RPM'e göre otomatik zumlanıyor (Auto-Scale)!
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