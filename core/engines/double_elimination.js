// 双败淘汰赛配对引擎
//
// 结构（以 8 人为例，k=log2(8)=3）：
//   TR1: WR1（胜者组第1轮，纯WB）
//   TR2: WR2 + LR1-minor（LR1用WR1落败者内战）
//   TR3: WR3/WBF + LR2-major（LR2 = LR1存活 vs WR2落败者）
//   TR4: LR3-minor（LR2存活内战，纯LB）
//   TR5: LR4-major（LR3存活 vs WBF落败者，纯LB）
//   TR6: 大决赛
//   TR7: 大决赛 Reset（可选）
//
// 总轮次 = 2*k（不含reset）或 2*k+1（含reset）
//
// 落败者顺序使用 NORS 拆分-反转置换，避免 WB 刚交手的选手在 LB 中重赛。
// 每个 pairing 带 _bracket 字段（通过 _addRound 持久化）：
//   'winners' | 'losers' | 'grand_final' | 'grand_final_reset'

// ── 工具函数 ──

function nextPowerOf2(n) {
  let p = 1;
  while (p < n) p <<= 1;
  return p;
}

/**
 * 递归生成标准淘汰赛 Bracket 位置序列
 * 保证 seed1 vs seedN, seed2 vs seedN-1, ... 且 seed1/seed2 在不同半区
 */
function buildPositions(size) {
  if (size === 2) return [0, 1];
  const half = size / 2;
  const left = buildPositions(half);
  const right = left.map(p => size - 1 - p);
  const result = [];
  for (let i = 0; i < left.length; i++) result.push(left[i], right[i]);
  return result;
}

/**
 * NORS 拆分-反转置换：防止 WB 落败者在 LB 中遇到刚才的对手
 * depth=0 时直接返回（WR1 落败者直接入 LB，无需置换）
 */
function splitAndReverse(list, depth) {
  if (depth === 0 || list.length <= 1) return list;
  const mid = Math.floor(list.length / 2);
  return [
    ...splitAndReverse(list.slice(mid), depth - 1),
    ...splitAndReverse(list.slice(0, mid), depth - 1),
  ];
}

/**
 * 对 WB 落败者应用 NORS 置换
 * @param {string[]} losers - 按对阵桌号排序的落败者列表
 * @param {number} wbRoundIndex - WB 轮次（0-based），WR1=0, WR2=1 ...
 */
function applyDropOrder(losers, wbRoundIndex) {
  return splitAndReverse([...losers], wbRoundIndex);
}

// ── 状态分析 ──

/**
 * 从历史 rounds 中统计当前 WB/LB 轮次完成数及大决赛状态
 */
function analyzeState(rounds) {
  let wbCompleted = 0;
  let lbCompleted = 0;
  let grandFinalResult = null; // null | '1-0' | '0-1'
  let resetPlayed = false;

  for (const round of rounds) {
    const hasWB = round.pairings.some(p => p._bracket === 'winners');
    const hasLB = round.pairings.some(p => p._bracket === 'losers');
    const gf = round.pairings.find(p => p._bracket === 'grand_final');
    const gfr = round.pairings.find(p => p._bracket === 'grand_final_reset');

    if (hasWB) wbCompleted++;
    if (hasLB) lbCompleted++;
    if (gf?.result) grandFinalResult = gf.result;
    if (gfr) resetPlayed = true;
  }

  return { wbCompleted, lbCompleted, grandFinalResult, resetPlayed };
}

// ── WB 轮次生成 ──

/**
 * 生成 WR1（首轮胜者组）
 */
function generateWR1(sortedIds, colorBalance) {
  const size = nextPowerOf2(sortedIds.length);
  const slots = Array(size).fill(null);
  sortedIds.forEach((id, i) => { slots[i] = id; });

  const positions = buildPositions(size);
  const pairings = [];
  for (let i = 0; i < positions.length; i += 2) {
    pairings.push({
      playerAId: slots[positions[i]],
      playerBId: slots[positions[i + 1]],
      colorA: colorBalance ? 'white' : null,
      _bracket: 'winners',
    });
  }
  return pairings;
}

/**
 * 从历史取第 wbRoundNum 轮（1-based）的 WB 配对
 */
function getWBRoundPairings(rounds, wbRoundNum) {
  let count = 0;
  for (const round of rounds) {
    const wb = round.pairings.filter(p => p._bracket === 'winners');
    if (wb.length > 0) {
      count++;
      if (count === wbRoundNum) return wb;
    }
  }
  return [];
}

/**
 * 从配对列表按桌号顺序提取胜者和败者
 */
function extractWinnersLosers(pairings) {
  const sorted = [...pairings].sort((a, b) => a.tableNumber - b.tableNumber);
  const winners = [], losers = [];
  for (const p of sorted) {
    if (p.result === 'bye') {
      if (p.playerAId) winners.push(p.playerAId);
      continue;
    }
    if (p.result === '1-0' || p.result === '1-0F') {
      if (p.playerAId) winners.push(p.playerAId);
      if (p.playerBId) losers.push(p.playerBId);
    } else if (p.result === '0-1' || p.result === '0F-1') {
      if (p.playerBId) winners.push(p.playerBId);
      if (p.playerAId) losers.push(p.playerAId);
    }
  }
  return { winners, losers };
}

/**
 * 生成下一轮 WB 配对（上一轮 WB 胜者两两对阵）
 */
function generateNextWBRound(rounds, colorBalance) {
  const state = analyzeState(rounds);
  const lastWBPairings = getWBRoundPairings(rounds, state.wbCompleted);
  const { winners } = extractWinnersLosers(lastWBPairings);

  const pairings = [];
  for (let i = 0; i < winners.length; i += 2) {
    if (i + 1 < winners.length) {
      pairings.push({
        playerAId: winners[i],
        playerBId: winners[i + 1],
        colorA: colorBalance ? 'white' : null,
        _bracket: 'winners',
      });
    }
  }
  return pairings;
}

// ── LB 轮次生成 ──

/**
 * 获取最近一轮 LB 的存活者（按桌号顺序）
 */
function getLBSurvivors(rounds, lbCompleted) {
  if (lbCompleted === 0) return [];
  let count = 0;
  for (const round of rounds) {
    const lb = round.pairings.filter(p => p._bracket === 'losers');
    if (lb.length > 0) {
      count++;
      if (count === lbCompleted) {
        return extractWinnersLosers(lb).winners;
      }
    }
  }
  return [];
}

/**
 * 生成 LB 轮次配对
 * @param {object[]} rounds - 历史轮次
 * @param {number} lbRoundNum - 即将生成的 LB 轮次编号（1-based）
 *   奇数 = minor（LB 内战），偶数 = major（LB 存活 vs WB 落败者）
 * @param {boolean} colorBalance
 */
function generateLBRound(rounds, lbRoundNum, colorBalance) {
  const state = analyzeState(rounds);
  const isMinor = lbRoundNum % 2 === 1;
  const pairings = [];

  if (isMinor) {
    // ── Minor（内战）：LB 存活者两两对阵 ──
    let survivors;
    if (lbRoundNum === 1) {
      // LR1：WR1 落败者（roundIndex=0，直接入LB，不做置换）
      const wr1 = getWBRoundPairings(rounds, 1);
      survivors = extractWinnersLosers(wr1).losers; // 已按桌号排序
    } else {
      survivors = getLBSurvivors(rounds, state.lbCompleted);
    }

    for (let i = 0; i < survivors.length; i += 2) {
      if (i + 1 < survivors.length) {
        pairings.push({
          playerAId: survivors[i],
          playerBId: survivors[i + 1],
          colorA: colorBalance ? 'white' : null,
          _bracket: 'losers',
        });
      }
    }
  } else {
    // ── Major：LB 存活者 vs NORS 置换后的 WB 落败者 ──
    const lbSurvivors = getLBSurvivors(rounds, state.lbCompleted);

    // 第 j 个 major 轮（j = lbRoundNum/2）使用 WR[j+1] 的落败者，roundIndex = j
    const j = lbRoundNum / 2;
    const wbRoundNum = j + 1; // WB 轮次（WR2, WR3, ..., WBF）
    const wbPairings = getWBRoundPairings(rounds, wbRoundNum);
    const { losers: wbLosers } = extractWinnersLosers(wbPairings);

    // 应用 NORS 置换（roundIndex = j，j>=1 时生效）
    const reorderedLosers = applyDropOrder(wbLosers, j);

    for (let i = 0; i < lbSurvivors.length && i < reorderedLosers.length; i++) {
      pairings.push({
        playerAId: lbSurvivors[i],
        playerBId: reorderedLosers[i],
        colorA: colorBalance ? 'white' : null,
        _bracket: 'losers',
      });
    }
  }

  return pairings;
}

// ── 大决赛 ──

function generateGrandFinal(rounds, colorBalance) {
  // WB 冠军：最后一轮 WB 的胜者
  const state = analyzeState(rounds);
  const lastWBPairings = getWBRoundPairings(rounds, state.wbCompleted);
  const { winners: wbWinners } = extractWinnersLosers(lastWBPairings);
  const wbChampion = wbWinners[0];

  // LB 冠军：最后一轮 LB 的胜者
  const lbSurvivors = getLBSurvivors(rounds, state.lbCompleted);
  const lbChampion = lbSurvivors[0];

  return [{
    playerAId: wbChampion,
    playerBId: lbChampion,
    colorA: colorBalance ? 'white' : null,
    _bracket: 'grand_final',
  }];
}

function generateGrandFinalReset(rounds, colorBalance) {
  // 找到大决赛配对，playerA 是 WB 冠军，playerB 是 LB 冠军
  for (const round of rounds) {
    const gf = round.pairings.find(p => p._bracket === 'grand_final');
    if (gf) {
      return [{
        playerAId: gf.playerAId,
        playerBId: gf.playerBId,
        colorA: colorBalance ? 'white' : null,
        _bracket: 'grand_final_reset',
      }];
    }
  }
  return [];
}

// ── 主入口 ──

/**
 * 生成双败淘汰赛当前轮配对
 * @param {import('../Tournament.js').default} tournament
 */
export function doubleEliminationPairing(tournament) {
  const { activePlayers, rounds, colorBalance, bracketReset } = tournament;
  const sortedIds = [...activePlayers].sort((a, b) => a.seed - b.seed).map(p => p.id);

  const size = nextPowerOf2(sortedIds.length);
  const k = Math.log2(size); // WB 总轮次

  const state = analyzeState(rounds);
  const { wbCompleted, lbCompleted, grandFinalResult, resetPlayed } = state;

  // ── 大决赛 Reset ──
  if (grandFinalResult !== null && !resetPlayed) {
    const lbWon = grandFinalResult === '0-1' || grandFinalResult === '0F-1';
    if (lbWon && bracketReset) {
      return generateGrandFinalReset(rounds, colorBalance);
    }
    return []; // WB 冠军已赢，赛事结束（preCheck 应已拦截）
  }

  // ── 大决赛 ──
  // 触发条件：所有 LB 轮次完成（2*(k-1) 轮）
  if (lbCompleted === 2 * (k - 1)) {
    return generateGrandFinal(rounds, colorBalance);
  }

  // ── WR1（首轮，无历史）──
  if (wbCompleted === 0) {
    return generateWR1(sortedIds, colorBalance);
  }

  const pairings = [];

  // ── WB 未结束：生成下一轮 WB ──
  if (wbCompleted < k) {
    pairings.push(...generateNextWBRound(rounds, colorBalance));
  }

  // ── 生成下一轮 LB ──
  // lbCompleted < 2*(k-1) 且 LB 轮次跟得上 WB
  const nextLBRound = lbCompleted + 1;
  pairings.push(...generateLBRound(rounds, nextLBRound, colorBalance));

  return pairings;
}

/**
 * 计算双败淘汰赛总轮次
 * @param {number} playerCount
 * @param {boolean} bracketReset
 * @returns {number}
 */
export function calcDoubleEliminationTotalRounds(playerCount, bracketReset) {
  const size = nextPowerOf2(playerCount);
  const k = Math.log2(size);
  // TR1(WR1) + TR2..TRk(WB+LB交替) + TR[k+1..2k-1](纯LB) + GF = 2k 轮
  const base = 2 * k;
  return bracketReset ? base + 1 : base;
}
