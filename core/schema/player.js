// 选手 Schema
// MongoDB 集合名：players（按 tournamentId 查询）

// 选手状态
export const PLAYER_STATUSES = [
  'active',               // 在册（正常参赛）
  'withdrawn',            // 已退赛
];

// 性别
export const GENDERS = [
  'male',                 // 男
  'female',               // 女
];

// 选手字段定义
export const playerSchema = {
  id: null,               // UUID v4，主键，MongoDB 映射为 _id
  name: null,             // 选手姓名（必填）
  gender: '',             // 性别，取值见 GENDERS，空串表示未填
  birthDate: '',          // 出生日期，格式 YYYY-MM-DD
  title: '',              // 称号 / 段位（如 GM、业余5段）
  rating: 0,              // 等级分 / 积分，默认 0
  organization: '',       // 所属单位 / 俱乐部
  phone: '',              // 联系方式
  notes: '',              // 备注
  seed: null,             // 种子排位，null 时自动分配为添加顺序
  status: 'active',       // 选手状态，取值见 PLAYER_STATUSES
  createdAt: null,        // 添加时间，ISO 8601
};

// 默认值（用于构造函数）
export const playerDefaults = {
  gender: '',
  birthDate: '',
  title: '',
  rating: 0,
  organization: '',
  phone: '',
  notes: '',
  seed: null,
  status: 'active',
};

// 字段权限
export const playerFields = {
  required: ['name'],     // 创建时必填
  updatable: [            // 允许通过 updatePlayer() 修改的字段
    'name',
    'gender',
    'birthDate',
    'title',
    'rating',
    'organization',
    'phone',
    'notes',
    'seed',
  ],
};
