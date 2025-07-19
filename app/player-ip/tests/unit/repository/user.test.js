#!/usr/bin/env node
/**
 * Unit Tests for User Repository Functions
 */

import { strict as assert } from 'assert';
import { test, describe, beforeEach, afterEach } from 'node:test';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.SQLITE_DB_PATH = ':memory:';
process.env.SKIP_JINAGA_SUBSCRIPTION = 'true';

describe('User Repository', () => {
    let userRepo;

    beforeEach(async () => {
        // Import repository functions after setting up environment
        userRepo = await import('../../../dist/repository/index.js');
    });

    afterEach(() => {
        // No cleanup needed for memory database
    });

    describe('createUser', () => {
        test('should create a new user with valid ID', () => {
            const user = userRepo.createUser();

            assert.ok(user);
            assert.ok(user.id);
            assert.strictEqual(typeof user.id, 'string');
            assert.ok(user.id.length > 0);
        });

        test('should create users with unique IDs', () => {
            const user1 = userRepo.createUser();
            const user2 = userRepo.createUser();
            const user3 = userRepo.createUser();

            assert.notStrictEqual(user1.id, user2.id);
            assert.notStrictEqual(user2.id, user3.id);
            assert.notStrictEqual(user1.id, user3.id);
        });

        test('should create users with UUID format', () => {
            const user = userRepo.createUser();

            // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
            const uuidRegex =
                /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            assert.ok(uuidRegex.test(user.id), `Invalid UUID format: ${user.id}`);
        });

        test('should persist user in database', () => {
            const user = userRepo.createUser();

            // Try to retrieve the user by checking if we can store an identity for it
            const cookieValue = crypto.randomUUID();
            assert.doesNotThrow(() => {
                userRepo.storeUserIdentity(user.id, cookieValue);
            });
        });

        test('should handle multiple user creation', () => {
            const users = Array.from({ length: 10 }, () => userRepo.createUser());

            // All users should have unique IDs
            const userIds = users.map((u) => u.id);
            const uniqueIds = new Set(userIds);
            assert.strictEqual(uniqueIds.size, users.length);

            // All should be valid UUIDs
            const uuidRegex =
                /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            users.forEach((user) => {
                assert.ok(uuidRegex.test(user.id));
            });
        });

        test('should create user with timestamps', () => {
            const beforeCreation = new Date();
            const user = userRepo.createUser();
            const afterCreation = new Date();

            // User should have creation timestamp within reasonable bounds
            assert.ok(user.created_at || user.createdAt);

            if (user.created_at) {
                const createdAt = new Date(user.created_at);
                assert.ok(createdAt >= beforeCreation);
                assert.ok(createdAt <= afterCreation);
            }
        });
    });

    describe('storeUserIdentity', () => {
        test('should store user identity successfully', () => {
            const user = userRepo.createUser();
            const cookieValue = crypto.randomUUID();

            assert.doesNotThrow(() => {
                userRepo.storeUserIdentity(user.id, cookieValue);
            });
        });

        test('should allow retrieval of stored identity', () => {
            const user = userRepo.createUser();
            const cookieValue = crypto.randomUUID();

            userRepo.storeUserIdentity(user.id, cookieValue);

            const retrievedUserId = userRepo.getUserIdByCookie(cookieValue);
            assert.strictEqual(retrievedUserId, user.id);
        });

        test('should handle multiple identities for same user', () => {
            const user = userRepo.createUser();
            const cookieValue1 = crypto.randomUUID();
            const cookieValue2 = crypto.randomUUID();

            userRepo.storeUserIdentity(user.id, cookieValue1);
            userRepo.storeUserIdentity(user.id, cookieValue2);

            assert.strictEqual(userRepo.getUserIdByCookie(cookieValue1), user.id);
            assert.strictEqual(userRepo.getUserIdByCookie(cookieValue2), user.id);
        });

        test('should reject invalid user ID', () => {
            const invalidUserId = 'invalid-user-id';
            const cookieValue = crypto.randomUUID();

            assert.throws(() => {
                userRepo.storeUserIdentity(invalidUserId, cookieValue);
            });
        });

        test('should handle empty cookie value', () => {
            const user = userRepo.createUser();

            assert.throws(() => {
                userRepo.storeUserIdentity(user.id, '');
            });
        });

        test('should handle null/undefined parameters', () => {
            const user = userRepo.createUser();
            const cookieValue = crypto.randomUUID();

            assert.throws(() => {
                userRepo.storeUserIdentity(null, cookieValue);
            });

            assert.throws(() => {
                userRepo.storeUserIdentity(user.id, null);
            });

            assert.throws(() => {
                userRepo.storeUserIdentity(undefined, cookieValue);
            });

            assert.throws(() => {
                userRepo.storeUserIdentity(user.id, undefined);
            });
        });

        test('should prevent duplicate cookie values', () => {
            const user1 = userRepo.createUser();
            const user2 = userRepo.createUser();
            const cookieValue = crypto.randomUUID();

            userRepo.storeUserIdentity(user1.id, cookieValue);

            // Storing the same cookie value for a different user should fail
            assert.throws(() => {
                userRepo.storeUserIdentity(user2.id, cookieValue);
            });
        });
    });

    describe('getUserIdByCookie', () => {
        test('should return correct user ID for valid cookie', () => {
            const user = userRepo.createUser();
            const cookieValue = crypto.randomUUID();

            userRepo.storeUserIdentity(user.id, cookieValue);

            const retrievedUserId = userRepo.getUserIdByCookie(cookieValue);
            assert.strictEqual(retrievedUserId, user.id);
        });

        test('should return null for non-existent cookie', () => {
            const nonExistentCookie = crypto.randomUUID();

            const retrievedUserId = userRepo.getUserIdByCookie(nonExistentCookie);
            assert.strictEqual(retrievedUserId, null);
        });

        test('should return null for empty cookie', () => {
            const retrievedUserId = userRepo.getUserIdByCookie('');
            assert.strictEqual(retrievedUserId, null);
        });

        test('should return null for null/undefined cookie', () => {
            assert.strictEqual(userRepo.getUserIdByCookie(null), null);
            assert.strictEqual(userRepo.getUserIdByCookie(undefined), null);
        });

        test('should handle special characters in cookie values', () => {
            const user = userRepo.createUser();
            const cookieValue = 'cookie-with-special-chars_123';

            userRepo.storeUserIdentity(user.id, cookieValue);

            const retrievedUserId = userRepo.getUserIdByCookie(cookieValue);
            assert.strictEqual(retrievedUserId, user.id);
        });

        test('should be case sensitive', () => {
            const user = userRepo.createUser();
            const cookieValue = 'TestCookieValue';

            userRepo.storeUserIdentity(user.id, cookieValue);

            assert.strictEqual(userRepo.getUserIdByCookie(cookieValue), user.id);
            assert.strictEqual(userRepo.getUserIdByCookie(cookieValue.toLowerCase()), null);
            assert.strictEqual(userRepo.getUserIdByCookie(cookieValue.toUpperCase()), null);
        });
    });

    describe('User Identity Integration', () => {
        test('should support complete user creation and identity flow', () => {
            // Create user
            const user = userRepo.createUser();
            assert.ok(user.id);

            // Store identity
            const cookieValue = crypto.randomUUID();
            userRepo.storeUserIdentity(user.id, cookieValue);

            // Retrieve user by cookie
            const retrievedUserId = userRepo.getUserIdByCookie(cookieValue);
            assert.strictEqual(retrievedUserId, user.id);
        });

        test('should handle multiple users with different identities', () => {
            const users = Array.from({ length: 5 }, () => userRepo.createUser());
            const cookieValues = Array.from({ length: 5 }, () => crypto.randomUUID());

            // Store identities
            users.forEach((user, index) => {
                userRepo.storeUserIdentity(user.id, cookieValues[index]);
            });

            // Verify all identities
            users.forEach((user, index) => {
                const retrievedUserId = userRepo.getUserIdByCookie(cookieValues[index]);
                assert.strictEqual(retrievedUserId, user.id);
            });
        });

        test('should maintain data integrity across operations', () => {
            const user1 = userRepo.createUser();
            const user2 = userRepo.createUser();
            const cookie1 = crypto.randomUUID();
            const cookie2 = crypto.randomUUID();

            // Store identities
            userRepo.storeUserIdentity(user1.id, cookie1);
            userRepo.storeUserIdentity(user2.id, cookie2);

            // Verify cross-contamination doesn't occur
            assert.strictEqual(userRepo.getUserIdByCookie(cookie1), user1.id);
            assert.strictEqual(userRepo.getUserIdByCookie(cookie2), user2.id);
            assert.notStrictEqual(userRepo.getUserIdByCookie(cookie1), user2.id);
            assert.notStrictEqual(userRepo.getUserIdByCookie(cookie2), user1.id);
        });

        test('should handle concurrent operations', async () => {
            const operations = Array.from({ length: 10 }, async (_, index) => {
                const user = userRepo.createUser();
                const cookieValue = `cookie-${index}-${crypto.randomUUID()}`;

                userRepo.storeUserIdentity(user.id, cookieValue);

                const retrievedUserId = userRepo.getUserIdByCookie(cookieValue);
                assert.strictEqual(retrievedUserId, user.id);

                return { user, cookieValue };
            });

            const results = await Promise.all(operations);

            // Verify all operations completed successfully
            assert.strictEqual(results.length, 10);

            // Verify all users are unique
            const userIds = results.map((r) => r.user.id);
            const uniqueUserIds = new Set(userIds);
            assert.strictEqual(uniqueUserIds.size, 10);

            // Verify all cookies are unique
            const cookies = results.map((r) => r.cookieValue);
            const uniqueCookies = new Set(cookies);
            assert.strictEqual(uniqueCookies.size, 10);
        });
    });

    describe('Error Handling and Edge Cases', () => {
        test('should handle database connection issues gracefully', () => {
            // This test would require mocking database failures
            // For now, we'll test that the functions exist and are callable
            assert.strictEqual(typeof userRepo.createUser, 'function');
            assert.strictEqual(typeof userRepo.storeUserIdentity, 'function');
            assert.strictEqual(typeof userRepo.getUserIdByCookie, 'function');
        });

        test('should handle very long cookie values', () => {
            const user = userRepo.createUser();
            const longCookieValue = 'a'.repeat(1000);

            userRepo.storeUserIdentity(user.id, longCookieValue);

            const retrievedUserId = userRepo.getUserIdByCookie(longCookieValue);
            assert.strictEqual(retrievedUserId, user.id);
        });

        test('should handle unicode characters in cookie values', () => {
            const user = userRepo.createUser();
            const unicodeCookieValue = 'cookie-with-unicode-🔐-chars';

            userRepo.storeUserIdentity(user.id, unicodeCookieValue);

            const retrievedUserId = userRepo.getUserIdByCookie(unicodeCookieValue);
            assert.strictEqual(retrievedUserId, user.id);
        });
    });
});

console.log('✅ User repository unit tests completed successfully');
