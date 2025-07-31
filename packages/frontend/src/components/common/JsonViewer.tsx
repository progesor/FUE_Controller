// packages/frontend/src/components/common/JsonViewer.tsx

import { useState } from 'react';
import { Box, Text, UnstyledButton, Group } from '@mantine/core'; // Group import edildi
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';

interface JsonViewerProps {
    data: object;
    isRoot?: boolean; // Kök nesne olup olmadığını belirtmek için
}

/**
 * JSON nesnelerini okunabilir, renklendirilmiş ve katlanabilir bir ağaç
 * yapısında görüntüleyen bir React bileşeni.
 * @param {object} data - Görüntülenecek JSON nesnesi.
 * @param {boolean} isRoot - Kök nesne ise, başlangıçta kapalı gelir.
 * @returns {JSX.Element}
 */
export function JsonViewer({ data, isRoot = false }: JsonViewerProps) {
    // Kök nesne ise başlangıçta kapalı, değilse açık gelsin.
    const [isExpanded, setExpanded] = useState(!isRoot);

    const toggleExpand = (e: React.MouseEvent) => {
        e.stopPropagation();
        setExpanded((prev) => !prev);
    };

    if (typeof data !== 'object' || data === null) {
        return <Text span>{JSON.stringify(data)}</Text>;
    }

    const isArray = Array.isArray(data);
    const entries = Object.entries(data);
    const bracketColor = isArray ? 'blue.4' : 'grape.3';

    return (
        <Box ml="md" style={{ fontFamily: 'monospace', fontSize: '11px' }}>
            <UnstyledButton onClick={toggleExpand}>
                <Group gap={4} align="center">
                    {isExpanded ? <IconChevronDown size={12} /> : <IconChevronRight size={12} />}
                    <Text span c={bracketColor} fz="xs">
                        {isArray ? '[' : '{'}
                    </Text>
                    {!isExpanded && (
                        <Text span c="dimmed" fz="xs">
                            ...
                        </Text>
                    )}
                    {!isExpanded && (
                        <Text span c={bracketColor} fz="xs">
                            {isArray ? ']' : '}'}
                        </Text>
                    )}
                </Group>
            </UnstyledButton>

            {isExpanded && (
                <Box pl="lg" style={{ borderLeft: '1px solid #373A40' }}>
                    {entries.map(([key, value]) => (
                        <Box key={key} py={1}>
                            <Text span c="yellow.6" fz="xs">
                                {!isArray && `"${key}": `}
                            </Text>
                            {typeof value === 'object' && value !== null ? (
                                <JsonViewer data={value} />
                            ) : (
                                <Text span c={typeof value === 'string' ? 'green.4' : 'cyan.4'} fz="xs">
                                    {JSON.stringify(value)}
                                </Text>
                            )}
                        </Box>
                    ))}
                    <Text span c={bracketColor} fz="xs">
                        {isArray ? ']' : '}'}
                    </Text>
                </Box>
            )}
        </Box>
    );
}