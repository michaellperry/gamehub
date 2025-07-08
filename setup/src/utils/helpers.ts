import fs from 'fs-extra';
import path from 'path';
import { logger } from './logger';

/**
 * Ensures a directory exists, creating it if necessary
 * @param dirPath Directory path
 */
export function ensureDirectoryExists(dirPath: string): void {
  try {
    if (!fs.existsSync(dirPath)) {
      logger.debug(`Creating directory: ${dirPath}`);
      fs.mkdirSync(dirPath, { recursive: true });
    }
  } catch (error) {
    logger.error(`Failed to create directory: ${dirPath}`, { error });
    throw new Error(`Failed to create directory: ${dirPath}`);
  }
}

/**
 * Writes JSON content to a file
 * @param filePath File path
 * @param content JSON content
 * @param overwrite Whether to overwrite existing file
 */
export function writeJsonFile(filePath: string, content: any, overwrite = false): void {
  try {
    const absolutePath = path.resolve(process.cwd(), filePath);
    
    // Check if file exists
    if (fs.existsSync(absolutePath) && !overwrite) {
      logger.warn(`File already exists: ${filePath}. Use overwrite=true to replace it.`);
      return;
    }
    
    // Ensure directory exists
    ensureDirectoryExists(path.dirname(absolutePath));
    
    // Write JSON with pretty formatting
    logger.debug(`Writing JSON file: ${filePath}`);
    fs.writeFileSync(absolutePath, JSON.stringify(content, null, 2));
    logger.info(`Successfully wrote file: ${filePath}`);
  } catch (error) {
    logger.error(`Failed to write JSON file: ${filePath}`, { error });
    throw new Error(`Failed to write to ${filePath}: ${(error as Error).message}`);
  }
}

/**
 * Writes text content to a file
 * @param filePath File path
 * @param content Text content
 * @param overwrite Whether to overwrite existing file
 */
export function writeFile(filePath: string, content: string, overwrite = false): void {
  try {
    const absolutePath = path.resolve(process.cwd(), filePath);
    
    // Check if file exists
    if (fs.existsSync(absolutePath) && !overwrite) {
      logger.warn(`File already exists: ${filePath}. Use overwrite=true to replace it.`);
      return;
    }
    
    // Ensure directory exists
    ensureDirectoryExists(path.dirname(absolutePath));
    
    // Write text
    logger.debug(`Writing file: ${filePath}`);
    fs.writeFileSync(absolutePath, content);
    logger.info(`Successfully wrote file: ${filePath}`);
  } catch (error) {
    logger.error(`Failed to write file: ${filePath}`, { error });
    throw new Error(`Failed to write to ${filePath}: ${(error as Error).message}`);
  }
}

/**
 * JSON encodes a PEM key for use in provider files
 * @param pemKey PEM format public key
 * @returns JSON-encoded key
 */
export function jsonEncodeKey(pemKey: string): string {
  // Replace newlines with \r\n and escape quotes
  return pemKey
    .replace(/\r?\n/g, '\\r\\n')
    .replace(/"/g, '\\"');
}

/**
 * Checks if a file exists
 * @param filePath File path
 * @returns True if file exists
 */
export function fileExists(filePath: string): boolean {
  try {
    return fs.existsSync(path.resolve(process.cwd(), filePath));
  } catch (error) {
    logger.error(`Error checking if file exists: ${filePath}`, { error });
    return false;
  }
}

/**
 * Reads a file as text
 * @param filePath File path
 * @returns File content as string
 */
export function readFile(filePath: string): string {
  try {
    const absolutePath = path.resolve(process.cwd(), filePath);
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`File does not exist: ${filePath}`);
    }
    return fs.readFileSync(absolutePath, 'utf8');
  } catch (error) {
    logger.error(`Failed to read file: ${filePath}`, { error });
    throw new Error(`Failed to read ${filePath}: ${(error as Error).message}`);
  }
}

/**
 * Reads a JSON file
 * @param filePath File path
 * @returns Parsed JSON content
 */
export function readJsonFile<T>(filePath: string): T {
  try {
    const content = readFile(filePath);
    return JSON.parse(content) as T;
  } catch (error) {
    logger.error(`Failed to parse JSON file: ${filePath}`, { error });
    throw new Error(`Failed to parse JSON from ${filePath}: ${(error as Error).message}`);
  }
}