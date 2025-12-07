#!/usr/bin/env node

/**
 * Icon Generation Script
 * 
 * This script helps generate the required icon files (icon.png and icon.ico)
 * from the source icon.svg file.
 * 
 * Prerequisites:
 * - ImageMagick must be installed on your system
 * - Windows: choco install imagemagick OR download from https://imagemagick.org
 * 
 * Usage:
 * node generate-icons.js
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SVG_FILE = join(__dirname, 'icon.svg');
const PNG_FILE = join(__dirname, 'icon.png');
const ICO_FILE = join(__dirname, 'icon.ico');
const ICNS_FILE = join(__dirname, 'icon.icns');
const ICONS_DIR = join(__dirname, 'icons');

async function checkImageMagick() {
  try {
    await execAsync('magick --version');
    return true;
  } catch (error) {
    return false;
  }
}

async function generatePNG() {
  console.log('Generating icon.png (1024x1024)...');
  const command = `magick convert -background none -resize 1024x1024 "${SVG_FILE}" "${PNG_FILE}"`;
  await execAsync(command);
  console.log('✓ icon.png generated successfully');
}

async function generateICO() {
  console.log('Generating icon.ico (multi-resolution)...');
  const command = `magick convert "${PNG_FILE}" -define icon:auto-resize=256,128,64,48,32,16 "${ICO_FILE}"`;
  await execAsync(command);
  console.log('✓ icon.ico generated successfully');
}

async function generateICNS() {
  console.log('Generating icon.icns (macOS)...');
  // Note: ImageMagick can create icns on macOS, but may need additional tools on other platforms
  try {
    const command = `magick convert "${PNG_FILE}" -resize 1024x1024 "${ICNS_FILE}"`;
    await execAsync(command);
    console.log('✓ icon.icns generated successfully');
  } catch (error) {
    console.log('⚠ icon.icns generation skipped (requires macOS or additional tools)');
    console.log('  For macOS builds, generate icns on a Mac using iconutil');
  }
}

async function generateLinuxIcons() {
  console.log('Generating Linux icon set...');
  const { mkdirSync, existsSync: fsExistsSync } = await import('fs');
  
  // Create icons directory if it doesn't exist
  if (!fsExistsSync(ICONS_DIR)) {
    mkdirSync(ICONS_DIR, { recursive: true });
  }
  
  // Generate icons at various sizes for Linux
  const sizes = [16, 24, 32, 48, 64, 128, 256, 512];
  
  for (const size of sizes) {
    const outputFile = join(ICONS_DIR, `${size}x${size}.png`);
    const command = `magick convert "${PNG_FILE}" -resize ${size}x${size} "${outputFile}"`;
    await execAsync(command);
  }
  
  console.log('✓ Linux icons generated successfully');
}

async function main() {
  console.log('3D Animation Merger - Icon Generator');
  console.log('====================================\n');

  // Check if SVG source exists
  if (!existsSync(SVG_FILE)) {
    console.error('❌ Error: icon.svg not found in build-resources directory');
    process.exit(1);
  }

  // Check if ImageMagick is installed
  console.log('Checking for ImageMagick...');
  const hasImageMagick = await checkImageMagick();
  
  if (!hasImageMagick) {
    console.error('❌ Error: ImageMagick is not installed or not in PATH');
    console.error('\nPlease install ImageMagick:');
    console.error('  Windows: choco install imagemagick');
    console.error('  Or download from: https://imagemagick.org/script/download.php');
    console.error('\nAlternatively, use online tools (see README.md for instructions)');
    process.exit(1);
  }
  console.log('✓ ImageMagick found\n');

  try {
    // Generate PNG
    await generatePNG();
    
    // Generate ICO (Windows)
    await generateICO();
    
    // Generate ICNS (macOS)
    await generateICNS();
    
    // Generate Linux icons
    await generateLinuxIcons();
    
    console.log('\n✓ All icon files generated successfully!');
    console.log('\nGenerated files:');
    console.log(`  - ${PNG_FILE} (source)`);
    console.log(`  - ${ICO_FILE} (Windows)`);
    console.log(`  - ${ICNS_FILE} (macOS)`);
    console.log(`  - ${ICONS_DIR}/ (Linux)`);
    console.log('\nYou can now build the Electron application for all platforms.');
    
  } catch (error) {
    console.error('\n❌ Error generating icons:', error.message);
    console.error('\nIf ImageMagick commands fail, try using online tools instead.');
    console.error('See README.md for alternative methods.');
    process.exit(1);
  }
}

main();
