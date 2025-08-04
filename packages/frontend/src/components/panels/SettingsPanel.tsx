// packages/frontend/src/components/panels/SettingsPanel.tsx

import { Paper, Title, Stack, Button, Drawer, Group } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconListDetails } from '@tabler/icons-react';
import { useControllerStore } from '../../store/useControllerStore';
import { RecipeEditor } from '../recipe/RecipeEditor';
import { NotificationService } from '../../services/notificationService';
import type { Recipe } from '../../../../shared-types';
import { ManualSettings } from './settings/ManualSettings';

/**
 * Cihazın çalışma parametrelerinin yapılandırıldığı ana panel.
 * Manuel mod ayarlarını içerir ve Reçete Editörünü bir Drawer içinde açar.
 */
export function SettingsPanel() {
    // Drawer'ın açık/kapalı durumunu yönetmek için Mantine hook'u
    const [drawerOpened, { open: openDrawer, close: closeDrawer }] = useDisclosure(false);

    // Gerekli state ve action'ları store'dan alıyoruz
    const { activeRecipe, setActiveRecipe } = useControllerStore();

    /**
     * RecipeEditor'dan gelen "Kaydet" olayını yönetir.
     * @param recipe - RecipeEditor bileşeninde oluşturulan/düzenlenen reçete.
     */
    const handleSaveRecipe = (recipe: Recipe) => {
        // 1. Reçeteyi aktif reçete olarak state'e kaydet.
        setActiveRecipe(recipe);

        // 2. Kullanıcıyı bilgilendir.
        NotificationService.showSuccess(`'${recipe.name}' adlı reçete aktif olarak ayarlandı!`);

        // 3. Drawer'ı kapat.
        closeDrawer();

        console.log('Kaydedilen ve aktif edilen reçete:', recipe);
    };

    return (
        <>
            {/* Reçete Editörü için Drawer */}
            <Drawer
                opened={drawerOpened}
                onClose={closeDrawer}
                title="Reçete Editörü"
                position="right"
                size="xl" // Geniş bir alan sağlamak için
                overlayProps={{ backgroundOpacity: 0.5, blur: 4 }}
                withCloseButton
            >
                <RecipeEditor
                    // Düzenlemek için mevcut aktif reçeteyi gönderiyoruz.
                    // Eğer aktif reçete yoksa, editör kendi varsayılanını oluşturacak.
                    initialRecipe={activeRecipe}
                    onSave={handleSaveRecipe}
                    onCancel={closeDrawer} // İptal butonu için Drawer'ı kapatma fonksiyonu
                />
            </Drawer>

            {/* Ana Ayar Paneli */}
            <Paper withBorder p="md" h="100%">
                <Stack>
                    <Group justify="space-between" align="center">
                        <Title order={3}>Ayar Paneli</Title>
                        <Button
                            leftSection={<IconListDetails size={16} />}
                            variant="outline"
                            onClick={openDrawer} // Bu buton artık Drawer'ı açar
                        >
                            Reçeteleri Yönet
                        </Button>
                    </Group>

                    {/* Tabs yapısı kaldırıldı, sadece Manuel Ayarlar kaldı */}
                    <ManualSettings />
                </Stack>
            </Paper>
        </>
    );
}