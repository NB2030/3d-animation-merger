# Project Structure

## Directory Layout

```
├── bin/                    # Compiled output (generated)
├── build/                  # Build scripts (esbuild configuration)
├── scripts/                # Source JavaScript files
│   ├── main.js            # Main application entry point
│   └── GLTFExporter.js    # Custom GLTF exporter (modified from Three.js)
├── styles/                 # CSS stylesheets
│   ├── main.css           # Application styles
│   └── reset.css          # CSS normalization (normalize.css v8.0.1)
├── index.html             # Main HTML entry point
└── package.json           # Dependencies and scripts
```

## Code Organization

### Main Application (`scripts/main.js`)

Single `App` class that manages:
- Scene setup (renderer, camera, lights, controls)
- FBX loading and parsing
- Animation management
- UI updates
- GLB export

### Key Patterns

- **Class-based architecture** - Single App class with lifecycle methods
- **Event-driven UI** - File inputs and buttons trigger async operations
- **Three.js scene graph** - Objects organized in wrapper groups
- **Material processing** - Automatic conversion of non-PBR materials to PBR
- **Memory management** - Explicit disposal of geometries, materials, and textures

### Styling Conventions

- CSS custom properties for theming (e.g., `--aside-width`)
- BEM-like naming with modifiers (e.g., `.button.-primary`)
- Flexbox-based layout
- Dark theme with monospace font
- Normalize.css for cross-browser consistency

## File Handling

- Source model: Single FBX file
- Animations: Multiple FBX files
- Export: Single GLB file (binary GLTF)
- All file operations use FileReader API for client-side processing
