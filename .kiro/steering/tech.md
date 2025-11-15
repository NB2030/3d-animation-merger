# Technology Stack

## Core Technologies

- **Three.js** (v0.142.0) - 3D graphics library
- **ES Modules** - Native JavaScript modules
- **esbuild** - Build tool for bundling
- **browser-sync** - Development server with live reload

## Build System

The project uses esbuild for fast bundling with custom build scripts.

### Common Commands

```sh
# Development mode - watch files and auto-reload
npm start

# Production build - compile and minify
npm run build
```

### Build Configuration

- Entry point: `scripts/main.js`
- Output: `bin/main.js`
- Build scripts located in `build/` directory
- Uses Node.js with `--experimental-json-modules` flag

## Three.js Modules Used

- `FBXLoader` - Loading FBX files
- `GLTFExporter` - Exporting to GLTF/GLB format (custom version)
- `OrbitControls` - Camera controls
- `TransformControls` - Object manipulation
- `RoomEnvironment` - Environment lighting
- `PMREMGenerator` - Environment map generation

## Browser APIs

- FileReader API for loading local files
- Canvas API for texture processing
- Blob API for file export
