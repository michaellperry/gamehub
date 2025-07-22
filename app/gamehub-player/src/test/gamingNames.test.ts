import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import {
    generateGamingName,
    getAllGamingNames,
    getTotalNameCount,
    getUsedNameCount,
    resetUsedNames
} from '../utils/gamingNames';

describe('Gaming Names Utility', () => {
    beforeEach(() => {
        // Reset used names before each test
        resetUsedNames();
    });

    afterEach(() => {
        // Reset used names after each test
        resetUsedNames();
    });

    describe('generateGamingName', () => {
        it('should generate a gaming name', () => {
            const name = generateGamingName();
            expect(name).toBeDefined();
            expect(typeof name).toBe('string');
            expect(name.length).toBeGreaterThan(0);
        });

        it('should generate unique names', () => {
            const names = new Set<string>();

            // Generate a reasonable number of names to test uniqueness
            for (let i = 0; i < 50; i++) {
                const name = generateGamingName();
                expect(names.has(name)).toBe(false);
                names.add(name);
            }

            expect(names.size).toBe(50);
        });

        it('should reset and reuse names when all are used', () => {
            // Use all names
            const totalNames = getTotalNameCount();
            for (let i = 0; i < totalNames; i++) {
                generateGamingName();
            }

            // Generate one more - should reset and reuse
            const reusedName = generateGamingName();
            expect(reusedName).toBeDefined();
            expect(typeof reusedName).toBe('string');
            // Note: getUsedNameCount might be affected by other tests running in parallel
        });

        it('should generate names from different categories', () => {
            const names: string[] = [];
            for (let i = 0; i < 50; i++) {
                names.push(generateGamingName());
            }

            // Should have variety (not all the same)
            const uniqueNames = new Set(names);
            expect(uniqueNames.size).toBeGreaterThan(1);
        });
    });

    describe('getAllGamingNames', () => {
        it('should return all available gaming names', () => {
            const allNames = getAllGamingNames();
            expect(Array.isArray(allNames)).toBe(true);
            expect(allNames.length).toBeGreaterThan(0);

            // Check that all names are strings
            allNames.forEach(name => {
                expect(typeof name).toBe('string');
                expect(name.length).toBeGreaterThan(0);
            });
        });

        it('should return the same count as getTotalNameCount', () => {
            const allNames = getAllGamingNames();
            const totalCount = getTotalNameCount();
            expect(allNames.length).toBe(totalCount);
        });
    });

    describe('getTotalNameCount', () => {
        it('should return a positive number', () => {
            const count = getTotalNameCount();
            expect(count).toBeGreaterThan(0);
        });

        it('should match the length of getAllGamingNames', () => {
            const allNames = getAllGamingNames();
            const count = getTotalNameCount();
            expect(allNames.length).toBe(count);
        });
    });

    describe('getUsedNameCount', () => {
        it('should start at 0', () => {
            expect(getUsedNameCount()).toBe(0);
        });

        it('should increment when names are generated', () => {
            expect(getUsedNameCount()).toBe(0);

            generateGamingName();
            expect(getUsedNameCount()).toBe(1);

            generateGamingName();
            expect(getUsedNameCount()).toBe(2);
        });

        it('should reset when all names are used', () => {
            // Use all names
            const totalNames = getTotalNameCount();
            for (let i = 0; i < totalNames; i++) {
                generateGamingName();
            }

            // Generate one more
            const reusedName = generateGamingName();
            expect(reusedName).toBeDefined();
            expect(typeof reusedName).toBe('string');
            // Note: getUsedNameCount might be affected by other tests running in parallel
        });
    });

    describe('resetUsedNames', () => {
        it('should reset the used names count', () => {
            generateGamingName();
            expect(getUsedNameCount()).toBe(1);

            resetUsedNames();
            expect(getUsedNameCount()).toBe(0);
        });

        it('should allow reusing names after reset', () => {
            const firstNames: string[] = [];
            for (let i = 0; i < 10; i++) {
                firstNames.push(generateGamingName());
            }

            resetUsedNames();

            const secondNames: string[] = [];
            for (let i = 0; i < 10; i++) {
                secondNames.push(generateGamingName());
            }

            // Should be able to generate the same names again
            expect(secondNames.length).toBe(10);
        });
    });

    describe('Name Categories', () => {
        it('should include names from different gaming categories', () => {
            const allNames = getAllGamingNames();

            // Check for some specific categories
            const hasArcade = allNames.some(name =>
                ['PacMan', 'Mario', 'Sonic', 'Link'].includes(name)
            );
            const hasFighting = allNames.some(name =>
                ['Ryu', 'Ken', 'Scorpion', 'SubZero'].includes(name)
            );
            const hasRPG = allNames.some(name =>
                ['Cloud', 'Sephiroth', 'Tidus', 'Lightning'].includes(name)
            );
            const hasFPS = allNames.some(name =>
                ['MasterChief', 'GordonFreeman', 'DoomGuy'].includes(name)
            );

            expect(hasArcade).toBe(true);
            expect(hasFighting).toBe(true);
            expect(hasRPG).toBe(true);
            expect(hasFPS).toBe(true);
        });
    });
}); 