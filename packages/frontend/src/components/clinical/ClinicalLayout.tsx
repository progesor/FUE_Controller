import { Box, Title } from '@mantine/core';

export function ClinicalLayout() {
    return (
        <Box
            style={{
                backgroundColor: '#000',
                color: '#fff',
                width: '100vw',
                height: '100vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
            }}
        >
            <Title>Klinik Arayüz Burada Olacak</Title>
        </Box>
    );
}