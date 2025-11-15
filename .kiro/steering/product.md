# Product Overview

3D Animation Merger is a browser-based tool for merging 3D animations from multiple FBX files into a single GLB file. Users can load a source FBX model, add multiple animation FBX files, apply textures, preview animations in a 3D viewer, and export the combined result as a GLB file.

## Key Features

### Model & Animation Management
- Load FBX models with animations
- Merge animations from multiple FBX files onto a single model
- Rename animations via inline editing
- Delete individual animations with delete button
- Preview animations by focusing on animation name input
- Auto-set export filename from source model name

### Texture System
- **Tabbed Interface** - Separate tabs for General and Textures
- **Shaded Mode** - Simple UV texture mapping for basic materials
- **PBR Mode** - Full physically-based rendering support with:
  - Base Color (Albedo) map
  - Normal map
  - Metallic map
  - Roughness map
  - Ambient Occlusion (AO) map
  - Emissive map
  - **Packed Texture Support** - ORM format (R=AO, G=Roughness, B=Metallic)
- Automatic material conversion from non-PBR to PBR materials
- Proper color space handling (sRGB for color maps, Linear for data maps)

### 3D Viewer Controls
- **Orbit Controls** - Camera rotation and zoom
- **Transform Controls** - Interactive object manipulation with 4 modes:
  - Select (hide gizmo)
  - Translate (move)
  - Rotate
  - Scale
- Visual toolbar with SVG icons for transform modes

### Scene Customization (Settings Modal)
- **Background Color** - Customizable scene background
- **Grid Settings**:
  - Grid color customization
  - Grid size adjustment (5-50 units)
  - Grid divisions adjustment (5-50)
  - Reset buttons for all settings

### Export Options
- Custom filename input for GLB export
- "In Place" option to remove root motion from animations
- Export combined model with all animations and textures as GLB format
