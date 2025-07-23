import { DistributionRules } from 'jinaga';
import { Challenge, Game, Reject, model, Player } from '../model/index.js';

export const challengeDistribution = (r: DistributionRules) =>
    r
        // Share challenges with the challenger and opponent only
        .share(
            model.given(Player).match((player) => Challenge.whereChallenger(player))
        )
        .with(model.given(Player).match((player) => player.predecessor()))

        .share(
            model.given(Player).match((player) => Challenge.whereOpponent(player))
        )
        .with(model.given(Player).match((player) => player.predecessor()))

        // Share games with the challenger and opponent only
        .share(
            model.given(Player).match((player) => Game.whereChallenger(player))
        )
        .with(model.given(Player).match((player) => player.predecessor()))

        .share(
            model.given(Player).match((player) => Game.whereOpponent(player))
        )
        .with(model.given(Player).match((player) => player.predecessor()))

        // Share rejects with the challenger and opponent only
        .share(
            model.given(Player).match((player) => Reject.whereChallenger(player))
        )
        .with(model.given(Player).match((player) => player.predecessor()))

        .share(
            model.given(Player).match((player) => Reject.whereOpponent(player))
        )
        .with(model.given(Player).match((player) => player.predecessor())); 