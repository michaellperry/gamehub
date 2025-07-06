#!/usr/bin/env node

/**
 * Dependency Validation Script
 * 
 * This script validates that workspace dependencies are properly synchronized
 * and that common dependencies are managed at the root level.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Common dependencies that should be managed at root level
const COMMON_DEPENDENCIES = [
  'better-sqlite3',
  'cors',
  'dotenv',
  'express',
  'jsonwebtoken',
  'uuid'
];

const COMMON_DEV_DEPENDENCIES = [
  '@types/better-sqlite3',
  '@types/cors',
  '@types/express',
  '@types/jsonwebtoken',
  '@types/uuid'
];

// Service-specific dependencies that are allowed in workspace packages
const ALLOWED_SERVICE_DEPENDENCIES = {
  'player-ip': [
    'gamehub-model',
    'jinaga',
    'cookie-parser',
    'fs-extra'
  ],
  'service-ip': [
    'cookie-parser',
    'fs-extra'
  ],
  'gamehub-model': [
    'jinaga'
  ],
  'gamehub-admin': [
    // React app dependencies
    'react',
    'react-dom',
    'react-router-dom',
    '@vitejs/plugin-react'
  ]
};

const ALLOWED_SERVICE_DEV_DEPENDENCIES = {
  'player-ip': [
    '@types/cookie-parser',
    '@types/fs-extra',
    '@types/supertest',
    'c8',
    'eslint',
    '@typescript-eslint/eslint-plugin',
    '@typescript-eslint/parser',
    'supertest'
  ],
  'service-ip': [
    '@types/cookie-parser',
    '@types/fs-extra'
  ],
  'gamehub-model': [],
  'gamehub-admin': [
    '@types/react',
    '@types/react-dom',
    '@vitejs/plugin-react',
    'vite'
  ]
};

function readPackageJson(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return null;
  }
}

function validateRootDependencies() {
  console.log('🔍 Validating root dependencies...');
  
  const rootPackagePath = path.join(__dirname, '../app/package.json');
  const rootPackage = readPackageJson(rootPackagePath);
  
  if (!rootPackage) {
    console.error('❌ Could not read root package.json');
    return false;
  }
  
  const rootDeps = Object.keys(rootPackage.dependencies || {});
  const rootDevDeps = Object.keys(rootPackage.devDependencies || {});
  
  let isValid = true;
  
  // Check that all common dependencies are present in root
  for (const dep of COMMON_DEPENDENCIES) {
    if (!rootDeps.includes(dep)) {
      console.error(`❌ Missing common dependency in root: ${dep}`);
      isValid = false;
    }
  }
  
  for (const dep of COMMON_DEV_DEPENDENCIES) {
    if (!rootDevDeps.includes(dep)) {
      console.error(`❌ Missing common dev dependency in root: ${dep}`);
      isValid = false;
    }
  }
  
  if (isValid) {
    console.log('✅ Root dependencies are properly configured');
  }
  
  return isValid;
}

function validateWorkspaceDependencies() {
  console.log('🔍 Validating workspace dependencies...');
  
  const appDir = path.join(__dirname, '../app');
  const workspaces = ['player-ip', 'service-ip', 'gamehub-model', 'gamehub-admin'];
  
  let isValid = true;
  
  for (const workspace of workspaces) {
    const packagePath = path.join(appDir, workspace, 'package.json');
    
    if (!fs.existsSync(packagePath)) {
      console.warn(`⚠️  Workspace package.json not found: ${workspace}`);
      continue;
    }
    
    const pkg = readPackageJson(packagePath);
    if (!pkg) continue;
    
    console.log(`\n📦 Validating ${workspace}...`);
    
    const deps = Object.keys(pkg.dependencies || {});
    const devDeps = Object.keys(pkg.devDependencies || {});
    
    const allowedDeps = ALLOWED_SERVICE_DEPENDENCIES[workspace] || [];
    const allowedDevDeps = ALLOWED_SERVICE_DEV_DEPENDENCIES[workspace] || [];
    
    // Check for common dependencies that should be in root
    for (const dep of deps) {
      if (COMMON_DEPENDENCIES.includes(dep)) {
        console.error(`❌ ${workspace}: Common dependency should be in root: ${dep}`);
        isValid = false;
      } else if (!allowedDeps.includes(dep)) {
        console.warn(`⚠️  ${workspace}: Unexpected dependency: ${dep}`);
      }
    }
    
    // Check for common dev dependencies that should be in root
    for (const dep of devDeps) {
      if (COMMON_DEV_DEPENDENCIES.includes(dep)) {
        console.error(`❌ ${workspace}: Common dev dependency should be in root: ${dep}`);
        isValid = false;
      } else if (!allowedDevDeps.includes(dep) && !['@types/node', 'nodemon', 'ts-node', 'typescript', 'rimraf'].includes(dep)) {
        console.warn(`⚠️  ${workspace}: Unexpected dev dependency: ${dep}`);
      }
    }
    
    if (deps.length === 0 && devDeps.length === 0) {
      console.log(`✅ ${workspace}: No dependency issues found`);
    }
  }
  
  return isValid;
}

function validatePackageLockSync() {
  console.log('🔍 Validating package-lock.json synchronization...');
  
  const rootPackagePath = path.join(__dirname, '../app/package.json');
  const lockPath = path.join(__dirname, '../app/package-lock.json');
  
  if (!fs.existsSync(lockPath)) {
    console.error('❌ package-lock.json not found');
    return false;
  }
  
  const rootPackage = readPackageJson(rootPackagePath);
  const lockFile = readPackageJson(lockPath);
  
  if (!rootPackage || !lockFile) {
    return false;
  }
  
  // Basic validation - check if lock file version matches package.json
  if (rootPackage.version !== lockFile.version) {
    console.warn('⚠️  Version mismatch between package.json and package-lock.json');
  }
  
  console.log('✅ package-lock.json appears to be synchronized');
  return true;
}

function main() {
  console.log('🚀 Starting dependency validation...\n');
  
  const results = [
    validateRootDependencies(),
    validateWorkspaceDependencies(),
    validatePackageLockSync()
  ];
  
  const allValid = results.every(result => result);
  
  console.log('\n📊 Validation Summary:');
  if (allValid) {
    console.log('✅ All dependency validations passed!');
    process.exit(0);
  } else {
    console.log('❌ Some dependency validations failed. Please review the issues above.');
    process.exit(1);
  }
}

// Run the validation if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { validateRootDependencies, validateWorkspaceDependencies, validatePackageLockSync };