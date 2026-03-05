import { TournamentError, ErrorCodes } from './errors.js';
import {
  FORMATS,
  DEFAULT_SCORING,
  DEFAULT_TIEBREAKERS,
  tournamentDefaults,
  tournamentFields,
  playerDefaults,
  playerFields,
  VALID_RESULTS,
  RESULT_INVERSE,
} from './schema/index.js';
import { swissPairing } from './engines/swiss.js';
import { roundRobinPairing, calcRoundRobinTotalRounds } from './engines/round_robin.js';
import { eliminationPairing, calcEliminationTotalRounds } from './engines/elimination.js';
import { doubleEliminationPairing, calcDoubleEliminationTotalRounds } from './engines/double_elimination.js';
import { calculateTiebreakers } from './tiebreakers.js';

function generateId() {
  return crypto.randomUUID();
}

function nowISO() {
  return new Date().toISOString();
}

export default class Tournament {
  // ── 构造函数 ──

  constructor({
    id,
    name,
    startDate,
    endDate,
    venue = tournamentDefaults.venue,
    organizer = tournamentDefaults.organizer,
    chiefReferee = tournamentDefaults.chiefReferee,
    format = tournamentDefaults.format,
    totalRounds = tournamentDefaults.totalRounds,
    colorBalance = tournamentDefaults.colorBalance,
    allowDraw = tournamentDefaults.allowDraw,
    scoring = tournamentDefaults.scoring,
    tiebreakers = tournamentDefaults.tiebreakers,
    bronzeMatch = tournamentDefaults.bronzeMatch,
    bracketReset = tournamentDefaults.bracketReset,
    status = tournamentDefaults.status,
    createdAt,
    updatedAt,
  } = {}) {
    if (!name) {
      throw new TournamentError(ErrorCodes.NO_FORMAT, 'Tournament name is required');
    }

    const today = nowISO().split('T')[0];
    this._id = id || generateId();
    this._name = name;
    this._startDate = startDate || today;
    this._endDate = endDate || startDate || today;
    this._venue = venue;
    this._organizer = organizer;
    this._chiefReferee = chiefReferee;
    this._format = format;
    this._totalRounds = totalRounds;
    this._colorBalance = colorBalance;
    this._allowDraw = allowDraw;
    this._scoring = { ...DEFAULT_SCORING, ...scoring };
    this._tiebreakers = [...tiebreakers];
    this._bronzeMatch = bronzeMatch;
    this._bracketReset = bracketReset;
    this._status = status;
    this._createdAt = createdAt || nowISO();
    this._updatedAt = updatedAt || nowISO();

    this._players = [];
    this._rounds = [];
    this._avoidances = [];
    this._halfPointByes = new Set(); // 下一轮请求半分轮空的选手 ID
  }

  // ── 只读属性 ──

  get id() { return this._id; }
  get name() { return this._name; }
  get startDate() { return this._startDate; }
  get endDate() { return this._endDate; }
  get venue() { return this._venue; }
  get organizer() { return this._organizer; }
  get chiefReferee() { return this._chiefReferee; }
  get format() { return this._format; }
  get totalRounds() { return this._totalRounds; }
  get colorBalance() { return this._colorBalance; }
  get allowDraw() { return this._allowDraw; }
  get scoring() { return { ...this._scoring }; }
  get tiebreakers() { return [...this._tiebreakers]; }
  get bronzeMatch() { return this._bronzeMatch; }
  get bracketReset() { return this._bracketReset; }
  get status() { return this._status; }
  get createdAt() { return this._createdAt; }
  get updatedAt() { return this._updatedAt; }

  get players() { return [...this._players]; }
  get rounds() { return [...this._rounds]; }
  get avoidances() { return [...this._avoidances]; }

  get activePlayers() {
    return this._players.filter(p => p.status === 'active');
  }

  get currentRound() {
    return this._rounds.length;
  }

  get currentPairings() {
    const last = this._rounds[this._rounds.length - 1];
    return last ? [...last.pairings] : [];
  }

  // ── 赛事信息管理 ──

  update(fields) {
    for (const key of tournamentFields.updatable) {
      if (key in fields) {
        if (key === 'totalRounds' && fields.totalRounds !== null && fields.totalRounds < this._rounds.length) {
          continue;
        }
        this[`_${key}`] = fields[key];
      }
    }
    this._touch();
  }

  setFormat(format, options = {}) {
    if (this._rounds.length > 0) {
      throw new TournamentError(ErrorCodes.FORMAT_LOCKED, 'Cannot change format after rounds have started');
    }
    if (!FORMATS.includes(format)) {
      throw new TournamentError(ErrorCodes.NO_FORMAT, `Invalid format: ${format}`);
    }
    this._format = format;
    if ('totalRounds' in options) this._totalRounds = options.totalRounds;
    if ('colorBalance' in options) this._colorBalance = options.colorBalance;
    if ('bronzeMatch' in options) this._bronzeMatch = options.bronzeMatch;
    if ('bracketReset' in options) this._bracketReset = options.bracketReset;
    this._touch();
  }

  setScoring(scoring) {
    this._scoring = { ...this._scoring, ...scoring };
    this._touch();
  }

  setTiebreakers(tiebreakers) {
    this._tiebreakers = [...tiebreakers];
    this._touch();
  }

  // ── 选手管理 ──

  addPlayer({
    id,
    name,
    gender = playerDefaults.gender,
    birthDate = playerDefaults.birthDate,
    title = playerDefaults.title,
    rating = playerDefaults.rating,
    organization = playerDefaults.organization,
    phone = playerDefaults.phone,
    notes = playerDefaults.notes,
    seed = playerDefaults.seed,
    status = playerDefaults.status,
    createdAt,
  } = {}) {
    if (!name) {
      throw new TournamentError(ErrorCodes.DUPLICATE_PLAYER, 'Player name is required');
    }

    const player = {
      id: id || generateId(),
      name,
      gender,
      birthDate,
      title,
      rating,
      organization,
      phone,
      notes,
      seed: seed ?? this._players.length + 1,
      status,
      createdAt: createdAt || nowISO(),
    };

    this._players.push(player);
    this._touch();
    return { ...player };
  }

  addPlayers(playerList) {
    return playerList.map(p => this.addPlayer(p));
  }

  updatePlayer(playerId, fields) {
    const player = this._findPlayer(playerId);
    for (const key of playerFields.updatable) {
      if (key in fields) {
        player[key] = fields[key];
      }
    }
    this._touch();
    return { ...player };
  }

  removePlayer(playerId) {
    if (this._status !== 'not_started') {
      throw new TournamentError(ErrorCodes.TOURNAMENT_STARTED, 'Cannot remove player after tournament has started. Use withdrawPlayer() instead');
    }
    const index = this._players.findIndex(p => p.id === playerId);
    if (index === -1) {
      throw new TournamentError(ErrorCodes.PLAYER_NOT_FOUND, `Player not found: ${playerId}`);
    }
    this._players.splice(index, 1);
    this._touch();
  }

  withdrawPlayer(playerId) {
    const player = this._findPlayer(playerId);
    if (player.status === 'withdrawn') {
      throw new TournamentError(ErrorCodes.PLAYER_ALREADY_WITHDRAWN, `Player already withdrawn: ${playerId}`);
    }
    player.status = 'withdrawn';
    this._touch();
  }

  restorePlayer(playerId) {
    const player = this._findPlayer(playerId);
    if (player.status !== 'withdrawn') {
      throw new TournamentError(ErrorCodes.PLAYER_NOT_WITHDRAWN, `Player is not withdrawn: ${playerId}`);
    }
    player.status = 'active';
    this._touch();
  }

  getPlayer(playerId) {
    const player = this._findPlayer(playerId);
    return { ...player };
  }

  setSeeds(orderedIds) {
    if (orderedIds) {
      orderedIds.forEach((id, i) => {
        const player = this._players.find(p => p.id === id);
        if (player) player.seed = i + 1;
      });
    } else {
      const sorted = [...this._players].sort((a, b) => b.rating - a.rating);
      sorted.forEach((p, i) => { p.seed = i + 1; });
    }
    this._touch();
  }

  // ── 半分轮空管理 ──

  get halfPointByes() { return new Set(this._halfPointByes); }

  requestHalfPointBye(playerId) {
    this._findPlayer(playerId); // 确认选手存在
    this._halfPointByes.add(playerId);
    this._touch();
  }

  cancelHalfPointBye(playerId) {
    this._halfPointByes.delete(playerId);
    this._touch();
  }

  // ── 回避规则 ──

  addAvoidance(playerAId, playerBId) {
    const exists = this._avoidances.some(
      a => (a[0] === playerAId && a[1] === playerBId) || (a[0] === playerBId && a[1] === playerAId)
    );
    if (!exists) {
      this._avoidances.push([playerAId, playerBId]);
      this._touch();
    }
  }

  removeAvoidance(playerAId, playerBId) {
    this._avoidances = this._avoidances.filter(
      a => !((a[0] === playerAId && a[1] === playerBId) || (a[0] === playerBId && a[1] === playerAId))
    );
    this._touch();
  }

  // ── 轮次编排 ──

  generateNextRound() {
    this._preCheck();

    const n = this.activePlayers.length;

    // 按赛制自动计算 totalRounds（如果未设定）
    if (this._totalRounds === null) {
      if (this._format === 'swiss') {
        this._totalRounds = Math.max(1, Math.ceil(Math.log2(n)));
      } else if (this._format === 'round_robin' || this._format === 'double_round_robin') {
        this._totalRounds = calcRoundRobinTotalRounds(n, this._format);
      } else if (this._format === 'elimination') {
        this._totalRounds = calcEliminationTotalRounds(n, this._bronzeMatch);
      } else if (this._format === 'double_elimination') {
        this._totalRounds = calcDoubleEliminationTotalRounds(n, this._bracketReset);
      }
    }

    // 再次检查总轮次（可能刚计算出来）
    if (this._totalRounds && this._rounds.length >= this._totalRounds) {
      throw new TournamentError(ErrorCodes.TOURNAMENT_COMPLETED, 'All rounds have been completed');
    }

    // 收集半分轮空选手（仅瑞士制支持，在册选手）
    const hbyeIds = new Set();
    if (this._format === 'swiss') {
      for (const pid of this._halfPointByes) {
        const p = this._players.find(pl => pl.id === pid);
        if (p && p.status === 'active') hbyeIds.add(pid);
      }
    }

    let pairings;
    if (this._format === 'swiss') {
      pairings = swissPairing(this, hbyeIds);
    } else if (this._format === 'round_robin' || this._format === 'double_round_robin') {
      pairings = roundRobinPairing(this);
    } else if (this._format === 'elimination') {
      pairings = eliminationPairing(this);
    } else if (this._format === 'double_elimination') {
      pairings = doubleEliminationPairing(this);
    } else {
      throw new TournamentError('NOT_IMPLEMENTED', `Pairing engine for "${this._format}" is not yet implemented`);
    }

    // 添加半分轮空配对（仅瑞士制）
    for (const pid of hbyeIds) {
      pairings.push({ playerAId: pid, playerBId: null, colorA: null, hbye: true });
    }

    // 清除半分轮空请求
    this._halfPointByes.clear();

    return this._addRound(pairings);
  }

  getRound(roundNumber) {
    const round = this._rounds[roundNumber - 1];
    if (!round) {
      throw new TournamentError(ErrorCodes.INVALID_ROUND, `Round ${roundNumber} does not exist`);
    }
    return { ...round, pairings: round.pairings.map(p => ({ ...p })) };
  }

  // ── 成绩录入 ──

  setResult(roundNumber, tableNumber, result) {
    if (!VALID_RESULTS.includes(result)) {
      throw new TournamentError(ErrorCodes.INVALID_RESULT, `Invalid result: ${result}`);
    }
    const pairing = this._findPairing(roundNumber, tableNumber);
    pairing.result = result;

    if (this._status === 'not_started') {
      this._status = 'in_progress';
    }
    this._checkCompletion();
    this._touch();
  }

  clearResult(roundNumber, tableNumber) {
    const pairing = this._findPairing(roundNumber, tableNumber);
    pairing.result = null;
    if (this._status === 'completed') {
      this._status = 'in_progress';
    }
    this._touch();
  }

  clearRoundResults(roundNumber) {
    const round = this._rounds[roundNumber - 1];
    if (!round) {
      throw new TournamentError(ErrorCodes.INVALID_ROUND, `Round ${roundNumber} does not exist`);
    }
    for (const pairing of round.pairings) {
      // 保留系统轮空和半分轮空的结果
      if (pairing.result === 'bye' || pairing.result === 'hbye') continue;
      pairing.result = null;
      pairing.notes = null;
    }
    if (this._status === 'completed') {
      this._status = 'in_progress';
    }
    this._touch();
  }

  setResultNote(roundNumber, tableNumber, notes) {
    const pairing = this._findPairing(roundNumber, tableNumber);
    pairing.notes = notes || null;
    this._touch();
  }

  isRoundComplete(roundNumber) {
    const round = this._rounds[roundNumber - 1];
    if (!round) return false;
    return round.pairings.every(p => p.result !== null);
  }

  // ── 轮次管理 ──

  undoLastRound() {
    if (this._rounds.length === 0) return;
    this._rounds.pop();
    if (this._rounds.length === 0) {
      this._status = 'not_started';
    } else {
      this._status = 'in_progress';
    }
    this._touch();
  }

  /**
   * 一次性生成循环赛所有轮次。
   * 圆形法赛程完全预定，无需等待每轮结果录入，可在赛事开始前一次性公布全部对阵。
   * 仅适用于 round_robin / double_round_robin。
   */
  generateAllRounds() {
    const format = this._format;
    if (format !== 'round_robin' && format !== 'double_round_robin') {
      throw new TournamentError(ErrorCodes.NO_FORMAT, 'generateAllRounds() is only for round-robin formats');
    }

    const active = this.activePlayers;
    if (active.length === 0) {
      throw new TournamentError(ErrorCodes.NO_PLAYERS, 'No active players');
    }
    if (active.length < 3) {
      throw new TournamentError(ErrorCodes.TOO_FEW_PLAYERS, 'Round robin requires at least 3 players', { format, minPlayers: 3 });
    }

    // 计算总轮次（如未设定）
    if (this._totalRounds === null) {
      this._totalRounds = calcRoundRobinTotalRounds(active.length, format);
    }

    if (this._rounds.length >= this._totalRounds) {
      throw new TournamentError(ErrorCodes.TOURNAMENT_COMPLETED, 'All rounds have been completed');
    }

    // 从当前进度开始，生成剩余所有轮次（无需每轮结果已录入）
    while (this._rounds.length < this._totalRounds) {
      const pairings = roundRobinPairing(this);
      this._addRound(pairings);
    }
  }

  /**
   * 撤回循环赛全部编排，清空所有轮次和成绩。
   * totalRounds 重置为 null，下次调用 generateAllRounds() 时重新计算。
   */
  undoAllRounds() {
    if (this._rounds.length === 0) return;
    this._rounds = [];
    this._totalRounds = null;
    this._status = 'not_started';
    this._touch();
  }

  reset() {
    this._rounds = [];
    this._status = 'not_started';
    this._players.forEach(p => { p.status = 'active'; });
    this._touch();
  }

  // ── 排名（基础实现，后续由 RankingCalculator 替代） ──

  get rankings() {
    return this.getRankings();
  }

  getRankings() {
    // 计算破同分值
    const tbMap = this._rounds.length > 0 ? calculateTiebreakers(this) : new Map();

    const stats = this.activePlayers.map(player => {
      let score = 0;
      const results = [];

      for (const round of this._rounds) {
        for (const pairing of round.pairings) {
          const isA = pairing.playerAId === player.id;
          const isB = pairing.playerBId === player.id;
          if (!isA && !isB) continue;

          const result = pairing.result;
          if (!result) continue;

          let pointsGained = 0;
          if (result === 'bye') {
            if (isA) pointsGained = this._scoring.win;
          } else if (result === 'hbye') {
            if (isA) pointsGained = this._scoring.draw;
          } else if (result === '1-0' || result === '1-0F') {
            pointsGained = isA ? this._scoring.win : this._scoring.loss;
          } else if (result === '0-1' || result === '0F-1') {
            pointsGained = isA ? this._scoring.loss : this._scoring.win;
          } else if (result === '0.5-0.5') {
            pointsGained = this._scoring.draw;
          } else if (result === '0F-0F') {
            pointsGained = this._scoring.loss;
          }

          score += pointsGained;
          results.push({
            round: round.roundNumber,
            opponentId: isA ? pairing.playerBId : pairing.playerAId,
            color: pairing.colorA ? (isA ? pairing.colorA : (pairing.colorA === 'white' ? 'black' : 'white')) : null,
            result: isA ? result : RESULT_INVERSE[result] || result,
          });
        }
      }

      return {
        player: { ...player },
        score,
        results,
        tiebreakers: tbMap.get(player.id) || {},
      };
    });

    // 按积分 → 破同分链 → 种子号排序
    const tbKeys = this._tiebreakers;
    stats.sort((a, b) => {
      const diff = b.score - a.score;
      if (diff !== 0) return diff;
      for (const key of tbKeys) {
        const va = a.tiebreakers[key] ?? 0;
        const vb = b.tiebreakers[key] ?? 0;
        if (vb !== va) return vb - va;
      }
      return a.player.seed - b.player.seed;
    });

    stats.forEach((s, i) => { s.rank = i + 1; });
    return stats;
  }

  getPlayerStats(playerId) {
    const all = this.getRankings();
    const found = all.find(s => s.player.id === playerId);
    if (!found) {
      throw new TournamentError(ErrorCodes.PLAYER_NOT_FOUND, `Player not found: ${playerId}`);
    }
    return found;
  }

  // ── 序列化 ──

  toJSON() {
    return {
      id: this._id,
      name: this._name,
      startDate: this._startDate,
      endDate: this._endDate,
      venue: this._venue,
      organizer: this._organizer,
      chiefReferee: this._chiefReferee,
      format: this._format,
      totalRounds: this._totalRounds,
      colorBalance: this._colorBalance,
      allowDraw: this._allowDraw,
      scoring: { ...this._scoring },
      tiebreakers: [...this._tiebreakers],
      bronzeMatch: this._bronzeMatch,
      bracketReset: this._bracketReset,
      status: this._status,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      players: this._players.map(p => ({ ...p })),
      rounds: this._rounds.map(r => ({
        roundNumber: r.roundNumber,
        status: r.status,
        pairings: r.pairings.map(p => ({ ...p })),
        createdAt: r.createdAt,
      })),
      avoidances: this._avoidances.map(a => [...a]),
      halfPointByes: [...this._halfPointByes],
    };
  }

  static fromJSON(json) {
    const tiebreakers = json.tiebreakers || undefined;

    const t = new Tournament({
      id: json.id,
      name: json.name,
      startDate: json.startDate,
      endDate: json.endDate,
      venue: json.venue,
      organizer: json.organizer,
      chiefReferee: json.chiefReferee,
      format: json.format,
      totalRounds: json.totalRounds,
      colorBalance: json.colorBalance,
      allowDraw: json.allowDraw,
      scoring: json.scoring,
      tiebreakers,
      bronzeMatch: json.bronzeMatch,
      bracketReset: json.bracketReset,
      status: json.status,
      createdAt: json.createdAt,
      updatedAt: json.updatedAt,
    });

    if (json.players) {
      t._players = json.players.map(p => ({ ...p }));
    }

    if (json.rounds) {
      t._rounds = json.rounds.map(r => ({
        roundNumber: r.roundNumber,
        status: r.status,
        pairings: r.pairings.map(p => ({ ...p, notes: p.notes || null })),
        createdAt: r.createdAt,
      }));
    }

    if (json.avoidances) {
      t._avoidances = json.avoidances.map(a => [...a]);
    }

    if (json.halfPointByes) {
      t._halfPointByes = new Set(json.halfPointByes);
    }

    return t;
  }

  // ── 内部方法 ──

  _touch() {
    this._updatedAt = nowISO();
  }

  _findPlayer(playerId) {
    const player = this._players.find(p => p.id === playerId);
    if (!player) {
      throw new TournamentError(ErrorCodes.PLAYER_NOT_FOUND, `Player not found: ${playerId}`);
    }
    return player;
  }

  _findPairing(roundNumber, tableNumber) {
    const round = this._rounds[roundNumber - 1];
    if (!round) {
      throw new TournamentError(ErrorCodes.INVALID_ROUND, `Round ${roundNumber} does not exist`);
    }
    const pairing = round.pairings.find(p => p.tableNumber === tableNumber);
    if (!pairing) {
      throw new TournamentError(ErrorCodes.INVALID_TABLE, `Table ${tableNumber} not found in round ${roundNumber}`);
    }
    return pairing;
  }

  _preCheck() {
    if (!this._format) {
      throw new TournamentError(ErrorCodes.NO_FORMAT, 'Tournament format is not set');
    }

    const active = this.activePlayers;
    if (active.length === 0) {
      throw new TournamentError(ErrorCodes.NO_PLAYERS, 'No active players');
    }

    if ((this._format === 'round_robin' || this._format === 'double_round_robin') && active.length < 3) {
      throw new TournamentError(ErrorCodes.TOO_FEW_PLAYERS, 'Round robin requires at least 3 players', { format: this._format, minPlayers: 3 });
    }
    if ((this._format === 'elimination' || this._format === 'double_elimination') && active.length < 2) {
      throw new TournamentError(ErrorCodes.TOO_FEW_PLAYERS, 'Elimination requires at least 2 players', { format: this._format, minPlayers: 2 });
    }

    if (this._rounds.length > 0) {
      const lastRound = this._rounds[this._rounds.length - 1];
      const incomplete = lastRound.pairings.some(p => p.result === null);
      if (incomplete) {
        throw new TournamentError(ErrorCodes.INCOMPLETE_ROUND, `Round ${lastRound.roundNumber} has unrecorded results`, { roundNumber: lastRound.roundNumber });
      }
    }

    // 赛事已标记完成后，不允许继续生成轮次（覆盖 DE bracketReset 提前完成等场景）
    if (this._status === 'completed') {
      throw new TournamentError(ErrorCodes.TOURNAMENT_COMPLETED, 'All rounds have been completed');
    }

    if (this._totalRounds && this._rounds.length >= this._totalRounds) {
      throw new TournamentError(ErrorCodes.TOURNAMENT_COMPLETED, 'All rounds have been completed');
    }
  }

  _checkCompletion() {
    if (!this._totalRounds) return;

    // 双败淘汰 bracketReset：WB 冠军赢得大决赛 → 无需 Reset 轮，赛事提前结束
    if (this._format === 'double_elimination' && this._bracketReset && this._rounds.length > 0) {
      const lastRound = this._rounds[this._rounds.length - 1];
      const gf = lastRound.pairings.find(p => p._bracket === 'grand_final');
      if (gf && gf.result !== null) {
        const lbWon = gf.result === '0-1' || gf.result === '0F-1';
        if (!lbWon) {
          this._status = 'completed';
          return;
        }
      }
    }

    if (this._rounds.length < this._totalRounds) return;
    const lastRound = this._rounds[this._rounds.length - 1];
    if (lastRound.pairings.every(p => p.result !== null)) {
      this._status = 'completed';
    }
  }

  _addRound(pairings) {
    const roundNumber = this._rounds.length + 1;
    const round = {
      roundNumber,
      status: 'pending',
      pairings: pairings.map((p, i) => {
        const pairing = {
          tableNumber: i + 1,
          playerAId: p.playerAId,
          playerBId: p.playerBId ?? null,
          colorA: p.colorA || null,
          result: p.hbye ? 'hbye' : (p.playerBId === null && p.playerAId !== null ? 'bye' : null),
          notes: null,
        };
        // 保留引擎专用元数据（淘汰赛 bracket 标记等）
        if (p._bracket !== undefined) pairing._bracket = p._bracket;
        if (p._isBronze !== undefined) pairing._isBronze = p._isBronze;
        return pairing;
      }),
      createdAt: nowISO(),
    };

    this._rounds.push(round);
    if (this._status === 'not_started') {
      this._status = 'in_progress';
    }
    this._touch();
    return { ...round, pairings: round.pairings.map(p => ({ ...p })) };
  }
}
