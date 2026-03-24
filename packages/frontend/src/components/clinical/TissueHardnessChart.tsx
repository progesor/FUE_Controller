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

// Çizgi grafiği bileşenleri yerine BarElement'i kaydettik
ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

type Props = {
    isRunning: boolean;
    rpm?: number;
    oscillation?: number;
};

const MAX_POINTS = 40; // Çubuk grafikte sıkışıklık olmaması için ideal nokta sayısı

// Modlara Özel Renk Paleti (Mantine Tema Renklerine Uyumlu)
const MODE_COLORS: Record<string, string> = {
    continuous: 'rgba(51, 154, 240, 0.9)',     // Blue
    oscillation: 'rgba(204, 93, 232, 0.9)',    // Grape
    vibration: 'rgba(32, 201, 151, 0.9)',      // Teal
    pulse: 'rgba(255, 146, 43, 0.9)',          // Orange
    loop: 'rgba(255, 107, 107, 0.9)'           // Red
};
const DEFAULT_COLOR = 'rgba(0, 229, 255, 0.8)'; // Neon Cyan (Yedek)

export function TissueHardnessChart({ isRunning }: Props) {
    const [labels, setLabels] = useState<string[]>([]);
    const [dataPoints, setDataPoints] = useState<number[]>([]);
    const [barColors, setBarColors] = useState<string[]>([]); // YENİ: Her çubuğun rengini tutan hafıza

    // 1. Manuel başlatmalarda temizle
    useEffect(() => {
        if (isRunning) {
            setLabels([]);
            setDataPoints([]);
            setBarColors([]);
        }
    }, [isRunning]);

    // 2. Telemetri ve Sıfırlama Sinyallerini Dinle
    useEffect(() => {
        let lastUpdateTime = 0;

        const handleTelemetry = (data: string) => {
            if (!isRunning) return;

            // React'i boğmamak için saniyede maks 10 render (Throttle)
            const now = Date.now();
            if (now - lastUpdateTime < 100) return;
            lastUpdateTime = now;

            const cleanString = data.replace('<TEL,', '').replace('>', '');
            const values = cleanString.split(',');
            const rawRpm = parseFloat(values[0]);

            if (!isNaN(rawRpm)) {
                const absoluteRpm = Math.abs(rawRpm);
                const timeLabel = new Date().toLocaleTimeString('en-US', { minute: '2-digit', second: '2-digit' });

                // YENİ: Store'dan o anki aktif modu çek ve rengini belirle
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

                // YENİ: Rengi listeye ekle (Böylece mod değiştiğinde eski çubukların rengi değişmez)
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
        <Paper radius="lg" withBorder className={`${classes.chartContainer} ${!isRunning ? classes.paused : ''}`}>
            {/* Şık ve İngilizce Başlık */}
            <Text className={classes.title} c="dimmed" size="sm" mb="xs" ml="xs" fw={600} style={{ letterSpacing: '1px' }}>
                Motor Dynamics
            </Text>

            <div style={{ height: '140px' }}>
                <Bar
                    data={{
                        labels,
                        datasets: [
                            {
                                label: 'RPM',
                                data: dataPoints,
                                backgroundColor: barColors, // Renk dizisi buraya bağlandı
                                borderRadius: 4,          // Uçları hafif yuvarlak şık çubuklar
                                barPercentage: 0.8,
                                categoryPercentage: 0.9,
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
                                display: false // X yazıları gizli
                            },
                            y: {
                                min: 0,
                                suggestedMax: 5000,
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