import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  FormControl,
  Select,
  MenuItem,
} from '@mui/material';

export const IMPORT_FIELDS = [
  { key: 'name', required: true },
  { key: 'gender' },
  { key: 'birthDate' },
  { key: 'title' },
  { key: 'rating' },
  { key: 'organization' },
  { key: 'phone' },
  { key: 'notes' },
];

export const COLUMN_HINTS = {
  name: ['姓名', 'name', '名字', '选手', 'player'],
  gender: ['性别', 'gender', 'sex'],
  birthDate: ['出生日期', 'birthdate', 'birth date', 'birthday', '生日'],
  title: ['称号', 'title', '段位', 'rank'],
  rating: ['等级分', 'rating', 'elo', '积分'],
  organization: ['单位', 'organization', 'org', '俱乐部', 'club'],
  phone: ['联系方式', 'phone', '电话', '手机', 'tel', 'mobile'],
  notes: ['备注', 'notes', 'note', 'remark', 'remarks'],
};

export default function ImportPreviewDialog({
  open,
  onClose,
  importRows,
  importHeaders,
  importMapping,
  setImportMapping,
  onConfirm,
  t,
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontSize: 18, fontWeight: 600, pb: 1 }}>
        {t('tournament.players.importTitle')}
      </DialogTitle>
      <DialogContent>
        <Typography sx={{ fontSize: 13, color: 'text.secondary', mb: 3 }}>
          {t('tournament.players.importHint', { count: importRows.length })}
        </Typography>

        <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
          {/* 表头 */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              px: 2.5,
              py: 1.2,
              bgcolor: 'action.hover',
              borderBottom: 1,
              borderColor: 'divider',
            }}
          >
            <Typography sx={{ width: 100, fontSize: 12, fontWeight: 600, color: 'text.disabled' }}>
              {t('tournament.players.importColSystem')}
            </Typography>
            <Box sx={{ width: 32 }} />
            <Typography sx={{ flex: 1, fontSize: 12, fontWeight: 600, color: 'text.disabled' }}>
              {t('tournament.players.importColExcel')}
            </Typography>
            <Typography
              sx={{ width: 120, fontSize: 12, fontWeight: 600, color: 'text.disabled', textAlign: 'right' }}
            >
              {t('tournament.players.importColSample')}
            </Typography>
          </Box>

          {/* 映射行 */}
          {IMPORT_FIELDS.map(({ key, required }, index) => {
            const selectedHeader = importMapping[key] || '';
            const sample =
              selectedHeader && importRows[0]
                ? String(importRows[0][selectedHeader] ?? '').trim()
                : '';
            return (
              <Box
                key={key}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  px: 2.5,
                  py: 1.2,
                  borderBottom: index < IMPORT_FIELDS.length - 1 ? 1 : 0,
                  borderColor: 'divider',
                }}
              >
                <Box sx={{ width: 100, flexShrink: 0 }}>
                  <Typography sx={{ fontSize: 14, fontWeight: 500, color: 'text.primary' }}>
                    {t(`tournament.players.col.${key}`)}
                    {required && (
                      <Typography component="span" sx={{ color: 'error.main', ml: 0.3 }}>
                        *
                      </Typography>
                    )}
                  </Typography>
                </Box>
                <Typography
                  sx={{ width: 32, textAlign: 'center', color: 'text.disabled', fontSize: 14 }}
                >
                  ←
                </Typography>
                <FormControl size="small" sx={{ flex: 1 }}>
                  <Select
                    value={selectedHeader}
                    displayEmpty
                    onChange={(e) =>
                      setImportMapping((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                    sx={{ fontSize: 14 }}
                  >
                    <MenuItem value="">
                      <Typography sx={{ color: 'text.disabled', fontSize: 14 }}>
                        {t('tournament.players.importSkip')}
                      </Typography>
                    </MenuItem>
                    {importHeaders.map((h) => (
                      <MenuItem key={h} value={h} sx={{ fontSize: 14 }}>
                        {h}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Typography
                  sx={{
                    width: 120,
                    fontSize: 13,
                    color: sample ? 'text.secondary' : 'text.disabled',
                    textAlign: 'right',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    ml: 1.5,
                  }}
                >
                  {sample || '—'}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ fontSize: 14 }}>
          {t('common.cancel')}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          disabled={!importMapping.name}
          sx={{
            fontSize: 14,
            background: 'linear-gradient(135deg, #0EA5E9, #0284C7)',
            '&:hover': { background: 'linear-gradient(135deg, #0284C7, #0369A1)' },
          }}
        >
          {t('tournament.players.importConfirm', { count: importRows.length })}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
