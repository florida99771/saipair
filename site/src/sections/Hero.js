import React from 'react';
import { Box, Typography, Button, Container, Stack, Chip, Link } from '@mui/material';
import { Download, GitHub } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useRelease } from '../useRelease';

const platformLabels = { windows: 'Windows', macos: 'macOS', linux: 'Linux' };

export default function Hero() {
  const { t } = useTranslation();
  const { platform, version, downloadUrl, loading } = useRelease();

  return (
    <Box sx={{
      py: { xs: 8, md: 14 },
      background: (theme) => theme.palette.mode === 'dark'
        ? 'linear-gradient(135deg, #1E1B4B 0%, #0F172A 50%, #0C4A6E 100%)'
        : 'linear-gradient(135deg, #EEF2FF 0%, #F8F9FB 50%, #E0F2FE 100%)',
    }}>
      <Container maxWidth="md" sx={{ textAlign: 'center' }}>
        <Typography variant="h2" gutterBottom sx={{
          fontSize: { xs: '2rem', md: '3rem' },
          background: (theme) => theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, #818CF8, #38BDF8)'
            : 'linear-gradient(135deg, #6366F1, #0EA5E9)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          {t('hero.title')}
        </Typography>

        <Typography variant="h4" gutterBottom sx={{
          fontSize: { xs: '1.25rem', md: '1.75rem' },
          fontWeight: 600,
        }}>
          {t('hero.subtitle')}
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
          {t('hero.description')}
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center" alignItems="center">
          <Button variant="contained" size="large" startIcon={<Download />}
            href={downloadUrl} target="_blank" rel="noopener"
            disabled={loading}
            sx={{ px: 4, py: 1.5 }}>
            {t('download.downloadFor', { platform: platformLabels[platform] })}
          </Button>
          <Button variant="outlined" size="large" startIcon={<GitHub />}
            href="https://github.com/florida99771/saipair"
            target="_blank" rel="noopener"
            sx={{ px: 4, py: 1.5 }}>
            {t('hero.viewOnGithub')}
          </Button>
        </Stack>
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
          {version && (
            <Chip label={t('download.version', { version })} size="small" variant="outlined" />
          )}
          <Button size="small" onClick={() => document.getElementById('download')?.scrollIntoView({ behavior: 'smooth' })}
            sx={{ fontSize: '0.75rem' }}>
            {t('download.allPlatforms')}
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
