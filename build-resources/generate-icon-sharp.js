#!/usr/bin/env node

/**
 * Icon Generator using Sharp
 * Converts SVG to PNG and ICO formats
 */

import sharp from 'sharp';
import { writeFileSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SVG_FILE = join(__dirname, 'icon.svg');
const PNG_FILE = join(__dirname, 'icon.png');
const ICO_FILE = join(__dirname, 'icon.ico');

console.log('3D Animation Merger - Icon Generator (Sharp)');
console.log('=============================================\n');

async function generateIcons() {
  try {
    // Read SVG
    const svgBuffer = readFileSync(SVG_FILE);
    
    // Generate 1024x1024 PNG
    console.log('Generating icon.png (1024x1024)...');
    await sharp(svgBuffer)
      .resize(1024, 1024)
      .png()
      .toFile(PNG_FILE);
    console.log('✓ icon.png generated successfully');
    
    // Generate ICO file with multiple sizes
    console.log('Generating icon.ico (multi-resolution)...');
    
    // Create multiple sizes for ICO
    const sizes = [16, 32, 48, 64, 128, 256];
    const iconBuffers = [];
    
    for (const size of sizes) {
      const buffer = await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toBuffer();
      iconBuffers.push(buffer);
    }
    
    // Create ICO file structure
    // ICO format: Header (6 bytes) + Directory entries (16 bytes each) + Image data
    const numImages = iconBuffers.length;
    const headerSize = 6;
    const dirEntrySize = 16;
    const dirSize = numImages * dirEntrySize;
    
    // Calculate total size
    let totalSize = headerSize + dirSize;
    const imageSizes = iconBuffers.map(buf => buf.length);
    imageSizes.forEach(size => totalSize += size);
    
    const icoBuffer = Buffer.alloc(totalSize);
    let offset = 0;
    
    // Write ICO header
    icoBuffer.writeUInt16LE(0, offset); // Reserved (must be 0)
    offset += 2;
    icoBuffer.writeUInt16LE(1, offset); // Type (1 = ICO)
    offset += 2;
    icoBuffer.writeUInt16LE(numImages, offset); // Number of images
    offset += 2;
    
    // Write directory entries
    let imageOffset = headerSize + dirSize;
    for (let i = 0; i < numImages; i++) {
      const size = sizes[i];
      const imageSize = imageSizes[i];
      
      icoBuffer.writeUInt8(size === 256 ? 0 : size, offset); // Width (0 means 256)
      offset += 1;
      icoBuffer.writeUInt8(size === 256 ? 0 : size, offset); // Height (0 means 256)
      offset += 1;
      icoBuffer.writeUInt8(0, offset); // Color palette (0 = no palette)
      offset += 1;
      icoBuffer.writeUInt8(0, offset); // Reserved
      offset += 1;
      icoBuffer.writeUInt16LE(1, offset); // Color planes
      offset += 2;
      icoBuffer.writeUInt16LE(32, offset); // Bits per pixel
      offset += 2;
      icoBuffer.writeUInt32LE(imageSize, offset); // Image size in bytes
      offset += 4;
      icoBuffer.writeUInt32LE(imageOffset, offset); // Image offset
      offset += 4;
      
      imageOffset += imageSize;
    }
    
    // Write image data
    for (const buffer of iconBuffers) {
      buffer.copy(icoBuffer, offset);
      offset += buffer.length;
    }
    
    writeFileSync(ICO_FILE, icoBuffer);
    console.log('✓ icon.ico generated successfully');
    
    console.log('\n✓ All icon files generated successfully!');
    console.log('\nGenerated files:');
    console.log(`  - ${PNG_FILE}`);
    console.log(`  - ${ICO_FILE}`);
    console.log('\nYou can now build the Electron application.');
    
  } catch (error) {
    console.error('\n❌ Error generating icons:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

generateIcons();
