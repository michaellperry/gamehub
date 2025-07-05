import { LabelOf, ModelBuilder, User } from "jinaga";

export class Tenant {
    static Type = "GameHub.Tenant" as const;
    public type = Tenant.Type;

    constructor(
        public creator: User
    ) { }
}

export class Administrator {
    static Type = "GameHub.Tenant.Administrator" as const;
    public type = Administrator.Type;

    constructor(
        public tenant: Tenant,
        public user: User,
        public createdAt: Date | string
    ) { }

    static of(tenant: LabelOf<Tenant>) {
        return tenant.successors(Administrator, admin => admin.tenant);
    }

    static by(user: LabelOf<User>) {
        return user.successors(Administrator, admin => admin.user);
    }

    static usersOf(tenant: LabelOf<Tenant>) {
        return tenant.successors(Administrator, admin => admin.tenant)
            .selectMany(admin => admin.user.predecessor());
    }
}
  
export class Player {
    static Type = "GameHub.Player" as const;
    public type = Player.Type;

    constructor(
        public tenant: Tenant,
        public createdAt: Date | string
    ) { }

    static in(tenant: LabelOf<Tenant>) {
        return tenant.successors(Player, player => player.tenant);
    }
}

export class PlayerName {
    static Type = "GameHub.Player.Name" as const;
    public type = PlayerName.Type;

    constructor(
        public player: Player,
        public name: string,
        public prior: PlayerName[]
    ) { }

    static current(player: LabelOf<Player>) {
        return player.successors(PlayerName, name => name.player)
            .notExists(name => name.successors(PlayerName, next => next.prior));
    }
}

export class PlayerLogo {
    static Type = "GameHub.Player.Logo" as const;
    public type = PlayerLogo.Type;

    constructor(
        public player: Player,
        public hash: string,
        public prior: PlayerLogo[]
    ) { }

    static current(player: LabelOf<Player>) {
        return player.successors(PlayerLogo, logo => logo.player)
            .notExists(logo => logo.successors(PlayerLogo, next => next.prior));
    }
}

export class GameSession {
    static Type = "GameHub.GameSession" as const;
    public type = GameSession.Type;

    constructor(
        public tenant: Tenant,
        public id: string
    ) { }

    static in(tenant: LabelOf<Tenant>) {
        return tenant.successors(GameSession, session => session.tenant);
    }
}

export class GameSessionDate {
    static Type = "GameHub.GameSession.Date" as const;
    public type = GameSessionDate.Type;

    constructor(
        public session: GameSession,
        public date: Date | string,
        public prior: GameSessionDate[]
    ) { }

    static of(session: LabelOf<GameSession>) {
        return session.successors(GameSessionDate, date => date.session)
            .notExists(date => date.successors(GameSessionDate, next => next.prior));
    }
}

export class GameSessionName {
    static Type = "GameHub.GameSession.Name" as const;
    public type = GameSessionName.Type;

    constructor(
        public session: GameSession,
        public value: string,
        public prior: GameSessionName[]
    ) { }

    static of(session: LabelOf<GameSession>) {
        return session.successors(GameSessionName, name => name.session)
            .notExists(name => name.successors(GameSessionName, next => next.prior));
    }
}

export class ParticipantAccessPath {
    static Type = "GameHub.Participant.AccessPath" as const;
    public type = ParticipantAccessPath.Type;

    constructor(
        public session: GameSession,
        public id: string,
        public createdAt: Date | string
    ) { }

    static for(session: LabelOf<GameSession>) {
        return session.successors(ParticipantAccessPath, accessPath => accessPath.session);
    }

    static in(tenant: LabelOf<Tenant>) {
        return GameSession.in(tenant)
            .selectMany(session => ParticipantAccessPath.for(session));
    }
}

export class Participant {
    static Type = "GameHub.Participant" as const;
    public type = Participant.Type;

    constructor(
        public user: User,
        public tenant: Tenant
    ) { }
}

export class ParticipantInformation {
    static Type = "GameHub.Participant.Information" as const;
    public type = ParticipantInformation.Type;

    constructor(
        public participant: Participant,
        public firstName: string,
        public lastName: string,
        public email: string,
        public prior: ParticipantInformation[]
    ) { }
    
    static current(participant: LabelOf<Participant>) {
        return participant.successors(ParticipantInformation, info => info.participant)
            .notExists(info => info.successors(ParticipantInformation, next => next.prior));
    }
}

export class ParticipantSession {
    static Type = "GameHub.Participant.Session" as const;
    public type = ParticipantSession.Type;

    constructor(
        public participant: Participant,
        public session: GameSession
    ) { }

    static of(session: LabelOf<GameSession>) {
        return session.successors(ParticipantSession, participantSession => participantSession.session);
    }

    static usersOf(session: LabelOf<GameSession>) {
        return session.successors(ParticipantSession, participantSession => participantSession.session)
            .selectMany(participantSession => participantSession.participant.user.predecessor());
    }
}

export class Winner {
    static Type = "GameHub.Winner" as const;
    public type = Winner.Type;

    constructor(
        public player: Player,
        public session: GameSession,
        public index: number,
        public createdAt: Date | string
    ) { }

    static for(session: LabelOf<GameSession>) {
        return session.successors(Winner, winner => winner.session);
    }
}

export const gameHubModel = (b: ModelBuilder) => b
    .type(User)
    .type(Tenant, m => m
        .predecessor("creator", User)
    )
    .type(Administrator, m => m
        .predecessor("tenant", Tenant)
        .predecessor("user", User)
    )
    .type(Player, m => m
        .predecessor("tenant", Tenant)
    )
    .type(PlayerName, m => m
        .predecessor("player", Player)
        .predecessor("prior", PlayerName)
    )
    .type(PlayerLogo, m => m
        .predecessor("player", Player)
        .predecessor("prior", PlayerLogo)
    )
    .type(GameSession, m => m
        .predecessor("tenant", Tenant)
    )
    .type(GameSessionDate, m => m
        .predecessor("session", GameSession)
        .predecessor("prior", GameSessionDate)
    )
    .type(GameSessionName, m => m
        .predecessor("session", GameSession)
        .predecessor("prior", GameSessionName)
    )
    .type(ParticipantAccessPath, m => m
        .predecessor("session", GameSession)
    )
    .type(Participant, m => m
        .predecessor("user", User)
        .predecessor("tenant", Tenant)
    )
    .type(ParticipantInformation, m => m
        .predecessor("participant", Participant)
        .predecessor("prior", ParticipantInformation)
    )
    .type(ParticipantSession, m => m
        .predecessor("participant", Participant)
        .predecessor("session", GameSession)
    )
    .type(Winner, m => m
        .predecessor("player", Player)
        .predecessor("session", GameSession)
    )
    ;