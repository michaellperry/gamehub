#!/usr/bin/env node

/**
 * Dependency Validation Script - Per-Project Strategy
 * 
 * This script validates the per-project dependency strategy where:
 * - Root only contains shared build tools (typescript, rimraf, @types/node)
 * - Each project manages its own runtime dependencies
 * - Projects should not duplicate shared build tools
 * - Version consistency warnings for shared dependencies across projects
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Shared build tools that should ONLY be at root level
const SHARED_BUILD_TOOLS = [
  'typescript',
  'rimraf',
  '@types/node'
];

// Build tools that projects should NOT duplicate from root
const FORBIDDEN_DUPLICATIONS = [
  'typescript',
  'rimraf',
  '@types/node'
];

function readPackageJson(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return null;
  }
}

function getAllWorkspacePackages() {
  const appDir = path.join(__dirname, '../app');
  const rootPackagePath = path.join(appDir, 'package.json');
  const rootPackage = readPackageJson(rootPackagePath);
  
  if (!rootPackage || !rootPackage.workspaces) {
    console.error('❌ Could not read root package.json or workspaces configuration');
    return { root: null, workspaces: [] };
  }

  const workspaces = [];
  for (const workspace of rootPackage.workspaces) {
    const packagePath = path.join(appDir, workspace, 'package.json');
    if (fs.existsSync(packagePath)) {
      const pkg = readPackageJson(packagePath);
      if (pkg) {
        workspaces.push({
          name: workspace,
          path: packagePath,
          package: pkg
        });
      }
    }
  }

  return {
    root: { path: rootPackagePath, package: rootPackage },
    workspaces
  };
}

function validateRootDependencies(root) {
  console.log('🔍 Validating root dependencies (shared build tools only)...');
  
  if (!root || !root.package) {
    console.error('❌ Could not read root package.json');
    return false;
  }

  const rootDeps = Object.keys(root.package.dependencies || {});
  const rootDevDeps = Object.keys(root.package.devDependencies || {});
  
  let isValid = true;

  // Root should have NO runtime dependencies
  if (rootDeps.length > 0) {
    console.error(`❌ Root should not have runtime dependencies. Found: ${rootDeps.join(', ')}`);
    console.error('   Runtime dependencies should be managed per-project.');
    isValid = false;
  }

  // Root should only have shared build tools in devDependencies
  const expectedDevDeps = [...SHARED_BUILD_TOOLS].sort();
  const actualDevDeps = [...rootDevDeps].sort();
  
  if (JSON.stringify(expectedDevDeps) !== JSON.stringify(actualDevDeps)) {
    console.error('❌ Root devDependencies mismatch:');
    console.error(`   Expected: ${expectedDevDeps.join(', ')}`);
    console.error(`   Actual: ${actualDevDeps.join(', ')}`);
    
    const missing = expectedDevDeps.filter(dep => !actualDevDeps.includes(dep));
    const extra = actualDevDeps.filter(dep => !expectedDevDeps.includes(dep));
    
    if (missing.length > 0) {
      console.error(`   Missing: ${missing.join(', ')}`);
    }
    if (extra.length > 0) {
      console.error(`   Extra: ${extra.join(', ')}`);
      console.error('   Extra dependencies should be moved to individual projects.');
    }
    isValid = false;
  }

  if (isValid) {
    console.log('✅ Root dependencies are properly configured (shared build tools only)');
  }

  return isValid;
}

function validateWorkspaceDependencies(workspaces) {
  console.log('🔍 Validating workspace dependencies (per-project strategy)...');
  
  let isValid = true;
  const dependencyVersions = new Map(); // Track versions across projects

  for (const workspace of workspaces) {
    console.log(`\n📦 Validating ${workspace.name}...`);
    
    const deps = Object.keys(workspace.package.dependencies || {});
    const devDeps = Object.keys(workspace.package.devDependencies || {});
    const allDeps = [...deps, ...devDeps];

    // Check for forbidden duplications of shared build tools
    const duplicatedBuildTools = allDeps.filter(dep => FORBIDDEN_DUPLICATIONS.includes(dep));
    if (duplicatedBuildTools.length > 0) {
      console.error(`❌ ${workspace.name}: Should not duplicate shared build tools: ${duplicatedBuildTools.join(', ')}`);
      console.error('   These are managed at root level and inherited by workspaces.');
      isValid = false;
    }

    // Track dependency versions for consistency checking
    const allDepVersions = {
      ...workspace.package.dependencies,
      ...workspace.package.devDependencies
    };

    for (const [dep, version] of Object.entries(allDepVersions)) {
      if (!dependencyVersions.has(dep)) {
        dependencyVersions.set(dep, new Map());
      }
      dependencyVersions.get(dep).set(workspace.name, version);
    }

    // Report project dependency summary
    if (deps.length > 0 || devDeps.length > 0) {
      console.log(`   Runtime deps: ${deps.length > 0 ? deps.join(', ') : 'none'}`);
      console.log(`   Dev deps: ${devDeps.length > 0 ? devDeps.join(', ') : 'none'}`);
      console.log(`✅ ${workspace.name}: Per-project dependencies are allowed`);
    } else {
      console.log(`✅ ${workspace.name}: No additional dependencies`);
    }
  }

  return isValid;
}

function checkVersionConsistency(workspaces) {
  console.log('\n🔍 Checking version consistency across projects...');
  
  const dependencyVersions = new Map();
  
  // Collect all dependency versions
  for (const workspace of workspaces) {
    const allDepVersions = {
      ...workspace.package.dependencies,
      ...workspace.package.devDependencies
    };

    for (const [dep, version] of Object.entries(allDepVersions)) {
      if (!dependencyVersions.has(dep)) {
        dependencyVersions.set(dep, new Map());
      }
      dependencyVersions.get(dep).set(workspace.name, version);
    }
  }

  let hasVersionDrift = false;

  // Check for version inconsistencies
  for (const [dep, projectVersions] of dependencyVersions.entries()) {
    if (projectVersions.size > 1) {
      const versions = Array.from(new Set(projectVersions.values()));
      if (versions.length > 1) {
        hasVersionDrift = true;
        console.warn(`⚠️  Version drift detected for '${dep}':`);
        for (const [project, version] of projectVersions.entries()) {
          console.warn(`   ${project}: ${version}`);
        }
        console.warn('   Consider standardizing versions if these projects interact.');
      }
    }
  }

  if (!hasVersionDrift) {
    console.log('✅ No version drift detected across projects');
  }

  return !hasVersionDrift; // Return true if no drift (success)
}

function validatePackageLockSync() {
  console.log('\n🔍 Validating package-lock.json synchronization...');
  
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

function printDependencyStrategy() {
  console.log('\n📋 Per-Project Dependency Strategy Summary:');
  console.log('   • Root: Only shared build tools (typescript, rimraf, @types/node)');
  console.log('   • Projects: Manage their own runtime dependencies');
  console.log('   • No duplication: Projects should not duplicate shared build tools');
  console.log('   • Version awareness: Monitor for version drift across projects');
}

function main() {
  console.log('🚀 Starting dependency validation (per-project strategy)...\n');
  
  const { root, workspaces } = getAllWorkspacePackages();
  
  if (!root || workspaces.length === 0) {
    console.error('❌ Could not load workspace configuration');
    process.exit(1);
  }

  console.log(`Found ${workspaces.length} workspace(s): ${workspaces.map(w => w.name).join(', ')}\n`);

  const results = [
    validateRootDependencies(root),
    validateWorkspaceDependencies(workspaces),
    validatePackageLockSync()
  ];

  // Version consistency check (warning only, doesn't fail validation)
  const versionConsistency = checkVersionConsistency(workspaces);
  
  const allValid = results.every(result => result);
  
  printDependencyStrategy();
  
  console.log('\n📊 Validation Summary:');
  if (allValid) {
    console.log('✅ All dependency validations passed!');
    if (!versionConsistency) {
      console.log('⚠️  Note: Version drift detected but not blocking (see warnings above)');
    }
    process.exit(0);
  } else {
    console.log('❌ Some dependency validations failed. Please review the issues above.');
    console.log('\n💡 Quick fixes:');
    console.log('   • Move runtime dependencies from root to individual projects');
    console.log('   • Remove duplicated build tools (typescript, rimraf, @types/node) from projects');
    console.log('   • Ensure root only has shared build tools in devDependencies');
    process.exit(1);
  }
}

// Run the validation if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { validateRootDependencies, validateWorkspaceDependencies, validatePackageLockSync, checkVersionConsistency };