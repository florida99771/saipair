import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Stack,
  IconButton,
  Menu,
  MenuItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import TranslateIcon from '@mui/icons-material/Translate';
import CheckIcon from '@mui/icons-material/Check';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import RemoveIcon from '@mui/icons-material/Remove';
import CropSquareIcon from '@mui/icons-material/CropSquare';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';
import { useThemeMode } from '../ThemeContext';
import languages from '../constants/languages';

export default function TopBar({ onBack, actions, showHelp = true }) {
  const { t, i18n } = useTranslation();
  const { mode, toggleMode } = useThemeMode();
  const navigate = useNavigate();
  const [langAnchor, setLangAnchor] = useState(null);

  return (
    <AppBar position="static" elevation={0} sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider', WebkitAppRegion: 'drag' }}>
      <Toolbar sx={{ minHeight: 64, height: 64 }}>
        {onBack && (
          <IconButton onClick={onBack} size="small" sx={{ color: 'text.secondary', mr: 1, WebkitAppRegion: 'no-drag' }}>
            <ArrowBackIcon sx={{ fontSize: 20 }} />
          </IconButton>
        )}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <Box sx={{
            width: 30,
            height: 30,
            borderRadius: 1,
            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'primary.contrastText',
            fontWeight: 700,
            fontSize: 14,
          }}>
            S
          </Box>
          <Typography sx={{ fontSize: 16, fontWeight: 600, color: 'text.primary' }}>
            {t('app.name')}
          </Typography>
        </Box>
        <Box sx={{ flex: 1 }} />
        <Stack direction="row" spacing={1} sx={{ WebkitAppRegion: 'no-drag' }}>
          {actions}
          <Button
            size="small"
            variant="outlined"
            startIcon={mode === 'light'
              ? <DarkModeOutlinedIcon sx={{ fontSize: 16 }} />
              : <LightModeOutlinedIcon sx={{ fontSize: 16 }} />
            }
            onClick={toggleMode}
            sx={{ color: 'text.secondary', borderColor: 'divider', fontSize: 13, px: 2 }}
          >
            {mode === 'light' ? t('common.darkMode') : t('common.lightMode')}
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<TranslateIcon sx={{ fontSize: 16 }} />}
            onClick={(e) => setLangAnchor(e.currentTarget)}
            sx={{ color: 'text.secondary', borderColor: 'divider', fontSize: 13, px: 2 }}
          >
            {languages.find((l) => l.code === i18n.language)?.label || 'English'}
          </Button>
          <Menu
            anchorEl={langAnchor}
            open={Boolean(langAnchor)}
            onClose={() => setLangAnchor(null)}
          >
            {languages.map((lang) => (
              <MenuItem
                key={lang.code}
                selected={i18n.language === lang.code}
                onClick={() => { i18n.changeLanguage(lang.code); setLangAnchor(null); }}
                sx={{ fontSize: 13, minWidth: 140 }}
              >
                <ListItemText>{lang.label}</ListItemText>
                {i18n.language === lang.code && (
                  <ListItemIcon sx={{ minWidth: 'auto', ml: 1 }}>
                    <CheckIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                  </ListItemIcon>
                )}
              </MenuItem>
            ))}
          </Menu>
          {showHelp && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<HelpOutlineIcon sx={{ fontSize: 16 }} />}
              onClick={() => navigate('/help')}
              sx={{ color: 'text.secondary', borderColor: 'divider', fontSize: 13, px: 2 }}
            >
              {t('common.help')}
            </Button>
          )}
        </Stack>
        {/* 窗口控制按钮 */}
        <Stack direction="row" spacing={0} sx={{ WebkitAppRegion: 'no-drag', ml: 1 }}>
          <IconButton
            size="small"
            onClick={() => window.electronAPI.winMinimize()}
            sx={{ borderRadius: 0, width: 46, height: 34, color: 'text.secondary', '&:hover': { bgcolor: 'action.hover' } }}
          >
            <RemoveIcon sx={{ fontSize: 18 }} />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => window.electronAPI.winMaximize()}
            sx={{ borderRadius: 0, width: 46, height: 34, color: 'text.secondary', '&:hover': { bgcolor: 'action.hover' } }}
          >
            <CropSquareIcon sx={{ fontSize: 15 }} />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => window.electronAPI.winClose()}
            sx={{ borderRadius: 0, width: 46, height: 34, color: 'text.secondary', '&:hover': { bgcolor: '#E81123', color: '#fff' } }}
          >
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
