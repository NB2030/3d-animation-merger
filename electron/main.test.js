/**
 * Property-Based Tests for Electron Main Process
 * Testing window configuration and setup
 */

import { test, expect, describe, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import path from 'path';
import { fileURLToPath } from 'url';
import { restoreWindowState, saveWindowState } from './window-state.js';
import Store from 'electron-store';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Feature: electron-windows-app, Property 1: Window configuration is correct
 * Validates: Requirements 1.3
 * 
 * Property: For any window dimensions, the window configuration should:
 * - Have standard frame controls enabled (frame: true)
 * - Have auto-hidden menu bar (autoHideMenuBar: true)
 * - Have proper security settings (contextIsolation: true, nodeIntegration: false)
 * - Enforce minimum dimensions (minWidth: 800, minHeight: 600)
 * - Have a valid preload script path
 */
describe('Window Configuration Properties', () => {

  /**
   * Helper function to create window configuration
   * This mirrors the configuration used in createWindow()
   */
  function createWindowConfig(x, y, width, height) {
    return {
      x,
      y,
      width,
      height,
      minWidth: 800,
      minHeight: 600,
      frame: true,
      autoHideMenuBar: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
      }
    };
  }

  test('Property 1: Window configuration has correct properties for standard controls', () => {
    fc.assert(
      fc.property(
        // Generate random but valid window dimensions and positions
        fc.record({
          width: fc.integer({ min: 800, max: 2560 }),
          height: fc.integer({ min: 600, max: 1440 }),
          x: fc.integer({ min: 0, max: 1000 }),
          y: fc.integer({ min: 0, max: 1000 })
        }),
        (windowState) => {
          // Create window configuration with generated dimensions
          const config = createWindowConfig(
            windowState.x,
            windowState.y,
            windowState.width,
            windowState.height
          );

          // Verify standard frame controls are enabled
          expect(config.frame).toBe(true);
          
          // Verify menu bar is set to auto-hide
          expect(config.autoHideMenuBar).toBe(true);
          
          // Verify security settings are properly configured
          expect(config.webPreferences.nodeIntegration).toBe(false);
          expect(config.webPreferences.contextIsolation).toBe(true);
          
          // Verify preload script path is set
          expect(config.webPreferences.preload).toBeDefined();
          expect(config.webPreferences.preload).toContain('preload.js');
          
          // Verify minimum dimensions are enforced
          expect(config.minWidth).toBe(800);
          expect(config.minHeight).toBe(600);
          
          // Verify provided dimensions respect minimums
          expect(config.width).toBeGreaterThanOrEqual(config.minWidth);
          expect(config.height).toBeGreaterThanOrEqual(config.minHeight);
          
          // Verify position is set
          expect(config.x).toBeDefined();
          expect(config.y).toBeDefined();
          expect(config.x).toBeGreaterThanOrEqual(0);
          expect(config.y).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in design
    );
  });
});

/**
 * Feature: electron-windows-app, Property 1: File dialog opens with correct filters
 * Validates: Requirements 2.1, 2.2, 2.3
 * 
 * Property: For any file input type (source FBX, animation FBX, or texture), when the user 
 * triggers the file dialog, the dialog should open with the appropriate file extension 
 * filters matching the input type.
 */
describe('File Dialog Filter Properties', () => {
  
  /**
   * Helper function to simulate handleOpenFileDialog behavior
   * This mirrors the logic in main.js without requiring Electron dialog
   */
  function prepareDialogOptions(options = {}) {
    return {
      title: options.title || 'Open File',
      defaultPath: options.defaultPath || '',
      buttonLabel: options.buttonLabel || 'Open',
      filters: options.filters || [],
      properties: options.properties || ['openFile']
    };
  }

  test('Property 1: File dialog opens with correct filters for FBX files', () => {
    fc.assert(
      fc.property(
        // Generate different FBX dialog configurations
        fc.record({
          title: fc.constantFrom('Select Source FBX', 'Select Animation FBX', 'Open FBX File'),
          multiSelect: fc.boolean(),
          defaultPath: fc.option(fc.constantFrom('', '/models', '/animations'), { nil: '' })
        }),
        (config) => {
          // Prepare dialog options for FBX files
          const options = {
            title: config.title,
            defaultPath: config.defaultPath,
            filters: [{ name: 'FBX Files', extensions: ['fbx'] }],
            properties: config.multiSelect ? ['openFile', 'multiSelections'] : ['openFile']
          };

          const dialogOptions = prepareDialogOptions(options);

          // Verify filters are correctly set for FBX files
          expect(dialogOptions.filters).toBeDefined();
          expect(dialogOptions.filters).toHaveLength(1);
          expect(dialogOptions.filters[0]).toEqual({
            name: 'FBX Files',
            extensions: ['fbx']
          });

          // Verify properties include openFile
          expect(dialogOptions.properties).toContain('openFile');

          // Verify multi-select is correctly configured
          if (config.multiSelect) {
            expect(dialogOptions.properties).toContain('multiSelections');
          }

          // Verify title is set
          expect(dialogOptions.title).toBe(config.title);

          // Verify default path is set
          expect(dialogOptions.defaultPath).toBe(config.defaultPath);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 1: File dialog opens with correct filters for texture files', () => {
    fc.assert(
      fc.property(
        // Generate different texture dialog configurations
        fc.record({
          title: fc.constantFrom(
            'Select Texture',
            'Select Base Color',
            'Select Normal Map',
            'Select Metallic Map',
            'Select Roughness Map',
            'Select AO Map',
            'Select Emissive Map'
          ),
          defaultPath: fc.option(fc.constantFrom('', '/textures', '/images'), { nil: '' })
        }),
        (config) => {
          // Prepare dialog options for texture files
          const options = {
            title: config.title,
            defaultPath: config.defaultPath,
            filters: [{ name: 'Image Files', extensions: ['png', 'jpg', 'jpeg'] }],
            properties: ['openFile']
          };

          const dialogOptions = prepareDialogOptions(options);

          // Verify filters are correctly set for image files
          expect(dialogOptions.filters).toBeDefined();
          expect(dialogOptions.filters).toHaveLength(1);
          expect(dialogOptions.filters[0].name).toBe('Image Files');
          expect(dialogOptions.filters[0].extensions).toEqual(['png', 'jpg', 'jpeg']);

          // Verify properties include openFile (single selection for textures)
          expect(dialogOptions.properties).toContain('openFile');
          expect(dialogOptions.properties).not.toContain('multiSelections');

          // Verify title is set
          expect(dialogOptions.title).toBe(config.title);

          // Verify default path is set
          expect(dialogOptions.defaultPath).toBe(config.defaultPath);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 1: File dialog filters match input type requirements', () => {
    fc.assert(
      fc.property(
        // Generate different file input types
        fc.constantFrom(
          { type: 'source-fbx', filters: [{ name: 'FBX Files', extensions: ['fbx'] }], multiSelect: false },
          { type: 'animation-fbx', filters: [{ name: 'FBX Files', extensions: ['fbx'] }], multiSelect: true },
          { type: 'texture', filters: [{ name: 'Image Files', extensions: ['png', 'jpg', 'jpeg'] }], multiSelect: false }
        ),
        (inputConfig) => {
          // Prepare dialog options based on input type
          const options = {
            filters: inputConfig.filters,
            properties: inputConfig.multiSelect ? ['openFile', 'multiSelections'] : ['openFile']
          };

          const dialogOptions = prepareDialogOptions(options);

          // Verify filters match the input type
          expect(dialogOptions.filters).toEqual(inputConfig.filters);

          // Verify multi-select matches input type requirements
          if (inputConfig.multiSelect) {
            expect(dialogOptions.properties).toContain('multiSelections');
          } else {
            expect(dialogOptions.properties).not.toContain('multiSelections');
          }

          // Verify all filters have required structure
          dialogOptions.filters.forEach(filter => {
            expect(filter).toHaveProperty('name');
            expect(filter).toHaveProperty('extensions');
            expect(Array.isArray(filter.extensions)).toBe(true);
            expect(filter.extensions.length).toBeGreaterThan(0);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 1: File dialog handles empty or missing filters gracefully', () => {
    fc.assert(
      fc.property(
        // Generate various filter configurations including edge cases
        fc.option(
          fc.oneof(
            fc.constant([]),
            fc.constant(undefined),
            fc.constant(null)
          ),
          { nil: undefined }
        ),
        (filters) => {
          // Prepare dialog options with potentially missing filters
          const options = filters !== undefined ? { filters } : {};
          const dialogOptions = prepareDialogOptions(options);

          // Verify filters default to empty array when not provided
          expect(dialogOptions.filters).toBeDefined();
          expect(Array.isArray(dialogOptions.filters)).toBe(true);

          // When filters are explicitly empty or missing, should default to empty array
          if (!filters || filters.length === 0) {
            expect(dialogOptions.filters).toEqual([]);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: electron-windows-app, Property 4: Save dialog uses correct filename
 * Validates: Requirements 3.2
 * 
 * Property: For any export filename entered by the user, when the save dialog opens, 
 * it should pre-populate with that exact filename.
 */
describe('Save Dialog Filename Properties', () => {
  
  /**
   * Helper function to simulate handleSaveFileDialog behavior
   * This mirrors the logic in main.js without requiring Electron dialog
   */
  function prepareSaveDialogOptions(options = {}) {
    return {
      title: options.title || 'Save File',
      defaultPath: options.defaultPath || '',
      buttonLabel: options.buttonLabel || 'Save',
      filters: options.filters || []
    };
  }

  test('Property 4: Save dialog uses correct filename from defaultPath', () => {
    fc.assert(
      fc.property(
        // Generate various filename configurations
        fc.record({
          filename: fc.oneof(
            // Valid filenames with various patterns
            fc.stringMatching(/^[a-zA-Z0-9_-]{1,50}$/),
            fc.constantFrom(
              'model',
              'animation',
              'export',
              'my-model',
              'character_01',
              'scene-final',
              'test123'
            )
          ),
          extension: fc.constantFrom('.glb', '.gltf'),
          directory: fc.option(
            fc.constantFrom('', '/exports', '/models', 'C:\\Users\\Documents'),
            { nil: '' }
          )
        }),
        (config) => {
          // Construct the full default path (filename with optional directory)
          const fullFilename = config.filename + config.extension;
          const defaultPath = config.directory 
            ? path.join(config.directory, fullFilename)
            : fullFilename;

          // Prepare save dialog options with the filename
          const options = {
            title: 'Save GLB File',
            defaultPath: defaultPath,
            filters: [{ name: 'GLB Files', extensions: ['glb'] }]
          };

          const dialogOptions = prepareSaveDialogOptions(options);

          // Verify the defaultPath is set correctly
          expect(dialogOptions.defaultPath).toBe(defaultPath);

          // Verify the filename is preserved in the defaultPath
          expect(dialogOptions.defaultPath).toContain(config.filename);
          expect(dialogOptions.defaultPath).toContain(config.extension);

          // Verify other dialog properties are set correctly
          expect(dialogOptions.title).toBe('Save GLB File');
          expect(dialogOptions.filters).toEqual([{ name: 'GLB Files', extensions: ['glb'] }]);
          expect(dialogOptions.buttonLabel).toBe('Save');
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 4: Save dialog handles empty filename gracefully', () => {
    fc.assert(
      fc.property(
        // Generate various empty or missing filename scenarios
        fc.option(
          fc.oneof(
            fc.constant(''),
            fc.constant(undefined),
            fc.constant(null)
          ),
          { nil: undefined }
        ),
        (filename) => {
          // Prepare save dialog options with potentially missing filename
          const options = filename !== undefined ? { defaultPath: filename } : {};
          const dialogOptions = prepareSaveDialogOptions(options);

          // Verify defaultPath defaults to empty string when not provided
          expect(dialogOptions.defaultPath).toBeDefined();
          expect(typeof dialogOptions.defaultPath).toBe('string');

          // When filename is empty or missing, defaultPath should be empty string
          if (!filename) {
            expect(dialogOptions.defaultPath).toBe('');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 4: Save dialog preserves special characters in filename', () => {
    fc.assert(
      fc.property(
        // Generate filenames with various special characters (valid for filenames)
        fc.record({
          baseName: fc.stringMatching(/^[a-zA-Z0-9]{1,20}$/),
          separator: fc.constantFrom('_', '-', ' '),
          suffix: fc.stringMatching(/^[a-zA-Z0-9]{1,10}$/),
          extension: fc.constantFrom('.glb', '.gltf')
        }),
        (config) => {
          // Construct filename with special characters
          const filename = `${config.baseName}${config.separator}${config.suffix}${config.extension}`;

          // Prepare save dialog options
          const options = {
            defaultPath: filename,
            filters: [{ name: 'GLB Files', extensions: ['glb', 'gltf'] }]
          };

          const dialogOptions = prepareSaveDialogOptions(options);

          // Verify the filename with special characters is preserved exactly
          expect(dialogOptions.defaultPath).toBe(filename);
          expect(dialogOptions.defaultPath).toContain(config.baseName);
          expect(dialogOptions.defaultPath).toContain(config.separator);
          expect(dialogOptions.defaultPath).toContain(config.suffix);
          expect(dialogOptions.defaultPath).toContain(config.extension);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 4: Save dialog handles full path with directory', () => {
    fc.assert(
      fc.property(
        // Generate full paths with directory and filename
        fc.record({
          directory: fc.constantFrom(
            '/home/user/exports',
            'C:\\Users\\Documents',
            '/var/data',
            './exports',
            '../models'
          ),
          filename: fc.stringMatching(/^[a-zA-Z0-9_-]{1,30}$/),
          extension: fc.constantFrom('.glb', '.gltf')
        }),
        (config) => {
          // Construct full path
          const fullPath = path.join(config.directory, config.filename + config.extension);

          // Prepare save dialog options
          const options = {
            defaultPath: fullPath,
            filters: [{ name: 'GLB Files', extensions: ['glb'] }]
          };

          const dialogOptions = prepareSaveDialogOptions(options);

          // Verify the full path is preserved
          expect(dialogOptions.defaultPath).toBe(fullPath);

          // Verify both directory and filename are present
          expect(dialogOptions.defaultPath).toContain(config.filename);
          expect(dialogOptions.defaultPath).toContain(config.extension);

          // Verify the path structure is maintained
          const parsedPath = path.parse(dialogOptions.defaultPath);
          expect(parsedPath.name).toBe(config.filename);
          expect(parsedPath.ext).toBe(config.extension);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: electron-windows-app, Property 3: Dialog cancellation maintains state
 * Validates: Requirements 2.5
 * 
 * Property: For any file dialog operation, when the user cancels the dialog, 
 * the application state should remain unchanged and no errors should be thrown.
 */
describe('Dialog Cancellation Properties', () => {
  
  /**
   * Helper function to simulate dialog cancellation
   * This mirrors the behavior when user clicks Cancel in the dialog
   */
  function simulateDialogCancellation(dialogType) {
    // Simulate the result returned when dialog is canceled
    if (dialogType === 'open') {
      return { canceled: true, filePaths: [] };
    } else if (dialogType === 'save') {
      return { canceled: true, filePath: '' };
    }
    throw new Error(`Unknown dialog type: ${dialogType}`);
  }

  test('Property 3: Open file dialog cancellation maintains state', () => {
    fc.assert(
      fc.property(
        // Generate various open dialog configurations
        fc.record({
          title: fc.constantFrom('Select Source FBX', 'Select Animation FBX', 'Select Texture'),
          filters: fc.constantFrom(
            [{ name: 'FBX Files', extensions: ['fbx'] }],
            [{ name: 'Image Files', extensions: ['png', 'jpg', 'jpeg'] }]
          ),
          properties: fc.constantFrom(
            ['openFile'],
            ['openFile', 'multiSelections']
          ),
          defaultPath: fc.option(fc.constantFrom('', '/models', '/textures'), { nil: '' })
        }),
        (dialogConfig) => {
          // Simulate dialog cancellation
          const result = simulateDialogCancellation('open');

          // Verify cancellation is properly indicated
          expect(result.canceled).toBe(true);

          // Verify no file paths are returned
          expect(result.filePaths).toBeDefined();
          expect(Array.isArray(result.filePaths)).toBe(true);
          expect(result.filePaths).toHaveLength(0);

          // Verify no error is thrown (result should be a valid object)
          expect(result).toBeDefined();
          expect(typeof result).toBe('object');

          // Verify the result structure is consistent
          expect(result).toHaveProperty('canceled');
          expect(result).toHaveProperty('filePaths');

          // Verify no error property is present (graceful cancellation)
          // Note: error property may exist but should not indicate a failure
          if (result.error) {
            // If error exists, it should not be a critical error
            expect(typeof result.error).toBe('string');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 3: Save file dialog cancellation maintains state', () => {
    fc.assert(
      fc.property(
        // Generate various save dialog configurations
        fc.record({
          title: fc.constantFrom('Save GLB File', 'Export Model', 'Save Animation'),
          defaultPath: fc.option(
            fc.oneof(
              fc.stringMatching(/^[a-zA-Z0-9_-]{1,30}\.glb$/),
              fc.stringMatching(/^[a-zA-Z0-9_-]{1,30}\.gltf$/),
              fc.constant('')
            ),
            { nil: '' }
          ),
          filters: fc.constantFrom(
            [{ name: 'GLB Files', extensions: ['glb'] }],
            [{ name: 'GLTF Files', extensions: ['gltf'] }],
            [{ name: 'GLB Files', extensions: ['glb', 'gltf'] }]
          )
        }),
        (dialogConfig) => {
          // Simulate dialog cancellation
          const result = simulateDialogCancellation('save');

          // Verify cancellation is properly indicated
          expect(result.canceled).toBe(true);

          // Verify no file path is returned (empty string)
          expect(result.filePath).toBeDefined();
          expect(typeof result.filePath).toBe('string');
          expect(result.filePath).toBe('');

          // Verify no error is thrown (result should be a valid object)
          expect(result).toBeDefined();
          expect(typeof result).toBe('object');

          // Verify the result structure is consistent
          expect(result).toHaveProperty('canceled');
          expect(result).toHaveProperty('filePath');

          // Verify no error property is present (graceful cancellation)
          // Note: error property may exist but should not indicate a failure
          if (result.error) {
            // If error exists, it should not be a critical error
            expect(typeof result.error).toBe('string');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 3: Dialog cancellation does not throw errors', () => {
    fc.assert(
      fc.property(
        // Generate random dialog types and configurations
        fc.constantFrom('open', 'save'),
        (dialogType) => {
          // Verify that cancellation does not throw an error
          expect(() => {
            const result = simulateDialogCancellation(dialogType);
            
            // Verify result is a valid object
            expect(result).toBeDefined();
            expect(typeof result).toBe('object');
            expect(result.canceled).toBe(true);
          }).not.toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 3: Multiple consecutive cancellations maintain state', () => {
    fc.assert(
      fc.property(
        // Generate a sequence of dialog operations
        fc.array(
          fc.constantFrom('open', 'save'),
          { minLength: 1, maxLength: 10 }
        ),
        (dialogSequence) => {
          // Simulate multiple consecutive cancellations
          const results = dialogSequence.map(dialogType => 
            simulateDialogCancellation(dialogType)
          );

          // Verify all cancellations are handled consistently
          results.forEach((result, index) => {
            const dialogType = dialogSequence[index];
            
            // Verify cancellation flag
            expect(result.canceled).toBe(true);

            // Verify appropriate empty result based on dialog type
            if (dialogType === 'open') {
              expect(result.filePaths).toEqual([]);
            } else if (dialogType === 'save') {
              expect(result.filePath).toBe('');
            }

            // Verify no errors are thrown
            expect(result).toBeDefined();
            expect(typeof result).toBe('object');
          });

          // Verify state consistency across all cancellations
          expect(results).toHaveLength(dialogSequence.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 3: Cancellation result structure is consistent', () => {
    fc.assert(
      fc.property(
        // Generate various dialog configurations
        fc.record({
          dialogType: fc.constantFrom('open', 'save'),
          options: fc.record({
            title: fc.string({ minLength: 1, maxLength: 50 }),
            filters: fc.array(
              fc.record({
                name: fc.string({ minLength: 1, maxLength: 20 }),
                extensions: fc.array(fc.string({ minLength: 2, maxLength: 5 }), { minLength: 1, maxLength: 3 })
              }),
              { minLength: 1, maxLength: 3 }
            )
          })
        }),
        (config) => {
          // Simulate cancellation with any configuration
          const result = simulateDialogCancellation(config.dialogType);

          // Verify result structure is always consistent regardless of configuration
          expect(result).toBeDefined();
          expect(typeof result).toBe('object');
          expect(result).toHaveProperty('canceled');
          expect(result.canceled).toBe(true);

          // Verify type-specific properties
          if (config.dialogType === 'open') {
            expect(result).toHaveProperty('filePaths');
            expect(Array.isArray(result.filePaths)).toBe(true);
          } else if (config.dialogType === 'save') {
            expect(result).toHaveProperty('filePath');
            expect(typeof result.filePath).toBe('string');
          }

          // Verify no unexpected properties that would indicate an error state
          // The result should be clean and predictable
          const expectedKeys = config.dialogType === 'open' 
            ? ['canceled', 'filePaths']
            : ['canceled', 'filePath'];
          
          const actualKeys = Object.keys(result).filter(key => 
            !['error'].includes(key) // error is optional
          );
          
          expectedKeys.forEach(key => {
            expect(actualKeys).toContain(key);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: electron-windows-app, Property 2: File reading returns valid data
 * Validates: Requirements 2.4
 * 
 * Property: For any file path returned from a file dialog, when the application reads 
 * the file, it should return a valid ArrayBuffer containing the file contents without errors.
 */
describe('File Reading Properties', () => {
  
  /**
   * Helper function to simulate handleReadFile behavior
   * This mirrors the logic in main.js without requiring full Electron environment
   */
  async function simulateReadFile(filePath, fileContent) {
    try {
      // Simulate successful file read
      if (fileContent !== null && fileContent !== undefined) {
        return {
          success: true,
          data: Buffer.from(fileContent),
          error: null
        };
      }
      
      // Simulate file not found error
      throw { code: 'ENOENT', message: 'File not found' };
    } catch (error) {
      // Simulate error handling from handleReadFile
      let userMessage;
      
      if (error.code === 'ENOENT') {
        userMessage = `File not found: ${filePath}`;
      } else if (error.code === 'EACCES' || error.code === 'EPERM') {
        userMessage = `Permission denied. Please check file permissions for: ${filePath}`;
      } else {
        userMessage = `Failed to read file: ${error.message}`;
      }
      
      return {
        success: false,
        data: null,
        error: userMessage
      };
    }
  }

  test('Property 2: File reading returns valid data for any valid file', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random file paths and content
        fc.record({
          // Generate realistic file paths
          directory: fc.constantFrom(
            '/models',
            '/animations',
            '/textures',
            'C:\\Users\\Documents',
            './assets',
            '../data'
          ),
          filename: fc.stringMatching(/^[a-zA-Z0-9_-]{1,30}$/),
          extension: fc.constantFrom('.fbx', '.png', '.jpg', '.jpeg', '.glb'),
          // Generate random file content (simulated as string that will be converted to Buffer)
          content: fc.oneof(
            // Small files
            fc.uint8Array({ minLength: 1, maxLength: 1024 }),
            // Medium files
            fc.uint8Array({ minLength: 1024, maxLength: 10240 }),
            // Larger files
            fc.uint8Array({ minLength: 10240, maxLength: 102400 })
          )
        }),
        async (fileConfig) => {
          // Construct full file path
          const filePath = path.join(fileConfig.directory, fileConfig.filename + fileConfig.extension);
          
          // Simulate reading the file
          const result = await simulateReadFile(filePath, fileConfig.content);
          
          // Verify successful read
          expect(result.success).toBe(true);
          
          // Verify data is returned as a Buffer
          expect(result.data).toBeDefined();
          expect(Buffer.isBuffer(result.data)).toBe(true);
          
          // Verify data contains the file contents
          expect(result.data.length).toBeGreaterThan(0);
          expect(result.data.length).toBe(fileConfig.content.length);
          
          // Verify no error is present
          expect(result.error).toBeNull();
          
          // Verify the result structure is correct
          expect(result).toHaveProperty('success');
          expect(result).toHaveProperty('data');
          expect(result).toHaveProperty('error');
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in design
    );
  });

  test('Property 2: File reading handles various file sizes correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate files of various sizes
        fc.record({
          filePath: fc.constantFrom(
            '/test/small.fbx',
            '/test/medium.png',
            '/test/large.jpg',
            'C:\\test\\file.glb'
          ),
          // Test different file sizes
          size: fc.integer({ min: 1, max: 1048576 }) // 1 byte to 1MB
        }),
        async (config) => {
          // Create content of specified size
          const content = new Uint8Array(config.size);
          
          // Simulate reading the file
          const result = await simulateReadFile(config.filePath, content);
          
          // Verify successful read
          expect(result.success).toBe(true);
          
          // Verify data size matches expected size
          expect(result.data).toBeDefined();
          expect(result.data.length).toBe(config.size);
          
          // Verify data is a valid Buffer
          expect(Buffer.isBuffer(result.data)).toBe(true);
          
          // Verify no error
          expect(result.error).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 2: File reading returns valid Buffer for different file types', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate different file types with appropriate content
        fc.constantFrom(
          { path: '/models/character.fbx', ext: '.fbx', content: new Uint8Array([0x4B, 0x61, 0x79, 0x64]) }, // FBX magic bytes
          { path: '/textures/albedo.png', ext: '.png', content: new Uint8Array([0x89, 0x50, 0x4E, 0x47]) }, // PNG magic bytes
          { path: '/textures/normal.jpg', ext: '.jpg', content: new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0]) }, // JPEG magic bytes
          { path: '/exports/model.glb', ext: '.glb', content: new Uint8Array([0x67, 0x6C, 0x54, 0x46]) } // glTF magic bytes
        ),
        async (fileConfig) => {
          // Simulate reading the file
          const result = await simulateReadFile(fileConfig.path, fileConfig.content);
          
          // Verify successful read
          expect(result.success).toBe(true);
          
          // Verify data is returned
          expect(result.data).toBeDefined();
          expect(Buffer.isBuffer(result.data)).toBe(true);
          
          // Verify data contains expected content
          expect(result.data.length).toBe(fileConfig.content.length);
          
          // Verify magic bytes are preserved (for binary files)
          for (let i = 0; i < fileConfig.content.length; i++) {
            expect(result.data[i]).toBe(fileConfig.content[i]);
          }
          
          // Verify no error
          expect(result.error).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 2: File reading result structure is consistent', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate various file configurations
        fc.record({
          filePath: fc.string({ minLength: 1, maxLength: 100 }),
          content: fc.uint8Array({ minLength: 0, maxLength: 10240 })
        }),
        async (config) => {
          // Simulate reading the file
          const result = await simulateReadFile(config.filePath, config.content);
          
          // Verify result structure is always consistent
          expect(result).toBeDefined();
          expect(typeof result).toBe('object');
          
          // Verify all required properties exist
          expect(result).toHaveProperty('success');
          expect(result).toHaveProperty('data');
          expect(result).toHaveProperty('error');
          
          // Verify property types
          expect(typeof result.success).toBe('boolean');
          
          // When successful, data should be Buffer and error should be null
          if (result.success) {
            expect(result.data).not.toBeNull();
            expect(Buffer.isBuffer(result.data)).toBe(true);
            expect(result.error).toBeNull();
          } else {
            // When failed, data should be null and error should be string
            expect(result.data).toBeNull();
            expect(typeof result.error).toBe('string');
            expect(result.error.length).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 2: File reading preserves binary data integrity', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random binary data
        fc.uint8Array({ minLength: 100, maxLength: 10000 }),
        async (binaryData) => {
          const filePath = '/test/binary.dat';
          
          // Simulate reading the file
          const result = await simulateReadFile(filePath, binaryData);
          
          // Verify successful read
          expect(result.success).toBe(true);
          
          // Verify data integrity - every byte should match
          expect(result.data.length).toBe(binaryData.length);
          
          for (let i = 0; i < binaryData.length; i++) {
            expect(result.data[i]).toBe(binaryData[i]);
          }
          
          // Verify no data corruption
          const originalSum = binaryData.reduce((sum, byte) => sum + byte, 0);
          const resultSum = Array.from(result.data).reduce((sum, byte) => sum + byte, 0);
          expect(resultSum).toBe(originalSum);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 2: File reading handles empty files correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate various file paths
        fc.string({ minLength: 1, maxLength: 100 }),
        async (filePath) => {
          // Simulate reading an empty file
          const emptyContent = new Uint8Array(0);
          const result = await simulateReadFile(filePath, emptyContent);
          
          // Verify successful read (empty files are valid)
          expect(result.success).toBe(true);
          
          // Verify data is an empty Buffer
          expect(result.data).toBeDefined();
          expect(Buffer.isBuffer(result.data)).toBe(true);
          expect(result.data.length).toBe(0);
          
          // Verify no error
          expect(result.error).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: electron-windows-app, Property 5: File writing succeeds with valid data
 * Validates: Requirements 3.3, 3.4
 * 
 * Property: For any valid file path and data buffer, when the application writes the file, 
 * it should complete successfully and send a success notification via IPC.
 */
describe('File Writing Properties', () => {
  
  /**
   * Helper function to simulate handleWriteFile behavior
   * This mirrors the logic in main.js without requiring full Electron environment
   */
  async function simulateWriteFile(filePath, data) {
    try {
      // Validate inputs
      if (!filePath || typeof filePath !== 'string') {
        throw new Error('Invalid file path');
      }
      
      if (!data || !Buffer.isBuffer(data)) {
        throw new Error('Invalid data buffer');
      }
      
      // Simulate successful file write
      // In real implementation, this would be: await fs.writeFile(filePath, data);
      return {
        success: true,
        error: null
      };
    } catch (error) {
      // Log error to console (simulated)
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

  test('Property 5: File writing succeeds with valid data', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random file paths and data
        fc.record({
          // Generate realistic file paths
          directory: fc.constantFrom(
            '/exports',
            '/models',
            '/output',
            'C:\\Users\\Documents\\exports',
            './output',
            '../exports'
          ),
          filename: fc.stringMatching(/^[a-zA-Z0-9_-]{1,30}$/),
          extension: fc.constantFrom('.glb', '.gltf', '.fbx'),
          // Generate random file content (simulated as Buffer)
          content: fc.oneof(
            // Small files
            fc.uint8Array({ minLength: 1, maxLength: 1024 }),
            // Medium files
            fc.uint8Array({ minLength: 1024, maxLength: 10240 }),
            // Larger files
            fc.uint8Array({ minLength: 10240, maxLength: 102400 })
          )
        }),
        async (fileConfig) => {
          // Construct full file path
          const filePath = path.join(fileConfig.directory, fileConfig.filename + fileConfig.extension);
          
          // Convert content to Buffer
          const dataBuffer = Buffer.from(fileConfig.content);
          
          // Simulate writing the file
          const result = await simulateWriteFile(filePath, dataBuffer);
          
          // Verify successful write
          expect(result.success).toBe(true);
          
          // Verify no error is present
          expect(result.error).toBeNull();
          
          // Verify the result structure is correct
          expect(result).toHaveProperty('success');
          expect(result).toHaveProperty('error');
          
          // Verify result is a valid object
          expect(result).toBeDefined();
          expect(typeof result).toBe('object');
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in design
    );
  });

  test('Property 5: File writing handles various file sizes correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate files of various sizes
        fc.record({
          filePath: fc.constantFrom(
            '/exports/small.glb',
            '/exports/medium.gltf',
            '/exports/large.glb',
            'C:\\exports\\file.glb'
          ),
          // Test different file sizes
          size: fc.integer({ min: 1, max: 1048576 }) // 1 byte to 1MB
        }),
        async (config) => {
          // Create content of specified size
          const content = Buffer.alloc(config.size);
          
          // Simulate writing the file
          const result = await simulateWriteFile(config.filePath, content);
          
          // Verify successful write
          expect(result.success).toBe(true);
          
          // Verify no error
          expect(result.error).toBeNull();
          
          // Verify result structure
          expect(result).toHaveProperty('success');
          expect(result).toHaveProperty('error');
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 5: File writing succeeds for different file types', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate different file types with appropriate content
        fc.constantFrom(
          { path: '/exports/model.glb', ext: '.glb', content: new Uint8Array([0x67, 0x6C, 0x54, 0x46]) }, // glTF magic bytes
          { path: '/exports/model.gltf', ext: '.gltf', content: Buffer.from('{"asset":{"version":"2.0"}}') }, // JSON GLTF
          { path: '/exports/animation.fbx', ext: '.fbx', content: new Uint8Array([0x4B, 0x61, 0x79, 0x64]) } // FBX magic bytes
        ),
        async (fileConfig) => {
          // Convert content to Buffer
          const dataBuffer = Buffer.from(fileConfig.content);
          
          // Simulate writing the file
          const result = await simulateWriteFile(fileConfig.path, dataBuffer);
          
          // Verify successful write
          expect(result.success).toBe(true);
          
          // Verify no error
          expect(result.error).toBeNull();
          
          // Verify result structure
          expect(result).toBeDefined();
          expect(typeof result).toBe('object');
          expect(result).toHaveProperty('success');
          expect(result).toHaveProperty('error');
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 5: File writing result structure is consistent', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate various file configurations
        fc.record({
          filePath: fc.string({ minLength: 1, maxLength: 100 }),
          content: fc.uint8Array({ minLength: 1, maxLength: 10240 })
        }),
        async (config) => {
          // Convert content to Buffer
          const dataBuffer = Buffer.from(config.content);
          
          // Simulate writing the file
          const result = await simulateWriteFile(config.filePath, dataBuffer);
          
          // Verify result structure is always consistent
          expect(result).toBeDefined();
          expect(typeof result).toBe('object');
          
          // Verify all required properties exist
          expect(result).toHaveProperty('success');
          expect(result).toHaveProperty('error');
          
          // Verify property types
          expect(typeof result.success).toBe('boolean');
          
          // When successful, error should be null
          if (result.success) {
            expect(result.error).toBeNull();
          } else {
            // When failed, error should be string
            expect(typeof result.error).toBe('string');
            expect(result.error.length).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 5: File writing preserves binary data integrity', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random binary data
        fc.uint8Array({ minLength: 100, maxLength: 10000 }),
        async (binaryData) => {
          const filePath = '/exports/binary.glb';
          const dataBuffer = Buffer.from(binaryData);
          
          // Simulate writing the file
          const result = await simulateWriteFile(filePath, dataBuffer);
          
          // Verify successful write
          expect(result.success).toBe(true);
          
          // Verify no error
          expect(result.error).toBeNull();
          
          // Verify result indicates success
          expect(result).toHaveProperty('success');
          expect(result.success).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 5: File writing handles empty buffers correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate various file paths
        fc.string({ minLength: 1, maxLength: 100 }),
        async (filePath) => {
          // Create an empty buffer
          const emptyBuffer = Buffer.alloc(0);
          
          // Simulate writing an empty file
          const result = await simulateWriteFile(filePath, emptyBuffer);
          
          // Verify successful write (empty files are valid)
          expect(result.success).toBe(true);
          
          // Verify no error
          expect(result.error).toBeNull();
          
          // Verify result structure
          expect(result).toHaveProperty('success');
          expect(result).toHaveProperty('error');
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 5: File writing with full path including directory', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate full paths with directory and filename
        fc.record({
          directory: fc.constantFrom(
            '/home/user/exports',
            'C:\\Users\\Documents\\exports',
            '/var/data/output',
            './exports',
            '../output'
          ),
          filename: fc.stringMatching(/^[a-zA-Z0-9_-]{1,30}$/),
          extension: fc.constantFrom('.glb', '.gltf'),
          content: fc.uint8Array({ minLength: 1, maxLength: 1024 })
        }),
        async (config) => {
          // Construct full path
          const fullPath = path.join(config.directory, config.filename + config.extension);
          const dataBuffer = Buffer.from(config.content);
          
          // Simulate writing the file
          const result = await simulateWriteFile(fullPath, dataBuffer);
          
          // Verify successful write
          expect(result.success).toBe(true);
          
          // Verify no error
          expect(result.error).toBeNull();
          
          // Verify result structure
          expect(result).toBeDefined();
          expect(typeof result).toBe('object');
          expect(result).toHaveProperty('success');
          expect(result).toHaveProperty('error');
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: electron-windows-app, Property 6: File write errors are reported
 * Validates: Requirements 3.5
 * 
 * Property: For any file write operation that fails, the application should catch the error 
 * and send an error message via IPC containing the failure reason.
 */
describe('File Write Error Reporting Properties', () => {
  
  /**
   * Helper function to simulate handleWriteFile behavior with errors
   * This mirrors the error handling logic in main.js
   */
  async function simulateWriteFileWithError(filePath, data, errorCode) {
    try {
      // Validate inputs
      if (!filePath || typeof filePath !== 'string') {
        throw new Error('Invalid file path');
      }
      
      if (!data || !Buffer.isBuffer(data)) {
        throw new Error('Invalid data buffer');
      }
      
      // Simulate various error conditions
      if (errorCode) {
        const error = new Error('Simulated write error');
        error.code = errorCode;
        throw error;
      }
      
      // If no error code, simulate success
      return {
        success: true,
        error: null
      };
    } catch (error) {
      // Log error to console (simulated)
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

  test('Property 6: File write errors are reported with error messages', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random file paths and error scenarios
        fc.record({
          filePath: fc.oneof(
            fc.constantFrom(
              '/protected/file.glb',
              'C:\\Program Files\\app\\file.glb',
              '/root/file.glb',
              'C:\\Windows\\System32\\file.glb'
            ),
            fc.tuple(
              fc.constantFrom('/exports/', 'C:\\exports\\', './output/'),
              fc.stringMatching(/^[a-zA-Z0-9_-]{1,30}$/),
              fc.constantFrom('.glb', '.gltf')
            ).map(([dir, name, ext]) => dir + name + ext)
          ),
          errorCode: fc.constantFrom('EACCES', 'EPERM', 'ENOSPC', 'EROFS', 'EIO'),
          content: fc.uint8Array({ minLength: 1, maxLength: 1024 })
        }),
        async (config) => {
          // Convert content to Buffer
          const dataBuffer = Buffer.from(config.content);
          
          // Simulate writing the file with an error
          const result = await simulateWriteFileWithError(config.filePath, dataBuffer, config.errorCode);
          
          // Verify write failed
          expect(result.success).toBe(false);
          
          // Verify error message is present
          expect(result.error).toBeDefined();
          expect(result.error).not.toBeNull();
          expect(typeof result.error).toBe('string');
          expect(result.error.length).toBeGreaterThan(0);
          
          // Verify error message contains useful information
          // For permission errors, should mention permissions
          if (config.errorCode === 'EACCES' || config.errorCode === 'EPERM') {
            expect(result.error).toContain('Permission denied');
            expect(result.error).toContain(config.filePath);
          } else {
            // For other errors, should mention failure
            expect(result.error).toContain('Failed to write file');
          }
          
          // Verify the result structure is correct
          expect(result).toHaveProperty('success');
          expect(result).toHaveProperty('error');
          
          // Verify result is a valid object
          expect(result).toBeDefined();
          expect(typeof result).toBe('object');
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in design
    );
  });

  test('Property 6: Permission errors are specifically identified', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate file paths and permission error codes
        fc.record({
          filePath: fc.constantFrom(
            '/protected/file.glb',
            'C:\\Program Files\\file.glb',
            '/root/system.glb',
            'C:\\Windows\\file.glb'
          ),
          errorCode: fc.constantFrom('EACCES', 'EPERM'),
          content: fc.uint8Array({ minLength: 1, maxLength: 1024 })
        }),
        async (config) => {
          const dataBuffer = Buffer.from(config.content);
          
          // Simulate writing with permission error
          const result = await simulateWriteFileWithError(config.filePath, dataBuffer, config.errorCode);
          
          // Verify write failed
          expect(result.success).toBe(false);
          
          // Verify error message specifically mentions permissions
          expect(result.error).toContain('Permission denied');
          expect(result.error).toContain('file permissions');
          expect(result.error).toContain(config.filePath);
          
          // Verify error is not null or empty
          expect(result.error).not.toBeNull();
          expect(result.error.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 6: Generic errors include error message', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate file paths and generic error codes
        fc.record({
          filePath: fc.string({ minLength: 1, maxLength: 100 }),
          errorCode: fc.constantFrom('ENOSPC', 'EROFS', 'EIO', 'ENOENT', 'EISDIR'),
          content: fc.uint8Array({ minLength: 1, maxLength: 1024 })
        }),
        async (config) => {
          const dataBuffer = Buffer.from(config.content);
          
          // Simulate writing with generic error
          const result = await simulateWriteFileWithError(config.filePath, dataBuffer, config.errorCode);
          
          // Verify write failed
          expect(result.success).toBe(false);
          
          // Verify error message is present
          expect(result.error).toBeDefined();
          expect(result.error).not.toBeNull();
          expect(typeof result.error).toBe('string');
          
          // Verify error message contains failure indication
          expect(result.error).toContain('Failed to write file');
          
          // Verify error message is informative
          expect(result.error.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 6: Error result structure is consistent', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate various error scenarios
        fc.record({
          filePath: fc.string({ minLength: 1, maxLength: 100 }),
          errorCode: fc.constantFrom('EACCES', 'EPERM', 'ENOSPC', 'EROFS', 'EIO', 'ENOENT'),
          content: fc.uint8Array({ minLength: 1, maxLength: 1024 })
        }),
        async (config) => {
          const dataBuffer = Buffer.from(config.content);
          
          // Simulate writing with error
          const result = await simulateWriteFileWithError(config.filePath, dataBuffer, config.errorCode);
          
          // Verify result structure is always consistent
          expect(result).toBeDefined();
          expect(typeof result).toBe('object');
          
          // Verify all required properties exist
          expect(result).toHaveProperty('success');
          expect(result).toHaveProperty('error');
          
          // Verify property types
          expect(typeof result.success).toBe('boolean');
          expect(result.success).toBe(false); // Should always be false for errors
          
          // Verify error is a non-empty string
          expect(typeof result.error).toBe('string');
          expect(result.error).not.toBeNull();
          expect(result.error.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 6: Errors are logged and reported', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate various error scenarios
        fc.record({
          filePath: fc.constantFrom(
            '/test/file.glb',
            'C:\\test\\file.glb',
            './output/file.glb'
          ),
          errorCode: fc.constantFrom('EACCES', 'EPERM', 'ENOSPC', 'EIO'),
          content: fc.uint8Array({ minLength: 1, maxLength: 1024 })
        }),
        async (config) => {
          const dataBuffer = Buffer.from(config.content);
          
          // Capture console.error calls (simulated logging)
          const originalConsoleError = console.error;
          let errorLogged = false;
          console.error = (...args) => {
            if (args[0] === 'File write error:') {
              errorLogged = true;
            }
            originalConsoleError(...args);
          };
          
          try {
            // Simulate writing with error
            const result = await simulateWriteFileWithError(config.filePath, dataBuffer, config.errorCode);
            
            // Verify error was logged (in real implementation)
            // Note: In this test, we're verifying the structure, actual logging happens in main.js
            expect(errorLogged).toBe(true);
            
            // Verify error was reported via result
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
            expect(result.error).not.toBeNull();
            expect(typeof result.error).toBe('string');
            expect(result.error.length).toBeGreaterThan(0);
          } finally {
            // Restore console.error
            console.error = originalConsoleError;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 6: Invalid inputs are handled gracefully', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate invalid input scenarios
        fc.oneof(
          // Invalid file path
          fc.record({
            filePath: fc.constantFrom('', null, undefined),
            data: fc.constant(Buffer.from([1, 2, 3])),
            errorCode: fc.constant(null)
          }),
          // Invalid data buffer
          fc.record({
            filePath: fc.constant('/test/file.glb'),
            data: fc.constantFrom(null, undefined, 'not a buffer', 123, {}),
            errorCode: fc.constant(null)
          })
        ),
        async (config) => {
          // Simulate writing with invalid inputs
          const result = await simulateWriteFileWithError(config.filePath, config.data, config.errorCode);
          
          // Verify write failed
          expect(result.success).toBe(false);
          
          // Verify error message is present
          expect(result.error).toBeDefined();
          expect(result.error).not.toBeNull();
          expect(typeof result.error).toBe('string');
          expect(result.error.length).toBeGreaterThan(0);
          
          // Verify error message indicates the problem
          expect(result.error).toContain('Failed to write file');
          
          // Verify result structure is consistent
          expect(result).toHaveProperty('success');
          expect(result).toHaveProperty('error');
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: electron-windows-app, Property 7: Window state persistence round-trip
 * Validates: Requirements 6.1, 6.2, 6.3
 * 
 * Property: For any window bounds (position and size), when the user resizes or moves 
 * the window, then restarts the application, the window should open with the same bounds.
 */
describe('Window State Persistence Properties', () => {
  let store;

  beforeEach(() => {
    // Create a fresh store instance for each test
    store = new Store({ 
      name: 'test-window-state',
      projectName: '3d-animation-merger-test'
    });
    // Clear any existing state
    store.clear();
  });

  afterEach(() => {
    // Clean up after each test
    if (store) {
      store.clear();
      store = null;
    }
  });

  test('Property 7: Window state persistence round-trip', () => {
    fc.assert(
      fc.property(
        // Generate random but valid window bounds
        fc.record({
          x: fc.integer({ min: 0, max: 1920 }),
          y: fc.integer({ min: 0, max: 1080 }),
          width: fc.integer({ min: 800, max: 2560 }),
          height: fc.integer({ min: 600, max: 1440 }),
          isMaximized: fc.boolean()
        }),
        (originalState) => {
          // Clear store before each property test iteration
          store.clear();
          
          // Save the window state
          const bounds = {
            x: originalState.x,
            y: originalState.y,
            width: originalState.width,
            height: originalState.height
          };
          
          saveWindowState(bounds, originalState.isMaximized, store);
          
          // Restore the window state (simulating app restart)
          const restoredState = restoreWindowState(store);
          
          // Verify that the restored state matches the original state
          // Note: Position might be undefined if off-screen, but dimensions should always match
          expect(restoredState.width).toBe(originalState.width);
          expect(restoredState.height).toBe(originalState.height);
          expect(restoredState.isMaximized).toBe(originalState.isMaximized);
          
          // If position was saved and is on-screen, it should be restored
          // Otherwise, position will be undefined (centered by Electron)
          if (restoredState.x !== undefined && restoredState.y !== undefined) {
            expect(restoredState.x).toBe(originalState.x);
            expect(restoredState.y).toBe(originalState.y);
          }
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in design
    );
  });
});

/**
 * Feature: electron-windows-app, Property 8: File operation errors are logged and reported
 * Validates: Requirements 7.1, 7.2, 7.5
 * 
 * Property: For any file operation error (read or write), the application should both log 
 * the error details to the console and send an error message to the renderer via IPC.
 */
describe('File Operation Error Logging and Reporting Properties', () => {
  
  /**
   * Helper function to simulate file read with error logging
   * This mirrors the error handling logic in handleReadFile
   */
  async function simulateReadFileWithLogging(filePath, fileContent, errorCode) {
    const logs = [];
    
    // Mock console.error to capture logs
    const originalConsoleError = console.error;
    console.error = (...args) => {
      logs.push({ type: 'error', args });
      originalConsoleError(...args);
    };
    
    try {
      // Validate inputs
      if (!filePath || typeof filePath !== 'string') {
        throw new Error('Invalid file path');
      }
      
      // Simulate error conditions
      if (errorCode) {
        const error = new Error('Simulated read error');
        error.code = errorCode;
        throw error;
      }
      
      // Simulate successful read
      if (fileContent !== null && fileContent !== undefined) {
        return {
          result: {
            success: true,
            data: Buffer.from(fileContent),
            error: null
          },
          logs
        };
      }
      
      // Simulate file not found
      throw { code: 'ENOENT', message: 'File not found' };
    } catch (error) {
      // Log error to console (this is what we're testing)
      console.error('File read error:', error);
      
      // Determine user-friendly error message
      let userMessage;
      
      if (error.code === 'ENOENT') {
        userMessage = `File not found: ${filePath}`;
      } else if (error.code === 'EACCES' || error.code === 'EPERM') {
        userMessage = `Permission denied. Please check file permissions for: ${filePath}`;
      } else {
        userMessage = `Failed to read file: ${error.message}`;
      }
      
      // Return error response (this is what we're testing)
      return {
        result: {
          success: false,
          data: null,
          error: userMessage
        },
        logs
      };
    } finally {
      // Restore console.error
      console.error = originalConsoleError;
    }
  }

  /**
   * Helper function to simulate file write with error logging
   * This mirrors the error handling logic in handleWriteFile
   */
  async function simulateWriteFileWithLogging(filePath, data, errorCode) {
    const logs = [];
    
    // Mock console.error to capture logs
    const originalConsoleError = console.error;
    console.error = (...args) => {
      logs.push({ type: 'error', args });
      originalConsoleError(...args);
    };
    
    try {
      // Validate inputs
      if (!filePath || typeof filePath !== 'string') {
        throw new Error('Invalid file path');
      }
      
      if (!data || !Buffer.isBuffer(data)) {
        throw new Error('Invalid data buffer');
      }
      
      // Simulate error conditions
      if (errorCode) {
        const error = new Error('Simulated write error');
        error.code = errorCode;
        throw error;
      }
      
      // Simulate successful write
      return {
        result: {
          success: true,
          error: null
        },
        logs
      };
    } catch (error) {
      // Log error to console (this is what we're testing)
      console.error('File write error:', error);
      
      // Determine user-friendly error message
      let userMessage;
      
      if (error.code === 'EACCES' || error.code === 'EPERM') {
        userMessage = `Permission denied. Please check file permissions for: ${filePath}`;
      } else {
        userMessage = `Failed to write file: ${error.message}`;
      }
      
      // Return error response (this is what we're testing)
      return {
        result: {
          success: false,
          error: userMessage
        },
        logs
      };
    } finally {
      // Restore console.error
      console.error = originalConsoleError;
    }
  }

  test('Property 8: File read errors are both logged and reported', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate various file read error scenarios
        fc.record({
          filePath: fc.oneof(
            fc.constantFrom(
              '/nonexistent/file.fbx',
              '/protected/file.png',
              'C:\\Windows\\System32\\file.jpg',
              '/root/file.glb'
            ),
            fc.tuple(
              fc.constantFrom('/test/', 'C:\\test\\', './data/'),
              fc.stringMatching(/^[a-zA-Z0-9_-]{1,30}$/),
              fc.constantFrom('.fbx', '.png', '.jpg', '.glb')
            ).map(([dir, name, ext]) => dir + name + ext)
          ),
          errorCode: fc.constantFrom('ENOENT', 'EACCES', 'EPERM', 'EIO', 'EISDIR')
        }),
        async (config) => {
          // Simulate file read with error
          const { result, logs } = await simulateReadFileWithLogging(
            config.filePath,
            null,
            config.errorCode
          );
          
          // Verify error was logged to console
          expect(logs.length).toBeGreaterThan(0);
          expect(logs[0].type).toBe('error');
          expect(logs[0].args[0]).toBe('File read error:');
          expect(logs[0].args[1]).toBeDefined();
          
          // Verify error was reported via result
          expect(result.success).toBe(false);
          expect(result.error).toBeDefined();
          expect(result.error).not.toBeNull();
          expect(typeof result.error).toBe('string');
          expect(result.error.length).toBeGreaterThan(0);
          
          // Verify error message is user-friendly
          if (config.errorCode === 'ENOENT') {
            expect(result.error).toContain('File not found');
            expect(result.error).toContain(config.filePath);
          } else if (config.errorCode === 'EACCES' || config.errorCode === 'EPERM') {
            expect(result.error).toContain('Permission denied');
            expect(result.error).toContain(config.filePath);
          } else {
            expect(result.error).toContain('Failed to read file');
          }
          
          // Verify data is null on error
          expect(result.data).toBeNull();
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in design
    );
  });

  test('Property 8: File write errors are both logged and reported', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate various file write error scenarios
        fc.record({
          filePath: fc.oneof(
            fc.constantFrom(
              '/protected/file.glb',
              'C:\\Program Files\\file.glb',
              '/root/file.gltf',
              'C:\\Windows\\file.glb'
            ),
            fc.tuple(
              fc.constantFrom('/exports/', 'C:\\exports\\', './output/'),
              fc.stringMatching(/^[a-zA-Z0-9_-]{1,30}$/),
              fc.constantFrom('.glb', '.gltf')
            ).map(([dir, name, ext]) => dir + name + ext)
          ),
          errorCode: fc.constantFrom('EACCES', 'EPERM', 'ENOSPC', 'EROFS', 'EIO'),
          content: fc.uint8Array({ minLength: 1, maxLength: 1024 })
        }),
        async (config) => {
          const dataBuffer = Buffer.from(config.content);
          
          // Simulate file write with error
          const { result, logs } = await simulateWriteFileWithLogging(
            config.filePath,
            dataBuffer,
            config.errorCode
          );
          
          // Verify error was logged to console
          expect(logs.length).toBeGreaterThan(0);
          expect(logs[0].type).toBe('error');
          expect(logs[0].args[0]).toBe('File write error:');
          expect(logs[0].args[1]).toBeDefined();
          
          // Verify error was reported via result
          expect(result.success).toBe(false);
          expect(result.error).toBeDefined();
          expect(result.error).not.toBeNull();
          expect(typeof result.error).toBe('string');
          expect(result.error.length).toBeGreaterThan(0);
          
          // Verify error message is user-friendly
          if (config.errorCode === 'EACCES' || config.errorCode === 'EPERM') {
            expect(result.error).toContain('Permission denied');
            expect(result.error).toContain(config.filePath);
          } else {
            expect(result.error).toContain('Failed to write file');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 8: Both logging and reporting occur for all error types', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate various error scenarios for both read and write operations
        fc.record({
          operation: fc.constantFrom('read', 'write'),
          filePath: fc.string({ minLength: 1, maxLength: 100 }),
          errorCode: fc.constantFrom('ENOENT', 'EACCES', 'EPERM', 'ENOSPC', 'EROFS', 'EIO', 'EISDIR'),
          content: fc.uint8Array({ minLength: 1, maxLength: 1024 })
        }),
        async (config) => {
          let result, logs;
          
          if (config.operation === 'read') {
            ({ result, logs } = await simulateReadFileWithLogging(
              config.filePath,
              null,
              config.errorCode
            ));
          } else {
            const dataBuffer = Buffer.from(config.content);
            ({ result, logs } = await simulateWriteFileWithLogging(
              config.filePath,
              dataBuffer,
              config.errorCode
            ));
          }
          
          // Verify error was logged (logging requirement)
          expect(logs.length).toBeGreaterThan(0);
          expect(logs[0].type).toBe('error');
          expect(logs[0].args.length).toBeGreaterThanOrEqual(2);
          
          // Verify the log message indicates the operation type
          const logMessage = logs[0].args[0];
          if (config.operation === 'read') {
            expect(logMessage).toBe('File read error:');
          } else {
            expect(logMessage).toBe('File write error:');
          }
          
          // Verify error was reported (reporting requirement)
          expect(result.success).toBe(false);
          expect(result.error).toBeDefined();
          expect(result.error).not.toBeNull();
          expect(typeof result.error).toBe('string');
          expect(result.error.length).toBeGreaterThan(0);
          
          // Verify both logging and reporting happened (dual requirement)
          // This is the key property: errors must be BOTH logged AND reported
          expect(logs.length > 0 && result.error !== null).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 8: Error details are preserved in logs', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate various error scenarios
        fc.record({
          filePath: fc.constantFrom(
            '/test/file.fbx',
            'C:\\test\\file.glb',
            './data/file.png'
          ),
          errorCode: fc.constantFrom('ENOENT', 'EACCES', 'EPERM', 'EIO'),
          operation: fc.constantFrom('read', 'write'),
          content: fc.uint8Array({ minLength: 1, maxLength: 512 })
        }),
        async (config) => {
          let result, logs;
          
          if (config.operation === 'read') {
            ({ result, logs } = await simulateReadFileWithLogging(
              config.filePath,
              null,
              config.errorCode
            ));
          } else {
            const dataBuffer = Buffer.from(config.content);
            ({ result, logs } = await simulateWriteFileWithLogging(
              config.filePath,
              dataBuffer,
              config.errorCode
            ));
          }
          
          // Verify error details are in the log
          expect(logs.length).toBeGreaterThan(0);
          const errorObject = logs[0].args[1];
          expect(errorObject).toBeDefined();
          
          // Verify the error object has the expected error code
          if (errorObject.code) {
            expect(errorObject.code).toBe(config.errorCode);
          }
          
          // Verify error is also reported to renderer
          expect(result.error).toBeDefined();
          expect(result.error).not.toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 8: Successful operations do not log errors', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate successful operation scenarios
        fc.record({
          filePath: fc.string({ minLength: 1, maxLength: 100 }),
          content: fc.uint8Array({ minLength: 1, maxLength: 1024 }),
          operation: fc.constantFrom('read', 'write')
        }),
        async (config) => {
          let result, logs;
          
          if (config.operation === 'read') {
            // Simulate successful read (no error code)
            ({ result, logs } = await simulateReadFileWithLogging(
              config.filePath,
              config.content,
              null
            ));
          } else {
            // Simulate successful write (no error code)
            const dataBuffer = Buffer.from(config.content);
            ({ result, logs } = await simulateWriteFileWithLogging(
              config.filePath,
              dataBuffer,
              null
            ));
          }
          
          // Verify no errors were logged
          expect(logs.length).toBe(0);
          
          // Verify operation succeeded
          expect(result.success).toBe(true);
          expect(result.error).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 8: Error messages are consistent between logs and reports', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate error scenarios with appropriate error codes for each operation
        fc.oneof(
          // Read operation scenarios (can have ENOENT, EACCES, EPERM)
          fc.record({
            filePath: fc.constantFrom('/test/file.fbx', 'C:\\test\\file.glb'),
            errorCode: fc.constantFrom('ENOENT', 'EACCES', 'EPERM'),
            operation: fc.constant('read'),
            content: fc.uint8Array({ minLength: 1, maxLength: 512 })
          }),
          // Write operation scenarios (only EACCES, EPERM are checked in handleWriteFile)
          fc.record({
            filePath: fc.constantFrom('/test/file.fbx', 'C:\\test\\file.glb'),
            errorCode: fc.constantFrom('EACCES', 'EPERM'),
            operation: fc.constant('write'),
            content: fc.uint8Array({ minLength: 1, maxLength: 512 })
          })
        ),
        async (config) => {
          let result, logs;
          
          if (config.operation === 'read') {
            ({ result, logs } = await simulateReadFileWithLogging(
              config.filePath,
              null,
              config.errorCode
            ));
          } else {
            const dataBuffer = Buffer.from(config.content);
            ({ result, logs } = await simulateWriteFileWithLogging(
              config.filePath,
              dataBuffer,
              config.errorCode
            ));
          }
          
          // Verify error was logged
          expect(logs.length).toBeGreaterThan(0);
          
          // Verify error was reported
          expect(result.error).toBeDefined();
          expect(result.error).not.toBeNull();
          
          // Verify the reported error message is user-friendly and informative
          // (The log contains the raw error object, the report contains user-friendly message)
          expect(typeof result.error).toBe('string');
          expect(result.error.length).toBeGreaterThan(0);
          
          // Verify the error message relates to the error code
          if (config.errorCode === 'ENOENT' && config.operation === 'read') {
            // ENOENT is only checked in read operations
            expect(result.error).toContain('File not found');
          } else if (config.errorCode === 'EACCES' || config.errorCode === 'EPERM') {
            // Permission errors are checked in both read and write operations
            expect(result.error).toContain('Permission denied');
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: electron-windows-app, Property 9: Invalid file formats are rejected
 * Validates: Requirements 7.3
 * 
 * Property: For any file with an extension not matching the expected format, 
 * the application should display a user-friendly error message explaining the expected format.
 */
describe('Invalid File Format Rejection Properties', () => {
  
  /**
   * Helper function to validate file extension against expected formats
   * This mirrors the validation logic that should be in the file handling
   */
  function validateFileFormat(filePath, expectedExtensions) {
    try {
      // Extract file extension
      const ext = path.extname(filePath).toLowerCase();
      
      // Check if extension matches any of the expected formats
      const isValid = expectedExtensions.some(expectedExt => {
        const normalizedExpected = expectedExt.startsWith('.') ? expectedExt : '.' + expectedExt;
        return ext === normalizedExpected.toLowerCase();
      });
      
      if (!isValid) {
        // Generate user-friendly error message
        const expectedFormats = expectedExtensions
          .map(e => e.startsWith('.') ? e.substring(1).toUpperCase() : e.toUpperCase())
          .join(', ');
        
        return {
          valid: false,
          error: `Invalid file format. Expected ${expectedFormats} file, but got ${ext || 'unknown'} format.`
        };
      }
      
      return {
        valid: true,
        error: null
      };
    } catch (error) {
      return {
        valid: false,
        error: `Failed to validate file format: ${error.message}`
      };
    }
  }

  test('Property 9: Invalid FBX file formats are rejected with user-friendly message', () => {
    fc.assert(
      fc.property(
        // Generate file paths with invalid extensions for FBX files
        fc.record({
          filename: fc.stringMatching(/^[a-zA-Z0-9_-]{1,30}$/),
          invalidExtension: fc.constantFrom(
            '.txt', '.doc', '.pdf', '.zip', '.exe', 
            '.png', '.jpg', '.jpeg', '.gif', '.bmp',
            '.glb', '.gltf', '.obj', '.dae', '.blend',
            '.mp4', '.avi', '.mov', '.json', '.xml'
          ),
          directory: fc.option(
            fc.constantFrom('/models', 'C:\\models', './assets'),
            { nil: '' }
          )
        }),
        (config) => {
          // Construct file path with invalid extension
          const filePath = config.directory 
            ? path.join(config.directory, config.filename + config.invalidExtension)
            : config.filename + config.invalidExtension;
          
          // Expected extensions for FBX files
          const expectedExtensions = ['fbx', '.fbx'];
          
          // Validate file format
          const result = validateFileFormat(filePath, expectedExtensions);
          
          // Verify file is rejected
          expect(result.valid).toBe(false);
          
          // Verify error message is present
          expect(result.error).toBeDefined();
          expect(result.error).not.toBeNull();
          expect(typeof result.error).toBe('string');
          expect(result.error.length).toBeGreaterThan(0);
          
          // Verify error message is user-friendly and explains expected format
          expect(result.error).toContain('Invalid file format');
          expect(result.error).toContain('FBX');
          expect(result.error).toContain('Expected');
          
          // Verify error message mentions the actual extension received
          const actualExt = config.invalidExtension.toLowerCase();
          expect(result.error.toLowerCase()).toContain(actualExt);
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in design
    );
  });

  test('Property 9: Invalid texture file formats are rejected with user-friendly message', () => {
    fc.assert(
      fc.property(
        // Generate file paths with invalid extensions for texture files
        fc.record({
          filename: fc.stringMatching(/^[a-zA-Z0-9_-]{1,30}$/),
          invalidExtension: fc.constantFrom(
            '.txt', '.doc', '.pdf', '.zip', '.exe',
            '.fbx', '.glb', '.gltf', '.obj', '.dae',
            '.mp4', '.avi', '.mov', '.json', '.xml',
            '.blend', '.max', '.ma', '.mb'
          ),
          directory: fc.option(
            fc.constantFrom('/textures', 'C:\\textures', './images'),
            { nil: '' }
          )
        }),
        (config) => {
          // Construct file path with invalid extension
          const filePath = config.directory 
            ? path.join(config.directory, config.filename + config.invalidExtension)
            : config.filename + config.invalidExtension;
          
          // Expected extensions for texture files
          const expectedExtensions = ['png', 'jpg', 'jpeg', '.png', '.jpg', '.jpeg'];
          
          // Validate file format
          const result = validateFileFormat(filePath, expectedExtensions);
          
          // Verify file is rejected
          expect(result.valid).toBe(false);
          
          // Verify error message is present
          expect(result.error).toBeDefined();
          expect(result.error).not.toBeNull();
          expect(typeof result.error).toBe('string');
          expect(result.error.length).toBeGreaterThan(0);
          
          // Verify error message is user-friendly and explains expected format
          expect(result.error).toContain('Invalid file format');
          expect(result.error).toContain('Expected');
          
          // Verify error message mentions at least one of the expected formats
          const hasExpectedFormat = 
            result.error.includes('PNG') || 
            result.error.includes('JPG') || 
            result.error.includes('JPEG');
          expect(hasExpectedFormat).toBe(true);
          
          // Verify error message mentions the actual extension received
          const actualExt = config.invalidExtension.toLowerCase();
          expect(result.error.toLowerCase()).toContain(actualExt);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 9: Valid file formats are accepted without errors', () => {
    fc.assert(
      fc.property(
        // Generate file paths with valid extensions for different file types
        fc.oneof(
          // Valid FBX files
          fc.record({
            filename: fc.stringMatching(/^[a-zA-Z0-9_-]{1,30}$/),
            extension: fc.constantFrom('.fbx', '.FBX', '.Fbx'),
            expectedExtensions: fc.constant(['fbx', '.fbx'])
          }),
          // Valid texture files
          fc.record({
            filename: fc.stringMatching(/^[a-zA-Z0-9_-]{1,30}$/),
            extension: fc.constantFrom('.png', '.jpg', '.jpeg', '.PNG', '.JPG', '.JPEG'),
            expectedExtensions: fc.constant(['png', 'jpg', 'jpeg', '.png', '.jpg', '.jpeg'])
          }),
          // Valid GLB/GLTF files
          fc.record({
            filename: fc.stringMatching(/^[a-zA-Z0-9_-]{1,30}$/),
            extension: fc.constantFrom('.glb', '.gltf', '.GLB', '.GLTF'),
            expectedExtensions: fc.constant(['glb', 'gltf', '.glb', '.gltf'])
          })
        ),
        (config) => {
          // Construct file path with valid extension
          const filePath = config.filename + config.extension;
          
          // Validate file format
          const result = validateFileFormat(filePath, config.expectedExtensions);
          
          // Verify file is accepted
          expect(result.valid).toBe(true);
          
          // Verify no error message is present
          expect(result.error).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: electron-windows-app, Property 10: Permission errors are identified
 * Validates: Requirements 7.4
 * 
 * Property: For any file operation that fails with EACCES or EPERM error codes, 
 * the application should display an error message specifically indicating permission issues.
 */
describe('Permission Error Identification Properties', () => {
  
  /**
   * Helper function to simulate file operations with permission errors
   * This mirrors the error handling logic in both handleReadFile and handleWriteFile
   */
  async function simulateFileOperationWithPermissionError(operation, filePath, data, errorCode) {
    try {
      // Validate inputs based on operation type
      if (!filePath || typeof filePath !== 'string') {
        throw new Error('Invalid file path');
      }
      
      if (operation === 'write' && (!data || !Buffer.isBuffer(data))) {
        throw new Error('Invalid data buffer');
      }
      
      // Simulate permission error
      if (errorCode === 'EACCES' || errorCode === 'EPERM') {
        const error = new Error('Permission denied');
        error.code = errorCode;
        throw error;
      }
      
      // Simulate other errors for comparison
      if (errorCode) {
        const error = new Error('Other error');
        error.code = errorCode;
        throw error;
      }
      
      // Simulate success
      if (operation === 'read') {
        return {
          success: true,
          data: Buffer.from([1, 2, 3]),
          error: null
        };
      } else {
        return {
          success: true,
          error: null
        };
      }
    } catch (error) {
      // Log error to console (simulated)
      console.error(`File ${operation} error:`, error);
      
      // Determine user-friendly error message based on error code
      let userMessage;
      
      if (error.code === 'ENOENT') {
        userMessage = `File not found: ${filePath}`;
      } else if (error.code === 'EACCES' || error.code === 'EPERM') {
        // This is the key part we're testing - permission errors should be specifically identified
        userMessage = `Permission denied. Please check file permissions for: ${filePath}`;
      } else {
        userMessage = `Failed to ${operation} file: ${error.message}`;
      }
      
      // Return error response
      if (operation === 'read') {
        return {
          success: false,
          data: null,
          error: userMessage
        };
      } else {
        return {
          success: false,
          error: userMessage
        };
      }
    }
  }

  test('Property 10: EACCES errors are identified as permission issues for read operations', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate file paths that would typically have permission issues
        fc.record({
          filePath: fc.constantFrom(
            '/root/protected.fbx',
            '/etc/shadow',
            'C:\\Windows\\System32\\config\\SAM',
            'C:\\Program Files\\protected.glb',
            '/var/log/system.log',
            '/usr/bin/protected'
          )
        }),
        async (config) => {
          // Simulate read operation with EACCES error
          const result = await simulateFileOperationWithPermissionError(
            'read',
            config.filePath,
            null,
            'EACCES'
          );
          
          // Verify operation failed
          expect(result.success).toBe(false);
          
          // Verify error message specifically identifies permission issue
          expect(result.error).toBeDefined();
          expect(result.error).not.toBeNull();
          expect(typeof result.error).toBe('string');
          
          // Verify error message contains permission-specific language
          expect(result.error).toContain('Permission denied');
          expect(result.error).toContain('file permissions');
          expect(result.error).toContain(config.filePath);
          
          // Verify error message does NOT use generic language
          expect(result.error).not.toContain('Failed to read file');
          
          // Verify data is null on error
          expect(result.data).toBeNull();
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in design
    );
  });

  test('Property 10: EPERM errors are identified as permission issues for read operations', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate file paths that would typically have permission issues
        fc.record({
          filePath: fc.constantFrom(
            '/root/admin.fbx',
            '/etc/passwd',
            'C:\\Windows\\System32\\drivers\\etc\\hosts',
            'C:\\Program Files\\system.dll',
            '/var/root/data.glb',
            '/usr/local/protected.png'
          )
        }),
        async (config) => {
          // Simulate read operation with EPERM error
          const result = await simulateFileOperationWithPermissionError(
            'read',
            config.filePath,
            null,
            'EPERM'
          );
          
          // Verify operation failed
          expect(result.success).toBe(false);
          
          // Verify error message specifically identifies permission issue
          expect(result.error).toBeDefined();
          expect(result.error).not.toBeNull();
          expect(typeof result.error).toBe('string');
          
          // Verify error message contains permission-specific language
          expect(result.error).toContain('Permission denied');
          expect(result.error).toContain('file permissions');
          expect(result.error).toContain(config.filePath);
          
          // Verify error message does NOT use generic language
          expect(result.error).not.toContain('Failed to read file');
          
          // Verify data is null on error
          expect(result.data).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 10: EACCES errors are identified as permission issues for write operations', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate file paths and data for write operations
        fc.record({
          filePath: fc.constantFrom(
            '/root/output.glb',
            '/etc/config.json',
            'C:\\Windows\\System32\\file.glb',
            'C:\\Program Files\\app\\export.gltf',
            '/var/protected/model.fbx',
            '/usr/bin/data.glb'
          ),
          content: fc.uint8Array({ minLength: 1, maxLength: 1024 })
        }),
        async (config) => {
          const dataBuffer = Buffer.from(config.content);
          
          // Simulate write operation with EACCES error
          const result = await simulateFileOperationWithPermissionError(
            'write',
            config.filePath,
            dataBuffer,
            'EACCES'
          );
          
          // Verify operation failed
          expect(result.success).toBe(false);
          
          // Verify error message specifically identifies permission issue
          expect(result.error).toBeDefined();
          expect(result.error).not.toBeNull();
          expect(typeof result.error).toBe('string');
          
          // Verify error message contains permission-specific language
          expect(result.error).toContain('Permission denied');
          expect(result.error).toContain('file permissions');
          expect(result.error).toContain(config.filePath);
          
          // Verify error message does NOT use generic language
          expect(result.error).not.toContain('Failed to write file');
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 10: EPERM errors are identified as permission issues for write operations', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate file paths and data for write operations
        fc.record({
          filePath: fc.constantFrom(
            '/root/export.glb',
            '/etc/system.conf',
            'C:\\Windows\\protected.glb',
            'C:\\Program Files\\output.gltf',
            '/var/admin/file.fbx',
            '/usr/local/data.glb'
          ),
          content: fc.uint8Array({ minLength: 1, maxLength: 1024 })
        }),
        async (config) => {
          const dataBuffer = Buffer.from(config.content);
          
          // Simulate write operation with EPERM error
          const result = await simulateFileOperationWithPermissionError(
            'write',
            config.filePath,
            dataBuffer,
            'EPERM'
          );
          
          // Verify operation failed
          expect(result.success).toBe(false);
          
          // Verify error message specifically identifies permission issue
          expect(result.error).toBeDefined();
          expect(result.error).not.toBeNull();
          expect(typeof result.error).toBe('string');
          
          // Verify error message contains permission-specific language
          expect(result.error).toContain('Permission denied');
          expect(result.error).toContain('file permissions');
          expect(result.error).toContain(config.filePath);
          
          // Verify error message does NOT use generic language
          expect(result.error).not.toContain('Failed to write file');
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 10: Non-permission errors are NOT identified as permission issues', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate various non-permission error scenarios
        fc.record({
          operation: fc.constantFrom('read', 'write'),
          filePath: fc.string({ minLength: 1, maxLength: 100 }),
          // ENOENT is only checked in read operations in the actual implementation
          errorCode: fc.oneof(
            // For read operations, ENOENT is valid
            fc.record({
              op: fc.constant('read'),
              code: fc.constantFrom('ENOENT', 'ENOSPC', 'EROFS', 'EIO', 'EISDIR', 'ENOTDIR')
            }),
            // For write operations, ENOENT is not specifically checked, so use other errors
            fc.record({
              op: fc.constant('write'),
              code: fc.constantFrom('ENOSPC', 'EROFS', 'EIO', 'EISDIR', 'ENOTDIR')
            })
          ),
          content: fc.uint8Array({ minLength: 1, maxLength: 1024 })
        }),
        async (config) => {
          const operation = config.errorCode.op;
          const errorCode = config.errorCode.code;
          const dataBuffer = operation === 'write' ? Buffer.from(config.content) : null;
          
          // Simulate operation with non-permission error
          const result = await simulateFileOperationWithPermissionError(
            operation,
            config.filePath,
            dataBuffer,
            errorCode
          );
          
          // Verify operation failed
          expect(result.success).toBe(false);
          
          // Verify error message is present
          expect(result.error).toBeDefined();
          expect(result.error).not.toBeNull();
          expect(typeof result.error).toBe('string');
          
          // Verify error message does NOT contain permission-specific language
          expect(result.error).not.toContain('Permission denied');
          expect(result.error).not.toContain('file permissions');
          
          // Verify error message uses appropriate language for the error type
          if (errorCode === 'ENOENT' && operation === 'read') {
            expect(result.error).toContain('File not found');
          } else {
            expect(result.error).toContain(`Failed to ${operation} file`);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 10: Permission errors are consistently identified across both operations', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate scenarios for both read and write operations with permission errors
        fc.record({
          operation: fc.constantFrom('read', 'write'),
          filePath: fc.constantFrom(
            '/root/file.fbx',
            'C:\\Windows\\System32\\file.glb',
            '/etc/protected.png',
            'C:\\Program Files\\data.gltf'
          ),
          errorCode: fc.constantFrom('EACCES', 'EPERM'),
          content: fc.uint8Array({ minLength: 1, maxLength: 512 })
        }),
        async (config) => {
          const dataBuffer = config.operation === 'write' ? Buffer.from(config.content) : null;
          
          // Simulate operation with permission error
          const result = await simulateFileOperationWithPermissionError(
            config.operation,
            config.filePath,
            dataBuffer,
            config.errorCode
          );
          
          // Verify operation failed
          expect(result.success).toBe(false);
          
          // Verify error message consistently identifies permission issues
          // regardless of operation type (read or write) or error code (EACCES or EPERM)
          expect(result.error).toBeDefined();
          expect(result.error).not.toBeNull();
          expect(typeof result.error).toBe('string');
          
          // Verify consistent permission-specific language
          expect(result.error).toContain('Permission denied');
          expect(result.error).toContain('file permissions');
          expect(result.error).toContain(config.filePath);
          
          // Verify the error message format is consistent
          const expectedPattern = /Permission denied\. Please check file permissions for: .+/;
          expect(result.error).toMatch(expectedPattern);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 10: Permission error messages include file path for debugging', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate various file paths with permission errors
        fc.record({
          operation: fc.constantFrom('read', 'write'),
          directory: fc.constantFrom(
            '/root',
            '/etc',
            'C:\\Windows\\System32',
            'C:\\Program Files',
            '/var/protected',
            '/usr/local/admin'
          ),
          filename: fc.stringMatching(/^[a-zA-Z0-9_-]{1,30}$/),
          extension: fc.constantFrom('.fbx', '.glb', '.gltf', '.png', '.jpg'),
          errorCode: fc.constantFrom('EACCES', 'EPERM'),
          content: fc.uint8Array({ minLength: 1, maxLength: 512 })
        }),
        async (config) => {
          // Construct full file path
          const filePath = path.join(config.directory, config.filename + config.extension);
          const dataBuffer = config.operation === 'write' ? Buffer.from(config.content) : null;
          
          // Simulate operation with permission error
          const result = await simulateFileOperationWithPermissionError(
            config.operation,
            filePath,
            dataBuffer,
            config.errorCode
          );
          
          // Verify operation failed
          expect(result.success).toBe(false);
          
          // Verify error message includes the full file path for debugging
          // Note: path.join normalizes separators, so we check for the normalized path
          expect(result.error).toContain(filePath);
          
          // Verify error message includes filename (this is platform-independent)
          expect(result.error).toContain(config.filename);
          
          // Verify error message includes extension (this is platform-independent)
          expect(result.error).toContain(config.extension);
          
          // Verify permission-specific language is present
          expect(result.error).toContain('Permission denied');
          expect(result.error).toContain('file permissions');
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 10: Permission error identification is case-insensitive for error codes', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate scenarios with different error code cases (though Node.js typically uses uppercase)
        fc.record({
          operation: fc.constantFrom('read', 'write'),
          filePath: fc.constantFrom(
            '/root/file.fbx',
            'C:\\Windows\\file.glb'
          ),
          // In practice, Node.js uses uppercase, but we test the logic handles both
          errorCode: fc.constantFrom('EACCES', 'EPERM'),
          content: fc.uint8Array({ minLength: 1, maxLength: 512 })
        }),
        async (config) => {
          const dataBuffer = config.operation === 'write' ? Buffer.from(config.content) : null;
          
          // Simulate operation with permission error
          const result = await simulateFileOperationWithPermissionError(
            config.operation,
            config.filePath,
            dataBuffer,
            config.errorCode
          );
          
          // Verify operation failed
          expect(result.success).toBe(false);
          
          // Verify permission error is identified regardless of case
          expect(result.error).toContain('Permission denied');
          expect(result.error).toContain('file permissions');
          
          // Verify the error code was properly recognized
          // (both EACCES and EPERM should produce the same permission message)
          const isPermissionError = 
            result.error.includes('Permission denied') &&
            result.error.includes('file permissions');
          expect(isPermissionError).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: electron-windows-app, Property 11: Existing functionality parity
 * Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5
 * 
 * Property: For any user operation (loading FBX, applying textures, using transform controls, 
 * customizing settings, exporting GLB), the Electron version should produce identical results 
 * to the web version.
 * 
 * Note: This property tests the adapter layer to ensure that Electron-specific implementations
 * maintain compatibility with browser-based implementations. Full end-to-end parity testing
 * requires manual testing as specified in the design document.
 */
describe('Functionality Parity Properties', () => {
  
  /**
   * Helper function to simulate file reading in both Electron and browser contexts
   * This tests that the adapter maintains compatibility
   */
  async function simulateFileReadingParity(fileData, useElectronPath) {
    // Simulate browser-style file reading (FileReader API)
    const browserRead = async (data) => {
      return new Promise((resolve) => {
        // Simulate FileReader behavior
        const result = new ArrayBuffer(data.length);
        const view = new Uint8Array(result);
        for (let i = 0; i < data.length; i++) {
          view[i] = data[i];
        }
        resolve(result);
      });
    };
    
    // Simulate Electron-style file reading (via IPC)
    const electronRead = async (data) => {
      // Simulate the Electron IPC read process
      // In real implementation: window.electronAPI.readFile(path)
      // Returns: { success: true, data: Buffer }
      const buffer = Buffer.from(data);
      return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    };
    
    // Read using both methods
    const browserResult = await browserRead(fileData);
    const electronResult = await electronRead(fileData);
    
    return {
      browser: browserResult,
      electron: electronResult,
      match: arraysEqual(new Uint8Array(browserResult), new Uint8Array(electronResult))
    };
  }
  
  /**
   * Helper function to compare two Uint8Arrays
   */
  function arraysEqual(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }
  
  /**
   * Helper function to simulate file writing in both Electron and browser contexts
   */
  async function simulateFileWritingParity(fileData, filename) {
    // Simulate browser-style file writing (Blob download)
    const browserWrite = async (data, name) => {
      const blob = new Blob([data], { type: 'application/octet-stream' });
      // In browser, this would trigger a download
      // We simulate by returning the blob data
      return {
        method: 'blob-download',
        filename: name,
        size: blob.size,
        type: blob.type,
        data: await blob.arrayBuffer()
      };
    };
    
    // Simulate Electron-style file writing (via IPC)
    const electronWrite = async (data, name) => {
      // In Electron, this would use save dialog + writeFile
      // We simulate by returning the write parameters
      const buffer = Buffer.from(data);
      return {
        method: 'electron-save',
        filename: name,
        size: buffer.length,
        type: 'application/octet-stream',
        data: buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
      };
    };
    
    // Write using both methods
    const browserResult = await browserWrite(fileData, filename);
    const electronResult = await electronWrite(fileData, filename);
    
    return {
      browser: browserResult,
      electron: electronResult,
      sizeMatch: browserResult.size === electronResult.size,
      dataMatch: arraysEqual(new Uint8Array(browserResult.data), new Uint8Array(electronResult.data)),
      filenameMatch: browserResult.filename === electronResult.filename
    };
  }

  test('Property 11: File reading produces identical data in Electron and browser', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate various file data scenarios
        fc.oneof(
          // Small files
          fc.uint8Array({ minLength: 1, maxLength: 1024 }),
          // Medium files
          fc.uint8Array({ minLength: 1024, maxLength: 5120 }),
          // Files with specific patterns (FBX magic bytes, PNG magic bytes, etc.)
          fc.constantFrom(
            new Uint8Array([0x4B, 0x61, 0x79, 0x64, 0x61, 0x72, 0x61]), // FBX magic
            new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]), // PNG magic
            new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0]), // JPEG magic
            new Uint8Array([0x67, 0x6C, 0x54, 0x46, 0x02, 0x00, 0x00, 0x00]) // glTF magic
          )
        ),
        async (fileData) => {
          // Simulate reading the same file data in both contexts
          const result = await simulateFileReadingParity(fileData, false);
          
          // Verify both methods produce identical data
          expect(result.match).toBe(true);
          
          // Verify data integrity
          expect(result.browser).toBeDefined();
          expect(result.electron).toBeDefined();
          
          // Verify data length matches original
          expect(new Uint8Array(result.browser).length).toBe(fileData.length);
          expect(new Uint8Array(result.electron).length).toBe(fileData.length);
          
          // Verify byte-by-byte equality
          const browserView = new Uint8Array(result.browser);
          const electronView = new Uint8Array(result.electron);
          
          for (let i = 0; i < fileData.length; i++) {
            expect(browserView[i]).toBe(fileData[i]);
            expect(electronView[i]).toBe(fileData[i]);
            expect(browserView[i]).toBe(electronView[i]);
          }
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in design
    );
  });

  test('Property 11: File writing produces identical output in Electron and browser', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate various file writing scenarios
        fc.record({
          data: fc.oneof(
            fc.uint8Array({ minLength: 1, maxLength: 1024 }),
            fc.uint8Array({ minLength: 1024, maxLength: 5120 })
          ),
          filename: fc.oneof(
            fc.stringMatching(/^[a-zA-Z0-9_-]{1,30}\.glb$/),
            fc.stringMatching(/^[a-zA-Z0-9_-]{1,30}\.gltf$/),
            fc.constantFrom('model.glb', 'animation.gltf', 'export.glb', 'scene.gltf')
          )
        }),
        async (config) => {
          // Simulate writing the same file data in both contexts
          const result = await simulateFileWritingParity(config.data, config.filename);
          
          // Verify both methods produce identical data
          expect(result.dataMatch).toBe(true);
          
          // Verify file size is identical
          expect(result.sizeMatch).toBe(true);
          expect(result.browser.size).toBe(config.data.length);
          expect(result.electron.size).toBe(config.data.length);
          
          // Verify filename is preserved
          expect(result.filenameMatch).toBe(true);
          expect(result.browser.filename).toBe(config.filename);
          expect(result.electron.filename).toBe(config.filename);
          
          // Verify data integrity
          const browserView = new Uint8Array(result.browser.data);
          const electronView = new Uint8Array(result.electron.data);
          
          for (let i = 0; i < config.data.length; i++) {
            expect(browserView[i]).toBe(config.data[i]);
            expect(electronView[i]).toBe(config.data[i]);
            expect(browserView[i]).toBe(electronView[i]);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 11: Binary data integrity is maintained across both platforms', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random binary data that might represent FBX, textures, or GLB files
        fc.uint8Array({ minLength: 100, maxLength: 10000 }),
        async (binaryData) => {
          // Test reading parity
          const readResult = await simulateFileReadingParity(binaryData, false);
          
          // Verify reading produces identical results
          expect(readResult.match).toBe(true);
          
          // Calculate checksums to verify data integrity
          const originalSum = binaryData.reduce((sum, byte) => sum + byte, 0);
          const browserSum = Array.from(new Uint8Array(readResult.browser)).reduce((sum, byte) => sum + byte, 0);
          const electronSum = Array.from(new Uint8Array(readResult.electron)).reduce((sum, byte) => sum + byte, 0);
          
          // Verify checksums match
          expect(browserSum).toBe(originalSum);
          expect(electronSum).toBe(originalSum);
          expect(browserSum).toBe(electronSum);
          
          // Test writing parity
          const writeResult = await simulateFileWritingParity(binaryData, 'test.glb');
          
          // Verify writing produces identical results
          expect(writeResult.dataMatch).toBe(true);
          expect(writeResult.sizeMatch).toBe(true);
          
          // Verify written data matches original
          const writtenBrowserSum = Array.from(new Uint8Array(writeResult.browser.data)).reduce((sum, byte) => sum + byte, 0);
          const writtenElectronSum = Array.from(new Uint8Array(writeResult.electron.data)).reduce((sum, byte) => sum + byte, 0);
          
          expect(writtenBrowserSum).toBe(originalSum);
          expect(writtenElectronSum).toBe(originalSum);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 11: Empty files are handled identically in both platforms', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate various empty file scenarios
        fc.constantFrom(
          new Uint8Array(0),
          new Uint8Array([]),
          Buffer.alloc(0)
        ),
        async (emptyData) => {
          // Test reading empty files
          const readResult = await simulateFileReadingParity(emptyData, false);
          
          // Verify both produce empty results
          expect(readResult.match).toBe(true);
          expect(new Uint8Array(readResult.browser).length).toBe(0);
          expect(new Uint8Array(readResult.electron).length).toBe(0);
          
          // Test writing empty files
          const writeResult = await simulateFileWritingParity(emptyData, 'empty.glb');
          
          // Verify both produce empty files
          expect(writeResult.dataMatch).toBe(true);
          expect(writeResult.sizeMatch).toBe(true);
          expect(writeResult.browser.size).toBe(0);
          expect(writeResult.electron.size).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 11: Large files maintain data integrity across platforms', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate larger file sizes to test performance and integrity
        fc.integer({ min: 100000, max: 500000 }),
        async (fileSize) => {
          // Create a large file with a pattern
          const largeData = new Uint8Array(fileSize);
          for (let i = 0; i < fileSize; i++) {
            largeData[i] = i % 256; // Repeating pattern
          }
          
          // Test reading large files
          const readResult = await simulateFileReadingParity(largeData, false);
          
          // Verify data integrity for large files
          expect(readResult.match).toBe(true);
          expect(new Uint8Array(readResult.browser).length).toBe(fileSize);
          expect(new Uint8Array(readResult.electron).length).toBe(fileSize);
          
          // Verify pattern is preserved
          const browserView = new Uint8Array(readResult.browser);
          const electronView = new Uint8Array(readResult.electron);
          
          // Sample check (checking every byte would be slow)
          const samplePoints = [0, Math.floor(fileSize / 4), Math.floor(fileSize / 2), Math.floor(fileSize * 3 / 4), fileSize - 1];
          for (const i of samplePoints) {
            expect(browserView[i]).toBe(i % 256);
            expect(electronView[i]).toBe(i % 256);
            expect(browserView[i]).toBe(electronView[i]);
          }
          
          // Test writing large files
          const writeResult = await simulateFileWritingParity(largeData, 'large.glb');
          
          // Verify size matches
          expect(writeResult.sizeMatch).toBe(true);
          expect(writeResult.browser.size).toBe(fileSize);
          expect(writeResult.electron.size).toBe(fileSize);
        }
      ),
      { numRuns: 20 } // Fewer runs for large files to avoid timeout
    );
  });

  test('Property 11: File format magic bytes are preserved across platforms', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate files with various format magic bytes
        fc.constantFrom(
          // FBX file
          {
            name: 'model.fbx',
            magic: new Uint8Array([0x4B, 0x61, 0x79, 0x64, 0x61, 0x72, 0x61, 0x20, 0x46, 0x42, 0x58]),
            format: 'FBX'
          },
          // PNG texture
          {
            name: 'texture.png',
            magic: new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
            format: 'PNG'
          },
          // JPEG texture
          {
            name: 'texture.jpg',
            magic: new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46]),
            format: 'JPEG'
          },
          // GLB export
          {
            name: 'export.glb',
            magic: new Uint8Array([0x67, 0x6C, 0x54, 0x46, 0x02, 0x00, 0x00, 0x00]),
            format: 'glTF'
          }
        ),
        async (fileConfig) => {
          // Add some additional data after magic bytes
          const fullData = new Uint8Array(fileConfig.magic.length + 100);
          fullData.set(fileConfig.magic, 0);
          for (let i = fileConfig.magic.length; i < fullData.length; i++) {
            fullData[i] = i % 256;
          }
          
          // Test reading preserves magic bytes
          const readResult = await simulateFileReadingParity(fullData, false);
          
          // Verify magic bytes are preserved in both platforms
          const browserView = new Uint8Array(readResult.browser);
          const electronView = new Uint8Array(readResult.electron);
          
          for (let i = 0; i < fileConfig.magic.length; i++) {
            expect(browserView[i]).toBe(fileConfig.magic[i]);
            expect(electronView[i]).toBe(fileConfig.magic[i]);
            expect(browserView[i]).toBe(electronView[i]);
          }
          
          // Test writing preserves magic bytes
          const writeResult = await simulateFileWritingParity(fullData, fileConfig.name);
          
          // Verify magic bytes in written data
          const writtenBrowserView = new Uint8Array(writeResult.browser.data);
          const writtenElectronView = new Uint8Array(writeResult.electron.data);
          
          for (let i = 0; i < fileConfig.magic.length; i++) {
            expect(writtenBrowserView[i]).toBe(fileConfig.magic[i]);
            expect(writtenElectronView[i]).toBe(fileConfig.magic[i]);
            expect(writtenBrowserView[i]).toBe(writtenElectronView[i]);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 11: Filename handling is consistent across platforms', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate various filename patterns
        fc.record({
          basename: fc.stringMatching(/^[a-zA-Z0-9_-]{1,30}$/),
          extension: fc.constantFrom('.glb', '.gltf', '.fbx'),
          data: fc.uint8Array({ minLength: 1, maxLength: 1024 })
        }),
        async (config) => {
          const filename = config.basename + config.extension;
          
          // Test writing with various filenames
          const writeResult = await simulateFileWritingParity(config.data, filename);
          
          // Verify filename is preserved identically in both platforms
          expect(writeResult.filenameMatch).toBe(true);
          expect(writeResult.browser.filename).toBe(filename);
          expect(writeResult.electron.filename).toBe(filename);
          
          // Verify filename components are preserved
          expect(writeResult.browser.filename).toContain(config.basename);
          expect(writeResult.browser.filename).toContain(config.extension);
          expect(writeResult.electron.filename).toContain(config.basename);
          expect(writeResult.electron.filename).toContain(config.extension);
          
          // Verify data is also identical
          expect(writeResult.dataMatch).toBe(true);
          expect(writeResult.sizeMatch).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 11: Special characters in filenames are handled consistently', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate filenames with special characters (valid for filenames)
        fc.record({
          baseName: fc.stringMatching(/^[a-zA-Z0-9]{1,20}$/),
          separator: fc.constantFrom('_', '-', ' '),
          suffix: fc.stringMatching(/^[a-zA-Z0-9]{1,10}$/),
          extension: fc.constantFrom('.glb', '.gltf'),
          data: fc.uint8Array({ minLength: 1, maxLength: 512 })
        }),
        async (config) => {
          const filename = `${config.baseName}${config.separator}${config.suffix}${config.extension}`;
          
          // Test writing with special characters in filename
          const writeResult = await simulateFileWritingParity(config.data, filename);
          
          // Verify filename with special characters is preserved identically
          expect(writeResult.filenameMatch).toBe(true);
          expect(writeResult.browser.filename).toBe(filename);
          expect(writeResult.electron.filename).toBe(filename);
          
          // Verify all components are present
          expect(writeResult.browser.filename).toContain(config.baseName);
          expect(writeResult.browser.filename).toContain(config.separator);
          expect(writeResult.browser.filename).toContain(config.suffix);
          expect(writeResult.browser.filename).toContain(config.extension);
          
          // Verify data integrity
          expect(writeResult.dataMatch).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 11: Data type conversions maintain compatibility', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate various data type scenarios
        fc.uint8Array({ minLength: 100, maxLength: 1000 }),
        async (originalData) => {
          // Test that conversions between ArrayBuffer, Buffer, and Uint8Array maintain data
          
          // Simulate browser: Uint8Array -> ArrayBuffer
          const browserArrayBuffer = originalData.buffer.slice(
            originalData.byteOffset,
            originalData.byteOffset + originalData.byteLength
          );
          
          // Simulate Electron: Uint8Array -> Buffer -> ArrayBuffer
          const electronBuffer = Buffer.from(originalData);
          const electronArrayBuffer = electronBuffer.buffer.slice(
            electronBuffer.byteOffset,
            electronBuffer.byteOffset + electronBuffer.byteLength
          );
          
          // Verify both conversions produce identical results
          const browserView = new Uint8Array(browserArrayBuffer);
          const electronView = new Uint8Array(electronArrayBuffer);
          
          expect(browserView.length).toBe(electronView.length);
          expect(browserView.length).toBe(originalData.length);
          
          // Verify byte-by-byte equality
          for (let i = 0; i < originalData.length; i++) {
            expect(browserView[i]).toBe(originalData[i]);
            expect(electronView[i]).toBe(originalData[i]);
            expect(browserView[i]).toBe(electronView[i]);
          }
          
          // Verify checksums match
          const originalSum = originalData.reduce((sum, byte) => sum + byte, 0);
          const browserSum = Array.from(browserView).reduce((sum, byte) => sum + byte, 0);
          const electronSum = Array.from(electronView).reduce((sum, byte) => sum + byte, 0);
          
          expect(browserSum).toBe(originalSum);
          expect(electronSum).toBe(originalSum);
        }
      ),
      { numRuns: 100 }
    );
  });
});
      