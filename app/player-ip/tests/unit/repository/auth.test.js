#!/usr/bin/env node
/**
 * Unit Tests for Authentication Repository Functions
 */

import { strict as assert } from 'assert';
import { test, describe, beforeEach, afterEach } from 'node:test';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test configuration
const TEST_DB_PATH = path.join(__dirname, '../../test-data/auth-repo-test.db');

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.SQLITE_DB_PATH = TEST_DB_PATH;
process.env.SKIP_JINAGA_SUBSCRIPTION = 'true';

describe('Authentication Repository', () => {
  let authRepo;

  beforeEach(async () => {
    // Ensure test data directory exists
    const testDataDir = path.dirname(TEST_DB_PATH);
    if (!fs.existsSync(testDataDir)) {
      fs.mkdirSync(testDataDir, { recursive: true });
    }

    // Remove existing test database
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }

    // Import repository functions after setting up environment
    authRepo = await import('../../../dist/repository/index.js');
  });

  afterEach(() => {
    // Clean up test database
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
  });

  describe('createAuthorizationCode', () => {
    test('should create authorization code with valid parameters', () => {
      const user = authRepo.createUser();
      const eventId = crypto.randomUUID();
      
      const code = authRepo.createAuthorizationCode(
        'test-client',
        'http://localhost:3000/callback',
        'test-challenge',
        'S256',
        user.id,
        eventId,
        'openid profile'
      );
      
      assert.ok(code);
      assert.strictEqual(typeof code, 'string');
      assert.ok(code.length > 0);
    });

    test('should create unique authorization codes', () => {
      const user = authRepo.createUser();
      const eventId = crypto.randomUUID();
      
      const code1 = authRepo.createAuthorizationCode(
        'test-client',
        'http://localhost:3000/callback',
        'test-challenge-1',
        'S256',
        user.id,
        eventId,
        'openid profile'
      );
      
      const code2 = authRepo.createAuthorizationCode(
        'test-client',
        'http://localhost:3000/callback',
        'test-challenge-2',
        'S256',
        user.id,
        eventId,
        'openid profile'
      );
      
      assert.notStrictEqual(code1, code2);
    });

    test('should store authorization code data correctly', () => {
      const user = authRepo.createUser();
      const eventId = crypto.randomUUID();
      const clientId = 'test-client';
      const redirectUri = 'http://localhost:3000/callback';
      const codeChallenge = 'test-challenge';
      const codeChallengeMethod = 'S256';
      const scope = 'openid profile';
      
      const code = authRepo.createAuthorizationCode(
        clientId,
        redirectUri,
        codeChallenge,
        codeChallengeMethod,
        user.id,
        eventId,
        scope
      );
      
      const retrievedCode = authRepo.getAuthorizationCode(code);
      
      assert.ok(retrievedCode);
      assert.strictEqual(retrievedCode.code, code);
      assert.strictEqual(retrievedCode.client_id, clientId);
      assert.strictEqual(retrievedCode.redirect_uri, redirectUri);
      assert.strictEqual(retrievedCode.code_challenge, codeChallenge);
      assert.strictEqual(retrievedCode.code_challenge_method, codeChallengeMethod);
      assert.strictEqual(retrievedCode.user_id, user.id);
      assert.strictEqual(retrievedCode.event_id, eventId);
      assert.strictEqual(retrievedCode.scope, scope);
    });

    test('should set expiration time for authorization code', () => {
      const user = authRepo.createUser();
      const eventId = crypto.randomUUID();
      
      const beforeCreation = new Date();
      const code = authRepo.createAuthorizationCode(
        'test-client',
        'http://localhost:3000/callback',
        'test-challenge',
        'S256',
        user.id,
        eventId,
        'openid profile'
      );
      const afterCreation = new Date();
      
      const retrievedCode = authRepo.getAuthorizationCode(code);
      
      assert.ok(retrievedCode.expires_at);
      const expiresAt = new Date(retrievedCode.expires_at);
      
      // Should expire in the future (typically 10 minutes)
      assert.ok(expiresAt > afterCreation);
      
      // Should not expire too far in the future (less than 1 hour)
      const oneHourFromNow = new Date(afterCreation.getTime() + 60 * 60 * 1000);
      assert.ok(expiresAt < oneHourFromNow);
    });

    test('should handle different code challenge methods', () => {
      const user = authRepo.createUser();
      const eventId = crypto.randomUUID();
      
      const codeS256 = authRepo.createAuthorizationCode(
        'test-client',
        'http://localhost:3000/callback',
        'test-challenge',
        'S256',
        user.id,
        eventId,
        'openid profile'
      );
      
      const codePlain = authRepo.createAuthorizationCode(
        'test-client',
        'http://localhost:3000/callback',
        'test-challenge',
        'plain',
        user.id,
        eventId,
        'openid profile'
      );
      
      const retrievedS256 = authRepo.getAuthorizationCode(codeS256);
      const retrievedPlain = authRepo.getAuthorizationCode(codePlain);
      
      assert.strictEqual(retrievedS256.code_challenge_method, 'S256');
      assert.strictEqual(retrievedPlain.code_challenge_method, 'plain');
    });

    test('should handle different scopes', () => {
      const user = authRepo.createUser();
      const eventId = crypto.randomUUID();
      
      const scopes = [
        'openid',
        'openid profile',
        'openid profile email',
        'openid offline_access'
      ];
      
      scopes.forEach(scope => {
        const code = authRepo.createAuthorizationCode(
          'test-client',
          'http://localhost:3000/callback',
          'test-challenge',
          'S256',
          user.id,
          eventId,
          scope
        );
        
        const retrievedCode = authRepo.getAuthorizationCode(code);
        assert.strictEqual(retrievedCode.scope, scope);
      });
    });
  });

  describe('getAuthorizationCode', () => {
    test('should return null for non-existent code', () => {
      const nonExistentCode = 'non-existent-code';
      const retrievedCode = authRepo.getAuthorizationCode(nonExistentCode);
      assert.strictEqual(retrievedCode, null);
    });

    test('should return null for empty code', () => {
      const retrievedCode = authRepo.getAuthorizationCode('');
      assert.strictEqual(retrievedCode, null);
    });

    test('should return null for null/undefined code', () => {
      assert.strictEqual(authRepo.getAuthorizationCode(null), null);
      assert.strictEqual(authRepo.getAuthorizationCode(undefined), null);
    });

    test('should retrieve complete authorization code data', () => {
      const user = authRepo.createUser();
      const eventId = crypto.randomUUID();
      
      const code = authRepo.createAuthorizationCode(
        'test-client',
        'http://localhost:3000/callback',
        'test-challenge',
        'S256',
        user.id,
        eventId,
        'openid profile'
      );
      
      const retrievedCode = authRepo.getAuthorizationCode(code);
      
      // Check all required fields are present
      assert.ok(retrievedCode.code);
      assert.ok(retrievedCode.client_id);
      assert.ok(retrievedCode.redirect_uri);
      assert.ok(retrievedCode.code_challenge);
      assert.ok(retrievedCode.code_challenge_method);
      assert.ok(retrievedCode.user_id);
      assert.ok(retrievedCode.event_id);
      assert.ok(retrievedCode.scope);
      assert.ok(retrievedCode.expires_at);
      assert.ok(retrievedCode.created_at);
    });
  });

  describe('deleteAuthorizationCode', () => {
    test('should delete existing authorization code', () => {
      const user = authRepo.createUser();
      const eventId = crypto.randomUUID();
      
      const code = authRepo.createAuthorizationCode(
        'test-client',
        'http://localhost:3000/callback',
        'test-challenge',
        'S256',
        user.id,
        eventId,
        'openid profile'
      );
      
      // Verify code exists
      assert.ok(authRepo.getAuthorizationCode(code));
      
      // Delete code
      authRepo.deleteAuthorizationCode(code);
      
      // Verify code no longer exists
      assert.strictEqual(authRepo.getAuthorizationCode(code), null);
    });

    test('should handle deletion of non-existent code', () => {
      assert.doesNotThrow(() => {
        authRepo.deleteAuthorizationCode('non-existent-code');
      });
    });

    test('should handle deletion with null/undefined code', () => {
      assert.doesNotThrow(() => {
        authRepo.deleteAuthorizationCode(null);
      });
      
      assert.doesNotThrow(() => {
        authRepo.deleteAuthorizationCode(undefined);
      });
    });
  });

  describe('createRefreshToken', () => {
    test('should create refresh token with valid parameters', () => {
      const user = authRepo.createUser();
      const eventId = crypto.randomUUID();
      
      const refreshToken = authRepo.createRefreshToken(
        user.id,
        'test-client',
        'openid profile offline_access',
        eventId
      );
      
      assert.ok(refreshToken);
      assert.ok(refreshToken.token);
      assert.strictEqual(typeof refreshToken.token, 'string');
      assert.ok(refreshToken.token.length > 0);
    });

    test('should create unique refresh tokens', () => {
      const user = authRepo.createUser();
      const eventId = crypto.randomUUID();
      
      const token1 = authRepo.createRefreshToken(
        user.id,
        'test-client',
        'openid profile offline_access',
        eventId
      );
      
      const token2 = authRepo.createRefreshToken(
        user.id,
        'test-client',
        'openid profile offline_access',
        eventId
      );
      
      assert.notStrictEqual(token1.token, token2.token);
    });

    test('should store refresh token data correctly', () => {
      const user = authRepo.createUser();
      const eventId = crypto.randomUUID();
      const clientId = 'test-client';
      const scope = 'openid profile offline_access';
      
      const refreshToken = authRepo.createRefreshToken(
        user.id,
        clientId,
        scope,
        eventId
      );
      
      const retrievedToken = authRepo.getRefreshToken(refreshToken.token);
      
      assert.ok(retrievedToken);
      assert.strictEqual(retrievedToken.token, refreshToken.token);
      assert.strictEqual(retrievedToken.user_id, user.id);
      assert.strictEqual(retrievedToken.client_id, clientId);
      assert.strictEqual(retrievedToken.scope, scope);
      assert.strictEqual(retrievedToken.event_id, eventId);
      assert.strictEqual(retrievedToken.revoked, false);
    });

    test('should set expiration time for refresh token', () => {
      const user = authRepo.createUser();
      const eventId = crypto.randomUUID();
      
      const beforeCreation = new Date();
      const refreshToken = authRepo.createRefreshToken(
        user.id,
        'test-client',
        'openid profile offline_access',
        eventId
      );
      const afterCreation = new Date();
      
      const retrievedToken = authRepo.getRefreshToken(refreshToken.token);
      
      assert.ok(retrievedToken.expires_at);
      const expiresAt = new Date(retrievedToken.expires_at);
      
      // Should expire in the future (typically 14 days)
      assert.ok(expiresAt > afterCreation);
      
      // Should expire within reasonable timeframe (less than 30 days)
      const thirtyDaysFromNow = new Date(afterCreation.getTime() + 30 * 24 * 60 * 60 * 1000);
      assert.ok(expiresAt < thirtyDaysFromNow);
    });
  });

  describe('getRefreshToken', () => {
    test('should return null for non-existent token', () => {
      const nonExistentToken = 'non-existent-token';
      const retrievedToken = authRepo.getRefreshToken(nonExistentToken);
      assert.strictEqual(retrievedToken, null);
    });

    test('should return null for empty token', () => {
      const retrievedToken = authRepo.getRefreshToken('');
      assert.strictEqual(retrievedToken, null);
    });

    test('should return null for null/undefined token', () => {
      assert.strictEqual(authRepo.getRefreshToken(null), null);
      assert.strictEqual(authRepo.getRefreshToken(undefined), null);
    });

    test('should retrieve complete refresh token data', () => {
      const user = authRepo.createUser();
      const eventId = crypto.randomUUID();
      
      const refreshToken = authRepo.createRefreshToken(
        user.id,
        'test-client',
        'openid profile offline_access',
        eventId
      );
      
      const retrievedToken = authRepo.getRefreshToken(refreshToken.token);
      
      // Check all required fields are present
      assert.ok(retrievedToken.token);
      assert.ok(retrievedToken.user_id);
      assert.ok(retrievedToken.client_id);
      assert.ok(retrievedToken.scope);
      assert.ok(retrievedToken.event_id);
      assert.ok(retrievedToken.expires_at);
      assert.ok(retrievedToken.created_at);
      assert.strictEqual(typeof retrievedToken.revoked, 'boolean');
    });
  });

  describe('revokeRefreshToken', () => {
    test('should revoke existing refresh token', () => {
      const user = authRepo.createUser();
      const eventId = crypto.randomUUID();
      
      const refreshToken = authRepo.createRefreshToken(
        user.id,
        'test-client',
        'openid profile offline_access',
        eventId
      );
      
      // Verify token is not revoked initially
      let retrievedToken = authRepo.getRefreshToken(refreshToken.token);
      assert.strictEqual(retrievedToken.revoked, false);
      
      // Revoke token
      authRepo.revokeRefreshToken(refreshToken.token);
      
      // Verify token is now revoked
      retrievedToken = authRepo.getRefreshToken(refreshToken.token);
      assert.strictEqual(retrievedToken.revoked, true);
    });

    test('should handle revocation of non-existent token', () => {
      assert.doesNotThrow(() => {
        authRepo.revokeRefreshToken('non-existent-token');
      });
    });

    test('should handle revocation with null/undefined token', () => {
      assert.doesNotThrow(() => {
        authRepo.revokeRefreshToken(null);
      });
      
      assert.doesNotThrow(() => {
        authRepo.revokeRefreshToken(undefined);
      });
    });

    test('should handle multiple revocations of same token', () => {
      const user = authRepo.createUser();
      const eventId = crypto.randomUUID();
      
      const refreshToken = authRepo.createRefreshToken(
        user.id,
        'test-client',
        'openid profile offline_access',
        eventId
      );
      
      // Revoke token multiple times
      authRepo.revokeRefreshToken(refreshToken.token);
      authRepo.revokeRefreshToken(refreshToken.token);
      authRepo.revokeRefreshToken(refreshToken.token);
      
      // Should still be revoked
      const retrievedToken = authRepo.getRefreshToken(refreshToken.token);
      assert.strictEqual(retrievedToken.revoked, true);
    });
  });

  describe('OAuth Flow Integration', () => {
    test('should support complete authorization code flow', () => {
      const user = authRepo.createUser();
      const eventId = crypto.randomUUID();
      
      // Create authorization code
      const code = authRepo.createAuthorizationCode(
        'test-client',
        'http://localhost:3000/callback',
        'test-challenge',
        'S256',
        user.id,
        eventId,
        'openid profile offline_access'
      );
      
      // Retrieve and verify code
      const retrievedCode = authRepo.getAuthorizationCode(code);
      assert.ok(retrievedCode);
      assert.strictEqual(retrievedCode.user_id, user.id);
      assert.strictEqual(retrievedCode.event_id, eventId);
      
      // Create refresh token
      const refreshToken = authRepo.createRefreshToken(
        retrievedCode.user_id,
        retrievedCode.client_id,
        retrievedCode.scope,
        retrievedCode.event_id
      );
      
      // Verify refresh token
      const retrievedToken = authRepo.getRefreshToken(refreshToken.token);
      assert.ok(retrievedToken);
      assert.strictEqual(retrievedToken.user_id, user.id);
      assert.strictEqual(retrievedToken.event_id, eventId);
      
      // Delete authorization code (consumed)
      authRepo.deleteAuthorizationCode(code);
      assert.strictEqual(authRepo.getAuthorizationCode(code), null);
      
      // Refresh token should still be valid
      const stillValidToken = authRepo.getRefreshToken(refreshToken.token);
      assert.ok(stillValidToken);
      assert.strictEqual(stillValidToken.revoked, false);
    });

    test('should handle token rotation scenario', () => {
      const user = authRepo.createUser();
      const eventId = crypto.randomUUID();
      
      // Create initial refresh token
      const oldToken = authRepo.createRefreshToken(
        user.id,
        'test-client',
        'openid profile offline_access',
        eventId
      );
      
      // Simulate token rotation: revoke old token and create new one
      authRepo.revokeRefreshToken(oldToken.token);
      
      const newToken = authRepo.createRefreshToken(
        user.id,
        'test-client',
        'openid profile offline_access',
        eventId
      );
      
      // Verify old token is revoked
      const retrievedOldToken = authRepo.getRefreshToken(oldToken.token);
      assert.strictEqual(retrievedOldToken.revoked, true);
      
      // Verify new token is valid
      const retrievedNewToken = authRepo.getRefreshToken(newToken.token);
      assert.strictEqual(retrievedNewToken.revoked, false);
      assert.notStrictEqual(retrievedNewToken.token, oldToken.token);
    });

    test('should handle multiple concurrent authorization codes', () => {
      const user = authRepo.createUser();
      const eventId = crypto.randomUUID();
      
      const codes = Array.from({ length: 5 }, (_, index) => 
        authRepo.createAuthorizationCode(
          `client-${index}`,
          `http://localhost:300${index}/callback`,
          `challenge-${index}`,
          'S256',
          user.id,
          eventId,
          'openid profile'
        )
      );
      
      // All codes should be retrievable
      codes.forEach((code, index) => {
        const retrievedCode = authRepo.getAuthorizationCode(code);
        assert.ok(retrievedCode);
        assert.strictEqual(retrievedCode.client_id, `client-${index}`);
        assert.strictEqual(retrievedCode.code_challenge, `challenge-${index}`);
      });
      
      // Delete one code, others should remain
      authRepo.deleteAuthorizationCode(codes[2]);
      
      codes.forEach((code, index) => {
        const retrievedCode = authRepo.getAuthorizationCode(code);
        if (index === 2) {
          assert.strictEqual(retrievedCode, null);
        } else {
          assert.ok(retrievedCode);
        }
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle invalid user IDs in authorization codes', () => {
      const eventId = crypto.randomUUID();
      
      assert.throws(() => {
        authRepo.createAuthorizationCode(
          'test-client',
          'http://localhost:3000/callback',
          'test-challenge',
          'S256',
          'invalid-user-id',
          eventId,
          'openid profile'
        );
      });
    });

    test('should handle invalid user IDs in refresh tokens', () => {
      const eventId = crypto.randomUUID();
      
      assert.throws(() => {
        authRepo.createRefreshToken(
          'invalid-user-id',
          'test-client',
          'openid profile offline_access',
          eventId
        );
      });
    });

    test('should handle very long scope values', () => {
      const user = authRepo.createUser();
      const eventId = crypto.randomUUID();
      const longScope = 'openid profile email ' + 'custom-scope '.repeat(100);
      
      const code = authRepo.createAuthorizationCode(
        'test-client',
        'http://localhost:3000/callback',
        'test-challenge',
        'S256',
        user.id,
        eventId,
        longScope
      );
      
      const retrievedCode = authRepo.getAuthorizationCode(code);
      assert.strictEqual(retrievedCode.scope, longScope);
    });

    test('should handle special characters in client IDs and URIs', () => {
      const user = authRepo.createUser();
      const eventId = crypto.randomUUID();
      const specialClientId = 'client-with-special-chars_123';
      const specialUri = 'https://example.com/callback?param=value&other=123';
      
      const code = authRepo.createAuthorizationCode(
        specialClientId,
        specialUri,
        'test-challenge',
        'S256',
        user.id,
        eventId,
        'openid profile'
      );
      
      const retrievedCode = authRepo.getAuthorizationCode(code);
      assert.strictEqual(retrievedCode.client_id, specialClientId);
      assert.strictEqual(retrievedCode.redirect_uri, specialUri);
    });
  });
});

console.log('✅ Authentication repository unit tests completed successfully');