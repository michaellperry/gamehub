import { DistributionRules, User } from 'jinaga';
import { Player, PlayerName, Tenant, model } from '../model/index.js';

export const playerDistribution = (r: DistributionRules) =>
    r
        // Allow users to see their own player data and names
        .share(
            model.given(User, Tenant).match((user, tenant) =>
                Player.in(tenant)
                    .join(player => player.user, user)
                    .selectMany(player => PlayerName.current(player))
            )
        )
        .with(model.given(User, Tenant).match((user, _tenant) =>
            user
        ));
