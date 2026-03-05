// 破同分计算模块
// 所有数值使用原始积分体系（与 Tournament.scoring 一致）
// 展示格式化由 UI 层负责

/**
 * 计算所有在册选手的破同分值
 * @param {Tournament} tournament
 * @returns {Map<string, Object>} playerId -> { bh, bhc1, bhc2, bhm1, sb, progressive, wins, koya, black }
 */
export function calculateTiebreakers(tournament) {
  const scoring = tournament.scoring;
  const rounds = tournament.rounds;
  const allPlayers = tournament.players;
  const activePlayers = tournament.activePlayers;

  // 1. 计算所有选手（含退赛者）的最终积分，用于 Buchholz 等
  const scoreMap = new Map();
  for (const player of allPlayers) {
    scoreMap.set(player.id, computePlayerScore(player.id, rounds, scoring));
  }

  // 2. 为每位在册选手计算破同分值
  const result = new Map();
  for (const player of activePlayers) {
    const data = collectRoundData(player.id, rounds, scoring);
    const playerScore = scoreMap.get(player.id) || 0;
    result.set(player.id, computeAll(data, scoreMap, playerScore, rounds.length, scoring));
  }

  return result;
}

// ── 计算选手积分 ──

function computePlayerScore(playerId, rounds, scoring) {
  let score = 0;
  for (const round of rounds) {
    for (const p of round.pairings) {
      const isA = p.playerAId === playerId;
      const isB = p.playerBId === playerId;
      if (!isA && !isB) continue;
      score += getPointsForResult(p.result, isA, scoring);
      break;
    }
  }
  return score;
}

function getPointsForResult(result, isA, scoring) {
  if (!result) return 0;
  if (result === 'bye') return isA ? scoring.win : 0;
  if (result === 'hbye') return isA ? scoring.draw : 0;
  if (result === '1-0' || result === '1-0F') return isA ? scoring.win : scoring.loss;
  if (result === '0-1' || result === '0F-1') return isA ? scoring.loss : scoring.win;
  if (result === '0.5-0.5') return scoring.draw;
  if (result === '0F-0F') return scoring.loss;
  return 0;
}

// ── 收集选手每轮数据 ──

function collectRoundData(playerId, rounds, scoring) {
  const opponents = [];    // { opponentId, resultFraction } — resultFraction: 1=胜, 0.5=和, 0=负
  const opponentIds = [];  // 仅对手 ID 列表（不含轮空）
  const roundScores = [];  // 每轮得分
  let wins = 0;
  let blackCount = 0;

  for (const round of rounds) {
    let found = false;
    for (const p of round.pairings) {
      const isA = p.playerAId === playerId;
      const isB = p.playerBId === playerId;
      if (!isA && !isB) continue;
      found = true;

      const points = getPointsForResult(p.result, isA, scoring);
      roundScores.push(points);

      if (p.result === 'bye' || p.result === 'hbye' || !p.result) break;

      const opponentId = isA ? p.playerBId : p.playerAId;
      if (!opponentId) break;

      // 胜负分数（标准化为 0/0.5/1）
      let frac = 0;
      if (p.result === '1-0' || p.result === '1-0F') {
        frac = isA ? 1 : 0;
        if (isA) wins++;
      } else if (p.result === '0-1' || p.result === '0F-1') {
        frac = isA ? 0 : 1;
        if (isB) wins++;
      } else if (p.result === '0.5-0.5') {
        frac = 0.5;
      }
      // 0F-0F: frac = 0, no win

      opponents.push({ opponentId, resultFraction: frac });
      opponentIds.push(opponentId);

      // 颜色追踪
      if (p.colorA) {
        const myColor = isA ? p.colorA : (p.colorA === 'white' ? 'black' : 'white');
        if (myColor === 'black') blackCount++;
      }
      break;
    }
    if (!found) roundScores.push(0);
  }

  return { opponents, opponentIds, roundScores, wins, blackCount };
}

// ── 计算各项破同分值 ──

function computeAll(data, scoreMap, playerScore, totalRounds, scoring) {
  const oppScores = data.opponentIds.map(id => scoreMap.get(id) || 0);

  return {
    bh: buchholz(oppScores),
    bhc1: buchholzCut1(oppScores),
    bhc2: buchholzCut2(oppScores),
    bhm1: buchholzMedian(oppScores),
    de: directEncounter(data.opponents, scoreMap, playerScore, scoring),
    sb: sonnebornBerger(data.opponents, scoreMap),
    progressive: progressiveScore(data.roundScores),
    wins: data.wins,
    koya: koyaSystem(data.opponents, scoreMap, totalRounds, scoring),
    black: data.blackCount,
  };
}

// Buchholz：所有对手积分之和
function buchholz(oppScores) {
  return oppScores.reduce((a, b) => a + b, 0);
}

// Buchholz Cut-1：去掉最低对手积分
function buchholzCut1(oppScores) {
  if (oppScores.length <= 1) return 0;
  const sorted = [...oppScores].sort((a, b) => a - b);
  return sorted.slice(1).reduce((a, b) => a + b, 0);
}

// Buchholz Cut-2：去掉最低的两个
function buchholzCut2(oppScores) {
  if (oppScores.length <= 2) return 0;
  const sorted = [...oppScores].sort((a, b) => a - b);
  return sorted.slice(2).reduce((a, b) => a + b, 0);
}

// 中位 Buchholz：去掉最高和最低
function buchholzMedian(oppScores) {
  if (oppScores.length <= 2) return 0;
  const sorted = [...oppScores].sort((a, b) => a - b);
  return sorted.slice(1, -1).reduce((a, b) => a + b, 0);
}

// 直接对阵：与同积分对手交手所获得的积分
function directEncounter(opponents, scoreMap, playerScore, scoring) {
  let total = 0;
  for (const { opponentId, resultFraction } of opponents) {
    const oppScore = scoreMap.get(opponentId) || 0;
    if (oppScore === playerScore) {
      total += resultFraction * scoring.win;
    }
  }
  return total;
}

// Sonneborn-Berger：胜局算对手全分，和棋算半分，负局不计
function sonnebornBerger(opponents, scoreMap) {
  let total = 0;
  for (const { opponentId, resultFraction } of opponents) {
    const oppScore = scoreMap.get(opponentId) || 0;
    total += resultFraction * oppScore;
  }
  return total;
}

// 累进分：每轮累计积分的逐轮求和
function progressiveScore(roundScores) {
  let running = 0;
  let total = 0;
  for (const rs of roundScores) {
    running += rs;
    total += running;
  }
  return total;
}

// Koya 系统：对达到 50%+ 最大可能积分的对手所取得的分数
function koyaSystem(opponents, scoreMap, totalRounds, scoring) {
  const maxPossible = totalRounds * scoring.win;
  const threshold = maxPossible * 0.5;
  let total = 0;
  for (const { opponentId, resultFraction } of opponents) {
    const oppScore = scoreMap.get(opponentId) || 0;
    if (oppScore >= threshold) {
      total += resultFraction * scoring.win;
    }
  }
  return total;
}
