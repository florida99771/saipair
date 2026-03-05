import { Component } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import i18n from '../i18n';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      const t = i18n.t.bind(i18n);
      return (
        <Box
          sx={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'background.default',
            gap: 2,
            p: 4,
          }}
        >
          <Typography sx={{ fontSize: 20, fontWeight: 700, color: 'text.primary' }}>
            {t('error.title')}
          </Typography>
          <Typography
            sx={{
              fontSize: 14,
              color: 'text.secondary',
              textAlign: 'center',
              maxWidth: 400,
              wordBreak: 'break-word',
            }}
          >
            {this.state.error?.message || t('error.unknown')}
          </Typography>
          <Button variant="contained" onClick={() => window.location.reload()}>
            {t('error.reload')}
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}
