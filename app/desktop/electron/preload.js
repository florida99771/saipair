const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  winMinimize: () => ipcRenderer.invoke('win:minimize'),
  winMaximize: () => ipcRenderer.invoke('win:maximize'),
  winClose: () => ipcRenderer.invoke('win:close'),

  // Storage — 赛事生命周期
  createTournament: (name) => ipcRenderer.invoke('storage:createTournament', name),
  deleteTournament: (id) => ipcRenderer.invoke('storage:deleteTournament', id),
  loadMeta: () => ipcRenderer.invoke('storage:loadMeta'),

  // Storage — 完整赛事（进入赛事时加载，操作后保存）
  loadTournament: (id) => ipcRenderer.invoke('storage:loadTournament', id),
  saveTournament: (id, json) => ipcRenderer.invoke('storage:saveTournament', id, json),

  // Print
  printContent: (html) => ipcRenderer.invoke('print:content', html),

  // File export
  saveFileDialog: (buffer, defaultName, filters) =>
    ipcRenderer.invoke('file:saveDialog', buffer, defaultName, filters),

  // Storage — 按需单文件读写
  loadInfo: (id) => ipcRenderer.invoke('storage:loadInfo', id),
  saveInfo: (id, info) => ipcRenderer.invoke('storage:saveInfo', id, info),
  loadPlayers: (id) => ipcRenderer.invoke('storage:loadPlayers', id),
  savePlayers: (id, players) => ipcRenderer.invoke('storage:savePlayers', id, players),
  loadRound: (id, roundNumber) => ipcRenderer.invoke('storage:loadRound', id, roundNumber),
  loadAllRounds: (id) => ipcRenderer.invoke('storage:loadAllRounds', id),
  saveRound: (id, roundNumber, data) => ipcRenderer.invoke('storage:saveRound', id, roundNumber, data),

  // Backup / Restore
  backupTournament: (id) => ipcRenderer.invoke('storage:backupTournament', id),
  restoreBackup: () => ipcRenderer.invoke('storage:restoreBackup'),
});
