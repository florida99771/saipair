import { createTheme } from '@mui/material/styles';

const shared = {
  typography: {
    fontFamily: [
      '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"',
      '"Noto Sans SC"', 'sans-serif',
    ].join(','),
    h2: { fontWeight: 700, fontSize: '2.5rem' },
    h3: { fontWeight: 700, fontSize: '2rem' },
    h4: { fontWeight: 700, fontSize: '1.5rem' },
    h5: { fontWeight: 700, fontSize: '1.25rem' },
    h6: { fontWeight: 600, fontSize: '1.1rem' },
    body1: { fontSize: '1rem' },
    body2: { fontSize: '0.875rem' },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 12 },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600 },
      },
    },
  },
};

export function createAppTheme(mode) {
  return createTheme({
    ...shared,
    palette: mode === 'dark' ? {
      mode: 'dark',
      primary: { main: '#818CF8', light: '#1E1B4B', dark: '#6366F1', contrastText: '#FFFFFF' },
      secondary: { main: '#4338CA' },
      info: { main: '#38BDF8', light: '#0C4A6E' },
      success: { main: '#22C55E', light: '#052E16' },
      warning: { main: '#FBBF24', light: '#422006' },
      error: { main: '#F87171', light: '#450A0A' },
      text: { primary: '#E2E8F0', secondary: '#94A3B8', disabled: '#64748B' },
      divider: '#334155',
      background: { default: '#0F172A', paper: '#1E293B' },
    } : {
      mode: 'light',
      primary: { main: '#6366F1', light: '#EEF2FF', dark: '#4F46E5', contrastText: '#FFFFFF' },
      secondary: { main: '#C7D2FE' },
      info: { main: '#0EA5E9', light: '#E0F2FE' },
      success: { main: '#16A34A', light: '#F0FDF4' },
      warning: { main: '#D97706', light: '#FFFBEB' },
      error: { main: '#EF4444', light: '#FEF2F2' },
      text: { primary: '#1A1A2E', secondary: '#555555', disabled: '#BBBBBB' },
      divider: '#DDDDDD',
      background: { default: '#F8F9FB', paper: '#FFFFFF' },
    },
  });
}
