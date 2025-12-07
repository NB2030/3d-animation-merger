# Build Resources

This directory contains resources used during the application build and packaging process.

## Icon Files

### Source Icon
- `icon.svg` - Vector source icon (1024x1024)

### Generated Icons (Required for Build)
- `icon.png` - Source application icon (1024x1024 PNG)
- `icon.ico` - Windows application icon (multi-resolution ICO)

## Converting Icons

To generate the required icon files from the SVG source:

### Method 1: Using ImageMagick (Recommended)
```bash
# Install ImageMagick if not already installed
# Windows: choco install imagemagick
# Or download from: https://imagemagick.org/script/download.php

# Convert SVG to PNG (1024x1024)
magick convert -background none -resize 1024x1024 icon.svg icon.png

# Convert PNG to ICO (multi-resolution: 16, 32, 48, 64, 128, 256)
magick convert icon.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico
```

### Method 2: Using Online Tools
1. **SVG to PNG**: Use https://svgtopng.com/ or https://cloudconvert.com/svg-to-png
   - Upload `icon.svg`
   - Set size to 1024x1024
   - Download as `icon.png`

2. **PNG to ICO**: Use https://convertio.co/png-ico/ or https://icoconvert.com/
   - Upload `icon.png`
   - Select multi-resolution ICO output
   - Download as `icon.ico`

### Method 3: Using electron-icon-builder (npm package)
```bash
npm install -g electron-icon-builder

# Generate all required icons
electron-icon-builder --input=./icon.svg --output=./
```

## Icon Design

The icon features:
- **3D Cube**: Represents 3D modeling and animation
- **Chartreuse Accent (#7FFF00)**: Matches the application's brand color
- **Play Button**: Symbolizes animation playback
- **Motion Lines**: Indicates animation and movement
- **Dark Background**: Consistent with the application's dark theme

The design is simple, recognizable at small sizes, and clearly communicates the application's purpose.
