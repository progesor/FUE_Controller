// packages/frontend/src/components/panels/DevConsolePanel.tsx

import {useEffect, useRef, useState} from 'react';
import {Paper, Title, ScrollArea, Text, Badge, Box, UnstyledButton, Group} from '@mantine/core';
import { useControllerStore } from '../../store/useControllerStore';
import type { ConsoleEntry } from '../../store/useControllerStore';
import {JsonViewer} from "../common/JsonViewer.tsx";
import {IconCode, IconInfoCircle} from "@tabler/icons-react";
import {LogSummary} from "../common/LogSummary.tsx";

const LogEntry = ({ entry }: { entry: ConsoleEntry }) => {
    const [viewMode, setViewMode] = useState<'summary' | 'raw'>('summary');

    const isDataAvailable = entry.data && entry.data[0] && Object.keys(entry.data[0]).length > 0;
    const isStatusUpdate = entry.message.includes('device_status_update');

    return (
        <Box mb="sm">
            <Group justify="space-between">
                <Text size="xs" c="dimmed">
                    <Badge
                        size="xs"
                        variant="light"
                        color={entry.source === 'backend' ? 'grape' : 'blue'}
                        mr={5}
                    >
                        {entry.source.toUpperCase()}
                    </Badge>
                    [{entry.timestamp}] - {entry.message}
                </Text>

                {/* Sadece status_update olaylarında mod değiştirme butonu göster */}
                {isStatusUpdate && (
                    <UnstyledButton onClick={() => setViewMode(viewMode === 'summary' ? 'raw' : 'summary')}>
                        {viewMode === 'summary' ?
                            <IconCode size={16} color="gray" /> :
                            <IconInfoCircle size={16} color="gray" />}
                    </UnstyledButton>
                )}
            </Group>

            {isDataAvailable && isStatusUpdate && (
                viewMode === 'summary' ? (
                    <LogSummary data={entry.data[0]} />
                ) : (
                    <Box mt={4}>
                        <JsonViewer data={entry.data[0]}/>
                    </Box>
                )
            )}
        </Box>
    );
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
                {consoleEntries.map((entry) => (
                    <LogEntry key={entry.id} entry={entry} />
                ))}
            </ScrollArea>
        </Paper>
    );
}