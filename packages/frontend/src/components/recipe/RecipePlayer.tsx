// packages/frontend/src/components/RecipePlayer.tsx

import {Box, Text, Progress, Group, Divider, Stack} from '@mantine/core';
import {useControllerStore} from "../../store/useControllerStore.ts";

/**
 * Çalışan bir reçetenin anlık durumunu ve ilerlemesini gösteren bileşen.
 */
export function RecipePlayer() {
    const { recipeStatus, activeRecipe } = useControllerStore();

    if (!recipeStatus.isRunning || !activeRecipe || recipeStatus.currentStepIndex === null) {
        return null; // Reçete çalışmıyorsa hiçbir şey gösterme
    }

    const { currentStepIndex, totalSteps, remainingTimeInStep } = recipeStatus;
    const currentStep = activeRecipe.steps[currentStepIndex];

    // --- KESİN ÇÖZÜM ---
    // currentStep'in, state güncellemeleri arasındaki anlık uyuşmazlıklar nedeniyle
    // undefined olma ihtimaline karşı bir güvenlik kontrolü ekliyoruz.
    if (!currentStep) {
        // Bu durum genellikle bir sonraki render'da düzelir. Çökmeyi engellemek için null dönüyoruz.
        return null;
    }

    // Mevcut adımın geçen süresini hesapla
    const stepProgress = ((currentStep.duration - remainingTimeInStep) / currentStep.duration) * 100;
    const overallProgress = ((currentStepIndex + 1) / totalSteps) * 100;

    return (
        <Box w="100%">
            <Text size="lg" c="dimmed" ta="center" mb="sm">REÇETE ÇALIŞIYOR</Text>
            <Divider mb="md" />
            <Stack gap="xs">
                <Group justify="space-between">
                    <Text fz="sm">Genel İlerleme:</Text>
                    <Text fz="sm" fw={700}>Adım {currentStepIndex + 1} / {totalSteps}</Text>
                </Group>
                <Progress value={overallProgress} size="lg" animated />

                <Group justify="space-between" mt="md">
                    <Text fz="sm">Mevcut Adım ({currentStep.mode}):</Text>
                    <Text fz="sm" fw={700}>Kalan Süre: {(remainingTimeInStep / 1000).toFixed(1)}sn</Text>
                </Group>
                <Progress value={stepProgress} size="lg" color="teal" animated />
            </Stack>
        </Box>
    );
}