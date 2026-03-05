// 单循环 / 双循环配对引擎（圆形法，固定最后一位 = Berger 表）
//
// 规则：
// - 固定最后一个位置（或奇数时的轮空槽），其余依次右旋
// - 奇数人：补虚拟 null 槽，每轮恰好一人轮空，null 始终在 playerBId 位置
// - colorBalance=true 时：固定选手偶数轮执白、奇数轮执黑（轮次从 0 算起）
// - 双循环：第二圈交换先后手；FIDE 建议交换第一圈最后两轮顺序，防圈际连续同色

/**
 * 用圆形法生成单循环赛完整赛程
 * @param {(string|null)[]} ids - 按 seed 排序的选手 ID 列表（奇数人已补 null）
 * @returns {{ playerAId: string|null, playerBId: string|null }[][]}
 */
function circleSchedule(ids) {
  const n = ids.length; // 保证为偶数
  const rounds = n - 1;
  const schedule = [];

  // fixed 固定在最后，rotating 是前 n-1 个
  const fixed = ids[n - 1];
  const rotating = ids.slice(0, n - 1);

  for (let r = 0; r < rounds; r++) {
    const roundPairs = [];

    // ── 第一对：rotating[0] vs fixed ──
    const realPlayer = rotating[0];
    if (fixed === null) {
      // 奇数人：null 始终放 playerBId（轮空方）
      roundPairs.push({ playerAId: realPlayer, playerBId: null });
    } else if (r % 2 === 0) {
      roundPairs.push({ playerAId: realPlayer, playerBId: fixed });
    } else {
      roundPairs.push({ playerAId: fixed, playerBId: realPlayer });
    }

    // ── 其余配对：rotating[i] vs rotating[n-1-i] ──
    // rotating 有 n-1 个元素，索引 0..n-2
    for (let i = 1; i < n / 2; i++) {
      const p1 = rotating[i];
      const p2 = rotating[n - 1 - i]; // n-1-i 为 rotating 的镜像位置
      if (r % 2 === 0) {
        roundPairs.push({ playerAId: p1, playerBId: p2 });
      } else {
        roundPairs.push({ playerAId: p2, playerBId: p1 });
      }
    }

    // 圆形法旋转：将 rotating 最后一个元素移到最前
    rotating.unshift(rotating.pop());

    schedule.push(roundPairs);
  }

  return schedule;
}

/**
 * 生成循环赛当前轮的配对
 *
 * @param {import('../Tournament.js').default} tournament
 * @returns {{ playerAId: string, playerBId: string|null, colorA: string|null }[]}
 */
export function roundRobinPairing(tournament) {
  const activePlayers = tournament.activePlayers;
  const isDouble = tournament.format === 'double_round_robin';
  const colorBalance = tournament.colorBalance;
  const currentRound = tournament.rounds.length; // 即将生成的是第 currentRound+1 轮

  // 按 seed 排序后取 id 列表
  const sorted = [...activePlayers].sort((a, b) => a.seed - b.seed).map(p => p.id);

  // 奇数人补 null 到末尾（null 作为固定槽，成为 Berger 固定位）
  const ids = sorted.length % 2 === 1 ? [...sorted, null] : [...sorted];

  // 生成单循环赛程
  let singleSchedule = circleSchedule(ids);

  // 双循环 FIDE 换轮：交换第一圈最后两轮，防圈际连续三轮同色
  if (isDouble && singleSchedule.length >= 2) {
    const len = singleSchedule.length;
    [singleSchedule[len - 1], singleSchedule[len - 2]] =
      [singleSchedule[len - 2], singleSchedule[len - 1]];
  }

  let schedule;
  if (isDouble) {
    // 第二圈：交换所有对阵的 A/B（先后手互换）
    const secondCycle = singleSchedule.map(round =>
      round.map(pair => ({ playerAId: pair.playerBId, playerBId: pair.playerAId }))
    );
    schedule = [...singleSchedule, ...secondCycle];
  } else {
    schedule = singleSchedule;
  }

  const roundPairs = schedule[currentRound];
  if (!roundPairs) return []; // 不应发生，preCheck 已拦截

  return roundPairs.map(pair => ({
    playerAId: pair.playerAId,
    playerBId: pair.playerBId ?? null,
    colorA: colorBalance ? 'white' : null,
  }));
}

/**
 * 计算循环赛总轮次
 * @param {number} playerCount
 * @param {'round_robin'|'double_round_robin'} format
 * @returns {number}
 */
export function calcRoundRobinTotalRounds(playerCount, format) {
  const n = playerCount % 2 === 0 ? playerCount : playerCount + 1;
  const single = n - 1;
  return format === 'double_round_robin' ? single * 2 : single;
}
