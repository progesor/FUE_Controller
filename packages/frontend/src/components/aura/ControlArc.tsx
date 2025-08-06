// packages/frontend/src/components/aura/ControlArc.tsx (SVG TABANLI YENİ VERSİYON)

import { Box, Text } from '@mantine/core';
import classes from './ControlArc.module.css';
import cx from 'clsx';
import { IconInfinity, IconRepeat, IconListDetails, IconBook } from '@tabler/icons-react';
import {useControllerStore} from "../../store/useControllerStore.ts";
import type {OperatingMode} from "../../../../shared-types";
import {sendOperatingMode} from "../../services/socketService.ts";

const modes = [
    { id: 'continuous', label: 'Sürekli', icon: IconInfinity },
    { id: 'oscillation', label: 'Osilasyon', icon: IconRepeat },
    { id: 'protocols', label: 'Protokoller', icon: IconBook },
    { id: 'recipes', label: 'Reçetelerim', icon: IconListDetails },
];

// SVG ve Ark Geometri Ayarları
const SVG_WIDTH = 480;
const SVG_HEIGHT = 240;
const ARC_RADIUS = 210;
const ARC_CENTER_X = SVG_WIDTH / 2;
const ARC_CENTER_Y = SVG_HEIGHT - 5; // Arkın dikey merkezini biraz aşağı alıyoruz

export function ControlArc() {
    const { uiMode, setUiMode, setOperatingMode, toggleRecipeDrawer } = useControllerStore();

    const handleModeChange = (modeId: string) => {
        // Arayüzde seçili butonu her zaman güncelle
        setUiMode(modeId);

        if (modeId === 'continuous' || modeId === 'oscillation') {
            // Manuel modlarda, donanım modunu da güncelle ve paneli kapat
            const newOpMode = modeId as OperatingMode;
            setOperatingMode(newOpMode);
            sendOperatingMode(newOpMode);
            toggleRecipeDrawer(false);
        } else if (modeId === 'recipes') {
            // Reçetelerim modunda sadece paneli aç
            toggleRecipeDrawer(true);
        } else if (modeId === 'protocols') {
            // Protokoller modunda şimdilik sadece seçili hale getir, paneli kapat
            // TODO: Gelecekte kendi arayüzü açılacak
            toggleRecipeDrawer(false);
        }
    };

    const getButtonPosition = (index: number) => {
        const totalButtons = modes.length;
        const angleDeg = -150 + (index * 120) / (totalButtons - 1);
        const angleRad = angleDeg * (Math.PI / 180);
        const x = SVG_WIDTH / 2 + 210 * Math.cos(angleRad);
        const y = (SVG_HEIGHT - 5) + 210 * Math.sin(angleRad);
        return { x, y };
    };

    return (
        <Box className={classes.controlArcContainer}>
            <svg
                className={classes.arcSvg}
                width={SVG_WIDTH}
                height={SVG_HEIGHT}
                viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
            >
                <defs>
                    <filter id="arcGlow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="8" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Arkın kendisi (path olarak çiziliyor) */}
                <path
                    className={classes.arcPath}
                    d={`M ${ARC_CENTER_X - ARC_RADIUS},${ARC_CENTER_Y} A ${ARC_RADIUS},${ARC_RADIUS} 0 0 1 ${ARC_CENTER_X + ARC_RADIUS},${ARC_CENTER_Y}`}
                    strokeWidth="2"
                    fill="none"
                />

                {/* Butonlar (grup olarak çiziliyor) */}
                {modes.map((mode, index) => {
                    const { x, y } = getButtonPosition(index);
                    const Icon = mode.icon;

                    return (
                        <g
                            key={mode.id}
                            transform={`translate(${x}, ${y})`}
                            className={classes.arcButton}
                            onClick={() => handleModeChange(mode.id)}
                        >
                            {/* Aktif butonu belirlemek için artık 'uiMode' kullanılıyor */}
                            <circle
                                r="22"
                                className={cx(classes.buttonCircle, { [classes.buttonActive]: uiMode === mode.id })}
                            />
                            <Icon
                                size={24}
                                className={cx(classes.buttonIcon, { [classes.buttonActive]: uiMode === mode.id })}
                                x="-12" y="-12"
                            />
                        </g>
                    );
                })}
            </svg>
            <Text className={classes.activeModeLabel}>
                {/* Etiket için de 'uiMode' kullanılıyor */}
                {modes.find(m => m.id === uiMode)?.label || ''}
            </Text>
        </Box>
    );
}