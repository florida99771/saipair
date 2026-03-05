import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import {
  Typography,
  Button,
  Box,
  Container,
  Card,
  Chip,
  Stack,
  IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ListAltIcon from '@mui/icons-material/ListAlt';
import RestoreOutlinedIcon from '@mui/icons-material/RestoreOutlined';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import TopBar from '../components/TopBar';
import CreateTournamentDialog from '../components/CreateTournamentDialog';
import ConfirmDialog from '../components/ConfirmDialog';

export default function HomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [tournaments, setTournaments] = useState([]);

  const loadTournaments = useCallback(async () => {
    const meta = await window.electronAPI.loadMeta();
    setTournaments(meta);
  }, []);

  useEffect(() => {
    loadTournaments();
  }, [loadTournaments]);

  const handleCreate = async (name) => {
    try {
      const meta = await window.electronAPI.createTournament(name);
      toast.success(t('toast.createSuccess'));
      navigate(`/tournament/${meta.id}`);
    } catch {
      toast.error(t('toast.createFailed'));
    }
  };

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

  const handleRestore = async () => {
    try {
      const meta = await window.electronAPI.restoreBackup();
      if (!meta) return;
      toast.success(t('toast.restoreSuccess'));
      navigate(`/tournament/${meta.id}`);
    } catch {
      toast.error(t('toast.restoreFailed'));
    }
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

  const getRoundLabel = (tournament) =>
    tournament.currentRound
      ? t('home.roundInfo', { current: tournament.currentRound })
      : '';

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <TopBar
        actions={
          <Button
            size="small"
            variant="outlined"
            startIcon={<ListAltIcon sx={{ fontSize: 16 }} />}
            onClick={() => navigate('/tournaments')}
            sx={{ color: 'text.secondary', borderColor: 'divider', fontSize: 13, px: 2 }}
          >
            {t('tournaments.title')}
          </Button>
        }
      />

      {/* 主内容区 */}
      <Box sx={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', px: 3 }}>
        <Container maxWidth="md" disableGutters>
          {/* 欢迎标题 */}
          <Box sx={{ textAlign: 'center', mb: 4.5 }}>
            <Typography sx={{ fontSize: 28, fontWeight: 700, color: 'text.primary', mb: 0.8 }}>
              {t('home.welcome')}
            </Typography>
            <Typography sx={{ fontSize: 15, color: 'text.disabled' }}>
              {t('home.slogan')}
            </Typography>
          </Box>

          {/* 创建新赛事按钮 */}
          <Button
            fullWidth
            variant="contained"
            onClick={() => setCreateOpen(true)}
            startIcon={<AddIcon />}
            sx={{
              py: 2,
              fontSize: 16,
              fontWeight: 600,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #6366F1, #7C3AED)',
              boxShadow: '0 2px 12px rgba(99,102,241,0.3)',
              mb: 1.5,
              '&:hover': {
                background: 'linear-gradient(135deg, #4F46E5, #6D28D9)',
                boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
              },
            }}
          >
            {t('home.createTournament')}
          </Button>

          {/* 从备份恢复按钮 */}
          <Button
            fullWidth
            variant="outlined"
            onClick={handleRestore}
            startIcon={<RestoreOutlinedIcon />}
            sx={{
              py: 1.2,
              fontSize: 14,
              fontWeight: 500,
              borderRadius: 3,
              color: 'text.secondary',
              borderColor: 'divider',
              mb: 4.5,
            }}
          >
            {t('home.restoreBackup')}
          </Button>

          {/* 最近赛事 */}
          {tournaments.length > 0 && (
            <>
              <Typography sx={{
                fontSize: 12,
                fontWeight: 700,
                color: 'text.disabled',
                letterSpacing: 1,
                mb: 1.2,
                pl: 0.3,
              }}>
                {t('home.recentTournaments')}
              </Typography>

              <Stack spacing={1}>
                {tournaments.slice(0, 3).map((tournament) => (
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

              {tournaments.length > 3 && (
                <Button
                  onClick={() => navigate('/tournaments')}
                  endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
                  sx={{
                    mt: 1.5,
                    mx: 'auto',
                    display: 'flex',
                    color: 'text.secondary',
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                >
                  {t('home.viewAll')}
                </Button>
              )}
            </>
          )}

        </Container>
      </Box>

      <CreateTournamentDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreate}
      />

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
