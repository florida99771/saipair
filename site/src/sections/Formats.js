import React from 'react';
import { Box, Typography, Container, Grid, Card, CardContent } from '@mui/material';
import { Shuffle, Loop, EmojiEvents, MilitaryTech } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const formats = [
  { key: 'swiss', icon: Shuffle },
  { key: 'roundRobin', icon: Loop },
  { key: 'elimination', icon: EmojiEvents },
  { key: 'doubleElim', icon: MilitaryTech },
];

export default function Formats() {
  const { t } = useTranslation();

  return (
    <Box id="formats" sx={{ py: { xs: 6, md: 10 }, bgcolor: 'background.paper' }}>
      <Container maxWidth="lg">
        <Typography variant="h3" align="center" gutterBottom sx={{ fontSize: { xs: '1.5rem', md: '2rem' } }}>
          {t('formats.title')}
        </Typography>
        <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 6 }}>
          {t('formats.subtitle')}
        </Typography>

        <Grid container spacing={3}>
          {formats.map(({ key, icon: Icon }) => (
            <Grid item xs={12} sm={6} md={3} key={key}>
              <Card variant="outlined" sx={{ height: '100%', textAlign: 'center', transition: 'box-shadow 0.2s', '&:hover': { boxShadow: 4 } }}>
                <CardContent sx={{ py: 4 }}>
                  <Icon color="primary" sx={{ fontSize: 48, mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    {t(`formats.${key}_title`)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t(`formats.${key}_desc`)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
