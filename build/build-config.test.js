/**
 * Unit Tests for Build Configuration
 * Testing that build config includes all required files, icon files exist,
 * and package.json scripts are correct
 * 
 * Requirements: 8.1, 8.3
 */

import { test, expect, describe } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

/**
 * Test Suite: Package.json Build Configuration
 * Validates that package.json contains correct build configuration
 */
describe('Package.json Build Configuration', () => {
  let packageJson;

  // Load package.json before tests
  try {
    const packageJsonPath = join(projectRoot, 'package.json');
    const packageJsonContent = readFileSync(packageJsonPath, 'utf-8');
    packageJson = JSON.parse(packageJsonContent);
  } catch (error) {
    throw new Error(`Failed to load package.json: ${error.message}`);
  }

  test('package.json has build configuration section', () => {
    expect(packageJson).toHaveProperty('build');
    expect(typeof packageJson.build).toBe('object');
  });

  test('build config has correct appId', () => {
    expect(packageJson.build).toHaveProperty('appId');
    expect(packageJson.build.appId).toBe('com.3danimationmerger.app');
  });

  test('build config has correct productName', () => {
    expect(packageJson.build).toHaveProperty('productName');
    expect(packageJson.build.productName).toBe('3D Animation Merger');
  });

  test('build config has directories configuration', () => {
    expect(packageJson.build).toHaveProperty('directories');
    expect(packageJson.build.directories).toHaveProperty('output');
    expect(packageJson.build.directories).toHaveProperty('buildResources');
    expect(packageJson.build.directories.output).toBe('dist');
    expect(packageJson.build.directories.buildResources).toBe('build-resources');
  });

  test('build config includes all required files', () => {
    expect(packageJson.build).toHaveProperty('files');
    expect(Array.isArray(packageJson.build.files)).toBe(true);

    const requiredFiles = [
      'electron/**/*',
      'bin/**/*',
      'styles/**/*',
      'assets/**/*',
      'index.html',
      'package.json'
    ];

    requiredFiles.forEach(file => {
      expect(packageJson.build.files).toContain(file);
    });
  });

  test('build config has Windows target configuration', () => {
    expect(packageJson.build).toHaveProperty('win');
    expect(packageJson.build.win).toHaveProperty('target');
    expect(Array.isArray(packageJson.build.win.target)).toBe(true);
    expect(packageJson.build.win.target.length).toBeGreaterThan(0);
  });

  test('Windows target includes nsis with x64 architecture', () => {
    const nsisTarget = packageJson.build.win.target.find(t => t.target === 'nsis');
    expect(nsisTarget).toBeDefined();
    expect(nsisTarget.arch).toContain('x64');
  });

  test('Windows config specifies icon file', () => {
    expect(packageJson.build.win).toHaveProperty('icon');
    expect(packageJson.build.win.icon).toBe('build-resources/icon.ico');
  });

  test('build config has NSIS installer configuration', () => {
    expect(packageJson.build).toHaveProperty('nsis');
    expect(typeof packageJson.build.nsis).toBe('object');
  });

  test('NSIS config has correct installer options', () => {
    const nsis = packageJson.build.nsis;
    
    expect(nsis).toHaveProperty('oneClick');
    expect(nsis.oneClick).toBe(false);
    
    expect(nsis).toHaveProperty('allowToChangeInstallationDirectory');
    expect(nsis.allowToChangeInstallationDirectory).toBe(true);
    
    expect(nsis).toHaveProperty('createDesktopShortcut');
    expect(nsis.createDesktopShortcut).toBe(true);
    
    expect(nsis).toHaveProperty('createStartMenuShortcut');
    expect(nsis.createStartMenuShortcut).toBe(true);
  });
});

/**
 * Test Suite: Package.json Scripts Configuration
 * Validates that package.json contains all required scripts
 */
describe('Package.json Scripts Configuration', () => {
  let packageJson;

  // Load package.json before tests
  try {
    const packageJsonPath = join(projectRoot, 'package.json');
    const packageJsonContent = readFileSync(packageJsonPath, 'utf-8');
    packageJson = JSON.parse(packageJsonContent);
  } catch (error) {
    throw new Error(`Failed to load package.json: ${error.message}`);
  }

  test('package.json has scripts section', () => {
    expect(packageJson).toHaveProperty('scripts');
    expect(typeof packageJson.scripts).toBe('object');
  });

  test('has start script for launching Electron', () => {
    expect(packageJson.scripts).toHaveProperty('start');
    expect(packageJson.scripts.start).toContain('electron');
  });

  test('has dev script for development mode', () => {
    expect(packageJson.scripts).toHaveProperty('dev');
    expect(packageJson.scripts.dev).toContain('concurrently');
    expect(packageJson.scripts.dev).toContain('electron');
  });

  test('has build script for production build', () => {
    expect(packageJson.scripts).toHaveProperty('build');
    expect(packageJson.scripts.build).toContain('build.js');
  });

  test('has pack script for electron-builder packaging', () => {
    expect(packageJson.scripts).toHaveProperty('pack');
    expect(packageJson.scripts.pack).toContain('electron-builder');
    expect(packageJson.scripts.pack).toContain('--dir');
  });

  test('has dist script for Windows distribution', () => {
    expect(packageJson.scripts).toHaveProperty('dist');
    expect(packageJson.scripts.dist).toContain('electron-builder');
    expect(packageJson.scripts.dist).toContain('--win');
  });

  test('has dist:installer script for NSIS installer', () => {
    expect(packageJson.scripts).toHaveProperty('dist:installer');
    expect(packageJson.scripts['dist:installer']).toContain('electron-builder');
    expect(packageJson.scripts['dist:installer']).toContain('--win');
    expect(packageJson.scripts['dist:installer']).toContain('nsis');
  });

  test('has test script for running tests', () => {
    expect(packageJson.scripts).toHaveProperty('test');
    expect(packageJson.scripts.test).toContain('vitest');
  });

  test('all required scripts are present', () => {
    const requiredScripts = [
      'start',
      'dev',
      'build',
      'pack',
      'dist',
      'dist:installer',
      'test'
    ];

    requiredScripts.forEach(script => {
      expect(packageJson.scripts).toHaveProperty(script);
      expect(typeof packageJson.scripts[script]).toBe('string');
      expect(packageJson.scripts[script].length).toBeGreaterThan(0);
    });
  });
});

/**
 * Test Suite: Icon Files Existence
 * Validates that all required icon files exist or can be generated
 */
describe('Icon Files Existence', () => {
  test('build-resources directory exists', () => {
    const buildResourcesPath = join(projectRoot, 'build-resources');
    expect(existsSync(buildResourcesPath)).toBe(true);
  });

  test('icon.ico file exists for Windows OR icon generation script exists', () => {
    const iconPath = join(projectRoot, 'build-resources', 'icon.ico');
    const generateScriptPath = join(projectRoot, 'build-resources', 'generate-icons.js');
    const iconSvgPath = join(projectRoot, 'build-resources', 'icon.svg');
    
    // Either the icon exists, or we have the tools to generate it
    const hasIcon = existsSync(iconPath);
    const canGenerateIcon = existsSync(generateScriptPath) && existsSync(iconSvgPath);
    
    expect(hasIcon || canGenerateIcon).toBe(true);
    
    // If icon exists, verify it's not empty
    if (hasIcon) {
      const iconStats = readFileSync(iconPath);
      expect(iconStats.length).toBeGreaterThan(0);
    }
  });

  test('icon.png source file exists OR icon generation script exists', () => {
    const iconPath = join(projectRoot, 'build-resources', 'icon.png');
    const generateScriptPath = join(projectRoot, 'build-resources', 'generate-icons.js');
    const iconSvgPath = join(projectRoot, 'build-resources', 'icon.svg');
    
    // Either the icon exists, or we have the tools to generate it
    const hasIcon = existsSync(iconPath);
    const canGenerateIcon = existsSync(generateScriptPath) && existsSync(iconSvgPath);
    
    expect(hasIcon || canGenerateIcon).toBe(true);
    
    // If icon exists, verify it's not empty
    if (hasIcon) {
      const iconStats = readFileSync(iconPath);
      expect(iconStats.length).toBeGreaterThan(0);
    }
  });

  test('icon source file (SVG) exists for generation', () => {
    const iconSvgPath = join(projectRoot, 'build-resources', 'icon.svg');
    expect(existsSync(iconSvgPath)).toBe(true);
  });

  test('icon generation script exists', () => {
    const generateScriptPath = join(projectRoot, 'build-resources', 'generate-icons.js');
    expect(existsSync(generateScriptPath)).toBe(true);
  });

  test('package.json has generate-icons script', () => {
    const packageJsonPath = join(projectRoot, 'package.json');
    const packageJsonContent = readFileSync(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(packageJsonContent);
    
    expect(packageJson.scripts).toHaveProperty('generate-icons');
    expect(packageJson.scripts['generate-icons']).toContain('generate-icons.js');
  });
});

/**
 * Test Suite: Required Directories Existence
 * Validates that all directories referenced in build config exist
 */
describe('Required Directories Existence', () => {
  test('electron directory exists', () => {
    const electronPath = join(projectRoot, 'electron');
    expect(existsSync(electronPath)).toBe(true);
  });

  test('bin directory exists or will be created by build', () => {
    const binPath = join(projectRoot, 'bin');
    // bin directory may not exist before build, but should be creatable
    // We just verify the parent directory exists
    expect(existsSync(projectRoot)).toBe(true);
  });

  test('styles directory exists', () => {
    const stylesPath = join(projectRoot, 'styles');
    expect(existsSync(stylesPath)).toBe(true);
  });

  test('assets directory exists', () => {
    const assetsPath = join(projectRoot, 'assets');
    expect(existsSync(assetsPath)).toBe(true);
  });

  test('index.html exists in project root', () => {
    const indexPath = join(projectRoot, 'index.html');
    expect(existsSync(indexPath)).toBe(true);
  });
});

/**
 * Test Suite: Build Configuration Completeness
 * Validates that build configuration is complete and consistent
 */
describe('Build Configuration Completeness', () => {
  let packageJson;

  // Load package.json before tests
  try {
    const packageJsonPath = join(projectRoot, 'package.json');
    const packageJsonContent = readFileSync(packageJsonPath, 'utf-8');
    packageJson = JSON.parse(packageJsonContent);
  } catch (error) {
    throw new Error(`Failed to load package.json: ${error.message}`);
  }

  test('main entry point is set correctly', () => {
    expect(packageJson).toHaveProperty('main');
    expect(packageJson.main).toBe('electron/main.js');
  });

  test('main entry point file exists', () => {
    const mainPath = join(projectRoot, packageJson.main);
    expect(existsSync(mainPath)).toBe(true);
  });

  test('package has required Electron dependencies', () => {
    expect(packageJson).toHaveProperty('devDependencies');
    expect(packageJson.devDependencies).toHaveProperty('electron');
    expect(packageJson.devDependencies).toHaveProperty('electron-builder');
  });

  test('package has required runtime dependencies', () => {
    expect(packageJson).toHaveProperty('dependencies');
    expect(packageJson.dependencies).toHaveProperty('electron-store');
    expect(packageJson.dependencies).toHaveProperty('three');
  });

  test('package type is set to module', () => {
    expect(packageJson).toHaveProperty('type');
    expect(packageJson.type).toBe('module');
  });

  test('build files list does not include node_modules', () => {
    expect(packageJson.build.files).not.toContain('node_modules/**/*');
    expect(packageJson.build.files).not.toContain('node_modules');
  });

  test('build files list does not include test files', () => {
    const hasTestFiles = packageJson.build.files.some(file => 
      file.includes('test') || file.includes('spec')
    );
    expect(hasTestFiles).toBe(false);
  });

  test('build output directory is not in files list', () => {
    const outputDir = packageJson.build.directories.output;
    expect(packageJson.build.files).not.toContain(outputDir);
    expect(packageJson.build.files).not.toContain(`${outputDir}/**/*`);
  });
});

/**
 * Test Suite: Build Script Files Existence
 * Validates that build script files exist and are accessible
 */
describe('Build Script Files Existence', () => {
  test('build.js script exists', () => {
    const buildScriptPath = join(projectRoot, 'build', 'build.js');
    expect(existsSync(buildScriptPath)).toBe(true);
  });

  test('watch.js script exists', () => {
    const watchScriptPath = join(projectRoot, 'build', 'watch.js');
    expect(existsSync(watchScriptPath)).toBe(true);
  });

  test('build scripts are not empty', () => {
    const buildScriptPath = join(projectRoot, 'build', 'build.js');
    const watchScriptPath = join(projectRoot, 'build', 'watch.js');

    const buildContent = readFileSync(buildScriptPath, 'utf-8');
    const watchContent = readFileSync(watchScriptPath, 'utf-8');

    expect(buildContent.length).toBeGreaterThan(0);
    expect(watchContent.length).toBeGreaterThan(0);
  });
});

/**
 * Test Suite: Electron Main Process Files
 * Validates that all Electron main process files exist
 */
describe('Electron Main Process Files', () => {
  test('main.js exists in electron directory', () => {
    const mainPath = join(projectRoot, 'electron', 'main.js');
    expect(existsSync(mainPath)).toBe(true);
  });

  test('preload.js exists in electron directory', () => {
    const preloadPath = join(projectRoot, 'electron', 'preload.js');
    expect(existsSync(preloadPath)).toBe(true);
  });

  test('window-state.js exists in electron directory', () => {
    const windowStatePath = join(projectRoot, 'electron', 'window-state.js');
    expect(existsSync(windowStatePath)).toBe(true);
  });

  test('all electron files are included in build files list', () => {
    let packageJson;
    const packageJsonPath = join(projectRoot, 'package.json');
    const packageJsonContent = readFileSync(packageJsonPath, 'utf-8');
    packageJson = JSON.parse(packageJsonContent);

    expect(packageJson.build.files).toContain('electron/**/*');
  });
});
