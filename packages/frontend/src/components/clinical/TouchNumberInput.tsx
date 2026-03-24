import { Group, ActionIcon, NumberInput, Text, Stack } from '@mantine/core';
import { IconMinus, IconPlus } from '@tabler/icons-react';

interface TouchNumberInputProps {
    label: string;
    value: number;
    onChange: (val: number) => void;
    min?: number;
    max?: number;
    step?: number;
}

export function TouchNumberInput({ label, value, onChange, min = 0, max = 100000, step = 100 }: TouchNumberInputProps) {
    const handleMinus = () => onChange(Math.max(min, value - step));
    const handlePlus = () => onChange(Math.min(max, value + step));

    return (
        <Stack gap={4}>
            <Text size="sm" fw={600} c="dimmed">{label}</Text>
            <Group wrap="nowrap" gap={0}>
                {/* DEVASA EKSİ BUTONU */}
                <ActionIcon
                    size="4rem"
                    variant="light"
                    color="blue"
                    onClick={handleMinus}
                    style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0, border: '1px solid rgba(0, 229, 255, 0.2)' }}
                >
                    <IconMinus size={32} />
                </ActionIcon>

                {/* MERKEZİ RAKAM ALANI (İstendiğinde tıklanıp klavye açılabilir) */}
                <NumberInput
                    hideControls
                    value={value}
                    onChange={(val) => onChange(Number(val) || 0)}
                    min={min}
                    max={max}
                    step={step}
                    size="xl"
                    styles={{
                        input: {
                            height: '4rem',
                            textAlign: 'center',
                            fontSize: '1.6rem',
                            borderRadius: 0,
                            fontWeight: 800,
                            borderLeft: 'none',
                            borderRight: 'none',
                            backgroundColor: 'rgba(0, 0, 0, 0.2)'
                        }
                    }}
                    style={{ flex: 1 }}
                />

                {/* DEVASA ARTI BUTONU */}
                <ActionIcon
                    size="4rem"
                    variant="light"
                    color="blue"
                    onClick={handlePlus}
                    style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0, border: '1px solid rgba(0, 229, 255, 0.2)' }}
                >
                    <IconPlus size={32} />
                </ActionIcon>
            </Group>
        </Stack>
    );
}