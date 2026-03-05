import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
} from '@mui/material';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import { useTranslation } from 'react-i18next';

export default function CreateTournamentDialog({ open, onClose, onCreate }) {
  const { t } = useTranslation();
  const [name, setName] = useState('');

  const handleClose = () => {
    setName('');
    onClose();
  };

  const handleCreate = () => {
    if (!name.trim()) return;
    onCreate(name.trim());
    handleClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
        },
      }}
    >
      {/* 图标 + 标题：顶部留 32px */}
      <DialogTitle sx={{ px: 4, pt: 4, pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
          <Box sx={{
            width: 42,
            height: 42,
            borderRadius: 2,
            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <EmojiEventsOutlinedIcon sx={{ color: 'primary.contrastText', fontSize: 22 }} />
          </Box>
          <Typography sx={{ fontSize: 20, fontWeight: 700, color: 'text.primary' }}>
            {t('createDialog.title')}
          </Typography>
        </Box>
        {/* 描述文字：与标题间距 12px */}
        <Typography sx={{ fontSize: 13, color: 'text.secondary', lineHeight: 1.6 }}>
          {t('createDialog.subtitle')}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ px: 4, pt: 0, pb: 0 }}>
        <TextField
          autoFocus
          fullWidth
          placeholder={t('createDialog.namePlaceholder')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          variant="outlined"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2.5,
              fontSize: 15,
            },
          }}
        />
      </DialogContent>

      {/* 按钮区：与输入框间距 28px，底部留 28px */}
      <DialogActions sx={{ px: 4, pt: 3.5, pb: 3.5, gap: 1 }}>
        <Button
          onClick={handleClose}
          sx={{
            px: 3,
            color: 'text.secondary',
            fontSize: 14,
          }}
        >
          {t('common.cancel')}
        </Button>
        <Button
          onClick={handleCreate}
          variant="contained"
          disabled={!name.trim()}
          sx={{
            px: 3,
            fontSize: 14,
            borderRadius: 2,
            background: name.trim() ? 'linear-gradient(135deg, #6366F1, #7C3AED)' : undefined,
            boxShadow: name.trim() ? '0 2px 8px rgba(99,102,241,0.3)' : 'none',
            '&:hover': {
              background: 'linear-gradient(135deg, #4F46E5, #6D28D9)',
            },
          }}
        >
          {t('common.create')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
