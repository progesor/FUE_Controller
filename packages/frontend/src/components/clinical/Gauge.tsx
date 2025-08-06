import { Box } from '@mantine/core';
import classes from './Gauge.module.css';

import arcImage from '../../assets/clinical/gauge-arc.png';
import backgroundImage from '../../assets/clinical/gauge-background.png';

// --- GÖSTERGE KONFİGÜRASYONU (Tüm ayarları buradan yapabilirsin) ---
const CONFIG = {
    SIZE: 300,

    // --- İbrenin Hareketi ---
    // `gauge-arc.png` dosyasındaki ibrenin YUKARI (0°) baktığını varsayar.
    // (CSS `rotate` standardı: 0° yukarı, 90° sağ, 180° aşağı)

    // Normal (Sağ) Gösterge Hareket Açıları
    NORMAL_ANGLE_START: 49,     // 0 değerinin açısı
    NORMAL_ANGLE_END: 424,      // 100% değerinin açısı

    // Simetrik (Sol) Gösterge Hareket Açıları
    MIRRORED_ANGLE_START: -102,   // 0 değerinin açısı
    MIRRORED_ANGLE_END: -424,    // 100% değerinin açısı

    // --- Maske (Görünür Bölge) ---
    // Normal (Sağ) Gösterge Maske Açıları
    NORMAL_MASK_START: 179,
    NORMAL_MASK_END: 90,

    // Simetrik (Sol) Gösterge Maske Açıları
    MIRRORED_MASK_START: -90,
    MIRRORED_MASK_END: -179,
};

// Bu yardımcı fonksiyon, maske için SVG <path> komutunu dinamik olarak oluşturur.
const describeArcForMask = (x: number, y: number, radius: number, startAngle: number, endAngle: number): string => {
    const startRad = (startAngle - 90) * Math.PI / 180;
    const endRad = (endAngle - 90) * Math.PI / 180;
    const start = { x: x + radius * Math.cos(startRad), y: y + radius * Math.sin(startRad) };
    const end = { x: x + radius * Math.cos(endRad), y: y + radius * Math.sin(endRad) };

    // endAngle negatif olabileceğinden, aralığı doğru hesaplamak için normalizasyon yapılır.
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
}

export function Gauge({ value, minValue = 0, maxValue, label, subLabel, mirror = false }: GaugeProps) {
    const viewBox = `0 0 ${CONFIG.SIZE} ${CONFIG.SIZE}`;
    const center = CONFIG.SIZE / 2;

    const valueRatio = Math.min(1, Math.max(0, (value - minValue) / (maxValue - minValue)));

    // `mirror` prop'una göre doğru parametre setini seçiyoruz
    const angleStart = mirror ? CONFIG.MIRRORED_ANGLE_START : CONFIG.NORMAL_ANGLE_START;
    const angleEnd = mirror ? CONFIG.MIRRORED_ANGLE_END : CONFIG.NORMAL_ANGLE_END;
    const maskStart = mirror ? CONFIG.MIRRORED_MASK_START : CONFIG.NORMAL_MASK_START;
    const maskEnd = mirror ? CONFIG.MIRRORED_MASK_END : CONFIG.NORMAL_MASK_END;

    const angleRange = angleEnd - angleStart;
    const rotationAngle = angleStart + (valueRatio * angleRange);
    const scale = mirror ? 'scaleX(-1)' : '';

    const maskPath = describeArcForMask(center, center, center, maskStart, maskEnd);

    return (
        <Box className={classes.wrapper} w={CONFIG.SIZE} h={CONFIG.SIZE}>
            <svg width={CONFIG.SIZE} height={CONFIG.SIZE} viewBox={viewBox}>
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
                        {Math.round(value)}
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
    );
}