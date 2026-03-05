// 单淘汰赛配对引擎（固定 Bracket）
//
// 规则：
// - 首轮：按 seed 生成固定对阵签表（1vs最末, 2vs次末, ...），不足2^n时补轮空
// - 后续轮：上一轮胜者依次相遇（Bracket 位置不变）
// - 奇数人/非2^n人：高 seed 选手首轮轮空（bye），直接进入下一轮
// - 支持三四名决赛（bronzeMatch）
// - 结果约定：playerA 胜 → '1-0'，playerB 胜 → '0-1'，轮空 → 'bye'

/**
 * 计算不小于 n 的最小 2^k
 */
function nextPowerOf2(n) {
  let p = 1;
  while (p < n) p <<= 1;
  return p;
}

/**
 * 生成首轮 Bracket 签表
 * 遵循标准种子对阵：1 vs 末位，2 vs 次末位……
 * 空位（null）代表轮空，高 seed 选手直接晋级
 *
 * @param {string[]} sortedIds - 按 seed 升序排列的选手 ID
 * @returns {Array<[string|null, string|null]>} - 对阵对，[playerA, playerB]
 */
function buildFirstRoundBracket(sortedIds) {
  const n = sortedIds.length;
  const size = nextPowerOf2(n); // 补齐到 2^k
  const slots = Array(size).fill(null);

  // 按 seed 填入选手，剩余 slot 为 null（轮空）
  for (let i = 0; i < n; i++) {
    slots[i] = sortedIds[i];
  }

  // 标准淘汰签表对阵位置生成（递归对折）
  const pairs = [];
  const positions = buildBracketPositions(size);
  for (let i = 0; i < positions.length; i += 2) {
    pairs.push([slots[positions[i]], slots[positions[i + 1]]]);
  }
  return pairs;
}

/**
 * 递归生成 Bracket 位置序列（保证 seed 1 vs seed size, seed 2 vs seed size-1...）
 * 例如 size=8：返回 [0,7,3,4,1,6,2,5]
 * @param {number} size
 * @returns {number[]}
 */
function buildBracketPositions(size) {
  if (size === 2) return [0, 1];
  const half = size / 2;
  const left = buildBracketPositions(half);
  const right = left.map(p => size - 1 - p);
  const result = [];
  for (let i = 0; i < left.length; i++) {
    result.push(left[i], right[i]);
  }
  return result;
}

/**
 * 从上一轮配对中提取胜者（按 tableNumber 顺序）
 * 胜者保持 Bracket 位置：tableNumber 1 的胜者 vs tableNumber 2 的胜者，依此类推
 *
 * @param {object[]} prevPairings - 上一轮配对列表
 * @param {boolean} isBronzeRound - 是否是三四名决赛轮（取败者）
 * @returns {string[]} - 晋级者 ID 数组（按 tableNumber 排序）
 */
function extractWinners(prevPairings, isBronzeRound = false) {
  const sorted = [...prevPairings].sort((a, b) => a.tableNumber - b.tableNumber);
  const winners = [];

  for (const pairing of sorted) {
    if (pairing.result === 'bye') {
      // 轮空方直接晋级
      winners.push(pairing.playerAId);
      continue;
    }

    let winner = null;
    if (pairing.result === '1-0' || pairing.result === '1-0F') {
      winner = isBronzeRound ? pairing.playerBId : pairing.playerAId;
    } else if (pairing.result === '0-1' || pairing.result === '0F-1') {
      winner = isBronzeRound ? pairing.playerAId : pairing.playerBId;
    }
    // result 为 null 或 '0F-0F' 时 winner 为 null（理论上不会在 preCheck 通过后出现）

    if (winner) winners.push(winner);
  }

  return winners;
}

/**
 * 生成单淘汰赛当前轮配对
 *
 * @param {import('../Tournament.js').default} tournament
 * @returns {{ playerAId: string, playerBId: string|null, colorA: null }[]}
 */
export function eliminationPairing(tournament) {
  const activePlayers = tournament.activePlayers;
  const rounds = tournament.rounds;
  const colorBalance = tournament.colorBalance;
  const bronzeMatch = tournament.bronzeMatch;
  const currentRound = rounds.length; // 已完成轮次数

  // 按 seed 排序
  const sortedIds = [...activePlayers]
    .sort((a, b) => a.seed - b.seed)
    .map(p => p.id);

  if (currentRound === 0) {
    // ── 首轮：生成固定 Bracket ──
    const pairs = buildFirstRoundBracket(sortedIds);
    return pairs.map(([a, b]) => ({
      playerAId: a,
      playerBId: b, // null 代表轮空，Tournament._addRound 会自动处理
      colorA: colorBalance ? 'white' : null,
    }));
  }

  // ── 后续轮次：取上一轮胜者 ──
  const lastRound = rounds[rounds.length - 1];
  const lastPairings = lastRound.pairings;

  // 过滤掉三四名决赛配对（如存在）
  const mainPairings = lastPairings.filter(p => !p._isBronze);
  const mainWinners = extractWinners(mainPairings);

  const pairings = [];

  // 是否这一轮应该生成三四名决赛
  // 三四名决赛：当主赛只剩 2 人时同步生成；败者（第三名候选）配对
  const isGrandFinalRound = mainWinners.length === 2;

  if (bronzeMatch && isGrandFinalRound) {
    // 提取上一轮主赛的败者
    const mainLosers = extractWinners(mainPairings, true);
    if (mainLosers.length >= 2) {
      pairings.push({
        playerAId: mainLosers[0],
        playerBId: mainLosers[1],
        colorA: colorBalance ? 'white' : null,
        _isBronze: true,
      });
    }
  }

  // 生成主赛本轮配对（胜者两两配对，Bracket 顺序不变）
  for (let i = 0; i < mainWinners.length; i += 2) {
    if (i + 1 < mainWinners.length) {
      pairings.push({
        playerAId: mainWinners[i],
        playerBId: mainWinners[i + 1],
        colorA: colorBalance ? 'white' : null,
      });
    }
  }

  return pairings;
}

/**
 * 计算单淘汰赛总轮次
 * @param {number} playerCount
 * @param {boolean} bronzeMatch
 * @returns {number}
 */
export function calcEliminationTotalRounds(playerCount, bronzeMatch) {
  const size = nextPowerOf2(playerCount);
  // 首轮可能有大量轮空，但轮次数等于 log2(size)
  return Math.log2(size);
}
