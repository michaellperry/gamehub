/**
 * Repository implementation
 * 
 * This file exports the SQLite repository implementation.
 * The in-memory implementation is still available in the memory directory.
 */

// Export SQLite implementation
export * from './sqlite/index.js';

// Initialize with a sample GAP for testing
import { createSampleOpenAccessPath } from './sqlite/index.js';
createSampleOpenAccessPath();
