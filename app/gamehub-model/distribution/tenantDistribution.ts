import { DistributionRules, User } from 'jinaga';
import { Administrator, Challenge, Join, model, Player, PlayerName, Playground, Tenant } from '../model/index.js';

export const tenantDistribution = (r: DistributionRules) =>
    r
        // Share tenant administrators with other administrators
        .share(
            model
                .given(Tenant, User)
                .match((tenant, user) => Administrator.of(tenant).join((admin) => admin.user, user))
        )
        .with(model.given(Tenant, User).match((tenant) => Administrator.usersOf(tenant)))

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
        .with(model.given(Tenant).match((tenant) =>
            Player.in(tenant).selectMany(player => player.user.predecessor())
        ))

        // Share joins with all players in the same playground
        .share(
            model.given(Playground).match((playground) => Join.in(playground))
        )
        .with(model.given(Playground).match((playground) =>
            Join.in(playground).selectMany(join => join.player.predecessor().selectMany(player => player.user.predecessor()))
        ))

        // Share players with all players in the same playground
        .share(
            model.given(Playground).match((playground) =>
                Join.in(playground)
                    .selectMany(join => join.player.predecessor())
            )
        )
        .with(model.given(Playground).match((playground) =>
            Join.in(playground).selectMany(join => join.player.predecessor().selectMany(player => player.user.predecessor()))
        ))

        // Share player names with all players in the same playground
        .share(
            model.given(Playground).match((playground) =>
                Join.in(playground)
                    .selectMany(join => join.player.predecessor())
                    .selectMany(player => PlayerName.current(player))
            )
        )
        .with(model.given(Playground).match((playground) =>
            Join.in(playground).selectMany(join => join.player.predecessor().selectMany(player => player.user.predecessor()))
        ))

        // Share challenges with all players in the same playground
        .share(
            model.given(Playground).match((playground) =>
                Join.in(playground)
                    .selectMany(join => join.player.predecessor())
                    .selectMany(player => Challenge.for(player))
            )
        )
        .with(model.given(Playground).match((playground) =>
            Join.in(playground).selectMany(join => join.player.predecessor().selectMany(player => player.user.predecessor()))
        ))

        // Comprehensive rule for playground player queries - covers the playgroundPlayersSpec pattern
        .share(
            model.given(Playground).match((playground) =>
                Join.in(playground)
                    .selectMany(join => join.player.predecessor()
                        .select(player => ({
                            playerId: player,
                            joinedAt: join.joinedAt,
                            names: PlayerName.current(player).select(name => name.name),
                            join: join,
                            pendingChallengePlayerIds: Challenge.for(player)
                                .selectMany(challenge => challenge.challengerJoin.player.predecessor()
                                    .select(challenger => challenger))
                        }))
                    )
            )
        )
        .with(model.given(Playground).match((playground) =>
            Join.in(playground).selectMany(join => join.player.predecessor().selectMany(player => player.user.predecessor()))
        ));
