// packages/frontend/src/components/recipe/RecipeStepEditor.tsx

import { Paper, Group, Select, NumberInput, ActionIcon, Box, Text, Divider, Stack } from '@mantine/core';
import { IconArrowDown, IconArrowUp, IconTrash } from '@tabler/icons-react';
import type {
    RecipeStep,
    OperatingMode,
    AllModeSettings,
    ContinuousSettings,
    OscillationSettings, PulseSettings, VibrationSettings
} from '../../../../shared-types';
import { ContinuousSettingsEditor } from './ContinuousSettingsEditor';
import { OscillationSettingsEditor } from './OscillationSettingsEditor';
import { PulseSettingsEditor } from './PulseSettingsEditor';
import { VibrationSettingsEditor } from './VibrationSettingsEditor';

interface RecipeStepEditorProps {
    step: RecipeStep;
    index: number;
    totalSteps: number;
    onUpdate: (index: number, updatedStep: RecipeStep) => void;
    onDelete: (index: number) => void;
    onMove: (index: number, direction: 'up' | 'down') => void;
}

/**
 * Belirli bir moda ait ayar editörünü dinamik olarak render eder.
 */
const renderSettingsEditor = (
    step: RecipeStep,
    onSettingsChange: (newSettings: Partial<AllModeSettings>) => void
) => {
    switch (step.mode) {
        case 'continuous':
            return <ContinuousSettingsEditor settings={step.settings as ContinuousSettings} onChange={onSettingsChange} />;
        case 'oscillation':
            return <OscillationSettingsEditor settings={step.settings as OscillationSettings} onChange={onSettingsChange} />;
        case 'pulse':
            return <PulseSettingsEditor settings={step.settings as PulseSettings} onChange={onSettingsChange} />;
        case 'vibration':
            return <VibrationSettingsEditor settings={step.settings as VibrationSettings} onChange={onSettingsChange} />;
        default:
            return <Text c="dimmed" fz="sm">Bu mod için özel ayar bulunmamaktadır.</Text>;
    }
};

/**
 * Yeni seçilen mod için varsayılan ayarları döndürür.
 * Bu, store'daki başlangıç değerleriyle tutarlıdır.
 */
const getDefaultSettingsForMode = (mode: OperatingMode): Partial<AllModeSettings> => {
    switch (mode) {
        case 'continuous':
            return { rampDuration: 0 };
        case 'oscillation':
            return { angle: 180 };
        case 'pulse':
            return { pulseDuration: 100, pulseDelay: 500 };
        case 'vibration':
            return { intensity: 100, frequency: 5 };
        default:
            return {};
    }
};


export function RecipeStepEditor({ step, index, totalSteps, onUpdate, onDelete, onMove }: RecipeStepEditorProps) {

    // Adımın ana özelliklerini (mod, süre) günceller.
    const handleFieldChange = (
        field: 'mode' | 'duration',
        value: OperatingMode | number
    ) => {
        const updatedStep: RecipeStep = { ...step, [field]: value };

        // Eğer mod değiştirildiyse, o moda ait ayarları temiz bir başlangıç için sıfırla.
        if (field === 'mode') {
            // HATA BURADAYDI: Ayarları boş bir objeye ({}) ayarlamak, alt bileşenlerde
            // kontrollü/kontrolsüz bileşen hatasına yol açar (örn: NumberInput'a value={undefined} gitmesi).
            // DÜZELTME: Yeni mod için varsayılan ayarları yüklüyoruz.
            updatedStep.settings = getDefaultSettingsForMode(value as OperatingMode);
        }
        onUpdate(index, updatedStep);
    };

    // Alt ayar bileşenlerinden (örn: PulseSettingsEditor) gelen değişiklikleri yönetir.
    const handleSettingsChange = (newSettings: Partial<AllModeSettings>) => {
        const updatedStep = {
            ...step,
            settings: {
                ...step.settings,
                ...newSettings,
            },
        };
        onUpdate(index, updatedStep);
    };

    return (
        <Paper withBorder p="md" radius="sm" shadow="xs">
            <Stack gap="md">
                <Group justify="space-between">
                    <Text fw={700}>Adım #{index + 1}</Text>
                    <Group gap="xs">
                        <ActionIcon variant="default" onClick={() => onMove(index, 'up')} disabled={index === 0} title="Yukarı Taşı">
                            <IconArrowUp size={16} />
                        </ActionIcon>
                        <ActionIcon variant="default" onClick={() => onMove(index, 'down')} disabled={index === totalSteps - 1} title="Aşağı Taşı">
                            <IconArrowDown size={16} />
                        </ActionIcon>
                        <ActionIcon variant="filled" color="red" onClick={() => onDelete(index)} title="Adımı Sil">
                            <IconTrash size={16} />
                        </ActionIcon>
                    </Group>
                </Group>

                <Divider />

                <Group grow align="flex-start">
                    <Select
                        label="Çalışma Modu"
                        value={step.mode}
                        onChange={(value) => handleFieldChange('mode', value as OperatingMode)}
                        data={[
                            { value: 'continuous', label: 'Sürekli' },
                            { value: 'oscillation', label: 'Osilasyon' },
                            { value: 'pulse', label: 'Darbe' },
                            { value: 'vibration', label: 'Titreşim' },
                        ]}
                        required
                    />
                    <NumberInput
                        label="Adım Süresi (ms)"
                        value={step.duration}
                        onChange={(value) => handleFieldChange('duration', Number(value) || 0)}
                        min={100}
                        step={100}
                        required
                    />
                </Group>

                <Box mt="xs">
                    {/* Dinamik olarak doğru ayar bileşenini burada render ediyoruz */}
                    {renderSettingsEditor(step, handleSettingsChange)}
                </Box>
            </Stack>
        </Paper>
    );
}