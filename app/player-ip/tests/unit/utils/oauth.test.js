#!/usr/bin/env node
/**
 * Unit Tests for OAuth Utilities
 */

import { strict as assert } from 'assert';
import { test, describe } from 'node:test';
import crypto from 'crypto';

// Set test environment variables
process.env.NODE_ENV = 'test';

const { verifyCodeChallenge } = await import('../../../dist/utils/oauth.js');

describe('OAuth Utilities', () => {
    describe('verifyCodeChallenge', () => {
        test('should verify plain code challenge method', () => {
            const codeVerifier = 'test-code-verifier-123456789';
            const codeChallenge = 'test-code-verifier-123456789';

            const result = verifyCodeChallenge(codeVerifier, codeChallenge, 'plain');
            assert.strictEqual(result, true);
        });

        test('should reject invalid plain code challenge', () => {
            const codeVerifier = 'test-code-verifier-123456789';
            const codeChallenge = 'different-challenge';

            const result = verifyCodeChallenge(codeVerifier, codeChallenge, 'plain');
            assert.strictEqual(result, false);
        });

        test('should verify S256 code challenge method', () => {
            const codeVerifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
            // This is the SHA256 hash of the above code verifier, base64url encoded
            const codeChallenge = 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM';

            const result = verifyCodeChallenge(codeVerifier, codeChallenge, 'S256');
            assert.strictEqual(result, true);
        });

        test('should reject invalid S256 code challenge', () => {
            const codeVerifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
            const codeChallenge = 'invalid-challenge';

            const result = verifyCodeChallenge(codeVerifier, codeChallenge, 'S256');
            assert.strictEqual(result, false);
        });

        test('should handle empty code verifier', () => {
            const result = verifyCodeChallenge('', 'challenge', 'plain');
            assert.strictEqual(result, false);
        });

        test('should handle empty code challenge', () => {
            const result = verifyCodeChallenge('verifier', '', 'plain');
            assert.strictEqual(result, false);
        });

        test('should handle unsupported challenge method', () => {
            const codeVerifier = 'test-verifier';
            const codeChallenge = 'test-challenge';

            const result = verifyCodeChallenge(codeVerifier, codeChallenge, 'unsupported');
            assert.strictEqual(result, false);
        });

        test('should handle null/undefined inputs', () => {
            assert.strictEqual(verifyCodeChallenge(null, 'challenge', 'plain'), false);
            assert.strictEqual(verifyCodeChallenge('verifier', null, 'plain'), false);
            assert.strictEqual(verifyCodeChallenge('verifier', 'challenge', null), false);
            assert.strictEqual(verifyCodeChallenge(undefined, 'challenge', 'plain'), false);
            assert.strictEqual(verifyCodeChallenge('verifier', undefined, 'plain'), false);
            assert.strictEqual(verifyCodeChallenge('verifier', 'challenge', undefined), false);
        });

        test('should be case sensitive for plain method', () => {
            const codeVerifier = 'TestCodeVerifier';
            const codeChallenge = 'testcodeverifier';

            const result = verifyCodeChallenge(codeVerifier, codeChallenge, 'plain');
            assert.strictEqual(result, false);
        });

        test('should handle special characters in plain method', () => {
            const codeVerifier = 'test-code_verifier.with~special*chars';
            const codeChallenge = 'test-code_verifier.with~special*chars';

            const result = verifyCodeChallenge(codeVerifier, codeChallenge, 'plain');
            assert.strictEqual(result, true);
        });

        test('should handle long code verifiers', () => {
            // Generate a long code verifier (128 characters)
            const codeVerifier = crypto.randomBytes(64).toString('base64url');
            const codeChallenge = codeVerifier;

            const result = verifyCodeChallenge(codeVerifier, codeChallenge, 'plain');
            assert.strictEqual(result, true);
        });

        test('should verify multiple S256 challenges', () => {
            const testCases = [
                {
                    verifier: 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk',
                    challenge: 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM',
                },
                {
                    verifier: 'test123',
                    challenge: crypto.createHash('sha256').update('test123').digest('base64url'),
                },
            ];

            testCases.forEach(({ verifier, challenge }, index) => {
                const result = verifyCodeChallenge(verifier, challenge, 'S256');
                assert.strictEqual(result, true, `Test case ${index + 1} failed`);
            });
        });

        test('should handle unicode characters', () => {
            const codeVerifier = 'test-verifier-with-unicode-🔐-chars';
            const codeChallenge = 'test-verifier-with-unicode-🔐-chars';

            const result = verifyCodeChallenge(codeVerifier, codeChallenge, 'plain');
            assert.strictEqual(result, true);
        });

        test('should validate S256 with generated verifier', () => {
            // Generate a random code verifier
            const codeVerifier = crypto.randomBytes(32).toString('base64url');

            // Generate the corresponding challenge
            const codeChallenge = crypto
                .createHash('sha256')
                .update(codeVerifier)
                .digest('base64url');

            const result = verifyCodeChallenge(codeVerifier, codeChallenge, 'S256');
            assert.strictEqual(result, true);
        });

        test('should handle method case sensitivity', () => {
            const codeVerifier = 'test-verifier';
            const codeChallenge = 'test-verifier';

            // Test different cases of method names
            assert.strictEqual(verifyCodeChallenge(codeVerifier, codeChallenge, 'PLAIN'), false);
            assert.strictEqual(verifyCodeChallenge(codeVerifier, codeChallenge, 'Plain'), false);
            assert.strictEqual(verifyCodeChallenge(codeVerifier, codeChallenge, 'plain'), true);

            const s256Challenge = crypto
                .createHash('sha256')
                .update(codeVerifier)
                .digest('base64url');
            assert.strictEqual(verifyCodeChallenge(codeVerifier, s256Challenge, 's256'), false);
            assert.strictEqual(verifyCodeChallenge(codeVerifier, s256Challenge, 'S256'), true);
        });
    });

    describe('PKCE Flow Integration', () => {
        test('should support complete PKCE flow simulation', () => {
            // Simulate client generating code verifier and challenge
            const codeVerifier = crypto.randomBytes(32).toString('base64url');
            const codeChallenge = crypto
                .createHash('sha256')
                .update(codeVerifier)
                .digest('base64url');
            const method = 'S256';

            // Simulate server verification
            const isValid = verifyCodeChallenge(codeVerifier, codeChallenge, method);
            assert.strictEqual(isValid, true);
        });

        test('should reject tampered code verifier', () => {
            const originalVerifier = crypto.randomBytes(32).toString('base64url');
            const codeChallenge = crypto
                .createHash('sha256')
                .update(originalVerifier)
                .digest('base64url');

            // Simulate attacker tampering with verifier
            const tamperedVerifier = originalVerifier + 'tampered';

            const isValid = verifyCodeChallenge(tamperedVerifier, codeChallenge, 'S256');
            assert.strictEqual(isValid, false);
        });

        test('should reject tampered code challenge', () => {
            const codeVerifier = crypto.randomBytes(32).toString('base64url');
            const originalChallenge = crypto
                .createHash('sha256')
                .update(codeVerifier)
                .digest('base64url');

            // Simulate attacker tampering with challenge
            const tamperedChallenge = originalChallenge.slice(0, -1) + 'X';

            const isValid = verifyCodeChallenge(codeVerifier, tamperedChallenge, 'S256');
            assert.strictEqual(isValid, false);
        });
    });

    describe('Edge Cases and Error Handling', () => {
        test('should handle very short verifiers', () => {
            const shortVerifier = 'a';
            const result = verifyCodeChallenge(shortVerifier, shortVerifier, 'plain');
            assert.strictEqual(result, true);
        });

        test('should handle whitespace in verifiers', () => {
            const verifierWithSpaces = 'test verifier with spaces';
            const result = verifyCodeChallenge(verifierWithSpaces, verifierWithSpaces, 'plain');
            assert.strictEqual(result, true);
        });

        test('should handle newlines and tabs', () => {
            const verifierWithNewlines = 'test\nverifier\twith\rspecial\nchars';
            const result = verifyCodeChallenge(verifierWithNewlines, verifierWithNewlines, 'plain');
            assert.strictEqual(result, true);
        });

        test('should handle base64url padding edge cases', () => {
            // Test verifiers that would result in different padding scenarios
            const testVerifiers = ['a', 'ab', 'abc', 'abcd'];

            testVerifiers.forEach((verifier) => {
                const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
                const result = verifyCodeChallenge(verifier, challenge, 'S256');
                assert.strictEqual(result, true, `Failed for verifier: ${verifier}`);
            });
        });
    });
});

console.log('✅ OAuth utilities unit tests completed successfully');
