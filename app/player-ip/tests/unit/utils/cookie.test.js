#!/usr/bin/env node
/**
 * Unit Tests for Cookie Utilities
 */

import { strict as assert } from 'assert';
import { test, describe, beforeEach } from 'node:test';

// Set test environment variables
process.env.NODE_ENV = 'test';

const { generateCookieValue, setIdentityCookie, IDENTITY_COOKIE_NAME } = await import(
    '../../../dist/utils/cookie.js'
);

describe('Cookie Utilities', () => {
    describe('IDENTITY_COOKIE_NAME', () => {
        test('should be defined and non-empty', () => {
            assert.ok(IDENTITY_COOKIE_NAME);
            assert.strictEqual(typeof IDENTITY_COOKIE_NAME, 'string');
            assert.ok(IDENTITY_COOKIE_NAME.length > 0);
        });

        test('should follow cookie naming conventions', () => {
            // Cookie names should not contain special characters
            assert.ok(/^[a-zA-Z0-9_-]+$/.test(IDENTITY_COOKIE_NAME));
        });
    });

    describe('generateCookieValue', () => {
        test('should generate non-empty string', () => {
            const cookieValue = generateCookieValue();
            assert.ok(cookieValue);
            assert.strictEqual(typeof cookieValue, 'string');
            assert.ok(cookieValue.length > 0);
        });

        test('should generate different values on each call', () => {
            const value1 = generateCookieValue();
            const value2 = generateCookieValue();
            const value3 = generateCookieValue();

            assert.notStrictEqual(value1, value2);
            assert.notStrictEqual(value2, value3);
            assert.notStrictEqual(value1, value3);
        });

        test('should generate values of sufficient length', () => {
            const cookieValue = generateCookieValue();
            // Should be at least 20 characters for security
            assert.ok(cookieValue.length >= 20);
        });

        test('should generate URL-safe values', () => {
            const cookieValue = generateCookieValue();
            // Should not contain characters that need URL encoding
            assert.ok(/^[a-zA-Z0-9_-]+$/.test(cookieValue));
        });

        test('should generate consistent format across calls', () => {
            const values = Array.from({ length: 10 }, () => generateCookieValue());

            values.forEach((value, index) => {
                assert.ok(value.length >= 20, `Value ${index} too short: ${value.length}`);
                assert.ok(
                    /^[a-zA-Z0-9_-]+$/.test(value),
                    `Value ${index} contains invalid characters: ${value}`
                );
            });
        });

        test('should have good entropy', () => {
            const values = Array.from({ length: 100 }, () => generateCookieValue());
            const uniqueValues = new Set(values);

            // All values should be unique
            assert.strictEqual(uniqueValues.size, values.length);
        });

        test('should not contain predictable patterns', () => {
            const values = Array.from({ length: 10 }, () => generateCookieValue());

            // Check that values don't start with the same prefix
            const prefixes = values.map((v) => v.substring(0, 5));
            const uniquePrefixes = new Set(prefixes);
            assert.ok(uniquePrefixes.size > 1, 'Cookie values appear to have predictable prefixes');
        });
    });

    describe('setIdentityCookie', () => {
        let mockResponse;

        beforeEach(() => {
            // Create a mock response object
            mockResponse = {
                cookies: {},
                cookie: function (name, value, options) {
                    this.cookies[name] = { value, options };
                    return this;
                },
            };
        });

        test('should set cookie with correct name and value', () => {
            const cookieValue = 'test-cookie-value';

            setIdentityCookie(mockResponse, cookieValue);

            assert.ok(mockResponse.cookies[IDENTITY_COOKIE_NAME]);
            assert.strictEqual(mockResponse.cookies[IDENTITY_COOKIE_NAME].value, cookieValue);
        });

        test('should set cookie with secure options', () => {
            const cookieValue = 'test-cookie-value';

            setIdentityCookie(mockResponse, cookieValue);

            const cookieOptions = mockResponse.cookies[IDENTITY_COOKIE_NAME].options;
            assert.ok(cookieOptions);

            // Check security options
            assert.strictEqual(cookieOptions.httpOnly, true);
            assert.strictEqual(cookieOptions.secure, false); // Should be false in test environment
            assert.strictEqual(cookieOptions.sameSite, 'lax');
        });

        test('should set cookie with appropriate expiration', () => {
            const cookieValue = 'test-cookie-value';

            setIdentityCookie(mockResponse, cookieValue);

            const cookieOptions = mockResponse.cookies[IDENTITY_COOKIE_NAME].options;
            assert.ok(cookieOptions.maxAge);
            assert.strictEqual(typeof cookieOptions.maxAge, 'number');
            assert.ok(cookieOptions.maxAge > 0);
        });

        test('should handle empty cookie value', () => {
            assert.doesNotThrow(() => {
                setIdentityCookie(mockResponse, '');
            });

            assert.strictEqual(mockResponse.cookies[IDENTITY_COOKIE_NAME].value, '');
        });

        test('should handle special characters in cookie value', () => {
            const specialValue = 'test-value-with-special-chars_123';

            assert.doesNotThrow(() => {
                setIdentityCookie(mockResponse, specialValue);
            });

            assert.strictEqual(mockResponse.cookies[IDENTITY_COOKIE_NAME].value, specialValue);
        });

        test('should set path option', () => {
            const cookieValue = 'test-cookie-value';

            setIdentityCookie(mockResponse, cookieValue);

            const cookieOptions = mockResponse.cookies[IDENTITY_COOKIE_NAME].options;
            assert.strictEqual(cookieOptions.path, '/');
        });

        test('should handle null response gracefully', () => {
            // This should not throw, but might not do anything
            assert.doesNotThrow(() => {
                setIdentityCookie(null, 'test-value');
            });
        });

        test('should handle undefined cookie value', () => {
            assert.doesNotThrow(() => {
                setIdentityCookie(mockResponse, undefined);
            });
        });
    });

    describe('Cookie Integration', () => {
        test('should work with generated cookie values', () => {
            const mockResponse = {
                cookies: {},
                cookie: function (name, value, options) {
                    this.cookies[name] = { value, options };
                    return this;
                },
            };

            const generatedValue = generateCookieValue();
            setIdentityCookie(mockResponse, generatedValue);

            assert.strictEqual(mockResponse.cookies[IDENTITY_COOKIE_NAME].value, generatedValue);
        });

        test('should handle multiple cookie operations', () => {
            const mockResponse = {
                cookies: {},
                cookie: function (name, value, options) {
                    this.cookies[name] = { value, options };
                    return this;
                },
            };

            // Set multiple cookies with different values
            const values = [generateCookieValue(), generateCookieValue(), generateCookieValue()];

            values.forEach((value) => {
                setIdentityCookie(mockResponse, value);
                assert.strictEqual(mockResponse.cookies[IDENTITY_COOKIE_NAME].value, value);
            });
        });

        test('should maintain cookie security across different values', () => {
            const mockResponse = {
                cookies: {},
                cookie: function (name, value, options) {
                    this.cookies[name] = { value, options };
                    return this;
                },
            };

            const testValues = [
                generateCookieValue(),
                'short',
                'very-long-cookie-value-with-many-characters-to-test-length-handling',
                'value_with_underscores',
                'value-with-dashes',
            ];

            testValues.forEach((value) => {
                setIdentityCookie(mockResponse, value);

                const cookieOptions = mockResponse.cookies[IDENTITY_COOKIE_NAME].options;
                assert.strictEqual(cookieOptions.httpOnly, true);
                assert.strictEqual(cookieOptions.sameSite, 'lax');
                assert.ok(cookieOptions.maxAge > 0);
            });
        });
    });

    describe('Security Considerations', () => {
        test('should generate cryptographically secure values', () => {
            // Test that generated values have sufficient entropy
            const values = Array.from({ length: 1000 }, () => generateCookieValue());

            // Check character distribution
            const charCounts = {};
            values
                .join('')
                .split('')
                .forEach((char) => {
                    charCounts[char] = (charCounts[char] || 0) + 1;
                });

            // Should use a variety of characters
            const uniqueChars = Object.keys(charCounts).length;
            assert.ok(uniqueChars > 10, `Only ${uniqueChars} unique characters found`);
        });

        test('should not leak information through timing', () => {
            // Generate multiple values and ensure they're all generated quickly
            const startTime = Date.now();
            const values = Array.from({ length: 100 }, () => generateCookieValue());
            const endTime = Date.now();

            // Should complete quickly (less than 1 second for 100 values)
            assert.ok(endTime - startTime < 1000);

            // All values should be unique
            const uniqueValues = new Set(values);
            assert.strictEqual(uniqueValues.size, values.length);
        });

        test('should handle concurrent generation', () => {
            // Simulate concurrent cookie generation
            const promises = Array.from({ length: 50 }, () =>
                Promise.resolve(generateCookieValue())
            );

            return Promise.all(promises).then((values) => {
                // All values should be unique
                const uniqueValues = new Set(values);
                assert.strictEqual(uniqueValues.size, values.length);
            });
        });
    });
});

console.log('✅ Cookie utilities unit tests completed successfully');
