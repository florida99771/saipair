// TRF (Tournament Report File) 格式导出
// 符合 FIDE TRF16 标准，用于向 FIDE 提交赛事记录

function fmtDate(d) {
  return d ? d.replace(/-/g, '/') : '';
}

function pad(str, len, right = false) {
  const s = String(str ?? '').slice(0, len);
  return right ? s.padStart(len) : s.padEnd(len);
}

/**
 * 将 Tournament 实例序列化为 TRF 格式字符串
 * @param {import('../Tournament.js').default} tournament
 * @returns {string}
 */
export function toTRF(tournament) {
  const lines = [];

  // ── 头部标签行 ──

  lines.push(`012 ${tournament.name}`);
  if (tournament.venue) lines.push(`022 ${tournament.venue}`);
  if (tournament.startDate) lines.push(`042 ${fmtDate(tournament.startDate)}`);
  if (tournament.endDate) lines.push(`052 ${fmtDate(tournament.endDate)}`);

  const activePlayers = tournament.players.filter((p) => p.status !== 'withdrawn');
  lines.push(`062 ${activePlayers.length}`);

  const ratedCount = activePlayers.filter((p) => p.rating > 0).length;
  lines.push(`072 ${ratedCount}`);

  const typeMap = {
    swiss: 'Swiss',
    round_robin: 'Round Robin',
    double_round_robin: 'Double Round Robin',
    elimination: 'Elimination',
    double_elimination: 'Double Elimination',
  };
  lines.push(`092 ${typeMap[tournament.format] || tournament.format || 'Swiss'}`);

  if (tournament.chiefReferee) lines.push(`102 ${tournament.chiefReferee}`);
  if (tournament.organizer) lines.push(`112 ${tournament.organizer}`);

  const totalRounds = tournament.totalRounds || tournament.currentRound;
  if (totalRounds) lines.push(`132 ${totalRounds}`);

  // ── 选手编号映射（1-based，仅在册选手）──

  const numMap = new Map();
  activePlayers.forEach((p, i) => numMap.set(p.id, i + 1));

  // ── 构建每轮结果矩阵 ──
  // resultMatrix[playerId][roundNumber] = { color, opp, res }

  const resultMatrix = new Map();

  const setResult = (playerId, roundNum, entry) => {
    if (!resultMatrix.has(playerId)) resultMatrix.set(playerId, new Map());
    resultMatrix.get(playerId).set(roundNum, entry);
  };

  for (const round of tournament.rounds) {
    const rn = round.roundNumber;

    for (const pairing of round.pairings) {
      const { playerAId, playerBId, colorA, result } = pairing;

      if (!numMap.has(playerAId)) continue;

      const numA = numMap.get(playerAId);
      const numB = playerBId ? numMap.get(playerBId) : null;

      const colorAChar = colorA === 'white' ? 'w' : colorA === 'black' ? 'b' : '-';
      const colorBChar = colorA === 'white' ? 'b' : colorA === 'black' ? 'w' : '-';

      if (!result) {
        // 未录入结果
        setResult(playerAId, rn, { color: colorAChar, opp: numB ? String(numB).padStart(4, '0') : '0000', res: ' ' });
        if (numB && playerBId) {
          setResult(playerBId, rn, { color: colorBChar, opp: String(numA).padStart(4, '0'), res: ' ' });
        }
        continue;
      }

      if (result === 'bye') {
        setResult(playerAId, rn, { color: '-', opp: '0000', res: '+' });
        continue;
      }

      if (result === 'hbye') {
        setResult(playerAId, rn, { color: '-', opp: '0000', res: 'H' });
        continue;
      }

      // 对局结果
      const resultMap = {
        '1-0':      ['1', '0'],
        '0-1':      ['0', '1'],
        '0.5-0.5':  ['=', '='],
        '1-0F':     ['1', '-'],
        '0F-1':     ['-', '1'],
        '0F-0F':    ['-', '-'],
      };

      const [resA, resB] = resultMap[result] || [' ', ' '];
      const oppA = numB ? String(numB).padStart(4, '0') : '0000';

      setResult(playerAId, rn, { color: colorAChar, opp: oppA, res: resA });

      if (numB && playerBId) {
        setResult(playerBId, rn, {
          color: colorBChar,
          opp: String(numA).padStart(4, '0'),
          res: resB,
        });
      }
    }
  }

  // ── 积分 / 名次 ──

  const rankings = tournament.getRankings();
  const scoreMap = new Map(rankings.map((e) => [e.player.id, e.score]));
  const rankMap = new Map(rankings.map((e) => [e.player.id, e.rank]));
  const scoring = tournament.scoring;

  function fmtScore(raw) {
    if (scoring.win === 2 && scoring.draw === 1) {
      return (raw / 2).toFixed(1);
    }
    return String(raw);
  }

  // ── 选手行 (001) ──

  for (const player of activePlayers) {
    const num = numMap.get(player.id);

    const sex = player.gender === 'male' ? 'm' : player.gender === 'female' ? 'f' : ' ';
    const title = pad(player.title || '', 3);
    const name = pad(player.name || '', 33);
    const rating = pad(player.rating > 0 ? player.rating : '', 4, true);
    const fed = '   '; // 国际赛联代码（我们不存）
    const birth = player.birthDate ? fmtDate(player.birthDate).padEnd(10) : '          ';
    const points = pad(fmtScore(scoreMap.get(player.id) ?? 0), 4, true);
    const rank = pad(rankMap.get(player.id) ?? 0, 4, true);

    let rounds = '';
    for (let r = 1; r <= totalRounds; r++) {
      const entry = resultMatrix.get(player.id)?.get(r);
      if (entry) {
        rounds += `  ${entry.color} ${entry.opp} ${entry.res}`;
      } else {
        rounds += `       `;
      }
    }

    // TRF16 标准格式：001  NNNN G  TTT Name...  RRRR FFF DDDDDDDDDD PPPP  RRRR [rounds]
    lines.push(
      `001  ${String(num).padStart(4, '0')} ${sex}  ${title} ${name} ${rating} ${fed} ${birth} ${points}  ${rank}${rounds}`
    );
  }

  return lines.join('\r\n');
}
