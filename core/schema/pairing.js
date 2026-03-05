// 对阵 Schema
// 嵌入在 round.pairings 数组中，不单独建集合

// 合法比赛结果
export const VALID_RESULTS = [
  '1-0',                  // A 胜 B
  '0-1',                  // B 胜 A
  '0.5-0.5',              // 和棋
  '1-0F',                 // A 胜（B 弃权 forfeit）
  '0F-1',                 // B 胜（A 弃权 forfeit）
  '0F-0F',                // 双方弃权
  'bye',                  // 轮空（仅 playerA 有效，playerB 为 null）
  'hbye',                 // 半分轮空（请求轮空，得和棋分）
];

// 先后手颜色（棋类比赛使用）
export const COLORS = [
  'white',                // 白方 / 先手
  'black',                // 黑方 / 后手
];

// 结果取反映射（交换 A/B 视角）
export const RESULT_INVERSE = {
  '1-0': '0-1',           // A 胜 → B 视角为负
  '0-1': '1-0',           // B 胜 → A 视角为负
  '1-0F': '0F-1',         // A 胜(弃权) → B 视角为弃权负
  '0F-1': '1-0F',         // B 胜(弃权) → A 视角为弃权负
  '0.5-0.5': '0.5-0.5',   // 和棋 → 双方一致
  '0F-0F': '0F-0F',       // 双方弃权 → 双方一致
  'bye': 'bye',           // 轮空 → 不变
  'hbye': 'hbye',         // 半分轮空 → 不变
};

// 对阵字段定义
export const pairingSchema = {
  tableNumber: null,      // 台号，从 1 开始，轮次内唯一
  playerAId: null,        // A 方选手 ID（外键）
  playerBId: null,        // B 方选手 ID（外键），轮空时为 null
  colorA: null,           // A 方颜色，取值见 COLORS，非棋类比赛为 null
  result: null,           // 比赛结果，取值见 VALID_RESULTS，未录入时为 null
  notes: null,            // 备注，字符串或 null
};
