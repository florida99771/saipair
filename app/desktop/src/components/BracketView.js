import { Box, Typography, Divider, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';

const CARD_W = 160;
const CARD_H = 72;
const BASE_SLOT_H = 88;   // height of one slot in round 0
const CONNECTOR_W = 24;   // right-side bracket connector area width

// ── 胜/负判断 ──

function getWinner(pairing) {
  const r = pairing.result;
  if (r === '1-0' || r === '1-0F' || r === 'bye') return 'a';
  if (r === '0-1' || r === '0F-1') return 'b';
  return null;
}

// ── 单个对阵卡片 ──

function BracketMatchCard({ pairing, playerA, playerB, t, isBye }) {
  const theme = useTheme();
  const winner = getWinner(pairing);

  const rowSx = (side) => ({
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    px: 1.5,
    bgcolor:
      winner === side
        ? theme.palette.mode === 'dark'
          ? 'rgba(255,255,255,0.07)'
          : 'rgba(0,0,0,0.04)'
        : 'transparent',
    minWidth: 0,
  });

  const nameSx = (side) => ({
    fontSize: 12,
    fontWeight: winner === side ? 700 : 500,
    color:
      winner && winner !== side
        ? theme.palette.text.disabled
        : theme.palette.text.primary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flex: 1,
  });

  return (
    <Box
      sx={{
        width: CARD_W,
        height: CARD_H,
        border: 1,
        borderColor: 'divider',
        borderRadius: 1.5,
        bgcolor: 'background.paper',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
        flexShrink: 0,
      }}
    >
      {/* 选手 A */}
      <Box sx={rowSx('a')}>
        <Typography sx={nameSx('a')}>
          {playerA ? playerA.name : t('tournament.rounds.bracket.tbd')}
        </Typography>
        {winner === 'a' && (
          <Box
            sx={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              bgcolor: 'success.main',
              ml: 0.5,
              flexShrink: 0,
            }}
          />
        )}
      </Box>

      <Divider />

      {/* 选手 B */}
      <Box sx={rowSx('b')}>
        {isBye ? (
          <Typography
            sx={{ fontSize: 11, color: 'text.disabled', fontStyle: 'italic', flex: 1 }}
          >
            BYE
          </Typography>
        ) : (
          <>
            <Typography sx={nameSx('b')}>
              {playerB ? playerB.name : t('tournament.rounds.bracket.tbd')}
            </Typography>
            {winner === 'b' && (
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  bgcolor: 'success.main',
                  ml: 0.5,
                  flexShrink: 0,
                }}
              />
            )}
          </>
        )}
      </Box>
    </Box>
  );
}

// ── 对阵插槽（卡片 + 右侧连接线） ──
// 连接线形成经典签表"括号"形状：
//   偶数槽（一对中的上方）：从中心向右延伸再向下到槽底
//   奇数槽（一对中的下方）：从槽顶向右再向下到中心

function BracketSlot({
  pairing,
  tournament,
  t,
  slotHeight,
  pairingIndex,
  totalInRound,
  showConnector,
}) {
  const theme = useTheme();
  const playerA = pairing.playerAId ? tournament.getPlayer(pairing.playerAId) : null;
  const playerB = pairing.playerBId ? tournament.getPlayer(pairing.playerBId) : null;
  const isBye = !pairing.playerBId && pairing.result !== 'hbye';

  const isTopOfPair = pairingIndex % 2 === 0;
  const hasPair = showConnector && totalInRound > 1;
  const borderColor = theme.palette.divider;

  return (
    <Box
      sx={{
        position: 'relative',
        height: slotHeight,
        display: 'flex',
        alignItems: 'center',
        width: CARD_W + (hasPair ? CONNECTOR_W : 0),
        flexShrink: 0,
      }}
    >
      <BracketMatchCard
        pairing={pairing}
        playerA={playerA}
        playerB={playerB}
        t={t}
        isBye={isBye}
      />

      {/* 右侧连接线 */}
      {hasPair && (
        <Box
          sx={{
            position: 'absolute',
            left: CARD_W,
            right: 0,
            top: isTopOfPair ? '50%' : '0%',
            bottom: isTopOfPair ? '0%' : '50%',
            borderRight: `1px solid ${borderColor}`,
            ...(isTopOfPair
              ? { borderBottom: `1px solid ${borderColor}` }
              : { borderTop: `1px solid ${borderColor}` }),
          }}
        />
      )}
    </Box>
  );
}

// ── 轮次列（一列配对 + 列标题） ──

function BracketColumn({ label, pairings, roundIndex, isLastRound, tournament, t, slotHeightFn }) {
  const slotH = slotHeightFn ? slotHeightFn(roundIndex) : BASE_SLOT_H * Math.pow(2, roundIndex);
  const columnWidth = CARD_W + (isLastRound || pairings.length === 1 ? 0 : CONNECTOR_W);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      <Typography
        sx={{
          fontSize: 11,
          fontWeight: 600,
          color: 'text.disabled',
          textAlign: 'center',
          mb: 1.5,
          width: columnWidth,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        {label}
      </Typography>

      {pairings.map((pairing, idx) => (
        <BracketSlot
          key={pairing.tableNumber ?? idx}
          pairing={pairing}
          tournament={tournament}
          t={t}
          slotHeight={slotH}
          pairingIndex={idx}
          totalInRound={pairings.length}
          showConnector={!isLastRound && pairings.length > 1}
        />
      ))}
    </Box>
  );
}

// ── 轮次间箭头 ──

function RoundArrow() {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        px: 0.5,
        flexShrink: 0,
        // 箭头垂直居中对准签表内容，不对准列标题
        pt: `${1.5 + 1.2}em`, // 列标题高度补偿（约 mb:1.5 + font）
      }}
    >
      <KeyboardArrowRightIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
    </Box>
  );
}

// ── 区段标题 ──

function SectionHeader({ label, color }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
      <Box sx={{ width: 4, height: 16, borderRadius: 1, bgcolor: color }} />
      <Typography
        sx={{
          fontSize: 11,
          fontWeight: 700,
          color,
          textTransform: 'uppercase',
          letterSpacing: 1,
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}

// ── 单淘汰签表 ──

function SEBracket({ tournament, t }) {
  const rounds = tournament.rounds;

  // 分离主轮次与三四名决赛
  const mainRounds = rounds
    .map((r) => ({ ...r, pairings: r.pairings.filter((p) => !p._isBronze) }))
    .filter((r) => r.pairings.length > 0);

  const bronzePairing = rounds.flatMap((r) => r.pairings).find((p) => p._isBronze);

  const getRoundLabel = (idx, total) => {
    const remaining = total - idx;
    if (remaining === 1) return 'Final';
    if (remaining === 2) return 'Semi';
    if (remaining === 3) return 'Quarter';
    return `R${idx + 1}`;
  };

  return (
    <Box>
      {/* 主签表 */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', overflowX: 'auto', pb: 1 }}>
        {mainRounds.map((round, idx) => (
          <Box
            key={round.roundNumber}
            sx={{ display: 'flex', alignItems: 'flex-start', flexShrink: 0 }}
          >
            <BracketColumn
              label={getRoundLabel(idx, mainRounds.length)}
              pairings={round.pairings}
              roundIndex={idx}
              isLastRound={idx === mainRounds.length - 1}
              tournament={tournament}
              t={t}
            />
            {idx < mainRounds.length - 1 && <RoundArrow />}
          </Box>
        ))}
      </Box>

      {/* 三四名决赛 */}
      {bronzePairing && (
        <Box sx={{ mt: 3, pt: 2.5, borderTop: 1, borderColor: 'divider' }}>
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 600,
              color: 'text.disabled',
              mb: 1.5,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            3rd Place
          </Typography>
          <BracketMatchCard
            pairing={bronzePairing}
            playerA={bronzePairing.playerAId ? tournament.getPlayer(bronzePairing.playerAId) : null}
            playerB={bronzePairing.playerBId ? tournament.getPlayer(bronzePairing.playerBId) : null}
            t={t}
            isBye={false}
          />
        </Box>
      )}
    </Box>
  );
}

// ── 双败淘汰签表 ──

function DEBracket({ tournament, t }) {
  const rounds = tournament.rounds;

  // 按 _bracket 字段分组
  const wbGroups = [];
  const lbGroups = [];
  let gfPairing = null;
  let gfrPairing = null;

  for (const round of rounds) {
    const wb = round.pairings.filter((p) => p._bracket === 'winners');
    const lb = round.pairings.filter((p) => p._bracket === 'losers');
    const gf = round.pairings.find((p) => p._bracket === 'grand_final');
    const gfr = round.pairings.find((p) => p._bracket === 'grand_final_reset');

    if (wb.length > 0) wbGroups.push(wb);
    if (lb.length > 0) lbGroups.push(lb);
    if (gf) gfPairing = gf;
    if (gfr) gfrPairing = gfr;
  }

  // LB 槽高：每 2 轮加倍（minor + major 各 1 轮）
  const lbSlotH = (roundIndex) =>
    BASE_SLOT_H * Math.pow(2, Math.floor(roundIndex / 2));

  return (
    <Box>
      {/* 胜者组 */}
      {wbGroups.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <SectionHeader label={t('tournament.rounds.bracket.wb')} color="primary.main" />
          <Box sx={{ display: 'flex', alignItems: 'flex-start', overflowX: 'auto' }}>
            {wbGroups.map((pairings, idx) => (
              <Box
                key={idx}
                sx={{ display: 'flex', alignItems: 'flex-start', flexShrink: 0 }}
              >
                <BracketColumn
                  label={`WB R${idx + 1}`}
                  pairings={pairings}
                  roundIndex={idx}
                  isLastRound={idx === wbGroups.length - 1}
                  tournament={tournament}
                  t={t}
                />
                {idx < wbGroups.length - 1 && <RoundArrow />}
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* 败者组 */}
      {lbGroups.length > 0 && (
        <Box sx={{ mb: 3, pt: 2.5, borderTop: 1, borderColor: 'divider' }}>
          <SectionHeader label={t('tournament.rounds.bracket.lb')} color="warning.main" />
          <Box sx={{ display: 'flex', alignItems: 'flex-start', overflowX: 'auto' }}>
            {lbGroups.map((pairings, idx) => (
              <Box
                key={idx}
                sx={{ display: 'flex', alignItems: 'flex-start', flexShrink: 0 }}
              >
                <BracketColumn
                  label={`LB R${idx + 1}`}
                  pairings={pairings}
                  roundIndex={idx}
                  isLastRound={idx === lbGroups.length - 1}
                  tournament={tournament}
                  t={t}
                  slotHeightFn={lbSlotH}
                />
                {idx < lbGroups.length - 1 && <RoundArrow />}
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* 大决赛 */}
      {gfPairing && (
        <Box sx={{ pt: 2.5, borderTop: 1, borderColor: 'divider' }}>
          <SectionHeader label={t('tournament.rounds.bracket.gf')} color="error.main" />
          <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 3 }}>
            {/* GF */}
            <Box>
              <Typography
                sx={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'text.disabled',
                  mb: 1,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                {t('tournament.rounds.bracket.gf')}
              </Typography>
              <BracketMatchCard
                pairing={gfPairing}
                playerA={
                  gfPairing.playerAId ? tournament.getPlayer(gfPairing.playerAId) : null
                }
                playerB={
                  gfPairing.playerBId ? tournament.getPlayer(gfPairing.playerBId) : null
                }
                t={t}
                isBye={false}
              />
            </Box>

            {/* GF Reset */}
            {gfrPairing && (
              <Box>
                <Typography
                  sx={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'text.disabled',
                    mb: 1,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  {t('tournament.rounds.bracket.gfReset')}
                </Typography>
                <BracketMatchCard
                  pairing={gfrPairing}
                  playerA={
                    gfrPairing.playerAId
                      ? tournament.getPlayer(gfrPairing.playerAId)
                      : null
                  }
                  playerB={
                    gfrPairing.playerBId
                      ? tournament.getPlayer(gfrPairing.playerBId)
                      : null
                  }
                  t={t}
                  isBye={false}
                />
              </Box>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
}

// ── 主组件 ──

export default function BracketView({ tournament }) {
  const { t } = useTranslation();
  const isDE = tournament.format === 'double_elimination';

  return (
    <Box
      sx={{
        border: 1,
        borderColor: 'divider',
        borderRadius: 3,
        bgcolor: 'background.paper',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        p: 3,
        overflowX: 'auto',
      }}
    >
      {isDE ? (
        <DEBracket tournament={tournament} t={t} />
      ) : (
        <SEBracket tournament={tournament} t={t} />
      )}
    </Box>
  );
}
