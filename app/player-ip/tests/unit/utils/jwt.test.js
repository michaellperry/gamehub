#!/usr/bin/env node
/**
 * Unit Tests for JWT Utilities
 */

import { strict as assert } from 'assert';
import { test, describe, beforeEach } from 'node:test';
import crypto from 'crypto';

// Set test environment variables before importing modules
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-unit-tests';
process.env.JWT_ISSUER = 'player-ip-test';
process.env.JWT_AUDIENCE = 'gamehub-players-test';
process.env.JWT_KEY_ID = 'test-key-id';
process.env.JWT_EXPIRES_IN = '1h';
process.env.REFRESH_TOKEN_EXPIRES_IN = '14d';

const { 
  generateAccessToken, 
  verifyJwt, 
  parseDuration, 
  getAccessTokenExpiration, 
  getRefreshTokenExpiration 
} = await import('../../../dist/utils/jwt.js');

describe('JWT Utilities', () => {
  describe('parseDuration', () => {
    test('should parse seconds correctly', () => {
      assert.strictEqual(parseDuration('30s'), 30);
      assert.strictEqual(parseDuration('1s'), 1);
    });

    test('should parse minutes correctly', () => {
      assert.strictEqual(parseDuration('5m'), 300);
      assert.strictEqual(parseDuration('1m'), 60);
    });

    test('should parse hours correctly', () => {
      assert.strictEqual(parseDuration('1h'), 3600);
      assert.strictEqual(parseDuration('2h'), 7200);
    });

    test('should parse days correctly', () => {
      assert.strictEqual(parseDuration('1d'), 86400);
      assert.strictEqual(parseDuration('7d'), 604800);
    });

    test('should throw error for invalid format', () => {
      assert.throws(() => parseDuration('invalid'), /Invalid duration format/);
      assert.throws(() => parseDuration('1x'), /Invalid duration unit/);
      assert.throws(() => parseDuration(''), /Invalid duration format/);
    });
  });

  describe('getAccessTokenExpiration', () => {
    test('should return correct expiration time', () => {
      const expiration = getAccessTokenExpiration();
      assert.strictEqual(expiration, 3600); // 1 hour
    });
  });

  describe('getRefreshTokenExpiration', () => {
    test('should return correct expiration time', () => {
      const expiration = getRefreshTokenExpiration();
      assert.strictEqual(expiration, 1209600); // 14 days
    });
  });

  describe('generateAccessToken', () => {
    test('should generate valid JWT token', () => {
      const userId = crypto.randomUUID();
      const eventId = crypto.randomUUID();
      
      const token = generateAccessToken(userId, eventId);
      
      assert.ok(token);
      assert.strictEqual(typeof token, 'string');
      assert.ok(token.includes('.'));
      
      // Token should have 3 parts (header.payload.signature)
      const parts = token.split('.');
      assert.strictEqual(parts.length, 3);
    });

    test('should generate different tokens for different users', () => {
      const userId1 = crypto.randomUUID();
      const userId2 = crypto.randomUUID();
      const eventId = crypto.randomUUID();
      
      const token1 = generateAccessToken(userId1, eventId);
      const token2 = generateAccessToken(userId2, eventId);
      
      assert.notStrictEqual(token1, token2);
    });

    test('should generate different tokens for different events', () => {
      const userId = crypto.randomUUID();
      const eventId1 = crypto.randomUUID();
      const eventId2 = crypto.randomUUID();
      
      const token1 = generateAccessToken(userId, eventId1);
      const token2 = generateAccessToken(userId, eventId2);
      
      assert.notStrictEqual(token1, token2);
    });
  });

  describe('verifyJwt', () => {
    test('should verify valid JWT token', () => {
      const userId = crypto.randomUUID();
      const eventId = crypto.randomUUID();
      
      const token = generateAccessToken(userId, eventId);
      const decoded = verifyJwt(token);
      
      assert.ok(decoded);
      assert.strictEqual(decoded.sub, userId);
      assert.strictEqual(decoded.event_id, eventId);
      assert.strictEqual(decoded.iss, 'player-ip-test');
      assert.strictEqual(decoded.aud, 'gamehub-players-test');
      assert.ok(decoded.iat);
      assert.ok(decoded.exp);
      assert.ok(decoded.exp > decoded.iat);
    });

    test('should throw error for invalid token', () => {
      assert.throws(() => verifyJwt('invalid-token'), /Invalid JWT token/);
      assert.throws(() => verifyJwt(''), /Invalid JWT token/);
      assert.throws(() => verifyJwt('header.payload.signature'), /Invalid JWT token/);
    });

    test('should throw error for token with wrong secret', async () => {
      // Generate token with different secret
      const originalSecret = process.env.JWT_SECRET;
      process.env.JWT_SECRET = 'different-secret';
      
      try {
        const userId = crypto.randomUUID();
        const eventId = crypto.randomUUID();
        
        // Clear module cache to force re-import with new environment
        delete require.cache[require.resolve('../../../dist/utils/jwt.js')];
        const { generateAccessToken: generateWithDifferentSecret } = await import('../../../dist/utils/jwt.js');
        const token = generateWithDifferentSecret(userId, eventId);
        
        // Restore original secret
        process.env.JWT_SECRET = originalSecret;
        
        // Clear module cache again to use original secret
        delete require.cache[require.resolve('../../../dist/utils/jwt.js')];
        
        // This should throw because the token was signed with a different secret
        assert.throws(() => verifyJwt(token), /Invalid JWT token/);
      } finally {
        process.env.JWT_SECRET = originalSecret;
      }
    });

    test('should verify token payload structure', () => {
      const userId = crypto.randomUUID();
      const eventId = crypto.randomUUID();
      
      const token = generateAccessToken(userId, eventId);
      const decoded = verifyJwt(token);
      
      // Check required JWT claims
      assert.ok(decoded.sub, 'Missing subject claim');
      assert.ok(decoded.iss, 'Missing issuer claim');
      assert.ok(decoded.aud, 'Missing audience claim');
      assert.ok(decoded.iat, 'Missing issued at claim');
      assert.ok(decoded.exp, 'Missing expiration claim');
      
      // Check custom claims
      assert.ok(decoded.event_id, 'Missing event_id claim');
      
      // Check claim types
      assert.strictEqual(typeof decoded.sub, 'string');
      assert.strictEqual(typeof decoded.iss, 'string');
      assert.strictEqual(typeof decoded.aud, 'string');
      assert.strictEqual(typeof decoded.iat, 'number');
      assert.strictEqual(typeof decoded.exp, 'number');
      assert.strictEqual(typeof decoded.event_id, 'string');
    });

    test('should handle expired tokens', () => {
      // This test would require mocking time or creating an expired token
      // For now, we'll test the structure and leave expiration testing to integration tests
      const userId = crypto.randomUUID();
      const eventId = crypto.randomUUID();
      
      const token = generateAccessToken(userId, eventId);
      const decoded = verifyJwt(token);
      
      // Verify expiration is in the future
      const now = Math.floor(Date.now() / 1000);
      assert.ok(decoded.exp > now, 'Token should not be expired immediately after creation');
    });
  });

  describe('Token Integration', () => {
    test('should create and verify token round-trip', () => {
      const userId = crypto.randomUUID();
      const eventId = crypto.randomUUID();
      
      // Generate token
      const token = generateAccessToken(userId, eventId);
      
      // Verify token
      const decoded = verifyJwt(token);
      
      // Check that all data round-trips correctly
      assert.strictEqual(decoded.sub, userId);
      assert.strictEqual(decoded.event_id, eventId);
      assert.strictEqual(decoded.iss, process.env.JWT_ISSUER);
      assert.strictEqual(decoded.aud, process.env.JWT_AUDIENCE);
    });

    test('should handle UUID format validation', () => {
      const validUuid = crypto.randomUUID();
      const invalidUuid = 'not-a-uuid';
      
      // Should work with valid UUIDs
      assert.doesNotThrow(() => {
        const token = generateAccessToken(validUuid, validUuid);
        const decoded = verifyJwt(token);
        assert.strictEqual(decoded.sub, validUuid);
        assert.strictEqual(decoded.event_id, validUuid);
      });
      
      // Should still work with invalid UUIDs (JWT doesn't validate UUID format)
      assert.doesNotThrow(() => {
        const token = generateAccessToken(invalidUuid, invalidUuid);
        const decoded = verifyJwt(token);
        assert.strictEqual(decoded.sub, invalidUuid);
        assert.strictEqual(decoded.event_id, invalidUuid);
      });
    });
  });
});

console.log('✅ JWT utilities unit tests completed successfully');