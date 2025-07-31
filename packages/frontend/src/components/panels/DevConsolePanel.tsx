// packages/frontend/src/components/panels/DevConsolePanel.tsx

import { useEffect, useRef } from 'react';
import { Paper, Title, Stack, Code, ScrollArea, Text, Badge } from '@mantine/core';
import { useControllerStore } from '../../store/useControllerStore';
import type { ConsoleEntry } from '../../store/useControllerStore';

/**
 * Log girişinin kaynağına göre renk belirleyen yardımcı fonksiyon.
 * @param source - Log kaydının kaynağı ('frontend' veya 'backend').
 * @returns {string} Mantine renk adı.
 */
const getSourceColor = (source: ConsoleEntry['source']) => {
    return source === 'backend' ? 'grape' : 'blue';
};

/**
 * Geliştiriciler ve teknisyenler için ham veri akışını gösteren konsol paneli.
 * Backend'den gelen ve frontend'den giden tüm olayları canlı olarak listeler.
 * @returns {JSX.Element} Geliştirici konsolu paneli JSX'i.
 */
export function DevConsolePanel() {
    // Gerekli state'i (log kayıtlarını) merkezi store'dan alıyoruz.
    const consoleEntries = useControllerStore((state) => state.consoleEntries);

    // ScrollArea'yı otomatik olarak en alta kaydırmak için bir referans (ref) oluşturuyoruz.
    const viewport = useRef<HTMLDivElement>(null);

    // Bu useEffect, consoleEntries dizisi her değiştiğinde çalışır.
    useEffect(() => {
        // Viewport'u en alta kaydırarak en yeni log'un görünmesini sağlar.
        viewport.current?.scrollTo({ top: viewport.current.scrollHeight, behavior: 'smooth' });
    }, [consoleEntries]);

    return (
        // Paper bileşeni, konsol için çerçeve görevi görür.
        <Paper withBorder p="md" h="100%">
            <Stack h="100%">
                <Title order={3}>Geliştirici Konsolu</Title>

                {/* ScrollArea, içerik taştığında kaydırma çubuğu ekler. */}
                <ScrollArea h="100%" viewportRef={viewport}>
                    <Stack gap="xs">
                        {/* consoleEntries dizisindeki her bir log kaydı için bir satır oluştur. */}
                        {consoleEntries.map((entry) => (
                            <Paper withBorder p="xs" radius="sm" key={entry.id} shadow="xs">
                                <Stack gap={4}>
                                    <Text size="xs" c="dimmed">
                                        <Badge
                                            size="xs"
                                            variant="light"
                                            color={getSourceColor(entry.source)}
                                            mr={5}
                                        >
                                            {entry.source.toUpperCase()}
                                        </Badge>
                                        [{entry.timestamp}] - {entry.message}
                                    </Text>
                                    {/* Eğer log kaydında ek veri varsa, bunu formatlı bir şekilde göster. */}
                                    {entry.data && Object.keys(entry.data).length > 0 && (
                                        <Code block fz="xs">
                                            {JSON.stringify(entry.data, null, 2)}
                                        </Code>
                                    )}
                                </Stack>
                            </Paper>
                        ))}
                    </Stack>
                </ScrollArea>
            </Stack>
        </Paper>
    );
}