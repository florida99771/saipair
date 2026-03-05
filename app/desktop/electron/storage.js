import { app } from 'electron';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';
import { Tournament } from '../../../core/index.js';
import { toMeta } from '../../../core/schema/meta.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = () => path.join(app.getPath('userData'), 'data');

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function safeWriteJSON(filePath, data) {
  await ensureDir(path.dirname(filePath));
  const tmpPath = filePath + '.tmp';
  await fs.writeFile(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
  await fs.rename(tmpPath, filePath);
}

async function readJSON(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content);
}

function metaPath() {
  return path.join(dataDir(), 'tournaments-meta.json');
}

function tournamentDir(tournamentId) {
  return path.join(dataDir(), 'tournaments', tournamentId);
}

function infoPath(tournamentId) {
  return path.join(tournamentDir(tournamentId), 'info.json');
}

function playersPath(tournamentId) {
  return path.join(tournamentDir(tournamentId), 'players.json');
}

function roundPath(tournamentId, roundNumber) {
  return path.join(tournamentDir(tournamentId), 'rounds', `${roundNumber}.json`);
}

function roundsDir(tournamentId) {
  return path.join(tournamentDir(tournamentId), 'rounds');
}

// ── 从 Tournament.toJSON() 拆分为文件结构 ──

function splitJSON(json) {
  const { players, rounds, ...info } = json;
  return {
    info,
    players: { tournamentId: json.id, players: players || [] },
    rounds: (rounds || []).map(r => ({ tournamentId: json.id, ...r })),
    meta: toMeta(json),
  };
}

// ── 从文件结构合并为 Tournament.fromJSON() 入参 ──

function mergeJSON(info, players, rounds) {
  return {
    ...info,
    players: players.players || [],
    rounds: rounds.map(({ tournamentId, ...r }) => r),
  };
}

// ── tournaments-meta.json ──

export async function loadMeta() {
  try {
    return await readJSON(metaPath());
  } catch {
    return [];
  }
}

export async function saveMeta(meta) {
  await safeWriteJSON(metaPath(), meta);
}

// ── 赛事目录 ──

export async function createTournamentDir(tournamentId) {
  await ensureDir(tournamentDir(tournamentId));
  await ensureDir(roundsDir(tournamentId));
}

export async function deleteTournamentDir(tournamentId) {
  await fs.rm(tournamentDir(tournamentId), { recursive: true, force: true });
}

// ── 单文件读写 ──

export async function loadInfo(tournamentId) {
  return readJSON(infoPath(tournamentId));
}

export async function saveInfo(tournamentId, info) {
  await safeWriteJSON(infoPath(tournamentId), info);
}

export async function loadPlayers(tournamentId) {
  try {
    return await readJSON(playersPath(tournamentId));
  } catch {
    return { tournamentId, players: [] };
  }
}

export async function savePlayers(tournamentId, players) {
  await safeWriteJSON(playersPath(tournamentId), players);
}

export async function loadRound(tournamentId, roundNumber) {
  return readJSON(roundPath(tournamentId, roundNumber));
}

export async function loadAllRounds(tournamentId) {
  const dir = roundsDir(tournamentId);
  try {
    const files = await fs.readdir(dir);
    const rounds = [];
    for (const file of files) {
      if (file.endsWith('.json')) {
        rounds.push(await readJSON(path.join(dir, file)));
      }
    }
    rounds.sort((a, b) => a.roundNumber - b.roundNumber);
    return rounds;
  } catch {
    return [];
  }
}

export async function saveRound(tournamentId, roundNumber, round) {
  await safeWriteJSON(roundPath(tournamentId, roundNumber), round);
}

// ── 创建赛事：通过 Tournament 类 ──

export async function createTournament(name) {
  const t = new Tournament({ name });
  const json = t.toJSON();
  const { info, players, meta } = splitJSON(json);

  await createTournamentDir(json.id);
  await saveInfo(json.id, info);
  await savePlayers(json.id, players);

  const metaList = await loadMeta();
  metaList.unshift(meta);
  await saveMeta(metaList);

  return meta;
}

// ── 加载完整赛事：返回可供 Tournament.fromJSON() 使用的数据 ──

export async function loadTournament(tournamentId) {
  const info = await loadInfo(tournamentId);
  const players = await loadPlayers(tournamentId);
  const rounds = await loadAllRounds(tournamentId);
  return mergeJSON(info, players, rounds);
}

// ── 保存完整赛事：从 Tournament.toJSON() 拆分写入 ──

export async function saveTournament(tournamentId, json) {
  const { info, players, rounds, meta } = splitJSON(json);

  await saveInfo(tournamentId, info);
  await savePlayers(tournamentId, players);

  // 清理磁盘上多余的轮次文件（撤回轮次后产生的孤立文件）
  const dir = roundsDir(tournamentId);
  const savedRoundNumbers = new Set(rounds.map(r => r.roundNumber));
  try {
    const files = await fs.readdir(dir);
    for (const file of files) {
      if (file.endsWith('.json')) {
        const num = parseInt(file, 10);
        if (!isNaN(num) && !savedRoundNumbers.has(num)) {
          await fs.unlink(path.join(dir, file));
        }
      }
    }
  } catch { /* rounds 目录不存在时忽略 */ }

  for (const round of rounds) {
    await saveRound(tournamentId, round.roundNumber, round);
  }

  // 更新 meta 列表中对应条目；若条目缺失（防御性兜底），追加到列表头部
  const metaList = await loadMeta();
  const index = metaList.findIndex(m => m.id === tournamentId);
  if (index !== -1) {
    metaList[index] = meta;
  } else {
    metaList.unshift(meta);
  }
  await saveMeta(metaList);
}

// ── 删除赛事 ──

export async function deleteTournament(tournamentId) {
  await deleteTournamentDir(tournamentId);

  const metaList = await loadMeta();
  const filtered = metaList.filter(m => m.id !== tournamentId);
  await saveMeta(filtered);
}

// ── 备份赛事：返回 JSON 字符串 ──

export async function backupTournament(tournamentId) {
  const json = await loadTournament(tournamentId);
  const backup = {
    version: '1',
    exportedAt: new Date().toISOString(),
    tournament: json,
  };
  return JSON.stringify(backup, null, 2);
}

// ── 从备份恢复：解析 JSON 字符串，生成新 UUID，写入文件，返回 meta 条目 ──

export async function restoreBackup(backupStr) {
  const backup = JSON.parse(backupStr);
  if (!backup.tournament) throw new Error('Invalid backup file: missing tournament data');

  const newId = randomUUID();
  const tournamentJson = { ...backup.tournament, id: newId };
  const { info, players, rounds, meta } = splitJSON(tournamentJson);

  await createTournamentDir(newId);
  await saveInfo(newId, info);
  await savePlayers(newId, players);
  for (const round of rounds) {
    await saveRound(newId, round.roundNumber, round);
  }

  // 将新赛事加入 meta 列表（saveTournament 只更新已有条目，不插入新条目）
  const metaList = await loadMeta();
  metaList.unshift(meta);
  await saveMeta(metaList);

  return meta;
}
