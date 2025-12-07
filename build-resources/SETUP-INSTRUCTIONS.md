# Icon Setup Instructions

## Overview

Task 11.2 has been completed with the following deliverables:

1. ✅ **Source Icon Created**: `icon.svg` - A professional 1024x1024 vector icon
2. ✅ **Icon Generator Script**: `generate-icons.js` - Automated icon generation
3. ✅ **Icon Reference in BrowserWindow**: Updated `electron/main.js` to use the icon
4. ✅ **Icon Reference in electron-builder**: Already configured in `package.json`

## Icon Design

The icon features:
- **3D Cube**: Represents 3D modeling and animation
- **Chartreuse Accent (#7FFF00)**: Matches the application's brand color
- **Play Button with Motion Lines**: Symbolizes animation playback and movement
- **Dark Background**: Consistent with the application's dark theme

## Next Steps: Generate Icon Files

Before building the application, you need to generate the required icon files:

### Option 1: Automated Script (Recommended)

```bash
# Install ImageMagick first (if not already installed)
# Windows: choco install imagemagick
# Or download from: https://imagemagick.org/script/download.php

# Run the icon generator
npm run generate-icons
```

This will automatically create:
- `icon.png` (1024x1024 PNG)
- `icon.ico` (Multi-resolution Windows ICO with sizes: 16, 32, 48, 64, 128, 256)

### Option 2: Manual Generation

If you don't have ImageMagick or prefer manual generation, see `README.md` in this directory for:
- Online tool recommendations
- Step-by-step instructions
- Alternative methods

## Verification

After generating the icons, verify:

```bash
# Check that files exist
dir build-resources\icon.png
dir build-resources\icon.ico
```

Both files should be present in the `build-resources` directory.

## Icon Usage

Once generated, the icons will be used for:

1. **Window Title Bar**: The icon appears in the application window's title bar
2. **Windows Taskbar**: The icon appears when the application is running
3. **Windows Explorer**: The icon appears for the .exe file
4. **Installation Wizard**: The icon appears during installation
5. **Desktop Shortcuts**: The icon appears on shortcuts created by the installer
6. **Start Menu**: The icon appears in the Windows Start Menu

## Testing the Icon

To test the icon in development mode:

```bash
npm start
```

The application window should display the icon in the title bar and taskbar.

## Building with the Icon

To create a distributable package with the icon:

```bash
# Create Windows executable
npm run dist

# Create Windows installer
npm run dist:installer
```

The packaged application will include the icon in all appropriate locations.

## Troubleshooting

### Icon not appearing in development
- Ensure `icon.ico` exists in `build-resources/`
- Restart the Electron application
- Check the console for any file loading errors

### Icon not appearing in built application
- Verify `icon.ico` is in `build-resources/` before building
- Check that `package.json` build config references the correct path
- Rebuild the application with `npm run dist`

### ImageMagick not found
- Ensure ImageMagick is installed and in your system PATH
- Try running `magick --version` in terminal to verify
- Restart your terminal/IDE after installing ImageMagick

## Custom Icon

If you want to use a different icon:

1. Replace `icon.svg` with your own 1024x1024 SVG file
2. Run `npm run generate-icons` to regenerate PNG and ICO files
3. Rebuild the application

Or directly replace `icon.png` and `icon.ico` with your own files (ensure proper dimensions and formats).
