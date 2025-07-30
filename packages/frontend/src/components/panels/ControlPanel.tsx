// packages/frontend/src/components/panels/ControlPanel.tsx

import { Paper, Title, Stack, Text, SegmentedControl, Center, Box, Slider, Button } from '@mantine/core';
import { IconArrowBackUp, IconArrowForwardUp, IconPlayerPlay, IconPlayerStop } from '@tabler/icons-react';
import { useControllerStore } from '../../store/useControllerStore';
import {
    sendMotorPwm,
    sendStopMotor,
    sendMotorDirection,
    sendStartMotor,
    sendStartOscillation,
    sendOperatingMode
} from '../../services/socketService';
import { RPM_CALIBRATION_MARKS } from '../../config/calibration';
import type { MotorDirection, OperatingMode } from "../../../../shared-types";

/**
 * Verilen anlık PWM değerine en yakın kalibre edilmiş RPM değerini bulur.
 * Bu, arayüzde kullanıcıya ham PWM değeri yerine anlamlı bir RPM değeri
 * göstermek için kullanılır.
 * @param pwm - 0 ile 255 arasında bir PWM değeri.
 * @returns {number} `RPM_CALIBRATION_MARKS` dizisindeki en yakın RPM değeri.
 */
const pwmToClosestRpm = (pwm: number): number => {
    // `reduce` metodu ile kalibrasyon dizisindeki her bir adımı
    // mevcut pwm değerine olan yakınlığına göre karşılaştırır ve en yakın olanı bulur.
    const closestMark = RPM_CALIBRATION_MARKS.reduce((prev, curr) =>
        Math.abs(curr.pwm - pwm) < Math.abs(prev.pwm - pwm) ? curr : prev
    );
    return closestMark.rpm;
};

/**
 * Kullanıcının motoru doğrudan yönetmesini sağlayan ana kontrol paneli bileşeni.
 * Hız, yön, çalışma modu ayarları ve motoru başlatma/durdurma işlevlerini içerir.
 * @returns {JSX.Element} Kontrol paneli JSX'i.
 */
export function ControlPanel() {
    // Gerekli durumları ve eylemleri merkezi store'dan alıyoruz.
    // Bu hook sayesinde store'daki veriler değiştikçe bu bileşen güncellenir.
    const { motor, operatingMode, oscillationSettings, setMotorStatus, setOperatingMode } = useControllerStore();

    /**
     * RPM slider'ı hareket ettirildiğinde tetiklenir.
     * @param markIndex - Slider üzerindeki seçilen kalibrasyon noktasının indeksi.
     */
    const handleSliderChange = (markIndex: number) => {
        const selectedMark = RPM_CALIBRATION_MARKS[markIndex];
        if (!selectedMark) return;

        // 1. İyimser Güncelleme (Optimistic Update): Arayüzün anında tepki vermesi
        //    için yerel state'i hemen güncelliyoruz.
        setMotorStatus({ pwm: selectedMark.pwm });

        // 2. Backend'e Bildirim: Değişikliği `socketService` aracılığıyla
        //    backend'e gönderiyoruz.
        sendMotorPwm(selectedMark.pwm);
    };

    /**
     * Dönüş yönü (CW/CCW) değiştirildiğinde tetiklenir.
     * @param direction - Yeni yön (0 veya 1).
     */
    const handleDirectionChange = (direction: MotorDirection) => {
        // Yön değişikliği komutunu backend'e gönder. State güncellemesi,
        // backend'den gelecek olan 'device_status_update' olayı ile yapılacak.
        sendMotorDirection(direction);
    };

    /**
     * Çalışma modu (Sürekli/Osilasyon) değiştirildiğinde tetiklenir.
     * @param mode - Yeni çalışma modu.
     */
    const handleModeChange = (mode: OperatingMode) => {
        // 1. İyimser Güncelleme: Arayüz modunu anında değiştir.
        setOperatingMode(mode);
        // 2. Backend'e Bildirim: Mod değişikliğini sunucuya ilet.
        sendOperatingMode(mode);
    };

    /**
     * BAŞLAT/DURDUR butonuna tıklandığında motorun durumunu değiştirir.
     */
    const toggleMotorActive = () => {
        if (motor.isActive) {
            // Eğer motor çalışıyorsa, durdurma komutu gönder.
            sendStopMotor();
        } else {
            // Eğer motor duruyorsa, mevcut çalışma moduna göre
            // uygun başlatma komutunu gönder.
            const currentRpm = pwmToClosestRpm(motor.pwm);
            if (operatingMode === 'continuous') {
                sendStartMotor();
            } else { // operatingMode === 'oscillation'
                sendStartOscillation({
                    pwm: motor.pwm,
                    angle: oscillationSettings.angle,
                    rpm: currentRpm
                });
            }
        }
    };

    /**
     * Mevcut PWM değerine en yakın kalibrasyon noktasının slider'daki
     * indeksini bulur. Bu, slider'ın doğru konumda başlamasını sağlar.
     * @param pwm - Mevcut PWM değeri.
     * @returns {number} Slider üzerindeki en yakın işaretin indeksi.
     */
    const findClosestMarkIndex = (pwm: number): number => {
        const closestMark = RPM_CALIBRATION_MARKS.reduce((prev, curr) =>
            Math.abs(curr.pwm - pwm) < Math.abs(prev.pwm - pwm) ? curr : prev
        );
        return RPM_CALIBRATION_MARKS.indexOf(closestMark);
    };

    const currentMarkIndex = findClosestMarkIndex(motor.pwm);

    return (
        <Paper withBorder p="md" h="100%">
            <Stack justify="space-between" h="100%">
                <Title order={3} mb="md">Kontrol Paneli</Title>

                <Stack gap="xl">
                    {/* Motor Hızı Slider'ı */}
                    <Stack gap="xs">
                        <Text fw={500}>Motor Hızı</Text>
                        <Text fz={32} fw={700}>{pwmToClosestRpm(motor.pwm)} RPM</Text>
                        <Slider
                            value={currentMarkIndex}
                            onChange={handleSliderChange}
                            min={0}
                            max={RPM_CALIBRATION_MARKS.length - 1}
                            step={1}
                            label={null} // Etiketi gizliyoruz, çünkü RPM yukarıda gösteriliyor
                            marks={RPM_CALIBRATION_MARKS.map((mark, index) => ({ value: index, label: `${mark.rpm}` }))}
                            mb={40} // `marks` etiketlerinin sığması için boşluk
                        />
                    </Stack>

                    {/* Dönüş Yönü Seçimi */}
                    <Stack gap="xs">
                        <Text fw={500}>Dönüş Yönü</Text>
                        <SegmentedControl
                            fullWidth
                            size="md"
                            value={motor.direction.toString()} // Değer string olmalı
                            onChange={(value) => handleDirectionChange(parseInt(value) as MotorDirection)}
                            data={[
                                { label: (<Center><IconArrowBackUp size={16} /><Box ml={10}>CCW</Box></Center>), value: '1' },
                                { label: (<Center><IconArrowForwardUp size={16} /><Box ml={10}>CW</Box></Center>), value: '0' },
                            ]}
                        />
                    </Stack>

                    {/* Çalışma Modu Seçimi */}
                    <Stack gap="xs">
                        <Text fw={500}>Çalışma Modu</Text>
                        <SegmentedControl
                            fullWidth
                            size="md"
                            value={operatingMode}
                            onChange={(value) => handleModeChange(value as OperatingMode)}
                            data={[
                                { label: 'Sürekli', value: 'continuous' },
                                { label: 'Osilasyon', value: 'oscillation' },
                            ]}
                        />
                    </Stack>
                </Stack>

                {/* Ana Başlat/Durdur Butonu */}
                <Button
                    fullWidth
                    size="lg"
                    color={motor.isActive ? 'red' : 'green'} // Duruma göre renk değiştir
                    leftSection={motor.isActive ? <IconPlayerStop /> : <IconPlayerPlay />} // Duruma göre ikon değiştir
                    onClick={toggleMotorActive}
                >
                    {motor.isActive ? 'DURDUR' : 'BAŞLAT'}
                </Button>
            </Stack>
        </Paper>
    );
}