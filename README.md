![3d Animation Merger](screen.jpg)

# 3D Animation Merger

A desktop application for merging 3D animations from multiple FBX files into a single GLB file. Available as both a web application and a native Windows desktop application built with Electron.

## Features

- Load FBX models with animations
- Apply textures in two modes:
  - **Shaded Mode** - Simple UV texture mapping
  - **PBR Mode** - Full physically-based rendering with support for:
    - Base Color (Albedo), Normal, Metallic, Roughness, AO, Emissive maps
    - Packed ORM textures (R=AO, G=Roughness, B=Metallic)
- Merge multiple animation FBX files
- Interactive 3D preview with transform controls (translate, rotate, scale)
- Rename and delete animations
- Customize scene settings (background color, grid size, grid divisions)
- **Custom export filename** - Name your exported GLB file (auto-fills from source file)
- **In Place mode** - Remove root motion from animations (character stays in place)
- Export combined model with textures and animations as GLB

## Desktop Application (Electron)

The application is available as a native Windows desktop application with the following benefits:

- Native Windows file dialogs for opening and saving files
- No browser required - runs as a standalone application
- Window state persistence (remembers size and position)
- Professional Windows application icon
- Offline operation - no internet connection required
- All web features fully supported

## Team
* **Jérémy Minié** — Front-end Developer

## Requirements

### Development

| Name       | Version  |
| ---------- | -------- |
| [Node]     | >= 14.17 |
| [NPM]      | >= 7.0   |

See [`package.json`](package.json) for all dependencies.

## Development Workflow

### Electron Version (Desktop)

```sh
# Install dependencies (includes Electron)
npm install

# Run Electron app in development mode
npm start

# Development with auto-reload (watch mode)
npm run dev
```

The `npm start` command launches the Electron app directly. The `npm run dev` command watches for file changes and automatically reloads the application.

### Building the Application

```sh
# Production build - compile and minify JavaScript
npm run build
```

This compiles all source files from `scripts/` into the `bin/` directory using esbuild.

## Build and Packaging

### Building for Production

```sh
# Build the application (required before packaging)
npm run build
```

This compiles and minifies all JavaScript files into the `bin/` directory.

### Creating Windows Executable

```sh
# Create unpacked Windows executable (for testing)
npm run pack

# Create Windows portable executable (.exe)
npm run dist

# Create Windows installer (.exe with NSIS)
npm run dist:installer
```

**Output locations:**
- Unpacked: `dist/win-unpacked/`
- Portable executable: `dist/3D Animation Merger-{version}.exe`
- Installer: `dist/3D Animation Merger Setup {version}.exe`

### Packaging Process Details

The packaging process uses `electron-builder` with the following configuration:

1. **Application ID**: `com.3danimationmerger.app`
2. **Product Name**: `3D Animation Merger`
3. **Target Platform**: Windows x64
4. **Installer Type**: NSIS (Nullsoft Scriptable Install System)
5. **Icon**: `build-resources/icon.ico` (converted from 1024x1024 PNG)

**Included Files:**
- `electron/` - Main process, preload script, window state management
- `bin/` - Compiled JavaScript bundles
- `styles/` - CSS stylesheets
- `assets/` - Static assets (icons, images)
- `index.html` - Main HTML entry point

**Installer Features:**
- User can choose installation directory
- Creates desktop shortcut
- Creates Start Menu shortcut
- Includes uninstaller

## Testing

### Unit Tests

```sh
# Run all unit tests (single run)
npm test

# Run tests in watch mode (development)
npm run test:watch
```

### Property-Based Tests

The project includes property-based tests using `fast-check` to verify correctness properties across many random inputs. These tests validate:

- File dialog configuration
- File I/O operations
- Window state persistence
- Error handling
- Functionality parity between web and Electron versions

Run property tests with the standard test command:

```sh
npm test
```

## Project Structure

```
├── electron/                  # Electron-specific code
│   ├── main.js               # Main process (window management, IPC)
│   ├── preload.js            # Preload script (secure IPC bridge)
│   └── window-state.js       # Window state persistence
├── scripts/                   # Application source code
│   ├── main.js               # Main application class
│   ├── electron-adapter.js   # Electron integration adapter
│   └── GLTFExporter.js       # Custom GLTF exporter
├── build/                     # Build scripts (esbuild)
├── build-resources/           # Application icons
│   ├── icon.png              # Source icon (1024x1024)
│   └── icon.ico              # Windows icon
├── bin/                       # Compiled output (generated)
├── dist/                      # Packaged applications (generated)
├── styles/                    # CSS stylesheets
├── assets/                    # Static assets
├── index.html                # Main HTML entry point
└── package.json              # Dependencies and scripts
```

## Architecture

### Electron Architecture

The Electron version uses a two-process architecture:

**Main Process (`electron/main.js`):**
- Manages application lifecycle
- Creates and manages windows
- Handles native file dialogs (open/save)
- Performs file system operations
- Communicates with renderer via IPC

**Renderer Process (`scripts/main.js`):**
- Runs the web application UI
- Handles Three.js 3D rendering
- Communicates with main process via IPC
- All existing web functionality

**Preload Script (`electron/preload.js`):**
- Provides secure bridge between processes
- Exposes limited IPC API via `contextBridge`
- Prevents direct Node.js access from renderer

### IPC Communication

The application uses the following IPC channels:

**Renderer → Main:**
- `open-file-dialog` - Request native file open dialog
- `save-file-dialog` - Request native file save dialog
- `read-file` - Request file read operation
- `write-file` - Request file write operation

**Main → Renderer:**
- `file-error` - Report file operation errors

## Troubleshooting

### Development Issues

**Problem: Electron window doesn't open**
- Ensure you've run `npm install` to install all dependencies
- Check that no other Electron instance is running
- Try deleting `node_modules` and running `npm install` again
- Check console output for error messages

**Problem: Changes not reflected in Electron app**
- Run `npm run build` to recompile the application
- Restart the Electron app after building
- For live development, use `npm run build:watch` in one terminal and `npm run electron:start` in another

**Problem: Three.js modules not loading**
- Verify that `bin/main.js` exists (run `npm run build`)
- Check Content Security Policy in `index.html`
- Ensure all module paths are relative (no absolute URLs)

**Problem: File dialogs not working**
- Verify `electron/preload.js` is loaded correctly
- Check that `contextIsolation: true` in `electron/main.js`
- Ensure `window.electronAPI` is available in renderer console

### Build and Packaging Issues

**Problem: `npm run dist` fails**
- Run `npm run build` first to compile the application
- Ensure `build-resources/icon.ico` exists
- Check that all required files are present in `electron/`, `bin/`, and `styles/`
- Verify Node.js version is >= 14.17

**Problem: Packaged app won't start**
- Check that all dependencies are listed in `package.json` dependencies (not devDependencies)
- Verify that `electron/main.js` has correct file paths
- Test with `npm run pack` first (unpacked version) to debug
- Check Windows Event Viewer for application errors

**Problem: Application icon not showing**
- Verify `build-resources/icon.ico` exists and is valid
- Ensure icon is referenced in `package.json` build configuration
- Rebuild the application with `npm run dist`
- Icon may take time to appear in Windows Explorer (refresh or restart Explorer)

**Problem: Installer fails to install**
- Run installer as Administrator
- Check available disk space
- Verify antivirus isn't blocking the installer
- Try installing to a different directory

### Runtime Issues

**Problem: Window state not persisting**
- Check that `electron-store` is installed
- Verify write permissions in user's AppData directory
- Try deleting stored state: `%APPDATA%/3d-animation-merger/config.json`

**Problem: Files won't load**
- Verify file format is correct (FBX for models, PNG/JPG for textures)
- Check file isn't corrupted
- Ensure file path doesn't contain special characters
- Try copying file to a simpler path (e.g., Desktop)

**Problem: Export fails**
- Verify you have write permissions to the target directory
- Check available disk space
- Ensure filename doesn't contain invalid characters: `< > : " / \ | ? *`
- Try exporting to a different location (e.g., Desktop)

**Problem: Textures appear white or incorrect**
- Verify texture files are valid PNG or JPG images
- Check that texture dimensions are power of 2 (e.g., 512, 1024, 2048)
- Ensure you're using the correct texture mode (Shaded vs PBR)
- For PBR mode, verify you're loading textures in the correct slots

**Problem: Animations don't play**
- Verify animation FBX files contain animation data
- Check that animation names don't conflict
- Ensure source model has the same skeleton as animation files
- Try loading animations one at a time to identify problematic files

### Performance Issues

**Problem: Application is slow or laggy**
- Reduce grid divisions in settings (lower = better performance)
- Use smaller texture sizes (1024x1024 or 512x512)
- Close other applications to free up memory
- Check that hardware acceleration is enabled

**Problem: Large files cause crashes**
- Break large FBX files into smaller pieces
- Reduce texture resolution before loading
- Close and restart the application between large operations
- Increase available system memory

### Getting Help

If you encounter issues not covered here:

1. Check the console output for error messages (View → Toggle Developer Tools in Electron)
2. Review the [Electron documentation](https://www.electronjs.org/docs)
3. Check the [Three.js documentation](https://threejs.org/docs/)
4. Search for similar issues in the project repository
5. Create a detailed bug report with:
   - Operating system and version
   - Node.js and npm versions
   - Steps to reproduce the issue
   - Error messages and console output
   - Screenshots if applicable

## Technology Stack

- **Electron** - Desktop application framework
- **Three.js** (v0.142.0) - 3D graphics library
- **esbuild** - Fast JavaScript bundler
- **electron-builder** - Application packaging tool
- **electron-store** - Persistent storage for settings
- **fast-check** - Property-based testing library
- **vitest** - Unit testing framework

## License

See project repository for license information.

[Node]:         https://nodejs.org/
[NPM]:          https://npmjs.com/
