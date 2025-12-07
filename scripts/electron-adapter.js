/**
 * Electron Adapter Module
 * 
 * Provides seamless integration between browser-based file operations
 * and Electron's native file system APIs. This module detects the Electron
 * environment and adapts file inputs, file reading, and file writing to use
 * native dialogs and Node.js file system operations when available.
 * 
 * Falls back gracefully to browser behavior when not running in Electron.
 */

/**
 * Detects if the application is running in an Electron environment
 * @returns {boolean} True if running in Electron, false otherwise
 */
export function isElectron() {
    // Check if window.electronAPI is available (exposed via preload script)
    return typeof window !== 'undefined' && 
           window.electronAPI !== undefined &&
           typeof window.electronAPI === 'object';
}

/**
 * Sets up a file input element to use Electron's native file dialog
 * instead of the browser's default file picker.
 * 
 * @param {HTMLInputElement} inputElement - The file input element to adapt
 * @param {Object} options - Dialog configuration options
 * @param {Array<{name: string, extensions: string[]}>} options.filters - File type filters
 * @param {Array<string>} options.properties - Dialog properties (e.g., ['openFile', 'multiSelections'])
 * @param {string} [options.title] - Dialog title
 * @returns {void}
 */
export function setupFileInputAdapter(inputElement, options = {}) {
    if (!isElectron() || !inputElement) {
        return; // Fall back to browser behavior
    }

    try {
        console.log('Setting up Electron file input adapter for:', inputElement.id || inputElement.name);
        
        // Intercept click events on the input element
        const clickHandler = async (e) => {
            console.log('Electron file dialog triggered for:', inputElement.id || inputElement.name);
            
            // Prevent default file picker
            e.preventDefault();
            e.stopPropagation();

            // Find the label element
            const label = inputElement.closest('label');

            try {
                // Add loading state to label
                if (label) {
                    label.classList.add('loading');
                    console.log('Loading state added to label');
                }

                // Open Electron file dialog
                console.log('Opening Electron file dialog with options:', options);
                const result = await window.electronAPI.openFileDialog({
                    title: options.title || 'Select File',
                    filters: options.filters || [],
                    properties: options.properties || ['openFile']
                });
                
                console.log('Dialog result:', result);

                // Handle dialog cancellation
                if (!result || result.canceled || !result.filePaths || result.filePaths.length === 0) {
                    // Remove loading state on cancellation
                    if (label) {
                        label.classList.remove('loading');
                    }
                    return;
                }

                // Read the selected files
                const filePaths = result.filePaths;
                const fileDataArray = [];

                for (const filePath of filePaths) {
                    try {
                        const fileData = await window.electronAPI.readFile(filePath);
                        
                        if (fileData && fileData.success && fileData.data) {
                            // Extract filename from path
                            const filename = filePath.split(/[\\/]/).pop();
                            
                            // Convert Buffer to ArrayBuffer
                            // fileData.data is a Uint8Array from IPC, we need to get its underlying ArrayBuffer
                            let arrayBuffer;
                            if (fileData.data instanceof ArrayBuffer) {
                                arrayBuffer = fileData.data;
                            } else if (fileData.data.buffer instanceof ArrayBuffer) {
                                // If it's a typed array (like Uint8Array), get its buffer
                                arrayBuffer = fileData.data.buffer.slice(
                                    fileData.data.byteOffset,
                                    fileData.data.byteOffset + fileData.data.byteLength
                                );
                            } else {
                                // Fallback: create new ArrayBuffer from data
                                const uint8Array = new Uint8Array(fileData.data);
                                arrayBuffer = uint8Array.buffer;
                            }
                            
                            console.log('File loaded:', filename, 'Size:', arrayBuffer.byteLength, 'bytes');
                            
                            // Create a File-like object with the data
                            const fileObject = {
                                name: filename,
                                path: filePath,
                                data: arrayBuffer,
                                // Add methods to mimic File API
                                arrayBuffer: async () => arrayBuffer,
                                text: async () => new TextDecoder().decode(arrayBuffer)
                            };
                            
                            fileDataArray.push(fileObject);
                        } else {
                            console.error('Failed to read file:', filePath, fileData?.error);
                        }
                    } catch (readError) {
                        console.error('Error reading file:', filePath, readError);
                    }
                }

                if (fileDataArray.length === 0) {
                    // Remove loading state if no files were loaded
                    if (label) {
                        label.classList.remove('loading');
                    }
                    return;
                }

                // Create a synthetic FileList-like object
                const fileList = {
                    length: fileDataArray.length,
                    item: (index) => fileDataArray[index] || null,
                    [Symbol.iterator]: function* () {
                        for (let i = 0; i < fileDataArray.length; i++) {
                            yield fileDataArray[i];
                        }
                    }
                };

                // Add array-like indexing
                for (let i = 0; i < fileDataArray.length; i++) {
                    fileList[i] = fileDataArray[i];
                }

                // Update the input element's files property (for compatibility)
                Object.defineProperty(inputElement, 'files', {
                    value: fileList,
                    writable: false,
                    configurable: true
                });

                // Trigger the change event with the file data
                const changeEvent = new Event('change', { bubbles: true });
                inputElement.dispatchEvent(changeEvent);

                // Note: Loading state will be removed by the change event handler (onSourceChange, etc.)

            } catch (error) {
                console.error('Error in Electron file dialog:', error);
                
                // Remove loading state on error
                if (label) {
                    label.classList.remove('loading');
                }
            }
        };

        // Add click handler to input
        inputElement.addEventListener('click', clickHandler);
        
        // Also add to label if it exists (for better UX)
        const label = inputElement.closest('label');
        if (label) {
            label.addEventListener('click', (e) => {
                // Only handle if clicking on label itself, not the input
                if (e.target === label || e.target.tagName === 'SPAN') {
                    clickHandler(e);
                }
            });
        }

    } catch (error) {
        console.error('Error setting up file input adapter:', error);
        // Silently fail and use browser behavior
    }
}

/**
 * Adapts file reading to use Electron's IPC instead of FileReader API.
 * This function replaces the browser's FileReader with Electron's file reading.
 * 
 * @param {Object} file - File object (can be from adapted file input or browser File)
 * @returns {Promise<ArrayBuffer>} Promise that resolves with the file contents as ArrayBuffer
 */
export async function adaptFileReading(file) {
    if (!isElectron()) {
        // Fall back to FileReader for browser
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('FileReader error'));
            reader.readAsArrayBuffer(file);
        });
    }

    try {
        // If file has a path property (from Electron dialog), use it
        if (file.path) {
            const result = await window.electronAPI.readFile(file.path);
            
            if (result && result.success && result.data) {
                return result.data;
            } else {
                throw new Error(result?.error || 'Failed to read file');
            }
        }
        
        // If file already has data property (from our adapter), return it
        if (file.data) {
            return file.data;
        }

        // Fall back to FileReader if no path available
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('FileReader error'));
            reader.readAsArrayBuffer(file);
        });

    } catch (error) {
        console.error('Error in adaptFileReading:', error);
        
        // Fall back to FileReader on error
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('FileReader error'));
            reader.readAsArrayBuffer(file);
        });
    }
}

/**
 * Adapts file writing to use Electron's save dialog and file system
 * instead of browser's Blob download mechanism.
 * 
 * @param {Blob} blob - The Blob containing the data to save
 * @param {string} filename - Suggested filename for the save dialog
 * @param {Object} [options] - Additional options
 * @param {Array<{name: string, extensions: string[]}>} [options.filters] - File type filters
 * @returns {Promise<boolean>} Promise that resolves to true if save succeeded, false otherwise
 */
export async function adaptFileWriting(blob, filename, options = {}) {
    if (!isElectron()) {
        // Fall back to browser download
        const link = document.createElement('a');
        link.style.display = 'none';
        document.body.appendChild(link);
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        
        // Cleanup
        setTimeout(() => {
            URL.revokeObjectURL(link.href);
            link.remove();
        }, 100);
        
        return true;
    }

    try {
        // Open Electron save dialog
        const result = await window.electronAPI.saveFileDialog({
            title: 'Save File',
            defaultPath: filename,
            filters: options.filters || [
                { name: 'All Files', extensions: ['*'] }
            ]
        });

        // Handle dialog cancellation
        if (!result || result.canceled || !result.filePath) {
            console.log('Save dialog cancelled');
            return false;
        }

        // Convert Blob to ArrayBuffer
        const arrayBuffer = await blob.arrayBuffer();
        
        // Convert ArrayBuffer to Buffer (Node.js Buffer)
        const buffer = new Uint8Array(arrayBuffer);

        // Write file via Electron IPC
        const writeResult = await window.electronAPI.writeFile(result.filePath, buffer);

        if (writeResult && writeResult.success) {
            console.log('File saved successfully:', result.filePath);
            return true;
        } else {
            console.error('Failed to save file:', writeResult?.error);
            return false;
        }

    } catch (error) {
        console.error('Error in adaptFileWriting:', error);
        
        // Fall back to browser download on error
        try {
            const link = document.createElement('a');
            link.style.display = 'none';
            document.body.appendChild(link);
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            link.click();
            
            // Cleanup
            setTimeout(() => {
                URL.revokeObjectURL(link.href);
                link.remove();
            }, 100);
            
            return true;
        } catch (fallbackError) {
            console.error('Fallback download also failed:', fallbackError);
            return false;
        }
    }
}

/**
 * Initializes all Electron adapters for the application.
 * This is a convenience function that should be called during app initialization
 * if running in Electron environment.
 * 
 * @returns {Object} Object containing adapter functions and state
 */
export function initializeElectronAdapters() {
    if (!isElectron()) {
        console.log('Not running in Electron, adapters not initialized');
        return {
            isElectron: false,
            setupFileInputAdapter: () => {},
            adaptFileReading: (file) => new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = (e) => reject(new Error('FileReader error'));
                reader.readAsArrayBuffer(file);
            }),
            adaptFileWriting: (blob, filename) => {
                const link = document.createElement('a');
                link.style.display = 'none';
                document.body.appendChild(link);
                link.href = URL.createObjectURL(blob);
                link.download = filename;
                link.click();
                setTimeout(() => {
                    URL.revokeObjectURL(link.href);
                    link.remove();
                }, 100);
                return Promise.resolve(true);
            }
        };
    }

    console.log('Electron environment detected, adapters initialized');
    
    // Set up error listener for file operations
    if (window.electronAPI.onFileError) {
        window.electronAPI.onFileError((event, error) => {
            console.error('File operation error from main process:', error);
            // You can show a user-friendly error dialog here
        });
    }

    return {
        isElectron: true,
        setupFileInputAdapter,
        adaptFileReading,
        adaptFileWriting
    };
}

// Export all functions as default object as well
export default {
    isElectron,
    setupFileInputAdapter,
    adaptFileReading,
    adaptFileWriting,
    initializeElectronAdapters
};
