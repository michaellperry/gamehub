import { Game, Join, model, PlayerName } from '@model/model';
import { PlaygroundGame } from './usePlaygroundPage';
import { useSpecification } from 'jinaga-react';
import { j } from '@/jinaga-config';

export interface ActiveGamesViewModel {
    games: PlaygroundGame[];
    gameCount: number;
    hasGames: boolean;
}

const gamesSpec = model.given(Join).match((join) => Game.in(join.playground)
    .selectMany(game => game.challenge.opponentJoin.player.predecessor()
        .selectMany(opponentPlayer => game.challenge.challengerJoin.player.predecessor()
            .select(challengerPlayer => ({
                gameId: j.hash(game),
                game,
                opponentPlayerId: j.hash(opponentPlayer),
                opponentNames: PlayerName.current(opponentPlayer).select(name => name.name),
                challengerPlayerId: j.hash(challengerPlayer),
                challengerNames: PlayerName.current(challengerPlayer).select(name => name.name),
            }))
        ))
);

export function useActiveGames(currentPlayerJoin: Join | null): ActiveGamesViewModel | null {
    const { data: gameProjections } = useSpecification(j, gamesSpec, currentPlayerJoin);

    const games = gameProjections?.map<PlaygroundGame>(projection => ({
        id: projection.gameId,
        playerX: projection.game.challenge.challengerStarts ? projection.opponentNames[0] : projection.challengerNames[0],
        playerO: projection.game.challenge.challengerStarts ? projection.challengerNames[0] : projection.opponentNames[0],
    }));

    return games ? {
        games,
        gameCount: games.length,
        hasGames: games.length > 0,
    } : null;
} 