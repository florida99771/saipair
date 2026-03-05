import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Stack,
  Typography,
  TextField,
} from '@mui/material';

export function resultColors(result) {
  if (result === '1-0') return { bgcolor: 'success.light', color: 'success.main' };
  if (result === '0-1') return { bgcolor: 'error.light', color: 'error.main' };
  if (result === '1-0F') return { bgcolor: 'success.light', color: 'success.main', opacity: 0.75 };
  if (result === '0F-1') return { bgcolor: 'error.light', color: 'error.main', opacity: 0.75 };
  if (result === '0F-0F') return { bgcolor: 'action.hover', color: 'text.disabled' };
  if (result === '0.5-0.5') return { bgcolor: 'warning.light', color: 'warning.main' };
  if (result === 'hbye') return { bgcolor: 'primary.light', color: 'primary.main' };
  return { bgcolor: 'action.hover', color: 'text.secondary' };
}

export default function ResultDialog({
  open,
  onClose,
  pairing,
  playerA,
  playerB,
  allowDraw,
  colorBalance,
  onSave,
  t,
}) {
  const [selectedResult, setSelectedResult] = useState(pairing?.result || null);
  const [noteText, setNoteText] = useState(pairing?.notes || '');

  useEffect(() => {
    if (open && pairing) {
      setSelectedResult(pairing.result || null);
      setNoteText(pairing.notes || '');
    }
  }, [open, pairing]);

  const normalOptions = [
    { value: '1-0', label: '1-0' },
    ...(allowDraw ? [{ value: '0.5-0.5', label: '\u00BD-\u00BD' }] : []),
    { value: '0-1', label: '0-1' },
  ];

  const forfeitOptions = [
    { value: '1-0F', label: t('tournament.rounds.playerForfeit', { name: playerB?.name || 'B' }) },
    { value: '0F-1', label: t('tournament.rounds.playerForfeit', { name: playerA?.name || 'A' }) },
    { value: '0F-0F', label: t('tournament.rounds.doubleForfeit') },
  ];

  const handleSave = () => {
    onSave({ result: selectedResult, notes: noteText.trim() });
    onClose();
  };

  const isEditing = pairing?.result != null;
  const labelA = colorBalance
    ? t('tournament.rounds.col.white')
    : t('tournament.rounds.col.playerA');
  const labelB = colorBalance
    ? t('tournament.rounds.col.black')
    : t('tournament.rounds.col.playerB');

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontSize: 18, fontWeight: 600 }}>
        {isEditing
          ? t('tournament.rounds.resultDialog.editTitle')
          : t('tournament.rounds.resultDialog.title')}
      </DialogTitle>
      <DialogContent>
        {playerA && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              mb: 3,
              px: 1,
              py: 1.5,
              borderRadius: 2,
              bgcolor: 'action.hover',
            }}
          >
            <Box sx={{ textAlign: 'center', flex: 1 }}>
              <Typography sx={{ fontSize: 11, color: 'text.disabled', mb: 0.3 }}>
                {labelA}
              </Typography>
              <Typography sx={{ fontSize: 15, fontWeight: 600, color: 'text.primary' }}>
                {playerA.name}
              </Typography>
              {playerA.rating > 0 && (
                <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>
                  {playerA.rating}
                </Typography>
              )}
            </Box>
            <Typography sx={{ fontSize: 16, color: 'text.disabled', alignSelf: 'center', px: 2 }}>
              vs
            </Typography>
            <Box sx={{ textAlign: 'center', flex: 1 }}>
              <Typography sx={{ fontSize: 11, color: 'text.disabled', mb: 0.3 }}>
                {labelB}
              </Typography>
              <Typography sx={{ fontSize: 15, fontWeight: 600, color: 'text.primary' }}>
                {playerB?.name || '--'}
              </Typography>
              {playerB?.rating > 0 && (
                <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>
                  {playerB.rating}
                </Typography>
              )}
            </Box>
          </Box>
        )}

        <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.secondary', mb: 1 }}>
          {t('tournament.rounds.resultDialog.normalResult')}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mb: 2.5 }}>
          {normalOptions.map((opt) => {
            const isSelected = selectedResult === opt.value;
            const colors = resultColors(opt.value);
            return (
              <Button
                key={opt.value}
                variant={isSelected ? 'contained' : 'outlined'}
                onClick={() => setSelectedResult(isSelected ? null : opt.value)}
                sx={{
                  flex: 1,
                  py: 1,
                  fontSize: 16,
                  fontWeight: 700,
                  borderRadius: 2,
                  ...(isSelected
                    ? { bgcolor: colors.color, color: 'common.white', '&:hover': { bgcolor: colors.color, opacity: 0.9 } }
                    : { color: 'text.secondary', borderColor: 'divider' }),
                }}
              >
                {opt.label}
              </Button>
            );
          })}
        </Stack>

        <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.secondary', mb: 1 }}>
          {t('tournament.rounds.resultDialog.forfeitResult')}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mb: 2.5 }}>
          {forfeitOptions.map((opt) => {
            const isSelected = selectedResult === opt.value;
            return (
              <Button
                key={opt.value}
                variant={isSelected ? 'contained' : 'outlined'}
                onClick={() => setSelectedResult(isSelected ? null : opt.value)}
                sx={{
                  flex: 1,
                  py: 0.6,
                  fontSize: 13,
                  fontWeight: 600,
                  borderRadius: 1.5,
                  ...(isSelected
                    ? { bgcolor: 'text.disabled', color: 'common.white', '&:hover': { bgcolor: 'text.secondary' } }
                    : { color: 'text.disabled', borderColor: 'divider' }),
                }}
              >
                {opt.label}
              </Button>
            );
          })}
        </Stack>

        <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.secondary', mb: 1 }}>
          {t('tournament.rounds.resultDialog.notes')}
        </Typography>
        <TextField
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          fullWidth
          multiline
          minRows={2}
          maxRows={4}
          placeholder={t('tournament.rounds.resultDialog.notesPlaceholder')}
          sx={{ '& .MuiInputBase-root': { fontSize: 14 } }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        {isEditing && (
          <Button
            onClick={() => {
              onSave({ result: null, notes: '' });
              onClose();
            }}
            color="error"
            sx={{ fontSize: 13, mr: 'auto' }}
          >
            {t('tournament.rounds.resultDialog.clearResult')}
          </Button>
        )}
        <Button onClick={onClose} sx={{ fontSize: 14 }}>
          {t('common.cancel')}
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          sx={{
            fontSize: 14,
            background: 'linear-gradient(135deg, #F59E0B, #D97706)',
            '&:hover': { background: 'linear-gradient(135deg, #D97706, #B45309)' },
          }}
        >
          {t('tournament.rounds.resultDialog.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
