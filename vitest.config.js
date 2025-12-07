import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 30000,
    hookTimeout: 30000,
    // Run tests serially to avoid Electron conflicts
    threads: false,
    // Electron-specific settings
    setupFiles: [],
  },
});
