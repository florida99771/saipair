// Schema 统一导出

// 赛事
export {
  FORMATS,
  STATUSES,
  DEFAULT_SCORING,
  DEFAULT_TIEBREAKERS,
  ALL_TIEBREAKERS,
  tournamentSchema,
  tournamentDefaults,
  tournamentFields,
} from './tournament.js';

// 选手
export {
  PLAYER_STATUSES,
  GENDERS,
  playerSchema,
  playerDefaults,
  playerFields,
} from './player.js';

// 轮次
export {
  ROUND_STATUSES,
  roundSchema,
} from './round.js';

// 对阵
export {
  VALID_RESULTS,
  COLORS,
  RESULT_INVERSE,
  pairingSchema,
} from './pairing.js';

// 赛事摘要
export {
  metaFields,
  metaSchema,
  toMeta,
} from './meta.js';
