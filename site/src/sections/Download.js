import React from 'react';
import { Box, Typography, Container, Grid, Card, CardContent, Button, Stack, Chip } from '@mui/material';
import { Download as DownloadIcon, OpenInNew } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useRelease, detectPlatform } from '../useRelease';

const platforms = [
  { key: 'windows', emoji: '🪟' },
  { key: 'macos', emoji: '🍎' },
  { key: 'macosArm', emoji: '🍎', labelKey: 'macosArm' },
  { key: 'linux', emoji: '🐧' },
];

export default function Download() {
  const { t } = useTranslation();
  const { version, assets, loading, releasePage } = useRelease();
  const currentPlatform = detectPlatform();

  return (
    <Box id="download" sx={{ py: { xs: 6, md: 10 }, bgcolor: 'background.paper' }}>
      <Container maxWidth="lg">
        <Typography variant="h3" align="center" gutterBottom sx={{ fontSize: { xs: '1.5rem', md: '2rem' } }}>
          {t('download.title')}
        </Typography>
        <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 1 }}>
          {t('download.subtitle')}
        </Typography>
        {version && (
          <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 4 }}>
            {t('download.version', { version })}
          </Typography>
        )}

        <Grid container spacing={3} justifyContent="center">
          {platforms.map(({ key, emoji, labelKey }) => {
            const asset = assets[key];
            const isCurrent = key === currentPlatform || (key === 'macosArm' && currentPlatform === 'macos');
            return (
              <Grid item xs={12} sm={6} md={3} key={key}>
                <Card variant="outlined" sx={{
                  textAlign: 'center', height: '100%',
                  transition: 'box-shadow 0.2s', '&:hover': { boxShadow: 4 },
                  borderColor: isCurrent ? 'primary.main' : undefined,
                  borderWidth: isCurrent ? 2 : 1,
                }}>
                  <CardContent sx={{ py: 4 }}>
                    <Typography sx={{ fontSize: 48, mb: 1 }}>{emoji}</Typography>
                    <Typography variant="h6" gutterBottom>
                      {t(`download.${labelKey || key}`)}
                    </Typography>
                    {isCurrent && !labelKey && (
                      <Chip label="Detected" size="small" color="primary" variant="outlined" sx={{ mb: 1 }} />
                    )}
                    {asset ? (
                      <>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                          {asset.name}
                        </Typography>
                        <Button variant={isCurrent ? 'contained' : 'outlined'} size="small"
                          startIcon={<DownloadIcon />}
                          href={asset.browser_download_url} target="_blank" rel="noopener">
                          {t('hero.download')}
                        </Button>
                      </>
                    ) : (
                      <Typography variant="caption" color="text.disabled">
                        {loading ? '...' : '—'}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 4 }}>
          <Button variant="outlined" size="large" startIcon={<OpenInNew />}
            href={releasePage} target="_blank" rel="noopener"
            sx={{ px: 4 }}>
            {t('download.allReleases')}
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}
