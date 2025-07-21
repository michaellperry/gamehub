import { describe, it, expect, beforeEach } from 'vitest';
import { JinagaTestUtils, TestScenarios } from './jinaga-test-utils';
import { Tenant, Player, Playground, Join } from 'gamehub-model/model';
import { User } from 'jinaga';

describe('Jinaga Test Examples', () => {
    describe('Basic Test Instance', () => {
        it('should create a basic test instance', async () => {
            const jinaga = JinagaTestUtils.createBasicTestInstance(new User('test-user-key'));

            expect(jinaga).toBeDefined();
            expect(typeof jinaga.fact).toBe('function');
        });

        it('should create a test instance without user', () => {
            const jinaga = JinagaTestUtils.createBasicTestInstance();

            expect(jinaga).toBeDefined();
        });
    });

    describe('Test Instance with Pre-initialized State', () => {
        it('should create test instance with initial facts', async () => {
            const user = new User('test-user-key');
            const tenant = new Tenant(user);

            const jinaga = JinagaTestUtils.createTestInstanceWithState(
                [tenant],
                user
            );

            // Verify the tenant was created
            const tenants = await jinaga.query(Tenant);
            expect(tenants).toHaveLength(1);
            expect(tenants[0].creator.publicKey).toBe('test-user-key');
        });
    });

    describe('Tenant Setup Scenarios', () => {
        it('should create a tenant with owner', async () => {
            const { jinaga, tenant, owner } = await TestScenarios.singleUserWithTenant(
                new User('test-owner-key')
            );

            expect(tenant).toBeDefined();
            expect(tenant.creator.publicKey).toBe('test-owner-key');
            expect(owner.publicKey).toBe('test-owner-key');
        });

        it('should create multiple users in a tenant', async () => {
            const users = [
                new User('user-1'),
                new User('user-2'),
                new User('user-3')
            ];

            const { jinaga, users: userFacts } = await TestScenarios.multipleUsersInTenant(users);

            // Verify all users were created
            expect(userFacts).toHaveLength(3);
            expect(userFacts[0].publicKey).toBe('user-1');
            expect(userFacts[1].publicKey).toBe('user-2');
            expect(userFacts[2].publicKey).toBe('user-3');

            // Verify tenant was created
            const tenants = await jinaga.query(Tenant);
            expect(tenants).toHaveLength(1);
        });

        it('should create a tenant with active playground and players', async () => {
            const { jinaga, tenant, owner, players, playground, joins } =
                await TestScenarios.tenantWithActivePlayground(
                    new User('test-owner-key'),
                    3
                );

            expect(tenant).toBeDefined();
            expect(players).toHaveLength(3);
            expect(playground).toBeDefined();
            expect(playground.code).toBe('TEST-PLAYGROUND');
            expect(joins).toHaveLength(3);

            // Verify players have names
            for (const { playerName } of players) {
                expect((playerName as any).name).toMatch(/Player \d+/);
            }
        });
    });

    describe('Test Data Factories', () => {
        it('should use test data factories to create test data', async () => {
            const user = new User('test-user-key');
            const jinaga = JinagaTestUtils.createBasicTestInstance(user);

            const factories = JinagaTestUtils.createTestDataFactories();

            // Create tenant
            const { tenant, admin } = await factories.createTestTenant(jinaga, user);
            expect(tenant).toBeDefined();
            expect(admin).toBeDefined();

            // Create player
            const { player, playerName } = await factories.createTestPlayer(jinaga, user, tenant);
            expect(player).toBeDefined();
            expect(playerName).toBeDefined();

            // Create playground
            const playground = await factories.createTestPlayground(jinaga, tenant, 'TEST-001');
            expect(playground).toBeDefined();
            expect(playground.code).toBe('TEST-001');

            // Create join
            const join = await factories.createTestJoin(jinaga, player, playground);
            expect(join).toBeDefined();
        });
    });

    describe('Complex Test Scenarios', () => {
        it('should create a complex test scenario with custom setup', async () => {
            const users = [
                new User('admin'),
                new User('player1'),
                new User('player2')
            ];

            const { jinaga, users: userFacts } = await JinagaTestUtils.createComplexTestInstance(
                users,
                async (j, users) => {
                    const admin = users[0];
                    const tenant = await j.fact(new Tenant(admin));

                    // Create playground
                    const playground = await j.fact(new Playground(tenant, 'CUSTOM-PLAYGROUND'));

                    // Add players and join them
                    for (let i = 1; i < users.length; i++) {
                        const player = await j.fact(new Player(users[i], tenant));
                        await j.fact(new Join(player, playground, new Date()));
                    }
                }
            );

            // Verify setup
            const tenants = await jinaga.query(Tenant);
            expect(tenants).toHaveLength(1);

            const playgrounds = await jinaga.query(Playground);
            expect(playgrounds).toHaveLength(1);
            expect(playgrounds[0].code).toBe('CUSTOM-PLAYGROUND');

            const players = await jinaga.query(Player);
            expect(players).toHaveLength(2); // player1 and player2

            const joins = await jinaga.query(Join);
            expect(joins).toHaveLength(2); // both players joined
        });
    });

    describe('Authorization Testing', () => {
        it('should test with authorization rules', async () => {
            // This would require importing the actual authorization rules
            // For now, we'll just test that the method works
            const jinaga = JinagaTestUtils.createTestInstanceWithAuth(
                new User('test-user-key')
            );

            expect(jinaga).toBeDefined();
        });
    });

    describe('Distribution Testing', () => {
        it('should test with distribution rules', async () => {
            // This would require importing the actual distribution rules
            // For now, we'll just test that the method works
            const jinaga = JinagaTestUtils.createTestInstanceWithDistribution(
                new User('test-user-key')
            );

            expect(jinaga).toBeDefined();
        });
    });
}); 