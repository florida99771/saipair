import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Chip,
  Stack,
  Card,
  IconButton,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import TopBar from '../components/TopBar';
import ConfirmDialog from '../components/ConfirmDialog';

const STATUS_FILTERS = ['all', 'not_started', 'in_progress', 'completed'];

export default function TournamentsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadTournaments = useCallback(async () => {
    const meta = await window.electronAPI.loadMeta();
    setTournaments(meta);
  }, []);

  useEffect(() => {
    loadTournaments();
  }, [loadTournaments]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await window.electronAPI.deleteTournament(deleteTarget.id);
      toast.success(t('toast.deleteSuccess'));
      loadTournaments();
    } catch {
      toast.error(t('toast.deleteFailed'));
    }
    setDeleteTarget(null);
  };

  const getFormatLabel = (format) => t(`format.${format}`);

  const getStatusLabel = (status) => {
    if (status === 'in_progress') return t('home.statusInProgress');
    if (status === 'completed') return t('home.statusCompleted');
    return t('home.statusNotStarted');
  };

  const getStatusColor = (status) => {
    if (status === 'in_progress') return { bgcolor: 'primary.light', color: 'primary.main' };
    if (status === 'completed') return { bgcolor: 'success.light', color: 'success.main' };
    return { bgcolor: 'grey.100', color: 'text.secondary' };
  };

  const getFilterStatusLabel = (filter) => {
    if (filter === 'all') return t('tournaments.filterAll');
    if (filter === 'not_started') return t('home.statusNotStarted');
    if (filter === 'in_progress') return t('home.statusInProgress');
    return t('home.statusCompleted');
  };

  const getRoundLabel = (tournament) =>
    tournament.currentRound
      ? t('home.roundInfo', { current: tournament.currentRound })
      : '';

  const filtered = useMemo(() => {
    let list = tournaments;

    // status filter
    if (statusFilter !== 'all') {
      list = list.filter((t) => t.status === statusFilter);
    }

    // search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((t) => t.name.toLowerCase().includes(q));
    }

    // sort
    if (sortBy === 'name') {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    }
    // default 'date' — meta already sorted by updatedAt desc, no extra sort needed

    return list;
  }, [tournaments, statusFilter, search, sortBy]);

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <TopBar onBack={() => navigate('/')} />

      {/* 搜索/筛选/排序栏 */}
      <Box sx={{ px: 3, pt: 2, pb: 1.5 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
          <Typography sx={{ fontSize: 18, fontWeight: 700, color: 'text.primary' }}>
            {t('tournaments.title')}
          </Typography>
          <Typography sx={{ fontSize: 13, color: 'text.disabled' }}>
            {t('tournaments.total', { count: filtered.length })}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
          <TextField
            size="small"
            placeholder={t('tournaments.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              },
            }}
            sx={{ width: 240, '& .MuiOutlinedInput-root': { fontSize: 13 } }}
          />

          <Stack direction="row" spacing={0.5}>
            {STATUS_FILTERS.map((filter) => (
              <Chip
                key={filter}
                label={getFilterStatusLabel(filter)}
                size="small"
                onClick={() => setStatusFilter(filter)}
                variant={statusFilter === filter ? 'filled' : 'outlined'}
                color={statusFilter === filter ? 'primary' : 'default'}
                sx={{ fontSize: 12, fontWeight: 500 }}
              />
            ))}
          </Stack>

          <Box sx={{ flex: 1 }} />

          <ToggleButtonGroup
            size="small"
            value={sortBy}
            exclusive
            onChange={(_, v) => v && setSortBy(v)}
            sx={{ '& .MuiToggleButton-root': { fontSize: 12, px: 1.5, py: 0.5, textTransform: 'none' } }}
          >
            <ToggleButton value="date">{t('tournaments.sortByDate')}</ToggleButton>
            <ToggleButton value="name">{t('tournaments.sortByName')}</ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      </Box>

      {/* 赛事列表 */}
      <Box sx={{ flex: 1, overflow: 'auto', px: 3, pb: 3 }}>
        {filtered.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography sx={{ fontSize: 14, color: 'text.disabled' }}>
              {t('tournaments.noResults')}
            </Typography>
          </Box>
        ) : (
          <Stack spacing={1}>
            {filtered.map((tournament) => (
              <Card
                key={tournament.id}
                variant="outlined"
                onClick={() => navigate(`/tournament/${tournament.id}`)}
                sx={{
                  px: 2.5,
                  py: 2,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderColor: 'grey.200',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                  '&:hover': {
                    borderColor: 'secondary.main',
                    boxShadow: '0 2px 8px rgba(99,102,241,0.06)',
                  },
                  '&:hover .delete-btn': { opacity: 1 },
                }}
              >
                <Box>
                  <Typography sx={{ fontSize: 15, fontWeight: 600, color: 'text.primary', mb: 0.6 }}>
                    {tournament.name}
                  </Typography>
                  <Stack direction="row" spacing={0.6} alignItems="center" divider={
                    <Typography sx={{ color: 'divider', fontSize: 12 }}>·</Typography>
                  }>
                    <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>
                      {tournament.startDate === tournament.endDate
                        ? tournament.startDate
                        : `${tournament.startDate} ~ ${tournament.endDate}`}
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>
                      {getFormatLabel(tournament.format)}
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>
                      {t('home.players', { count: tournament.playerCount })}
                    </Typography>
                    {getRoundLabel(tournament) && (
                      <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>
                        {getRoundLabel(tournament)}
                      </Typography>
                    )}
                  </Stack>
                </Box>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <IconButton
                    className="delete-btn"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(tournament);
                    }}
                    sx={{
                      opacity: 0,
                      transition: 'opacity 0.15s',
                      color: 'text.disabled',
                      '&:hover': { color: 'error.main' },
                    }}
                  >
                    <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                  <Chip
                    label={getStatusLabel(tournament.status)}
                    size="small"
                    sx={{
                      fontSize: 12,
                      fontWeight: 500,
                      height: 26,
                      ...getStatusColor(tournament.status),
                    }}
                  />
                </Stack>
              </Card>
            ))}
          </Stack>
        )}
      </Box>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={t('deleteDialog.title')}
        message={t('deleteDialog.message', { name: deleteTarget?.name })}
        confirmLabel={t('deleteDialog.confirm')}
        cancelLabel={t('common.cancel')}
        confirmColor="error"
      />
    </Box>
  );
}
