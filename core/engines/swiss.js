// 瑞士制配对引擎（FIDE 荷兰制 MVP）
// 支持 C1(禁止重复), C2(禁止双轮空), C3(颜色约束), C5(轮空规则), C6(最大配对数)
// 颜色分配 E1-E5（仅 colorBalance=true 时启用）

/**
 * 构建回避规则查找集合
 * 存储格式：Set<"id1_id2"> + Set<"id2_id1">（双向）
 */
function buildAvoidanceSet(tournament) {
  const set = new Set();
  for (const [aId, bId] of tournament.avoidances) {
    set.add(`${aId}_${bId}`);
    set.add(`${bId}_${aId}`);
  }
  return set;
}

/**
 * 从 Tournament 实例构建配对专用数据结构
 * score 使用整数（×2 体系）
 */
function buildPairingData(tournament) {
  const activePlayers = tournament.activePlayers;
  const rounds = tournament.rounds;
  const scoring = tournament.scoring;

  // 按 seed 升序排列 → TPN 顺序
  const sorted = [...activePlayers].sort((a, b) => a.seed - b.seed);

  // 构建 id → tpn 映射
  const idToTpn = new Map();
  sorted.forEach((p, i) => idToTpn.set(p.id, i + 1));

  return sorted.map((player, index) => {
    const tpn = index + 1;
    const colorHistory = [];
    const opponents = [];
    let score = 0;
    let receivedBye = false;
    let whiteCount = 0;
    let blackCount = 0;

    for (const round of rounds) {
      let found = false;
      for (const pairing of round.pairings) {
        const isA = pairing.playerAId === player.id;
        const isB = pairing.playerBId === player.id;
        if (!isA && !isB) continue;
        found = true;

        const result = pairing.result;

        if (result === 'bye' || result === 'hbye') {
          if (isA) {
            score += result === 'hbye' ? scoring.draw : scoring.win;
            receivedBye = true;
          }
          colorHistory.push(null);
          opponents.push(0);
        } else if (result) {
          if (result === '1-0' || result === '1-0F') {
            score += isA ? scoring.win : scoring.loss;
          } else if (result === '0-1' || result === '0F-1') {
            score += isA ? scoring.loss : scoring.win;
          } else if (result === '0.5-0.5') {
            score += scoring.draw;
          } else if (result === '0F-0F') {
            score += scoring.loss;
          }

          // 颜色历史
          if (pairing.colorA) {
            if (isA) {
              const c = pairing.colorA === 'white' ? 'W' : 'B';
              colorHistory.push(c);
              if (c === 'W') whiteCount++; else blackCount++;
            } else {
              const c = pairing.colorA === 'white' ? 'B' : 'W';
              colorHistory.push(c);
              if (c === 'W') whiteCount++; else blackCount++;
            }
          } else {
            colorHistory.push(null);
          }

          // 对手 TPN
          const opponentId = isA ? pairing.playerBId : pairing.playerAId;
          opponents.push(idToTpn.get(opponentId) || 0);
        }
        break;
      }
      // 如果该轮没有此选手的配对记录（如退赛后恢复），补 null
      if (!found) {
        colorHistory.push(null);
        opponents.push(0);
      }
    }

    // 判断上一轮是否轮空（用于 C2 检查）
    let lastRoundBye = false;
    if (rounds.length > 0) {
      const lastRound = rounds[rounds.length - 1];
      for (const pairing of lastRound.pairings) {
        if (pairing.playerAId === player.id && (pairing.result === 'bye' || pairing.result === 'hbye')) {
          lastRoundBye = true;
          break;
        }
      }
    }

    return {
      tpn,
      id: player.id,
      score,
      colorHistory,
      opponents,
      receivedBye,
      lastRoundBye,
      colorDifference: whiteCount - blackCount,
      rating: player.rating || 0,
      seed: player.seed,
    };
  });
}

// ── 轮空选择（C5 + C2） ──

function selectByeRecipient(players) {
  // C2: 优先排除上一轮刚轮空的选手（避免连续双轮空）
  let eligible = players.filter(p => !p.lastRoundBye && !p.receivedBye);
  if (eligible.length === 0) {
    // 放宽：允许历史轮空但排除上轮刚轮空
    eligible = players.filter(p => !p.lastRoundBye);
  }
  if (eligible.length === 0) {
    // 极端兜底：所有人都上轮轮空（不太可能）
    eligible = players;
  }

  eligible.sort((a, b) =>
    a.score - b.score ||                       // 积分最低
    b.opponents.length - a.opponents.length ||  // 对弈最多
    b.tpn - a.tpn                               // TPN 最大
  );

  return eligible[0];
}

// ── 积分组 ──

function formScoreGroups(players) {
  const map = new Map();
  for (const p of players) {
    if (!map.has(p.score)) map.set(p.score, []);
    map.get(p.score).push(p);
  }

  return Array.from(map.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([score, group]) => ({
      score: Number(score),
      players: group.sort((a, b) => a.tpn - b.tpn),
    }));
}

// ── 颜色偏好推导 ──

function colorPreference(player) {
  const cd = player.colorDifference;
  const played = player.colorHistory.filter(c => c !== null);

  if (played.length === 0) return { color: null, strength: 'NONE' };

  const lastTwo = played.slice(-2);

  if (cd > 1 || (lastTwo.length === 2 && lastTwo[0] === 'W' && lastTwo[1] === 'W'))
    return { color: 'B', strength: 'ABSOLUTE' };
  if (cd < -1 || (lastTwo.length === 2 && lastTwo[0] === 'B' && lastTwo[1] === 'B'))
    return { color: 'W', strength: 'ABSOLUTE' };
  if (cd === 1) return { color: 'B', strength: 'STRONG' };
  if (cd === -1) return { color: 'W', strength: 'STRONG' };
  if (cd === 0) {
    const lastColor = played[played.length - 1];
    return { color: lastColor === 'W' ? 'B' : 'W', strength: 'MILD' };
  }
  return { color: null, strength: 'NONE' };
}

// ── C3 校验 ──

function violatesC3(p1, p2) {
  const pref1 = colorPreference(p1);
  const pref2 = colorPreference(p2);

  if (pref1.strength !== 'ABSOLUTE' || pref2.strength !== 'ABSOLUTE') return false;
  return pref1.color === pref2.color;
}

// ── 贪心配对 + 回溯 ──

function greedyPairingWithBacktrack(S1, S2, colorBalance, avoidanceSet) {
  const used = new Set();
  const pairs = [];

  function backtrack(i) {
    if (i === S1.length) return true;
    for (let j = 0; j < S2.length; j++) {
      if (used.has(j)) continue;
      // C1: 禁止重复配对
      if (S1[i].opponents.includes(S2[j].tpn)) continue;
      // 回避规则
      if (avoidanceSet.has(`${S1[i].id}_${S2[j].id}`)) continue;
      // C3: 颜色约束（仅 colorBalance）
      if (colorBalance && violatesC3(S1[i], S2[j])) continue;

      used.add(j);
      pairs.push([S1[i], S2[j]]);
      if (backtrack(i + 1)) return true;
      pairs.pop();
      used.delete(j);
    }
    return false;
  }

  return backtrack(0) ? [...pairs] : null;
}

// ── 积分组配对 ──

function pairBracket(bracket, colorBalance, avoidanceSet) {
  const sorted = [...bracket].sort((a, b) => b.score - a.score || a.tpn - b.tpn);
  const maxPairs = Math.floor(sorted.length / 2);

  if (maxPairs === 0) {
    return { pairs: [], downfloaters: sorted };
  }

  // 尝试从完整 maxPairs 开始，逐步减少
  for (let mp = maxPairs; mp >= 1; mp--) {
    const S1 = sorted.slice(0, mp);
    const S2 = sorted.slice(mp);
    const result = greedyPairingWithBacktrack(S1, S2, colorBalance, avoidanceSet);
    if (result) {
      const pairedTpns = new Set();
      for (const [a, b] of result) {
        pairedTpns.add(a.tpn);
        pairedTpns.add(b.tpn);
      }
      const remaining = sorted.filter(p => !pairedTpns.has(p.tpn));
      return { pairs: result, downfloaters: remaining };
    }
  }

  // 全部失败：整组下浮
  return { pairs: [], downfloaters: sorted };
}

// ── 颜色分配（E1-E5） ──

function allocateColors(p1, p2) {
  const pref1 = colorPreference(p1);
  const pref2 = colorPreference(p2);

  let whitePlayer;

  // E1: 不同偏好 → 各取所需
  if (pref1.color && pref2.color && pref1.color !== pref2.color) {
    whitePlayer = pref1.color === 'W' ? p1 : p2;
  }
  // E2: 偏好强度不同 → 满足更强的一方
  else if (pref1.strength !== pref2.strength) {
    const ORDER = { ABSOLUTE: 4, STRONG: 3, MILD: 2, NONE: 1 };
    const stronger = ORDER[pref1.strength] >= ORDER[pref2.strength] ? p1 : p2;
    const strongerPref = stronger === p1 ? pref1 : pref2;
    if (strongerPref.color === 'W') whitePlayer = stronger;
    else if (strongerPref.color === 'B') whitePlayer = stronger === p1 ? p2 : p1;
    else whitePlayer = p1.tpn < p2.tpn ? p1 : p2;
  }
  // E3: 找最近颜色不同的轮次交替
  else {
    const played1 = p1.colorHistory.filter(c => c !== null);
    const played2 = p2.colorHistory.filter(c => c !== null);

    let found = false;
    const minLen = Math.min(played1.length, played2.length);
    for (let i = 1; i <= minLen; i++) {
      const c1 = played1[played1.length - i];
      const c2 = played2[played2.length - i];
      if (c1 !== c2) {
        whitePlayer = c1 === 'W' ? p2 : p1;
        found = true;
        break;
      }
    }

    if (!found) {
      // E4: 满足排名较高者
      const higher = p1.tpn < p2.tpn ? p1 : p2;
      const higherPref = higher === p1 ? pref1 : pref2;
      if (higherPref.color === 'W') whitePlayer = higher;
      else if (higherPref.color === 'B') whitePlayer = higher === p1 ? p2 : p1;
      else whitePlayer = higher;
    }
  }

  if (!whitePlayer) whitePlayer = p1;

  const blackPlayer = whitePlayer === p1 ? p2 : p1;
  return {
    playerAId: whitePlayer.id,
    playerBId: blackPlayer.id,
    colorA: 'white',
  };
}

// ── 首轮配对 ──

function pairFirstRound(players, colorBalance, avoidanceSet) {
  const sorted = [...players].sort((a, b) => a.tpn - b.tpn);

  // 奇数人：TPN 最大者轮空
  let byePlayer = null;
  if (sorted.length % 2 === 1) {
    byePlayer = sorted.pop();
  }

  const half = Math.floor(sorted.length / 2);
  const S1 = sorted.slice(0, half);
  const S2 = sorted.slice(half);

  // 如果有回避规则冲突，使用回溯配对
  if (avoidanceSet.size > 0) {
    const result = greedyPairingWithBacktrack(S1, S2, colorBalance, avoidanceSet);
    if (result) {
      const pairs = result.map(([p1, p2]) => {
        if (colorBalance) {
          const s1White = p1.tpn % 2 === 1;
          return {
            playerAId: s1White ? p1.id : p2.id,
            playerBId: s1White ? p2.id : p1.id,
            colorA: 'white',
          };
        }
        return { playerAId: p1.id, playerBId: p2.id, colorA: null };
      });
      if (byePlayer) {
        pairs.push({ playerAId: byePlayer.id, playerBId: null, colorA: null });
      }
      return pairs;
    }
    // 回溯失败，回退到标准配对
  }

  // 标准对位配对
  const pairs = [];
  for (let i = 0; i < S1.length; i++) {
    if (colorBalance) {
      // E5: 奇数 TPN 执白
      const s1White = S1[i].tpn % 2 === 1;
      pairs.push({
        playerAId: s1White ? S1[i].id : S2[i].id,
        playerBId: s1White ? S2[i].id : S1[i].id,
        colorA: 'white',
      });
    } else {
      // 无颜色：高种子为 playerA
      pairs.push({
        playerAId: S1[i].id,
        playerBId: S2[i].id,
        colorA: null,
      });
    }
  }

  if (byePlayer) {
    pairs.push({
      playerAId: byePlayer.id,
      playerBId: null,
      colorA: null,
    });
  }

  return pairs;
}

// ── 主入口 ──

/**
 * 生成下一轮瑞士制配对
 * @param {Tournament} tournament
 * @param {Set<string>} [excludeIds] - 排除的选手 ID（如半分轮空）
 * @returns {{ playerAId: string, playerBId: string|null, colorA: string|null }[]}
 */
export function swissPairing(tournament, excludeIds = new Set()) {
  let pairingData = buildPairingData(tournament);
  const avoidanceSet = buildAvoidanceSet(tournament);

  // 排除半分轮空等选手
  if (excludeIds.size > 0) {
    pairingData = pairingData.filter(p => !excludeIds.has(p.id));
  }

  const isFirstRound = tournament.rounds.length === 0;
  const colorBalance = tournament.colorBalance;

  // 首轮特殊处理
  if (isFirstRound) {
    return pairFirstRound(pairingData, colorBalance, avoidanceSet);
  }

  // 后续轮次
  let activePlayers = [...pairingData];

  // 1. 奇数人时选择轮空
  let byePlayer = null;
  if (activePlayers.length % 2 === 1) {
    byePlayer = selectByeRecipient(activePlayers);
    activePlayers = activePlayers.filter(p => p.tpn !== byePlayer.tpn);
  }

  // 2. 形成积分组
  const scoreGroups = formScoreGroups(activePlayers);

  // 3. 从高到低处理各组
  const allPairs = [];
  let downfloaters = [];

  for (const group of scoreGroups) {
    const bracket = [...downfloaters, ...group.players];
    const result = pairBracket(bracket, colorBalance, avoidanceSet);
    allPairs.push(...result.pairs);
    downfloaters = result.downfloaters;
  }

  // 4. 兜底：处理剩余下浮者
  if (downfloaters.length >= 2) {
    for (let i = 0; i < downfloaters.length - 1; i += 2) {
      allPairs.push([downfloaters[i], downfloaters[i + 1]]);
    }
    if (downfloaters.length % 2 === 1 && !byePlayer) {
      byePlayer = downfloaters[downfloaters.length - 1];
    }
  }

  // 5. 转换为输出格式
  const pairings = allPairs.map(([p1, p2]) => {
    if (colorBalance) {
      return allocateColors(p1, p2);
    }
    // 无颜色：高种子为 playerA
    return {
      playerAId: p1.tpn < p2.tpn ? p1.id : p2.id,
      playerBId: p1.tpn < p2.tpn ? p2.id : p1.id,
      colorA: null,
    };
  });

  // 6. 添加轮空
  if (byePlayer) {
    pairings.push({
      playerAId: byePlayer.id,
      playerBId: null,
      colorA: null,
    });
  }

  return pairings;
}
