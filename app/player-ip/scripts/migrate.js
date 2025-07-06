#!/usr/bin/env node
/**
 * Database Migration Script for Player-IP Service
 * 
 * This script handles database schema migrations and data transformations:
 * - Schema version management
 * - Safe migration execution
 * - Rollback capabilities
 * - Data integrity verification
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  dbPath: process.env.SQLITE_DB_PATH || path.join(__dirname, '../data/player-ip.db'),
  migrationsDir: path.join(__dirname, '../migrations'),
  backupDir: path.join(__dirname, '../backups'),
  dryRun: process.argv.includes('--dry-run'),
  force: process.argv.includes('--force'),
  rollback: process.argv.includes('--rollback'),
  targetVersion: process.argv.find(arg => arg.startsWith('--version='))?.split('=')[1]
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

class DatabaseMigrator {
  constructor() {
    this.db = null;
    this.currentVersion = 0;
    this.migrations = [];
  }

  async run() {
    console.log(`${colors.cyan}🔄 Database Migration Tool${colors.reset}`);
    console.log(`${colors.blue}Database: ${CONFIG.dbPath}${colors.reset}`);
    console.log(`${colors.blue}Dry Run: ${CONFIG.dryRun}${colors.reset}\n`);

    try {
      await this.initialize();
      await this.loadMigrations();
      await this.getCurrentVersion();
      
      if (CONFIG.rollback) {
        await this.rollbackMigrations();
      } else {
        await this.runMigrations();
      }
      
      await this.verifyIntegrity();
      console.log(`\n${colors.green}🎉 Migration completed successfully!${colors.reset}`);
    } catch (error) {
      console.error(`\n${colors.red}❌ Migration failed:${colors.reset}`, error.message);
      process.exit(1);
    } finally {
      if (this.db) {
        this.db.close();
      }
    }
  }

  async initialize() {
    console.log(`${colors.yellow}📋 Initializing migration environment...${colors.reset}`);
    
    // Create necessary directories
    [CONFIG.backupDir, CONFIG.migrationsDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`${colors.blue}  Created directory: ${dir}${colors.reset}`);
      }
    });

    // Import database module
    if (!CONFIG.dryRun) {
      // Set environment for database connection
      process.env.SQLITE_DB_PATH = CONFIG.dbPath;
      process.env.NODE_ENV = process.env.NODE_ENV || 'production';
      
      try {
        const dbModule = await import('../dist/config/database.js');
        this.db = dbModule.default;
        console.log(`${colors.green}  ✓ Database connection established${colors.reset}`);
      } catch (error) {
        throw new Error(`Failed to connect to database: ${error.message}`);
      }
    }

    // Create migration tracking table if it doesn't exist
    if (!CONFIG.dryRun && this.db) {
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          version INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          checksum TEXT NOT NULL
        )
      `);
      console.log(`${colors.green}  ✓ Migration tracking table ready${colors.reset}`);
    }
  }

  async loadMigrations() {
    console.log(`${colors.yellow}📂 Loading migration files...${colors.reset}`);
    
    // Create default migrations if directory is empty
    await this.createDefaultMigrations();
    
    if (!fs.existsSync(CONFIG.migrationsDir)) {
      console.log(`${colors.blue}  No migrations directory found, creating...${colors.reset}`);
      return;
    }

    const files = fs.readdirSync(CONFIG.migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const filePath = path.join(CONFIG.migrationsDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const version = parseInt(file.split('_')[0]);
      const name = file.replace(/^\d+_/, '').replace('.sql', '');
      const checksum = crypto.createHash('md5').update(content).digest('hex');

      this.migrations.push({
        version,
        name,
        file,
        content,
        checksum,
        path: filePath
      });
    }

    console.log(`${colors.green}  ✓ Loaded ${this.migrations.length} migration files${colors.reset}`);
  }

  async createDefaultMigrations() {
    const migration001Path = path.join(CONFIG.migrationsDir, '001_initial_schema.sql');
    
    if (!fs.existsSync(migration001Path)) {
      const initialSchema = `
-- Initial schema for Player-IP service
-- Version: 001
-- Description: Create core tables for user management and OAuth

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  identity_cookie TEXT UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User identities table for cookie-based authentication
CREATE TABLE IF NOT EXISTS user_identities (
  cookie_value TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- GAPs (Game Access Paths) table
CREATE TABLE IF NOT EXISTS gaps (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('OPEN', 'RESTRICTED')),
  policy TEXT NOT NULL CHECK (policy IN ('COOKIE_BASED', 'TOKEN_BASED')),
  event_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- GAP users association table
CREATE TABLE IF NOT EXISTS gap_users (
  gap_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (gap_id, user_id),
  FOREIGN KEY (gap_id) REFERENCES gaps(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- OAuth authorization codes table
CREATE TABLE IF NOT EXISTS auth_codes (
  code TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  redirect_uri TEXT NOT NULL,
  code_challenge TEXT NOT NULL,
  code_challenge_method TEXT NOT NULL CHECK (code_challenge_method IN ('S256', 'plain')),
  user_id TEXT NOT NULL,
  event_id TEXT NOT NULL,
  scope TEXT,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- OAuth refresh tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  scope TEXT,
  event_id TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  revoked BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_identities_user_id ON user_identities(user_id);
CREATE INDEX IF NOT EXISTS idx_gaps_event_id ON gaps(event_id);
CREATE INDEX IF NOT EXISTS idx_auth_codes_user_id ON auth_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_codes_expires_at ON auth_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;
`.trim();

      fs.writeFileSync(migration001Path, initialSchema);
      console.log(`${colors.green}  ✓ Created initial migration: ${migration001Path}${colors.reset}`);
    }
  }

  async getCurrentVersion() {
    if (CONFIG.dryRun || !this.db) {
      this.currentVersion = 0;
      return;
    }

    try {
      const result = this.db.prepare(`
        SELECT MAX(version) as version FROM schema_migrations
      `).get();
      
      this.currentVersion = result?.version || 0;
      console.log(`${colors.blue}Current database version: ${this.currentVersion}${colors.reset}`);
    } catch (error) {
      this.currentVersion = 0;
      console.log(`${colors.blue}No migration history found, starting from version 0${colors.reset}`);
    }
  }

  async runMigrations() {
    const targetVersion = CONFIG.targetVersion ? parseInt(CONFIG.targetVersion) : 
                         Math.max(...this.migrations.map(m => m.version), 0);
    
    const pendingMigrations = this.migrations.filter(m => 
      m.version > this.currentVersion && m.version <= targetVersion
    );

    if (pendingMigrations.length === 0) {
      console.log(`${colors.green}✅ Database is up to date (version ${this.currentVersion})${colors.reset}`);
      return;
    }

    console.log(`${colors.yellow}🔄 Running ${pendingMigrations.length} pending migrations...${colors.reset}`);

    // Create backup before migrations
    if (!CONFIG.dryRun) {
      await this.createBackup();
    }

    for (const migration of pendingMigrations) {
      await this.runMigration(migration);
    }
  }

  async runMigration(migration) {
    console.log(`${colors.cyan}📝 Applying migration ${migration.version}: ${migration.name}${colors.reset}`);

    if (CONFIG.dryRun) {
      console.log(`${colors.blue}  [DRY RUN] Would execute:${colors.reset}`);
      console.log(`${colors.blue}  ${migration.content.substring(0, 100)}...${colors.reset}`);
      return;
    }

    try {
      // Check if migration was already applied
      const existing = this.db.prepare(`
        SELECT * FROM schema_migrations WHERE version = ?
      `).get(migration.version);

      if (existing) {
        if (existing.checksum !== migration.checksum) {
          throw new Error(`Migration ${migration.version} checksum mismatch. Database may have been modified.`);
        }
        console.log(`${colors.yellow}  ⚠️  Migration ${migration.version} already applied, skipping${colors.reset}`);
        return;
      }

      // Execute migration in transaction
      const transaction = this.db.transaction(() => {
        // Execute the migration SQL
        this.db.exec(migration.content);
        
        // Record the migration
        this.db.prepare(`
          INSERT INTO schema_migrations (version, name, checksum)
          VALUES (?, ?, ?)
        `).run(migration.version, migration.name, migration.checksum);
      });

      transaction();
      
      console.log(`${colors.green}  ✅ Migration ${migration.version} applied successfully${colors.reset}`);
    } catch (error) {
      throw new Error(`Migration ${migration.version} failed: ${error.message}`);
    }
  }

  async rollbackMigrations() {
    const targetVersion = CONFIG.targetVersion ? parseInt(CONFIG.targetVersion) : 
                         this.currentVersion - 1;

    if (targetVersion >= this.currentVersion) {
      console.log(`${colors.yellow}⚠️  No rollback needed. Current version: ${this.currentVersion}, Target: ${targetVersion}${colors.reset}`);
      return;
    }

    console.log(`${colors.yellow}🔄 Rolling back to version ${targetVersion}...${colors.reset}`);

    if (!CONFIG.force) {
      console.log(`${colors.red}⚠️  Rollback is destructive and may cause data loss!${colors.reset}`);
      console.log(`${colors.red}Use --force flag to confirm rollback operation.${colors.reset}`);
      return;
    }

    // Create backup before rollback
    if (!CONFIG.dryRun) {
      await this.createBackup();
    }

    // For SQLite, rollback typically means recreating the database
    // This is a simplified approach - in production, you'd want more sophisticated rollback scripts
    console.log(`${colors.red}⚠️  SQLite rollback requires database recreation. This will delete all data!${colors.reset}`);
    
    if (CONFIG.dryRun) {
      console.log(`${colors.blue}[DRY RUN] Would recreate database and apply migrations up to version ${targetVersion}${colors.reset}`);
    }
  }

  async createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(CONFIG.backupDir, `player-ip-${timestamp}.db`);

    try {
      fs.copyFileSync(CONFIG.dbPath, backupPath);
      console.log(`${colors.green}💾 Database backup created: ${backupPath}${colors.reset}`);
    } catch (error) {
      throw new Error(`Failed to create backup: ${error.message}`);
    }
  }

  async verifyIntegrity() {
    if (CONFIG.dryRun || !this.db) {
      return;
    }

    console.log(`${colors.yellow}🔍 Verifying database integrity...${colors.reset}`);

    try {
      // Check database integrity
      const integrityResult = this.db.prepare('PRAGMA integrity_check').get();
      if (integrityResult.integrity_check !== 'ok') {
        throw new Error(`Database integrity check failed: ${integrityResult.integrity_check}`);
      }

      // Check foreign key constraints
      const foreignKeyResult = this.db.prepare('PRAGMA foreign_key_check').all();
      if (foreignKeyResult.length > 0) {
        throw new Error(`Foreign key constraint violations found: ${JSON.stringify(foreignKeyResult)}`);
      }

      // Verify all expected tables exist
      const tables = this.db.prepare(`
        SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'
      `).all();

      const expectedTables = ['users', 'user_identities', 'gaps', 'gap_users', 'auth_codes', 'refresh_tokens', 'schema_migrations'];
      const actualTables = tables.map(t => t.name);

      for (const expectedTable of expectedTables) {
        if (!actualTables.includes(expectedTable)) {
          throw new Error(`Expected table '${expectedTable}' not found`);
        }
      }

      console.log(`${colors.green}  ✅ Database integrity verified${colors.reset}`);
      console.log(`${colors.green}  ✅ All expected tables present${colors.reset}`);
      console.log(`${colors.green}  ✅ Foreign key constraints valid${colors.reset}`);
    } catch (error) {
      throw new Error(`Database integrity verification failed: ${error.message}`);
    }
  }
}

// Export for programmatic use
export const runMigrations = async (options = {}) => {
  const originalArgv = process.argv;
  
  // Set options as command line arguments
  process.argv = ['node', 'migrate.js'];
  if (options.dryRun) process.argv.push('--dry-run');
  if (options.force) process.argv.push('--force');
  if (options.rollback) process.argv.push('--rollback');
  if (options.version) process.argv.push(`--version=${options.version}`);
  
  try {
    const migrator = new DatabaseMigrator();
    await migrator.run();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  } finally {
    process.argv = originalArgv;
  }
};

// Run migrations if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const migrator = new DatabaseMigrator();
  migrator.run().catch(error => {
    console.error(`${colors.red}❌ Migration error:${colors.reset}`, error);
    process.exit(1);
  });
}

console.log('✅ Database migration script ready');