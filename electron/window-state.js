import Store from 'electron-store';
import { screen } from 'electron';

/**
 * Default window dimensions
 */
const DEFAULT_WIDTH = 1280;
const DEFAULT_HEIGHT = 800;

// Default store instance
let defaultStore = null;

/**
 * Get or create the default store instance
 * @returns {Store} - The electron-store instance
 */
function getStore() {
  if (!defaultStore) {
    defaultStore = new Store({
      name: 'window-state',
      projectName: '3d-animation-merger'
    });
  }
  return defaultStore;
}

/**
 * Validate that window bounds are within screen boundaries
 * @param {Object} bounds - Window bounds {x, y, width, height}
 * @param {Object} [screenAPI] - Optional screen API for testing
 * @returns {boolean} - True if bounds are valid and on-screen
 */
function isOnScreen(bounds, screenAPI) {
  // Use provided screen API or default to Electron's screen
  const screenInstance = screenAPI || screen;
  
  // In test environment, screen might not be available
  if (!screenInstance || !screenInstance.getAllDisplays) {
    // Assume on-screen if we can't check (test environment)
    return true;
  }
  
  const displays = screenInstance.getAllDisplays();
  
  // Check if the window center point is within any display
  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;
  
  return displays.some(display => {
    const { x, y, width, height } = display.bounds;
    return (
      centerX >= x &&
      centerX < x + width &&
      centerY >= y &&
      centerY < y + height
    );
  });
}

/**
 * Restore window state from persistent storage
 * @param {Store} [storeInstance] - Optional store instance for testing
 * @param {Object} [screenAPI] - Optional screen API for testing
 * @returns {Object} - Window bounds and state {x, y, width, height, isMaximized}
 */
export function restoreWindowState(storeInstance, screenAPI) {
  const store = storeInstance || getStore();
  const savedState = store.get('windowState');
  
  // If no saved state exists, return defaults
  if (!savedState) {
    return {
      width: DEFAULT_WIDTH,
      height: DEFAULT_HEIGHT,
      isMaximized: false
    };
  }
  
  // Validate saved bounds
  const bounds = {
    x: savedState.x,
    y: savedState.y,
    width: savedState.width || DEFAULT_WIDTH,
    height: savedState.height || DEFAULT_HEIGHT
  };
  
  // Check if saved position is on-screen
  if (savedState.x !== undefined && savedState.y !== undefined) {
    if (!isOnScreen(bounds, screenAPI)) {
      // Position is off-screen, use defaults (centered)
      return {
        width: bounds.width,
        height: bounds.height,
        isMaximized: savedState.isMaximized || false
      };
    }
  }
  
  // Return validated state
  return {
    x: savedState.x,
    y: savedState.y,
    width: bounds.width,
    height: bounds.height,
    isMaximized: savedState.isMaximized || false
  };
}

/**
 * Save window state to persistent storage
 * @param {Object} bounds - Window bounds {x, y, width, height}
 * @param {boolean} isMaximized - Whether window is maximized
 * @param {Store} [storeInstance] - Optional store instance for testing
 */
export function saveWindowState(bounds, isMaximized, storeInstance) {
  const store = storeInstance || getStore();
  const state = {
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    isMaximized: isMaximized
  };
  
  store.set('windowState', state);
}
