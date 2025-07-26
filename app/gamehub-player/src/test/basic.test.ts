import { describe, it, expect } from 'vitest';

describe('Basic Test Suite', () => {
    it('should pass a simple assertion', () => {
        expect(2 + 2).toBe(4);
    });

    it('should handle string operations', () => {
        const message = 'Hello, World!';
        expect(message).toContain('Hello');
        expect(message.length).toBeGreaterThan(0);
    });

    it('should handle array operations', () => {
        const numbers = [1, 2, 3, 4, 5];
        expect(numbers).toHaveLength(5);
        expect(numbers).toContain(3);
        expect(numbers[0]).toBe(1);
    });

    it('should handle object operations', () => {
        const obj = { name: 'Test', value: 42 };
        expect(obj).toHaveProperty('name');
        expect(obj.name).toBe('Test');
        expect(obj.value).toBe(42);
    });

    it('should handle boolean operations', () => {
        expect(true).toBe(true);
        expect(false).toBe(false);
        const a = 1;
        const b = 2;
        expect(a === a).toBe(true);
        expect(a < b).toBe(true);
    });

    it('should handle async operations', async () => {
        const result = await Promise.resolve('async result');
        expect(result).toBe('async result');
    });
}); 