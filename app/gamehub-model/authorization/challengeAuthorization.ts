import { AuthorizationRules } from 'jinaga';
import { Challenge, Game, Reject } from '../model/index.js';

export const challengeAuthorization = (a: AuthorizationRules) =>
    a
        // Only the challenger can create challenges
        .type(Challenge, (challenge) => challenge.challengerJoin.player.user.predecessor())

        // Only the opponent can create games (accept challenges)
        .type(Game, (game) => game.challenge.opponentJoin.player.user.predecessor())

        // Only the opponent can reject challenges
        .type(Reject, (reject) => reject.challenge.opponentJoin.player.user.predecessor()); 