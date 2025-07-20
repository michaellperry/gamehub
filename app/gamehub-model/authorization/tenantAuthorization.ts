import { AuthorizationRules } from 'jinaga';
import { Administrator, Join, Leave, Player, Playground, Tenant } from '../model/index.js';

export const tenantAuthorization = (a: AuthorizationRules) =>
    a
        // Only the creator can create a tenant
        .type(Tenant, (tenant) => tenant.creator.predecessor())

        // The creator of a tenant can create administrators for that tenant
        .type(Administrator, (admin) => admin.tenant.creator.predecessor())

        // Administrators can add other administrators to their tenant
        .type(Administrator, (admin) => Administrator.usersOf(admin.tenant))

        // Any player in the tenant can create a playground
        .type(Playground, (playground) =>
            Player.in(playground.tenant)
                .selectMany((player) => player.user.predecessor())
        )

        // Only the player can create their own joins
        .type(Join, (join) => join.player.user.predecessor())

        // Only the player who joined can leave (by creating a Leave fact for their Join)
        .type(Leave, (leave) => leave.join.player.user.predecessor());
