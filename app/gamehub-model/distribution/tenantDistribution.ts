import { DistributionRules, User } from 'jinaga';
import { Administrator, Join, model, Playground, Tenant } from '../model/index.js';

export const tenantDistribution = (r: DistributionRules) =>
    r
        // Share tenant administrators with other administrators
        .share(
            model
                .given(Tenant, User)
                .match((tenant, user) => Administrator.of(tenant).join((admin) => admin.user, user))
        )
        .with(model.given(Tenant, User).match((tenant, user) => Administrator.usersOf(tenant)))

        // Share tenants of administrator with the user
        .share(
            model.given(User).match((user) =>
                Administrator.by(user)
                    .selectMany((admin) => admin.tenant.predecessor())
                    .selectMany((tenant) => tenant.creator.predecessor())
            )
        )
        .with(model.given(User).match((user) => user.predecessor()))

        // Share playgrounds with all players in the same tenant
        .share(
            model.given(Tenant).match((tenant) => Playground.in(tenant))
        )
        .with(model.given(Tenant).match((tenant) => tenant.predecessor()))

        // Share joins with all players in the same playground
        .share(
            model.given(Playground).match((playground) => Join.in(playground))
        )
        .with(model.given(Playground).match((playground) => playground.predecessor()));
