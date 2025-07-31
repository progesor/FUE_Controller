// packages/frontend/src/components/panels/DevConsolePanel.tsx

import { useEffect, useRef } from 'react';
import { Paper, Title, Stack, ScrollArea, Text, Badge, Box } from '@mantine/core';
import { useControllerStore } from '../../store/useControllerStore';
import type { ConsoleEntry } from '../../store/useControllerStore';
import {JsonViewer} from "../common/JsonViewer.tsx";

const getSourceColor = (source: ConsoleEntry['source']) => {
    return source === 'backend' ? 'grape' : 'blue';
};

export function DevConsolePanel() {
    const consoleEntries = useControllerStore((state) => state.consoleEntries);
    const viewport = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (viewport.current) {
            viewport.current.scrollTo({ top: viewport.current.scrollHeight, behavior: 'smooth' });
        }
    }, [consoleEntries]);

    return (
        <Paper withBorder p="md" h="100%" style={{ display: 'flex', flexDirection: 'column' }}>
            <Title order={3}>Geliştirici Konsolu</Title>

            <ScrollArea viewportRef={viewport} mt="md" style={{ flex: 1 }}>
                <Stack gap="xs" pb="xs">
                    {consoleEntries.map((entry) => (
                        <Box key={entry.id} mb="xs">
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

                            {/* <Code> bloğunu yeni JsonViewer bileşeniyle değiştiriyoruz */}
                            {entry.data && entry.data[0] && Object.keys(entry.data[0]).length > 0 && (
                                <Box mt={4}>
                                    <JsonViewer data={entry.data[0]} isRoot />
                                </Box>
                            )}
                        </Box>
                    ))}
                </Stack>
            </ScrollArea>
        </Paper>
    );
}