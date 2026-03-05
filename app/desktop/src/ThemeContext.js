import { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { createAppTheme } from './theme';

const ThemeContext = createContext();

export function useThemeMode() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState('light');

  const toggleMode = useCallback((event) => {
    const next = mode === 'light' ? 'dark' : 'light';

    // 获取点击位置作为动画原点
    const x = event?.clientX ?? window.innerWidth / 2;
    const y = event?.clientY ?? 0;
    const maxRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );

    document.documentElement.style.setProperty('--toggle-x', `${x}px`);
    document.documentElement.style.setProperty('--toggle-y', `${y}px`);
    document.documentElement.style.setProperty('--toggle-radius', `${maxRadius}px`);

    if (document.startViewTransition) {
      const transition = document.startViewTransition(() => {
        flushSync(() => setMode(next));
      });
      // transition.ready — no action needed, animation runs automatically
    } else {
      setMode(next);
    }
  }, [mode]);

  const theme = useMemo(() => createAppTheme(mode), [mode]);

  const value = useMemo(() => ({ mode, toggleMode }), [mode, toggleMode]);

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}
