/**
 * Unit Tests for Electron Adapter Module
 * Testing Electron environment detection, file input adapter setup,
 * file reading adaptation, file writing adaptation, and error handling
 * 
 * Requirements: 2.1, 3.3
 */

import { test, expect, describe, beforeEach, afterEach, vi } from 'vitest';
import {
  isElectron,
  setupFileInputAdapter,
  adaptFileReading,
  adaptFileWriting,
  initializeElectronAdapters
} from './electron-adapter.js';

/**
 * Test Suite: Electron Environment Detection
 * Validates that isElectron() correctly detects the Electron environment
 */
describe('Electron Environment Detection', () => {
  let originalWindow;

  beforeEach(() => {
    originalWindow = global.window;
  });

  afterEach(() => {
    global.window = originalWindow;
  });

  test('detects Electron when window.electronAPI is defined', () => {
    global.window = {
      electronAPI: {
        openFileDialog: vi.fn()
      }
    };

    expect(isElectron()).toBe(true);
  });

  test('returns false when window.electronAPI is undefined', () => {
    global.window = {};
    expect(isElectron()).toBe(false);
  });

  test('returns false when window is undefined', () => {
    global.window = undefined;
    expect(isElectron()).toBe(false);
  });

  test('returns false when window.electronAPI is not an object', () => {
    global.window = {
      electronAPI: 'not an object'
    };
    expect(isElectron()).toBe(false);
  });
});

/**
 * Test Suite: File Input Adapter Setup
 * Validates that setupFileInputAdapter correctly adapts file inputs for Electron
 */
describe('File Input Adapter Setup', () => {
  let originalWindow;

  beforeEach(() => {
    originalWindow = global.window;
  });

  afterEach(() => {
    global.window = originalWindow;
    vi.clearAllMocks();
  });

  test('does nothing when not in Electron environment', () => {
    global.window = {};

    const mockInputElement = {
      addEventListener: vi.fn()
    };

    setupFileInputAdapter(mockInputElement, {});
    expect(mockInputElement.addEventListener).not.toHaveBeenCalled();
  });

  test('does nothing when input element is null', () => {
    global.window = { electronAPI: {} };

    expect(() => {
      setupFileInputAdapter(null, {});
    }).not.toThrow();
  });

  test('does nothing when input element is undefined', () => {
    global.window = { electronAPI: {} };

    expect(() => {
      setupFileInputAdapter(undefined, {});
    }).not.toThrow();
  });

  test('adds click event listener in Electron environment', () => {
    global.window = {
      electronAPI: {
        openFileDialog: vi.fn(),
        readFile: vi.fn()
      }
    };

    const mockInputElement = {
      addEventListener: vi.fn()
    };

    setupFileInputAdapter(mockInputElement, {
      filters: [{ name: 'FBX Files', extensions: ['fbx'] }],
      properties: ['openFile']
    });

    expect(mockInputElement.addEventListener).toHaveBeenCalledWith(
      'click',
      expect.any(Function)
    );
  });

  test('handles errors during setup gracefully', () => {
    global.window = { electronAPI: {} };

    const mockInputElement = {
      addEventListener: vi.fn(() => {
        throw new Error('Setup failed');
      })
    };

    expect(() => {
      setupFileInputAdapter(mockInputElement, {});
    }).not.toThrow();
  });
});

/**
 * Test Suite: File Reading Adaptation
 * Validates that adaptFileReading correctly adapts file reading for Electron
 */
describe('File Reading Adaptation', () => {
  let originalWindow;

  beforeEach(() => {
    originalWindow = global.window;
  });

  afterEach(() => {
    global.window = originalWindow;
    vi.clearAllMocks();
  });

  test('reads file using Electron API when file has path property', async () => {
    const mockData = new ArrayBuffer(1024);
    
    global.window = {
      electronAPI: {
        readFile: vi.fn().mockResolvedValue({
          success: true,
          data: mockData
        })
      }
    };

    const mockFile = {
      name: 'test.fbx',
      path: '/path/to/test.fbx'
    };

    const result = await adaptFileReading(mockFile);

    expect(global.window.electronAPI.readFile).toHaveBeenCalledWith('/path/to/test.fbx');
    expect(result).toBe(mockData);
  });

  test('returns file data directly when file has data property', async () => {
    const mockData = new ArrayBuffer(2048);
    
    global.window = {
      electronAPI: {
        readFile: vi.fn()
      }
    };

    const mockFile = {
      name: 'test.fbx',
      data: mockData
    };

    const result = await adaptFileReading(mockFile);

    expect(global.window.electronAPI.readFile).not.toHaveBeenCalled();
    expect(result).toBe(mockData);
  });

  test('throws error when Electron read fails and no fallback', async () => {
    global.window = {
      electronAPI: {
        readFile: vi.fn().mockResolvedValue({
          success: false,
          error: 'File not found'
        })
      }
    };

    // Mock FileReader for fallback that also fails
    global.FileReader = vi.fn().mockImplementation(function() {
      this.readAsArrayBuffer = vi.fn(function(file) {
        // Immediately trigger error
        setTimeout(() => {
          if (this.onerror) {
            this.onerror(new Error('FileReader error'));
          }
        }, 0);
      });
      this.onload = null;
      this.onerror = null;
      this.result = null;
      return this;
    });

    const mockFile = {
      name: 'test.fbx',
      path: '/path/to/test.fbx'
    };

    // The implementation throws the error from Electron, then catches it
    // and falls back to FileReader which also fails
    await expect(adaptFileReading(mockFile)).rejects.toThrow();
  });
});

/**
 * Test Suite: File Writing Adaptation
 * Validates that adaptFileWriting correctly adapts file writing for Electron
 */
describe('File Writing Adaptation', () => {
  let originalWindow;
  let originalDocument;

  beforeEach(() => {
    originalWindow = global.window;
    originalDocument = global.document;
  });

  afterEach(() => {
    global.window = originalWindow;
    global.document = originalDocument;
    vi.clearAllMocks();
  });

  test('uses Electron save dialog when in Electron environment', async () => {
    const mockBlob = new Blob(['test data'], { type: 'application/octet-stream' });
    const filename = 'test.glb';

    global.window = {
      electronAPI: {
        saveFileDialog: vi.fn().mockResolvedValue({
          canceled: false,
          filePath: '/path/to/test.glb'
        }),
        writeFile: vi.fn().mockResolvedValue({
          success: true
        })
      }
    };

    const result = await adaptFileWriting(mockBlob, filename);

    expect(global.window.electronAPI.saveFileDialog).toHaveBeenCalledWith({
      title: 'Save File',
      defaultPath: filename,
      filters: [{ name: 'All Files', extensions: ['*'] }]
    });

    expect(global.window.electronAPI.writeFile).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  test('returns false when save dialog is canceled', async () => {
    const mockBlob = new Blob(['test data']);
    const filename = 'test.glb';

    global.window = {
      electronAPI: {
        saveFileDialog: vi.fn().mockResolvedValue({
          canceled: true,
          filePath: ''
        }),
        writeFile: vi.fn()
      }
    };

    const result = await adaptFileWriting(mockBlob, filename);

    expect(global.window.electronAPI.writeFile).not.toHaveBeenCalled();
    expect(result).toBe(false);
  });

  test('uses custom filters when provided', async () => {
    const mockBlob = new Blob(['test data']);
    const filename = 'test.glb';
    const customFilters = [{ name: 'GLB Files', extensions: ['glb'] }];

    global.window = {
      electronAPI: {
        saveFileDialog: vi.fn().mockResolvedValue({
          canceled: false,
          filePath: '/path/to/test.glb'
        }),
        writeFile: vi.fn().mockResolvedValue({
          success: true
        })
      }
    };

    await adaptFileWriting(mockBlob, filename, { filters: customFilters });

    expect(global.window.electronAPI.saveFileDialog).toHaveBeenCalledWith({
      title: 'Save File',
      defaultPath: filename,
      filters: customFilters
    });
  });

  test('returns false when file write fails', async () => {
    const mockBlob = new Blob(['test data']);
    const filename = 'test.glb';

    global.window = {
      electronAPI: {
        saveFileDialog: vi.fn().mockResolvedValue({
          canceled: false,
          filePath: '/path/to/test.glb'
        }),
        writeFile: vi.fn().mockResolvedValue({
          success: false,
          error: 'Permission denied'
        })
      }
    };

    const result = await adaptFileWriting(mockBlob, filename);

    expect(result).toBe(false);
  });

  test('falls back to browser download when not in Electron', async () => {
    global.window = {};

    const mockLink = {
      style: {},
      click: vi.fn(),
      remove: vi.fn(),
      href: '',
      download: ''
    };

    global.document = {
      createElement: vi.fn(() => mockLink),
      body: {
        appendChild: vi.fn()
      }
    };

    global.URL = {
      createObjectURL: vi.fn(() => 'blob:mock-url'),
      revokeObjectURL: vi.fn()
    };

    const mockBlob = new Blob(['test data']);
    const filename = 'test.glb';

    const result = await adaptFileWriting(mockBlob, filename);

    expect(global.document.createElement).toHaveBeenCalledWith('a');
    expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
    expect(mockLink.click).toHaveBeenCalled();
    expect(result).toBe(true);
  });
});

/**
 * Test Suite: Initialize Electron Adapters
 * Validates that initializeElectronAdapters correctly initializes all adapters
 */
describe('Initialize Electron Adapters', () => {
  let originalWindow;

  beforeEach(() => {
    originalWindow = global.window;
  });

  afterEach(() => {
    global.window = originalWindow;
    vi.clearAllMocks();
  });

  test('returns Electron adapters when in Electron environment', () => {
    global.window = {
      electronAPI: {
        onFileError: vi.fn()
      }
    };

    const adapters = initializeElectronAdapters();

    expect(adapters.isElectron).toBe(true);
    expect(adapters.setupFileInputAdapter).toBe(setupFileInputAdapter);
    expect(adapters.adaptFileReading).toBe(adaptFileReading);
    expect(adapters.adaptFileWriting).toBe(adaptFileWriting);
  });

  test('registers file error listener when in Electron environment', () => {
    const mockOnFileError = vi.fn();
    
    global.window = {
      electronAPI: {
        onFileError: mockOnFileError
      }
    };

    initializeElectronAdapters();

    expect(mockOnFileError).toHaveBeenCalledWith(expect.any(Function));
  });

  test('returns browser fallback adapters when not in Electron', () => {
    global.window = {};

    const adapters = initializeElectronAdapters();

    expect(adapters.isElectron).toBe(false);
    expect(adapters.setupFileInputAdapter).toBeInstanceOf(Function);
    expect(adapters.adaptFileReading).toBeInstanceOf(Function);
    expect(adapters.adaptFileWriting).toBeInstanceOf(Function);
  });

  test('browser fallback setupFileInputAdapter does nothing', () => {
    global.window = {};

    const adapters = initializeElectronAdapters();

    expect(() => {
      adapters.setupFileInputAdapter();
    }).not.toThrow();
  });
});

/**
 * Test Suite: Error Handling and Fallbacks
 * Validates that all functions handle errors gracefully and fall back appropriately
 */
describe('Error Handling and Fallbacks', () => {
  let originalWindow;
  let originalConsole;

  beforeEach(() => {
    originalWindow = global.window;
    originalConsole = global.console;
    
    global.console = {
      log: vi.fn(),
      error: vi.fn(),
      warn: vi.fn()
    };
  });

  afterEach(() => {
    global.window = originalWindow;
    global.console = originalConsole;
    vi.clearAllMocks();
  });

  test('setupFileInputAdapter logs errors but does not throw', () => {
    global.window = {
      electronAPI: {}
    };

    const mockInput = {
      addEventListener: vi.fn(() => {
        throw new Error('Event listener failed');
      })
    };

    expect(() => {
      setupFileInputAdapter(mockInput, {});
    }).not.toThrow();

    expect(global.console.error).toHaveBeenCalled();
  });

  test('adaptFileWriting falls back to browser download on error', async () => {
    global.window = {
      electronAPI: {
        saveFileDialog: vi.fn().mockRejectedValue(new Error('Dialog failed'))
      }
    };

    const mockLink = {
      style: {},
      click: vi.fn(),
      remove: vi.fn(),
      href: '',
      download: ''
    };

    global.document = {
      createElement: vi.fn(() => mockLink),
      body: {
        appendChild: vi.fn()
      }
    };

    global.URL = {
      createObjectURL: vi.fn(() => 'blob:mock-url'),
      revokeObjectURL: vi.fn()
    };

    const mockBlob = new Blob(['test']);
    const result = await adaptFileWriting(mockBlob, 'test.txt');

    expect(global.console.error).toHaveBeenCalled();
    expect(mockLink.click).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  test('handles complete fallback failure in adaptFileWriting', async () => {
    global.window = {
      electronAPI: {
        saveFileDialog: vi.fn().mockRejectedValue(new Error('Dialog failed'))
      }
    };

    global.document = {
      createElement: vi.fn(() => {
        throw new Error('DOM error');
      })
    };

    const mockBlob = new Blob(['test']);
    const result = await adaptFileWriting(mockBlob, 'test.txt');

    expect(global.console.error).toHaveBeenCalledTimes(2);
    expect(result).toBe(false);
  });
});
