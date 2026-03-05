import React from 'react';
import { Box, Typography, Container, Paper } from '@mui/material';
import { PhotoLibrary } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

export default function Screenshots() {
  const { t } = useTranslation();

  return (
    <Box id="screenshots" sx={{ py: { xs: 6, md: 10 } }}>
      <Container maxWidth="lg">
        <Typography variant="h3" align="center" gutterBottom sx={{ fontSize: { xs: '1.5rem', md: '2rem' } }}>
          {t('screenshots.title')}
        </Typography>
        <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 6 }}>
          {t('screenshots.subtitle')}
        </Typography>

        <Paper variant="outlined" sx={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          py: 8, px: 4, borderRadius: 3, borderStyle: 'dashed',
        }}>
          <PhotoLibrary sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="body1" color="text.secondary">
            {t('screenshots.placeholder')}
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}
