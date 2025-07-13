import { DistributionRules } from "jinaga";
import { Administrator, model, ServicePrincipal, Tenant } from "../model/index.js";

export const bookkeepingDistribution = (d: DistributionRules) => d
    // Admins can see the service principals for their tenant.
    .share(model.given(Tenant).match(tenant =>
        ServicePrincipal.of(tenant)
    ))
    .with(model.given(Tenant).match(tenant =>
        Administrator.usersOf(tenant)
    ))
    ;