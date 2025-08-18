import { DistributionRules } from 'jinaga';
import { Challenge, Game, model, Player, PlayerName, Playground, Reject } from '../model/index.js';

export const challengeDistribution = (r: DistributionRules) =>
    r
        // Share challenges with the challenger and opponent only
        .share(
            model.given(Player).match((player) => Challenge.by(player))
        )
        .with(model.given(Player).match((player) => player.user.predecessor()))

        .share(
            model.given(Player).match((player) => Challenge.for(player))
        )
        .with(model.given(Player).match((player) => player.user.predecessor()))

        // Share games with the challenger and opponent only
        .share(
            model.given(Player).match((player) => Game.whereChallenger(player))
        )
        .with(model.given(Player).match((player) => player.user.predecessor()))

        .share(
            model.given(Player).match((player) => Game.whereOpponent(player))
        )
        .with(model.given(Player).match((player) => player.user.predecessor()))

        // The challenger can see the challenges
        .share(
            model.given(Playground).match((playground) => Game.in(playground)
                .selectMany(game => game.challenge.opponentJoin.player.predecessor()
                    .selectMany(opponentPlayer => game.challenge.challengerJoin.player.predecessor()
                        .select(challengerPlayer => ({
                            gameId: game,
                            opponentPlayer,
                            challengerPlayer,
                            opponentNames: PlayerName.current(opponentPlayer),
                            challengerNames: PlayerName.current(challengerPlayer)
                        }))
                    ))
            )
        )
        .with(model.given(Playground).match((playground) =>
            Game.in(playground)
                .selectMany(game => game.challenge.challengerJoin.player.predecessor()
                    .selectMany(player => player.user.predecessor())
                )
        ))

        // The opponent can see the challenges
        .share(
            model.given(Playground).match((playground) => Game.in(playground)
                .selectMany(game => game.challenge.opponentJoin.player.predecessor()
                    .selectMany(opponentPlayer => game.challenge.challengerJoin.player.predecessor()
                        .select(challengerPlayer => ({
                            gameId: game,
                            opponentPlayer,
                            challengerPlayer,
                            opponentNames: PlayerName.current(opponentPlayer),
                            challengerNames: PlayerName.current(challengerPlayer)
                        }))
                    ))
            )
        )
        .with(model.given(Playground).match((playground) =>
            Game.in(playground)
                .selectMany(game => game.challenge.opponentJoin.player.predecessor()
                    .selectMany(player => player.user.predecessor())
                )
        ))

        // Share rejects with the challenger and opponent only
        .share(
            model.given(Player).match((player) => Reject.whereChallenger(player))
        )
        .with(model.given(Player).match((player) => player.user.predecessor()))

        .share(
            model.given(Player).match((player) => Reject.whereOpponent(player))
        )
        .with(model.given(Player).match((player) => player.user.predecessor()));