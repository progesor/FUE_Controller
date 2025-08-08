// packages/frontend/src/components/layout/LayoutSelector.tsx

import { Container, Grid, Paper, Text, Title, Stack } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import classes from './LayoutSelector.module.css';
import auraPreview from '../../assets/aura-preview.png';
import clinicalPreview from '../../assets/clinical-preview.png';
import devPreview from '../../assets/dev-preview.png';

const layouts = [
    { name: 'AURA Interface', path: '/aura', description: 'Yeni nesil, dokunmatik odaklı fütüristik klinik arayüz.', image: auraPreview },
    { name: 'Clinical Layout', path: '/clinical', description: 'Veri odaklı, profesyonel klinik operasyon ekranı.', image: clinicalPreview },
    { name: 'Developer Suite', path: '/dev', description: 'Geliştirme, test ve kalibrasyon için mühendislik paneli.', image: devPreview },
];

export function LayoutSelector() {
    const navigate = useNavigate();

    const handleSelect = (path: string) => {
        localStorage.setItem('preferredLayout', path);
        navigate(path);
    };

    return (
        <div className={classes.wrapper}>
            <Container size="lg" py="xl">
                <Stack align="center" mb="xl">
                    <Title order={1} className={classes.title}>Arayüz Seçimi</Title>
                    <Text c="dimmed" size="lg">Lütfen kullanmak istediğiniz arayüzü seçin.</Text>
                </Stack>
                <Grid gutter="xl">
                    {layouts.map((layout) => (
                        <Grid.Col span={{ base: 12, md: 4 }} key={layout.name}>
                            <Paper
                                withBorder
                                radius="md"
                                className={classes.card}
                                onClick={() => handleSelect(layout.path)}
                                // DEĞİŞİKLİK: Resim, style prop'u ile arka plan olarak atanıyor
                                style={{ backgroundImage: `url(${layout.image})` }}
                            >
                                {/* <img> etiketi artık burada değil */}
                                <div className={classes.cardOverlay} />
                                <div className={classes.cardContent}>
                                    <Title order={3}>{layout.name}</Title>
                                    <Text size="sm" mt="sm">{layout.description}</Text>
                                </div>
                            </Paper>
                        </Grid.Col>
                    ))}
                </Grid>
            </Container>
        </div>
    );
}