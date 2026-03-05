// 赛事摘要 Schema（Meta）
// 存储位置：tournaments-meta.json（顶层数组）
// 用于首页赛事列表渲染，避免加载完整赛事数据

// 摘要字段列表
export const metaFields = [
  'id',                   // 赛事 ID，与 tournament.id 一致
  'name',                 // 赛事名称
  'startDate',            // 开始日期，YYYY-MM-DD
  'endDate',              // 结束日期，YYYY-MM-DD
  'format',               // 赛制
  'status',               // 赛事状态
  'playerCount',          // 选手总数
  'currentRound',         // 当前轮次（已完成的轮次数）
  'updatedAt',            // 最后更新时间，ISO 8601
];

// 摘要字段定义
export const metaSchema = {
  id: null,               // 赛事 ID，与 tournament.id 一致
  name: null,             // 赛事名称
  startDate: null,        // 开始日期，YYYY-MM-DD
  endDate: null,          // 结束日期，YYYY-MM-DD
  format: null,           // 赛制
  status: null,           // 赛事状态
  playerCount: 0,         // 选手总数
  currentRound: 0,        // 当前轮次（已完成的轮次数）
  updatedAt: null,        // 最后更新时间，ISO 8601
};

// 从 Tournament.toJSON() 提取摘要
export function toMeta(json) {
  return {
    id: json.id,
    name: json.name,
    startDate: json.startDate,
    endDate: json.endDate,
    format: json.format,
    status: json.status,
    playerCount: (json.players || []).length,
    currentRound: (json.rounds || []).length,
    updatedAt: json.updatedAt,
  };
}
