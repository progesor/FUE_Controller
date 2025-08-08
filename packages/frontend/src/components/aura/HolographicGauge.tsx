// packages/frontend/src/components/aura/HolographicGauge.tsx

import {ActionIcon, Box, Stack, Text} from '@mantine/core';
import classes from './HolographicGauge.module.css';
import cx from 'clsx';
import React, {useRef, useState, useEffect} from "react";
import { IconPlus, IconMinus } from '@tabler/icons-react';

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

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
        x: centerX + radius * Math.cos(angleInRadians),
        y: centerY + radius * Math.sin(angleInRadians),
    };
}

function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number) {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
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
    mirror?: boolean;
    onIncrement?: () => void;
    onDecrement?: () => void;
}

export function HolographicGauge({ value, maxValue, label, unit, color, isInteractive = false, onChange, sensitivity = 2, mirror = false, onIncrement, onDecrement }: HolographicGaugeProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [displayValue, setDisplayValue] = useState(value);
    const lastY = useRef(0);

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

        // Yukarı sürükleme her zaman pozitif bir deltaY üretir.
        const deltaY = lastY.current - e.clientY;
        lastY.current = e.clientY;

        // KESİN DÜZELTME: Ayna modu için özel bir mantığa gerek YOKTUR.
        // Fare hareketi viewport'a göredir ve her iki gösterge için de aynı şekilde çalışmalıdır.
        const effectiveDelta = deltaY;

        setDisplayValue(prevValue => {
            const newValue = Math.min(maxValue, Math.max(0, prevValue + (effectiveDelta * sensitivity)));
            const rounded = Math.round(newValue);
            if (rounded !== Math.round(prevValue)) playFeedback();
            return newValue;
        });
    };

    const handleMouseUp = () => {
        if (!isDragging || !onChange) return;
        setIsDragging(false);
        onChange(displayValue);
    };

    const handleStepChange = (direction: 'up' | 'down') => {
        if (direction === 'up' && onIncrement) {
            onIncrement();
        }
        if (direction === 'down' && onDecrement) {
            onDecrement();
        }
    };

    const getTransformStyle = () => {
        const transforms = [];
        if (mirror) {
            transforms.push('scaleX(-1)');
        }
        if (isDragging) {
            transforms.push('perspective(600px) translateZ(30px)');
        }
        return transforms.join(' ');
    };

    const SIZE = 250;
    const STROKE_WIDTH = 10;
    const RADIUS = (SIZE - STROKE_WIDTH) / 2;
    const START_ANGLE = -150;
    const END_ANGLE = -30;
    const ANGLE_RANGE = END_ANGLE - START_ANGLE;
    const progress = Math.min(1, Math.max(0, displayValue / maxValue));
    const currentAngle = START_ANGLE + progress * ANGLE_RANGE;
    const backgroundArcPath = describeArc(SIZE / 2, SIZE / 2, RADIUS, START_ANGLE, END_ANGLE);
    const progressArcPath = describeArc(SIZE / 2, SIZE / 2, RADIUS, START_ANGLE, currentAngle);

    return (
        <Box
            className={cx(classes.gaugeWrapper, {
                [classes.interactive]: isInteractive,
                [classes.dragging]: isDragging
            })}
            style={{
                '--gauge-color': color,
                transform: getTransformStyle()
            } as React.CSSProperties}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            {isInteractive && (
                <Stack className={cx(classes.buttonContainer)} gap="xl">
                    <ActionIcon variant="transparent" className={classes.stepButton} onClick={() => handleStepChange('up')}>
                        <IconPlus size={20} />
                    </ActionIcon>
                    <ActionIcon variant="transparent" className={classes.stepButton} onClick={() => handleStepChange('down')}>
                        <IconMinus size={20} />
                    </ActionIcon>
                </Stack>
            )}
            <svg
                width={SIZE}
                height={SIZE}
                viewBox={`0 0 ${SIZE} ${SIZE}`}
                className={classes.gaugeSvg}
            >
                <path
                    className={classes.gaugeBackground}
                    d={backgroundArcPath}
                    strokeWidth={STROKE_WIDTH}
                    fill="none"
                />
                <path
                    className={classes.gaugeProgress}
                    d={progressArcPath}
                    strokeWidth={STROKE_WIDTH}
                    fill="none"
                />
            </svg>
            <Box
                className={classes.gaugeTextContainer}
                style={{ transform: `translate(-50%, -50%) ${mirror ? 'scaleX(-1)' : ''}`}}
            >
                <Text className={classes.gaugeValue}>{Math.round(displayValue)}</Text>
                <Text className={classes.gaugeUnit}>{unit}</Text>
                <Text className={classes.gaugeLabel}>{label}</Text>
            </Box>
        </Box>
    );
}