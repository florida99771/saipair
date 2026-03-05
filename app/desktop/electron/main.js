import { app, BrowserWindow, Menu, ipcMain, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { writeFile, readFile, unlink } from 'fs/promises';
import * as storage from './storage.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

Menu.setApplicationMenu(null);

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 960,
    minWidth: 960,
    minHeight: 640,
    show: false,
    titleBarStyle: 'hidden',
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  win.once('ready-to-show', () => win.show());

  win.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12') {
      win.webContents.toggleDevTools();
      event.preventDefault();
    }
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

// ── Storage IPC ──
ipcMain.handle('storage:createTournament', (_e, name) => storage.createTournament(name));
ipcMain.handle('storage:deleteTournament', (_e, id) => storage.deleteTournament(id));
ipcMain.handle('storage:loadMeta', () => storage.loadMeta());
ipcMain.handle('storage:loadTournament', (_e, id) => storage.loadTournament(id));
ipcMain.handle('storage:saveTournament', (_e, id, json) => storage.saveTournament(id, json));
ipcMain.handle('storage:loadInfo', (_e, id) => storage.loadInfo(id));
ipcMain.handle('storage:saveInfo', (_e, id, info) => storage.saveInfo(id, info));
ipcMain.handle('storage:loadPlayers', (_e, id) => storage.loadPlayers(id));
ipcMain.handle('storage:savePlayers', (_e, id, players) => storage.savePlayers(id, players));
ipcMain.handle('storage:loadRound', (_e, id, round) => storage.loadRound(id, round));
ipcMain.handle('storage:loadAllRounds', (_e, id) => storage.loadAllRounds(id));
ipcMain.handle('storage:saveRound', (_e, id, round, data) => storage.saveRound(id, round, data));

// ── Print IPC ──
ipcMain.handle('print:content', async (event, html) => {
  // 写入临时 HTML 文件
  const tmpFile = path.join(app.getPath('temp'), `saipair-print-${Date.now()}.html`);
  await writeFile(tmpFile, html, 'utf-8');

  const printWin = new BrowserWindow({
    width: 900,
    height: 720,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  await printWin.loadFile(tmpFile);

  // 窗口关闭时清理临时文件
  printWin.on('closed', () => {
    unlink(tmpFile).catch(() => {});
  });
});

// ── Backup / Restore IPC ──
ipcMain.handle('storage:backupTournament', (_e, id) => storage.backupTournament(id));

ipcMain.handle('storage:restoreBackup', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    filters: [{ name: 'SaiPair Backup', extensions: ['saipair'] }],
    properties: ['openFile'],
  });
  if (canceled || !filePaths.length) return null;
  const content = await readFile(filePaths[0], 'utf-8');
  return storage.restoreBackup(content);
});

// ── File Export IPC ──
ipcMain.handle('file:saveDialog', async (event, buffer, defaultName, filters) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    defaultPath: defaultName,
    filters: filters || [{ name: 'All Files', extensions: ['*'] }],
  });
  if (canceled || !filePath) return { success: false };
  await writeFile(filePath, Buffer.from(buffer));
  return { success: true, filePath };
});

// ── Window Control IPC ──
ipcMain.handle('win:minimize', (event) => {
  BrowserWindow.fromWebContents(event.sender)?.minimize();
});
ipcMain.handle('win:maximize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.isMaximized() ? win.unmaximize() : win.maximize();
});
ipcMain.handle('win:close', (event) => {
  BrowserWindow.fromWebContents(event.sender)?.close();
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
