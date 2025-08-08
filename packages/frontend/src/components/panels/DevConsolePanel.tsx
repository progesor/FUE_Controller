// packages/frontend/src/components/panels/DevConsolePanel.tsx

import {useEffect, useRef, useState} from 'react';
import {
    ScrollArea,
    Text,
    Badge,
    Box,
    UnstyledButton,
    Group,
    Checkbox,
    Button,
    Stack
} from '@mantine/core';
import { useControllerStore } from '../../store/useControllerStore';
// DÜZELTME: Gerekli tipleri store'dan import ediyoruz
import type { ConsoleEntry } from '../../store/useControllerStore';
import {JsonViewer} from "../common/JsonViewer.tsx";
import {IconCode, IconInfoCircle, IconTrash} from "@tabler/icons-react";
import {LogSummary} from "../common/LogSummary.tsx";
import type {DeviceStatus} from "../../../../shared-types";

const LogEntry = ({ entry }: { entry: ConsoleEntry }) => {
    const [viewMode, setViewMode] = useState<'summary' | 'raw'>('summary');

    // DÜZELTME: 'unknown' tipindeki veriyi güvenli bir şekilde kontrol edip yeni bir değişkene atıyoruz.
    // Bu, TypeScript'e verinin tipinin ne olduğunu net bir şekilde söyler.
    const getLogData = (): DeviceStatus | null => {
        if (Array.isArray(entry.data) && entry.data.length > 0 && typeof entry.data[0] === 'object' && entry.data[0] !== null) {
            // TypeScript'e bu nesnenin bir DeviceStatus olduğunu söylüyoruz.
            return entry.data[0] as DeviceStatus;
        }
        return null;
    };

    const logData = getLogData();
    const isStatusUpdate = entry.message.includes('device_status_update');

    return (
        <Box mb="sm">
            <Group justify="space-between">
                <Text size="xs" c="dimmed" component="div">
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
                {/* Artık sadece 'logData'nın varlığını kontrol etmek yeterli */}
                {logData && isStatusUpdate && (
                    <UnstyledButton onClick={() => setViewMode(viewMode === 'summary' ? 'raw' : 'summary')}>
                        {viewMode === 'summary' ? <IconCode size={16} color="gray" /> : <IconInfoCircle size={16} color="gray" />}
                    </UnstyledButton>
                )}
            </Group>

            {/* Artık 'logData'nın varlığını ve tipini bildiğimiz için güvenle kullanabiliriz */}
            {logData && isStatusUpdate && (
                viewMode === 'summary' ? (
                    <LogSummary data={logData} />
                ) : (
                    <Box mt={4}>
                        <JsonViewer data={logData}/>
                    </Box>
                )
            )}
        </Box>
    );
};

export function DevConsolePanel() {
    const { consoleEntries, consoleFilters, setConsoleFilter, clearConsoleEntries } = useControllerStore();
    const viewport = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (viewport.current) {
            viewport.current.scrollTo({ top: viewport.current.scrollHeight, behavior: 'smooth' });
        }
    }, [consoleEntries]);

    const filteredEntries = consoleEntries.filter(entry => {
        if (consoleFilters.hideStatusUpdates && entry.message.includes('device_status_update')) {
            return false;
        }
        return true;
    });

    return (
        <Stack h="100%" gap="md">
            <Group justify="space-between">
                <Checkbox
                    label="Status Güncellemelerini Gizle"
                    checked={consoleFilters.hideStatusUpdates}
                    onChange={(event) => setConsoleFilter('hideStatusUpdates', event.currentTarget.checked)}
                />
                <Button
                    leftSection={<IconTrash size={16} />}
                    variant="light"
                    color="red"
                    size="xs"
                    onClick={clearConsoleEntries}
                >
                    Temizle
                </Button>
            </Group>
            <ScrollArea viewportRef={viewport} style={{ flex: 1 }}>
                {filteredEntries.map((entry) => (
                    <LogEntry key={entry.id} entry={entry} />
                ))}
            </ScrollArea>
        </Stack>
    );
}