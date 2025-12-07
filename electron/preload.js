/**
 * Preload Script for Secure IPC Communication
 * 
 * This script runs in a privileged context and uses contextBridge to expose
 * a limited, secure API to the renderer process. It prevents direct access
 * to Node.js APIs while enabling necessary file operations and dialogs.
 */

const { contextBridge, ipcRenderer } = require('electron');

/**
 * Expose electronAPI to the renderer process via contextBridge.
 * This API provides secure wrappers around IPC communication.
 */
contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * Open a native file dialog for selecting files
   * @param {Object} options - Dialog options (title, filters, properties, etc.)
   * @returns {Promise<Object>} Result with canceled flag and filePaths array
   */
  openFileDialog: (options) => {
    return ipcRenderer.invoke('open-file-dialog', options);
  },

  /**
   * Open a native save file dialog
   * @param {Object} options - Dialog options (title, defaultPath, filters, etc.)
   * @returns {Promise<Object>} Result with canceled flag and filePath string
   */
  saveFileDialog: (options) => {
    return ipcRenderer.invoke('save-file-dialog', options);
  },

  /**
   * Read a file from the file system
   * @param {string} filePath - Path to the file to read
   * @returns {Promise<Object>} Result with success flag, data (ArrayBuffer), and error message
   */
  readFile: (filePath) => {
    return ipcRenderer.invoke('read-file', filePath);
  },

  /**
   * Write data to a file on the file system
   * @param {string} filePath - Path where the file should be written
   * @param {Buffer|ArrayBuffer} data - Data to write to the file
   * @returns {Promise<Object>} Result with success flag and error message if failed
   */
  writeFile: (filePath, data) => {
    return ipcRenderer.invoke('write-file', filePath, data);
  },

  /**
   * Register a callback for file operation errors
   * @param {Function} callback - Function to call when file errors occur
   * @returns {Function} Cleanup function to remove the listener
   */
  onFileError: (callback) => {
    const listener = (event, error) => {
      callback(error);
    };
    
    ipcRenderer.on('file-error', listener);
    
    // Return cleanup function
    return () => {
      ipcRenderer.removeListener('file-error', listener);
    };
  }
});
