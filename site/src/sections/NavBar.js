import React, { useState } from 'react';
import {
  AppBar, Toolbar, Typography, Button, IconButton, Box, Menu, MenuItem,
  Drawer, List, ListItemButton, ListItemText, useMediaQuery, useTheme,
} from '@mui/material';
import {
  DarkMode, LightMode, Language, Menu as MenuIcon, GitHub,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useThemeMode } from '../ThemeContext';

const langs = [
  { code: 'en', label: 'English' },
  { code: 'zh-CN', label: '中文' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'pt', label: 'Português' },
  { code: 'ru', label: 'Русский' },
  { code: 'ja', label: '日本語' },
  { code: 'ar', label: 'العربية' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'bn', label: 'বাংলা' },
];

const navItems = ['features', 'formats', 'download', 'openSource'];

export default function NavBar() {
  const { t, i18n } = useTranslation();
  const { mode, toggleMode } = useThemeMode();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [langAnchor, setLangAnchor] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const changeLang = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem('saipair-lang', code);
    setLangAnchor(null);
  };

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setDrawerOpen(false);
  };

  return (
    <AppBar position="sticky" color="default" elevation={1}
      sx={{ backdropFilter: 'blur(8px)', bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(15,23,42,0.85)' : 'rgba(248,249,251,0.85)' }}>
      <Toolbar sx={{ maxWidth: 1200, width: '100%', mx: 'auto' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mr: 2, cursor: 'pointer' }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          SaiPair
        </Typography>

        {!isMobile && (
          <Box sx={{ display: 'flex', gap: 1, flexGrow: 1 }}>
            {navItems.map((item) => (
              <Button key={item} size="small" onClick={() => scrollTo(item)}>
                {t(`nav.${item}`)}
              </Button>
            ))}
          </Box>
        )}

        <Box sx={{ flexGrow: isMobile ? 1 : 0 }} />

        <IconButton onClick={(e) => setLangAnchor(e.currentTarget)} size="small">
          <Language />
        </IconButton>
        <Menu anchorEl={langAnchor} open={Boolean(langAnchor)} onClose={() => setLangAnchor(null)}>
          {langs.map((l) => (
            <MenuItem key={l.code} selected={i18n.language === l.code} onClick={() => changeLang(l.code)}>
              {l.label}
            </MenuItem>
          ))}
        </Menu>

        <IconButton onClick={toggleMode} size="small" sx={{ ml: 0.5 }}>
          {mode === 'dark' ? <LightMode /> : <DarkMode />}
        </IconButton>

        <IconButton size="small" sx={{ ml: 0.5 }}
          href="https://github.com/florida99771/saipair" target="_blank" rel="noopener">
          <GitHub />
        </IconButton>

        {isMobile && (
          <IconButton onClick={() => setDrawerOpen(true)} size="small" sx={{ ml: 0.5 }}>
            <MenuIcon />
          </IconButton>
        )}

        <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
          <List sx={{ width: 200, pt: 2 }}>
            {navItems.map((item) => (
              <ListItemButton key={item} onClick={() => scrollTo(item)}>
                <ListItemText primary={t(`nav.${item}`)} />
              </ListItemButton>
            ))}
          </List>
        </Drawer>
      </Toolbar>
    </AppBar>
  );
}
