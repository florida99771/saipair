// 打印工具：通过隐藏 iframe 注入 HTML 并触发系统打印对话框

const PRINT_STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, 'Segoe UI', 'Microsoft YaHei', sans-serif; padding: 28px; color: #1a1a1a; }
  h1 { font-size: 22px; font-weight: 700; margin-bottom: 6px; }
  .subtitle { font-size: 14px; color: #666; margin-bottom: 22px; }
  table { width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 16px; }
  th { background: #f5f5f5; font-weight: 600; text-align: left; padding: 12px 12px; border: 1px solid #ddd; }
  td { padding: 11px 12px; border: 1px solid #ddd; }
  .c { text-align: center; }
  .r { text-align: right; }
  .mono { font-family: Consolas, Monaco, monospace; }
  .bold { font-weight: 700; }
  .muted { color: #999; }
  .withdrawn { opacity: 0.5; }
  .info-grid { display: grid; grid-template-columns: 100px 1fr; gap: 6px 12px; font-size: 13px; margin-bottom: 16px; }
  .info-row { display: flex; justify-content: space-between; font-size: 13px; color: #666; margin-bottom: 16px; }
  .info-label { color: #888; font-weight: 500; }
  .cross-table td, .cross-table th { padding: 4px 6px; font-size: 12px; text-align: center; min-width: 28px; }
  .cross-table .name-cell { text-align: left; white-space: nowrap; }
  .win { color: #059669; font-weight: 700; }
  .draw { color: #D97706; font-weight: 600; }
  .loss { color: #DC2626; }
  .print-toolbar {
    position: sticky; top: 0; z-index: 100;
    display: flex; align-items: center; gap: 12px;
    padding: 10px 28px;
    background: #f8f9fa;
    border-bottom: 1px solid #e0e0e0;
  }
  .print-toolbar button {
    padding: 7px 24px;
    border: 1px solid #ccc;
    border-radius: 6px;
    background: #fff;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
  }
  .print-toolbar button:hover { background: #f0f0f0; }
  .print-toolbar .primary {
    background: #1976d2; color: #fff; border-color: #1976d2;
  }
  .print-toolbar .primary:hover { background: #1565c0; }
  @media print {
    .print-toolbar { display: none !important; }
    body { padding: 0; }
    @page { margin: 12mm; }
  }
`;

export function printHTML(title, bodyHTML, t) {
  const toolbar = `<div class="print-toolbar"><button class="primary" onclick="window.print()">${esc(t('print.printBtn'))}</button><button onclick="window.close()">${esc(t('print.closePreview'))}</button></div>`;
  const fullHTML = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>${PRINT_STYLES}</style></head><body>${toolbar}${bodyHTML}</body></html>`;
  window.electronAPI.printContent(fullHTML);
}

function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── 选手名册 ──

export function printPlayerList(tournament, t) {
  const players = tournament.players;
  const title = `${tournament.name} - ${t('print.playerList')}`;

  let html = `<h1>${esc(tournament.name)}</h1>`;
  html += `<div class="subtitle">${esc(t('print.playerList'))} · ${t('tournament.players.count', { count: players.length })}</div>`;
  html += `<table><thead><tr>`;
  html += `<th class="c" style="width:40px">${esc(t('tournament.players.col.seed'))}</th>`;
  html += `<th>${esc(t('tournament.players.col.name'))}</th>`;
  html += `<th class="c" style="width:50px">${esc(t('tournament.players.col.gender'))}</th>`;
  html += `<th>${esc(t('tournament.players.col.title'))}</th>`;
  html += `<th class="c">${esc(t('tournament.players.col.rating'))}</th>`;
  html += `<th>${esc(t('tournament.players.col.organization'))}</th>`;
  html += `<th>${esc(t('tournament.players.col.phone'))}</th>`;
  html += `<th class="c">${esc(t('tournament.players.col.status'))}</th>`;
  html += `</tr></thead><tbody>`;

  for (const p of players) {
    const cls = p.status === 'withdrawn' ? ' class="withdrawn"' : '';
    html += `<tr${cls}>`;
    html += `<td class="c">${p.seed}</td>`;
    html += `<td class="bold">${esc(p.name)}</td>`;
    html += `<td class="c">${p.gender ? esc(t(`tournament.players.gender.${p.gender}`)) : ''}</td>`;
    html += `<td>${esc(p.title) || ''}</td>`;
    html += `<td class="c mono">${p.rating || ''}</td>`;
    html += `<td>${esc(p.organization) || ''}</td>`;
    html += `<td>${esc(p.phone) || ''}</td>`;
    html += `<td class="c">${esc(t(`tournament.players.status.${p.status}`))}</td>`;
    html += `</tr>`;
  }
  html += `</tbody></table>`;

  printHTML(title, html, t);
}

// ── 轮次对阵表（参照标准编排公布表格式） ──

export function printRoundPairings(tournament, roundNumber, t) {
  const round = tournament.getRound(roundNumber);
  const title = `${tournament.name} - ${t('tournament.rounds.roundLabel', { number: roundNumber })}`;
  const useColor = tournament.colorBalance;
  const sideA = useColor ? t('tournament.rounds.col.white') : t('tournament.rounds.col.playerA');
  const sideB = useColor ? t('tournament.rounds.col.black') : t('tournament.rounds.col.playerB');
  const scoring = tournament.scoring;
  const prevScores = calcPrevScores(tournament, roundNumber);

  // 居中标题
  let html = `<h1 style="text-align:center">${esc(tournament.name)}</h1>`;
  html += `<div style="text-align:center;font-size:14px;color:#444;margin-bottom:6px">`;
  if (tournament.format) html += `${esc(t(`format.${tournament.format}`))} · `;
  html += `${esc(t('tournament.rounds.roundLabel', { number: roundNumber }))} · ${esc(t('print.pairingSheet'))}`;
  html += `</div>`;

  // 地点 / 日期信息行
  if (tournament.venue || tournament.startDate) {
    html += `<div class="info-row">`;
    html += `<span>${tournament.venue ? esc(t('tournament.field.venue')) + '\uff1a' + esc(tournament.venue) : ''}</span>`;
    html += `<span>${tournament.startDate ? esc(t('tournament.field.startDate')) + '\uff1a' + esc(tournament.startDate) : ''}</span>`;
    html += `</div>`;
  }

  // 双行表头
  html += `<table><thead>`;
  html += `<tr>`;
  html += `<th rowspan="2" class="c" style="width:46px">${esc(t('tournament.rounds.col.table'))}</th>`;
  html += `<th colspan="4" class="c">${esc(sideA)}</th>`;
  html += `<th colspan="2" class="c">${esc(t('tournament.rounds.col.result'))}</th>`;
  html += `<th colspan="4" class="c">${esc(sideB)}</th>`;
  html += `</tr><tr>`;
  // A 方子列
  html += `<th class="c" style="width:40px">${esc(t('print.seedLabel'))}</th>`;
  html += `<th>${esc(t('tournament.players.col.organization'))}</th>`;
  html += `<th>${esc(t('tournament.players.col.name'))}</th>`;
  html += `<th class="c" style="width:64px">${esc(t('print.prevScore'))}</th>`;
  // 结果子列
  html += `<th class="c" style="width:42px">${esc(sideA)}</th>`;
  html += `<th class="c" style="width:42px">${esc(sideB)}</th>`;
  // B 方子列（镜像顺序）
  html += `<th class="c" style="width:64px">${esc(t('print.prevScore'))}</th>`;
  html += `<th>${esc(t('tournament.players.col.name'))}</th>`;
  html += `<th>${esc(t('tournament.players.col.organization'))}</th>`;
  html += `<th class="c" style="width:40px">${esc(t('print.seedLabel'))}</th>`;
  html += `</tr></thead><tbody>`;

  // 数据行
  for (const p of round.pairings) {
    const playerA = tournament.getPlayer(p.playerAId);
    const playerB = p.playerBId ? tournament.getPlayer(p.playerBId) : null;
    const isHbye = p.result === 'hbye';
    const isBye = !playerB && !isHbye;
    const [resA, resB] = splitResult(p.result, isBye || isHbye);
    const scoreA = fmtScore(prevScores.get(p.playerAId) ?? 0, scoring);
    const scoreB = p.playerBId ? fmtScore(prevScores.get(p.playerBId) ?? 0, scoring) : '';

    html += `<tr>`;
    html += `<td class="c bold">${p.tableNumber}</td>`;
    // A 方
    html += `<td class="c">${playerA.seed}</td>`;
    html += `<td>${esc(playerA.organization) || ''}</td>`;
    html += `<td class="bold">${esc(playerA.name)}</td>`;
    html += `<td class="c mono">${scoreA}</td>`;
    // 结果
    html += `<td class="c mono ${resCls(resA)}">${resA}</td>`;
    html += `<td class="c mono ${resCls(resB)}">${resB}</td>`;
    // B 方（镜像）
    if (isHbye) {
      html += `<td class="c mono"></td>`;
      html += `<td class="muted">${esc(t('tournament.rounds.halfByeShort'))}</td>`;
      html += `<td></td>`;
      html += `<td class="c"></td>`;
    } else if (isBye) {
      html += `<td class="c mono"></td>`;
      html += `<td class="muted">${esc(t('tournament.rounds.bye'))}</td>`;
      html += `<td></td>`;
      html += `<td class="c"></td>`;
    } else {
      html += `<td class="c mono">${scoreB}</td>`;
      html += `<td class="bold">${esc(playerB.name)}</td>`;
      html += `<td>${esc(playerB.organization) || ''}</td>`;
      html += `<td class="c">${playerB.seed}</td>`;
    }
    html += `</tr>`;
  }
  html += `</tbody></table>`;

  printHTML(title, html, t);
}

// ── 排名成绩表 ──

export function printRankings(tournament, t, formatScore, formatTb) {
  const rankings = tournament.getRankings();
  const scoring = tournament.scoring;
  const tbKeys = tournament.tiebreakers;
  const title = `${tournament.name} - ${t('print.rankings')}`;

  let html = `<h1>${esc(tournament.name)}</h1>`;
  html += `<div class="subtitle">${esc(t('print.rankings'))} · ${t('tournament.playersCount', { count: rankings.length })}</div>`;
  html += `<table><thead><tr>`;
  html += `<th class="c" style="width:36px">#</th>`;
  html += `<th>${esc(t('tournament.rankings.col.name'))}</th>`;
  html += `<th class="c">${esc(t('tournament.rankings.col.score'))}</th>`;
  html += `<th class="c">${esc(t('tournament.rankings.col.win'))}</th>`;
  html += `<th class="c">${esc(t('tournament.rankings.col.draw'))}</th>`;
  html += `<th class="c">${esc(t('tournament.rankings.col.loss'))}</th>`;
  for (const key of tbKeys) {
    html += `<th class="c">${esc(t(`settings.tb.${key}`))}</th>`;
  }
  html += `</tr></thead><tbody>`;

  for (const entry of rankings) {
    let w = 0, d = 0, l = 0;
    for (const r of entry.results) {
      if (r.result === '1-0' || r.result === '1-0F' || r.result === 'bye') w++;
      else if (r.result === '0.5-0.5' || r.result === 'hbye') d++;
      else if (r.result === '0-1' || r.result === '0F-1' || r.result === '0F-0F') l++;
    }
    html += `<tr>`;
    html += `<td class="c bold">${entry.rank}</td>`;
    html += `<td class="bold">${esc(entry.player.name)}${entry.player.organization ? ` <span class="muted">${esc(entry.player.organization)}</span>` : ''}</td>`;
    html += `<td class="c mono bold">${formatScore(entry.score, scoring)}</td>`;
    html += `<td class="c win">${w}</td>`;
    html += `<td class="c draw">${d}</td>`;
    html += `<td class="c loss">${l}</td>`;
    for (const key of tbKeys) {
      html += `<td class="c mono">${formatTb(entry.tiebreakers[key] ?? 0, key, scoring)}</td>`;
    }
    html += `</tr>`;
  }
  html += `</tbody></table>`;

  printHTML(title, html, t);
}

// ── 交叉表 ──

export function printCrossTable(tournament, t, formatScore) {
  const rankings = tournament.getRankings();
  const scoring = tournament.scoring;
  const rounds = tournament.rounds;
  const title = `${tournament.name} - ${t('print.crossTable')}`;

  // 构建 playerA+playerB → result 映射
  const resultMap = new Map();
  for (const round of rounds) {
    for (const p of round.pairings) {
      if (!p.result || !p.playerBId) continue;
      resultMap.set(`${p.playerAId}_${p.playerBId}`, p.result);
    }
  }

  // 查找两人对局结果（从 row 视角）
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

  function cellClass(symbol) {
    if (symbol === '+') return 'win';
    if (symbol === '=') return 'draw';
    if (symbol === '-') return 'loss';
    return 'muted';
  }

  let html = `<h1>${esc(tournament.name)}</h1>`;
  html += `<div class="subtitle">${esc(t('print.crossTable'))}</div>`;
  html += `<table class="cross-table"><thead><tr>`;
  html += `<th class="c">#</th><th class="name-cell">${esc(t('tournament.rankings.col.name'))}</th>`;
  for (let i = 0; i < rankings.length; i++) {
    html += `<th>${i + 1}</th>`;
  }
  html += `<th>${esc(t('tournament.rankings.col.score'))}</th>`;
  html += `</tr></thead><tbody>`;

  for (let i = 0; i < rankings.length; i++) {
    const row = rankings[i];
    html += `<tr>`;
    html += `<td class="bold">${i + 1}</td>`;
    html += `<td class="name-cell">${esc(row.player.name)}</td>`;
    for (let j = 0; j < rankings.length; j++) {
      if (i === j) {
        html += `<td style="background:#eee">×</td>`;
      } else {
        const sym = getCellResult(row.player.id, rankings[j].player.id);
        html += `<td class="${cellClass(sym)}">${sym || ''}</td>`;
      }
    }
    html += `<td class="mono bold">${formatScore(row.score, scoring)}</td>`;
    html += `</tr>`;
  }
  html += `</tbody></table>`;

  printHTML(title, html, t);
}

// ── 个人战绩卡 ──

export function printPlayerCard(tournament, playerId, t, formatScore) {
  const player = tournament.getPlayer(playerId);
  const scoring = tournament.scoring;
  const rounds = tournament.rounds;
  const title = `${player.name} - ${t('print.playerCard')}`;

  let html = `<h1>${esc(player.name)}</h1>`;
  html += `<div class="subtitle">${esc(tournament.name)} · ${esc(t('print.playerCard'))}</div>`;

  // 选手基本信息
  html += `<div class="info-grid">`;
  if (player.organization) html += `<div class="info-label">${esc(t('tournament.players.col.organization'))}</div><div>${esc(player.organization)}</div>`;
  if (player.rating) html += `<div class="info-label">${esc(t('tournament.players.col.rating'))}</div><div>${player.rating}</div>`;
  if (player.title) html += `<div class="info-label">${esc(t('tournament.players.col.title'))}</div><div>${esc(player.title)}</div>`;
  html += `</div>`;

  // 逐轮记录
  html += `<table><thead><tr>`;
  html += `<th class="c" style="width:60px">${esc(t('print.round'))}</th>`;
  html += `<th class="c" style="width:50px">${esc(t('tournament.rounds.col.table'))}</th>`;
  if (tournament.colorBalance) html += `<th class="c" style="width:50px">${esc(t('print.color'))}</th>`;
  html += `<th>${esc(t('print.opponent'))}</th>`;
  html += `<th class="c">${esc(t('print.opponentRating'))}</th>`;
  html += `<th class="c" style="width:60px">${esc(t('tournament.rounds.col.result'))}</th>`;
  html += `<th class="c">${esc(t('print.cumulative'))}</th>`;
  html += `</tr></thead><tbody>`;

  let cumScore = 0;
  for (const round of rounds) {
    for (const p of round.pairings) {
      const isA = p.playerAId === playerId;
      const isB = p.playerBId === playerId;
      if (!isA && !isB) continue;

      const isHbye = p.result === 'hbye';
      const isBye = !p.playerBId && !isHbye;
      const opponentId = isA ? p.playerBId : p.playerAId;
      const opponent = opponentId ? tournament.getPlayer(opponentId) : null;

      // 计算得分
      let pts = 0;
      if (p.result) {
        if (p.result === 'bye') pts = isA ? scoring.win : 0;
        else if (p.result === 'hbye') pts = isA ? scoring.draw : 0;
        else if (p.result === '1-0' || p.result === '1-0F') pts = isA ? scoring.win : scoring.loss;
        else if (p.result === '0-1' || p.result === '0F-1') pts = isA ? scoring.loss : scoring.win;
        else if (p.result === '0.5-0.5') pts = scoring.draw;
        else if (p.result === '0F-0F') pts = scoring.loss;
      }
      cumScore += pts;

      // 我方视角的结果
      let myResult = '';
      let resultCls = '';
      if (isHbye) {
        myResult = '\u00BD'; resultCls = 'draw';
      } else if (isBye) {
        myResult = t('tournament.rounds.bye');
      } else if (p.result) {
        if ((isA && (p.result === '1-0' || p.result === '1-0F')) ||
            (isB && (p.result === '0-1' || p.result === '0F-1'))) {
          myResult = '1'; resultCls = 'win';
        } else if (p.result === '0.5-0.5') {
          myResult = '\u00BD'; resultCls = 'draw';
        } else {
          myResult = '0'; resultCls = 'loss';
        }
        if (p.result.includes('F')) myResult += 'F';
      }

      // 颜色
      let colorText = '';
      if (tournament.colorBalance && p.colorA && !isBye) {
        const myColor = isA ? p.colorA : (p.colorA === 'white' ? 'black' : 'white');
        colorText = myColor === 'white' ? '○' : '●';
      }

      html += `<tr>`;
      html += `<td class="c">${round.roundNumber}</td>`;
      html += `<td class="c">${p.tableNumber}</td>`;
      if (tournament.colorBalance) html += `<td class="c" style="font-size:16px">${colorText}</td>`;
      html += `<td>${isHbye ? `<span class="muted">${esc(t('tournament.rounds.halfByeShort'))}</span>` : isBye ? `<span class="muted">${esc(t('tournament.rounds.bye'))}</span>` : esc(opponent?.name || '')}</td>`;
      html += `<td class="c mono">${opponent?.rating || ''}</td>`;
      html += `<td class="c ${resultCls} bold">${myResult}</td>`;
      html += `<td class="c mono bold">${formatScore(cumScore, scoring)}</td>`;
      html += `</tr>`;
      break;
    }
  }
  html += `</tbody></table>`;

  printHTML(title, html, t);
}

// ── 辅助 ──

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

function resCls(r) {
  if (r === '1') return 'win';
  if (r === '0') return 'loss';
  if (r === '\u00BD') return 'draw';
  return '';
}
