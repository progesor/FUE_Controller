// packages/frontend/src/services/notificationService.tsx

import { notifications } from '@mantine/notifications';
import { IconCheck, IconInfoCircle, IconX } from '@tabler/icons-react';

/**
 * Başarı bildirimini gösterir.
 * @param message - Bildirimde gösterilecek mesaj.
 */
const showSuccess = (message: string) => {
    notifications.show({
        title: 'Başarılı',
        message,
        color: 'green',
        icon: <IconCheck size={18} />,
        withCloseButton: true,
        autoClose: 3000,
    });
};

/**
 * Hata veya uyarı bildirimini gösterir.
 * @param message - Bildirimde gösterilecek mesaj.
 */
const showError = (message: string) => {
    notifications.show({
        title: 'Uyarı',
        message,
        color: 'red',
        icon: <IconX size={18} />,
        withCloseButton: true,
        autoClose: 5000, // Hata mesajları daha uzun süre ekranda kalabilir
    });
};

/**
 * Bilgi amaçlı bildirim gösterir.
 * @param message - Bildirimde gösterilecek mesaj.
 */
const showInfo = (message: string) => {
    notifications.show({
        title: 'Bilgi',
        message,
        color: 'blue',
        icon: <IconInfoCircle size={18} />,
        withCloseButton: true,
        autoClose: 3000,
    });
};

// Fonksiyonları tek bir nesne altında export ederek daha temiz bir kullanım sağlıyoruz.
export const NotificationService = {
    showSuccess,
    showError,
    showInfo,
};
