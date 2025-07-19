import { LabelOf, ModelBuilder, User } from "jinaga";
import { Tenant } from "./gamehub.js";

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

export const bookkeepingModel = (b: ModelBuilder) => b
    .type(ServicePrincipal, x => x
        .predecessor("tenant", Tenant)
        .predecessor("user", User)
    )
    ;