// 轮次 Schema
// MongoDB 集合名：rounds（按 tournamentId 查询）

// 轮次状态
export const ROUND_STATUSES = [
  'pending',              // 进行中（有未录入的成绩）
  'completed',            // 已完成（所有成绩已录入）
];

// 轮次字段定义
export const roundSchema = {
  tournamentId: null,     // 所属赛事 ID（外键，索引字段）
  roundNumber: null,      // 轮次序号，从 1 开始
  status: 'pending',      // 轮次状态，取值见 ROUND_STATUSES
  pairings: [],           // 本轮对阵列表，元素结构见 pairingSchema
  createdAt: null,        // 创建时间，ISO 8601
};
