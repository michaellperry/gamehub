#!/usr/bin/env node
/**
 * Component-level Integration Test Suite for Player-IP Service
 * 
 * This script tests individual components without requiring a full server:
 * 1. Database schema and initialization
 * 2. Repository functions
 * 3. JWT token generation and validation
 * 4. OAuth utilities
 * 5. GAP integration (basic validation)
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test configuration
const TEST_CONFIG = {
  testDbPath: path.join(__dirname, 'test-data', 'test-player-ip.db'),
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

class ComponentTestRunner {
  constructor() {
    this.results = [];
  }

  async run() {
    console.log(`${colors.cyan}🚀 Starting Player-IP Component Tests${colors.reset}\n`);
    
    try {
      await this.setupTestEnvironment();
      await this.runAllTests();
    } catch (error) {
      console.error(`${colors.red}❌ Test setup failed:${colors.reset}`, error);
    } finally {
      await this.cleanup();
      this.printResults();
    }
  }

  async setupTestEnvironment() {
    console.log(`${colors.blue}📋 Setting up test environment...${colors.reset}`);
    
    // Create test data directory
    const testDataDir = path.dirname(TEST_CONFIG.testDbPath);
    if (!fs.existsSync(testDataDir)) {
      fs.mkdirSync(testDataDir, { recursive: true });
    }

    // Remove existing test database
    if (fs.existsSync(TEST_CONFIG.testDbPath)) {
      fs.unlinkSync(TEST_CONFIG.testDbPath);
    }

    // Set test environment variables
    process.env.NODE_ENV = 'test';
    process.env.SQLITE_DB_PATH = TEST_CONFIG.testDbPath;
    process.env.JWT_SECRET = 'test-secret-key';
    process.env.JWT_ISSUER = 'player-ip-test';
    process.env.JWT_AUDIENCE = 'gamehub-players-test';
    process.env.SKIP_JINAGA_SUBSCRIPTION = 'true';
    
    console.log(`${colors.green}✅ Test environment setup complete${colors.reset}`);
  }

  async runAllTests() {
    console.log(`${colors.cyan}🧪 Running component tests...${colors.reset}\n`);

    // Database Tests
    await this.testDatabaseSchema();
    await this.testDatabaseInitialization();
    await this.testDataMigrationCompatibility();

    // Repository Tests
    await this.testUserRepository();
    await this.testGAPRepository();
    await this.testAuthRepository();

    // Utility Tests
    await this.testJWTTokenGeneration();
    await this.testOAuthUtilities();
    await this.testCookieUtilities();

    // Integration Tests
    await this.testGAPIntegration();
  }

  async testDatabaseSchema() {
    await this.runTest('Database Schema Verification', async () => {
      // Import database after environment is set
      const { default: db } = await import('./dist/config/database.js');
      
      // Check if all required tables exist
      const tables = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
      `).all();
      
      const expectedTables = ['users', 'user_identities', 'gaps', 'gap_users', 'auth_codes', 'refresh_tokens'];
      const actualTables = tables.map(t => t.name);
      
      for (const table of expectedTables) {
        if (!actualTables.includes(table)) {
          throw new Error(`Missing table: ${table}`);
        }
      }

      // Check foreign key constraints are enabled
      const foreignKeysEnabled = db.pragma('foreign_keys');
      if (!foreignKeysEnabled) {
        throw new Error('Foreign keys are not enabled');
      }

      console.log(`${colors.green}  ✓ All required tables exist with proper constraints${colors.reset}`);
    });
  }

  async testDatabaseInitialization() {
    await this.runTest('Database Initialization', async () => {
      const { default: db } = await import('./dist/config/database.js');
      
      // Test basic CRUD operations on each table
      const testUserId = crypto.randomUUID();
      const testCookie = crypto.randomUUID();
      
      // Insert test user
      db.prepare(`
        INSERT INTO users (id, identity_cookie, created_at, updated_at)
        VALUES (?, ?, ?, ?)
      `).run(testUserId, testCookie, new Date().toISOString(), new Date().toISOString());
      
      // Verify user was inserted
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(testUserId);
      if (!user) {
        throw new Error('Failed to insert test user');
      }

      // Test user_identities table
      db.prepare(`
        INSERT INTO user_identities (cookie_value, user_id)
        VALUES (?, ?)
      `).run(testCookie, testUserId);

      // Test gaps table
      const testGapId = crypto.randomUUID();
      db.prepare(`
        INSERT INTO gaps (id, type, policy, event_id)
        VALUES (?, ?, ?, ?)
      `).run(testGapId, 'OPEN', 'COOKIE_BASED', crypto.randomUUID());

      console.log(`${colors.green}  ✓ Database initialization and basic operations work correctly${colors.reset}`);
    });
  }

  async testDataMigrationCompatibility() {
    await this.runTest('Data Migration Compatibility', async () => {
      const { default: db } = await import('./dist/config/database.js');
      
      // Verify that the schema supports all required OAuth 2.0 operations
      const schemaInfo = db.prepare(`
        SELECT sql FROM sqlite_master 
        WHERE type='table' AND name IN ('auth_codes', 'refresh_tokens')
      `).all();
      
      const authCodeSchema = schemaInfo.find(s => s.sql.includes('auth_codes'));
      const refreshTokenSchema = schemaInfo.find(s => s.sql.includes('refresh_tokens'));
      
      if (!authCodeSchema || !refreshTokenSchema) {
        throw new Error('OAuth 2.0 tables not found');
      }

      // Check for required OAuth 2.0 fields
      const requiredAuthCodeFields = ['code', 'client_id', 'redirect_uri', 'code_challenge', 'code_challenge_method', 'expires_at', 'user_id', 'event_id', 'scope'];
      const requiredRefreshTokenFields = ['token', 'user_id', 'client_id', 'scope', 'event_id', 'expires_at', 'revoked'];
      
      for (const field of requiredAuthCodeFields) {
        if (!authCodeSchema.sql.includes(field)) {
          throw new Error(`Missing required auth_codes field: ${field}`);
        }
      }

      for (const field of requiredRefreshTokenFields) {
        if (!refreshTokenSchema.sql.includes(field)) {
          throw new Error(`Missing required refresh_tokens field: ${field}`);
        }
      }

      console.log(`${colors.green}  ✓ Schema is compatible with OAuth 2.0 and GameHub model requirements${colors.reset}`);
    });
  }

  async testUserRepository() {
    await this.runTest('User Repository Functions', async () => {
      const { createUser, storeUserIdentity, getUserIdByCookie } = await import('./dist/repository/index.js');
      
      // Create a new user
      const user = createUser();
      if (!user.id) {
        throw new Error('Failed to create user');
      }

      // Store user identity
      const cookieValue = crypto.randomUUID();
      storeUserIdentity(user.id, cookieValue);

      // Retrieve user by cookie
      const retrievedUserId = getUserIdByCookie(cookieValue);
      if (retrievedUserId !== user.id) {
        throw new Error('Failed to retrieve user by cookie');
      }

      console.log(`${colors.green}  ✓ User repository functions working correctly${colors.reset}`);
    });
  }

  async testGAPRepository() {
    await this.runTest('GAP Repository Functions', async () => {
      const { createOpenAccessPath, getGAPById } = await import('./dist/repository/index.js');
      
      const testGapId = crypto.randomUUID();
      const testEventId = crypto.randomUUID();
      
      // Create a test GAP
      createOpenAccessPath(testGapId, 'cookie_based', testEventId);
      
      // Retrieve the GAP
      const gap = getGAPById(testGapId);
      
      if (!gap) {
        throw new Error('Failed to create or retrieve GAP');
      }

      if (gap.eventId !== testEventId) {
        throw new Error('GAP event ID mismatch');
      }

      console.log(`${colors.green}  ✓ GAP repository functions working correctly${colors.reset}`);
    });
  }

  async testAuthRepository() {
    await this.runTest('Auth Repository Functions', async () => {
      const { 
        createUser, 
        storeUserIdentity,
        createAuthorizationCode,
        getAuthorizationCode,
        deleteAuthorizationCode,
        createRefreshToken,
        getRefreshToken
      } = await import('./dist/repository/index.js');
      
      // Create test user
      const user = createUser();
      const cookieValue = crypto.randomUUID();
      storeUserIdentity(user.id, cookieValue);

      // Test authorization code
      const authCode = createAuthorizationCode(
        'test-client',
        'http://localhost:3000/callback',
        'test-challenge',
        'S256',
        user.id,
        crypto.randomUUID(),
        'openid profile'
      );

      const retrievedAuthCode = getAuthorizationCode(authCode);
      if (!retrievedAuthCode || retrievedAuthCode.user_id !== user.id) {
        throw new Error('Failed to create or retrieve authorization code');
      }

      // Test refresh token
      const refreshToken = createRefreshToken(
        user.id,
        'test-client',
        'openid profile',
        crypto.randomUUID()
      );

      const retrievedRefreshToken = getRefreshToken(refreshToken.token);
      if (!retrievedRefreshToken || retrievedRefreshToken.user_id !== user.id) {
        throw new Error('Failed to create or retrieve refresh token');
      }

      // Clean up
      deleteAuthorizationCode(authCode);

      console.log(`${colors.green}  ✓ Auth repository functions working correctly${colors.reset}`);
    });
  }

  async testJWTTokenGeneration() {
    await this.runTest('JWT Token Generation', async () => {
      const { generateAccessToken, verifyJwt } = await import('./dist/utils/jwt.js');
      
      const testUserId = crypto.randomUUID();
      const testEventId = crypto.randomUUID();
      
      // Generate a test token
      const token = generateAccessToken(testUserId, testEventId);
      
      if (!token) {
        throw new Error('Failed to generate access token');
      }

      // Verify the token
      const decoded = verifyJwt(token);
      
      if (!decoded || decoded.sub !== testUserId) {
        throw new Error('Token verification failed');
      }

      console.log(`${colors.green}  ✓ JWT token generation and validation working correctly${colors.reset}`);
    });
  }

  async testOAuthUtilities() {
    await this.runTest('OAuth Utilities', async () => {
      const { verifyCodeChallenge } = await import('./dist/utils/oauth.js');
      
      // Test PKCE code challenge verification
      const codeVerifier = 'test-code-verifier-123456789';
      const codeChallenge = 'test-challenge';
      
      // Test plain method
      const plainResult = verifyCodeChallenge(codeVerifier, codeVerifier, 'plain');
      if (!plainResult) {
        throw new Error('Plain code challenge verification failed');
      }

      console.log(`${colors.green}  ✓ OAuth utilities working correctly${colors.reset}`);
    });
  }

  async testCookieUtilities() {
    await this.runTest('Cookie Utilities', async () => {
      const { generateCookieValue, IDENTITY_COOKIE_NAME } = await import('./dist/utils/cookie.js');
      
      // Test cookie value generation
      const cookieValue = generateCookieValue();
      if (!cookieValue || cookieValue.length < 10) {
        throw new Error('Failed to generate cookie value');
      }

      // Test cookie name constant
      if (!IDENTITY_COOKIE_NAME) {
        throw new Error('Identity cookie name not defined');
      }

      console.log(`${colors.green}  ✓ Cookie utilities working correctly${colors.reset}`);
    });
  }

  async testGAPIntegration() {
    await this.runTest('GAP Integration (Complete Flow)', async () => {
      const {
        createUser,
        storeUserIdentity,
        createOpenAccessPath,
        getGAPById,
        getAuthorizationCode
      } = await import('./dist/repository/index.js');
      
      const { createAuthorizationCode } = await import('./dist/utils/index.js');
      
      // Create user and GAP
      const user = createUser();
      const cookieValue = crypto.randomUUID();
      storeUserIdentity(user.id, cookieValue);
      
      const testGapId = crypto.randomUUID();
      const testEventId = crypto.randomUUID();
      createOpenAccessPath(testGapId, 'cookie_based', testEventId);
      
      // Verify GAP exists
      const gap = getGAPById(testGapId);
      if (!gap) {
        throw new Error('Failed to create GAP');
      }

      // Test complete OAuth flow
      const authCode = createAuthorizationCode(
        'test-client',
        'http://localhost:3000/callback',
        'test-challenge',
        'S256',
        user.id,
        testEventId,
        'openid profile'
      );

      const retrievedAuthCode = getAuthorizationCode(authCode);
      if (!retrievedAuthCode || retrievedAuthCode.event_id !== testEventId) {
        throw new Error('OAuth flow integration failed');
      }

      console.log(`${colors.green}  ✓ GAP integration complete flow working correctly${colors.reset}`);
    });
  }

  async runTest(name, testFn) {
    console.log(`${colors.yellow}🧪 ${name}...${colors.reset}`);
    
    try {
      await testFn();
      this.results.push({ name, passed: true });
      console.log(`${colors.green}✅ ${name} PASSED${colors.reset}\n`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.results.push({ name, passed: false, error: errorMessage });
      console.log(`${colors.red}❌ ${name} FAILED: ${errorMessage}${colors.reset}\n`);
    }
  }

  async cleanup() {
    console.log(`${colors.blue}🧹 Cleaning up...${colors.reset}`);
    
    // Remove test database
    if (fs.existsSync(TEST_CONFIG.testDbPath)) {
      fs.unlinkSync(TEST_CONFIG.testDbPath);
    }

    console.log(`${colors.green}✅ Cleanup complete${colors.reset}`);
  }

  printResults() {
    console.log(`\n${colors.cyan}📊 Test Results Summary${colors.reset}`);
    console.log('='.repeat(50));
    
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    
    this.results.forEach(result => {
      const status = result.passed ? 
        `${colors.green}✅ PASSED${colors.reset}` : 
        `${colors.red}❌ FAILED${colors.reset}`;
      console.log(`${result.name}: ${status}`);
      if (!result.passed && result.error) {
        console.log(`   Error: ${colors.red}${result.error}${colors.reset}`);
      }
    });
    
    console.log('='.repeat(50));
    console.log(`Total: ${this.results.length} | Passed: ${colors.green}${passed}${colors.reset} | Failed: ${colors.red}${failed}${colors.reset}`);
    
    if (failed > 0) {
      console.log(`\n${colors.red}❌ Some tests failed. Please review the errors above.${colors.reset}`);
      process.exit(1);
    } else {
      console.log(`\n${colors.green}🎉 All component tests passed! Player-IP service components are working correctly.${colors.reset}`);
    }
  }
}

// Run tests if this file is executed directly
const runner = new ComponentTestRunner();
runner.run().catch(console.error);