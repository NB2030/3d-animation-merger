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
- `OrbitControls` - Camera controls for orbit, pan, and zoom
- `TransformControls` - Interactive object manipulation (translate, rotate, scale)
- `RoomEnvironment` - Environment lighting setup
- `PMREMGenerator` - Environment map generation for PBR materials

## Three.js Features

### Rendering
- **WebGL Renderer** with shadow mapping (PCFSoftShadowMap)
- **Color Management** - sRGB output color space
- **Tone Mapping** - ACES Filmic tone mapping with 1.25 exposure
- **Fog** - Distance fog for depth perception
- **Shadows** - Directional light shadows with 1024x1024 shadow map

### Materials & Textures
- **PBR Materials** - MeshStandardMaterial with full PBR workflow
- **Material Conversion** - Automatic conversion from Phong/Lambert to Basic/Standard
- **Texture Color Spaces**:
  - sRGB for color maps (albedo, emissive)
  - Linear for data maps (normal, metallic, roughness, AO)
- **Packed Textures** - ORM format support (single texture for AO, Roughness, Metallic)
- **Texture Disposal** - Proper cleanup to prevent memory leaks

### Scene Setup
- **Lighting**:
  - Ambient light (0.6 intensity)
  - Hemisphere light (sky/ground)
  - Directional light with shadows (1.2 intensity)
- **Grid Helper** - Customizable size, divisions, and color
- **Axes Helper** - Visual reference for coordinate system
- **Environment Map** - IBL from RoomEnvironment

### Animation
- **AnimationMixer** - Playback of multiple animation clips
- **Animation Cloning** - For "in place" processing
- **Root Motion Removal** - Optional removal of X/Z position tracks

## Browser APIs

- **FileReader API** - Loading local FBX and texture files
- **Canvas API** - Texture processing and rendering
- **Blob API** - GLB file export and download
- **Image API** - Texture loading and validation
- **requestAnimationFrame** - Smooth animation loop
