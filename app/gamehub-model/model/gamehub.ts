import { LabelOf, ModelBuilder, User } from 'jinaga';

export class Tenant {
    static Type = 'GameHub.Tenant' as const;
    public type = Tenant.Type;

    constructor(public creator: User) { }
}

export class Administrator {
    static Type = 'GameHub.Tenant.Administrator' as const;
    public type = Administrator.Type;

    constructor(
        public tenant: Tenant,
        public user: User,
        public createdAt: Date | string
    ) { }

    static of(tenant: LabelOf<Tenant>) {
        return tenant.successors(Administrator, (admin) => admin.tenant);
    }

    static by(user: LabelOf<User>) {
        return user.successors(Administrator, (admin) => admin.user);
    }

    static usersOf(tenant: LabelOf<Tenant>) {
        return tenant
            .successors(Administrator, (admin) => admin.tenant)
            .selectMany((admin) => admin.user.predecessor());
    }
}

export class Player {
    static Type = 'GameHub.Player' as const;
    public type = Player.Type;

    constructor(
        public user: User,
        public tenant: Tenant
    ) { }

    static in(tenant: LabelOf<Tenant>) {
        return tenant.successors(Player, (player) => player.tenant);
    }
}

export class PlayerName {
    static Type = 'GameHub.Player.Name' as const;
    public type = PlayerName.Type;

    constructor(
        public player: Player,
        public name: string,
        public prior: PlayerName[]
    ) { }

    static current(player: LabelOf<Player>) {
        return player
            .successors(PlayerName, (name) => name.player)
            .notExists((name) => name.successors(PlayerName, (next) => next.prior));
    }
}

export class Playground {
    static Type = 'GameHub.Playground' as const;
    public type = Playground.Type;

    constructor(
        public tenant: Tenant,
        public code: string
    ) { }

    static in(tenant: LabelOf<Tenant>) {
        return tenant.successors(Playground, (playground) => playground.tenant);
    }
}

export class Join {
    static Type = 'GameHub.Join' as const;
    public type = Join.Type;

    constructor(
        public player: Player,
        public playground: Playground,
        public joinedAt: Date | string
    ) { }

    static by(player: LabelOf<Player>) {
        return player.successors(Join, (join) => join.player);
    }

    static in(playground: LabelOf<Playground>) {
        return playground.successors(Join, (join) => join.playground);
    }
}

export const gameHubModel = (b: ModelBuilder) =>
    b
        .type(User)
        .type(Tenant, (m) => m.predecessor('creator', User))
        .type(Administrator, (m) => m.predecessor('tenant', Tenant).predecessor('user', User))
        .type(Player, (m) => m.predecessor('user', User).predecessor('tenant', Tenant))
        .type(PlayerName, (m) => m.predecessor('player', Player).predecessor('prior', PlayerName))
        .type(Playground, (m) => m.predecessor('tenant', Tenant))
        .type(Join, (m) => m.predecessor('player', Player).predecessor('playground', Playground));
