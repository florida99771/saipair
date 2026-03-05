import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Stack,
  Chip,
  IconButton,
  CircularProgress,
  Menu,
  MenuItem,
  ListItemText,
  ListItemIcon,
  TextField,
  Select,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tabs,
  Tab,
  Checkbox,
  FormControlLabel,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ListAltOutlinedIcon from '@mui/icons-material/ListAltOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import TranslateIcon from '@mui/icons-material/Translate';
import CheckIcon from '@mui/icons-material/Check';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import ViewListOutlinedIcon from '@mui/icons-material/ViewListOutlined';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import PersonOffOutlinedIcon from '@mui/icons-material/PersonOffOutlined';
import PersonAddAlt1OutlinedIcon from '@mui/icons-material/PersonAddAlt1Outlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CloseIcon from '@mui/icons-material/Close';
import RemoveIcon from '@mui/icons-material/Remove';
import CropSquareIcon from '@mui/icons-material/CropSquare';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import Tooltip from '@mui/material/Tooltip';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import * as XLSX from 'xlsx';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useThemeMode } from '../ThemeContext';
import SettingsPanel from '../components/SettingsPanel';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import ImportPreviewDialog, { IMPORT_FIELDS as IMPORT_FIELD_DEFS, COLUMN_HINTS as COLUMN_HINT_MAP } from '../components/ImportPreviewDialog';
import ResultDialog, { resultColors } from '../components/ResultDialog';
import { Tournament } from '@core';
import { printPlayerList, printRoundPairings, printRankings, printCrossTable, printPlayerCard } from '../utils/print';
import { exportPlayerList, exportRankings, exportRoundPairings, exportCrossTable, exportTRF } from '../utils/export';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import TableRowsOutlinedIcon from '@mui/icons-material/TableRowsOutlined';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import SaveAltOutlinedIcon from '@mui/icons-material/SaveAltOutlined';
import BracketView from '../components/BracketView';
import languages from '../constants/languages';

const SIDEBAR_WIDTH = 240;

const NAV_ITEMS = [
  { key: 'settings', icon: SettingsOutlinedIcon, color: 'primary.main', bg: 'primary.light' },
  { key: 'players', icon: PeopleOutlineIcon, color: 'info.main', bg: 'info.light' },
  { key: 'rounds', icon: ViewListOutlinedIcon, color: 'warning.main', bg: 'warning.light' },
  { key: 'rankings', icon: EmojiEventsOutlinedIcon, color: 'success.main', bg: 'success.light' },
];

export default function TournamentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { mode, toggleMode } = useThemeMode();
  const [tournament, setTournament] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [activeNav, setActiveNav] = useState('settings');
  const [langAnchor, setLangAnchor] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  // 加载赛事数据
  const loadData = useCallback(async () => {
    try {
      const json = await window.electronAPI.loadTournament(id);
      const inst = Tournament.fromJSON(json);
      setTournament(inst);
    } catch {
      setLoadError(true);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 更新赛事实例并保存，silent=true 时不弹保存成功提示
  const updateTournament = useCallback((updater, { silent = false } = {}) => {
    setTournament(prev => {
      const json = prev.toJSON();
      const inst = Tournament.fromJSON(json);
      updater(inst);
      window.electronAPI.saveTournament(id, inst.toJSON())
        .then(() => { if (!silent) toast.success(t('toast.saved')); })
        .catch(() => toast.error(t('toast.saveFailed')));
      return inst;
    });
  }, [id, t]);

  const handleDelete = async () => {
    try {
      await window.electronAPI.deleteTournament(id);
      toast.success(t('toast.deleteSuccess'));
      navigate('/');
    } catch {
      toast.error(t('toast.deleteFailed'));
    }
  };

  const handleBackup = async () => {
    try {
      const jsonStr = await window.electronAPI.backupTournament(id);
      const encoder = new TextEncoder();
      const buffer = Array.from(encoder.encode(jsonStr));
      const result = await window.electronAPI.saveFileDialog(
        buffer,
        `${tournament?.name || 'backup'}.saipair`,
        [{ name: 'SaiPair Backup', extensions: ['saipair'] }]
      );
      if (result?.success) toast.success(t('toast.backupSuccess'));
    } catch {
      toast.error(t('toast.backupFailed'));
    }
  };

  if (loadError) {
    return (
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <Typography sx={{ fontSize: 16, color: 'text.secondary' }}>
          {t('toast.loadFailed')}
        </Typography>
        <Button variant="outlined" onClick={() => navigate('/')}>
          {t('tournament.backToList')}
        </Button>
      </Box>
    );
  }

  if (!tournament) {
    return (
      <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  const getStatusLabel = (status) => {
    if (status === 'in_progress') return t('home.statusInProgress');
    if (status === 'completed') return t('home.statusCompleted');
    return t('home.statusNotStarted');
  };

  const getStatusChipColor = (status) => {
    if (status === 'in_progress') return { bgcolor: 'warning.light', color: 'warning.main' };
    if (status === 'completed') return { bgcolor: 'success.light', color: 'success.main' };
    return { bgcolor: 'grey.100', color: 'text.secondary' };
  };

  const getRoundInfo = () => {
    if (!tournament.currentRound) return '';
    if (tournament.totalRounds) {
      return t('tournament.roundProgress', {
        current: tournament.currentRound,
        total: tournament.totalRounds,
      });
    }
    return t('home.roundInfo', { current: tournament.currentRound });
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      {/* 顶栏 */}
      <AppBar
        position="static"
        elevation={0}
        sx={{
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
          WebkitAppRegion: 'drag',
        }}
      >
        <Toolbar sx={{ minHeight: 64, height: 64, gap: 1.5 }}>
          {/* 左侧：返回 + Logo + 赛事名 + 状态 */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, WebkitAppRegion: 'no-drag' }}>
            <IconButton size="small" onClick={() => navigate('/')} sx={{ color: 'text.secondary' }}>
              <ArrowBackIcon sx={{ fontSize: 20 }} />
            </IconButton>
            <Box sx={{
              width: 26,
              height: 26,
              borderRadius: 0.8,
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'primary.contrastText',
              fontWeight: 700,
              fontSize: 12,
            }}>
              S
            </Box>
            <Typography sx={{ fontSize: 15, fontWeight: 600, color: 'text.primary' }}>
              {tournament.name}
            </Typography>
            {getRoundInfo() && (
              <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>
                {t(`format.${tournament.format}`)} · {getRoundInfo()}
              </Typography>
            )}
            <Chip
              label={getStatusLabel(tournament.status)}
              size="small"
              sx={{
                fontSize: 11,
                fontWeight: 500,
                height: 22,
                ...getStatusChipColor(tournament.status),
              }}
            />
          </Box>

          <Box sx={{ flex: 1 }} />

          {/* 右侧：操作按钮 */}
          <Stack direction="row" spacing={1} sx={{ WebkitAppRegion: 'no-drag' }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<ListAltOutlinedIcon sx={{ fontSize: 16 }} />}
              onClick={() => navigate('/')}
              sx={{
                color: 'primary.main',
                borderColor: 'primary.main',
                fontSize: 13,
                px: 2,
                '&:hover': {
                  bgcolor: 'primary.light',
                  borderColor: 'primary.dark',
                },
              }}
            >
              {t('tournament.backToList')}
            </Button>
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
            <Button
              size="small"
              variant="outlined"
              startIcon={<HelpOutlineIcon sx={{ fontSize: 16 }} />}
              onClick={() => navigate('/help')}
              sx={{ color: 'text.secondary', borderColor: 'divider', fontSize: 13, px: 2 }}
            >
              {t('common.help')}
            </Button>
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

      {/* 主区域 = 侧边栏 + 内容 */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* 左侧边栏 */}
        <Box
          sx={{
            width: SIDEBAR_WIDTH,
            minWidth: SIDEBAR_WIDTH,
            bgcolor: 'background.paper',
            borderRight: 1,
            borderColor: 'divider',
            py: 2,
            px: 1.5,
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5,
          }}
        >
          {NAV_ITEMS.map(({ key, icon: Icon, color, bg }) => {
            const isActive = activeNav === key;
            return (
              <Box
                key={key}
                onClick={() => setActiveNav(key)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  px: 2,
                  py: 1.4,
                  borderRadius: 2,
                  cursor: 'pointer',
                  transition: 'all 0.1s',
                  bgcolor: isActive ? bg : 'transparent',
                  '&:hover': {
                    bgcolor: isActive ? bg : 'action.hover',
                  },
                }}
              >
                <Icon sx={{ fontSize: 20, color }} />
                <Typography sx={{
                  fontSize: 14,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? color : 'text.secondary',
                }}>
                  {t(`tournament.nav.${key}`)}
                </Typography>
              </Box>
            );
          })}

          {/* 底部操作按钮 */}
          <Box sx={{ mt: 'auto' }}>
            <Box
              onClick={handleBackup}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                px: 2,
                py: 1.4,
                borderRadius: 2,
                cursor: 'pointer',
                color: 'text.disabled',
                transition: 'all 0.1s',
                '&:hover': {
                  bgcolor: 'primary.light',
                  color: 'primary.main',
                },
              }}
            >
              <SaveAltOutlinedIcon sx={{ fontSize: 20 }} />
              <Typography sx={{ fontSize: 14, color: 'inherit' }}>
                {t('tournament.backupTournament')}
              </Typography>
            </Box>
            {tournament.status !== 'not_started' && (
              <Box
                onClick={() => setResetOpen(true)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  px: 2,
                  py: 1.4,
                  borderRadius: 2,
                  cursor: 'pointer',
                  color: 'text.disabled',
                  transition: 'all 0.1s',
                  '&:hover': {
                    bgcolor: 'warning.light',
                    color: 'warning.main',
                  },
                }}
              >
                <RestartAltIcon sx={{ fontSize: 20 }} />
                <Typography sx={{ fontSize: 14, color: 'inherit' }}>
                  {t('resetDialog.title')}
                </Typography>
              </Box>
            )}
            <Box
              onClick={() => setDeleteOpen(true)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                px: 2,
                py: 1.4,
                borderRadius: 2,
                cursor: 'pointer',
                color: 'text.disabled',
                transition: 'all 0.1s',
                '&:hover': {
                  bgcolor: 'error.light',
                  color: 'error.main',
                },
              }}
            >
              <DeleteOutlineIcon sx={{ fontSize: 20 }} />
              <Typography sx={{ fontSize: 14, color: 'inherit' }}>
                {t('deleteDialog.title')}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* 右侧内容区 */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
          {activeNav === 'settings' && (
            <SettingsPanel tournament={tournament} onUpdate={updateTournament} />
          )}
          {activeNav === 'players' && (
            <PlayersPanel tournament={tournament} onUpdate={updateTournament} />
          )}
          {activeNav === 'rounds' && (
            <RoundsPanel tournament={tournament} onUpdate={updateTournament} />
          )}
          {activeNav === 'rankings' && (
            <RankingsPanel tournament={tournament} />
          )}
        </Box>
      </Box>

      {/* 重置确认对话框 */}
      <Dialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontSize: 18, fontWeight: 600 }}>
          {t('resetDialog.title')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: 14 }}>
            {t('resetDialog.message', { name: tournament.name })}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setResetOpen(false)} sx={{ fontSize: 14 }}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={() => {
              updateTournament((inst) => inst.reset(), { silent: true });
              setResetOpen(false);
              toast.success(t('toast.resetSuccess'));
            }}
            color="warning"
            variant="contained"
            sx={{ fontSize: 14 }}
          >
            {t('resetDialog.confirm')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontSize: 18, fontWeight: 600 }}>
          {t('deleteDialog.title')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: 14 }}>
            {t('deleteDialog.message', { name: tournament.name })}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteOpen(false)} sx={{ fontSize: 14 }}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            sx={{ fontSize: 14 }}
          >
            {t('deleteDialog.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ── 占位面板，后续逐步实现 ──

const EMPTY_PLAYER_FORM = {
  name: '', gender: '', birthDate: '', title: '',
  rating: '', organization: '', phone: '', notes: '',
};

function playerToForm(player) {
  return {
    name: player.name || '',
    gender: player.gender || '',
    birthDate: player.birthDate || '',
    title: player.title || '',
    rating: player.rating || '',
    organization: player.organization || '',
    phone: player.phone || '',
    notes: player.notes || '',
  };
}

function PlayerFormFields({ form, setForm, t, autoFocus }) {
  return (
    <Stack spacing={2.5} sx={{ mt: 1 }}>
      <TextField
        label={t('tournament.players.col.name')}
        value={form.name}
        onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
        fullWidth
        autoFocus={autoFocus}
        required
        placeholder={t('tournament.players.namePlaceholder')}
      />
      <Stack direction="row" spacing={2}>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>{t('tournament.players.col.gender')}</InputLabel>
          <Select
            value={form.gender}
            label={t('tournament.players.col.gender')}
            onChange={(e) => setForm(prev => ({ ...prev, gender: e.target.value }))}
          >
            <MenuItem value="">&nbsp;</MenuItem>
            <MenuItem value="male">{t('tournament.players.gender.male')}</MenuItem>
            <MenuItem value="female">{t('tournament.players.gender.female')}</MenuItem>
          </Select>
        </FormControl>
        <TextField
          label={t('tournament.players.col.birthDate')}
          value={form.birthDate}
          type="date"
          onChange={(e) => setForm(prev => ({ ...prev, birthDate: e.target.value }))}
          InputLabelProps={{ shrink: true }}
          sx={{ flex: 1 }}
        />
      </Stack>
      <Stack direction="row" spacing={2}>
        <TextField
          label={t('tournament.players.col.title')}
          value={form.title}
          onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
          placeholder={t('tournament.players.titlePlaceholder')}
          sx={{ flex: 1 }}
        />
        <TextField
          label={t('tournament.players.col.rating')}
          value={form.rating}
          onChange={(e) => setForm(prev => ({ ...prev, rating: e.target.value }))}
          type="number"
          placeholder={t('tournament.players.ratingPlaceholder')}
          inputProps={{ min: 0 }}
          sx={{ flex: 1 }}
        />
      </Stack>
      <TextField
        label={t('tournament.players.col.organization')}
        value={form.organization}
        onChange={(e) => setForm(prev => ({ ...prev, organization: e.target.value }))}
        fullWidth
        placeholder={t('tournament.players.orgPlaceholder')}
      />
      <TextField
        label={t('tournament.players.col.phone')}
        value={form.phone}
        onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
        fullWidth
        placeholder={t('tournament.players.phonePlaceholder')}
      />
      <TextField
        label={t('tournament.players.col.notes')}
        value={form.notes}
        onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
        fullWidth
        multiline
        minRows={2}
        placeholder={t('tournament.players.notesPlaceholder')}
      />
    </Stack>
  );
}

function PlayersPanel({ tournament, onUpdate }) {
  const { t } = useTranslation();
  const players = tournament.players;
  const isStarted = tournament.status !== 'not_started';

  // 添加
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_PLAYER_FORM);

  // 编辑
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_PLAYER_FORM);

  // 详情
  const [detailPlayer, setDetailPlayer] = useState(null);

  // 退赛确认
  const [withdrawTarget, setWithdrawTarget] = useState(null);

  // 删除确认
  const [deleteTarget, setDeleteTarget] = useState(null);

  // 操作菜单
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuPlayer, setMenuPlayer] = useState(null);

  const handleOpenMenu = (e, player) => {
    setMenuAnchor(e.currentTarget);
    setMenuPlayer(player);
  };
  const handleCloseMenu = () => {
    setMenuAnchor(null);
    setMenuPlayer(null);
  };

  // 添加
  const handleOpenAdd = () => {
    setForm(EMPTY_PLAYER_FORM);
    setAddOpen(true);
  };
  const handleAdd = () => {
    const name = form.name.trim();
    if (!name) return;
    onUpdate((inst) => {
      inst.addPlayer({
        name,
        gender: form.gender,
        birthDate: form.birthDate,
        title: form.title.trim(),
        rating: form.rating === '' ? 0 : Number(form.rating),
        organization: form.organization.trim(),
        phone: form.phone.trim(),
        notes: form.notes.trim(),
      });
    }, { silent: true });
    toast.success(t('tournament.players.addSuccess'));
    setForm(EMPTY_PLAYER_FORM);
    setAddOpen(false);
  };

  // 编辑
  const handleOpenEdit = () => {
    if (!menuPlayer) return;
    setEditId(menuPlayer.id);
    setEditForm(playerToForm(menuPlayer));
    setEditOpen(true);
    handleCloseMenu();
  };
  const handleEditSave = () => {
    if (!editId || !editForm.name.trim()) return;
    onUpdate((inst) => {
      inst.updatePlayer(editId, {
        name: editForm.name.trim(),
        gender: editForm.gender,
        birthDate: editForm.birthDate,
        title: editForm.title.trim(),
        rating: editForm.rating === '' ? 0 : Number(editForm.rating),
        organization: editForm.organization.trim(),
        phone: editForm.phone.trim(),
        notes: editForm.notes.trim(),
      });
    }, { silent: true });
    toast.success(t('tournament.players.editSuccess'));
    setEditOpen(false);
  };

  // 退赛 / 恢复
  const handleOpenWithdraw = () => {
    if (!menuPlayer) return;
    setWithdrawTarget(menuPlayer);
    handleCloseMenu();
  };
  const handleWithdraw = () => {
    if (!withdrawTarget) return;
    const isRestore = withdrawTarget.status === 'withdrawn';
    onUpdate((inst) => {
      if (isRestore) {
        inst.restorePlayer(withdrawTarget.id);
      } else {
        inst.withdrawPlayer(withdrawTarget.id);
      }
    }, { silent: true });
    toast.success(t(isRestore ? 'tournament.players.restoreSuccess' : 'tournament.players.withdrawSuccess'));
    setWithdrawTarget(null);
  };

  // 删除
  const handleOpenDelete = () => {
    if (!menuPlayer) return;
    setDeleteTarget(menuPlayer);
    handleCloseMenu();
  };
  const handleDelete = () => {
    if (!deleteTarget) return;
    onUpdate((inst) => {
      inst.removePlayer(deleteTarget.id);
    }, { silent: true });
    toast.success(t('tournament.players.deleteSuccess'));
    setDeleteTarget(null);
  };

  // 导入
  const [importOpen, setImportOpen] = useState(false);
  const [importRows, setImportRows] = useState([]);
  const [importHeaders, setImportHeaders] = useState([]);
  const [importMapping, setImportMapping] = useState({});

  // IMPORT_FIELDS 和 COLUMN_HINTS 已移至 ImportPreviewDialog.js，通过具名导入使用

  const GENDER_MAP = {
    '男': 'male', '女': 'female',
    'male': 'male', 'female': 'female',
    'm': 'male', 'f': 'female',
  };

  const autoMatch = (headers) => {
    const mapping = {};
    for (const { key } of IMPORT_FIELD_DEFS) {
      const hints = COLUMN_HINT_MAP[key] || [];
      const found = headers.find(h => hints.includes(h.trim().toLowerCase()));
      mapping[key] = found || '';
    }
    return mapping;
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls,.csv';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const wb = XLSX.read(evt.target.result, { type: 'array' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
          if (rows.length === 0) {
            toast.error(t('tournament.players.importEmpty'));
            return;
          }
          const headers = Object.keys(rows[0]);
          setImportRows(rows);
          setImportHeaders(headers);
          setImportMapping(autoMatch(headers));
          setImportOpen(true);
        } catch {
          toast.error(t('tournament.players.importFailed'));
        }
      };
      reader.readAsArrayBuffer(file);
    };
    input.click();
  };

  const handleImportConfirm = () => {
    if (!importMapping.name) {
      toast.error(t('tournament.players.importNoName'));
      return;
    }
    let count = 0;
    onUpdate((inst) => {
      for (const row of importRows) {
        const player = {};
        for (const { key } of IMPORT_FIELD_DEFS) {
          const header = importMapping[key];
          if (!header) continue;
          const val = row[header];
          if (val === undefined || val === null || val === '') continue;
          const str = String(val).trim();
          if (key === 'name') player.name = str;
          else if (key === 'gender') player.gender = GENDER_MAP[str.toLowerCase()] || '';
          else if (key === 'rating') player.rating = Number(str) || 0;
          else player[key] = str;
        }
        if (player.name) {
          try {
            inst.addPlayer(player);
            count++;
          } catch {
            // 跳过无效行（如重名），继续导入其余行
          }
        }
      }
    }, { silent: true });
    toast.success(t('tournament.players.importSuccess', { count }));
    setImportOpen(false);
  };

  return (
    <Box sx={{ maxWidth: 960 }}>
      {/* 提示横幅：赛事已开始时 */}
      {isStarted && (
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 2.5,
          py: 1.5,
          mb: 2.5,
          borderRadius: 2,
          bgcolor: 'warning.light',
          color: 'warning.dark',
        }}>
          <InfoOutlinedIcon sx={{ fontSize: 20 }} />
          <Typography sx={{ fontSize: 13, fontWeight: 500 }}>
            {t('tournament.players.lockedBanner')}
          </Typography>
        </Box>
      )}

      {/* 标题栏 */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography sx={{ fontSize: 22, fontWeight: 700, color: 'text.primary' }}>
            {t('tournament.players.title')}
          </Typography>
          <Typography sx={{ fontSize: 13, color: 'text.disabled', mt: 0.5 }}>
            {t('tournament.players.count', { count: players.length })}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          {players.length > 0 && (
            <>
              <Button
                variant="outlined"
                startIcon={<PrintOutlinedIcon />}
                onClick={() => printPlayerList(tournament, t)}
                sx={{
                  px: 2.5,
                  py: 1,
                  fontSize: 14,
                  fontWeight: 500,
                  borderRadius: 2,
                  color: 'text.primary',
                  borderColor: 'grey.400',
                  bgcolor: 'background.paper',
                }}
              >
                {t('print.printPlayerList')}
              </Button>
              <Button
                variant="outlined"
                startIcon={<FileDownloadOutlinedIcon />}
                onClick={() => exportPlayerList(tournament, t).then(r => r?.success && toast.success(t('print.exportSuccess')))}
                sx={{
                  px: 2.5,
                  py: 1,
                  fontSize: 14,
                  fontWeight: 500,
                  borderRadius: 2,
                  color: 'text.primary',
                  borderColor: 'grey.400',
                  bgcolor: 'background.paper',
                }}
              >
                {t('print.exportPlayerList')}
              </Button>
            </>
          )}
          <Button
            variant="outlined"
            startIcon={<FileUploadOutlinedIcon />}
            onClick={handleImport}
            disabled={isStarted}
            sx={{
              px: 2.5,
              py: 1,
              fontSize: 14,
              fontWeight: 500,
              borderRadius: 2,
              color: 'text.primary',
              borderColor: 'grey.400',
              bgcolor: 'background.paper',
            }}
          >
            {t('tournament.players.import')}
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenAdd}
            disabled={isStarted}
            sx={{
              px: 3,
              py: 1,
              fontSize: 14,
              fontWeight: 600,
              borderRadius: 2,
              background: isStarted ? undefined : 'linear-gradient(135deg, #0EA5E9, #0284C7)',
              '&:hover': {
                background: isStarted ? undefined : 'linear-gradient(135deg, #0284C7, #0369A1)',
              },
            }}
          >
            {t('tournament.players.add')}
          </Button>
        </Stack>
      </Box>

      {/* 选手列表 */}
      {players.length === 0 ? (
        <EmptyState
          icon={PersonOutlineIcon}
          title={t('tournament.players.empty')}
          description={t('tournament.players.emptyHint')}
        />
      ) : (
        <Box sx={{
          border: 1,
          borderColor: 'divider',
          borderRadius: 3,
          overflow: 'hidden',
          bgcolor: 'background.paper',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}>
          {/* 表头 */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            px: 3,
            py: 2,
            bgcolor: 'action.hover',
            borderBottom: 1,
            borderColor: 'divider',
            gap: 1,
          }}>
            {[
              { key: 'seed', width: 48 },
              { key: 'name', flex: 1.5 },
              { key: 'gender', width: 60 },
              { key: 'title', flex: 0.8 },
              { key: 'rating', flex: 0.7 },
              { key: 'organization', flex: 1 },
              { key: 'phone', flex: 1 },
              { key: 'status', width: 72, align: 'center' },
            ].map((col) => (
              <Typography
                key={col.key}
                sx={{
                  ...(col.width ? { width: col.width } : { flex: col.flex }),
                  fontSize: 13, fontWeight: 700, color: 'text.secondary',
                  textAlign: col.align || 'left',
                }}
              >
                {t(`tournament.players.col.${col.key}`)}
              </Typography>
            ))}
            <Box sx={{ width: 40 }} />
          </Box>

          {/* 数据行 */}
          {players.map((player, index) => {
            const isWithdrawn = player.status === 'withdrawn';
            return (
            <Box
              key={player.id}
              onClick={() => setDetailPlayer(player)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                px: 3,
                py: 2.2,
                gap: 1,
                borderBottom: index < players.length - 1 ? 1 : 0,
                borderColor: 'divider',
                cursor: 'pointer',
                transition: 'background 0.1s',
                opacity: isWithdrawn ? 0.45 : 1,
                '&:hover': { bgcolor: 'action.hover', opacity: isWithdrawn ? 0.65 : 1 },
              }}
            >
              <Typography sx={{ width: 48, fontSize: 14, color: 'text.disabled', fontWeight: 700 }}>
                {player.seed}
              </Typography>
              <Typography sx={{ flex: 1.5, fontSize: 15, fontWeight: 600, color: 'text.primary' }}>
                {player.name}
              </Typography>
              <Typography sx={{ width: 60, fontSize: 14, color: 'text.secondary' }}>
                {player.gender ? t(`tournament.players.gender.${player.gender}`) : '—'}
              </Typography>
              <Typography sx={{ flex: 0.8, fontSize: 14, color: 'text.secondary' }}>
                {player.title || '—'}
              </Typography>
              <Typography sx={{ flex: 0.7, fontSize: 14, color: 'text.secondary', fontFamily: 'monospace' }}>
                {player.rating || '—'}
              </Typography>
              <Typography sx={{ flex: 1, fontSize: 14, color: 'text.secondary' }}>
                {player.organization || '—'}
              </Typography>
              <Typography sx={{ flex: 1, fontSize: 14, color: 'text.secondary' }}>
                {player.phone || '—'}
              </Typography>
              <Box sx={{ width: 72, display: 'flex', justifyContent: 'center' }}>
                <Chip
                  label={t(`tournament.players.status.${player.status}`)}
                  size="small"
                  sx={{
                    fontSize: 12,
                    fontWeight: 600,
                    height: 24,
                    ...(player.status === 'active'
                      ? { bgcolor: 'success.light', color: 'success.main' }
                      : { bgcolor: 'error.light', color: 'error.main' }
                    ),
                  }}
                />
              </Box>
              <IconButton
                size="small"
                onClick={(e) => { e.stopPropagation(); handleOpenMenu(e, player); }}
                sx={{ width: 40, color: 'text.disabled' }}
              >
                <MoreVertIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Box>
            );
          })}
        </Box>
      )}

      {/* 操作菜单 */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleCloseMenu}
      >
        <MenuItem onClick={handleOpenEdit} sx={{ fontSize: 13, gap: 1.5 }}>
          <ListItemIcon sx={{ minWidth: 'auto' }}>
            <EditOutlinedIcon sx={{ fontSize: 18 }} />
          </ListItemIcon>
          <ListItemText>{t('tournament.players.edit')}</ListItemText>
        </MenuItem>
        {menuPlayer?.status === 'active' ? (
          <MenuItem onClick={handleOpenWithdraw} sx={{ fontSize: 13, gap: 1.5, color: 'warning.main' }}>
            <ListItemIcon sx={{ minWidth: 'auto', color: 'warning.main' }}>
              <PersonOffOutlinedIcon sx={{ fontSize: 18 }} />
            </ListItemIcon>
            <ListItemText>{t('tournament.players.withdraw')}</ListItemText>
          </MenuItem>
        ) : menuPlayer?.status === 'withdrawn' ? (
          <MenuItem onClick={handleOpenWithdraw} sx={{ fontSize: 13, gap: 1.5, color: 'success.main' }}>
            <ListItemIcon sx={{ minWidth: 'auto', color: 'success.main' }}>
              <PersonAddAlt1OutlinedIcon sx={{ fontSize: 18 }} />
            </ListItemIcon>
            <ListItemText>{t('tournament.players.restore')}</ListItemText>
          </MenuItem>
        ) : null}
        {!isStarted && (
          <MenuItem onClick={handleOpenDelete} sx={{ fontSize: 13, gap: 1.5, color: 'error.main' }}>
            <ListItemIcon sx={{ minWidth: 'auto', color: 'error.main' }}>
              <DeleteOutlineIcon sx={{ fontSize: 18 }} />
            </ListItemIcon>
            <ListItemText>{t('common.delete')}</ListItemText>
          </MenuItem>
        )}
      </Menu>

      {/* 添加选手对话框 */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: 18, fontWeight: 600 }}>
          {t('tournament.players.add')}
        </DialogTitle>
        <DialogContent>
          <PlayerFormFields form={form} setForm={setForm} t={t} autoFocus />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAddOpen(false)} sx={{ fontSize: 14 }}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleAdd}
            variant="contained"
            disabled={!form.name.trim()}
            sx={{
              fontSize: 14,
              background: 'linear-gradient(135deg, #0EA5E9, #0284C7)',
              '&:hover': { background: 'linear-gradient(135deg, #0284C7, #0369A1)' },
            }}
          >
            {t('tournament.players.confirmAdd')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 编辑选手对话框 */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: 18, fontWeight: 600 }}>
          {t('tournament.players.edit')}
        </DialogTitle>
        <DialogContent>
          <PlayerFormFields form={editForm} setForm={setEditForm} t={t} autoFocus={false} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditOpen(false)} sx={{ fontSize: 14 }}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleEditSave}
            variant="contained"
            disabled={!editForm.name.trim()}
            sx={{
              fontSize: 14,
              background: 'linear-gradient(135deg, #0EA5E9, #0284C7)',
              '&:hover': { background: 'linear-gradient(135deg, #0284C7, #0369A1)' },
            }}
          >
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 退赛/恢复确认对话框 */}
      <Dialog open={Boolean(withdrawTarget)} onClose={() => setWithdrawTarget(null)} maxWidth="xs" fullWidth>
        {(() => {
          const isRestore = withdrawTarget?.status === 'withdrawn';
          return (
            <>
              <DialogTitle sx={{ fontSize: 18, fontWeight: 600 }}>
                {t(isRestore ? 'tournament.players.restore' : 'tournament.players.withdraw')}
              </DialogTitle>
              <DialogContent>
                <DialogContentText sx={{ fontSize: 14 }}>
                  {t(isRestore ? 'tournament.players.restoreMsg' : 'tournament.players.withdrawMsg', { name: withdrawTarget?.name })}
                </DialogContentText>
              </DialogContent>
              <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={() => setWithdrawTarget(null)} sx={{ fontSize: 14 }}>
                  {t('common.cancel')}
                </Button>
                <Button
                  onClick={handleWithdraw}
                  color={isRestore ? 'success' : 'warning'}
                  variant="contained"
                  sx={{ fontSize: 14 }}
                >
                  {t(isRestore ? 'tournament.players.restore' : 'tournament.players.withdraw')}
                </Button>
              </DialogActions>
            </>
          );
        })()}
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: 18, fontWeight: 600 }}>
          {t('tournament.players.deleteTitle')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: 14 }}>
            {t('tournament.players.deleteMsg', { name: deleteTarget?.name })}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteTarget(null)} sx={{ fontSize: 14 }}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            sx={{ fontSize: 14 }}
          >
            {t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 选手详情弹窗 */}
      <Dialog open={Boolean(detailPlayer)} onClose={() => setDetailPlayer(null)} maxWidth="xs" fullWidth>
        {detailPlayer && (
          <>
            <DialogTitle sx={{ fontSize: 18, fontWeight: 600, pb: 0 }}>
              {detailPlayer.name}
              <Box sx={{ display: 'inline-flex', ml: 1.5, verticalAlign: 'middle' }}>
                <Chip
                  label={t(`tournament.players.status.${detailPlayer.status}`)}
                  size="small"
                  sx={{
                    fontSize: 11, fontWeight: 500, height: 22,
                    ...(detailPlayer.status === 'active'
                      ? { bgcolor: 'success.light', color: 'success.main' }
                      : { bgcolor: 'error.light', color: 'error.main' }
                    ),
                  }}
                />
              </Box>
            </DialogTitle>
            <DialogContent>
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: '100px 1fr',
                gap: 1.5,
                mt: 2,
              }}>
                {[
                  { label: 'seed', value: detailPlayer.seed },
                  { label: 'gender', value: detailPlayer.gender ? t(`tournament.players.gender.${detailPlayer.gender}`) : null },
                  { label: 'birthDate', value: detailPlayer.birthDate },
                  { label: 'title', value: detailPlayer.title },
                  { label: 'rating', value: detailPlayer.rating || null },
                  { label: 'organization', value: detailPlayer.organization },
                  { label: 'phone', value: detailPlayer.phone },
                  { label: 'notes', value: detailPlayer.notes },
                ].map(({ label, value }) => (
                  <Box key={label} sx={{ display: 'contents' }}>
                    <Typography sx={{ fontSize: 13, color: 'text.disabled', fontWeight: 500 }}>
                      {t(`tournament.players.col.${label}`)}
                    </Typography>
                    <Typography sx={{ fontSize: 14, color: value ? 'text.primary' : 'text.disabled' }}>
                      {value || '—'}
                    </Typography>
                  </Box>
                ))}
              </Box>
              {detailPlayer.createdAt && (
                <Typography sx={{ fontSize: 12, color: 'text.disabled', mt: 2.5 }}>
                  {t('tournament.players.registeredAt')} {new Date(detailPlayer.createdAt).toLocaleString()}
                </Typography>
              )}
            </DialogContent>
            {tournament.currentRound > 0 && (
              <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button
                  startIcon={<PrintOutlinedIcon />}
                  onClick={() => printPlayerCard(tournament, detailPlayer.id, t, formatScore)}
                  sx={{ fontSize: 13, color: 'text.secondary' }}
                >
                  {t('print.printPlayerCard')}
                </Button>
              </DialogActions>
            )}
          </>
        )}
      </Dialog>

      <ImportPreviewDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        importRows={importRows}
        importHeaders={importHeaders}
        importMapping={importMapping}
        setImportMapping={setImportMapping}
        onConfirm={handleImportConfirm}
        t={t}
      />
    </Box>
  );
}

// resultColors 已移至 src/components/ResultDialog.js，通过具名导入使用

function resultLabel(result, t) {
  if (result === '0.5-0.5') return '\u00BD-\u00BD';
  if (result === '1-0F') return `1-0(${t('tournament.rounds.forfeit')})`;
  if (result === '0F-1') return `0-1(${t('tournament.rounds.forfeit')})`;
  if (result === '0F-0F') return t('tournament.rounds.doubleForfeit');
  return result;
}

// ── 结果输入组件（当前轮） ──

function ResultInput({ result, notes, allowDraw, onSelect, onOpenDialog, t }) {
  const options = [
    { value: '1-0', label: '1-0' },
    ...(allowDraw ? [{ value: '0.5-0.5', label: '\u00BD-\u00BD' }] : []),
    { value: '0-1', label: '0-1' },
  ];

  if (result) {
    return (
      <Stack direction="row" spacing={0.5} alignItems="center">
        <Chip
          label={resultLabel(result, t)}
          sx={{
            fontSize: 15,
            fontWeight: 700,
            height: 32,
            px: 1,
            ...resultColors(result),
          }}
        />
        <IconButton size="small" onClick={onOpenDialog} sx={{ color: 'text.disabled' }}>
          <EditOutlinedIcon sx={{ fontSize: 16 }} />
        </IconButton>
        {notes && (
          <Tooltip title={notes} arrow>
            <ChatBubbleOutlineIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
          </Tooltip>
        )}
      </Stack>
    );
  }

  return (
    <Stack direction="row" spacing={0.8} alignItems="center">
      {options.map((opt) => (
        <Button
          key={opt.value}
          variant="outlined"
          onClick={() => onSelect(opt.value)}
          sx={{
            minWidth: 52,
            px: 1.5,
            py: 0.8,
            fontSize: 14,
            fontWeight: 700,
            color: 'text.secondary',
            borderColor: 'divider',
            borderRadius: 1.5,
            '&:hover': {
              borderColor: 'primary.main',
              bgcolor: 'primary.light',
              transform: 'scale(1.05)',
            },
            transition: 'all 0.15s',
          }}
        >
          {opt.label}
        </Button>
      ))}
      <IconButton size="small" onClick={onOpenDialog} sx={{ color: 'text.disabled' }}>
        <MoreHorizIcon sx={{ fontSize: 18 }} />
      </IconButton>
    </Stack>
  );
}

// ResultDialog 已移至 src/components/ResultDialog.js

// ── 结果展示组件（历史轮，只读） ──

function ResultDisplay({ result, notes, t }) {
  if (!result || result === 'bye') return null;
  if (result === 'hbye') {
    return (
      <Stack direction="row" spacing={0.5} alignItems="center">
        <Chip
          label={t('tournament.rounds.halfByeChip')}
          sx={{ fontSize: 13, fontWeight: 600, height: 32, ...resultColors('hbye') }}
        />
        {notes && (
          <Tooltip title={notes} arrow>
            <ChatBubbleOutlineIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
          </Tooltip>
        )}
      </Stack>
    );
  }

  return (
    <Stack direction="row" spacing={0.5} alignItems="center">
      <Chip
        label={resultLabel(result, t)}
        sx={{
          fontSize: 15,
          fontWeight: 700,
          height: 32,
          px: 1,
          ...resultColors(result),
        }}
      />
      {notes && (
        <Tooltip title={notes} arrow>
          <ChatBubbleOutlineIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
        </Tooltip>
      )}
    </Stack>
  );
}

// ── 轮次编排面板 ──

function RoundsPanel({ tournament, onUpdate }) {
  const { t } = useTranslation();

  const isEliminationFormat = ['elimination', 'double_elimination'].includes(tournament.format);
  const isRoundRobinFormat = ['round_robin', 'double_round_robin'].includes(tournament.format);
  const [viewMode, setViewMode] = useState(isEliminationFormat ? 'bracket' : 'table');

  const [viewRound, setViewRound] = useState(tournament.currentRound || 1);
  const [errorsOpen, setErrorsOpen] = useState(false);
  const [errors, setErrors] = useState([]);
  const [undoOpen, setUndoOpen] = useState(false);
  const [undoAllOpen, setUndoAllOpen] = useState(false);
  const [clearResultsOpen, setClearResultsOpen] = useState(false);
  const [hbyeOpen, setHbyeOpen] = useState(false);
  const [resultDialogData, setResultDialogData] = useState(null); // { pairing, playerA, playerB }

  // 当 currentRound 变化时同步 viewRound
  // 循环赛一次性生成所有轮次，保持显示第 1 轮，不自动跳到末轮
  useEffect(() => {
    if (tournament.currentRound > 0 && !isRoundRobinFormat) {
      setViewRound(tournament.currentRound);
    }
  }, [tournament.currentRound]);

  const handleGenerateRound = () => {
    const validationErrors = [];
    const active = tournament.activePlayers;

    if (active.length < 2) {
      validationErrors.push(t('tournament.rounds.error.tooFewPlayers'));
    }
    if (!tournament.format) {
      validationErrors.push(t('tournament.rounds.error.noFormat'));
    }
    if (tournament.currentRound > 0 && !tournament.isRoundComplete(tournament.currentRound)) {
      validationErrors.push(t('tournament.rounds.error.incompleteRound'));
    }

    const effectiveTotalRounds = tournament.totalRounds || Math.ceil(Math.log2(Math.max(2, active.length)));
    if (tournament.currentRound >= effectiveTotalRounds || tournament.status === 'completed') {
      validationErrors.push(t('tournament.rounds.error.allRoundsCompleted'));
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      setErrorsOpen(true);
      return;
    }

    try {
      onUpdate((inst) => {
        inst.generateNextRound();
      }, { silent: true });
      toast.success(t('tournament.rounds.generateSuccess'));
    } catch (err) {
      toast.error(err.message || t('tournament.rounds.generateFailed'));
    }
  };

  // 循环赛专用：一次性生成所有轮次
  const handleGenerateAllRounds = () => {
    const validationErrors = [];
    const active = tournament.activePlayers;
    if (active.length < 3) validationErrors.push(t('tournament.rounds.error.tooFewPlayers'));
    if (!tournament.format) validationErrors.push(t('tournament.rounds.error.noFormat'));

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      setErrorsOpen(true);
      return;
    }
    try {
      onUpdate((inst) => { inst.generateAllRounds(); }, { silent: true });
      toast.success(t('tournament.rounds.generateAllSuccess'));
    } catch (err) {
      toast.error(err.message || t('tournament.rounds.generateFailed'));
    }
  };

  const safeViewRound = Math.min(viewRound, Math.max(1, tournament.currentRound));
  const round = tournament.currentRound > 0 ? tournament.getRound(safeViewRound) : null;
  // 循环赛所有轮次均可录入成绩；其他赛制仅当前轮可录入
  const isCurrentRound = safeViewRound === tournament.currentRound;
  const canEnterResults = isCurrentRound || isRoundRobinFormat;

  const effectiveTotalRounds = tournament.totalRounds || Math.ceil(Math.log2(Math.max(2, tournament.activePlayers.length)));
  const isLastRound = tournament.currentRound >= effectiveTotalRounds || tournament.status === 'completed';

  return (
    <Box sx={{ maxWidth: 960 }}>
      {/* 标题栏 */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography sx={{ fontSize: 22, fontWeight: 700, color: 'text.primary' }}>
            {t('tournament.nav.rounds')}
          </Typography>
          <Typography sx={{ fontSize: 13, color: 'text.disabled', mt: 0.5 }}>
            {t('tournament.currentRoundInfo', { count: tournament.currentRound })}
          </Typography>
        </Box>
        {tournament.currentRound > 0 && (
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              startIcon={<PrintOutlinedIcon />}
              onClick={() => printRoundPairings(tournament, safeViewRound, t)}
              sx={{
                px: 2.5,
                py: 1,
                fontSize: 14,
                fontWeight: 500,
                borderRadius: 2,
                color: 'text.primary',
                borderColor: 'grey.400',
                bgcolor: 'background.paper',
              }}
            >
              {t('print.printRound')}
            </Button>
            <Button
              variant="outlined"
              startIcon={<FileDownloadOutlinedIcon />}
              onClick={() => exportRoundPairings(tournament, safeViewRound, t).then(r => r?.success && toast.success(t('print.exportSuccess')))}
              sx={{
                px: 2.5,
                py: 1,
                fontSize: 14,
                fontWeight: 500,
                borderRadius: 2,
                color: 'text.primary',
                borderColor: 'grey.400',
                bgcolor: 'background.paper',
              }}
            >
              {t('print.exportRound')}
            </Button>
          </Stack>
        )}
      </Box>

      {/* 空状态 */}
      {tournament.currentRound === 0 ? (
        <Box sx={{
          py: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          color: 'text.disabled',
        }}>
          <ViewListOutlinedIcon sx={{ fontSize: 48, opacity: 0.4 }} />
          <Typography sx={{ fontSize: 15, fontWeight: 500 }}>
            {t('tournament.rounds.empty')}
          </Typography>
          <Typography sx={{ fontSize: 13 }}>
            {t('tournament.rounds.emptyHint')}
          </Typography>
          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            {/* 半分轮空仅瑞士制支持 */}
            {tournament.format === 'swiss' && (
              <Button
                variant="outlined"
                onClick={() => setHbyeOpen(true)}
                sx={{
                  px: 3,
                  py: 1.5,
                  fontSize: 14,
                  borderRadius: 2,
                  color: tournament.halfPointByes.size > 0 ? 'primary.main' : 'text.primary',
                  borderColor: tournament.halfPointByes.size > 0 ? 'primary.main' : 'grey.400',
                  bgcolor: 'background.paper',
                }}
              >
                {t('tournament.rounds.halfByeNext')}
                {tournament.halfPointByes.size > 0 && ` (${tournament.halfPointByes.size})`}
              </Button>
            )}
            <Button
              variant="contained"
              onClick={isRoundRobinFormat ? handleGenerateAllRounds : handleGenerateRound}
              sx={{
                px: 4,
                py: 1.5,
                fontSize: 15,
                fontWeight: 600,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                '&:hover': { background: 'linear-gradient(135deg, #D97706, #B45309)' },
              }}
            >
              {isRoundRobinFormat
                ? t('tournament.rounds.generateAll')
                : t('tournament.rounds.startPairing')}
            </Button>
          </Stack>
        </Box>
      ) : (
        <>
          {/* 轮次导航 Tabs + 视图切换 */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Tabs
              value={safeViewRound - 1}
              onChange={(_, v) => setViewRound(v + 1)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                flex: 1,
                '& .MuiTab-root': {
                  minHeight: 48,
                  py: 1.5,
                  px: 2.5,
                  fontSize: 15,
                  textTransform: 'none',
                  fontWeight: 500,
                },
                '& .Mui-selected': { fontWeight: 700 },
              }}
            >
              {Array.from({ length: tournament.currentRound }, (_, i) => (
                <Tab
                  key={i + 1}
                  label={t('tournament.rounds.roundLabel', { number: i + 1 })}
                  icon={
                    tournament.isRoundComplete(i + 1)
                      ? <CheckCircleOutlineIcon sx={{ fontSize: 18, color: 'success.main' }} />
                      : undefined
                  }
                  iconPosition="end"
                />
              ))}
            </Tabs>

            {/* 签表/表格切换（仅淘汰赛显示） */}
            {isEliminationFormat && (
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(_, val) => val && setViewMode(val)}
                size="small"
                sx={{ ml: 2, flexShrink: 0 }}
              >
                <ToggleButton value="table" aria-label={t('tournament.rounds.viewTable')}>
                  <Tooltip title={t('tournament.rounds.viewTable')}>
                    <TableRowsOutlinedIcon sx={{ fontSize: 18 }} />
                  </Tooltip>
                </ToggleButton>
                <ToggleButton value="bracket" aria-label={t('tournament.rounds.viewBracket')}>
                  <Tooltip title={t('tournament.rounds.viewBracket')}>
                    <AccountTreeOutlinedIcon sx={{ fontSize: 18 }} />
                  </Tooltip>
                </ToggleButton>
              </ToggleButtonGroup>
            )}
          </Box>

          {/* 签表视图 */}
          {isEliminationFormat && viewMode === 'bracket' && (
            <BracketView tournament={tournament} />
          )}

          {/* 配对表格 */}
          {(!isEliminationFormat || viewMode === 'table') && round && (
            <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 3, overflow: 'hidden', bgcolor: 'background.paper', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              {/* 表头 */}
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                px: 3,
                py: 2,
                bgcolor: 'action.hover',
                borderBottom: 1,
                borderColor: 'divider',
              }}>
                <Typography sx={{ width: 56, fontSize: 13, fontWeight: 600, color: 'text.disabled' }}>
                  {t('tournament.rounds.col.table')}
                </Typography>
                <Typography sx={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'text.disabled', textAlign: 'right', pr: 3 }}>
                  {tournament.colorBalance ? t('tournament.rounds.col.white') : t('tournament.rounds.col.playerA')}
                </Typography>
                <Typography sx={{ width: 180, fontSize: 13, fontWeight: 600, color: 'text.disabled', textAlign: 'center' }}>
                  {t('tournament.rounds.col.result')}
                </Typography>
                <Typography sx={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'text.disabled', pl: 3 }}>
                  {tournament.colorBalance ? t('tournament.rounds.col.black') : t('tournament.rounds.col.playerB')}
                </Typography>
              </Box>

              {/* 对阵行 */}
              {round.pairings.map((pairing, index) => {
                const playerA = tournament.getPlayer(pairing.playerAId);
                const playerB = pairing.playerBId ? tournament.getPlayer(pairing.playerBId) : null;
                const isBye = !playerB && pairing.result !== 'hbye';
                const isHbye = pairing.result === 'hbye';

                return (
                  <Box
                    key={pairing.tableNumber}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      px: 3,
                      py: 2.2,
                      borderBottom: index < round.pairings.length - 1 ? 1 : 0,
                      borderColor: 'divider',
                      transition: 'background 0.1s',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    {/* 台号 */}
                    <Typography sx={{ width: 56, fontSize: 16, fontWeight: 700, color: 'text.disabled' }}>
                      {pairing.tableNumber}
                    </Typography>

                    {/* A 方 */}
                    <Box sx={{ flex: 1, textAlign: 'right', pr: 3 }}>
                      <Typography sx={{
                        fontSize: 16,
                        fontWeight: (pairing.result === '1-0' || pairing.result === '1-0F' || (pairing.result === 'bye' && !isHbye)) ? 700 : 500,
                        color: 'text.primary',
                      }}>
                        {playerA.name}
                      </Typography>
                      {playerA.rating > 0 && (
                        <Typography sx={{ fontSize: 12, color: 'text.disabled', mt: 0.3 }}>
                          {playerA.rating}
                        </Typography>
                      )}
                    </Box>

                    {/* 结果 */}
                    <Box sx={{ width: 220, display: 'flex', justifyContent: 'center' }}>
                      {isHbye ? (
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <Chip
                            label={t('tournament.rounds.halfByeChip')}
                            sx={{ fontSize: 13, fontWeight: 600, height: 32, ...resultColors('hbye') }}
                          />
                          {pairing.notes && (
                            <Tooltip title={pairing.notes} arrow>
                              <ChatBubbleOutlineIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                            </Tooltip>
                          )}
                        </Stack>
                      ) : isBye ? (
                        <Chip
                          label={t('tournament.rounds.bye')}
                          sx={{ fontSize: 13, fontWeight: 600, height: 32, bgcolor: 'action.hover', color: 'text.secondary' }}
                        />
                      ) : canEnterResults ? (
                        <ResultInput
                          result={pairing.result}
                          notes={pairing.notes}
                          allowDraw={tournament.allowDraw}
                          onSelect={(result) => {
                            onUpdate((inst) => {
                              inst.setResult(safeViewRound, pairing.tableNumber, result);
                            }, { silent: true });
                          }}
                          onOpenDialog={() => setResultDialogData({ pairing, playerA, playerB })}
                          t={t}
                        />
                      ) : (
                        <ResultDisplay result={pairing.result} notes={pairing.notes} t={t} />
                      )}
                    </Box>

                    {/* B 方 */}
                    <Box sx={{ flex: 1, pl: 3 }}>
                      {playerB ? (
                        <>
                          <Typography sx={{
                            fontSize: 16,
                            fontWeight: (pairing.result === '0-1' || pairing.result === '0F-1') ? 700 : 500,
                            color: 'text.primary',
                          }}>
                            {playerB.name}
                          </Typography>
                          {playerB.rating > 0 && (
                            <Typography sx={{ fontSize: 12, color: 'text.disabled', mt: 0.3 }}>
                              {playerB.rating}
                            </Typography>
                          )}
                        </>
                      ) : (
                        <Typography sx={{ fontSize: 16, color: 'text.disabled' }}>--</Typography>
                      )}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}

          {/* 底部操作栏 */}
          {round && (
            <Stack spacing={2.5} sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: 'divider' }}>
              {/* 第一行：本轮状态与操作 */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography sx={{ fontSize: 14, color: 'text.disabled' }}>
                  {(() => {
                    const games = round.pairings.filter(p => p.playerBId !== null);
                    return t('tournament.rounds.progress', {
                      completed: games.filter(p => p.result !== null).length,
                      total: games.length,
                    });
                  })()}
                </Typography>
                <Stack direction="row" spacing={1.5}>
                  {/* 循环赛：任意轮有成绩均可清除；其他赛制：仅当前轮 */}
                  {(isRoundRobinFormat || isCurrentRound) && round.pairings.some(p => p.result !== null && p.result !== 'bye' && p.result !== 'hbye') && (
                    <Button
                      variant="outlined"
                      onClick={() => setClearResultsOpen(true)}
                      sx={{
                        fontSize: 13,
                        px: 2,
                        py: 0.8,
                        borderRadius: 2,
                        color: 'text.primary',
                        borderColor: 'grey.400',
                        bgcolor: 'background.paper',
                      }}
                    >
                      {t('tournament.rounds.clearResults')}
                    </Button>
                  )}
                  {/* 循环赛：撤回全部；其他赛制：撤回本轮 */}
                  {isRoundRobinFormat ? (
                    <Button
                      variant="outlined"
                      onClick={() => setUndoAllOpen(true)}
                      sx={{
                        fontSize: 13,
                        px: 2,
                        py: 0.8,
                        borderRadius: 2,
                        color: 'error.main',
                        borderColor: 'error.main',
                        '&:hover': { bgcolor: 'error.light' },
                      }}
                    >
                      {t('tournament.rounds.undoAllRounds')}
                    </Button>
                  ) : (
                    <Button
                      variant="outlined"
                      onClick={() => setUndoOpen(true)}
                      sx={{
                        fontSize: 13,
                        px: 2,
                        py: 0.8,
                        borderRadius: 2,
                        color: 'error.main',
                        borderColor: 'error.main',
                        '&:hover': { bgcolor: 'error.light' },
                      }}
                    >
                      {t('tournament.rounds.undoRound')}
                    </Button>
                  )}
                </Stack>
              </Box>

              {/* 第二行：下一轮操作（仅非循环赛格式；当前轮完成后显示） */}
              {!isRoundRobinFormat && isCurrentRound && tournament.isRoundComplete(safeViewRound) && (
                isLastRound ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <Chip
                      icon={<CheckCircleOutlineIcon />}
                      label={t('tournament.rounds.lastRound')}
                      color="success"
                      variant="outlined"
                      sx={{ fontSize: 14, fontWeight: 600, py: 2.2 }}
                    />
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2 }}>
                    {/* 半分轮空仅瑞士制支持 */}
                    {tournament.format === 'swiss' && (
                      <Button
                        variant="outlined"
                        onClick={() => setHbyeOpen(true)}
                        sx={{
                          fontSize: 14,
                          px: 2.5,
                          py: 1,
                          borderRadius: 2,
                          color: tournament.halfPointByes.size > 0 ? 'primary.main' : 'text.primary',
                          borderColor: tournament.halfPointByes.size > 0 ? 'primary.main' : 'grey.400',
                          bgcolor: 'background.paper',
                        }}
                      >
                        {t('tournament.rounds.halfByeNext')}
                        {tournament.halfPointByes.size > 0 && ` (${tournament.halfPointByes.size})`}
                      </Button>
                    )}
                    <Button
                      variant="contained"
                      onClick={handleGenerateRound}
                      sx={{
                        fontSize: 15,
                        fontWeight: 600,
                        px: 4,
                        py: 1.2,
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                        '&:hover': { background: 'linear-gradient(135deg, #D97706, #B45309)' },
                      }}
                    >
                      {t('tournament.rounds.generateNext')}
                    </Button>
                  </Box>
                )
              )}
            </Stack>
          )}
        </>
      )}

      {/* 校验错误对话框 */}
      <Dialog open={errorsOpen} onClose={() => setErrorsOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: 18, fontWeight: 600 }}>
          {t('tournament.rounds.validationTitle')}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={1}>
            {errors.map((err, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <ErrorOutlineIcon sx={{ fontSize: 18, color: 'error.main', mt: 0.3 }} />
                <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>{err}</Typography>
              </Box>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setErrorsOpen(false)} sx={{ fontSize: 14 }}>
            {t('common.cancel')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 撤回确认对话框 */}
      <ConfirmDialog
        open={undoOpen}
        onClose={() => setUndoOpen(false)}
        onConfirm={() => {
          onUpdate((inst) => { inst.undoLastRound(); }, { silent: true });
          toast.success(t('tournament.rounds.undoSuccess'));
        }}
        title={t('tournament.rounds.undoTitle')}
        message={t('tournament.rounds.undoMessage', { round: tournament.currentRound })}
        confirmLabel={t('tournament.rounds.undoConfirm')}
        cancelLabel={t('common.cancel')}
        confirmColor="warning"
      />

      {/* 撤回全部编排确认对话框（循环赛专用） */}
      <ConfirmDialog
        open={undoAllOpen}
        onClose={() => setUndoAllOpen(false)}
        onConfirm={() => {
          onUpdate((inst) => { inst.undoAllRounds(); }, { silent: true });
          toast.success(t('tournament.rounds.undoAllSuccess'));
        }}
        title={t('tournament.rounds.undoAllTitle')}
        message={t('tournament.rounds.undoAllMessage', { name: tournament.name })}
        confirmLabel={t('tournament.rounds.undoAllConfirm')}
        cancelLabel={t('common.cancel')}
        confirmColor="error"
      />

      {/* 清除成绩确认对话框 */}
      <ConfirmDialog
        open={clearResultsOpen}
        onClose={() => setClearResultsOpen(false)}
        onConfirm={() => {
          onUpdate((inst) => { inst.clearRoundResults(safeViewRound); }, { silent: true });
          toast.success(t('tournament.rounds.clearResultsSuccess'));
        }}
        title={t('tournament.rounds.clearResultsTitle')}
        message={t('tournament.rounds.clearResultsMessage', { round: safeViewRound })}
        confirmLabel={t('tournament.rounds.clearResultsConfirm')}
        cancelLabel={t('common.cancel')}
        confirmColor="warning"
      />

      {/* 半分轮空对话框 */}
      <Dialog open={hbyeOpen} onClose={() => setHbyeOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: 18, fontWeight: 600 }}>
          {t('tournament.rounds.halfBye')}
        </DialogTitle>
        <DialogContent>
          <Box sx={{
            px: 2, py: 1.5, mb: 2, borderRadius: 2,
            bgcolor: 'action.hover', border: 1, borderColor: 'divider',
          }}>
            <Typography sx={{ fontSize: 13, color: 'text.secondary', lineHeight: 1.7 }}>
              {t('tournament.rounds.halfByeDesc')}
            </Typography>
            <Typography sx={{ fontSize: 12, color: 'primary.main', fontWeight: 600, mt: 1 }}>
              {t('tournament.rounds.halfByeCompare')}
            </Typography>
          </Box>
          <Typography sx={{ fontSize: 13, color: 'text.secondary', mb: 1.5 }}>
            {t('tournament.rounds.halfByeHint')}
          </Typography>
          <Stack spacing={0.5}>
            {tournament.activePlayers.map((player) => {
              const checked = tournament.halfPointByes.has(player.id);
              return (
                <FormControlLabel
                  key={player.id}
                  control={
                    <Checkbox
                      checked={checked}
                      onChange={() => {
                        onUpdate((inst) => {
                          if (checked) inst.cancelHalfPointBye(player.id);
                          else inst.requestHalfPointBye(player.id);
                        }, { silent: true });
                      }}
                      sx={{ color: 'primary.main', '&.Mui-checked': { color: 'primary.main' } }}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography sx={{ fontSize: 14, fontWeight: 500 }}>
                        {player.name}
                      </Typography>
                      {player.rating > 0 && (
                        <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>
                          {player.rating}
                        </Typography>
                      )}
                    </Box>
                  }
                  sx={{ mx: 0, py: 0.3 }}
                />
              );
            })}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setHbyeOpen(false)} sx={{ fontSize: 14 }}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={() => setHbyeOpen(false)}
            variant="contained"
            sx={{
              fontSize: 14,
              background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
              '&:hover': { background: 'linear-gradient(135deg, #4F46E5, #4338CA)' },
            }}
          >
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 成绩录入/编辑弹窗 */}
      <ResultDialog
        open={Boolean(resultDialogData)}
        onClose={() => setResultDialogData(null)}
        pairing={resultDialogData?.pairing}
        playerA={resultDialogData?.playerA}
        playerB={resultDialogData?.playerB}
        allowDraw={tournament.allowDraw}
        colorBalance={tournament.colorBalance}
        onSave={({ result, notes }) => {
          if (!resultDialogData) return;
          const { pairing: p } = resultDialogData;
          onUpdate((inst) => {
            if (result) {
              inst.setResult(safeViewRound, p.tableNumber, result);
            } else {
              inst.clearResult(safeViewRound, p.tableNumber);
            }
            inst.setResultNote(safeViewRound, p.tableNumber, notes);
          }, { silent: true });
        }}
        t={t}
      />
    </Box>
  );
}

// ── 积分格式化（×2 整数体系 → 展示值） ──

function formatScore(raw, scoring) {
  if (scoring.win === 2 && scoring.draw === 1) {
    // 标准 ×2 体系：除以 2 展示
    const val = raw / 2;
    return Number.isInteger(val) ? String(val) + '.0' : val.toFixed(1);
  }
  return String(raw);
}

function formatTb(raw, tbKey, scoring) {
  if (scoring.win === 2 && scoring.draw === 1) {
    // SB 使用 fraction(0-1) × rawScore，结果不需要额外换算
    if (tbKey === 'wins' || tbKey === 'black') return String(raw);
    const val = raw / 2;
    return Number.isInteger(val) ? String(val) + '.0' : val.toFixed(1);
  }
  if (tbKey === 'wins' || tbKey === 'black') return String(raw);
  return typeof raw === 'number' && !Number.isInteger(raw) ? raw.toFixed(1) : String(raw);
}

// ── 排名成绩面板 ──

function RankingsPanel({ tournament }) {
  const { t } = useTranslation();
  const rankings = tournament.getRankings();
  const scoring = tournament.scoring;
  const tbKeys = tournament.tiebreakers;
  const isElimination = ['elimination', 'double_elimination'].includes(tournament.format);

  const hasResults = tournament.currentRound > 0 && rankings.some(r => r.score > 0 || r.results.length > 0);

  return (
    <Box sx={{ maxWidth: 960 }}>
      {/* 标题 */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography sx={{ fontSize: 22, fontWeight: 700, color: 'text.primary' }}>
            {t('tournament.rankings.title')}
          </Typography>
          <Typography sx={{ fontSize: 13, color: 'text.disabled', mt: 0.5 }}>
            {t('tournament.playersCount', { count: tournament.activePlayers.length })}
          </Typography>
        </Box>
        {hasResults && (
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button
              variant="outlined"
              startIcon={<PrintOutlinedIcon />}
              onClick={() => printRankings(tournament, t, formatScore, formatTb)}
              sx={{
                px: 2,
                py: 1,
                fontSize: 13,
                fontWeight: 500,
                borderRadius: 2,
                color: 'text.primary',
                borderColor: 'grey.400',
                bgcolor: 'background.paper',
              }}
            >
              {t('print.printRankings')}
            </Button>
            <Button
              variant="outlined"
              startIcon={<FileDownloadOutlinedIcon />}
              onClick={() => exportRankings(tournament, t, formatScore, formatTb).then(r => r?.success && toast.success(t('print.exportSuccess')))}
              sx={{
                px: 2,
                py: 1,
                fontSize: 13,
                fontWeight: 500,
                borderRadius: 2,
                color: 'text.primary',
                borderColor: 'grey.400',
                bgcolor: 'background.paper',
              }}
            >
              {t('print.exportRankings')}
            </Button>
            <Button
              variant="outlined"
              startIcon={<PrintOutlinedIcon />}
              onClick={() => printCrossTable(tournament, t, formatScore)}
              sx={{
                px: 2,
                py: 1,
                fontSize: 13,
                fontWeight: 500,
                borderRadius: 2,
                color: 'text.primary',
                borderColor: 'grey.400',
                bgcolor: 'background.paper',
              }}
            >
              {t('print.printCrossTable')}
            </Button>
            <Button
              variant="outlined"
              startIcon={<FileDownloadOutlinedIcon />}
              onClick={() => exportCrossTable(tournament, t, formatScore).then(r => r?.success && toast.success(t('print.exportSuccess')))}
              sx={{
                px: 2,
                py: 1,
                fontSize: 13,
                fontWeight: 500,
                borderRadius: 2,
                color: 'text.primary',
                borderColor: 'grey.400',
                bgcolor: 'background.paper',
              }}
            >
              {t('print.exportCrossTable')}
            </Button>
            {tournament.format === 'swiss' && (
              <Button
                variant="outlined"
                startIcon={<FileDownloadOutlinedIcon />}
                onClick={() => exportTRF(tournament).then(r => r?.success && toast.success(t('print.exportSuccess')))}
                sx={{
                  px: 2,
                  py: 1,
                  fontSize: 13,
                  fontWeight: 500,
                  borderRadius: 2,
                  color: 'text.primary',
                  borderColor: 'grey.400',
                  bgcolor: 'background.paper',
                }}
              >
                {t('print.exportTRF')}
              </Button>
            )}
          </Stack>
        )}
      </Box>

      {/* 空状态 */}
      {!hasResults ? (
        <EmptyState
          icon={EmojiEventsOutlinedIcon}
          title={t('tournament.rankings.empty')}
          description={t('tournament.rankings.emptyHint')}
        />
      ) : (
        <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 3, overflow: 'hidden', bgcolor: 'background.paper', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          {/* 表头 */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            px: 3,
            py: 2.2,
            bgcolor: 'action.hover',
            borderBottom: 1,
            borderColor: 'divider',
          }}>
            <Typography sx={{ width: 52, fontSize: 13, fontWeight: 700, color: 'text.secondary', textAlign: 'center' }}>
              {t('tournament.rankings.col.rank')}
            </Typography>
            <Typography sx={{ flex: 1, fontSize: 13, fontWeight: 700, color: 'text.secondary', pl: 1.5 }}>
              {t('tournament.rankings.col.name')}
            </Typography>
            <Typography sx={{ width: 76, fontSize: 13, fontWeight: 700, color: 'text.secondary', textAlign: 'center' }}>
              {t('tournament.rankings.col.score')}
            </Typography>
            <Typography sx={{ width: 44, fontSize: 13, fontWeight: 700, color: 'success.main', textAlign: 'center' }}>
              {t('tournament.rankings.col.win')}
            </Typography>
            {!isElimination && (
              <Typography sx={{ width: 44, fontSize: 13, fontWeight: 700, color: 'warning.main', textAlign: 'center' }}>
                {t('tournament.rankings.col.draw')}
              </Typography>
            )}
            <Typography sx={{ width: 44, fontSize: 13, fontWeight: 700, color: 'error.main', textAlign: 'center' }}>
              {t('tournament.rankings.col.loss')}
            </Typography>
            {!isElimination && tbKeys.map((key) => (
              <Typography
                key={key}
                sx={{
                  width: 76,
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'text.secondary',
                  textAlign: 'center',
                }}
              >
                {t(`settings.tb.${key}`)}
              </Typography>
            ))}
          </Box>

          {/* 数据行 */}
          {rankings.map((entry, index) => {
            const isTop3 = entry.rank <= 3;
            const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
            // 统计胜/平/负
            let wCount = 0, dCount = 0, lCount = 0;
            for (const r of entry.results) {
              if (r.result === '1-0' || r.result === '1-0F' || r.result === 'bye') wCount++;
              else if (r.result === '0.5-0.5' || r.result === 'hbye') dCount++;
              else if (r.result === '0-1' || r.result === '0F-1' || r.result === '0F-0F') lCount++;
            }
            return (
              <Box
                key={entry.player.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  px: 3,
                  py: 2.5,
                  borderBottom: index < rankings.length - 1 ? 1 : 0,
                  borderColor: 'divider',
                  transition: 'background 0.1s',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                {/* 名次 */}
                <Box sx={{ width: 52, display: 'flex', justifyContent: 'center' }}>
                  {isTop3 ? (
                    <Box sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      bgcolor: medalColors[entry.rank - 1],
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: 15,
                      fontWeight: 700,
                      boxShadow: `0 2px 6px ${medalColors[entry.rank - 1]}66`,
                    }}>
                      {entry.rank}
                    </Box>
                  ) : (
                    <Typography sx={{ fontSize: 17, fontWeight: 600, color: 'text.disabled' }}>
                      {entry.rank}
                    </Typography>
                  )}
                </Box>

                {/* 选手信息 */}
                <Box sx={{ flex: 1, pl: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography sx={{ fontSize: 16, fontWeight: isTop3 ? 700 : 500, color: 'text.primary' }}>
                      {entry.player.name}
                    </Typography>
                    {/* 淘汰赛冠/亚/季军标签 */}
                    {isElimination && isTop3 && (() => {
                      const labelMap = {
                        1: { text: t('tournament.rankings.champion'), color: '#FBBF24' },
                        2: { text: t('tournament.rankings.runnerUp'), color: '#9CA3AF' },
                        3: { text: t('tournament.rankings.thirdPlace'), color: '#CD7F32' },
                      };
                      const item = labelMap[entry.rank];
                      return item ? (
                        <Chip
                          label={item.text}
                          size="small"
                          sx={{
                            fontSize: 11,
                            fontWeight: 700,
                            height: 20,
                            bgcolor: `${item.color}22`,
                            color: item.color,
                            border: `1px solid ${item.color}55`,
                            borderRadius: 1,
                          }}
                        />
                      ) : null;
                    })()}
                  </Box>
                  {(entry.player.organization || entry.player.rating > 0) && (
                    <Typography sx={{ fontSize: 12, color: 'text.disabled', mt: 0.3 }}>
                      {[entry.player.organization, entry.player.rating > 0 ? entry.player.rating : null].filter(Boolean).join(' · ')}
                    </Typography>
                  )}
                </Box>

                {/* 积分 */}
                <Typography sx={{
                  width: 76,
                  fontSize: 20,
                  fontWeight: 700,
                  color: isTop3 ? 'text.primary' : 'text.secondary',
                  textAlign: 'center',
                  fontFamily: 'monospace',
                }}>
                  {formatScore(entry.score, scoring)}
                </Typography>

                {/* 胜/（平）/负 */}
                <Typography sx={{ width: 44, fontSize: 15, fontWeight: 600, color: 'success.main', textAlign: 'center', fontFamily: 'monospace' }}>
                  {wCount}
                </Typography>
                {!isElimination && (
                  <Typography sx={{ width: 44, fontSize: 15, fontWeight: 600, color: 'warning.main', textAlign: 'center', fontFamily: 'monospace' }}>
                    {dCount}
                  </Typography>
                )}
                <Typography sx={{ width: 44, fontSize: 15, fontWeight: 600, color: 'error.main', textAlign: 'center', fontFamily: 'monospace' }}>
                  {lCount}
                </Typography>

                {/* 破同分值（淘汰赛不显示） */}
                {!isElimination && tbKeys.map((key) => (
                  <Typography
                    key={key}
                    sx={{
                      width: 76,
                      fontSize: 14,
                      color: 'text.secondary',
                      textAlign: 'center',
                      fontFamily: 'monospace',
                    }}
                  >
                    {formatTb(entry.tiebreakers[key] ?? 0, key, scoring)}
                  </Typography>
                ))}
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}

