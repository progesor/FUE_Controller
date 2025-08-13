// packages/frontend/src/components/layout/LayoutSwitchButton.tsx

import { ActionIcon, Tooltip } from '@mantine/core';
import { IconLayoutDashboard } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';

export function LayoutSwitchButton() {
    const navigate = useNavigate();

    const handleSwitch = () => {
        localStorage.removeItem('preferredLayout');
        navigate('/');
    };

    return (
        <Tooltip label="Arayüz Seçimine Dön" position="left" withArrow>
            <ActionIcon
                variant="filled"
                size="lg"
                onClick={handleSwitch}
                style={{
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    zIndex: 1000,
                    backgroundColor: 'rgba(0, 229, 255, 0.5)',
                    backdropFilter: 'blur(5px)',
                }}
            >
                <IconLayoutDashboard size={24} />
            </ActionIcon>
        </Tooltip>
    );
}