import { LabelOf, ModelBuilder } from "jinaga";
import { ParticipantSession, ParticipantInformation, GameSession } from "./gamehub.js";

export type SessionStateValues = "holding" | "round1_open" | "round1_closed" | "final_open" | "final_closed" | "champion_announced";

export class SessionState {
    static Type = "GameHub.GameSession.State" as const;
    public type = SessionState.Type;

    constructor(
        public session: GameSession,
        public state: SessionStateValues,
        public winners: HeadToHeadWinners[],
        public champions: Champion[],
        public createdAt: Date | string
    ) { }

    static of(session: LabelOf<GameSession>) {
        return session.successors(SessionState, state => state.session);
    }
}

export class GameRound {
    static Type = "GameHub.GameSession.GameRound" as const;
    public type = GameRound.Type;

    constructor(
        public session: GameSession,
        public round: number
    ) { }

    static of(session: LabelOf<GameSession>) {
        return session.successors(GameRound, round => round.session);
    }
}

export class GameAction {
    static Type = "GameHub.Participant.Session.GameAction" as const;
    public type = GameAction.Type;

    constructor(
        public participantSession: ParticipantSession,
        public gameRound: GameRound,
        public allocation: string,
        public createdAt: Date | string
    ) { }

    static of(participantSession: LabelOf<ParticipantSession>) {
        return participantSession.successors(GameAction, action => action.participantSession);
    }

    static inRound(gameRound: LabelOf<GameRound>) {
        return gameRound.successors(GameAction, action => action.gameRound);
    }

    static forSession(session: LabelOf<GameSession>) {
        return session.successors(GameAction, action => action.participantSession.session);
    }
}

/**
 * Records which winners won each of the three head-to-head competitions in round 1.
 * Uses the mutable property pattern with a prior array to allow changes.
 */
export class HeadToHeadWinners {
    static Type = "GameHub.GameSession.HeadToHeadWinners" as const;
    public type = HeadToHeadWinners.Type;

    constructor(
        public session: GameSession,
        /**
         * JSON encoded array of objects with properties:
         * - `index`: the index of the winner in the winners array
         * - `allocation`: the total points allocated to the winner
         */
        public winnerAllocationsJson: string,
        public prior: HeadToHeadWinners[]
    ) { }

    /**
     * Gets the current (most recent) head-to-head winners for a session
     */
    static current(session: LabelOf<GameSession>) {
        return session.successors(HeadToHeadWinners, winners => winners.session)
            .notExists(winners => winners.successors(HeadToHeadWinners, next => next.prior));
    }
}

/**
 * Records the champion of a game session.
 * Uses the mutable property pattern with a prior array to allow changes.
 */
export class Champion {
    static Type = "GameHub.GameSession.Champion" as const;
    public type = Champion.Type;

    constructor(
        public session: GameSession,
        /**
         * JSON encoded array of objects with properties:
         * - `index`: the index of the champion in the winners array
         * - `allocation`: the total points allocated to the champion
         */
        public championAllocationsJson: string,
        public prior: Champion[]
    ) { }

    /**
     * Gets the current (most recent) champion for a session
     */
    static current(session: LabelOf<GameSession>) {
        return session.successors(Champion, champion => champion.session)
            .notExists(champion => champion.successors(Champion, next => next.prior));
    }
}

/**
 * Interface for the participant game action data returned by ParticipantGameActionsForSession
 */
export interface ParticipantGameActionData {
    participantPublicKey: string;
    firstName: string;
    lastName: string;
    email: string;
    allGameActions: {
        round: number;
        allocation: string;
        createdAt: string | Date;
    }[];
}

/**
 * Specification for querying all participant game action data for CSV export.
 * Returns comprehensive data including participant information and game actions for both rounds.
 * Only returns the most recent game action per participant per round.
 *
 * Usage: The consumer should process the allGameActions array to find the most recent
 * allocation per round (by createdAt timestamp), following the pattern used in useSessionActions.
 */
export const ParticipantGameActionsForSession = (session: LabelOf<GameSession>) => {
    return ParticipantSession.of(session)
        .selectMany(participantSession =>
            ParticipantInformation.current(participantSession.participant)
                .selectMany(participantInfo =>
                    participantSession.participant.user.predecessor()
                        .select(user => ({
                            // Participant information
                            participantPublicKey: user.publicKey,
                            firstName: participantInfo.firstName,
                            lastName: participantInfo.lastName,
                            email: participantInfo.email,
                            // All game actions for this participant
                            allGameActions: GameAction.of(participantSession)
                                .selectMany(gameAction =>
                                    gameAction.gameRound.predecessor()
                                        .select(gameRound => ({
                                            round: gameRound.round,
                                            allocation: gameAction.allocation,
                                            createdAt: gameAction.createdAt
                                        }))
                                )
                        }))
                )
        );
};

export const gameplayModel = (b: ModelBuilder) => b
    .type(SessionState, m => m
        .predecessor("session", GameSession)
        .predecessor("winners", HeadToHeadWinners)
        .predecessor("champions", Champion)
    )
    .type(GameRound, m => m
        .predecessor("session", GameSession)
    )
    .type(GameAction, m => m
        .predecessor("participantSession", ParticipantSession)
        .predecessor("gameRound", GameRound)
    )
    .type(HeadToHeadWinners, m => m
        .predecessor("session", GameSession)
        .predecessor("prior", HeadToHeadWinners)
    )
    .type(Champion, m => m
        .predecessor("session", GameSession)
        .predecessor("prior", Champion)
    );