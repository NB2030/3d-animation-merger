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
- Texture management (Shaded and PBR modes)
- Transform controls (translate, rotate, scale)
- Settings modal (background, grid customization)
- UI updates
- GLB export

### Key Methods

**Initialization:**
- `init()` - Initialize renderer, scene, and loaders
- `initRenderer()` - Setup WebGL renderer with shadows and tone mapping
- `initScene()` - Create scene with lights, camera, grid, and controls
- `initLoaders()` - Initialize FBX loader

**File Handling:**
- `onSourceChange()` - Load source FBX model
- `onAnimationChange()` - Load and merge animation FBX files

**Texture Management:**
- `onTabChange()` - Switch between General and Textures tabs
- `onTextureTypeChange()` - Toggle between Shaded and PBR modes
- `onTextureChange()` - Load simple UV texture (Shaded mode)
- `onPBRTextureChange()` - Load individual PBR texture maps
- `onPackedTextureChange()` - Load packed ORM texture
- `onPackedModeToggle()` - Toggle between packed and separate PBR textures
- `applyTextureToModel()` - Apply shaded texture to all materials
- `applyPBRTexturesToModel()` - Apply PBR textures with proper setup
- `fixNonPBRMaterials()` - Convert non-PBR materials to compatible format

**Transform & Controls:**
- `onTransformModeClick()` - Switch transform control modes
- `render()` - Animation loop with controls update

**Settings:**
- `openSettings()` / `closeSettings()` - Toggle settings modal
- `onBgColorChange()` / `resetBgColor()` - Background color control
- `onGridColorChange()` / `resetGridColor()` - Grid color control
- `onGridSizeChange()` / `resetGridSize()` - Grid size control
- `onGridDivisionsChange()` / `resetGridDivisions()` - Grid divisions control
- `updateGrid()` - Recreate grid with new parameters

**Animation & Export:**
- `updateUI()` - Render animation list with rename and delete buttons
- `makeAnimationsInPlace()` - Remove root motion from animations
- `exportGLB()` - Export model with animations to GLB format

**Cleanup:**
- `disposeObject()` - Properly dispose geometries, materials, and textures
- `destroy()` - Cleanup event listeners and animation frame

### Key Patterns

- **Class-based architecture** - Single App class with lifecycle methods
- **Event-driven UI** - File inputs and buttons trigger async operations
- **Three.js scene graph** - Objects organized in wrapper groups
- **Material processing** - Automatic conversion of non-PBR materials to PBR
- **Memory management** - Explicit disposal of geometries, materials, and textures
- **Modal pattern** - Settings modal with backdrop click to close
- **Tab navigation** - Separate UI sections for different functionality

### Styling Conventions

- CSS custom properties for theming (e.g., `--aside-width`)
- BEM-like naming with modifiers (e.g., `.button.-primary`)
- Flexbox-based layout
- Dark theme with monospace font (#2a2a35 background, #969fbf text)
- Chartreuse accent color (#7FFF00) for active states
- Normalize.css for cross-browser consistency
- Custom scrollbar styling for animation list
- Hover and active states for interactive elements
- SVG icons with currentColor for theme consistency

### UI Components

**Tabs:**
- `.tabs-nav` - Tab navigation bar
- `.tab-btn` - Individual tab button with active state
- `.tab-content` - Tab panel content

**Transform Toolbar:**
- `.transform-toolbar` - Floating toolbar in viewer
- `.transform-btn` - Transform mode buttons with SVG icons

**Texture Controls:**
- `.texture-type-selector` - Shaded/PBR mode switcher
- `.texture-section` - Grouped texture inputs
- `.pbr-mode-selector` - Packed texture toggle
- `#packed-texture-section` - Highlighted packed texture input
- `#separate-textures-section` - Separate PBR texture inputs

**Settings Modal:**
- `.settings-modal` - Full-screen modal overlay
- `.settings-modal-content` - Modal dialog box
- `.settings-item` - Individual setting control
- `.color-picker-group` - Color input with reset button
- `.slider-group` - Range slider with value display and reset

**Animation List:**
- `.animation-item` - Animation row with input and delete button
- `.delete-animation-btn` - Red × button for deletion
- Custom scrollbar with chartreuse thumb

## File Handling

- Source model: Single FBX file
- Animations: Multiple FBX files
- Textures: PNG/JPG images (Shaded or PBR maps)
- Export: Single GLB file (binary GLTF)
- All file operations use FileReader API for client-side processing
