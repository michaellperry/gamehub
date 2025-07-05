import { LabelOf, ModelBuilder, User } from "jinaga";
import { ParticipantAccessPath, Tenant } from "./gamehub.js";

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

export class ParticipantAccessPathConfigured {
    static Type = "GameHub.Participant.AccessPath.Configured" as const;
    public type = ParticipantAccessPathConfigured.Type;

    constructor(
        public accessPath: ParticipantAccessPath,
        public configuredAt: Date | string
    ) { }

    static for(accessPath: LabelOf<ParticipantAccessPath>) {
        return accessPath.successors(ParticipantAccessPathConfigured, configured => configured.accessPath);
    }
}

export const bookkeepingModel = (b: ModelBuilder) => b
    .type(ServicePrincipal, x => x
        .predecessor("tenant", Tenant)
        .predecessor("user", User)
    )
    .type(ParticipantAccessPathConfigured, x => x
        .predecessor("accessPath", ParticipantAccessPath)
    )
    ;