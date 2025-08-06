// packages/frontend/src/components/aura/HolographicGauge.tsx (BRACKET'LER KALDIRILDI)

import { Box, Text } from '@mantine/core';
import classes from './HolographicGauge.module.css';
import cx from 'clsx';
import React, {useRef, useState} from "react";

// Küçük bir ses veya titreşim oluşturan geri bildirim fonksiyonu
function playFeedback() {
    if (typeof window === 'undefined') return;

    if ('vibrate' in navigator) {
        navigator.vibrate(10);
    }

    try {
        const w = window as unknown as { webkitAudioContext?: typeof AudioContext };
        const AudioCtx = window.AudioContext || w.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 880;
        gain.gain.value = 0.05;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
    } catch {
        // Tarayıcı ses oluşturmayı engelleyebilir; sessizce başarısız ol
    }
}

interface HolographicGaugeProps {
    value: number;
    maxValue: number;
    label: string;
    unit: string;
    color: string;
    isInteractive?: boolean;
    onChange?: (newValue: number) => void;
    sensitivity?: number;
}

export function HolographicGauge({ value, maxValue, label, unit, color, isInteractive = false, onChange, sensitivity = 2 }: HolographicGaugeProps) {
    const [isDragging, setIsDragging] = useState(false);
    const lastY = useRef(0);

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isInteractive || !onChange) return;
        setIsDragging(true);
        lastY.current = e.clientY;
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isDragging || !isInteractive || !onChange) return;

        const deltaY = lastY.current - e.clientY; // Yukarı sürükleme pozitif, aşağı negatif
        lastY.current = e.clientY;

        const newValue = Math.min(maxValue, Math.max(0, value + (deltaY * sensitivity)));
        const rounded = Math.round(newValue);

        if (rounded !== value) {
            onChange(rounded);
            playFeedback();
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (!isInteractive || !onChange) return;
        let newValue = value;
        if (e.key === '+' || e.key === '=') {
            newValue = Math.min(maxValue, value + 1);
        } else if (e.key === '-' || e.key === '_') {
            newValue = Math.max(0, value - 1);
        } else {
            return;
        }

        e.preventDefault();
        onChange(newValue);
        playFeedback();
    };

    const SIZE = 250;
    const STROKE_WIDTH = 10;
    const RADIUS = (SIZE - STROKE_WIDTH) / 2;
    const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
    const progress = Math.min(1, Math.max(0, value / maxValue));
    const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

    return (
        <Box
            className={cx(classes.gaugeWrapper, {
                [classes.interactive]: isInteractive,
                [classes.dragging]: isDragging // Sürükleme sırasında ek bir class
            })}
            style={{ '--gauge-color': color } as React.CSSProperties}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp} // Fare alandan çıkarsa da sürüklemeyi bitir
            tabIndex={isInteractive ? 0 : undefined}
            onKeyDown={handleKeyDown}
        >
            <svg
                width={SIZE}
                height={SIZE}
                viewBox={`0 0 ${SIZE} ${SIZE}`}
                className={classes.gaugeSvg}
            >
                <circle
                    className={classes.gaugeBackground}
                    cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} strokeWidth={STROKE_WIDTH}
                />
                <circle
                    className={classes.gaugeProgress}
                    cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} strokeWidth={STROKE_WIDTH}
                    strokeDasharray={CIRCUMFERENCE}
                    strokeDashoffset={strokeDashoffset}
                />
            </svg>
            <Box className={classes.gaugeTextContainer}>
                <Text className={classes.gaugeValue}>{Math.round(value)}</Text>
                <Text className={classes.gaugeUnit}>{unit}</Text>
                <Text className={classes.gaugeLabel}>{label}</Text>
            </Box>
        </Box>
    );
}