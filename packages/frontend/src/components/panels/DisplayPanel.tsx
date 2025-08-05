// packages/frontend/src/components/panels/DisplayPanel.tsx

import { Paper, Text, Stack, Group, Button } from '@mantine/core';
import { useControllerStore } from '../../store/useControllerStore';
import {RPM_CALIBRATION_MARKS} from "../../config/calibration.ts";
import {RecipePlayer} from "../RecipePlayer.tsx";

// /**
//  * PWM değerini (0-255) daha anlamlı olan RPM (devir/dakika) değerine çevirir.
//  * Bu, kullanıcıya teknik bir değer yerine tanıdık bir birim göstermek içindir.
//  * @param pwm - 0 ile 255 arasında motorun anlık PWM değeri.
//  * @returns {number} Yaklaşık RPM karşılığı.
//  */
// const pwmToRpm = (pwm: number) => {
//     if (pwm === 0) return 0;
//     // Bu formül, maksimum PWM (255) değerinin yaklaşık 18000 RPM'e
//     // karşılık geldiği varsayımına dayanır. Gerçek değerler kalibrasyona
//     // göre değişebilir ancak bu, gösterge için yeterlidir.
//     return Math.round((pwm / 255) * 18000);
// };

/**
 * Verilen anlık PWM değerine en yakın kalibre edilmiş RPM değerini bulur.
 * Bu fonksiyon artık ControlPanel ile aynı mantığı kullanıyor.
 */
const pwmToClosestRpm = (pwm: number): number => {
    if (pwm === 0) return 0;
    const closestMark = RPM_CALIBRATION_MARKS.reduce((prev, curr) =>
        Math.abs(curr.pwm - pwm) < Math.abs(prev.pwm - pwm) ? curr : prev
    );
    return closestMark.rpm;
};

/**
 * Ana gösterge panelini oluşturan bileşen.
 * Motor hızı, greft sayısı ve seans süresi gibi en önemli verileri
 * büyük ve okunaklı bir şekilde kullanıcıya sunar.
 * @returns {JSX.Element} Gösterge paneli JSX'i.
 */
export function DisplayPanel() {
    // Gerekli tüm durumları ve eylemleri `useControllerStore` hook'u ile
    // merkezi state'ten alıyoruz. Bu hook sayesinde, bu değerler her
    // değiştiğinde bileşenimiz otomatik olarak güncellenir.
    const { motor, graftCount, sessionTime, incrementGraftCount, resetSession,recipeStatus  } = useControllerStore();

    /**
     * Toplam saniye olarak tutulan zamanı "DAKİKA:SANİYE" formatına çevirir.
     * @param timeInSeconds - Formatlanacak toplam saniye.
     * @returns {string} "02:35" gibi formatlanmış zaman dizesi.
     */
    const formatTime = (timeInSeconds: number) => {
        const minutes = Math.floor(timeInSeconds / 60).toString().padStart(2, '0');
        const seconds = (timeInSeconds % 60).toString().padStart(2, '0');
        return `${minutes}:${seconds}`;
    };

    return (
        <Paper withBorder p="xl" h="100%">
            <Stack align="center" justify="space-around" h="100%">
                {/* RPM Göstergesi Alanı (Aynı kalıyor) */}
                <Stack gap={0} align="center">
                    <Text size="xl" c="dimmed">MOTOR HIZI</Text>
                    <Text fz={80} fw={700} c={motor.isActive ? 'teal.4' : 'dimmed'}>
                        {pwmToClosestRpm(motor.pwm)}
                    </Text>
                    <Text size="xl" c="dimmed">RPM</Text>
                </Stack>

                {/* YENİ KOŞULLU GÖSTERİM */}
                {recipeStatus.isRunning ? (
                    // Eğer reçete çalışıyorsa, RecipePlayer'ı göster
                    <RecipePlayer />
                ) : (
                    // Değilse, normal Graft/Seans bilgilerini göster
                    <Group grow justify="center" w="100%">
                        <Stack gap={0} align="center">
                            <Text size="lg" c="dimmed">GREFT SAYISI</Text>
                            <Text fz={50} fw={600}>{graftCount}</Text>
                            <Button onClick={incrementGraftCount} size="xs" variant="outline">
                                MANUEL ARTIR
                            </Button>
                        </Stack>
                        <Stack gap={0} align="center">
                            <Text size="lg" c="dimmed">SEANS SÜRESİ</Text>
                            <Text fz={50} fw={600}>{formatTime(sessionTime)}</Text>
                            <Button onClick={resetSession} color="red" size="xs" variant="outline">
                                SIFIRLA
                            </Button>
                        </Stack>
                    </Group>
                )}
            </Stack>
        </Paper>
    );
}