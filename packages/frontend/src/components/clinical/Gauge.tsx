// packages/frontend/src/components/clinical/Gauge.tsx

import {Box, Group, ActionIcon, Stack} from '@mantine/core';
import classes from './Gauge.module.css';
import { IconPlus, IconMinus } from '@tabler/icons-react';
import React, { useRef, useState, useEffect } from 'react';
import arcImage from '../../assets/clinical/gauge-arc.png';
import backgroundImage from '../../assets/clinical/gauge-background.png';
import RcSlider from 'rc-slider';
import 'rc-slider/assets/index.css';

const CONFIG = {
    SIZE: 300,
    NORMAL_ANGLE_START: 102,
    NORMAL_ANGLE_END: 424,
    MIRRORED_ANGLE_START: -102,
    MIRRORED_ANGLE_END: -424,
    NORMAL_MASK_START: 179,
    NORMAL_MASK_END: 90,
    MIRRORED_MASK_START: -90,
    MIRRORED_MASK_END: -179,
};

const describeArcForMask = (x: number, y: number, radius: number, startAngle: number, endAngle: number): string => {
    const startRad = (startAngle - 90) * Math.PI / 180;
    const endRad = (endAngle - 90) * Math.PI / 180;
    const start = { x: x + radius * Math.cos(startRad), y: y + radius * Math.sin(startRad) };
    const end = { x: x + radius * Math.cos(endRad), y: y + radius * Math.sin(endRad) };
    const angleDiff = (endAngle - startAngle + 360) % 360;
    const largeArcFlag = angleDiff <= 180 ? "0" : "1";
    return `M ${x},${y} L ${start.x},${start.y} A ${radius},${radius} 0 ${largeArcFlag} 1 ${end.x},${end.y} Z`;
};


interface GaugeProps {
    value: number;
    minValue?: number;
    maxValue: number;
    label: string;
    subLabel?: string;
    mirror?: boolean;
    onIncrement?: () => void;
    onDecrement?: () => void;
    onChange?: (newValue: number) => void;
    onSliderChange?: (value: number) => void;
}

export function Gauge({ value, minValue = 0, maxValue, label, subLabel, mirror = false, onIncrement, onDecrement, onChange, onSliderChange }: GaugeProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isDraggingGauge] = useState(false);
    const [displayValue, setDisplayValue] = useState(value);
    const lastY = useRef(0);

    const [sliderLiveValue, setSliderLiveValue] = useState(value);

    useEffect(() => {
        if (!isDraggingGauge) {
            setDisplayValue(value);
        }
        // Slider'ın da anlık değeri, sürükleme olmadığında ana değerle güncellenmeli
        setSliderLiveValue(value);
    }, [value, isDraggingGauge]);

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => { if (onChange) { setIsDragging(true); lastY.current = e.clientY; } };
    const handleMouseUp = () => { if (isDragging && onChange) { setIsDragging(false); onChange(displayValue); } };
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isDragging || !onChange) return;
        const deltaY = lastY.current - e.clientY;
        lastY.current = e.clientY;
        const sensitivity = maxValue / 300;
        setDisplayValue(prev => Math.min(maxValue, Math.max(minValue, prev + (deltaY * sensitivity))));
    };

    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        if (onChange) {
            setIsDragging(true);
            lastY.current = e.touches[0].clientY;
        }
    };

    const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
        if (!isDragging || !onChange) return;
        const touchY = e.touches[0].clientY;
        const deltaY = lastY.current - touchY;
        lastY.current = touchY;
        const sensitivity = maxValue / 300;
        setDisplayValue(prev => Math.min(maxValue, Math.max(minValue, prev + (deltaY * sensitivity))));
        e.preventDefault();
    };

    const handleTouchEnd = () => {
        if (isDragging && onChange) {
            setIsDragging(false);
            onChange(displayValue);
        }
    };

    const valueRatio = Math.min(1, Math.max(0, (displayValue - minValue) / (maxValue - minValue)));
    const angleStart = mirror ? CONFIG.MIRRORED_ANGLE_START : CONFIG.NORMAL_ANGLE_START;
    const angleEnd = mirror ? CONFIG.MIRRORED_ANGLE_END : CONFIG.NORMAL_ANGLE_END;
    const rotationAngle = angleStart + (valueRatio * (angleEnd - angleStart));
    const scale = mirror ? 'scaleX(-1)' : '';
    const maskPath = describeArcForMask(CONFIG.SIZE / 2, CONFIG.SIZE / 2, CONFIG.SIZE / 2, mirror ? CONFIG.MIRRORED_MASK_START : CONFIG.NORMAL_MASK_START, mirror ? CONFIG.MIRRORED_MASK_END : CONFIG.NORMAL_MASK_END);

    const sliderComponent = onSliderChange && (
        <div className={classes.sliderContainer}>
            <RcSlider
                vertical
                min={minValue}
                max={maxValue}
                value={sliderLiveValue}
                onChange={(val) => {
                    if (typeof val === 'number') {
                        setSliderLiveValue(val);
                    }
                }}
                // DEĞİŞİKLİK: onAfterChange, nihai değeri ana bileşene gönderir
                onChangeComplete={(val) => {
                    if (typeof val === 'number') {
                        onSliderChange(val);
                    }
                }}
                className={classes.slider}
            />
        </div>
    );


    return (
        <Group align="flex-start" gap="xs" wrap="nowrap">
            {!mirror && sliderComponent}
            <Stack align="center" gap="xs">
                <Box
                    className={classes.wrapper}
                    w={CONFIG.SIZE}
                    h={CONFIG.SIZE}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onTouchCancel={handleTouchEnd}
                >
                    <svg width={CONFIG.SIZE} height={CONFIG.SIZE} viewBox={`0 0 ${CONFIG.SIZE} ${CONFIG.SIZE}`}>
                        <defs>
                            <clipPath id={`gaugeMask-${label}`}>
                                <path d={maskPath} />
                            </clipPath>
                        </defs>
                        <g style={{ transform: scale, transformOrigin: 'center center' }}>
                            <image href={backgroundImage} width={CONFIG.SIZE} height={CONFIG.SIZE} />
                        </g>
                        <g clipPath={`url(#gaugeMask-${label})`}>
                            <g
                                className={classes.arcContainer}
                                style={{
                                    transform: `rotate(${rotationAngle}deg) ${scale}`,
                                    opacity: value <= minValue ? 0 : 1,
                                }}
                            >
                                <image href={arcImage} width={CONFIG.SIZE} height={CONFIG.SIZE} />
                            </g>
                        </g>
                        <g className={classes.textGroup}>
                            <text x="50%" y="60%" dy="-0.5em" textAnchor="middle" className={classes.valueText}>
                                {Math.round(displayValue)}
                            </text>
                            {subLabel && (
                                <text x="50%" y="62%" textAnchor="middle" className={classes.subLabelText}>
                                    {subLabel}
                                </text>
                            )}
                            <text x="50%" y="85%" textAnchor="middle" className={classes.labelText}>
                                {label}
                            </text>
                        </g>
                    </svg>
                </Box>
                {(onIncrement || onDecrement) && (
                    <Group className={classes.buttonContainer} gap="xl">
                        <ActionIcon size="64" variant="outline" onClick={onDecrement} className={classes.stepButton}>
                            <IconMinus size={24} />
                        </ActionIcon>
                        <ActionIcon size="64" variant="outline" onClick={onIncrement} className={classes.stepButton}>
                            <IconPlus size={24} />
                        </ActionIcon>
                    </Group>
                )}
            </Stack>
            {mirror && sliderComponent}
        </Group>
    );
}