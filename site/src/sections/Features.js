import React from 'react';
import { Box, Typography, Container, Grid, Card, CardContent } from '@mui/material';
import {
  ViewModule, AutoFixHigh, Leaderboard, WifiOff,
  ImportExport, Print, Translate, Code,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const featureIcons = [ViewModule, AutoFixHigh, Leaderboard, WifiOff, ImportExport, Print, Translate, Code];

export default function Features() {
  const { t } = useTranslation();

  return (
    <Box id="features" sx={{ py: { xs: 6, md: 10 } }}>
      <Container maxWidth="lg">
        <Typography variant="h3" align="center" gutterBottom sx={{ fontSize: { xs: '1.5rem', md: '2rem' } }}>
          {t('features.title')}
        </Typography>
        <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 6 }}>
          {t('features.subtitle')}
        </Typography>

        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => {
            const Icon = featureIcons[n - 1];
            return (
              <Grid item xs={12} sm={6} md={4} lg={3} key={n}>
                <Card variant="outlined" sx={{ height: '100%', transition: 'box-shadow 0.2s', '&:hover': { boxShadow: 4 } }}>
                  <CardContent>
                    <Icon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h6" gutterBottom>
                      {t(`features.f${n}_title`)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t(`features.f${n}_desc`)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Container>
    </Box>
  );
}
