import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { restoreWindowState, saveWindowState } from './window-state.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow = null;

/**
 * Handle open file dialog requests from renderer process
 * @param {Electron.IpcMainInvokeEvent} event - IPC event
 * @param {Object} options - Dialog options
 * @param {string} options.title - Dialog title
 * @param {string} options.defaultPath - Default directory path
 * @param {string} options.buttonLabel - Confirm button label
 * @param {Array} options.filters - File type filters [{name: string, extensions: string[]}]
 * @param {Array} options.properties - Dialog properties (e.g., ['openFile', 'multiSelections'])
 * @returns {Promise<Object>} Result object with canceled flag and filePaths array
 */
async function handleOpenFileDialog(event, options = {}) {
  try {
    // Prepare dialog options
    const dialogOptions = {
      title: options.title || 'Open File',
      defaultPath: options.defaultPath || '',
      buttonLabel: options.buttonLabel || 'Open',
      filters: options.filters || [],
      properties: options.properties || ['openFile']
    };

    // Show the open dialog
    const result = await dialog.showOpenDialog(mainWindow, dialogOptions);

    // Handle dialog cancellation gracefully
    if (result.canceled) {
      return { canceled: true, filePaths: [] };
    }

    // Return selected file paths
    return { canceled: false, filePaths: result.filePaths };
  } catch (error) {
    console.error('Error opening file dialog:', error);
    return { canceled: true, filePaths: [], error: error.message };
  }
}

/**
 * Handle save file dialog requests from renderer process
 * @param {Electron.IpcMainInvokeEvent} event - IPC event
 * @param {Object} options - Dialog options
 * @param {string} options.title - Dialog title
 * @param {string} options.defaultPath - Default file path or filename
 * @param {string} options.buttonLabel - Confirm button label
 * @param {Array} options.filters - File type filters [{name: string, extensions: string[]}]
 * @returns {Promise<Object>} Result object with canceled flag and filePath string
 */
async function handleSaveFileDialog(event, options = {}) {
  try {
    // Prepare dialog options
    const dialogOptions = {
      title: options.title || 'Save File',
      defaultPath: options.defaultPath || '',
      buttonLabel: options.buttonLabel || 'Save',
      filters: options.filters || []
    };

    // Show the save dialog
    const result = await dialog.showSaveDialog(mainWindow, dialogOptions);

    // Handle dialog cancellation gracefully
    if (result.canceled) {
      return { canceled: true, filePath: '' };
    }

    // Return selected save path
    return { canceled: false, filePath: result.filePath };
  } catch (error) {
    console.error('Error opening save dialog:', error);
    return { canceled: true, filePath: '', error: error.message };
  }
}

/**
 * Handle file read requests from renderer process
 * @param {Electron.IpcMainInvokeEvent} event - IPC event
 * @param {string} filePath - Path to the file to read
 * @returns {Promise<Object>} Result object with success flag, data buffer, and error message
 */
async function handleReadFile(event, filePath) {
  try {
    // Read file using fs.promises
    const data = await fs.readFile(filePath);
    
    // Return file buffer in response
    return { 
      success: true, 
      data: data,
      error: null 
    };
  } catch (error) {
    // Log error to console
    console.error('File read error:', error);
    
    // Determine user-friendly error message based on error code
    let userMessage;
    
    if (error.code === 'ENOENT') {
      userMessage = `File not found: ${filePath}`;
    } else if (error.code === 'EACCES' || error.code === 'EPERM') {
      userMessage = `Permission denied. Please check file permissions for: ${filePath}`;
    } else {
      userMessage = `Failed to read file: ${error.message}`;
    }
    
    // Return error response
    return { 
      success: false, 
      data: null,
      error: userMessage 
    };
  }
}

/**
 * Handle file write requests from renderer process
 * @param {Electron.IpcMainInvokeEvent} event - IPC event
 * @param {string} filePath - Path where the file should be written
 * @param {Buffer} data - Data buffer to write to file
 * @returns {Promise<Object>} Result object with success flag and error message
 */
async function handleWriteFile(event, filePath, data) {
  try {
    // Write buffer to disk using fs.promises
    await fs.writeFile(filePath, data);
    
    // Send success confirmation via IPC
    return { 
      success: true,
      error: null 
    };
  } catch (error) {
    // Log error to console
    console.error('File write error:', error);
    
    // Determine user-friendly error message based on error code
    let userMessage;
    
    if (error.code === 'EACCES' || error.code === 'EPERM') {
      userMessage = `Permission denied. Please check file permissions for: ${filePath}`;
    } else {
      userMessage = `Failed to write file: ${error.message}`;
    }
    
    // Return error response
    return { 
      success: false,
      error: userMessage 
    };
  }
}

/**
 * Create the main application window
 */
function createWindow() {
  // Restore window state from previous session
  const windowState = restoreWindowState();
  
  // Determine icon path based on platform
  const iconExtension = process.platform === 'darwin' ? 'icon.icns' : 
                        process.platform === 'win32' ? 'icon.ico' : 'icon.png';
  const iconPath = path.join(__dirname, '..', 'build-resources', iconExtension);

  mainWindow = new BrowserWindow({
    x: windowState.x,
    y: windowState.y,
    width: windowState.width,
    height: windowState.height,
    minWidth: 800,
    minHeight: 600,
    frame: true,
    autoHideMenuBar: true,
    icon: iconPath,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Restore maximized state if needed
  if (windowState.isMaximized) {
    mainWindow.maximize();
  }

  // Save window state on resize
  mainWindow.on('resize', () => {
    if (!mainWindow.isMaximized()) {
      const bounds = mainWindow.getBounds();
      saveWindowState(bounds, false);
    }
  });

  // Save window state on move
  mainWindow.on('move', () => {
    if (!mainWindow.isMaximized()) {
      const bounds = mainWindow.getBounds();
      saveWindowState(bounds, false);
    }
  });

  // Save maximized state
  mainWindow.on('maximize', () => {
    const bounds = mainWindow.getBounds();
    saveWindowState(bounds, true);
  });

  mainWindow.on('unmaximize', () => {
    const bounds = mainWindow.getBounds();
    saveWindowState(bounds, false);
  });

  // Load the index.html file
  mainWindow.loadFile(path.join(__dirname, '..', 'index.html'));

  // Open DevTools in development mode
  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }

  // Add keyboard shortcut to toggle DevTools (F12 or Ctrl+Shift+I)
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12' || 
        (input.control && input.shift && input.key.toLowerCase() === 'i')) {
      mainWindow.webContents.toggleDevTools();
      event.preventDefault();
    }
  });

  // Handle window closed event
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * Application lifecycle: whenReady
 * Create window when Electron has finished initialization
 */
app.whenReady().then(() => {
  // Register IPC handlers before creating window
  ipcMain.handle('open-file-dialog', handleOpenFileDialog);
  ipcMain.handle('save-file-dialog', handleSaveFileDialog);
  ipcMain.handle('read-file', handleReadFile);
  ipcMain.handle('write-file', handleWriteFile);

  createWindow();

  // On macOS, re-create window when dock icon is clicked and no windows are open
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

/**
 * Application lifecycle: window-all-closed
 * Quit when all windows are closed, except on macOS
 */
app.on('window-all-closed', () => {
  // On macOS, applications typically stay active until user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

/**
 * Application lifecycle: activate
 * On macOS, re-create window when dock icon is clicked
 */
app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
