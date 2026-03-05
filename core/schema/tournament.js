// 赛事 Schema
// MongoDB 集合名：tournaments

// 支持的赛制
export const FORMATS = [
  'swiss',                // 瑞士制
  'round_robin',          // 单循环赛
  'double_round_robin',   // 双循环赛
  'elimination',          // 单淘汰
  'double_elimination',   // 双败淘汰
];

// 赛事状态
export const STATUSES = [
  'not_started',          // 未开始
  'in_progress',          // 进行中
  'completed',            // 已完成
];

// 默认计分规则（整数×2，展示时除以2）
export const DEFAULT_SCORING = {
  win: 2,                 // 胜 → 显示 1.0
  draw: 1,                // 和 → 显示 0.5
  loss: 0,                // 负 → 显示 0
};

// 默认破同分规则链（优先级递降）
export const DEFAULT_TIEBREAKERS = [
  'bhc1',                 // 对手分减1（去掉最低对手积分）
  'bh',                   // 对手分（对手积分总和）
  'sb',                   // 索伯延-伯格（加权对手积分）
  'progressive',          // 累进分
];

// 所有可用的破同分规则
export const ALL_TIEBREAKERS = [
  'bhc1',                 // 对手分减1
  'bh',                   // 对手分
  'bhc2',                 // 对手分减2
  'bhm1',                 // 对手分中位
  'de',                   // 直接对阵
  'sb',                   // 索伯延-伯格
  'progressive',          // 累进分
  'wins',                 // 胜局数
  'koya',                 // 科亚系统（循环赛专用）
  'black',                // 执黑局数（棋类专用）
];

// 赛事字段定义
export const tournamentSchema = {
  id: null,               // UUID v4，主键，MongoDB 映射为 _id
  name: null,             // 赛事名称（必填）
  startDate: null,        // 开始日期，格式 YYYY-MM-DD
  endDate: null,          // 结束日期，格式 YYYY-MM-DD，单日赛事可与 startDate 相同
  venue: '',              // 举办场地
  organizer: '',          // 组织者
  chiefReferee: '',       // 裁判长
  format: 'swiss',        // 赛制，取值见 FORMATS
  totalRounds: null,      // 总轮次，null 表示未设定
  colorBalance: false,    // 是否启用颜色（先后手）平衡，棋类比赛开启
  allowDraw: true,        // 是否允许平局
  scoring: DEFAULT_SCORING,     // 计分规则
  tiebreakers: DEFAULT_TIEBREAKERS, // 破同分规则链
  bronzeMatch: false,     // 三四名决赛（仅单淘汰）
  bracketReset: true,     // 大决赛 bracket reset（仅双败淘汰）
  status: 'not_started',  // 赛事状态，取值见 STATUSES
  createdAt: null,        // 创建时间，ISO 8601
  updatedAt: null,        // 最后更新时间，ISO 8601
};

// 默认值（用于构造函数）
export const tournamentDefaults = {
  venue: '',
  organizer: '',
  chiefReferee: '',
  format: 'swiss',
  totalRounds: null,
  colorBalance: false,
  allowDraw: true,
  scoring: DEFAULT_SCORING,
  tiebreakers: DEFAULT_TIEBREAKERS,
  bronzeMatch: false,
  bracketReset: true,
  status: 'not_started',
};

// 字段权限
export const tournamentFields = {
  required: ['name'],     // 创建时必填
  updatable: [            // 允许通过 update() 修改的字段
    'name',
    'startDate',
    'endDate',
    'venue',
    'organizer',
    'chiefReferee',
    'totalRounds',
    'colorBalance',
    'allowDraw',
    'bronzeMatch',
    'bracketReset',
  ],
};
