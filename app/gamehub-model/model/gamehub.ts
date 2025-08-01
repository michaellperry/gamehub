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
        return player.successors(Join, (join) => join.player)
            .notExists((join) => join.successors(Leave, (leave) => leave.join));
    }

    static in(playground: LabelOf<Playground>) {
        return playground.successors(Join, (join) => join.playground)
            .notExists((join) => join.successors(Leave, (leave) => leave.join));
    }
}

export class Leave {
    static Type = 'GameHub.Leave' as const;
    public type = Leave.Type;

    constructor(
        public join: Join
    ) { }
}

export class Challenge {
    static Type = 'GameHub.Challenge' as const;
    public type = Challenge.Type;

    constructor(
        public challengerJoin: Join,
        public opponentJoin: Join,
        public challengerStarts: boolean,
        public createdAt: Date | string
    ) { }

    static by(player: LabelOf<Player>) {
        return player.successors(Join, (join) => join.player)
            .selectMany((join) => join.successors(Challenge, (challenge) => challenge.challengerJoin))
            .notExists((challenge) => challenge.successors(Reject, (reject) => reject.challenge))
            .notExists((challenge) => challenge.successors(Game, (game) => game.challenge));
    }

    static for(player: LabelOf<Player>) {
        return Join.by(player)
            .selectMany((join) => join.successors(Challenge, (challenge) => challenge.opponentJoin))
            .notExists((challenge) => challenge.successors(Reject, (reject) => reject.challenge))
            .notExists((challenge) => challenge.successors(Game, (game) => game.challenge));
    }

    static in(playground: LabelOf<Playground>) {
        return playground.successors(Join, (join) => join.playground)
            .selectMany((join) => join.successors(Challenge, (challenge) => challenge.challengerJoin))
            .notExists((challenge) => challenge.successors(Reject, (reject) => reject.challenge))
            .notExists((challenge) => challenge.successors(Game, (game) => game.challenge));
    }
}

export class Game {
    static Type = 'GameHub.Game' as const;
    public type = Game.Type;

    constructor(
        public challenge: Challenge
    ) { }

    static from(challenge: LabelOf<Challenge>) {
        return challenge.successors(Game, (game) => game.challenge)
            .notExists((game) => game.successors(Win, (win) => win.game))
            .notExists((game) => game.successors(Draw, (draw) => draw.game));
    }

    static in(playground: LabelOf<Playground>) {
        return playground.successors(Game, game => game.challenge.challengerJoin.playground)
            .notExists((game) => game.successors(Win, (win) => win.game))
            .notExists((game) => game.successors(Draw, (draw) => draw.game));
    }

    // Helper for distribution rules - games where player is challenger
    static whereChallenger(player: LabelOf<Player>) {
        return Challenge.by(player)
            .selectMany((challenge) => challenge.successors(Game, (game) => game.challenge))
            .notExists((game) => game.successors(Win, (win) => win.game))
            .notExists((game) => game.successors(Draw, (draw) => draw.game));
    }

    // Helper for distribution rules - games where player is opponent
    static whereOpponent(player: LabelOf<Player>) {
        return Challenge.for(player)
            .selectMany((challenge) => challenge.successors(Game, (game) => game.challenge))
            .notExists((game) => game.successors(Win, (win) => win.game))
            .notExists((game) => game.successors(Draw, (draw) => draw.game));
    }
}

export class Move {
    static Type = 'GameHub.Move' as const;
    public type = Move.Type;

    constructor(
        public game: Game,
        public index: number,
        public position: number
    ) { }

    static in(game: LabelOf<Game>) {
        return game.successors(Move, (move) => move.game);
    }
}

export class Reject {
    static Type = 'GameHub.Reject' as const;
    public type = Reject.Type;

    constructor(
        public challenge: Challenge
    ) { }

    static of(challenge: LabelOf<Challenge>) {
        return challenge.successors(Reject, (reject) => reject.challenge);
    }

    // Helper for distribution rules - rejects where player is challenger
    static whereChallenger(player: LabelOf<Player>) {
        return Challenge.by(player)
            .selectMany((challenge) => challenge.successors(Reject, (reject) => reject.challenge));
    }

    // Helper for distribution rules - rejects where player is opponent
    static whereOpponent(player: LabelOf<Player>) {
        return Challenge.for(player)
            .selectMany((challenge) => challenge.successors(Reject, (reject) => reject.challenge));
    }
}

export class Win {
    static Type = 'GameHub.Win' as const;
    public type = Win.Type;

    constructor(
        public game: Game,
        public winner: Player
    ) { }
}

export class Draw {
    static Type = 'GameHub.Draw' as const;
    public type = Draw.Type;

    constructor(
        public game: Game
    ) { }
}

export const gameHubModel = (b: ModelBuilder) =>
    b
        .type(User)
        .type(Tenant, (m) => m.predecessor('creator', User))
        .type(Administrator, (m) => m.predecessor('tenant', Tenant).predecessor('user', User))
        .type(Player, (m) => m.predecessor('user', User).predecessor('tenant', Tenant))
        .type(PlayerName, (m) => m.predecessor('player', Player).predecessor('prior', PlayerName))
        .type(Playground, (m) => m.predecessor('tenant', Tenant))
        .type(Join, (m) => m.predecessor('player', Player).predecessor('playground', Playground))
        .type(Leave, (m) => m.predecessor('join', Join))
        .type(Challenge, (m) => m.predecessor('challengerJoin', Join).predecessor('opponentJoin', Join))
        .type(Game, (m) => m.predecessor('challenge', Challenge))
        .type(Move, (m) => m.predecessor('game', Game))
        .type(Reject, (m) => m.predecessor('challenge', Challenge))
        .type(Win, (m) => m.predecessor('game', Game).predecessor('winner', Player))
        .type(Draw, (m) => m.predecessor('game', Game));
