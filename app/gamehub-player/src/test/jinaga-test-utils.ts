import {
    Administrator,
    Join,
    Player,
    PlayerName,
    Playground,
    Tenant
} from '@model/model';
import { Jinaga, JinagaTest, User } from 'jinaga';

/**
 * Jinaga Test Configuration Options
 * 
 * The JinagaTest.create() method accepts a configuration object with the following options:
 * 
 * @param model - The Jinaga model specification (optional)
 * @param authorization - Function to configure authorization rules (optional)
 * @param distribution - Function to configure distribution rules (optional)
 * @param user - Simulated logged-in user fact (optional)
 * @param device - Simulated device fact (optional)
 * @param initialState - Array of facts to pre-initialize the test store (optional)
 * @param purgeConditions - Function to configure purge conditions (optional)
 * @param feedRefreshIntervalSeconds - Feed refresh interval in seconds (optional)
 */

export interface TestTenant {
    tenant: Tenant;
    administrators: Administrator[];
    players: Player[];
    playgrounds: Playground[];
}

export class JinagaTestUtils {
    /**
     * Create a basic Jinaga test instance
     */
    static createBasicTestInstance(user?: User): Jinaga {
        return JinagaTest.create({
            user: user,
        });
    }

    /**
     * Create a Jinaga test instance with authorization rules
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static createTestInstanceWithAuth(user?: User, authRules?: any): any {
        return JinagaTest.create({
            authorization: authRules,
            user: user,
        });
    }

    /**
     * Create a Jinaga test instance with distribution rules
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static createTestInstanceWithDistribution(user?: User, distRules?: any): any {
        return JinagaTest.create({
            distribution: distRules,
            user: user,
        });
    }

    /**
     * Create a test instance with pre-initialized state
     */
    static createTestInstanceWithState(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        initialState: any[],
        user?: User
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ): any {
        return JinagaTest.create({
            user: user,
            initialState,
        });
    }

    /**
     * Create a test instance with a complete tenant setup
     */
    static async createTestInstanceWithTenant(
        tenantOwner: User,
        tenantData?: Partial<TestTenant>
    ): Promise<{ jinaga: Jinaga; tenant: Tenant; owner: User }> {
        const jinaga = JinagaTest.create({
            user: tenantOwner,
        });

        // Create tenant
        const tenant = await jinaga.fact(new Tenant(tenantOwner));

        // Create initial state if provided
        if (tenantData) {
            await this.setupTenantData(jinaga, tenantData);
        }

        return { jinaga, tenant, owner: tenantOwner };
    }

    /**
     * Create a test instance with multiple users and complex state
     */
    static async createComplexTestInstance<T = void>(
        users: User[],
        setupCallback?: (jinaga: Jinaga, users: User[]) => Promise<T>
    ): Promise<{ jinaga: Jinaga; users: User[]; setupData?: T }> {
        const jinaga: Jinaga = JinagaTest.create({
            user: users[0], // First user is the "logged in" user
        });

        let setupData: T | undefined;
        if (setupCallback) {
            setupData = await setupCallback(jinaga, users);
        }

        return { jinaga, users, setupData };
    }

    /**
     * Helper method to setup tenant data
     */
    private static async setupTenantData(
        jinaga: Jinaga,
        tenantData: Partial<TestTenant>
    ): Promise<void> {
        // Create administrators
        if (tenantData.administrators) {
            for (const adminData of tenantData.administrators) {
                await jinaga.fact(adminData);
            }
        }

        // Create players
        if (tenantData.players) {
            for (const playerData of tenantData.players) {
                await jinaga.fact(playerData);
            }
        }

        // Create playgrounds
        if (tenantData.playgrounds) {
            for (const playgroundData of tenantData.playgrounds) {
                await jinaga.fact(playgroundData);
            }
        }
    }

    /**
     * Create test data factories for common scenarios
     */
    static createTestDataFactories() {
        return {
            /**
             * Create a test tenant with basic setup
             */
            createTestTenant: async (jinaga: Jinaga, owner: User) => {
                const tenant = await jinaga.fact(new Tenant(owner));
                const admin = await jinaga.fact(new Administrator(tenant, owner, new Date()));
                return { tenant, admin };
            },

            /**
             * Create a test player
             */
            createTestPlayer: async (jinaga: Jinaga, user: User, tenant: Tenant) => {
                const player = await jinaga.fact(new Player(user, tenant));
                const playerName = await jinaga.fact(new PlayerName(player, `Player ${user.publicKey.slice(0, 8)}`, []));
                return { player, playerName };
            },

            /**
             * Create a test playground
             */
            createTestPlayground: async (jinaga: Jinaga, tenant: Tenant, code: string = 'TEST-001') => {
                return await jinaga.fact(new Playground(tenant, code));
            },

            /**
             * Create a test join
             */
            createTestJoin: async (jinaga: Jinaga, player: Player, playground: Playground) => {
                return await jinaga.fact(new Join(player, playground, new Date()));
            },
        };
    }
}

/**
 * Predefined test scenarios for common use cases
 */
export const TestScenarios = {
    /**
     * Scenario: Single user with a tenant
     */
    singleUserWithTenant: async (user: User) => {
        const { jinaga, tenant, owner } = await JinagaTestUtils.createTestInstanceWithTenant(user);
        return { jinaga, tenant, owner };
    },

    /**
 * Scenario: Multiple users in a tenant
 */
    multipleUsersInTenant: async (users: User[]) => {
        const { jinaga, users: userFacts, setupData: tenant } = await JinagaTestUtils.createComplexTestInstance<Tenant>(users, async (j, users) => {
            const owner = users[0];
            const tenant = await j.fact(new Tenant(owner));

            // Add all users as administrators
            for (const user of users) {
                await j.fact(new Administrator(tenant, user, new Date()));
            }

            // Add all users as players
            for (const user of users) {
                const player = await j.fact(new Player(user, tenant));
                await j.fact(new PlayerName(player, `Player ${user.publicKey.slice(0, 8)}`, []));
            }

            return tenant;
        });

        return { jinaga, users: userFacts, tenant: tenant! };
    },

    /**
     * Scenario: Tenant with active playground and players
     */
    tenantWithActivePlayground: async (owner: User, playerCount: number = 3) => {
        const { jinaga, tenant } = await JinagaTestUtils.createTestInstanceWithTenant(owner);

        // Create players
        const players = [];
        for (let i = 0; i < playerCount; i++) {
            const testUser = new User(`test-user-${i}`);
            const player = await jinaga.fact(new Player(testUser, tenant));
            const playerName = await jinaga.fact(new PlayerName(player, `Player ${i + 1}`, []));
            players.push({ player, playerName, user: testUser });
        }

        // Create playground
        const playground = await jinaga.fact(new Playground(tenant, 'TEST-PLAYGROUND'));

        // Join players to playground
        const joins = [];
        for (const { player } of players) {
            const join = await jinaga.fact(new Join(player, playground, new Date()));
            joins.push(join);
        }

        return { jinaga, tenant, owner, players, playground, joins };
    },
};

/**
 * Example usage patterns:
 * 
 * // Basic test instance
 * const jinaga = JinagaTestUtils.createBasicTestInstance({
 *     type: 'Test.User',
 *     publicKey: 'test-user-key'
 * });
 * 
 * // Test instance with authorization rules
 * const jinaga = JinagaTestUtils.createTestInstanceWithAuth({
 *     type: 'Test.User', 
 *     publicKey: 'test-user-key'
 * }, authorizationRules);
 * 
 * // Test instance with pre-initialized state
 * const jinaga = JinagaTestUtils.createTestInstanceWithState([
 *     new Tenant(user),
 *     new Player(user, tenant)
 * ], { type: 'Test.User', publicKey: 'test-user-key' });
 * 
 * // Complex scenario
 * const { jinaga, tenant, owner, players, playground } = 
 *     await TestScenarios.tenantWithActivePlayground({
 *         type: 'Test.User',
 *         publicKey: 'test-owner-key'
 *     }, 5);
 */ 