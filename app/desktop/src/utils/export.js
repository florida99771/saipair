// Excel / TRF 导出工具
// Excel 使用 SheetJS (xlsx) 生成，TRF 为纯文本格式，均通过 Electron IPC 保存

import * as XLSX from 'xlsx';
import { toTRF } from '@core/formats/trf';

const XLSX_FILTERS = [{ name: 'Excel', extensions: ['xlsx'] }];

async function saveWorkbook(wb, defaultName) {
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return window.electronAPI.saveFileDialog(buf, defaultName, XLSX_FILTERS);
}

// ── 选手名册导出 ──

export async function exportPlayerList(tournament, t) {
  const players = tournament.players;
  const rows = players.map(p => ({
    [t('tournament.players.col.seed')]: p.seed,
    [t('tournament.players.col.name')]: p.name,
    [t('tournament.players.col.gender')]: p.gender ? t(`tournament.players.gender.${p.gender}`) : '',
    [t('tournament.players.col.title')]: p.title || '',
    [t('tournament.players.col.rating')]: p.rating || '',
    [t('tournament.players.col.organization')]: p.organization || '',
    [t('tournament.players.col.phone')]: p.phone || '',
    [t('tournament.players.col.status')]: t(`tournament.players.status.${p.status}`),
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, t('print.playerList'));
  return saveWorkbook(wb, `${tournament.name} - ${t('print.playerList')}.xlsx`);
}

// ── 排名成绩导出 ──

export async function exportRankings(tournament, t, formatScore, formatTb) {
  const rankings = tournament.getRankings();
  const scoring = tournament.scoring;
  const tbKeys = tournament.tiebreakers;

  const rows = rankings.map(entry => {
    let w = 0, d = 0, l = 0;
    for (const r of entry.results) {
      if (r.result === '1-0' || r.result === '1-0F' || r.result === 'bye') w++;
      else if (r.result === '0.5-0.5' || r.result === 'hbye') d++;
      else if (r.result === '0-1' || r.result === '0F-1' || r.result === '0F-0F') l++;
    }

    const row = {
      [t('tournament.rankings.col.rank')]: entry.rank,
      [t('tournament.rankings.col.name')]: entry.player.name,
      [t('tournament.players.col.organization')]: entry.player.organization || '',
      [t('tournament.rankings.col.score')]: formatScore(entry.score, scoring),
      [t('tournament.rankings.col.win')]: w,
      [t('tournament.rankings.col.draw')]: d,
      [t('tournament.rankings.col.loss')]: l,
    };

    for (const key of tbKeys) {
      row[t(`settings.tb.${key}`)] = formatTb(entry.tiebreakers[key] ?? 0, key, scoring);
    }
    return row;
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, t('print.rankings'));
  return saveWorkbook(wb, `${tournament.name} - ${t('print.rankings')}.xlsx`);
}

// ── 轮次对阵表导出 ──

export async function exportRoundPairings(tournament, roundNumber, t) {
  const round = tournament.getRound(roundNumber);
  const scoring = tournament.scoring;
  const useColor = tournament.colorBalance;
  const sideA = useColor ? t('tournament.rounds.col.white') : t('tournament.rounds.col.playerA');
  const sideB = useColor ? t('tournament.rounds.col.black') : t('tournament.rounds.col.playerB');

  const prevScores = calcPrevScores(tournament, roundNumber);

  const rows = round.pairings.map(p => {
    const playerA = tournament.getPlayer(p.playerAId);
    const playerB = p.playerBId ? tournament.getPlayer(p.playerBId) : null;
    const isBye = !playerB && p.result !== 'hbye';
    const isHbye = p.result === 'hbye';
    const [resA, resB] = splitResult(p.result, isBye || isHbye);

    return {
      [t('tournament.rounds.col.table')]: p.tableNumber,
      [`${sideA} - ${t('print.seedLabel')}`]: playerA.seed,
      [`${sideA} - ${t('tournament.players.col.name')}`]: playerA.name,
      [`${sideA} - ${t('print.prevScore')}`]: fmtScore(prevScores.get(p.playerAId) ?? 0, scoring),
      [`${t('tournament.rounds.col.result')} (${sideA})`]: resA,
      [`${t('tournament.rounds.col.result')} (${sideB})`]: resB,
      [`${sideB} - ${t('tournament.players.col.name')}`]: isHbye
        ? t('tournament.rounds.halfByeShort')
        : isBye
          ? t('tournament.rounds.bye')
          : playerB.name,
      [`${sideB} - ${t('print.seedLabel')}`]: playerB ? playerB.seed : '',
      [`${sideB} - ${t('print.prevScore')}`]: playerB ? fmtScore(prevScores.get(p.playerBId) ?? 0, scoring) : '',
    };
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  const sheetName = t('tournament.rounds.roundLabel', { number: roundNumber });
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  return saveWorkbook(wb, `${tournament.name} - ${sheetName}.xlsx`);
}

// ── 交叉表导出 ──

export async function exportCrossTable(tournament, t, formatScore) {
  const rankings = tournament.getRankings();
  const scoring = tournament.scoring;
  const rounds = tournament.rounds;

  // 构建 playerA+playerB → result 映射
  const resultMap = new Map();
  for (const round of rounds) {
    for (const p of round.pairings) {
      if (!p.result || !p.playerBId) continue;
      resultMap.set(`${p.playerAId}_${p.playerBId}`, p.result);
    }
  }

  function getCellResult(rowId, colId) {
    const asA = resultMap.get(`${rowId}_${colId}`);
    if (asA) {
      if (asA === '1-0' || asA === '1-0F') return '+';
      if (asA === '0-1' || asA === '0F-1') return '-';
      if (asA === '0.5-0.5') return '=';
      if (asA === '0F-0F') return '0';
    }
    const asB = resultMap.get(`${colId}_${rowId}`);
    if (asB) {
      if (asB === '1-0' || asB === '1-0F') return '-';
      if (asB === '0-1' || asB === '0F-1') return '+';
      if (asB === '0.5-0.5') return '=';
      if (asB === '0F-0F') return '0';
    }
    return '';
  }

  const rows = rankings.map((row, i) => {
    const r = {
      '#': i + 1,
      [t('tournament.rankings.col.name')]: row.player.name,
    };
    for (let j = 0; j < rankings.length; j++) {
      const colLabel = String(j + 1);
      r[colLabel] = i === j ? '×' : getCellResult(row.player.id, rankings[j].player.id);
    }
    r[t('tournament.rankings.col.score')] = formatScore(row.score, scoring);
    return r;
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, t('print.crossTable'));
  return saveWorkbook(wb, `${tournament.name} - ${t('print.crossTable')}.xlsx`);
}

// ── TRF 格式导出 ──

export async function exportTRF(tournament) {
  const content = toTRF(tournament);
  const encoder = new TextEncoder();
  const buffer = Array.from(encoder.encode(content));
  return window.electronAPI.saveFileDialog(buffer, `${tournament.name}.trf`, [
    { name: 'TRF', extensions: ['trf'] },
  ]);
}

// ── 辅助函数（与 print.js 一致） ──

function fmtScore(raw, scoring) {
  if (scoring.win === 2 && scoring.draw === 1) {
    const val = raw / 2;
    return Number.isInteger(val) ? String(val) + '.0' : val.toFixed(1);
  }
  return String(raw);
}

function calcPrevScores(tournament, roundNumber) {
  const scoring = tournament.scoring;
  const scores = new Map();
  for (const p of tournament.players) scores.set(p.id, 0);
  for (const round of tournament.rounds) {
    if (round.roundNumber >= roundNumber) break;
    for (const p of round.pairings) {
      if (!p.result) continue;
      const aId = p.playerAId, bId = p.playerBId, r = p.result;
      if (r === 'bye') {
        scores.set(aId, (scores.get(aId) || 0) + scoring.win);
      } else if (r === 'hbye') {
        scores.set(aId, (scores.get(aId) || 0) + scoring.draw);
      } else if (r === '1-0' || r === '1-0F') {
        scores.set(aId, (scores.get(aId) || 0) + scoring.win);
        if (bId) scores.set(bId, (scores.get(bId) || 0) + scoring.loss);
      } else if (r === '0-1' || r === '0F-1') {
        scores.set(aId, (scores.get(aId) || 0) + scoring.loss);
        if (bId) scores.set(bId, (scores.get(bId) || 0) + scoring.win);
      } else if (r === '0.5-0.5') {
        scores.set(aId, (scores.get(aId) || 0) + scoring.draw);
        if (bId) scores.set(bId, (scores.get(bId) || 0) + scoring.draw);
      } else if (r === '0F-0F') {
        scores.set(aId, (scores.get(aId) || 0) + scoring.loss);
        if (bId) scores.set(bId, (scores.get(bId) || 0) + scoring.loss);
      }
    }
  }
  return scores;
}

function splitResult(result, isBye) {
  if (isBye || !result) return ['', ''];
  if (result === '1-0' || result === '1-0F') return ['1', '0'];
  if (result === '0-1' || result === '0F-1') return ['0', '1'];
  if (result === '0.5-0.5') return ['\u00BD', '\u00BD'];
  if (result === '0F-0F') return ['0', '0'];
  return ['', ''];
}
