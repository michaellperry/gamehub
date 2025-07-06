import { LabelOf, ModelBuilder, User } from "jinaga";
import { GameAccessPath, Tenant } from "./gamehub.js";

export class ServicePrincipal {
    static Type = "GameHub.ServicePrincipal" as const;
    public type = ServicePrincipal.Type;

    constructor(
        public user: User,
        public tenant: Tenant,
        public createdAt: Date | string
    ) { }

    static of(tenant: LabelOf<Tenant>) {
        return tenant.successors(ServicePrincipal, servicePrincipal => servicePrincipal.tenant);
    }

    static usersOf(tenant: LabelOf<Tenant>) {
        return ServicePrincipal.of(tenant)
            .selectMany(servicePrincipal => servicePrincipal.user.predecessor());
    }
}

export class GameAccessPathConfigured {
    static Type = "GameHub.GameAccessPath.Configured" as const;
    public type = GameAccessPathConfigured.Type;

    constructor(
        public accessPath: GameAccessPath,
        public configuredAt: Date | string
    ) { }

    static for(accessPath: LabelOf<GameAccessPath>) {
        return accessPath.successors(GameAccessPathConfigured, configured => configured.accessPath);
    }
}

export const bookkeepingModel = (b: ModelBuilder) => b
    .type(ServicePrincipal, x => x
        .predecessor("tenant", Tenant)
        .predecessor("user", User)
    )
    .type(GameAccessPathConfigured, x => x
        .predecessor("accessPath", GameAccessPath)
    )
    ;