import React from 'react';
import { Box, Typography, Container, Button, Stack } from '@mui/material';
import { GitHub, BugReport, Forum } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

export default function OpenSource() {
  const { t } = useTranslation();

  return (
    <Box id="openSource" sx={{ py: { xs: 6, md: 10 } }}>
      <Container maxWidth="md" sx={{ textAlign: 'center' }}>
        <Typography variant="h3" gutterBottom sx={{ fontSize: { xs: '1.5rem', md: '2rem' } }}>
          {t('openSource.title')}
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom sx={{ mb: 1 }}>
          {t('openSource.subtitle')}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
          {t('openSource.description')}
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
          <Button variant="contained" startIcon={<GitHub />}
            href="https://github.com/florida99771/saipair"
            target="_blank" rel="noopener">
            {t('openSource.github')}
          </Button>
          <Button variant="outlined" startIcon={<BugReport />}
            href="https://github.com/florida99771/saipair/issues"
            target="_blank" rel="noopener">
            {t('openSource.issues')}
          </Button>
          <Button variant="outlined" startIcon={<Forum />}
            href="https://github.com/florida99771/saipair/discussions"
            target="_blank" rel="noopener">
            {t('openSource.discussions')}
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}
