import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  TextField,
  Card,
  Stack,
  Switch,
  FormControlLabel,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import Autocomplete from '@mui/material/Autocomplete';
import { useTranslation } from 'react-i18next';
import { FORMATS, DEFAULT_TIEBREAKERS, ALL_TIEBREAKERS } from '@core';

const FORMAT_ICONS = {
  swiss: '🔀',
  round_robin: '🔄',
  double_round_robin: '🔁',
  elimination: '🏆',
  double_elimination: '⚔️',
};

const tfSx = { '& .MuiInputBase-root': { bgcolor: 'background.paper' } };

// 基本信息字段列表
const BASIC_FIELDS = ['name', 'startDate', 'endDate', 'venue', 'organizer', 'chiefReferee'];

function getParams(tournament) {
  return {
    totalRounds: tournament.totalRounds,
    colorBalance: tournament.colorBalance ?? false,
    allowDraw: tournament.allowDraw ?? true,
    bronzeMatch: tournament.bronzeMatch ?? false,
    bracketReset: tournament.bracketReset ?? true,
    scoring: { ...tournament.scoring },
    tiebreakers: [...(tournament.tiebreakers || DEFAULT_TIEBREAKERS)],
  };
}

function getBasicInfo(tournament) {
  return {
    name: tournament.name || '',
    startDate: tournament.startDate || '',
    endDate: tournament.endDate || '',
    venue: tournament.venue || '',
    organizer: tournament.organizer || '',
    chiefReferee: tournament.chiefReferee || '',
  };
}

export default function SettingsPanel({ tournament, onUpdate }) {
  const { t } = useTranslation();
  const [tab, setTab] = useState(0);
  const [form, setForm] = useState(() => getBasicInfo(tournament));
  const [selectedFormat, setSelectedFormat] = useState(tournament.format);
  const [params, setParams] = useState(() => getParams(tournament));

  const [addMenuAnchor, setAddMenuAnchor] = useState(null);
  const [avoidA, setAvoidA] = useState(null);
  const [avoidB, setAvoidB] = useState(null);

  const isStarted = tournament.status !== 'not_started';
  const fmt = tournament.format;
  const isSwiss = fmt === 'swiss';
  const isRoundRobin = fmt === 'round_robin' || fmt === 'double_round_robin';
  const hasColorBalance = isSwiss || fmt === 'round_robin';
  const isElim = fmt === 'elimination';
  const isDoubleElim = fmt === 'double_elimination';

  // tournament 从外部变更时同步本地状态
  useEffect(() => {
    setForm(getBasicInfo(tournament));
    setSelectedFormat(tournament.format);
    setParams(getParams(tournament));
  }, [tournament]);

  const handleChange = useCallback((field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  }, []);

  // 检测是否有未保存的变更
  const hasChanges = useMemo(() => {
    const orig = getBasicInfo(tournament);
    return BASIC_FIELDS.some(f => form[f] !== orig[f]);
  }, [form, tournament]);

  const handleSave = useCallback(() => {
    // 收集所有变更字段
    const orig = getBasicInfo(tournament);
    const changed = {};
    for (const f of BASIC_FIELDS) {
      if (form[f] !== orig[f]) changed[f] = form[f];
    }
    if (Object.keys(changed).length > 0) {
      onUpdate((inst) => inst.update(changed));
    }
  }, [form, tournament, onUpdate]);

  // 赛制是否有未保存的变更
  const formatChanged = selectedFormat !== tournament.format;

  const handleFormatSave = useCallback(() => {
    if (formatChanged) {
      onUpdate((inst) => inst.setFormat(selectedFormat));
    }
  }, [selectedFormat, formatChanged, onUpdate]);

  // 赛制参数变更检测
  const paramsChanged = useMemo(() => {
    const orig = getParams(tournament);
    const tbChanged = params.tiebreakers.length !== orig.tiebreakers.length
      || params.tiebreakers.some((k, i) => k !== orig.tiebreakers[i]);
    return params.totalRounds !== orig.totalRounds
      || params.colorBalance !== orig.colorBalance
      || params.allowDraw !== orig.allowDraw
      || params.bronzeMatch !== orig.bronzeMatch
      || params.bracketReset !== orig.bracketReset
      || params.scoring.win !== orig.scoring.win
      || params.scoring.draw !== orig.scoring.draw
      || params.scoring.loss !== orig.scoring.loss
      || tbChanged;
  }, [params, tournament]);

  const handleParamsSave = useCallback(() => {
    if (!paramsChanged) return;
    const orig = getParams(tournament);
    const changed = {};
    if (params.totalRounds !== orig.totalRounds) changed.totalRounds = params.totalRounds;
    if (params.colorBalance !== orig.colorBalance) changed.colorBalance = params.colorBalance;
    if (params.allowDraw !== orig.allowDraw) changed.allowDraw = params.allowDraw;
    if (params.bronzeMatch !== orig.bronzeMatch) changed.bronzeMatch = params.bronzeMatch;
    if (params.bracketReset !== orig.bracketReset) changed.bracketReset = params.bracketReset;
    const scoringChanged = params.scoring.win !== orig.scoring.win
      || params.scoring.draw !== orig.scoring.draw
      || params.scoring.loss !== orig.scoring.loss;
    const tbChanged = params.tiebreakers.length !== orig.tiebreakers.length
      || params.tiebreakers.some((k, i) => k !== orig.tiebreakers[i]);
    onUpdate((inst) => {
      if (Object.keys(changed).length > 0) inst.update(changed);
      if (scoringChanged) inst.setScoring(params.scoring);
      if (tbChanged) inst.setTiebreakers(params.tiebreakers);
    });
  }, [params, paramsChanged, tournament, onUpdate]);

  return (
    <Box sx={{ maxWidth: 860 }}>
        <Typography sx={{ fontSize: 22, fontWeight: 700, color: 'text.primary', mb: 3 }}>
          {t('tournament.nav.settings')}
        </Typography>

        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            mb: 4,
            '& .MuiTab-root': { minHeight: 42, py: 1, fontSize: 14, textTransform: 'none', fontWeight: 500 },
            '& .Mui-selected': { fontWeight: 600 },
          }}
        >
          <Tab label={t('settings.tabs.basicInfo')} />
          <Tab label={t('settings.tabs.formatSelect')} />
          <Tab label={t('settings.tabs.formatParams')} />
        </Tabs>

        {/* Tab 1: 基本信息 */}
        {tab === 0 && (
          <Stack spacing={3}>
            <TextField
              label={t('tournament.field.name')}
              value={form.name}
              fullWidth
              onChange={handleChange('name')}
              sx={tfSx}
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label={t('tournament.field.startDate')}
                value={form.startDate}
                type="date"
                onChange={handleChange('startDate')}
                InputLabelProps={{ shrink: true }}
                sx={{ flex: 1, ...tfSx }}
              />
              <TextField
                label={t('tournament.field.endDate')}
                value={form.endDate}
                type="date"
                onChange={handleChange('endDate')}
                InputLabelProps={{ shrink: true }}
                sx={{ flex: 1, ...tfSx }}
              />
            </Stack>
            <TextField
              label={t('tournament.field.venue')}
              value={form.venue}
              fullWidth
              placeholder={t('settings.placeholder.venue')}
              onChange={handleChange('venue')}
              sx={tfSx}
            />
            <TextField
              label={t('tournament.field.organizer')}
              value={form.organizer}
              fullWidth
              placeholder={t('settings.placeholder.organizer')}
              onChange={handleChange('organizer')}
              sx={tfSx}
            />
            <TextField
              label={t('tournament.field.chiefReferee')}
              value={form.chiefReferee}
              fullWidth
              placeholder={t('settings.placeholder.chiefReferee')}
              onChange={handleChange('chiefReferee')}
              sx={tfSx}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 1 }}>
              <Button
                variant="contained"
                disabled={!hasChanges}
                onClick={handleSave}
                startIcon={<SaveOutlinedIcon />}
                sx={{
                  px: 4,
                  py: 1.2,
                  fontSize: 14,
                  fontWeight: 600,
                  borderRadius: 2,
                  background: hasChanges
                    ? 'linear-gradient(135deg, #6366F1, #7C3AED)'
                    : undefined,
                  '&:hover': {
                    background: 'linear-gradient(135deg, #4F46E5, #6D28D9)',
                  },
                }}
              >
                {t('common.save')}
              </Button>
            </Box>
          </Stack>
        )}

        {/* Tab 2: 赛制选择 */}
        {tab === 1 && (
          <Box>
            {isStarted && (
              <Box sx={{
                mb: 3,
                px: 2.5,
                py: 1.5,
                borderRadius: 2,
                bgcolor: 'warning.light',
                border: 1,
                borderColor: 'warning.main',
              }}>
                <Typography sx={{ fontSize: 14, color: 'warning.main', fontWeight: 500 }}>
                  {t('settings.formatLocked')}
                </Typography>
              </Box>
            )}

            <Stack spacing={1.5}>
              {FORMATS.map((fmt) => {
                const isSelected = selectedFormat === fmt;
                return (
                  <Card
                    key={fmt}
                    variant="outlined"
                    onClick={() => {
                      if (!isStarted) setSelectedFormat(fmt);
                    }}
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 2.5,
                      px: 3,
                      py: 2.5,
                      cursor: isStarted ? 'default' : 'pointer',
                      opacity: isStarted && !isSelected ? 0.5 : 1,
                      borderColor: isSelected ? 'primary.main' : 'divider',
                      borderWidth: 2,
                      bgcolor: isSelected ? 'primary.light' : 'background.paper',
                      transition: 'all 0.15s',
                      '&:hover': isStarted ? {} : {
                        borderColor: isSelected ? 'primary.main' : 'secondary.main',
                        boxShadow: '0 2px 12px rgba(99,102,241,0.1)',
                      },
                    }}
                  >
                    {/* 图标 */}
                    <Typography sx={{ fontSize: 30, lineHeight: 1, mt: 0.3, flexShrink: 0 }}>
                      {FORMAT_ICONS[fmt]}
                    </Typography>

                    {/* 内容 */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{
                        fontSize: 16,
                        fontWeight: isSelected ? 700 : 600,
                        color: isSelected ? 'primary.main' : 'text.primary',
                        mb: 1.2,
                      }}>
                        {t(`format.${fmt}`)}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mb: 0.8, alignItems: 'baseline' }}>
                        <Typography sx={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: 'text.disabled',
                          flexShrink: 0,
                        }}>
                          {t('settings.processLabel')}
                        </Typography>
                        <Typography sx={{ fontSize: 13, color: 'text.secondary', lineHeight: 1.6 }}>
                          {t(`settings.formatProcess.${fmt}`)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'baseline' }}>
                        <Typography sx={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: 'text.disabled',
                          flexShrink: 0,
                        }}>
                          {t('settings.scenarioLabel')}
                        </Typography>
                        <Typography sx={{ fontSize: 13, color: 'text.secondary', lineHeight: 1.6 }}>
                          {t(`settings.formatScenario.${fmt}`)}
                        </Typography>
                      </Box>
                    </Box>
                  </Card>
                );
              })}
            </Stack>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 3 }}>
              <Button
                variant="contained"
                disabled={!formatChanged || isStarted}
                onClick={handleFormatSave}
                startIcon={<SaveOutlinedIcon />}
                sx={{
                  px: 4,
                  py: 1.2,
                  fontSize: 14,
                  fontWeight: 600,
                  borderRadius: 2,
                  background: formatChanged && !isStarted
                    ? 'linear-gradient(135deg, #6366F1, #7C3AED)'
                    : undefined,
                  '&:hover': {
                    background: 'linear-gradient(135deg, #4F46E5, #6D28D9)',
                  },
                }}
              >
                {t('common.save')}
              </Button>
            </Box>
          </Box>
        )}

        {/* Tab 3: 赛制参数 */}
        {tab === 2 && (
          <Stack spacing={4}>
            {/* 总轮次 — 仅瑞士制显示 */}
            {isSwiss && (
              <Box>
                <Typography sx={{ fontSize: 15, fontWeight: 600, color: 'text.primary', mb: 0.5 }}>
                  {t('settings.totalRounds')}
                </Typography>
                <Typography sx={{ fontSize: 13, color: 'text.disabled', mb: 1.5 }}>
                  {t('settings.totalRoundsAuto')}
                </Typography>
                <TextField
                  value={params.totalRounds ?? ''}
                  type="number"
                  placeholder={t('settings.placeholder.totalRounds')}
                  onChange={(e) => {
                    const v = e.target.value;
                    setParams(prev => ({ ...prev, totalRounds: v === '' ? null : Number(v) }));
                  }}
                  inputProps={{ min: 1 }}
                  sx={{ width: 240, ...tfSx }}
                />
                <Box sx={{
                  mt: 2, px: 2, py: 1.5, borderRadius: 2,
                  bgcolor: 'action.hover', border: 1, borderColor: 'divider',
                }}>
                  <Typography sx={{ fontSize: 13, color: 'text.secondary', lineHeight: 1.7 }}>
                    {t('settings.totalRoundsFormula')}
                  </Typography>
                  <Box component="table" sx={{ mt: 1, fontSize: 12, color: 'text.secondary', borderCollapse: 'collapse', '& td, & th': { px: 1.5, py: 0.5, textAlign: 'center' }, '& th': { fontWeight: 600, color: 'text.primary', borderBottom: 1, borderColor: 'divider' } }}>
                    <thead>
                      <tr>
                        {['2','3-4','5-8','9-16','17-32','33-64'].map(r => <th key={r}>{r}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        {[1,2,3,4,5,6].map(r => <td key={r}><strong>{r}</strong></td>)}
                      </tr>
                    </tbody>
                  </Box>
                </Box>
              </Box>
            )}

            {/* 先后手平衡 — 瑞士制 + 单循环赛 */}
            {hasColorBalance && (
              <Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={params.colorBalance}
                      onChange={(e) => setParams(prev => ({ ...prev, colorBalance: e.target.checked }))}
                      size="medium"
                    />
                  }
                  label={
                    <Box sx={{ ml: 0.5 }}>
                      <Typography sx={{ fontSize: 15, fontWeight: 600 }}>
                        {t('settings.colorBalance')}
                      </Typography>
                      <Typography sx={{ fontSize: 13, color: 'text.disabled', mt: 0.3 }}>
                        {t('settings.colorBalanceDesc')}
                      </Typography>
                    </Box>
                  }
                />
              </Box>
            )}

            {/* 三四名决赛 — 仅单淘汰 */}
            {isElim && (
              <Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={params.bronzeMatch}
                      onChange={(e) => setParams(prev => ({ ...prev, bronzeMatch: e.target.checked }))}
                      size="medium"
                    />
                  }
                  label={
                    <Box sx={{ ml: 0.5 }}>
                      <Typography sx={{ fontSize: 15, fontWeight: 600 }}>
                        {t('settings.bronzeMatch')}
                      </Typography>
                      <Typography sx={{ fontSize: 13, color: 'text.disabled', mt: 0.3 }}>
                        {t('settings.bronzeMatchDesc')}
                      </Typography>
                    </Box>
                  }
                />
              </Box>
            )}

            {/* Bracket Reset — 仅双败淘汰 */}
            {isDoubleElim && (
              <Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={params.bracketReset}
                      onChange={(e) => setParams(prev => ({ ...prev, bracketReset: e.target.checked }))}
                      size="medium"
                    />
                  }
                  label={
                    <Box sx={{ ml: 0.5 }}>
                      <Typography sx={{ fontSize: 15, fontWeight: 600 }}>
                        {t('settings.bracketReset')}
                      </Typography>
                      <Typography sx={{ fontSize: 13, color: 'text.disabled', mt: 0.3 }}>
                        {t('settings.bracketResetDesc')}
                      </Typography>
                    </Box>
                  }
                />
              </Box>
            )}

            {/* 允许平局 — 瑞士制 + 循环赛 */}
            {(isSwiss || isRoundRobin) && (
              <Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={params.allowDraw}
                      onChange={(e) => setParams(prev => ({ ...prev, allowDraw: e.target.checked }))}
                      size="medium"
                    />
                  }
                  label={
                    <Box sx={{ ml: 0.5 }}>
                      <Typography sx={{ fontSize: 15, fontWeight: 600 }}>
                        {t('settings.allowDraw')}
                      </Typography>
                      <Typography sx={{ fontSize: 13, color: 'text.disabled', mt: 0.3 }}>
                        {t('settings.allowDrawDesc')}
                      </Typography>
                    </Box>
                  }
                />
              </Box>
            )}

            {/* 计分规则 — 瑞士制 + 循环赛 */}
            {(isSwiss || isRoundRobin) && (
              <Box>
                <Typography sx={{ fontSize: 15, fontWeight: 600, color: 'text.primary', mb: 2 }}>
                  {t('settings.scoring')}
                </Typography>
                <Stack direction="row" spacing={2.5}>
                  {['win', 'draw', 'loss']
                    .filter((key) => key !== 'draw' || params.allowDraw)
                    .map((key) => (
                    <TextField
                      key={key}
                      label={t(`settings.score${key.charAt(0).toUpperCase() + key.slice(1)}`)}
                      value={params.scoring[key] / 2}
                      type="number"
                      onChange={(e) => {
                        const v = e.target.value;
                        const raw = v === '' ? 0 : Math.round(parseFloat(v) * 2);
                        setParams(prev => ({
                          ...prev,
                          scoring: { ...prev.scoring, [key]: isNaN(raw) ? 0 : raw },
                        }));
                      }}
                      inputProps={{ min: 0, step: 0.5 }}
                      sx={{ width: 120, ...tfSx }}
                    />
                  ))}
                </Stack>
              </Box>
            )}

            {/* 破同分规则 — 瑞士制 + 循环赛 */}
            {(isSwiss || isRoundRobin) && (
              <Box>
                <Typography sx={{ fontSize: 15, fontWeight: 600, color: 'text.primary', mb: 1 }}>
                  {t('settings.tiebreakers')}
                </Typography>
                <Typography sx={{ fontSize: 13, color: 'text.disabled', mb: 2 }}>
                  {t('settings.tiebreakersDesc')}
                </Typography>

                {params.tiebreakers.length === 0 && (
                  <Typography sx={{ fontSize: 13, color: 'text.disabled', py: 2, textAlign: 'center' }}>
                    {t('settings.tbEmpty')}
                  </Typography>
                )}

                <Stack spacing={1.2}>
                  {params.tiebreakers.map((key, index) => (
                    <Box
                      key={key}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        px: 2,
                        py: 1.5,
                        borderRadius: 2,
                        bgcolor: 'background.paper',
                        border: 1,
                        borderColor: 'divider',
                      }}
                    >
                      {/* 序号 */}
                      <Box sx={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        bgcolor: 'primary.light',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'primary.main' }}>
                          {index + 1}
                        </Typography>
                      </Box>

                      {/* 内容 */}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontSize: 14, fontWeight: 600, color: 'text.primary', mb: 0.8 }}>
                          {t(`settings.tb.${key}`)}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mb: 0.5, alignItems: 'baseline' }}>
                          <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.disabled', flexShrink: 0 }}>
                            {t('settings.tbCalcLabel')}
                          </Typography>
                          <Typography sx={{ fontSize: 13, color: 'text.secondary', lineHeight: 1.6 }}>
                            {t(`settings.tbDesc.${key}`)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'baseline' }}>
                          <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.disabled', flexShrink: 0 }}>
                            {t('settings.tbMeaningLabel')}
                          </Typography>
                          <Typography sx={{ fontSize: 12.5, color: 'text.secondary', lineHeight: 1.6, fontStyle: 'italic' }}>
                            {t(`settings.tbMeaning.${key}`)}
                          </Typography>
                        </Box>
                      </Box>

                      {/* 操作按钮 */}
                      <Stack sx={{ flexShrink: 0 }}>
                        <Tooltip title="Move up" arrow>
                          <span>
                            <IconButton
                              size="small"
                              disabled={index === 0}
                              onClick={() => {
                                setParams(prev => {
                                  const arr = [...prev.tiebreakers];
                                  [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
                                  return { ...prev, tiebreakers: arr };
                                });
                              }}
                              sx={{ color: 'text.disabled', p: 0.3 }}
                            >
                              <KeyboardArrowUpIcon sx={{ fontSize: 20 }} />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Move down" arrow>
                          <span>
                            <IconButton
                              size="small"
                              disabled={index === params.tiebreakers.length - 1}
                              onClick={() => {
                                setParams(prev => {
                                  const arr = [...prev.tiebreakers];
                                  [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
                                  return { ...prev, tiebreakers: arr };
                                });
                              }}
                              sx={{ color: 'text.disabled', p: 0.3 }}
                            >
                              <KeyboardArrowDownIcon sx={{ fontSize: 20 }} />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Stack>
                      <Tooltip title="Remove" arrow>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setParams(prev => ({
                              ...prev,
                              tiebreakers: prev.tiebreakers.filter((_, i) => i !== index),
                            }));
                          }}
                          sx={{ color: 'text.disabled', '&:hover': { color: 'error.main' } }}
                        >
                          <CloseIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  ))}
                </Stack>

                {/* 添加规则按钮 */}
                {params.tiebreakers.length < ALL_TIEBREAKERS.length && (
                  <>
                    <Button
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={(e) => setAddMenuAnchor(e.currentTarget)}
                      sx={{ mt: 1.5, fontSize: 13, fontWeight: 600, color: 'primary.main' }}
                    >
                      {t('settings.tbAdd')}
                    </Button>
                    <Menu
                      anchorEl={addMenuAnchor}
                      open={Boolean(addMenuAnchor)}
                      onClose={() => setAddMenuAnchor(null)}
                    >
                      {ALL_TIEBREAKERS
                        .filter(k => !params.tiebreakers.includes(k))
                        .map(k => (
                          <MenuItem
                            key={k}
                            onClick={() => {
                              setParams(prev => ({
                                ...prev,
                                tiebreakers: [...prev.tiebreakers, k],
                              }));
                              setAddMenuAnchor(null);
                            }}
                          >
                            {t(`settings.tb.${k}`)}
                          </MenuItem>
                        ))
                      }
                    </Menu>
                  </>
                )}
              </Box>
            )}

            {/* 回避规则 — 仅瑞士制 */}
            {isSwiss && (
              <Box>
                <Typography sx={{ fontSize: 15, fontWeight: 600, color: 'text.primary', mb: 1 }}>
                  {t('settings.avoidances')}
                </Typography>
                <Typography sx={{ fontSize: 13, color: 'text.disabled', mb: 2 }}>
                  {t('settings.avoidancesDesc')}
                </Typography>

                {/* 已有回避规则列表 */}
                {tournament.avoidances.length === 0 && (
                  <Typography sx={{ fontSize: 13, color: 'text.disabled', py: 2, textAlign: 'center' }}>
                    {t('settings.avoidanceEmpty')}
                  </Typography>
                )}

                <Stack spacing={1}>
                  {tournament.avoidances.map(([aId, bId]) => {
                    const pA = tournament.players.find(p => p.id === aId);
                    const pB = tournament.players.find(p => p.id === bId);
                    if (!pA || !pB) return null;
                    return (
                      <Box
                        key={`${aId}-${bId}`}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          px: 2,
                          py: 1.2,
                          borderRadius: 2,
                          bgcolor: 'background.paper',
                          border: 1,
                          borderColor: 'divider',
                        }}
                      >
                        <Typography sx={{ fontSize: 14, color: 'text.primary', flex: 1 }}>
                          {pA.name} — {pB.name}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => {
                            onUpdate((inst) => inst.removeAvoidance(aId, bId));
                          }}
                          sx={{ color: 'text.disabled', '&:hover': { color: 'error.main' } }}
                        >
                          <CloseIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Box>
                    );
                  })}
                </Stack>

                {/* 添加回避规则 */}
                {tournament.players.length >= 2 && (
                  <Stack direction="row" spacing={1.5} sx={{ mt: 2, alignItems: 'center' }}>
                    <Autocomplete
                      value={avoidA}
                      onChange={(_, v) => setAvoidA(v)}
                      options={tournament.players.filter(p => p.id !== avoidB?.id)}
                      getOptionLabel={(p) => p.name}
                      isOptionEqualToValue={(o, v) => o.id === v.id}
                      renderInput={(params) => (
                        <TextField {...params} label={t('settings.avoidancePlayerA')} size="small" sx={tfSx} />
                      )}
                      sx={{ width: 200 }}
                      size="small"
                    />
                    <Autocomplete
                      value={avoidB}
                      onChange={(_, v) => setAvoidB(v)}
                      options={tournament.players.filter(p => p.id !== avoidA?.id)}
                      getOptionLabel={(p) => p.name}
                      isOptionEqualToValue={(o, v) => o.id === v.id}
                      renderInput={(params) => (
                        <TextField {...params} label={t('settings.avoidancePlayerB')} size="small" sx={tfSx} />
                      )}
                      sx={{ width: 200 }}
                      size="small"
                    />
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<AddIcon />}
                      disabled={!avoidA || !avoidB}
                      onClick={() => {
                        onUpdate((inst) => inst.addAvoidance(avoidA.id, avoidB.id));
                        setAvoidA(null);
                        setAvoidB(null);
                      }}
                      sx={{ fontSize: 13, fontWeight: 600, flexShrink: 0 }}
                    >
                      {t('settings.avoidanceAdd')}
                    </Button>
                  </Stack>
                )}
              </Box>
            )}

            {/* 保存按钮 */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 1 }}>
              <Button
                variant="contained"
                disabled={!paramsChanged}
                onClick={handleParamsSave}
                startIcon={<SaveOutlinedIcon />}
                sx={{
                  px: 4,
                  py: 1.2,
                  fontSize: 14,
                  fontWeight: 600,
                  borderRadius: 2,
                  background: paramsChanged
                    ? 'linear-gradient(135deg, #6366F1, #7C3AED)'
                    : undefined,
                  '&:hover': {
                    background: 'linear-gradient(135deg, #4F46E5, #6D28D9)',
                  },
                }}
              >
                {t('common.save')}
              </Button>
            </Box>
          </Stack>
        )}
    </Box>
  );
}

