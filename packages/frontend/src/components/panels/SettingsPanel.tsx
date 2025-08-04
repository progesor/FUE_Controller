// packages/frontend/src/components/panels/SettingsPanel.tsx

import { Paper, Title, Stack, Tabs } from '@mantine/core';
import { IconSettings, IconListDetails } from '@tabler/icons-react'; // <-- YENİ: İkonları import et
import { useControllerStore } from '../../store/useControllerStore';
import { RecipeEditor } from '../recipe/RecipeEditor'; // <-- YENİ: RecipeEditor'ı import et
import { NotificationService } from '../../services/notificationService'; // <-- YENİ: Bildirim servisini import et
import type { Recipe } from '../../../../shared-types'; // <-- YENİ: Recipe tipini import et
import { ManualSettings } from './settings/ManualSettings'; // <-- YENİ: Manuel ayarları ayrı bir bileşene taşıyacağız

/**
 * Cihazın çalışma parametrelerinin yapılandırıldığı ana panel.
 * Manuel mod ayarlarını ve Reçete Editörünü içerir.
 */
export function SettingsPanel() {
    // setActiveRecipe eylemini store'dan alıyoruz
    const { setActiveRecipe } = useControllerStore();

    /**
     * RecipeEditor'dan gelen "Kaydet" olayını yönetir.
     * @param recipe - RecipeEditor bileşeninde oluşturulan reçete nesnesi.
     */
    const handleSaveRecipe = (recipe: Recipe) => {
        // 1. Oluşturulan reçeteyi aktif reçete olarak state'e kaydet.
        setActiveRecipe(recipe);

        // 2. Kullanıcıyı bilgilendir.
        NotificationService.showSuccess(`'${recipe.name}' adlı reçete aktif olarak ayarlandı!`);

        // 3. Gelecekte bu reçete burada localStorage'a veya backend'e kaydedilebilir.
        console.log('Kaydedilen ve aktif edilen reçete:', recipe);
    };

    return (
        <Paper withBorder p="md" h="100%" style={{ display: 'flex', flexDirection: 'column' }}>
            <Stack style={{ flex: 1 }}>
                <Title order={3} mb="md">Ayar Paneli</Title>

                <Tabs defaultValue="manual" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Tabs.List grow>
                        <Tabs.Tab value="manual" leftSection={<IconSettings size={16} />}>
                            Manuel Ayarlar
                        </Tabs.Tab>
                        <Tabs.Tab value="recipe" leftSection={<IconListDetails size={16} />}>
                            Reçete Editörü
                        </Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="manual" pt="xs" style={{ flex: 1, overflow: 'auto' }}>
                        {/* Mevcut ayar slider'larını buraya taşıyacağız */}
                        <ManualSettings />
                    </Tabs.Panel>

                    <Tabs.Panel value="recipe" pt="xs" style={{ flex: 1, overflow: 'auto' }}>
                        <RecipeEditor onSave={handleSaveRecipe} />
                    </Tabs.Panel>
                </Tabs>
            </Stack>
        </Paper>
    );
}