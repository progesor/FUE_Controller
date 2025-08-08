// packages/frontend/src/components/aura/HolographicGauge.tsx

import { Box, Text } from '@mantine/core';
import classes from './HolographicGauge.module.css';
import cx from 'clsx';
import React, {useRef, useState, useEffect} from "react";

// Feedback fonksiyonu değişmeden kalıyor...
const playFeedback = (() => {
    let audioCtx: AudioContext | null | undefined;

    return () => {
        if (typeof window === 'undefined') return;
        if ('vibrate' in navigator) navigator.vibrate(10);
        try {
            if (audioCtx === undefined) {
                const w = window as unknown as { webkitAudioContext?: typeof AudioContext };
                const AudioContextClass = window.AudioContext || w.webkitAudioContext;
                audioCtx = AudioContextClass ? new AudioContextClass() : null;
            }
            if (!audioCtx) return;
            if (audioCtx.state === 'suspended') audioCtx.resume();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.value = 880;
            gain.gain.value = 0.05;
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.05);
        } catch {}
    };
})();


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
    // YENİ: Sürükleme sırasındaki anlık değeri tutacak yerel state
    const [displayValue, setDisplayValue] = useState(value);
    const lastY = useRef(0);

    // Ana 'value' prop'u (Zustand'dan gelen) değiştiğinde, yerel state'i de güncelle
    useEffect(() => {
        if (!isDragging) {
            setDisplayValue(value);
        }
    }, [value, isDragging]);


    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isInteractive || !onChange) return;
        setIsDragging(true);
        lastY.current = e.clientY;
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isDragging || !isInteractive || !onChange) return;

        const deltaY = lastY.current - e.clientY;
        lastY.current = e.clientY;

        // Sadece yerel 'displayValue' state'ini güncelle, onChange'i çağırma!
        setDisplayValue(prevValue => {
            const newValue = Math.min(maxValue, Math.max(0, prevValue + (deltaY * sensitivity)));
            const rounded = Math.round(newValue);
            if (rounded !== Math.round(prevValue)) {
                playFeedback();
            }
            return newValue;
        });
    };

    const handleMouseUp = () => {
        if (!isDragging || !onChange) return;
        setIsDragging(false);
        // Sürükleme bittiğinde, nihai değeri onChange prop'u ile yukarı bildir.
        onChange(displayValue);
    };

    // Klavye kontrolleri doğrudan nihai değeri gönderebilir
    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (!isInteractive || !onChange) return;

        let newValue = value;
        if (e.key === '+' || e.key === '=') {
            newValue = Math.min(maxValue, value + 50);
        } else if (e.key === '-' || e.key === '_') {
            newValue = Math.max(0, value - 50);
        } else {
            return;
        }

        if (newValue !== value) {
            e.preventDefault();
            onChange(newValue);
            playFeedback();
        }
    };

    const SIZE = 250;
    const STROKE_WIDTH = 10;
    const RADIUS = (SIZE - STROKE_WIDTH) / 2;
    const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
    // Gösterge artık anlık 'displayValue'yu kullanıyor
    const progress = Math.min(1, Math.max(0, displayValue / maxValue));
    const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

    return (
        <Box
            className={cx(classes.gaugeWrapper, {
                [classes.interactive]: isInteractive,
                [classes.dragging]: isDragging
            })}
            style={{ '--gauge-color': color } as React.CSSProperties}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
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
                {/* Değer olarak anlık 'displayValue' gösteriliyor */}
                <Text className={classes.gaugeValue}>{Math.round(displayValue)}</Text>
                <Text className={classes.gaugeUnit}>{unit}</Text>
                <Text className={classes.gaugeLabel}>{label}</Text>
            </Box>
        </Box>
    );
}