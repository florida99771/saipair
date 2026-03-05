import React from 'react';
import { Box, Typography, Container, Link, Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <Box component="footer" sx={{ py: 4, borderTop: 1, borderColor: 'divider' }}>
      <Container maxWidth="lg">
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={1}>
          <Typography variant="body2" color="text.secondary">
            {t('footer.copyright', { year: new Date().getFullYear() })}
          </Typography>
          <Stack direction="row" spacing={3}>
            <Link href="https://github.com/florida99771/saipair" target="_blank" rel="noopener"
              variant="body2" color="text.secondary" underline="hover">
              GitHub
            </Link>
            <Link href="https://github.com/florida99771/saipair/issues" target="_blank" rel="noopener"
              variant="body2" color="text.secondary" underline="hover">
              Issues
            </Link>
            <Link href="https://github.com/florida99771/saipair/discussions" target="_blank" rel="noopener"
              variant="body2" color="text.secondary" underline="hover">
              Discussions
            </Link>
          </Stack>
        </Stack>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
          {t('footer.madeWith')}
        </Typography>
      </Container>
    </Box>
  );
}
