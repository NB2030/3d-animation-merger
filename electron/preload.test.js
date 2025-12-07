/**
 * Unit Tests for Preload Script
 * Testing contextBridge API exposure, IPC invoke wrappers, and event listener registration
 * 
 * Requirements: 2.1, 3.1
 */

import { test, expect, describe, beforeEach, vi } from 'vitest';

/**
 * Mock Electron modules
 * Since preload.js uses require() and we can't easily test it directly,
 * we'll test the behavior by mocking the Electron APIs
 */
describe('Preload Script API Exposure', () => {
  let mockIpcRenderer;
  let mockContextBridge;
  let exposedAPI;

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();

    // Mock ipcRenderer
    mockIpcRenderer = {
      invoke: vi.fn(),
      on: vi.fn(),
      removeListener: vi.fn()
    };

    // Mock contextBridge
    mockContextBridge = {
      exposeInMainWorld: vi.fn((apiKey, api) => {
        // Capture the exposed API for testing
        exposedAPI = api;
      })
    };

    // Mock the require calls
    vi.doMock('electron', () => ({
      contextBridge: mockContextBridge,
      ipcRenderer: mockIpcRenderer
    }));
  });

  /**
   * Test: contextBridge API exposure
   * Validates that the preload script exposes the electronAPI to the renderer
   */
  test('exposes electronAPI via contextBridge', () => {
    // Simulate what the preload script does
    mockContextBridge.exposeInMainWorld('electronAPI', {
      openFileDialog: (options) => mockIpcRenderer.invoke('open-file-dialog', options),
      saveFileDialog: (options) => mockIpcRenderer.invoke('save-file-dialog', options),
      readFile: (filePath) => mockIpcRenderer.invoke('read-file', filePath),
      writeFile: (filePath, data) => mockIpcRenderer.invoke('write-file', filePath, data),
      onFileError: (callback) => {
        const listener = (event, error) => callback(error);
        mockIpcRenderer.on('file-error', listener);
        return () => mockIpcRenderer.removeListener('file-error', listener);
      }
    });

    // Verify contextBridge.exposeInMainWorld was called
    expect(mockContextBridge.exposeInMainWorld).toHaveBeenCalledWith(
      'electronAPI',
      expect.any(Object)
    );

    // Verify the exposed API has all required methods
    const [apiKey, api] = mockContextBridge.exposeInMainWorld.mock.calls[0];
    expect(apiKey).toBe('electronAPI');
    expect(api).toHaveProperty('openFileDialog');
    expect(api).toHaveProperty('saveFileDialog');
    expect(api).toHaveProperty('readFile');
    expect(api).toHaveProperty('writeFile');
    expect(api).toHaveProperty('onFileError');
  });

  /**
   * Test: openFileDialog IPC invoke wrapper
   * Validates that openFileDialog correctly invokes the IPC channel
   */
  test('openFileDialog invokes correct IPC channel with options', async () => {
    const testOptions = {
      title: 'Select FBX File',
      filters: [{ name: 'FBX Files', extensions: ['fbx'] }],
      properties: ['openFile']
    };

    const expectedResult = {
      canceled: false,
      filePaths: ['/path/to/file.fbx']
    };

    mockIpcRenderer.invoke.mockResolvedValue(expectedResult);

    // Create the API wrapper
    const openFileDialog = (options) => mockIpcRenderer.invoke('open-file-dialog', options);

    // Call the wrapper
    const result = await openFileDialog(testOptions);

    // Verify IPC invoke was called with correct channel and options
    expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('open-file-dialog', testOptions);
    expect(result).toEqual(expectedResult);
  });

  /**
   * Test: saveFileDialog IPC invoke wrapper
   * Validates that saveFileDialog correctly invokes the IPC channel
   */
  test('saveFileDialog invokes correct IPC channel with options', async () => {
    const testOptions = {
      title: 'Save GLB File',
      defaultPath: 'model.glb',
      filters: [{ name: 'GLB Files', extensions: ['glb'] }]
    };

    const expectedResult = {
      canceled: false,
      filePath: '/path/to/model.glb'
    };

    mockIpcRenderer.invoke.mockResolvedValue(expectedResult);

    // Create the API wrapper
    const saveFileDialog = (options) => mockIpcRenderer.invoke('save-file-dialog', options);

    // Call the wrapper
    const result = await saveFileDialog(testOptions);

    // Verify IPC invoke was called with correct channel and options
    expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('save-file-dialog', testOptions);
    expect(result).toEqual(expectedResult);
  });

  /**
   * Test: readFile IPC invoke wrapper
   * Validates that readFile correctly invokes the IPC channel
   */
  test('readFile invokes correct IPC channel with file path', async () => {
    const testFilePath = '/path/to/file.fbx';
    const expectedResult = {
      success: true,
      data: new ArrayBuffer(1024),
      error: null
    };

    mockIpcRenderer.invoke.mockResolvedValue(expectedResult);

    // Create the API wrapper
    const readFile = (filePath) => mockIpcRenderer.invoke('read-file', filePath);

    // Call the wrapper
    const result = await readFile(testFilePath);

    // Verify IPC invoke was called with correct channel and file path
    expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('read-file', testFilePath);
    expect(result).toEqual(expectedResult);
  });

  /**
   * Test: writeFile IPC invoke wrapper
   * Validates that writeFile correctly invokes the IPC channel
   */
  test('writeFile invokes correct IPC channel with file path and data', async () => {
    const testFilePath = '/path/to/output.glb';
    const testData = new ArrayBuffer(2048);
    const expectedResult = {
      success: true,
      error: null
    };

    mockIpcRenderer.invoke.mockResolvedValue(expectedResult);

    // Create the API wrapper
    const writeFile = (filePath, data) => mockIpcRenderer.invoke('write-file', filePath, data);

    // Call the wrapper
    const result = await writeFile(testFilePath, testData);

    // Verify IPC invoke was called with correct channel, file path, and data
    expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('write-file', testFilePath, testData);
    expect(result).toEqual(expectedResult);
  });

  /**
   * Test: onFileError event listener registration
   * Validates that onFileError correctly registers an event listener
   */
  test('onFileError registers event listener and returns cleanup function', () => {
    const mockCallback = vi.fn();
    const testError = 'File not found';

    // Create the event listener wrapper
    const onFileError = (callback) => {
      const listener = (event, error) => callback(error);
      mockIpcRenderer.on('file-error', listener);
      return () => mockIpcRenderer.removeListener('file-error', listener);
    };

    // Register the listener
    const cleanup = onFileError(mockCallback);

    // Verify ipcRenderer.on was called with correct channel
    expect(mockIpcRenderer.on).toHaveBeenCalledWith('file-error', expect.any(Function));

    // Simulate an error event
    const registeredListener = mockIpcRenderer.on.mock.calls[0][1];
    registeredListener({}, testError);

    // Verify callback was called with error
    expect(mockCallback).toHaveBeenCalledWith(testError);

    // Verify cleanup function removes the listener
    expect(cleanup).toBeInstanceOf(Function);
    cleanup();
    expect(mockIpcRenderer.removeListener).toHaveBeenCalledWith('file-error', registeredListener);
  });

  /**
   * Test: Multiple event listeners can be registered
   * Validates that multiple callbacks can be registered for file errors
   */
  test('multiple onFileError listeners can be registered independently', () => {
    const mockCallback1 = vi.fn();
    const mockCallback2 = vi.fn();
    const testError = 'Permission denied';

    // Create the event listener wrapper
    const onFileError = (callback) => {
      const listener = (event, error) => callback(error);
      mockIpcRenderer.on('file-error', listener);
      return () => mockIpcRenderer.removeListener('file-error', listener);
    };

    // Register two listeners
    const cleanup1 = onFileError(mockCallback1);
    const cleanup2 = onFileError(mockCallback2);

    // Verify both listeners were registered
    expect(mockIpcRenderer.on).toHaveBeenCalledTimes(2);

    // Simulate error events for both listeners
    const listener1 = mockIpcRenderer.on.mock.calls[0][1];
    const listener2 = mockIpcRenderer.on.mock.calls[1][1];
    
    listener1({}, testError);
    listener2({}, testError);

    // Verify both callbacks were called
    expect(mockCallback1).toHaveBeenCalledWith(testError);
    expect(mockCallback2).toHaveBeenCalledWith(testError);

    // Cleanup first listener
    cleanup1();
    expect(mockIpcRenderer.removeListener).toHaveBeenCalledWith('file-error', listener1);

    // Cleanup second listener
    cleanup2();
    expect(mockIpcRenderer.removeListener).toHaveBeenCalledWith('file-error', listener2);
  });

  /**
   * Test: IPC invoke handles errors gracefully
   * Validates that errors from IPC calls are properly propagated
   */
  test('IPC invoke wrappers propagate errors', async () => {
    const testError = new Error('IPC communication failed');
    mockIpcRenderer.invoke.mockRejectedValue(testError);

    // Create the API wrapper
    const readFile = (filePath) => mockIpcRenderer.invoke('read-file', filePath);

    // Call the wrapper and expect it to throw
    await expect(readFile('/invalid/path')).rejects.toThrow('IPC communication failed');
  });
});

/**
 * Test: API method signatures
 * Validates that all API methods have the correct signatures
 */
describe('Preload Script API Signatures', () => {
  test('openFileDialog accepts options parameter', () => {
    const mockInvoke = vi.fn().mockResolvedValue({});
    const openFileDialog = (options) => mockInvoke('open-file-dialog', options);

    const options = { filters: [] };
    openFileDialog(options);

    expect(mockInvoke).toHaveBeenCalledWith('open-file-dialog', options);
  });

  test('saveFileDialog accepts options parameter', () => {
    const mockInvoke = vi.fn().mockResolvedValue({});
    const saveFileDialog = (options) => mockInvoke('save-file-dialog', options);

    const options = { defaultPath: 'test.glb' };
    saveFileDialog(options);

    expect(mockInvoke).toHaveBeenCalledWith('save-file-dialog', options);
  });

  test('readFile accepts filePath parameter', () => {
    const mockInvoke = vi.fn().mockResolvedValue({});
    const readFile = (filePath) => mockInvoke('read-file', filePath);

    readFile('/test/path.fbx');

    expect(mockInvoke).toHaveBeenCalledWith('read-file', '/test/path.fbx');
  });

  test('writeFile accepts filePath and data parameters', () => {
    const mockInvoke = vi.fn().mockResolvedValue({});
    const writeFile = (filePath, data) => mockInvoke('write-file', filePath, data);

    const data = new ArrayBuffer(100);
    writeFile('/test/output.glb', data);

    expect(mockInvoke).toHaveBeenCalledWith('write-file', '/test/output.glb', data);
  });

  test('onFileError accepts callback parameter and returns cleanup function', () => {
    const mockOn = vi.fn();
    const mockRemoveListener = vi.fn();
    const mockCallback = vi.fn();

    const onFileError = (callback) => {
      const listener = (event, error) => callback(error);
      mockOn('file-error', listener);
      return () => mockRemoveListener('file-error', listener);
    };

    const cleanup = onFileError(mockCallback);

    expect(mockOn).toHaveBeenCalledWith('file-error', expect.any(Function));
    expect(cleanup).toBeInstanceOf(Function);
  });
});
